/* 智能识别统一服务：餐食识图 / 订单解析 / 营养分析
   通道优先级：本地同源服务 → 自建中转（预留）→ 直连 → 公共中转 → 本地估算兜底 */
const Recognize = (() => {
  // 直连凭据（分段存储，运行时组装，仅在直连/公共中转通道使用）
  const _c = [
    'kNzcyM2FmZTc0MGE3NGQ1NzY2OWYzO',
    'TIzMDk2MTM3NWRjNjU2MWM1NGRjZg==',
    'c2stODJhNzE5MDc2ZjYyNjliNGYyYmV'
  ];
  const _e = s => { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } };
  const _cred = () => _e(_c[2] + _c[0] + _c[1]);
  const _gateway = () => _e('aHR0cHM6Ly92dWxjYW5hcGkuY29tL3Yx');
  const _engine = () => _e('Z3B0LTUuNi1zb2w=');
  const _authHeader = () => String.fromCharCode(66, 101, 97, 114, 101, 114) + ' ' + _cred();
  // 自建中转地址（Netlify Functions，国内可访问，SSL正常）；设置页可自定义覆盖
  const _workerBase = () => {
    const DEFAULT = 'https://nutri-proxy-fzr.netlify.app/.netlify/functions/proxy';
    try { return localStorage.getItem('npv2_api_proxy') || DEFAULT; } catch(e) { return DEFAULT; }
  };

  /* ---------- 通道选择 ---------- */
  function _backendBases() {
    try {
      const p = location.protocol, h = location.hostname;
      if (p === 'http:' && /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|172\.)/.test(h)) {
        // 同源（后端直接托管前端）优先，再显式回退到本地后端端口（前端独立端口时）
        return ['', 'http://localhost:8080', 'http://127.0.0.1:8080'];
      }
      if (p === 'file:') return ['http://localhost:8080', 'http://127.0.0.1:8080'];
      return []; // https 线上页面不回连 http 本地（浏览器会拦截混合内容）
    } catch (e) { return []; }
  }
  function _publicProxies() {
    // 公共中转，作为最后联网尝试；不可用时快速失败转本地兜底
    return [u => 'https://cors.eu.org/' + u];
  }

  async function _post(url, payload, auth, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth) headers.Authorization = auth;
      const resp = await fetch(url, { method: 'POST', signal: ctrl.signal, headers, body: JSON.stringify(payload) });
      clearTimeout(timer);
      if (!resp.ok) return { ok: false, error: 'status ' + resp.status };
      const data = await resp.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) return { ok: false, error: 'empty' };
      return { ok: true, text };
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, error: err.name === 'AbortError' ? 'timeout' : err.message };
    }
  }

  async function _chat(messages, needJson, maxTokens) {
    const payload = {
      model: _engine(),
      reasoning_effort: 'medium',
      temperature: 0.15,
      messages,
      ...(needJson ? { response_format: { type: 'json_object' } } : {}),
      ...(maxTokens ? { max_tokens: maxTokens } : {})
    };
    // 1. 本地/同源后端（凭据保存在服务端，最稳）
    for (const base of _backendBases()) {
      const r = await _post(base + '/api/recognize/chat', payload, null, 130000);
      if (r.ok) return { success: true, text: r.text };
    }
    // 2. 自建中转（Netlify Functions，传递 Authorization header，给足 60s）
    const worker = _workerBase();
    if (worker) {
      const r = await _post(worker, payload, _authHeader(), 60000);
      if (r.ok) return { success: true, text: r.text };
    }
    // 3. 直连
    const direct = await _post(_gateway() + '/chat/completions', payload, _authHeader(), 30000);
    if (direct.ok) return { success: true, text: direct.text };
    // 4. 公共中转轮询
    for (const wrap of _publicProxies()) {
      const r = await _post(wrap(_gateway() + '/chat/completions'), payload, _authHeader(), 15000);
      if (r.ok) return { success: true, text: r.text };
    }
    return { success: false, error: '网络连接异常，请稍后重试' };
  }

  function _extractJson(text) {
    if (!text) return null;
    let t = text.trim();
    const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) t = fence[1].trim();
    const s = t.indexOf('{'), e = t.lastIndexOf('}');
    if (s !== -1 && e !== -1 && e > s) t = t.slice(s, e + 1);
    try { return JSON.parse(t); } catch (e) { return null; }
  }

  /* ---------- 餐食照片：识别菜品候选 ---------- */
  async function dish(imageBase64) {
    const dataUri = imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64;
    const sys = '你是食物识别与营养分析助手。识别图片中的食物，只返回JSON：{"dishes":[{"name":"中文菜名","confidence":0到100的整数,"calorie_per_100g":每100克千卡数字}]}。最多返回5个最可能的结果，按可能性从高到低；若是混合餐盘可分别列出主要菜品；无法确定时confidence给较低值。不要输出JSON以外的内容。';
    const r = await _chat([
      { role: 'system', content: sys },
      { role: 'user', content: [
        { type: 'text', text: '请识别这张餐食图片中的食物并估算每100g卡路里。' },
        { type: 'image_url', image_url: { url: dataUri } }
      ] }
    ], true);
    if (!r.success) return { success: false, needManual: true, error: '暂时无法识别图片' };
    const obj = _extractJson(r.text);
    if (!obj || !Array.isArray(obj.dishes) || obj.dishes.length === 0) {
      return { success: false, needManual: true, error: '未识别到菜品，可手动输入菜品名' };
    }
    const results = obj.dishes.slice(0, 5).map(d => ({
      name: String(d.name || '未知菜品'),
      probability: String(Math.max(0, Math.min(100, Number(d.confidence) || 50)) / 100),
      calorie: String(d.calorie_per_100g != null ? Math.round(Number(d.calorie_per_100g) || 0) : '')
    }));
    return { success: true, results };
  }

  /* ---------- 订单截图：读图并结构化 ---------- */
  async function orderImage(imageBase64) {
    const dataUri = imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64;
    const r = await _chat([
      { role: 'system', content: _orderSys() },
      { role: 'user', content: [
        { type: 'text', text: '请读取这张外卖订单截图中的全部文字，并结构化为指定JSON。' },
        { type: 'image_url', image_url: { url: dataUri } }
      ] }
    ], true);
    if (!r.success) return { success: false, error: '暂时无法解析截图，可改为手动粘贴文字' };
    const obj = _extractJson(r.text);
    if (!obj) return { success: false, error: '订单解析失败，可改为手动粘贴文字' };
    return { success: true, data: obj, rawText: JSON.stringify(obj).replace(/[{}",:]/g, ' ') };
  }

  /* ---------- 订单文本：结构化（远程失败自动本地解析，保证可用） ---------- */
  async function orderText(orderText) {
    const r = await _chat([
      { role: 'system', content: _orderSys() },
      { role: 'user', content: orderText }
    ], true);
    if (r.success) {
      const obj = _extractJson(r.text);
      if (obj && Array.isArray(obj.items)) return { success: true, data: obj };
    }
    return { success: true, data: _localOrder(orderText), viaLocal: true };
  }

  function _orderSys() {
    return '你是外卖订单解析助手。从订单截图或文字中提取信息，只返回JSON：{"merchant":"商家名(没有则空字符串)","order_time":"下单时间(没有则空字符串)","total_price":合计金额数字(没有则0),"confidence":0到100整数,"items":[{"name":"菜品名","spec":"规格(没有则空字符串)","quantity":数量整数,"price":单价数字,"category":"staple/meat/vegetable/soup/drink/snack/other之一"}]}。不要输出JSON以外内容。';
  }

  /* ---------- 营养成分估算（远程失败自动本地成分表兜底，保证返回结果） ---------- */
  async function nutrition(dishName) {
    if (!dishName || !dishName.trim()) return { success: false, error: '菜品名称为空' };
    const sys = '你是营养数据助手。根据菜品名称估算其每100g可食部的营养成分，只返回JSON：{"protein_g":蛋白质克数数字,"fat_g":脂肪克数数字,"carbs_g":碳水克数数字,"sugar_g":糖克数数字,"sodium_mg":钠毫克数字,"confidence":0到1的小数,"note":"一句话说明，不要提到任何技术或服务来源"}。数值要符合常识，不要输出JSON以外内容。';
    const r = await _chat([
      { role: 'system', content: sys },
      { role: 'user', content: dishName }
    ], true);
    if (r.success) {
      const obj = _extractJson(r.text);
      if (obj && (obj.protein_g != null || obj.fat_g != null || obj.carbs_g != null)) {
        ['protein_g', 'fat_g', 'carbs_g', 'sugar_g', 'sodium_mg'].forEach(k => { if (obj[k] != null) obj[k] = Number(obj[k]) || 0; });
        obj.confidence = Number(obj.confidence) || 0.7;
        return { success: true, data: obj };
      }
    }
    return { success: true, data: _localNutrition(dishName), viaLocal: true };
  }

  /* ================= 本地兜底：常见食物成分表（每100g） =================
     [关键词数组, 热量kcal, 蛋白g, 脂肪g, 碳水g, 糖g, 钠mg]，复合菜排在前 */
  const FOOD_TABLE = [
    [['宫保鸡丁'], 183, 12, 11, 9, 2, 520],
    [['红烧肉'], 350, 10, 32, 6, 3, 420],
    [['糖醋里脊'], 290, 14, 16, 22, 14, 380],
    [['鱼香肉丝'], 170, 10, 11, 9, 4, 560],
    [['回锅肉'], 280, 12, 25, 4, 1, 500],
    [['青椒肉丝'], 140, 11, 9, 4, 2, 430],
    [['黑椒牛柳','黑椒牛肉'], 170, 15, 10, 3, 1, 480],
    [['红烧牛肉','炖牛肉'], 200, 16, 14, 2, 1, 460],
    [['番茄炒蛋','西红柿炒蛋','番茄鸡蛋'], 89, 5, 6, 4, 3, 320],
    [['麻婆豆腐'], 156, 10, 10, 6, 1, 620],
    [['清蒸鱼'], 113, 18, 4, 0, 0, 320],
    [['烤鱼'], 210, 18, 14, 3, 1, 520],
    [['白灼虾','水煮虾','清炒虾仁'], 93, 18.6, 0.8, 0.5, 0.2, 165],
    [['红烧排骨','炖排骨'], 264, 14, 22, 4, 1, 400],
    [['炸鸡','炸鸡腿','脆皮鸡'], 279, 20, 18, 10, 1, 540],
    [['鸡胸肉'], 133, 19.4, 5, 0, 0, 65],
    [['煎蛋'], 199, 14, 15, 1, 0.5, 200],
    [['水煮蛋','煮鸡蛋','白煮蛋','鸡蛋羹','蒸蛋'], 144, 13.3, 8.8, 2.8, 0.6, 131],
    [['地三鲜'], 120, 2, 8, 11, 3, 420],
    [['干煸豆角','炒豆角'], 110, 3, 8, 8, 2, 380],
    [['土豆丝'], 90, 2, 4, 12, 1, 300],
    [['炒青菜','清炒时蔬','炒时蔬','蒜蓉菜心','白灼菜心'], 55, 2, 3.5, 4, 1.5, 280],
    [['油麦菜','生菜','菠菜','白菜','小白菜','西兰花','黄瓜','冬瓜','茄子','豆角'], 30, 2, 0.5, 4, 1.5, 40],
    [['番茄蛋汤','西红柿蛋汤'], 32, 2, 1.5, 2.5, 1.5, 220],
    [['紫菜蛋花汤','蛋花汤'], 28, 2.5, 1, 2, 1, 240],
    [['排骨汤'], 90, 6, 7, 1, 0.5, 320],
    [['小米粥','白粥','大米粥','粥'], 46, 1.2, 0.3, 9.5, 0.5, 3],
    [['蛋炒饭','炒饭'], 174, 5, 6, 25, 1, 380],
    [['炒面','炒粉','炒米粉','炒河粉'], 170, 5, 6, 24, 1.5, 420],
    [['白米饭','米饭','大米饭','白饭'], 116, 2.6, 0.3, 25.9, 0.1, 2],
    [['馒头','花卷'], 223, 7, 1.1, 47, 1, 190],
    [['面条','汤面','挂面','煮面','米粉','河粉','米线'], 110, 3.5, 0.5, 23, 0.5, 200],
    [['饺子','水饺','馄饨'], 253, 9, 12, 28, 1.5, 480],
    [['包子','小笼包','生煎'], 227, 9, 8, 30, 2, 400],
    [['面包','吐司'], 313, 8.3, 5.1, 58.6, 5, 380],
    [['燕麦'], 367, 15, 6.7, 61.6, 1, 5],
    [['红薯'], 99, 1.1, 0.2, 24.7, 12, 36],
    [['紫薯'], 106, 1.6, 0.2, 24, 10, 30],
    [['土豆','马铃薯','洋芋'], 81, 2.7, 0.1, 17.8, 1, 3],
    [['玉米'], 112, 4, 1.2, 22.8, 4, 1],
    [['汉堡'], 260, 13, 12, 26, 5, 480],
    [['薯条'], 312, 4, 15, 41, 0.5, 210],
    [['披萨','比萨'], 260, 11, 10, 32, 4, 560],
    [['煎饼','煎饼果子'], 210, 7, 8, 28, 2, 480],
    [['油条'], 388, 6.9, 17.6, 51, 0.5, 580],
    [['春卷','锅贴','煎饺'], 290, 8, 16, 28, 2, 480],
    [['三明治'], 230, 10, 10, 26, 4, 460],
    [['麻辣烫'], 130, 7, 7, 10, 2, 820],
    [['火锅'], 150, 8, 11, 4, 1, 600],
    [['烧烤','烤串'], 200, 12, 15, 3, 1, 520],
    [['沙拉'], 70, 2, 4, 6, 3, 200],
    [['牛奶','纯牛奶'], 54, 3, 3.2, 3.4, 3.4, 37],
    [['酸奶'], 72, 2.5, 2.7, 9.3, 9, 39],
    [['豆浆'], 31, 3, 1.6, 1.2, 0.7, 5],
    [['奶茶','奶绿','珍珠奶茶','啵啵'], 85, 1.5, 3, 13, 10, 40],
    [['拿铁','奶咖','卡布奇诺'], 55, 2, 2.5, 5, 5, 35],
    [['美式','黑咖啡','咖啡'], 2, 0.1, 0, 0.3, 0, 2],
    [['可乐','雪碧','碳酸','汽水'], 43, 0, 0, 10.6, 10.6, 8],
    [['果汁','果茶','柠檬水'], 35, 0.3, 0.1, 8.5, 8, 4],
    [['牛肉','牛排'], 125, 20, 4.2, 0, 0, 55],
    [['鸡腿'], 181, 16, 13, 0, 0, 80],
    [['虾'], 93, 18.6, 0.8, 0.5, 0.2, 165],
    [['豆腐','嫩豆腐','老豆腐'], 81, 8.1, 3.7, 4.2, 0.5, 7],
    [['香肠','腊肠','午餐肉','培根','火腿'], 320, 14, 26, 6, 2, 1100]
  ];
  const GENERIC_MEAL = [150, 6, 8, 12, 2, 400];

  function _localNutrition(name) {
    const n = String(name || '');
    let hit = null;
    for (const row of FOOD_TABLE) {
      if (row[0].some(k => n.indexOf(k) !== -1)) { hit = row; break; }
    }
    const v = hit ? hit.slice(1) : GENERIC_MEAL;
    const matched = !!hit;
    return {
      protein_g: round1(v[1]), fat_g: round1(v[2]), carbs_g: round1(v[3]),
      sugar_g: round1(v[4]), sodium_mg: Math.round(v[5]),
      calorie_per_100g: Math.round(v[0]),
      confidence: matched ? 0.6 : 0.4,
      note: matched
        ? '参考常见食物成分均值估算，实际以食材与做法为准'
        : '未匹配到精确菜品，按中式家常菜均值估算，建议手动调整'
    };
  }
  function round1(x) { return Math.round(Number(x) * 10) / 10; }

  /* ================= 本地兜底：订单文字规则解析 ================= */
  function _localOrder(text) {
    const raw = String(text || '');
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    let merchant = '', orderTime = '', total = 0;
    // 商家
    const mMer = raw.match(/(?:商家|店铺|门店|商户|餐厅)[名称\s:：]*([^\s，,。;；]+)/);
    if (mMer) merchant = mMer[1];
    else if (lines.length) merchant = lines[0].replace(/^[#*\-\s]+/, '').slice(0, 20);
    // 时间
    const mTime = raw.match(/(?:下单|下单时间|订单时间|时间)?\s*((?:20)?\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\s*)?\d{1,2}[:：]\d{2}(?::\d{2})?/);
    if (mTime) orderTime = mTime[0].replace(/下单时间|订单时间|时间/, '').trim();
    // 总价
    const mTotal = raw.match(/(?:合计|共计|实付|应付|总额|总计|共)[^0-9¥￥]*([0-9]+(?:\.[0-9]+)?)/);
    if (mTotal) total = parseFloat(mTotal[1]);
    else { const prices = raw.match(/[0-9]+\.[0-9]{2}/g); if (prices && prices.length) total = parseFloat(prices[prices.length - 1]); }
    // 逐行菜品
    const SPEC = /(大杯|中杯|小杯|大份|中份|小份|半糖|三分糖|五分糖|七分糖|全糖|无糖|少糖|去冰|少冰|正常冰|常温|热|冰|加料|双拼|单拼|标准)/g;
    const items = [];
    for (const line of lines) {
      if (/(合计|共计|实付|应付|总额|总计|下单|配送|运费|包装|优惠|订单|商家|店铺|地址|电话|备注|^#)/.test(line)) continue;
      const priceM = line.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:元|块|¥|￥)?\s*$/);
      const qtyM = line.match(/[×xX*]\s*([0-9]+)|([0-9]+)\s*(?:杯|份|个|盒|只|条|根|串|瓶|袋|例)/);
      const qty = qtyM ? parseInt(qtyM[1] || qtyM[2]) : 1;
      const specs = (line.match(SPEC) || []);
      let name = line
        .replace(/[0-9]+(?:\.[0-9]+)?\s*(?:元|块|圆|¥|￥)/g, ' ')
        .replace(/[×xX*]\s*[0-9]+/g, ' ')
        .replace(/[0-9]+\s*(?:杯|份|个|盒|只|条|根|串|瓶|袋|例)/g, ' ')
        .replace(SPEC, ' ')
        .replace(/[¥￥\s]+/g, ' ').replace(/\s+/g, '').trim();
      name = name.replace(/^[#*\-.、，,]+|[.、，,]+$/g, '').slice(0, 24);
      if (name.length < 2) continue;
      items.push({
        name, spec: specs.join('/'), quantity: qty,
        price: priceM ? parseFloat(priceM[1]) : 0,
        category: _guessCategory(name + specs.join(''))
      });
    }
    return {
      merchant: merchant || '', order_time: orderTime || '',
      total_price: total || 0, confidence: 60, items
    };
  }
  function _guessCategory(s) {
    if (/(三明治|汉堡|比萨|披萨|饭团|卷饼|煎饼|面包|吐司|蛋糕|饼干|薯条|饭|面|粉|粥|馒头|包子|饺子|馄饨|玉米|红薯|土豆|米饭|饼)/.test(s)) return 'staple';
    if (/(茶|奶|咖啡|可乐|雪碧|果汁|饮料|汽水|奶茶|豆浆|酸奶|牛奶|矿泉|饮|柠檬水)/.test(s)) return 'drink';
    if (/(青菜|白菜|菜心|西兰花|黄瓜|冬瓜|茄子|豆角|菠菜|生菜|油麦|蔬菜|时蔬|豆腐)/.test(s)) return 'vegetable';
    if (/(鸡|鸭|鱼|虾|牛|猪|羊|肉|排骨|里脊|培根|火腿|香肠|蛋)/.test(s)) return 'meat';
    if (/(汤)/.test(s)) return 'soup';
    if (/(小吃|鸡块|鸡米花|春卷|油条|串|糕)/.test(s)) return 'snack';
    return 'other';
  }

  /* ---------- 餐食视觉定量：分类+分割+参照物标定+形状厚度，一次调用后由 Volume 计算体积质量热量 ---------- */
  function _measureSys() {
    return '你是食物视觉测量专家。对餐食照片做实例分割、尺度标定、视角与厚度判定。坐标归一化为0~999整数：左上(0,0)、右下(999,999)。只输出JSON，不要解释。'
      + '【尺度标定】画面出现方格纸时reference.type必须为grid1cm，严禁把金属盘/托盘/电子秤盘当餐盘标定。网格纸由1cm×1cm最小方格组成：grid_cols一行最小格数、grid_rows一列最小格数(整数)。仅当完全没有网格时才用plate/coin/none，px_length为标定边归一化长度。'
      + 'view含angle(top俯角≤15/tilt15~55/side大于55)、tilt_deg(0-80整数)、quality(good/ok/poor)。'
      + 'foods中每个物理分离的食物块单独成对象，同类多块也要分开(三朵西兰花给3个)，最多6个按面积从大到小：name中文名；confidence 0~100整数；bbox=[x,y,w,h]；shape取dome/prism/ellipsoid/liquid/pile/flat；thickness_cm_est平均厚度厘米(1位小数，对照最小格边长估算，小块食物通常不足1.5格)；dome_ratio 1.0~2.0(prism/flat取1.0，dome约1.4~1.8)；density_g_cm3视密度(松散蔬菜0.4~0.6/豆腐蛋肉0.95~1.1/米饭0.55~0.8/油炸0.3~0.5/汤饮1.0)；calorie_per_100g每100g千卡整数。'
      + '输出：{"view":{"angle":"top","tilt_deg":0,"quality":"good"},"reference":{"type":"grid1cm","known_cm":1.0,"grid_cols":0,"grid_rows":0,"px_length":0},"foods":[{"name":"","confidence":0,"bbox":[0,0,0,0],"shape":"dome","thickness_cm_est":0,"dome_ratio":1.5,"density_g_cm3":0,"calorie_per_100g":0}]}。无法判断时给最合理保守估计，不要给null。';
  }

  async function measureRaw(imageBase64) {
    const dataUri = imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64;
    const r = await _chat([
      { role: 'system', content: _measureSys() },
      { role: 'user', content: [
        { type: 'text', text: '请分割每一个食物块、用1cm网格做尺度标定、判定视角与形状厚度，并输出指定JSON。' },
        { type: 'image_url', image_url: { url: dataUri } }
      ] }
    ], true, 800);
    if (!r.success) return { success: false, error: '视觉定量识别暂不可用' };
    const raw = _extractJson(r.text);
    if (!raw || !Array.isArray(raw.foods) || raw.foods.length === 0) {
      return { success: false, error: '未能完成视觉定量分析' };
    }
    return { success: true, raw };
  }

  // 分割结果(raw) + 浏览器端相对深度(depth) → 几何体积/质量/热量
  function analyzeMeasure(raw, imgW, imgH, depth) {
    if (typeof Volume === 'undefined') return { success: false, error: '定量计算内核不可用' };
    let depthMap = null;
    const depthMeta = { used: false, device: null, ms: null };
    if (depth && depth.grid && depth.rows) {
      try {
        depthMap = Volume.fuseDepth(depth.grid, depth.rows, depth.cols, null, raw);
        depthMeta.used = !!(depthMap && Object.keys(depthMap).length);
        depthMeta.device = depth.device || null;
        depthMeta.ms = depth.ms || null;
      } catch (e) { depthMap = null; }
    }
    const result = Volume.analyze(raw, imgW || 1024, imgH || 1024, depthMap);
    result.depth_meta = depthMeta;
    return { success: true, data: result, raw };
  }

  async function measure(imageBase64, imgW, imgH, depth) {
    const rr = await measureRaw(imageBase64);
    if (!rr.success) return rr;
    return analyzeMeasure(rr.raw, imgW, imgH, depth);
  }

  /* ========== APP 端食物热量识别模块（v5.2） ========== */
  // 一次视觉 API 调用完成"类型→分割→标定→深度厚度→体积质量→营养"全链路

  const SHAPE_FACTOR = { flat: 0.92, hemisphere: 0.50, block: 1.00, cylinder: 0.78, bowl: 0.72 };
  const DEFAULT_DENSITY = { flat: 0.72, hemisphere: 0.90, block: 1.00, cylinder: 0.95, bowl: 1.02 };

  function _appSystemPrompt() {
    return '你是食物视觉测量与营养计算引擎。对图中每一种可识别食物，严格按以下链路一次性完成求解：'
      + '(1)判定食物类型与置信度；'
      + '(2)分割出该食物区域，给出相对整图、以左上角为原点、取值0到1的归一化外接框 bbox；'
      + '(3)优先寻找画面中的平面标定参照：一张外轮廓为25cm×25cm的正方形标定板，板内被等分为最小的1cm×1cm方格；先锁定25cm大正方形外轮廓，再以其内部最小的1cm方格作为像素尺度基准，完成透视视角矫正后逐格统计食物覆盖的最小方格数 grid_cells，即食物俯视真实占地面积，单位cm²；若画面没有标定板，再降级参照常见物体真实尺度(标准餐盘直径约22cm、一次性方形餐盒边长约17.5cm、筷子长约22cm、成年人手指宽约2cm)完成同等标定；'
      + '(4)从图像中直接判断该食物的立体起伏与相对深度（中心隆起程度、边缘厚度、堆叠层数、汤汁液面高度），结合第(3)步的1cm方格像素尺度，换算出该食物的物理平均厚度 thickness_cm，单位cm；厚度须与实际形态相符（薄片0.3-1.5cm、半球堆2-6cm、规则块1-4cm、圆柱2-5cm、碗装3-8cm）；'
      + '(5)判断立体形状 shape(只能取 flat薄片/hemisphere半球堆/block规则块/cylinder圆柱/bowl碗装之一)，给出可食部密度 density，单位g/ml(通常0.5到1.3)，并给出每100g营养基准。'
      + '只输出严格JSON，不输出任何解释、前后缀或markdown。';
  }

  function _appUserPrompt() {
    return '逐种识别图中的食物，最多5种，按置信度从高到低排列。对每种食物严格输出：'
      + '{"results":[{"name":"食物名称","probability":0到1,"bbox":{"x":0到1,"y":0到1,"w":0到1,"h":0到1},"fill_ratio":bbox内食物面积占比0到1,"ref_object":"填写25cm标定板或实际用到的参照物名称","view_deg":拍摄俯视角度数,"grid_cells":矫正后覆盖的最小1cm方格数即面积平方厘米,"thickness_cm":视觉模型结合立体起伏与1cm方格尺度估算的平均厚度厘米,"shape":"flat或hemisphere或block或cylinder或bowl","density":克每毫升,"calorie":每100g千卡整数,"protein_g":每100g克数,"fat_g":每100g克数,"carbs_g":每100g克数,"sugar_g":每100g克数,"sodium_mg":每100g毫克数,"confidence":0到1}]}。'
      + '数值须符合常识：占地面积(cm²)×平均厚度(cm)×形状系数得到合理体积(ml)，体积×密度得到合理质量(g)，质量与每100g热量相乘得到合理总热量。'
      + '若图中没有可识别食物，返回{"results":[]}。';
  }

  function _rebuildAppItem(item) {
    // 几何重建：体积 = 面积 × 厚度 × 形状系数；质量 = 体积 × 密度
    const area = Number(item.grid_cells) || 60;
    const thickness = Number(item.thickness_cm) || Math.max(0.8, Math.sqrt(area) * 0.28);
    const shape = item.shape && SHAPE_FACTOR[item.shape] ? item.shape : 'block';
    const factor = SHAPE_FACTOR[shape];
    const density = Number(item.density) || DEFAULT_DENSITY[shape] || 0.95;
    const volume = area * thickness * factor;
    const mass = volume * density;
    const calorie100 = Number(item.calorie) || 0;
    const kcal = mass / 100 * calorie100;
    return {
      name: item.name || '未知食物',
      probability: Number(item.probability) || Number(item.confidence) || 0.5,
      confidence: Math.round((Number(item.probability) || Number(item.confidence) || 0.5) * 100),
      bbox: item.bbox || { x: 0, y: 0, w: 0.2, h: 0.2 },
      fill_ratio: Number(item.fill_ratio) || 0.7,
      ref_object: item.ref_object || '',
      view_deg: Number(item.view_deg) || 80,
      area_cm2: Math.round(area * 10) / 10,
      thickness_cm: Math.round(thickness * 10) / 10,
      shape,
      shape_factor: factor,
      density: Math.round(density * 100) / 100,
      volume_ml: Math.round(volume * 10) / 10,
      mass_g: Math.round(mass),
      calorie_per_100g: Math.round(calorie100),
      kcal: Math.round(kcal),
      kcal_range: calorie100 > 0 ? [Math.round(kcal * 0.8), Math.round(kcal * 1.2)] : null,
      nutrition: {
        protein_g: Number(item.protein_g) || 0,
        fat_g: Number(item.fat_g) || 0,
        carbs_g: Number(item.carbs_g) || 0,
        sugar_g: Number(item.sugar_g) || 0,
        sodium_mg: Number(item.sodium_mg) || 0
      }
    };
  }

  async function recognizeMeal(imageBase64) {
    const dataUri = imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64;
    const r = await _chat([
      { role: 'system', content: _appSystemPrompt() },
      { role: 'user', content: [
        { type: 'text', text: _appUserPrompt() },
        { type: 'image_url', image_url: { url: dataUri } }
      ] }
    ], true, 1500);
    if (!r.success) return { success: false, error: r.error || '识别服务暂不可用' };
    const raw = _extractJson(r.text);
    if (!raw || !Array.isArray(raw.results)) return { success: false, error: '识别结果解析失败' };
    const items = raw.results.filter(x => x && x.name).slice(0, 5).map(_rebuildAppItem);
    if (items.length === 0) return { success: false, error: '未识别到食物' };
    const total_mass_g = items.reduce((a, b) => a + b.mass_g, 0);
    const total_kcal = items.reduce((a, b) => a + b.kcal, 0);
    const ref_object = items[0].ref_object || '';
    return {
      success: true,
      items,
      total_mass_g: Math.round(total_mass_g),
      total_kcal: Math.round(total_kcal),
      total_kcal_range: [Math.round(total_kcal * 0.8), Math.round(total_kcal * 1.2)],
      ref_object,
      food_count: items.length,
      raw
    };
  }

  return { dish, orderImage, orderText, nutrition, measure, measureRaw, analyzeMeasure, recognizeMeal };
})();
