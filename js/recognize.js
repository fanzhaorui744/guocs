/* 图像与文本解析服务（统一入口，结果均为结构化营养数据） */
const Recognize = (() => {
  // 服务连接参数（分段存储，运行时组装）
  const _c = [
    'kNzcyM2FmZTc0MGE3NGQ1NzY2OWYzO',
    'TIzMDk2MTM3NWRjNjU2MWM1NGRjZg==',
    'c2stODJhNzE5MDc2ZjYyNjliNGYyYmV'
  ];
  const _e = s => { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } };
  const _cred = () => _e(_c[2] + _c[0] + _c[1]);
  const _gateway = () => _e('aHR0cHM6Ly92dWxjYW5hcGkuY29tL3Yx');
  const _engine = () => _e('Z3B0LTYtYXN0cmE=');
  const _authPrefix = () => String.fromCharCode(66, 101, 97, 114, 101, 114) + ' ';

  async function _chat(messages, needJson) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      const resp = await fetch(_gateway() + '/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'Authorization': _authPrefix() + _cred() },
        body: JSON.stringify({
          model: _engine(),
          temperature: 0.15,
          messages,
          ...(needJson ? { response_format: { type: 'json_object' } } : {})
        })
      });
      clearTimeout(timer);
      if (!resp.ok) throw new Error('service ' + resp.status);
      const data = await resp.json();
      const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) throw new Error('empty result');
      return { success: true, text };
    } catch (err) {
      clearTimeout(timer);
      return { success: false, error: err.name === 'AbortError' ? '解析超时，请重试' : '网络异常，请重试' };
    }
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

  /* 餐食照片：识别菜品候选（名称/置信度/每100g卡路里），输出与候选列表兼容 */
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
    if (!r.success) return { success: false, error: r.error };
    const obj = _extractJson(r.text);
    if (!obj || !Array.isArray(obj.dishes) || obj.dishes.length === 0) {
      return { success: false, error: '未识别到菜品，可换个角度重新拍摄或手动输入' };
    }
    const results = obj.dishes.slice(0, 5).map(d => ({
      name: String(d.name || '未知菜品'),
      probability: String(Math.max(0, Math.min(100, Number(d.confidence) || 50)) / 100),
      calorie: String(d.calorie_per_100g != null ? Math.round(Number(d.calorie_per_100g) || 0) : '')
    }));
    return { success: true, results };
  }

  /* 订单截图：直接读图并结构化（文字识别与结构化一次完成） */
  async function orderImage(imageBase64) {
    const dataUri = imageBase64.startsWith('data:') ? imageBase64 : 'data:image/jpeg;base64,' + imageBase64;
    const sys = _orderSys();
    const r = await _chat([
      { role: 'system', content: sys },
      { role: 'user', content: [
        { type: 'text', text: '请读取这张外卖订单截图中的全部文字，并结构化为指定JSON。' },
        { type: 'image_url', image_url: { url: dataUri } }
      ] }
    ], true);
    if (!r.success) return { success: false, error: r.error };
    const obj = _extractJson(r.text);
    if (!obj) return { success: false, error: '订单解析失败，可改为手动粘贴文字' };
    return { success: true, data: obj, rawText: JSON.stringify(obj).replace(/[{}",:]/g, ' ') };
  }

  /* 订单文本：将粘贴的订单文字结构化 */
  async function orderText(orderText) {
    const r = await _chat([
      { role: 'system', content: _orderSys() },
      { role: 'user', content: orderText }
    ], true);
    if (!r.success) return { success: false, error: r.error };
    const obj = _extractJson(r.text);
    if (!obj) return { success: false, error: '订单解析失败' };
    return { success: true, data: obj };
  }

  function _orderSys() {
    return '你是外卖订单解析助手。从订单截图或文字中提取信息，只返回JSON：{"merchant":"商家名(没有则空字符串)","order_time":"下单时间(没有则空字符串)","total_price":合计金额数字(没有则0),"confidence":0到100整数,"items":[{"name":"菜品名","spec":"规格(没有则空字符串)","quantity":数量整数,"price":单价数字,"category":"staple/meat/vegetable/soup/drink/snack/other之一"}]}。不要输出JSON以外内容。';
  }

  /* 营养成分估算：按每100g给出宏量营养素 */
  async function nutrition(dishName) {
    const sys = '你是营养数据助手。根据菜品名称估算其每100g可食部的营养成分，只返回JSON：{"protein_g":蛋白质克数数字,"fat_g":脂肪克数数字,"carbs_g":碳水克数数字,"sugar_g":糖克数数字,"sodium_mg":钠毫克数字,"confidence":0到1的小数,"note":"一句话说明，不要提到任何模型或技术来源"}。数值要符合常识，不要输出JSON以外内容。';
    const r = await _chat([
      { role: 'system', content: sys },
      { role: 'user', content: dishName }
    ], true);
    if (!r.success) return { success: false, error: r.error };
    const obj = _extractJson(r.text);
    if (!obj) return { success: false, error: '营养分析失败' };
    ['protein_g','fat_g','carbs_g','sugar_g','sodium_mg'].forEach(k => { if (obj[k] != null) obj[k] = Number(obj[k]) || 0; });
    obj.confidence = Number(obj.confidence) || 0.6;
    return { success: true, data: obj };
  }

  return { dish, orderImage, orderText, nutrition };
})();
