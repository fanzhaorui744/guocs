/* 餐食拍照页 - 完整状态机 */
const PageMeal = (() => {
  let state = {
    phase: 'idle', // idle|uploading|complete|partial|low_conf|error|permission
    imageData: null,
    result: null,
    demoCaseIndex: 0
  };

  function render() {
    return `
      <div class="page-header">
        <h1 class="page-title">餐食拍照识别</h1>
        <p class="page-subtitle">固体餐照片 → 识别/分割/份量 → 手动校正 → 保存记录</p>
        ${UI.demoTags(['demo', 'not-connected', 'non-medical'])}
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="camera"></i>识别状态</div>
          <span class="tag ${state.phase === 'complete' ? 'tag-success' : state.phase === 'error' ? 'tag-error' : state.phase === 'permission' ? 'tag-error' : 'tag-demo'}">
            ${phaseLabel(state.phase)}
          </span>
        </div>
        <div class="card-body">
          ${state.phase === 'idle' ? renderIdle() : ''}
          ${state.phase === 'uploading' ? renderUploading() : ''}
          ${state.phase === 'complete' ? renderResult('complete') : ''}
          ${state.phase === 'partial' ? renderResult('partial') : ''}
          ${state.phase === 'low_conf' ? renderResult('low_conf') : ''}
          ${state.phase === 'error' ? renderError() : ''}
          ${state.phase === 'permission' ? renderPermission() : ''}
        </div>
      </div>

      ${state.phase !== 'idle' && state.phase !== 'uploading' ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
          <button class="btn btn-secondary" onclick="PageMeal.reset()"><i data-lucide="rotate-ccw"></i>重新识别</button>
          <button class="btn btn-ghost" onclick="PageMeal.simulateState('error')">模拟：服务不可用</button>
          <button class="btn btn-ghost" onclick="PageMeal.simulateState('partial')">模拟：部分识别</button>
          <button class="btn btn-ghost" onclick="PageMeal.simulateState('low_conf')">模拟：低置信</button>
          <button class="btn btn-ghost" onclick="PageMeal.simulateState('permission')">模拟：权限不足</button>
        </div>
      ` : ''}
    `;
  }

  function phaseLabel(p) {
    const map = { idle:'未选择照片', uploading:'识别中', complete:'完整识别', partial:'部分识别', low_conf:'低置信', error:'失败降级', permission:'权限不足' };
    return map[p] || p;
  }

  function renderIdle() {
    return `
      ${UI.uploadZone('mealUpload', { icon: 'camera', text: '点击或拖拽上传餐食照片', hint: '支持 JPG/PNG · 本地演示模拟识别 · 图片不上传服务器' })}
      <div class="divider"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:0.875rem;font-weight:500;">替代路径：</span>
        <span class="tag tag-demo">识别服务未接入时使用</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="PageMeal.loadDemoCase(0)"><i data-lucide="utensils"></i>Demo案例：黄焖鸡米饭</button>
        <button class="btn btn-secondary" onclick="PageMeal.loadDemoCase(1)"><i data-lucide="utensils"></i>Demo案例：兰州拉面</button>
        <button class="btn btn-secondary" onclick="PageMeal.loadDemoCase(2)"><i data-lucide="utensils"></i>Demo案例：轻食沙拉</button>
        <a href="#/record/order" class="btn btn-ghost"><i data-lucide="receipt"></i>改用订单导入</a>
      </div>
      <div style="margin-top:16px;padding:12px;background:var(--color-warning-light);border-radius:8px;font-size:0.8125rem;color:var(--color-warning);">
        <i data-lucide="alert-triangle" style="width:16px;height:16px;vertical-align:middle;"></i>
        识别结果为本地演示模拟，非真实视觉识别服务。份量为视觉估算，实际可能偏差±20%。不把Demo结果外推到所有餐食。
      </div>
    `;
  }

  function renderUploading() {
    return `
      <div class="state-view">
        <div class="loading-spinner"></div>
        <div class="state-title">正在识别中...</div>
        <div class="state-desc">本地演示模拟识别过程（约2秒）。真实识别服务未接入，此处为模拟延时。</div>
        <div class="state-actions">
          <button class="btn btn-secondary" onclick="PageMeal.cancelUpload()">取消识别</button>
        </div>
      </div>
      ${state.imageData ? `<div class="upload-preview" style="margin-top:16px;"><img src="${state.imageData}" alt="上传的餐食照片" style="max-height:200px;border-radius:8px;margin:0 auto;"><div class="preview-tag tag tag-demo">图片仅本地预览</div></div>` : ''}
    `;
  }

  function renderResult(type) {
    const items = state.result?.items || [];
    const totalKcal = items.reduce((sum, it) => {
      if (it.calories_kcal?.interval) return sum + (it.calories_kcal.interval.min + it.calories_kcal.interval.max) / 2;
      if (it.calories_kcal?.value) return sum + it.calories_kcal.value;
      return sum;
    }, 0);

    return `
      ${state.imageData ? `<div class="upload-preview" style="margin-bottom:16px;"><img src="${state.imageData}" alt="餐食照片" style="max-height:180px;border-radius:8px;margin:0 auto;"><div class="preview-tag tag tag-demo">本地演示图片</div></div>` : ''}

      ${type === 'partial' ? `
        <div class="warning-item" style="margin-bottom:12px;">
          <i data-lucide="alert-circle"></i>
          <span>部分识别：以下 ${items.filter(i=>i.confidence>=0.6).length} 项已识别，${items.filter(i=>i.confidence<0.6).length} 项置信度较低，请逐项确认或标记未知。未确认项不会用默认值填充。</span>
        </div>
      ` : ''}
      ${type === 'low_conf' ? `
        <div class="warning-item" style="margin-bottom:12px;">
          <i data-lucide="help-circle"></i>
          <span>识别置信度较低，结果区间已扩大。建议人工确认份量或选择模板，不要直接保存。</span>
        </div>
      ` : ''}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong>识别结果（${items.length}项）</strong>
        <span style="font-size:0.875rem;">合计约 <strong>${Math.round(totalKcal)}</strong> kcal（估算中值）</span>
      </div>

      ${items.map((item, idx) => `
        <div style="border:1px solid var(--color-border);border-radius:10px;padding:12px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
            <div>
              <strong>${item.name}</strong>
              <span class="tag ${item.confidence >= 0.7 ? 'tag-success' : item.confidence >= 0.5 ? 'tag-pending' : 'tag-source-low'}" style="margin-left:6px;">置信度 ${Math.round(item.confidence*100)}%</span>
            </div>
            <span class="tag tag-demo-data">${item.category === 'meat' ? '肉类' : item.category === 'staple' ? '主食' : item.category === 'vegetable' ? '蔬菜' : item.category === 'condiment' ? '调料' : item.category}</span>
          </div>
          <div class="nutrition-grid" style="grid-template-columns:repeat(3,1fr);">
            ${UI.nutrientValue(item.calories_kcal, 'kcal', '热量')}
            ${UI.nutrientValue(item.protein_g, 'g', '蛋白质')}
            ${UI.nutrientValue(item.fat_g, 'g', '脂肪')}
          </div>
          <div style="display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap;">
            <label style="font-size:0.8125rem;display:flex;align-items:center;gap:6px;">
              估算份量：
              <input type="number" class="form-input" style="width:80px;padding:4px 8px;" value="${item.estimated_weight_g}" onchange="PageMeal.updateWeight(${idx}, this.value)"> g
            </label>
            <label style="font-size:0.8125rem;display:flex;align-items:center;gap:6px;">
              实际摄入：
              <select class="form-select" style="width:100px;padding:4px 8px;" onchange="PageMeal.updateRatio(${idx}, this.value)">
                <option value="1">全部</option>
                <option value="0.75">约3/4</option>
                <option value="0.5">约1/2</option>
                <option value="0.25">约1/4</option>
                <option value="0">未吃</option>
              </select>
            </label>
            <button class="btn btn-ghost btn-sm" onclick="PageMeal.removeItem(${idx})"><i data-lucide="trash-2"></i>删除</button>
          </div>
          ${item.warnings && item.warnings.length ? `<p style="font-size:0.75rem;color:var(--color-warning);margin-top:6px;"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> ${item.warnings.join('；')}</p>` : ''}
        </div>
      `).join('')}

      <div class="divider"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="PageMeal.saveRecord()"><i data-lucide="save"></i>保存到今日记录</button>
        <button class="btn btn-secondary" onclick="PageMeal.addManualItem()"><i data-lucide="plus"></i>手动添加菜品</button>
      </div>
    `;
  }

  function renderError() {
    return UI.stateView('error', {
      title: '识别服务不可用',
      desc: '本地演示模拟识别服务失败。真实识别服务未接入，此处展示失败降级路径。请选择替代方式继续记录。',
      actions: [
        '<button class="btn btn-primary" onclick="PageMeal.loadDemoCase(0)"><i data-lucide="utensils"></i>使用Demo案例</button>',
        '<button class="btn btn-secondary" onclick="PageMeal.manualTemplate()"><i data-lucide="edit-3"></i>手动模板录入</button>',
        '<a href="#/record/order" class="btn btn-ghost"><i data-lucide="receipt"></i>粘贴订单文字</a>'
      ]
    });
  }

  function renderPermission() {
    return UI.stateView('permission', {
      title: '相机/文件权限不足',
      desc: '需要相机或文件访问权限才能拍照或上传照片。请在浏览器设置中允许此网站访问相机/文件，或使用替代方法。',
      actions: [
        '<button class="btn btn-primary" onclick="PageMeal.loadDemoCase(0)"><i data-lucide="image"></i>从相册选择（Demo）</button>',
        '<button class="btn btn-secondary" onclick="PageMeal.manualTemplate()"><i data-lucide="edit-3"></i>手动输入</button>',
        '<a href="#/record/order" class="btn btn-ghost"><i data-lucide="receipt"></i>订单导入</a>'
      ]
    });
  }

  // ========== 交互方法 ==========
  function startUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.imageData = e.target.result;
      state.phase = 'uploading';
      App.rerender();
      setTimeout(() => {
        // 随机模拟完整/部分/低置信
        const r = Math.random();
        if (r < 0.5) simulateState('complete');
        else if (r < 0.75) simulateState('partial');
        else simulateState('low_conf');
      }, 2000);
    };
    reader.readAsDataURL(file);
  }

  function cancelUpload() {
    state.phase = 'idle';
    state.imageData = null;
    App.rerender();
  }

  function loadDemoCase(idx) {
    state.demoCaseIndex = idx;
    const c = NPV2_DATA.MEAL_DEMO_CASES[idx];
    state.result = JSON.parse(JSON.stringify(c));
    state.imageData = null; // 用emoji占位
    state.phase = 'complete';
    App.rerender();
    UI.toast(`已加载Demo案例：${c.name}`, 'success');
  }

  function simulateState(type) {
    if (type === 'error' || type === 'permission') {
      state.phase = type;
      App.rerender();
      return;
    }
    const c = NPV2_DATA.MEAL_DEMO_CASES[state.demoCaseIndex];
    state.result = JSON.parse(JSON.stringify(c));
    if (type === 'partial') {
      // 降低最后一项置信度
      if (state.result.items.length > 1) {
        state.result.items[state.result.items.length - 1].confidence = 0.45;
        state.result.items[state.result.items.length - 1].warnings = [...(state.result.items[state.result.items.length - 1].warnings || []), '该菜品识别置信度低，建议人工确认'];
      }
    }
    if (type === 'low_conf') {
      state.result.items.forEach(it => { it.confidence = Math.max(0.35, it.confidence - 0.25); });
    }
    state.phase = type;
    App.rerender();
  }

  function updateWeight(idx, val) {
    if (state.result?.items[idx]) {
      state.result.items[idx].estimated_weight_g = parseFloat(val) || 0;
      state.result.items[idx].user_adjustment = { weight_updated: true };
    }
  }

  function updateRatio(idx, val) {
    if (state.result?.items[idx]) {
      state.result.items[idx].consumed_ratio = parseFloat(val);
    }
  }

  function removeItem(idx) {
    if (state.result?.items) {
      state.result.items.splice(idx, 1);
      App.rerender();
      UI.toast('已删除该菜品', 'info');
    }
  }

  function addManualItem() {
    UI.modal('手动添加菜品', `
      <div class="form-group">
        <label class="form-label">菜品名称</label>
        <input class="form-input" id="manualName" placeholder="例如：清炒时蔬">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">估算重量(g)</label>
          <input type="number" class="form-input" id="manualWeight" value="100">
        </div>
        <div class="form-group">
          <label class="form-label">估算热量(kcal)</label>
          <input type="number" class="form-input" id="manualKcal" placeholder="留空则为未知">
        </div>
      </div>
      <p class="form-hint">手动添加的项标记为"用户输入"，来源为用户自行估算。</p>
    `, `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button>
      <button class="btn btn-primary" onclick="PageMeal.confirmManualAdd()">添加</button>
    `);
  }

  function confirmManualAdd() {
    const name = document.getElementById('manualName')?.value;
    const weight = parseFloat(document.getElementById('manualWeight')?.value) || 0;
    const kcal = document.getElementById('manualKcal')?.value;
    if (!name) { UI.toast('请输入菜品名称', 'warning'); return; }
    const item = {
      id: 'manual_' + Date.now(),
      name: name, category: 'manual', estimated_weight_g: weight,
      consumed_ratio: 1, confidence: 0.5,
      calories_kcal: kcal ? { value: parseFloat(kcal), interval: null, value_type: 'user_estimated' } : { value: null, interval: null, value_type: 'unknown' },
      protein_g: { value: null, interval: null, value_type: 'unknown' },
      fat_g: { value: null, interval: null, value_type: 'unknown' },
      carbs_g: { value: null, interval: null, value_type: 'unknown' },
      source_ids: [], value_type: 'user_estimated', warnings: ['用户手动输入，营养信息不完整']
    };
    if (!state.result) state.result = { items: [] };
    state.result.items.push(item);
    document.querySelector('.modal-overlay')?.remove();
    state.phase = state.phase === 'idle' ? 'complete' : state.phase;
    App.rerender();
    UI.toast('已添加菜品', 'success');
  }

  function manualTemplate() {
    loadDemoCase(0);
    UI.toast('已加载手动模板（Demo案例），可编辑修改', 'info');
  }

  function saveRecord() {
    if (!state.result?.items?.length) { UI.toast('没有可保存的菜品', 'warning'); return; }
    const items = state.result.items.map(it => {
      const ratio = it.consumed_ratio ?? 1;
      const scaled = { ...it };
      if (ratio < 1 && it.calories_kcal?.interval) {
        scaled.calories_kcal = {
          value: null,
          interval: { min: Math.round(it.calories_kcal.interval.min * ratio), max: Math.round(it.calories_kcal.interval.max * ratio) },
          value_type: 'estimated'
        };
      }
      return scaled;
    });
    const record = {
      id: 'meal_' + Date.now(),
      source_type: 'meal_photo',
      raw_text: null,
      original_asset_ref: state.imageData ? 'local_image' : null,
      merchant_label: state.result.name || '餐食记录',
      meal_period: new Date().getHours() < 10 ? '早餐' : new Date().getHours() < 14 ? '午餐' : new Date().getHours() < 18 ? '下午茶' : '晚餐',
      items: items,
      status: state.phase === 'partial' ? 'pending_confirmation' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    AppState.addRecord(record);
    UI.toast('已保存到今日记录', 'success');
    setTimeout(() => App.navigate('#/'), 800);
  }

  function reset() {
    state = { phase: 'idle', imageData: null, result: null, demoCaseIndex: 0 };
    App.rerender();
  }

  // 绑定上传事件（在app.js的afterRender中调用）
  function bindEvents() {
    const zone = document.getElementById('mealUpload');
    const input = document.getElementById('mealUpload_input');
    if (zone && input) {
      zone.addEventListener('click', () => input.click());
      input.addEventListener('change', (e) => { if (e.target.files[0]) startUpload(e.target.files[0]); });
      zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
      zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
      zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); if (e.dataTransfer.files[0]) startUpload(e.dataTransfer.files[0]); });
    }
  }

  return { render, loadDemoCase, simulateState, updateWeight, updateRatio, removeItem, addManualItem, confirmManualAdd, manualTemplate, saveRecord, reset, cancelUpload, bindEvents };
})();
