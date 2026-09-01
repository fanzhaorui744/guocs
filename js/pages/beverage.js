/* 饮品配置页 - 严格顺序 + 透明杯门控 + 区间/unknown */
const PageBeverage = (() => {
  let state = {
    step: 1, // 1输入源 2候选 3配置确认 4透明杯比例 5结果
    inputText: '',
    imagePreview: null,
    candidates: [],
    selectedCandidate: null,
    config: {
      brand_id: null, sku_id: null, cup_size_id: null, volume_ml: null,
      sugar_level_id: null, ice_level_id: null, toppings: [],
      cup_state: 'unknown', consumed_ratio: null, consumed_ratio_source: null,
      confirmations: { brand: false, sku: false, cup_size: false, sugar_level: false, ice_level: false, toppings: false }
    },
    result: null
  };

  function render() {
    return `
      <div class="page-header">
        <h1 class="page-title">饮品营养配置</h1>
        <p class="page-subtitle">订单/杯贴 → 候选 → 品牌/SKU/杯型/糖度/冰量/小料确认 → 区间或未知</p>
        ${UI.demoTags(['demo', 'not-connected', 'source-low', 'non-medical'])}
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.8125rem;color:var(--color-text-secondary);flex-wrap:wrap;">
          <i data-lucide="info" style="width:16px;height:16px;color:var(--color-primary);"></i>
          <span></span>
        </div>
      </div>

      ${UI.stepper(['输入源', '候选匹配', '配置确认', '比例辅助', '估算结果'], state.step - 1)}

      <div id="beverageContent">
        ${state.step === 1 ? renderStep1() : ''}
        ${state.step === 2 ? renderStep2() : ''}
        ${state.step === 3 ? renderStep3() : ''}
        ${state.step === 4 ? renderStep4() : ''}
        ${state.step === 5 ? renderStep5() : ''}
      </div>
    `;
  }

  function renderStep1() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="file-input"></i>Step 1：输入订单/杯贴信息</div>
          <span class="tag tag-not-connected">OCR未接入</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">上传订单截图/杯贴照片（仅预览）</label>
            ${UI.uploadZone('bevUpload', { icon: 'image', text: '点击上传订单/杯贴照片', hint: '图片仅本地预览，OCR未接入，不会自动识别文字' })}
            <div id="bevImagePreview" class="upload-preview" style="display:none;"></div>
            <p class="form-hint" style="margin-top:8px;"><i data-lucide="alert-triangle" style="width:14px;height:14px;vertical-align:middle;color:var(--color-warning);"></i> 单张奶茶/果茶照片不能直接转换为可靠kcal。必须经过配置确认流程。</p>
          </div>
          <div class="divider"></div>
          <div class="form-group">
            <label class="form-label">粘贴订单文字 <span class="tag tag-demo" style="margin-left:6px;">推荐</span></label>
            <textarea class="form-textarea" id="bevText" placeholder="例如：&#10;清叶茶铺（虚构）&#10;茉莉奶绿 中杯 半糖 少冰 +珍珠">${state.inputText}</textarea>
            <p class="form-hint">从外卖App复制订单详情粘贴，系统用本地关键词匹配产生候选。</p>
          </div>
          <div class="form-group">
            <label class="form-label">快速加载Demo</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="PageBeverage.loadDemo('jasmine')">茉莉奶绿（商家确认）</button>
              <button class="btn btn-secondary btn-sm" onclick="PageBeverage.loadDemo('berry')">莓果茶（估算区间）</button>
              <button class="btn btn-secondary btn-sm" onclick="PageBeverage.loadDemo('unknown')">未知品牌（演示unknown）</button>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <button class="btn btn-primary" onclick="PageBeverage.goStep2()"><i data-lucide="arrow-right"></i>生成候选</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep2() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="search"></i>Step 2：候选匹配（不自动确认）</div>
          <span class="tag tag-demo">本地文本匹配</span>
        </div>
        <div class="card-body">
          <div style="background:var(--color-bg);padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:0.8125rem;">
            <strong>输入文本：</strong><br><span style="color:var(--color-text-secondary);white-space:pre-wrap;">${state.inputText || '(无)'}</span>
          </div>
          ${state.candidates.length === 0 ? `
            ${UI.stateView('unknown', {
              title: '未匹配到候选',
              desc: '文本中未识别到虚构示例目录中的品牌或SKU。可以返回修改文本，或手动选择品牌/SKU。',
              actions: [
                '<button class="btn btn-secondary" onclick="PageBeverage.goStep(1)">返回修改</button>',
                '<button class="btn btn-primary" onclick="PageBeverage.manualSelect()">手动选择品牌/SKU</button>'
              ]
            })}
          ` : `
            <p style="font-size:0.875rem;margin-bottom:12px;">匹配到 <strong>${state.candidates.length}</strong> 个候选，请选择一个（候选不自动确认）：</p>
            <div class="candidate-list">
              ${state.candidates.map((c, i) => `
                <div class="candidate-item ${state.selectedCandidate === i ? 'selected' : ''}" onclick="PageBeverage.selectCandidate(${i})">
                  <div class="candidate-info">
                    <div class="candidate-name">${c.brand_name} · ${c.display_name}</div>
                    <div class="candidate-meta">匹配来源：${c.match_source}</div>
                    <div class="candidate-meta">状态：${c.record_status === 'merchant_confirmed' ? '商家确认' : '估算'} · 可配置：杯型/糖度/冰量/小料</div>
                  </div>
                  <div class="candidate-score">
                    <div class="score-val">${(c.score*100).toFixed(0)}%</div>
                    <div>匹配度</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
          <div style="display:flex;justify-content:space-between;margin-top:16px;">
            <button class="btn btn-secondary" onclick="PageBeverage.goStep(1)">返回</button>
            <button class="btn btn-primary" onclick="PageBeverage.goStep3()" ${state.selectedCandidate === null ? 'disabled' : ''}>确认候选，进入配置<i data-lucide="arrow-right"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep3() {
    const c = state.candidates[state.selectedCandidate];
    if (!c) return '<p>候选丢失，请返回</p>';
    const cfg = state.config;
    const allConfirmed = cfg.confirmations.brand && cfg.confirmations.sku && cfg.confirmations.cup_size && cfg.confirmations.sugar_level && cfg.confirmations.ice_level;

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="settings-2"></i>Step 3：逐项确认配置</div>
          <span class="tag ${allConfirmed ? 'tag-success' : 'tag-pending'}">${allConfirmed ? '配置已确认' : '待确认'}</span>
        </div>
        <div class="card-body">
          <div style="background:var(--color-primary-light);padding:10px 12px;border-radius:6px;margin-bottom:16px;font-size:0.8125rem;">
            <strong>已选候选：</strong>${c.brand_name} · ${c.display_name}
            <span class="tag ${c.record_status==='merchant_confirmed'?'tag-success':'tag-demo-data'}" style="margin-left:6px;">${c.record_status==='merchant_confirmed'?'商家确认':'估算'}</span>
          </div>

          <!-- 品牌确认 -->
          <div class="config-section">
            <div class="config-section-title">
              品牌 ${cfg.confirmations.brand ? '<span class="tag tag-success">已确认</span>' : '<span class="tag tag-pending">待确认</span>'}
            </div>
            <div class="config-options">
              <button class="config-option ${cfg.brand_id===c.brand_id?'selected':''}" onclick="PageBeverage.setBrand('${c.brand_id}','${c.brand_name}')">${c.brand_name}</button>
            </div>
          </div>

          <!-- SKU确认 -->
          <div class="config-section">
            <div class="config-section-title">
              产品/SKU ${cfg.confirmations.sku ? '<span class="tag tag-success">已确认</span>' : '<span class="tag tag-pending">待确认</span>'}
            </div>
            <div class="config-options">
              <button class="config-option ${cfg.sku_id===c.sku_id?'selected':''}" onclick="PageBeverage.setSku('${c.sku_id}','${c.display_name}')">${c.display_name}</button>
            </div>
          </div>

          <!-- 杯型/容量 -->
          <div class="config-section">
            <div class="config-section-title">
              杯型/容量 ${cfg.confirmations.cup_size ? '<span class="tag tag-success">已确认</span>' : '<span class="tag tag-pending">待确认</span>'}
            </div>
            <div class="config-options">
              ${(c.available_configuration?.cup_sizes || []).map(s => `
                <button class="config-option ${cfg.cup_size_id===s.id?'selected':''}" onclick="PageBeverage.setCupSize('${s.id}',${s.ml})">${s.label}（${s.ml}mL）</button>
              `).join('')}
            </div>
          </div>

          <!-- 糖度 -->
          <div class="config-section">
            <div class="config-section-title">
              糖度 ${cfg.confirmations.sugar_level ? '<span class="tag tag-success">已确认</span>' : '<span class="tag tag-pending">待确认</span>'}
            </div>
            <div class="config-options">
              ${(c.available_configuration?.sugar_levels || []).map(s => `
                <button class="config-option ${cfg.sugar_level_id===s.id?'selected':''}" onclick="PageBeverage.setSugar('${s.id}')">${s.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- 冰量 -->
          <div class="config-section">
            <div class="config-section-title">
              冰量 ${cfg.confirmations.ice_level ? '<span class="tag tag-success">已确认</span>' : '<span class="tag tag-pending">待确认</span>'}
            </div>
            <div class="config-options">
              ${(c.available_configuration?.ice_levels || []).map(s => `
                <button class="config-option ${cfg.ice_level_id===s.id?'selected':''}" onclick="PageBeverage.setIce('${s.id}')">${s.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- 小料 -->
          <div class="config-section">
            <div class="config-section-title">
              小料（可多选，不加则跳过）${cfg.toppings.length>0 ? `<span class="tag tag-success">已选${cfg.toppings.length}项</span>` : ''}
            </div>
            <div class="config-options">
              ${(c.available_configuration?.toppings || []).map(t => {
                const selected = cfg.toppings.find(x => x.topping_id === t.topping_id);
                return `<button class="config-option ${selected?'selected':''}" onclick="PageBeverage.toggleTopping('${t.topping_id}','${t.label}')">${t.label}</button>`;
              }).join('')}
              <button class="config-option ${cfg.toppings.length===0?'selected pending':''}" onclick="PageBeverage.clearToppings()">不加小料</button>
            </div>
          </div>

          <!-- 杯体状态 -->
          <div class="config-section">
            <div class="config-section-title">杯体状态（影响是否可输入剩余比例）</div>
            <select class="form-select" style="max-width:320px;" onchange="PageBeverage.setCupState(this.value)">
              <option value="unknown" ${cfg.cup_state==='unknown'?'selected':''}>未知/不适用</option>
              <option value="transparent_open" ${cfg.cup_state==='transparent_open'?'selected':''}>透明+未封口+液面可见</option>
              <option value="sealed" ${cfg.cup_state==='sealed'?'selected':''}>封口杯</option>
              <option value="opaque" ${cfg.cup_state==='opaque'?'selected':''}>不透明杯</option>
            </select>
            <p class="form-hint">仅"透明+未封口+液面可见+可靠初始容量"同时满足时，才允许输入剩余比例作为辅助。封口/不透明杯走整杯计算。</p>
          </div>

          <div style="display:flex;justify-content:space-between;margin-top:16px;">
            <button class="btn btn-secondary" onclick="PageBeverage.goStep(2)">返回</button>
            <button class="btn btn-primary" onclick="PageBeverage.goStep4()" ${!allConfirmed?'disabled':''}>
              ${cfg.cup_state === 'transparent_open' ? '下一步：剩余比例' : '计算估算结果'}<i data-lucide="arrow-right"></i>
            </button>
          </div>
          ${!allConfirmed ? '<p style="font-size:0.8125rem;color:var(--color-accent);margin-top:8px;text-align:right;">请完成品牌、SKU、杯型、糖度、冰量的确认后才能计算</p>' : ''}
        </div>
      </div>
    `;
  }

  function renderStep4() {
    const cfg = state.config;
    const canUseRatio = BeverageEngine.canUseConsumedRatio(cfg);

    if (cfg.cup_state !== 'transparent_open') {
      // 非透明开口杯，直接计算
      return calculateAndShow();
    }

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="droplet"></i>Step 4：剩余比例辅助（可选）</div>
          <span class="tag ${canUseRatio ? 'tag-success' : 'tag-pending'}">${canUseRatio ? '条件满足' : '条件不满足'}</span>
        </div>
        <div class="card-body">
          ${canUseRatio ? `
            <div class="warning-item" style="background:var(--color-success-light);color:var(--color-success);">
              <i data-lucide="check-circle-2"></i>
              <span>条件满足：透明+未封口+液面可见+可靠初始容量（${cfg.volume_ml}mL）。可以输入剩余比例作为辅助输入。</span>
            </div>
            <div class="form-group" style="margin-top:16px;">
              <label class="form-label">实际摄入比例（目测估算）</label>
              <div class="config-options">
                ${[1,0.9,0.75,0.5,0.25].map(r => `
                  <button class="config-option ${cfg.consumed_ratio===r?'selected':''}" onclick="PageBeverage.setConsumedRatio(${r})">${r===1?'整杯':Math.round(r*100)+'%'}</button>
                `).join('')}
              </div>
              <p class="form-hint">剩余比例仅缩放已有依据的营养区间，不改变SKU、杯型、糖度、冰量、小料或serving basis。目测估算可能存在较大偏差。</p>
            </div>
          ` : `
            <div class="warning-item">
              <i data-lucide="alert-triangle"></i>
              <span>条件不满足。封口/不透明/信息不足时，不显示可误解为视觉测量的控件，按整杯计算。</span>
            </div>
          `}
          <div style="display:flex;justify-content:space-between;margin-top:16px;">
            <button class="btn btn-secondary" onclick="PageBeverage.goStep(3)">返回</button>
            <button class="btn btn-primary" onclick="PageBeverage.calculate()"><i data-lucide="calculator"></i>计算估算结果</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep5() {
    if (!state.result) return '<p>无结果</p>';
    const r = state.result;
    return `
      ${UI.resultCard(r)}
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="save"></i>保存记录</div>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">餐次</label>
            <select class="form-select" id="bevMealPeriod" style="max-width:200px;">
              <option value="早餐">早餐</option>
              <option value="午餐">午餐</option>
              <option value="下午茶" selected>下午茶</option>
              <option value="晚餐">晚餐</option>
              <option value="加餐">加餐</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">备注（可选）</label>
            <input class="form-input" id="bevNote" placeholder="例如：实际喝了一半">
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="PageBeverage.saveRecord()"><i data-lucide="save"></i>保存到今日记录</button>
            <button class="btn btn-secondary" onclick="PageBeverage.reset()"><i data-lucide="rotate-ccw"></i>重新配置</button>
            <a href="#/" class="btn btn-ghost">返回总览</a>
          </div>
        </div>
      </div>
    `;
  }

  // ========== 交互方法 ==========
  function loadDemo(type) {
    const demos = {
      jasmine: '清叶茶铺（虚构）\n茉莉奶绿 中杯 半糖 少冰 +珍珠',
      berry: '果研所（虚构）\n满杯红柚 大杯 七分糖 正常冰',
      unknown: '某不知名奶茶店\n招牌奶茶 大杯 全糖'
    };
    state.inputText = demos[type] || '';
    const el = document.getElementById('bevText');
    if (el) el.value = state.inputText;
    UI.toast('已加载Demo文本', 'success');
  }

  function goStep2() {
    const text = document.getElementById('bevText')?.value || state.inputText;
    state.inputText = text;
    if (!text.trim()) { UI.toast('请输入或粘贴订单文字', 'warning'); return; }
    state.candidates = BeverageEngine.matchCandidates(text);
    state.selectedCandidate = null;
    state.step = 2;
    App.rerender();
  }

  function goStep(n) { state.step = n; App.rerender(); }

  function selectCandidate(i) {
    state.selectedCandidate = i;
    const c = state.candidates[i];
    state.config.brand_id = c.brand_id;
    state.config.sku_id = c.sku_id;
    state.config.confirmations.brand = true;
    state.config.confirmations.sku = true;
    App.rerender();
  }

  function manualSelect() {
    // 显示所有品牌供手动选择
    state.candidates = NPV2_DATA.BEVERAGE_CATALOG.slice(0, 12).map(s => ({
      brand_id: s.brand_id, brand_name: s.brand_name, sku_id: s.sku_id,
      display_name: s.display_name, score: 0.3,
      match_source: '手动选择（非文本匹配）',
      record_status: s.record_status, available_configuration: s.available_configuration
    }));
    state.selectedCandidate = null;
    state.step = 2;
    App.rerender();
    UI.toast('请从虚构示例目录中手动选择', 'info');
  }

  function goStep3() {
    if (state.selectedCandidate === null) { UI.toast('请先选择一个候选', 'warning'); return; }
    state.step = 3; App.rerender();
  }

  function setBrand(id, name) {
    state.config.brand_id = id; state.config.confirmations.brand = true; App.rerender();
  }
  function setSku(id, name) {
    state.config.sku_id = id; state.config.confirmations.sku = true; App.rerender();
  }
  function setCupSize(id, ml) {
    state.config.cup_size_id = id; state.config.volume_ml = ml; state.config.confirmations.cup_size = true; App.rerender();
  }
  function setSugar(id) {
    state.config.sugar_level_id = id; state.config.confirmations.sugar_level = true; App.rerender();
  }
  function setIce(id) {
    state.config.ice_level_id = id; state.config.confirmations.ice_level = true; App.rerender();
  }
  function toggleTopping(id, label) {
    const idx = state.config.toppings.findIndex(t => t.topping_id === id);
    if (idx > -1) state.config.toppings.splice(idx, 1);
    else state.config.toppings.push({ topping_id: id, servings: 1 });
    state.config.confirmations.toppings = state.config.toppings.length > 0;
    App.rerender();
  }
  function clearToppings() {
    state.config.toppings = []; state.config.confirmations.toppings = false; App.rerender();
  }
  function setCupState(val) {
    state.config.cup_state = val;
    if (val !== 'transparent_open') { state.config.consumed_ratio = null; state.config.consumed_ratio_source = null; }
    App.rerender();
  }
  function setConsumedRatio(r) {
    state.config.consumed_ratio = r;
    state.config.consumed_ratio_source = 'user_estimate';
    App.rerender();
  }

  function goStep4() {
    const validation = BeverageEngine.validateConfig(state.config);
    if (!validation.complete) { UI.toast(`未确认：${validation.missing.join('、')}`, 'warning'); return; }
    if (state.config.cup_state === 'transparent_open') {
      state.step = 4; App.rerender();
    } else {
      calculate();
    }
  }

  function calculate() {
    const validation = BeverageEngine.validateConfig(state.config);
    // 优先使用08引擎证据门控计算
    const c = state.candidates[state.selectedCandidate];
    const engineRecord = NPV2_DATA.ENGINE_CATALOG.records.find(r =>
      r.brand_id === c?.brand_id && r.sku_id === c?.sku_id
    );
    if (engineRecord && state.config.brand_id && state.config.sku_id) {
      const engine = new EvidenceBeverageEngine(NPV2_DATA.ENGINE_CATALOG);
      const request = {
        brand_id: state.config.brand_id,
        sku_id: state.config.sku_id,
        cup_size_id: state.config.cup_size_id || 'medium',
        sugar_level_id: state.config.sugar_level_id || 'full_sugar',
        ice_level_id: state.config.ice_level_id || 'normal_ice',
        toppings: (state.config.toppings || []).map(t => ({ topping_id: t.id || t, servings: t.servings || 1 })),
        consumed_ratio: state.config.consumed_ratio || 1,
        consumed_ratio_source: state.config.consumed_ratio ? 'user_confirmed' : 'full_serving',
        confirmations: { sugar_level: true, ice_level: true, toppings: true }
      };
      state.result = engine.estimate(request);
      state.result.engine_type = 'evidence_gated';
    } else {
      state.result = BeverageEngine.estimate(state.config);
      state.result.engine_type = 'local_demo';
    }
    state.step = 5;
    App.rerender();
  }

  function calculateAndShow() {
    return calculate();
  }

  function saveRecord() {
    if (!state.result) return;
    const r = state.result;
    const period = document.getElementById('bevMealPeriod')?.value || '下午茶';
    const note = document.getElementById('bevNote')?.value || '';
    const c = state.candidates[state.selectedCandidate];
    const record = {
      id: 'bev_' + Date.now(),
      source_type: 'beverage',
      raw_text: state.inputText,
      original_asset_ref: null,
      merchant_label: c?.brand_name || '饮品记录',
      meal_period: period,
      items: [{
        id: 'bev_item_' + Date.now(),
        name: `${c?.brand_name || ''} ${c?.display_name || ''}`.trim(),
        category: 'beverage',
        estimated_weight_g: null,
        consumed_ratio: state.config.consumed_ratio,
        calories_kcal: r.nutrients.kcal,
        protein_g: r.nutrients.protein_g,
        fat_g: r.nutrients.fat_g,
        carbs_g: r.nutrients.carbs_g,
        sugar_g: r.nutrients.sugar_g,
        confidence: r.confidence,
        source_ids: (r.sources || []).map(s => s.source_id),
        value_type: r.value_type,
        interval: r.nutrients.kcal.interval,
        warnings: r.warnings,
        beverage_config: state.config,
        beverage_result: r,
        note: note
      }],
      status: r.display_mode === 'unknown' ? 'pending_confirmation' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    AppState.addRecord(record);
    UI.toast('饮品记录已保存', 'success');
    setTimeout(() => App.navigate('#/'), 800);
  }

  function reset() {
    state = {
      step: 1, inputText: '', imagePreview: null, candidates: [], selectedCandidate: null,
      config: {
        brand_id: null, sku_id: null, cup_size_id: null, volume_ml: null,
        sugar_level_id: null, ice_level_id: null, toppings: [],
        cup_state: 'unknown', consumed_ratio: null, consumed_ratio_source: null,
        confirmations: { brand: false, sku: false, cup_size: false, sugar_level: false, ice_level: false, toppings: false }
      },
      result: null
    };
    App.rerender();
  }

  function bindEvents() {
    const zone = document.getElementById('bevUpload');
    const input = document.getElementById('bevUpload_input');
    if (zone && input) {
      zone.addEventListener('click', () => input.click());
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.imagePreview = ev.target.result;
          const prev = document.getElementById('bevImagePreview');
          if (prev) {
            prev.style.display = 'block';
            prev.innerHTML = `<img src="${ev.target.result}" alt="订单图片预览" style="max-height:160px;border-radius:8px;margin:0 auto;"><div class="preview-tag tag tag-not-connected">仅预览/OCR未接入</div>`;
          }
          UI.toast('图片已加载（仅预览，OCR未接入）', 'info');
        };
        reader.readAsDataURL(file);
      });
    }
  }

  return { render, loadDemo, goStep2, goStep, selectCandidate, manualSelect, goStep3, setBrand, setSku, setCupSize, setSugar, setIce, toggleTopping, clearToppings, setCupState, setConsumedRatio, goStep4, calculate, saveRecord, reset, bindEvents };
})();
