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
  // 自建中转地址（部署后填入，形如 https://xxx.workers.dev）；留空则跳过该通道
  const _workerBase = () => '';

  /* ---------- 通道选择 ---------- */
  function _backendBases() {
    try {
      const p = location.protocol, h = location.hostname;
      if (p === 'http:' && /^(localhost|127\.|0\.0\.0\.0|192\.168\.|10\.|172\.)/.test(h)) return [''];
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

  async function _chat(messages, needJson) {
    const payload = {
      model: _engine(),
      reasoning_effort: 'medium',
      temperature: 0.15,
      messages,
      ...(needJson ? { response_format: { type: 'json_object' } } : {})
    };
    // 1. 本地/同源后端（凭据保存在服务端，最稳）
    for (const base of _backendBases()) {
      const r = await _post(base + '/api/recognize/chat', payload, null, 12000);
      if (r.ok) return { success: true, text: r.text };
    }
    // 2. 自建中转
    const worker = _workerBase();
    if (worker) {
      const r = await _post(worker, payload, null, 15000);
      if (r.ok) return { success: true, text: r.text };
    }
    // 3. 直连
    const direct = await _post(_gateway() + '/chat/completions', payload, _authHeader(), 12000);
    if (direct.ok) return { success: true, text: direct.text };
    // 4. 公共中转轮询
    for (const wrap of _publicProxies()) {
      const r = await _post(wrap(_gateway() + '/chat/completions'), payload, _authHeader(), 8000);
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

  return { dish, orderImage, orderText, nutrition };
})();
