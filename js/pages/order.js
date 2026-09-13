/* 订单导入页 - 截图/文字智能解析为结构化订单 */
const PageOrder = (() => {
  let state = {
    step: 'input', // input | parsing | parsed | manual
    orderText: '',
    parsedText: '',
    extractedData: null,
    candidates: [],
    previewImage: null,
    compressedBase64: null,
    error: null
  };

  const CAT_CN = { staple:'主食', meat:'肉类', vegetable:'蔬菜', soup:'汤品', drink:'饮品', snack:'小吃', fruit:'水果', other:'其他' };
  const CAT_ORDER = ['staple','meat','vegetable','soup','drink','snack','fruit','other'];

  function catCn(c) { return CAT_CN[c] || c || '其他'; }

  function render() {
    return `
      <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">订单导入</h1>
        <p class="page-subtitle">上传订单截图或粘贴订单文字 → 智能解析 → 逐项确认</p>
      </div>

      <!-- 步骤指示器 -->
      ${UI.stepper(['上传/粘贴', '智能解析', '确认保存'], getStepIndex())}

      <!-- 图片上传区 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="image-plus"></i>上传订单截图</div>
          <span class="tag tag-success">截图识别</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${state.previewImage ? `
            <div style="position:relative;margin-bottom:14px;">
              <img src="${state.previewImage}" style="max-width:100%;max-height:280px;border-radius:var(--radius-md);margin:0 auto;box-shadow:var(--shadow-md);">
              <button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;" onclick="PageOrder.clearImage()"><i data-lucide="x"></i>移除</button>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageOrder.startParseImage()" ${state.step==='parsing'?'disabled':''}>
                ${state.step==='parsing' ? '<span class="loading-spinner" style="width:16px;height:16px;border-width:2px;margin:0;"></span>正在解析...' : '<i data-lucide="scan-text"></i>开始解析截图'}
              </button>
              <button class="btn btn-secondary" onclick="PageOrder.useManualInput()"><i data-lucide="edit-3"></i>手动输入文字</button>
            </div>
          ` : `
            <div class="upload-zone" id="orderUploadZone" onclick="document.getElementById('orderImageInput').click()" tabindex="0" role="button" aria-label="上传订单截图">
              <div class="upload-icon"><i data-lucide="upload-cloud"></i></div>
              <div class="upload-text">点击或拖拽上传订单截图</div>
              <div class="upload-hint">支持 JPG/PNG，最大 4MB · 图片仅在本地处理后用于解析</div>
              <input type="file" id="orderImageInput" accept="image/*" style="display:none" onchange="PageOrder.handleImage(this.files[0])">
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:10px;text-align:center;">自动读取截图中的商家、菜品、规格与价格；也可直接粘贴文字</p>
          `}
        </div>
      </div>

      <!-- 文字输入区 -->
      ${(state.step === 'parsing' || state.step === 'parsed' || state.step === 'manual') ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="file-text"></i>订单文字${state.step==='parsed'?'（可编辑后重新解析）':''}</div>
          </div>
          <div class="card-body" style="padding:0;">
            <textarea class="form-textarea" id="orderTextInput" placeholder="粘贴订单文字，或上传截图后自动解析..." style="min-height:120px;">${state.parsedText || state.orderText}</textarea>
            <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageOrder.startParseText()" ${state.step==='parsing'?'disabled':''}>
                <i data-lucide="sparkles"></i>智能解析
              </button>
              <button class="btn btn-secondary" onclick="PageOrder.useLocalMatch()"><i data-lucide="list"></i>按行快速拆分</button>
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px;">解析结果仅供参考，可逐项修改确认后再保存。</p>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="keyboard"></i>或直接粘贴订单文字</div>
          </div>
          <div class="card-body" style="padding:0;">
            <textarea class="form-textarea" id="orderTextInputFirst" placeholder="把外卖订单详情粘贴到这里，点击下方按钮解析..." style="min-height:110px;"></textarea>
            <div style="margin-top:12px;">
              <button class="btn btn-primary" onclick="PageOrder.pasteAndParse()"><i data-lucide="sparkles"></i>解析文字订单</button>
            </div>
          </div>
        </div>
      `}

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

      <!-- 解析结果 / 候选列表 -->
      ${state.candidates.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i data-lucide="list-checks"></i>解析结果（${state.candidates.length}项）</div>
            <span class="tag ${state.extractedData?.source==='smart'?'tag-success':'tag-local'}">${state.extractedData?.source==='smart'?'智能解析':'按行拆分'}</span>
          </div>
          <div class="card-body" style="padding:0;">
            ${state.extractedData ? `
              <div style="display:flex;gap:16px;flex-wrap:wrap;padding:12px 14px;background:var(--color-bg-alt);border-radius:var(--radius-md);margin-bottom:14px;">
                ${state.extractedData.merchant ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">商家</span><div style="font-weight:700;">${state.extractedData.merchant}</div></div>` : ''}
                ${state.extractedData.order_time ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">时间</span><div style="font-weight:700;">${state.extractedData.order_time}</div></div>` : ''}
                ${state.extractedData.total_price ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">总价</span><div style="font-weight:700;">¥${state.extractedData.total_price}</div></div>` : ''}
                ${state.extractedData.confidence ? `<div><span style="font-size:0.75rem;color:var(--color-text-muted);">置信度</span><div style="font-weight:700;color:var(--color-primary);">${Math.round(state.extractedData.confidence)}%</div></div>` : ''}
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
                  <span class="tag ${getCategoryTag(c.category)}">${catCn(c.category)}</span>
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
              <p style="font-size:0.75rem;color:var(--color-text-muted);text-align:center;margin-top:8px;">解析结果仅供参考，请逐项确认后保存</p>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- 说明 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="info"></i>使用说明</div>
        </div>
        <div class="card-body" style="font-size:0.8125rem;color:var(--color-text-secondary);line-height:1.8;">
          <p>• <strong>截图解析</strong>：上传外卖订单截图，自动读取商家、菜品、规格、数量与价格。</p>
          <p>• <strong>文字解析</strong>：粘贴订单文字，自动整理为结构化的菜品清单。</p>
          <p>• <strong>按行拆分</strong>：不使用智能解析时，可按订单每一行快速拆分为条目。</p>
          <p>• <strong>隐私</strong>：图片仅在本地压缩后用于本次解析，不做留存。</p>
          <p>• 自动解析结果可能有误，请逐项确认后再保存记录。</p>
        </div>
      </div>
      </div>
    `;
  }

  function getStepIndex() {
    const map = { input:0, parsing:1, parsed:2, manual:1 };
    return map[state.step] || 0;
  }

  function getCategoryTag(cat) {
    const map = { 主食:'tag-success', 肉类:'tag-demo', 蔬菜:'tag-success', 汤品:'tag-pending', 饮品:'tag-demo', 小吃:'tag-pending', 水果:'tag-source-low', 其他:'tag-unknown' };
    return map[catCn(cat)] || 'tag-unknown';
  }

  // 把解析数据适配为候选列表
  function adaptItems(data) {
    return (data.items || []).map(it => ({
      name: it.name || '未命名',
      specification: it.spec || it.specification || '',
      quantity: it.quantity || 1,
      price: it.price != null ? it.price : null,
      category: CAT_ORDER.includes(it.category) ? it.category : 'other'
    }));
  }

  // 图片处理
  function handleImage(file) {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { UI.toast('图片不能超过 4MB', 'warning'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
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

  // 截图一步解析（读图 + 结构化）
  async function startParseImage() {
    if (!state.compressedBase64) { UI.toast('请先上传截图', 'warning'); return; }
    state.step = 'parsing';
    state.error = null;
    App.rerender();
    const result = await Recognize.orderImage(state.compressedBase64);
    if (result.success) {
      applyParsed(result.data, result.rawText || '');
      UI.toast(`解析完成，共 ${state.candidates.length} 项`, 'success');
    } else {
      state.error = { title: '截图解析失败', detail: result.error + '。可改为手动粘贴订单文字。' };
      state.step = 'manual';
      UI.toast('解析失败，已切换到手动输入', 'error');
    }
    App.rerender();
  }

  function pasteAndParse() {
    const text = document.getElementById('orderTextInputFirst')?.value?.trim();
    if (!text) { UI.toast('请先粘贴订单文字', 'warning'); return; }
    state.orderText = text;
    state.parsedText = text;
    state.step = 'manual';
    App.rerender();
    startParseText();
  }

  async function startParseText() {
    const text = document.getElementById('orderTextInput')?.value?.trim();
    if (!text) { UI.toast('请先输入订单文字', 'warning'); return; }
    state.orderText = text;
    state.parsedText = text;
    state.error = null;
    state.step = 'parsing';
    App.rerender();
    const result = await Recognize.orderText(text);
    if (result.success) {
      applyParsed(result.data, text);
      UI.toast(`解析完成，共 ${state.candidates.length} 项`, 'success');
    } else {
      state.error = { title: '解析失败', detail: result.error + '。可尝试按行快速拆分。' };
      localMatch(text);
    }
    App.rerender();
  }

  function applyParsed(data, rawText) {
    // 置信度统一为百分比
    if (data.confidence != null && data.confidence <= 1) data.confidence = Math.round(data.confidence * 100);
    state.extractedData = { ...data, source: 'smart' };
    state.candidates = adaptItems(data);
    state.parsedText = rawText || state.parsedText || state.orderText;
    state.step = 'parsed';
  }

  function useManualInput() {
    state.step = 'manual';
    state.error = null;
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
    const lines = text.split('\n').filter(l => l.trim());
    const candidates = lines.map(line => {
      const priceMatch = line.match(/(\d+\.?\d*)\s*元/);
      const qtyMatch = line.match(/[×xX*]\s*(\d+)/);
      const isDrink = /茶|奶|咖啡|果汁|饮|可乐|水/.test(line);
      return {
        name: line.replace(/\d+\.?\d*\s*元.*/, '').replace(/[×xX*]\s*\d+.*/, '').trim().slice(0, 30) || '未命名',
        specification: '',
        quantity: qtyMatch ? parseInt(qtyMatch[1]) : 1,
        price: priceMatch ? parseFloat(priceMatch[1]) : null,
        category: isDrink ? 'drink' : 'other'
      };
    }).filter(c => c.name && c.name.length > 1);
    state.extractedData = { merchant: '', order_time: '', total_price: null, confidence: 50, source: 'local' };
    state.candidates = candidates;
    state.step = 'parsed';
    UI.toast(`拆分完成，共 ${candidates.length} 项`, 'info');
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
        category: c.category === 'drink' ? 'beverage' : 'meal',
        estimated_weight_g: null,
        consumed_ratio: 1,
        calories_kcal: { value: null, interval: { min: 0, max: 0 }, value_type: 'unknown' },
        protein_g: { value: null, interval: null, value_type: 'unknown' },
        fat_g: { value: null, interval: null, value_type: 'unknown' },
        carbs_g: { value: null, interval: null, value_type: 'unknown' },
        sugar_g: { value: null, interval: null, value_type: 'unknown' },
        sodium_mg: { value: null, interval: null, value_type: 'unknown' },
        confidence: (state.extractedData?.confidence || 50) / 100,
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
    state = { step:'input', orderText:'', parsedText:'', extractedData:null, candidates:[], previewImage:null, compressedBase64:null, error:null };
    App.navigate('#/history');
  }

  return { render, handleImage, clearImage, startParseImage, startParseText, pasteAndParse, useManualInput, useLocalMatch, confirmItem, editItem, removeItem, confirmAll };
})();
