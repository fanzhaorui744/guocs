/* 订单导入页 */
const PageOrder = (() => {
  let state = { step: 1, rawText: '', imagePreview: null, candidates: [], confirmedItems: [], ocrStatus: 'not_connected' };

  function render() {
    return `
      <div class="page-header">
        <h1 class="page-title">订单导入</h1>
        <p class="page-subtitle">订单截图/小票/杯贴文字或人工输入 → 候选提取 → 逐项确认</p>
        ${UI.demoTags(['demo', 'not-connected', 'pending'])}
      </div>

      ${UI.stepper(['输入源', '候选匹配', '逐项确认', '保存记录'], state.step - 1)}

      <div id="orderContent">
        ${state.step === 1 ? renderStep1() : ''}
        ${state.step === 2 ? renderStep2() : ''}
        ${state.step === 3 ? renderStep3() : ''}
        ${state.step === 4 ? renderStep4() : ''}
      </div>
    `;
  }

  function renderStep1() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="file-text"></i>输入订单信息</div>
          <span class="tag tag-not-connected">OCR未接入</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">上传订单截图/小票/杯贴照片</label>
            ${UI.uploadZone('orderUpload', { icon: 'image', text: '点击上传订单截图', hint: '图片仅本地预览，OCR未接入，不会自动识别文字' })}
            <div id="orderImagePreview" class="upload-preview" style="display:none;"></div>
            <p class="form-hint" style="margin-top:8px;"><i data-lucide="info" style="width:14px;height:14px;vertical-align:middle;"></i> 当前OCR服务未接入，图片仅作预览。请使用下方文字粘贴或手动输入。</p>
          </div>
          <div class="divider"></div>
          <div class="form-group">
            <label class="form-label">粘贴订单文字 <span class="tag tag-demo" style="margin-left:6px;">推荐方式</span></label>
            <textarea class="form-textarea" id="orderText" placeholder="例如：&#10;清叶茶铺（虚构）&#10;茉莉奶绿 中杯 半糖 少冰 +珍珠&#10;四季春茶 大杯 无糖 去冰&#10;合计：¥32">${state.rawText}</textarea>
            <p class="form-hint">从外卖App复制订单详情粘贴到此处，系统将用本地关键词匹配产生候选。</p>
          </div>
          <div class="form-group">
            <label class="form-label">或加载Demo订单文本</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="PageOrder.loadDemo('tea')">茶饮订单Demo</button>
              <button class="btn btn-secondary btn-sm" onclick="PageOrder.loadDemo('meal')">餐食订单Demo</button>
              <button class="btn btn-secondary btn-sm" onclick="PageOrder.loadDemo('mixed')">混合订单Demo</button>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px;">
            <button class="btn btn-primary" onclick="PageOrder.goToStep2()"><i data-lucide="arrow-right"></i>生成候选</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep2() {
    const candidates = state.candidates;
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="search"></i>候选匹配结果</div>
          <span class="tag tag-demo">本地文本匹配</span>
        </div>
        <div class="card-body">
          <div style="background:var(--color-bg);padding:10px 12px;border-radius:6px;margin-bottom:12px;font-size:0.8125rem;">
            <strong>原始文本：</strong><br><span style="color:var(--color-text-secondary);white-space:pre-wrap;">${state.rawText || '(无)'}</span>
          </div>
          ${candidates.length === 0 ? `
            <div class="state-view">
              <div class="state-icon"><i data-lucide="search-x"></i></div>
              <div class="state-title">未匹配到候选</div>
              <div class="state-desc">文本中未识别到已知品牌或SKU。可以返回修改文本，或直接手动添加记录。</div>
              <div class="state-actions">
                <button class="btn btn-secondary" onclick="PageOrder.goToStep(1)">返回修改</button>
                <button class="btn btn-primary" onclick="PageOrder.manualAdd()">手动添加记录</button>
              </div>
            </div>
          ` : `
            <p style="font-size:0.875rem;margin-bottom:12px;">匹配到 <strong>${candidates.length}</strong> 个候选，请选择要确认的项目（可多选）：</p>
            <div class="candidate-list">
              ${candidates.map((c, i) => `
                <div class="candidate-item ${state.confirmedItems.includes(i) ? 'selected' : ''}" onclick="PageOrder.toggleCandidate(${i})">
                  <div class="candidate-info">
                    <div class="candidate-name">${c.brand_name} · ${c.display_name}</div>
                    <div class="candidate-meta">匹配来源：${c.match_source} · 状态：${c.record_status === 'merchant_confirmed' ? '商家确认' : '估算'}</div>
                  </div>
                  <div class="candidate-score">
                    <div class="score-val">${(c.score * 100).toFixed(0)}%</div>
                    <div>匹配度</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
          <div style="display:flex;justify-content:space-between;margin-top:16px;">
            <button class="btn btn-secondary" onclick="PageOrder.goToStep(1)">返回</button>
            <button class="btn btn-primary" onclick="PageOrder.goToStep3()" ${candidates.length === 0 ? 'disabled' : ''}>确认选中项（${state.confirmedItems.length}）<i data-lucide="arrow-right"></i></button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep3() {
    const items = state.confirmedItems.map(i => state.candidates[i]);
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="check-square"></i>逐项确认配置</div>
          <span class="tag tag-pending">待确认</span>
        </div>
        <div class="card-body">
          ${items.map((item, idx) => `
            <div style="border:1px solid var(--color-border);border-radius:10px;padding:14px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <strong>${item.brand_name} · ${item.display_name}</strong>
                <span class="tag ${item.record_status === 'merchant_confirmed' ? 'tag-success' : 'tag-demo-data'}">${item.record_status === 'merchant_confirmed' ? '商家确认' : '估算'}</span>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">杯型/容量 <span class="required">*</span></label>
                  <select class="form-select" id="cup_${idx}" onchange="PageOrder.markConfirmed(${idx},'cup')">
                    <option value="">请选择</option>
                    ${(item.available_configuration?.cup_sizes || []).map(s => `<option value="${s.id}">${s.label}（${s.ml}mL）</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">糖度 <span class="required">*</span></label>
                  <select class="form-select" id="sugar_${idx}" onchange="PageOrder.markConfirmed(${idx},'sugar')">
                    <option value="">请选择</option>
                    ${(item.available_configuration?.sugar_levels || []).map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">冰量 <span class="required">*</span></label>
                  <select class="form-select" id="ice_${idx}" onchange="PageOrder.markConfirmed(${idx},'ice')">
                    <option value="">请选择</option>
                    ${(item.available_configuration?.ice_levels || []).map(s => `<option value="${s.id}">${s.label}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">小料（可多选）</label>
                  <div class="config-options" id="toppings_${idx}">
                    ${(item.available_configuration?.toppings || []).map(t => `
                      <button class="config-option" onclick="this.classList.toggle('selected');PageOrder.markConfirmed(${idx},'toppings')" data-topping="${t.topping_id}">${t.label}</button>
                    `).join('')}
                    <button class="config-option" onclick="this.classList.toggle('selected');PageOrder.markConfirmed(${idx},'toppings')" data-topping="none">不加小料</button>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">杯体状态（影响是否可输入剩余比例）</label>
                <select class="form-select" id="cupstate_${idx}">
                  <option value="unknown">未知/不适用</option>
                  <option value="transparent_open">透明+未封口+液面可见</option>
                  <option value="sealed">封口杯</option>
                  <option value="opaque">不透明杯</option>
                </select>
                <p class="form-hint">仅"透明+未封口+液面可见+可靠初始容量"同时满足时，才允许输入剩余比例作为辅助。</p>
              </div>
            </div>
          `).join('')}
          <div style="display:flex;justify-content:space-between;margin-top:8px;">
            <button class="btn btn-secondary" onclick="PageOrder.goToStep(2)">返回</button>
            <button class="btn btn-primary" onclick="PageOrder.calculateAndSave()"><i data-lucide="calculator"></i>计算并保存</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderStep4() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="check-circle-2"></i>记录已保存</div>
          <span class="tag tag-success">已保存</span>
        </div>
        <div class="card-body" style="text-align:center;padding:24px;">
          <div style="color:var(--color-success);margin-bottom:12px;"><i data-lucide="check-circle-2" style="width:48px;height:48px;"></i></div>
          <p style="font-size:1rem;margin-bottom:8px;">订单记录已保存到本地历史</p>
          <p style="font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:16px;">共 ${state.confirmedItems.length} 项，数据仅存于本机浏览器。</p>
          <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
            <a href="#/history" class="btn btn-primary">查看历史记录</a>
            <a href="#/" class="btn btn-secondary">返回总览</a>
            <button class="btn btn-ghost" onclick="PageOrder.reset()">再记录一单</button>
          </div>
        </div>
      </div>
    `;
  }

  // ========== 交互方法 ==========
  function loadDemo(type) {
    const demos = {
      tea: '清叶茶铺（虚构）\n茉莉奶绿 中杯 半糖 少冰 +珍珠\n四季春茶 大杯 无糖 去冰\n合计：¥32',
      meal: '黄焖鸡米饭（虚构商家）\n黄焖鸡米饭 大份\n加卤蛋\n合计：¥25',
      mixed: '清叶茶铺（虚构）\n珍珠奶茶 大杯 全糖 正常冰\n云雾制茶（虚构）\n芝士奶盖绿茶 中杯 半糖\n合计：¥45'
    };
    state.rawText = demos[type] || '';
    document.getElementById('orderText').value = state.rawText;
    UI.toast('已加载Demo订单文本', 'success');
  }

  function goToStep2() {
    const text = document.getElementById('orderText')?.value || state.rawText;
    state.rawText = text;
    if (!text.trim()) {
      UI.toast('请先输入或粘贴订单文字', 'warning');
      return;
    }
    state.candidates = BeverageEngine.matchCandidates(text);
    // 如果没有饮品候选，也显示空状态（餐食订单走手动添加）
    state.confirmedItems = [];
    state.step = 2;
    App.rerender();
  }

  function goToStep(n) {
    state.step = n;
    App.rerender();
  }

  function goToStep3() {
    if (state.confirmedItems.length === 0) {
      UI.toast('请至少选择一个候选', 'warning');
      return;
    }
    state.step = 3;
    App.rerender();
  }

  function toggleCandidate(idx) {
    const i = state.confirmedItems.indexOf(idx);
    if (i > -1) state.confirmedItems.splice(i, 1);
    else state.confirmedItems.push(idx);
    App.rerender();
  }

  function markConfirmed(idx, field) {
    // 标记字段已确认（简单实现，实际可追踪每个字段）
    UI.toast(`${field === 'cup' ? '杯型' : field === 'sugar' ? '糖度' : field === 'ice' ? '冰量' : '小料'}已选择`, 'info', 1500);
  }

  function manualAdd() {
    UI.toast('手动添加功能：请前往饮品配置或餐食拍照页', 'info');
    App.navigate('#/record/beverage');
  }

  function calculateAndSave() {
    const items = state.confirmedItems.map(i => state.candidates[i]);
    const recordItems = [];
    let allValid = true;

    items.forEach((item, idx) => {
      const cup = document.getElementById(`cup_${idx}`)?.value;
      const sugar = document.getElementById(`sugar_${idx}`)?.value;
      const ice = document.getElementById(`ice_${idx}`)?.value;
      const cupState = document.getElementById(`cupstate_${idx}`)?.value || 'unknown';
      const toppingBtns = document.querySelectorAll(`#toppings_${idx} .config-option.selected`);
      const toppings = Array.from(toppingBtns).map(b => ({ topping_id: b.dataset.topping, servings: 1 })).filter(t => t.topping_id !== 'none');

      if (!cup || !sugar || !ice) {
        allValid = false;
        return;
      }

      const cupSize = (item.available_configuration?.cup_sizes || []).find(s => s.id === cup);
      const config = {
        brand_id: item.brand_id, sku_id: item.sku_id,
        cup_size_id: cup, volume_ml: cupSize?.ml || 500,
        sugar_level_id: sugar, ice_level_id: ice,
        toppings: toppings, cup_state: cupState,
        consumed_ratio: null, consumed_ratio_source: null,
        confirmations: { brand: true, sku: true, cup_size: true, sugar_level: true, ice_level: true, toppings: toppings.length > 0 }
      };
      const result = BeverageEngine.estimate(config);
      recordItems.push({
        id: 'item_' + Date.now() + '_' + idx,
        name: `${item.brand_name} ${item.display_name}`,
        category: 'beverage',
        estimated_weight_g: null,
        consumed_ratio: null,
        calories_kcal: result.nutrients.kcal,
        protein_g: result.nutrients.protein_g,
        fat_g: result.nutrients.fat_g,
        carbs_g: result.nutrients.carbs_g,
        sugar_g: result.nutrients.sugar_g,
        confidence: result.confidence,
        source_ids: (result.sources || []).map(s => s.source_id),
        value_type: result.value_type,
        interval: result.nutrients.kcal.interval,
        warnings: result.warnings,
        beverage_config: config,
        beverage_result: result
      });
    });

    if (!allValid) {
      UI.toast('请完成所有项目的杯型/糖度/冰量选择', 'warning');
      return;
    }

    const record = {
      id: 'order_' + Date.now(),
      source_type: 'order_text',
      raw_text: state.rawText,
      original_asset_ref: state.imagePreview,
      merchant_label: items[0]?.brand_name || '订单记录',
      meal_period: new Date().getHours() < 10 ? '早餐' : new Date().getHours() < 14 ? '午餐' : new Date().getHours() < 18 ? '下午茶' : '晚餐',
      items: recordItems,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    AppState.addRecord(record);
    state.step = 4;
    App.rerender();
    UI.toast('记录已保存到本地历史', 'success');
  }

  function reset() {
    state = { step: 1, rawText: '', imagePreview: null, candidates: [], confirmedItems: [], ocrStatus: 'not_connected' };
    App.rerender();
  }

  return { render, loadDemo, goToStep2, goToStep, goToStep3, toggleCandidate, markConfirmed, manualAdd, calculateAndSave, reset };
})();
