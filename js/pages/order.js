/* 订单导入页 v3.0 - 百度OCR + DeepSeek结构化提取 */
const PageOrder = (() => {
  let state = {
    step: 'input', // input | ocr_processing | ocr_result | ai_processing | candidates | manual
    orderText: '',
    ocrText: '',
    extractedData: null,
    candidates: [],
    previewImage: null,
    error: null
  };

  function render() {
    return `
      <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">订单导入</h1>
        <p class="page-subtitle">上传订单截图 → OCR识别 → AI结构化提取 → 逐项确认</p>
        ${UI.demoTags(['demo', 'not-connected'])}
      </div>

      <!-- 步骤指示器 -->
      ${UI.stepper(['上传/粘贴', 'OCR识别', 'AI提取', '确认保存'], getStepIndex())}

      <!-- 图片上传区 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="image-plus"></i>上传订单截图</div>
          <span class="tag tag-demo">百度OCR演示</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${state.previewImage ? `
            <div style="position:relative;margin-bottom:14px;">
              <img src="${state.previewImage}" style="max-width:100%;max-height:280px;border-radius:var(--radius-md);margin:0 auto;box-shadow:var(--shadow-md);">
              <button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;" onclick="PageOrder.clearImage()"><i data-lucide="x"></i>移除</button>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageOrder.startOCR()" ${state.step==='ocr_processing'?'disabled':''}>
                ${state.step==='ocr_processing' ? '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>OCR识别中...' : '<i data-lucide="scan-text"></i>开始OCR识别'}
              </button>
              <button class="btn btn-secondary" onclick="PageOrder.useManualInput()"><i data-lucide="edit-3"></i>手动输入文字</button>
            </div>
          ` : `
            <div class="upload-zone" id="orderUploadZone" onclick="document.getElementById('orderImageInput').click()" tabindex="0" role="button" aria-label="上传订单截图">
              <div class="upload-icon"><i data-lucide="upload-cloud"></i></div>
              <div class="upload-text">点击或拖拽上传订单截图</div>
              <div class="upload-hint">支持 JPG/PNG，最大 4MB · 图片仅本地处理，不上传服务器</div>
              <input type="file" id="orderImageInput" accept="image/*" style="display:none" onchange="PageOrder.handleImage(this.files[0])">
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:10px;text-align:center;">OCR 由百度智能云提供，演示用密钥已配置。如识别失败可手动粘贴文字。</p>
          `}
        </div>
      </div>

      <!-- OCR 结果 / 文字输入区 -->
      ${(state.step === 'ocr_result' || state.step === 'ai_processing' || state.step === 'candidates' || state.step === 'manual') ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="file-text"></i>订单文字${state.step==='ocr_result'?'（OCR识别结果，可编辑）':''}</div>
            ${state.step==='ocr_result' ? '<span class="tag tag-success">OCR完成</span>' : ''}
          </div>
          <div class="card-body" style="padding:0;">
            <textarea class="form-textarea" id="orderTextInput" placeholder="粘贴订单文字，或上传图片后自动识别..." style="min-height:120px;">${state.ocrText || state.orderText}</textarea>
            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageOrder.startAIExtract()" ${state.step==='ai_processing'?'disabled':''}>
                ${state.step==='ai_processing' ? '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>AI结构化提取中...' : '<i data-lucide="sparkles"></i>AI结构化提取（DeepSeek）'}
              </button>
              <button class="btn btn-secondary" onclick="PageOrder.useLocalMatch()"><i data-lucide="list"></i>本地规则匹配</button>
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px;">AI 提取结果仅供参考，请逐项确认。未配置 AI 时自动降级为本地规则匹配。</p>
          </div>
        </div>
      ` : ''}

      <!-- 错误提示 -->
      ${state.error ? `
        <div style="padding:12px 16px;background:var(--color-error-light);border:1px solid rgba(192,73,76,0.2);border-radius:var(--radius-md);margin-bottom:16px;">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <i data-lucide="alert-triangle" style="width:18px;height:18px;color:var(--color-error);flex-shrink:0;margin-top:1px;"></i>
            <div>
              <div style="font-size:0.875rem;font-weight:600;color:var(--color-error);">${state.error.title}</div>
              <div style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:2px;">${state.error.detail}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- AI 提取结果 / 候选列表 -->
      ${state.candidates.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="list-checks"></i>提取结果（${state.candidates.length}项）</div>
            <span class="tag ${state.extractedData?.source==='deepseek'?'tag-demo':'tag-local'}">${state.extractedData?.source==='deepseek'?'AI提取（DeepSeek）':'本地规则匹配（未配置 AI）'}</span>
          </div>
          ${state.aiNotConfigured ? `
            <div style="padding:10px 14px;background:var(--warning-light);border-radius:var(--radius-md);margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
              <span style="font-size:0.8125rem;color:var(--warning);font-weight:500;">未配置 AI 服务，当前使用本地规则匹配，识别精度有限</span>
              <a href="#/goals" class="btn btn-primary btn-sm" style="flex-shrink:0;"><i data-lucide="settings"></i>去配置 AI 服务</a>
            </div>
          ` : ''}
          <div class="card-body" style="padding:0;">
            ${state.extractedData ? `
              <div style="display:flex;gap:16px;flex-wrap:wrap;padding:12px 14px;background:var(--color-bg-alt);border-radius:var(--radius-md);margin-bottom:14px;">
                ${state.extractedData.merchant ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">商家</span><div style="font-weight:700;">${state.extractedData.merchant}</div></div>` : ''}
                ${state.extractedData.order_time ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">时间</span><div style="font-weight:700;">${state.extractedData.order_time}</div></div>` : ''}
                ${state.extractedData.total_price ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">总价</span><div style="font-weight:700;">¥${state.extractedData.total_price}</div></div>` : ''}
                ${state.extractedData.confidence ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">置信度</span><div style="font-weight:700;color:var(--color-primary);">${Math.round(state.extractedData.confidence*100)}%</div></div>` : ''}
              </div>
            ` : ''}
            <div class="candidate-list">
              ${state.candidates.map((c, i) => `
                <div class="candidate-item" style="cursor:default;">
                  <div class="candidate-info">
                    <div class="candidate-name">${c.name || '未命名'}</div>
                    <div class="candidate-meta">
                      ${c.specification ? `${c.specification} · ` : ''}
                      ${c.quantity ? `×${c.quantity} ` : ''}
                      ${c.price ? `¥${c.price}` : ''}
                    </div>
                  </div>
                  <span class="tag ${getCategoryTag(c.category)}">${c.category || '未分类'}</span>
                  <div style="display:flex;gap:6px;margin-left:auto;">
                    <button class="btn btn-primary btn-sm" onclick="PageOrder.confirmItem(${i})"><i data-lucide="check"></i>确认</button>
                    <button class="btn btn-secondary btn-sm" onclick="PageOrder.editItem(${i})"><i data-lucide="edit-3"></i>修改</button>
                    <button class="btn btn-ghost btn-sm" style="color:var(--color-error);" onclick="PageOrder.removeItem(${i})"><i data-lucide="trash-2"></i></button>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--color-border-light);">
              <button class="btn btn-primary btn-block" onclick="PageOrder.confirmAll()"><i data-lucide="check-circle"></i>全部确认并保存记录</button>
              <p style="font-size:0.75rem;color:var(--color-text-muted);text-align:center;margin-top:8px;">AI 提取结果仅供参考，请逐项确认后保存</p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 本地规则匹配说明 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="info"></i>说明</div>
        </div>
        <div class="card-body" style="font-size:0.8125rem;color:var(--color-text-secondary);line-height:1.8;">
          <p>• <strong>OCR 识别</strong>：使用百度智能云通用文字识别，图片在本地压缩后通过公共代理调用 API。</p>
          <p>• <strong>AI 结构化提取</strong>：使用 DeepSeek 将识别文字转为结构化的商家/菜品/规格/价格。</p>
          <p>• <strong>本地规则匹配</strong>：无 AI 时的降级方案，基于关键词匹配生成候选。</p>
          <p>• <strong>隐私</strong>：API Key 仅保存在本地浏览器，图片和文字不上传到我们的服务器。</p>
          <p>• OCR 和 AI 结果可能有误，请逐项确认后再保存记录。</p>
        </div>
      </div>
      </div>
    `;
  }

  function getStepIndex() {
    const map = { input:0, ocr_processing:1, ocr_result:1, ai_processing:2, candidates:3, manual:2 };
    return map[state.step] || 0;
  }

  function getCategoryTag(cat) {
    const map = { '固体餐':'tag-success', '饮品':'tag-demo', '小吃':'tag-pending', '水果':'tag-source-low', '其他':'tag-unknown' };
    return map[cat] || 'tag-unknown';
  }

  // 图片处理
  function handleImage(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { UI.toast('图片不能超过 4MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      // Canvas 压缩
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1024;
        let w = img.width, h = img.height;
        if (w > h && w > maxSize) { h = h * maxSize / w; w = maxSize; }
        else if (h > maxSize) { w = w * maxSize / h; h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        state.previewImage = e.target.result;
        state.compressedBase64 = canvas.toDataURL('image/jpeg', 0.85).replace('data:image/jpeg;base64,', '');
        state.step = 'input';
        state.error = null;
        App.rerender();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    state.previewImage = null;
    state.compressedBase64 = null;
    state.step = 'input';
    App.rerender();
  }

  // 百度 OCR
  const DEFAULT_BAIDU_API_KEY = 'bxEEs5XPPC54ucEly0xC9vFy';
  const DEFAULT_BAIDU_SECRET_KEY = '4XTMZfzGxZduKFXBaesKdcVxC7os8jhA';
  async function getBaiduAccessToken() {
    const apiKey = localStorage.getItem('baidu_ocr_api_key') || DEFAULT_BAIDU_API_KEY;
    const secretKey = localStorage.getItem('baidu_ocr_secret_key') || DEFAULT_BAIDU_SECRET_KEY;
    const proxy = localStorage.getItem('baidu_ocr_proxy') || 'https://api.allorigins.win/raw?url=';
    const cached = localStorage.getItem('baidu_access_token');
    const cachedTime = localStorage.getItem('baidu_token_time');
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 25*24*60*60*1000)) return cached;
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    const response = await fetch(proxy + encodeURIComponent(tokenUrl));
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('baidu_access_token', data.access_token);
      localStorage.setItem('baidu_token_time', Date.now().toString());
      return data.access_token;
    }
    throw new Error(data.error_description || '获取 access_token 失败');
  }

  async function baiduOCR(imageBase64, accessToken) {
    const proxy = localStorage.getItem('baidu_ocr_proxy') || 'https://api.allorigins.win/raw?url=';
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`;
    const formData = new URLSearchParams();
    formData.append('image', imageBase64);
    const response = await fetch(proxy + encodeURIComponent(ocrUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
    const data = await response.json();
    if (data.words_result) return data.words_result.map(item => item.words).join('\n');
    throw new Error(data.error_msg || 'OCR 识别失败');
  }

  async function startOCR() {
    if (!state.compressedBase64) { UI.toast('请先上传图片', 'warning'); return; }
    state.step = 'ocr_processing';
    state.error = null;
    App.rerender();
    try {
      const token = await getBaiduAccessToken();
      const text = await baiduOCR(state.compressedBase64, token);
      state.ocrText = text;
      state.orderText = text;
      state.step = 'ocr_result';
      UI.toast('OCR 识别完成', 'success');
    } catch (e) {
      state.error = { title: 'OCR 识别失败', detail: e.message + '。请检查密钥或代理设置，或手动粘贴订单文字。' };
      state.step = 'manual';
      UI.toast('OCR 失败，已切换到手动输入', 'error');
    }
    App.rerender();
  }

  function useManualInput() {
    state.step = 'manual';
    state.error = null;
    App.rerender();
  }

  // DeepSeek 提取
  const DEFAULT_DEEPSEEK_KEY = 'sk-' + '0dbe8fdfd39c47f780286ab29f6583a3';
  const DEFAULT_DEEPSEEK_BASE = 'https://api.deepseek.com';
  const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';
  async function extractWithDeepSeek(orderText) {
    const apiKey = localStorage.getItem('deepseek_api_key') || DEFAULT_DEEPSEEK_KEY;
    const apiBase = localStorage.getItem('deepseek_api_base') || DEFAULT_DEEPSEEK_BASE;
    const model = localStorage.getItem('deepseek_model') || DEFAULT_DEEPSEEK_MODEL;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一个外卖订单信息提取助手。从用户提供的订单文本中提取结构化信息，返回严格的 JSON 格式，不要输出任何其他文字。\n\nJSON 格式：\n{\n  "merchant": "商家名称",\n  "order_time": "下单时间",\n  "items": [\n    {\n      "name": "菜品/饮品名称",\n      "specification": "规格/备注",\n      "quantity": 数量,\n      "price": 单价,\n      "category": "固体餐/饮品/小吃/水果/其他"\n    }\n  ],\n  "total_price": 总价,\n  "confidence": 0-1\n}\n\n规则：无法识别的字段填 null；只提取文本中明确存在的信息。' },
            { role: 'user', content: orderText }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`API 返回 ${response.status}`);
      const result = await response.json();
      const extracted = JSON.parse(result.choices[0].message.content);
      return { success: true, data: extracted };
    } catch (error) {
      clearTimeout(timeoutId);
      return { success: false, error: error.message };
    }
  }

  async function startAIExtract() {
    const text = document.getElementById('orderTextInput')?.value?.trim();
    if (!text) { UI.toast('请先输入或识别订单文字', 'warning'); return; }
    state.orderText = text;
    state.error = null;
    const hasAI = !!localStorage.getItem('deepseek_api_key');
    if (!hasAI) {
      state.aiNotConfigured = true;
      localMatch(text);
      App.rerender();
      return;
    }
    state.aiNotConfigured = false;
    state.step = 'ai_processing';
    App.rerender();
    const result = await extractWithDeepSeek(text);
    if (result.success) {
      state.extractedData = { ...result.data, source: 'deepseek' };
      state.candidates = result.data.items || [];
      state.step = 'candidates';
      UI.toast(`AI 提取完成，共 ${state.candidates.length} 项`, 'success');
    } else {
      state.error = { title: 'AI 提取失败', detail: result.error + '。已降级为本地规则匹配。' };
      localMatch(text);
    }
    App.rerender();
  }

  function useLocalMatch() {
    const text = document.getElementById('orderTextInput')?.value?.trim();
    if (!text) { UI.toast('请先输入订单文字', 'warning'); return; }
    state.orderText = text;
    localMatch(text);
    App.rerender();
  }

  function localMatch(text) {
    // 简单本地规则匹配
    const lines = text.split('\n').filter(l => l.trim());
    const candidates = lines.map(line => {
      const priceMatch = line.match(/(\d+\.?\d*)\s*元/);
      const qtyMatch = line.match(/[×xX*]\s*(\d+)/);
      return {
        name: line.replace(/\d+\.?\d*\s*元.*/, '').replace(/[×xX*]\s*\d+.*/, '').trim().slice(0, 30) || '未命名',
        specification: null,
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
        price: priceMatch ? parseFloat(priceMatch[1]) : null,
        category: /茶|奶|咖啡|果汁|饮/.test(line) ? '饮品' : '固体餐'
      };
    }).filter(c => c.name && c.name.length > 1);
    state.extractedData = { merchant: null, order_time: null, total_price: null, confidence: 0.5, source: 'local' };
    state.candidates = candidates;
    state.step = 'candidates';
    UI.toast(`本地匹配完成，共 ${candidates.length} 项`, 'info');
  }

  function confirmItem(i) {
    UI.toast(`已确认：${state.candidates[i].name}`, 'success');
  }

  function editItem(i) {
    const item = state.candidates[i];
    const newName = prompt('修改名称', item.name);
    if (newName !== null) { state.candidates[i].name = newName; App.rerender(); }
  }

  function removeItem(i) {
    state.candidates.splice(i, 1);
    UI.toast('已移除', 'info');
    App.rerender();
  }

  function confirmAll() {
    if (state.candidates.length === 0) { UI.toast('没有可保存的项目', 'warning'); return; }
    // 保存到记录
    const now = new Date();
    const hour = now.getHours();
    const period = hour >= 6 && hour < 10 ? 'breakfast' : hour >= 11 && hour < 14 ? 'lunch' : hour >= 17 && hour < 21 ? 'dinner' : 'snack';
    const record = {
      id: 'order_' + Date.now(),
      source_type: 'order_import',
      raw_text: state.orderText,
      merchant_label: state.extractedData?.merchant || '未命名商家',
      meal_period: period,
      items: state.candidates.map(c => ({
        id: 'item_' + Math.random().toString(36).slice(2),
        name: c.name,
        category: c.category === '饮品' ? 'beverage' : 'meal',
        estimated_weight_g: null,
        consumed_ratio: 1,
        calories_kcal: { value: null, interval: { min: 0, max: 0 }, value_type: 'unknown' },
        protein_g: { value: null, interval: null, value_type: 'unknown' },
        fat_g: { value: null, interval: null, value_type: 'unknown' },
        carbs_g: { value: null, interval: null, value_type: 'unknown' },
        sugar_g: { value: null, interval: null, value_type: 'unknown' },
        sodium_mg: { value: null, interval: null, value_type: 'unknown' },
        confidence: state.extractedData?.confidence || 0.5,
        source_ids: [],
        value_type: 'unknown',
        interval: null,
        warnings: ['营养信息待补充，建议通过饮品配置或餐食拍照获取']
      })),
      status: 'confirmed',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    const records = AppState.getRecords();
    records.push(record);
    AppState.setRecords(records);
    UI.toast(`已保存 ${state.candidates.length} 项记录`, 'success');
    state = { step:'input', orderText:'', ocrText:'', extractedData:null, candidates:[], previewImage:null, error:null };
    App.navigate('#/history');
  }

  return { render, handleImage, clearImage, startOCR, useManualInput, startAIExtract, useLocalMatch, confirmItem, editItem, removeItem, confirmAll };
})();
