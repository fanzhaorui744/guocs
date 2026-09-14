/* 餐食拍照页 - 视觉定量识别：分割→参照物标定→视角矫正→(深度)→体积→质量→热量 */
const PageMeal = (() => {
  let state = {
    step: 'upload', // upload | recognizing | candidates | detail | saved
    previewImage: null,
    compressedBase64: null,
    imgSize: { w: 1024, h: 1024 },
    candidates: [],
    selectedDish: null,
    weight: 250,
    nutrition: null,
    nutritionLoading: false,
    error: null,
    isMock: false,
    lowConfidence: false,
    measureSummary: null,
    depthStatus: null,
    depthRes: null
  };

  // 快速体验数据：附带视觉定量几何，完整演示“面积→厚度→体积→质量→热量”链路
  const MOCK_DISHES = [
    { name: '宫保鸡丁', probability: '0.88', calorie: '183', measure: { shape: 'dome', areaCm2: 78, thicknessCm: 2.4, volumeCm3: 132, density: 1.02, massG: 135, kcal: 247, kcalRange: [198, 296], depthSource: 'semantic', scaleReliable: true } },
    { name: '白米饭', probability: '0.82', calorie: '116', measure: { shape: 'prism', areaCm2: 96, thicknessCm: 2.0, volumeCm3: 192, density: 0.68, massG: 131, kcal: 152, kcalRange: [122, 182], depthSource: 'semantic', scaleReliable: true } },
    { name: '清炒时蔬', probability: '0.61', calorie: '55', measure: { shape: 'pile', areaCm2: 88, thicknessCm: 2.2, volumeCm3: 116, density: 0.5, massG: 58, kcal: 32, kcalRange: [26, 38], depthSource: 'semantic', scaleReliable: true } }
  ];

  function render() {
    return `
      <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">餐食拍照定量识别</h1>
        <p class="page-subtitle">拍照 → 分割与尺度标定 → 体积估算 → 估重 → 热量与营养</p>
      </div>

      ${state.step === 'upload' ? renderUpload() : ''}
      ${state.step === 'recognizing' ? renderRecognizing() : ''}
      ${state.step === 'candidates' ? renderCandidates() : ''}
      ${state.step === 'detail' ? renderDetail() : ''}
      ${state.step === 'saved' ? renderSaved() : ''}

      ${state.error ? `
        <div style="padding:12px 16px;background:var(--error-light);border:1px solid rgba(192,73,76,0.2);border-radius:var(--radius-md);margin-bottom:16px;">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <i data-lucide="alert-triangle" style="width:18px;height:18px;color:var(--error);flex-shrink:0;margin-top:1px;"></i>
            <div>
              <div style="font-size:0.875rem;font-weight:600;color:var(--error);">${state.error.title}</div>
              <div style="font-size:0.8125rem;color:var(--text-secondary);margin-top:2px;">${state.error.detail}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="layers"></i>其他记录方式</div>
        </div>
        <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="#/record/order" class="btn btn-secondary"><i data-lucide="receipt"></i>订单导入</a>
          <a href="#/record/beverage" class="btn btn-secondary"><i data-lucide="cup-soda"></i>饮品配置</a>
          <button class="btn btn-ghost" onclick="PageMeal.manualInput()"><i data-lucide="edit-3"></i>手动输入菜品名</button>
        </div>
      </div>
      </div>
    `;
  }

  function renderUpload() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="camera"></i>上传餐食照片</div>
          <span class="tag tag-success">视觉定量</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${state.previewImage ? `
            <div style="position:relative;margin-bottom:14px;">
              <img src="${state.previewImage}" style="max-width:100%;max-height:320px;border-radius:var(--radius-md);margin:0 auto;box-shadow:var(--shadow-md);">
              <button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;" onclick="PageMeal.clearImage()"><i data-lucide="x"></i>移除</button>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageMeal.startRecognize()"><i data-lucide="scan-search"></i>开始定量识别</button>
              <button class="btn btn-secondary" onclick="PageMeal.useMockData()"><i data-lucide="play-circle"></i>快速体验</button>
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;">建议俯拍，并在餐盘旁放 1cm 方格纸或一元硬币作为尺度参照，估重更准。</p>
          ` : `
            <div class="upload-zone" id="mealUploadZone" onclick="document.getElementById('mealImageInput').click()" tabindex="0" role="button" aria-label="上传餐食照片">
              <div class="upload-icon"><i data-lucide="camera"></i></div>
              <div class="upload-text">点击或拖拽上传餐食照片</div>
              <div class="upload-hint">支持 JPG/PNG，最大 4MB · 俯拍 + 参照物（1cm网格/硬币）识别更准</div>
              <input type="file" id="mealImageInput" accept="image/*" style="display:none" onchange="PageMeal.handleImage(this.files[0])">
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;text-align:center;">系统将自动分割食物、标定尺度并估算体积与重量，暂无照片也可先体验完整估算流程</p>
            <div style="text-align:center;margin-top:8px;"><button class="btn btn-secondary" onclick="PageMeal.useMockData()"><i data-lucide="play-circle"></i>快速体验定量流程</button></div>
          `}
        </div>
      </div>
    `;
  }

  function renderRecognizing() {
    const steps = ['实例分割', '尺度标定', '视角矫正', '体积/质量估算'];
    const ds = state.depthStatus;
    const depthText = ds ? ds.text : '初始化本地视觉引擎…';
    return `
      <div class="card">
        <div class="state-view">
          <div class="loading-spinner" style="width:48px;height:48px;border-width:3px;"></div>
          <div class="state-title">正在进行视觉定量分析…</div>
          <div class="state-desc">${steps.map((s, i) => `<span style="display:inline-block;margin:2px 6px;padding:3px 10px;border-radius:999px;background:var(--bg-alt);font-size:0.75rem;color:var(--text-secondary);">${i + 1}. ${s}</span>`).join('')}</div>
          <div id="depthProgress" style="margin-top:10px;font-size:0.78rem;color:var(--primary);font-weight:600;">深度感知：${depthText}</div>
          ${ds && ds.preview ? `<img src="${ds.preview}" alt="深度场" style="width:120px;height:120px;object-fit:cover;border-radius:var(--radius-md);margin-top:8px;image-rendering:pixelated;border:1px solid var(--border-light);">` : ''}
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;">首次使用需在本地加载约数十 MB 视觉模型，之后自动缓存；图片仅在本机处理，不上传。</div>
          <div class="state-actions">
            <button class="btn btn-secondary" onclick="PageMeal.cancelRecognize()"><i data-lucide="x"></i>取消</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderCandidates() {
    const allLow = state.candidates.every(c => parseFloat(c.probability) < 0.3);
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="list-checks"></i>识别结果（${state.candidates.length} 项食物）</div>
          <span class="tag tag-success">视觉定量</span>
        </div>
        ${state.measureSummary ? `
          <div style="padding:10px 14px;background:var(--primary-50,#eef6f5);border-radius:var(--radius-md);margin:12px 14px 0;font-size:0.75rem;color:var(--text-secondary);display:flex;gap:14px;flex-wrap:wrap;">
            <span>📐 尺度标定：${refLabel(state.measureSummary.reference_type)}</span>
            <span>🍱 食物数：${state.measureSummary.food_count}（逐块分割）</span>
            <span>🛰 ${state.measureSummary.depth_meta && state.measureSummary.depth_meta.used ? '本地深度场' + (state.measureSummary.depth_meta.device ? '（' + String(state.measureSummary.depth_meta.device).toUpperCase() + '）' : '') : '形状厚度估计'}</span>
            <span>⚖️ 视觉总估重：约 <b>${state.measureSummary.total_mass_g} g</b></span>
            <span>🔥 估算总热量：<b>${state.measureSummary.total_kcal_range ? state.measureSummary.total_kcal_range[0]+'~'+state.measureSummary.total_kcal_range[1] : state.measureSummary.total_kcal} kcal</b></span>
          </div>` : ''}
        ${allLow || state.lowConfidence ? `
          <div style="padding:10px 14px;background:var(--warning-light);border-radius:var(--radius-md);margin:12px 14px 0;">
            <span style="font-size:0.8125rem;color:var(--warning);font-weight:500;">⚠️ 识别置信度较低，建议手动确认或重新拍摄</span>
          </div>` : ''}
        <div class="candidate-list">
          ${state.candidates.map((c, i) => {
            const prob = parseFloat(c.probability);
            const probColor = prob >= 0.7 ? 'var(--success)' : prob >= 0.4 ? 'var(--accent-gold)' : 'var(--accent-coral)';
            const m = c.measure;
            return `
              <div class="candidate-item" style="cursor:default;flex-direction:column;align-items:stretch;gap:8px;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div class="candidate-info" style="flex:1;">
                    <div class="candidate-name">${c.name}</div>
                    <div class="candidate-meta">
                      <span style="color:${probColor};font-weight:700;">置信度 ${Math.round(prob * 100)}%</span>
                      ${c.calorie ? ` · ${c.calorie} kcal/100g` : ''}
                    </div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="PageMeal.selectDish(${i})"><i data-lucide="check"></i>选择</button>
                </div>
                ${m ? `
                  <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.72rem;">
                    <span class="tag" style="background:var(--bg-alt);">占地 ${m.areaCm2} cm²</span>
                    <span class="tag" style="background:var(--bg-alt);">厚 ${m.thicknessCm} cm</span>
                    <span class="tag" style="background:var(--bg-alt);">体积 ${m.volumeCm3} cm³</span>
                    <span class="tag" style="background:var(--bg-alt);">密度 ${m.density} g/cm³</span>
                    <span class="tag tag-success">视觉估重 ≈ ${m.massG} g</span>
                    <span class="tag tag-demo-data">${m.kcalRange ? m.kcalRange[0] + '~' + m.kcalRange[1] : m.kcal} kcal</span>
                  </div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:14px;padding:14px;border-top:1px solid var(--border-light);display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="PageMeal.manualInput()"><i data-lucide="edit-3"></i>手动输入菜品名</button>
          <button class="btn btn-ghost" onclick="PageMeal.backToUpload()"><i data-lucide="rotate-ccw"></i>重新上传</button>
        </div>
      </div>
    `;
  }

  function refLabel(t) {
    return ({ grid1cm: '1cm 标定网格', plate: '标准餐盘', coin: '一元硬币', card: '卡片', chopstick: '筷子', none: '经验视场（建议加参照物）', ref: '参照物' })[t] || '参照物';
  }

  function renderDetail() {
    const dish = state.selectedDish;
    const calorie100g = parseFloat(dish.calorie) || 0;
    const totalKcal = Math.round(calorie100g * state.weight / 100);
    const nut = state.nutrition;
    const m = dish.measure;

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="utensils"></i>${dish.name}</div>
          <span class="tag tag-success">定量结果</span>
        </div>
        <div class="card-body" style="padding:0;">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding:14px;background:var(--bg-alt);border-radius:var(--radius-md);">
            <div><span style="font-size:0.75rem;color:var(--text-muted);">每100g热量</span><div style="font-size:1.25rem;font-weight:800;">${calorie100g || '—'} kcal</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">置信度</span><div style="font-size:1.25rem;font-weight:800;color:var(--primary);">${Math.round(parseFloat(dish.probability) * 100)}%</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">估重</span><div style="font-size:1.25rem;font-weight:800;">${state.weight}g</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">总热量</span><div style="font-size:1.75rem;font-weight:800;color:var(--primary);letter-spacing:-0.02em;">${totalKcal}<span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);"> kcal</span></div></div>
          </div>

          ${m ? renderMeasureChain(m) : ''}

          <div class="form-group" style="margin-top:16px;">
            <label class="form-label">份量确认（视觉估重，可手动修正）</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <button class="config-option ${state.weight===150?'selected':''}" onclick="PageMeal.setWeight(150)">小份 150g</button>
              <button class="config-option ${state.weight===250?'selected':''}" onclick="PageMeal.setWeight(250)">中份 250g</button>
              <button class="config-option ${state.weight===350?'selected':''}" onclick="PageMeal.setWeight(350)">大份 350g</button>
              ${m ? `<button class="config-option selected" onclick="PageMeal.setWeight(${m.massG})">↺ 视觉估重 ${m.massG}g</button>` : ''}
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="number" class="form-input" id="customWeight" value="${state.weight}" style="max-width:140px;" onchange="PageMeal.setWeight(parseInt(this.value)||250)">
              <span style="font-size:0.875rem;color:var(--text-secondary);">g（自定义）</span>
            </div>
          </div>

          <div class="form-group" style="margin-top:16px;">
            <label class="form-label">营养成分（按 ${state.weight}g 估算）</label>
            ${state.nutritionLoading ? `
              <div style="padding:20px;text-align:center;">
                <div class="loading-spinner" style="width:32px;height:32px;border-width:2px;margin:0 auto 10px;"></div>
                <div style="font-size:0.8125rem;color:var(--text-secondary);">正在分析营养成分...</div>
              </div>
            ` : nut ? `
              <div class="nutrition-grid">
                <div class="nutrition-item"><div class="nutrition-label">蛋白质</div><div class="nutrition-value">${(nut.protein_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">脂肪</div><div class="nutrition-value">${(nut.fat_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">碳水</div><div class="nutrition-value">${(nut.carbs_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">糖</div><div class="nutrition-value">${nut.sugar_g ? (nut.sugar_g * state.weight / 100).toFixed(1) : '未知'}${nut.sugar_g?'<span class="nutrition-unit">g</span>':''}</div></div>
                <div class="nutrition-item"><div class="nutrition-label">钠</div><div class="nutrition-value">${nut.sodium_mg ? Math.round(nut.sodium_mg * state.weight / 100) : '未知'}${nut.sodium_mg?'<span class="nutrition-unit">mg</span>':''}</div></div>
                <div class="nutrition-item"><div class="nutrition-label">分析置信度</div><div class="nutrition-value" style="font-size:0.9375rem;">${Math.round((nut.confidence||0.5)*100)}%</div></div>
              </div>
              ${nut.note ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">${nut.note}</p>` : ''}
            ` : `
              <div style="padding:14px;background:var(--bg-alt);border-radius:var(--radius-md);text-align:center;">
                <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:8px;">营养成分暂未获取</p>
                <button class="btn btn-secondary btn-sm" onclick="PageMeal.retryNutrition()"><i data-lucide="refresh-cw"></i>重新分析</button>
              </div>
            `}
          </div>

          <div style="margin-top:16px;">
            <button class="btn btn-primary btn-block" onclick="PageMeal.saveRecord()" ${state.nutritionLoading?'disabled':''}>
              <i data-lucide="save"></i>确认并保存记录
            </button>
            <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:8px;">保存后可在总览和历史记录中查看</p>
          </div>
        </div>
      </div>
    `;
  }

  // 视觉定量推导链（可解释）
  function renderMeasureChain(m) {
    const shapeName = { dome: '穹顶隆起', prism: '等厚柱体', ellipsoid: '椭球体', liquid: '液体圆柱', pile: '不规则堆叠', flat: '薄片状' }[m.shape] || '隆起体';
    return `
      <div style="margin:0 14px;border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;">
        <div style="padding:10px 14px;background:var(--primary-50,#eef6f5);font-size:0.8125rem;font-weight:700;color:var(--primary);display:flex;align-items:center;gap:6px;">
          <i data-lucide="ruler"></i>视觉定量推导
          <span class="tag" style="margin-left:auto;font-size:0.68rem;background:#fff;">深度：${m.depthSource === 'depth_model' ? '深度模型' : '形状语义估计'}</span>
        </div>
        <div style="padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;font-size:0.75rem;color:var(--text-secondary);">
          <div><div style="color:var(--text-muted);">占地面积 S</div><div style="font-weight:700;color:var(--text);">${m.areaCm2} cm²</div></div>
          <div><div style="color:var(--text-muted);">平均厚度 h</div><div style="font-weight:700;color:var(--text);">${m.thicknessCm} cm</div></div>
          <div><div style="color:var(--text-muted);">形状模型</div><div style="font-weight:700;color:var(--text);">${shapeName}</div></div>
          <div><div style="color:var(--text-muted);">体积 V=S·h·k</div><div style="font-weight:700;color:var(--text);">${m.volumeCm3} cm³</div></div>
          <div><div style="color:var(--text-muted);">视密度 ρ</div><div style="font-weight:700;color:var(--text);">${m.density} g/cm³</div></div>
          <div><div style="color:var(--text-muted);">质量 m=V·ρ</div><div style="font-weight:700;color:var(--primary);">≈ ${m.massG} g</div></div>
        </div>
        <div style="padding:8px 14px;border-top:1px dashed var(--border-light);font-size:0.7rem;color:var(--text-muted);">
          热量 = 估重 ÷ 100 × 每100g热量；${m.scaleReliable ? '已用参照物标定尺度，参考误差约 ±20%' : '未检测到参照物，按经验视场估算（约 ±35%），建议加 1cm 网格或硬币'}
        </div>
      </div>
    `;
  }

  function renderSaved() {
    return `
      <div class="card">
        <div class="state-view">
          <div class="state-icon" style="color:var(--success);"><i data-lucide="check-circle-2" style="width:56px;height:56px;"></i></div>
          <div class="state-title">已保存到今日记录</div>
          <div class="state-desc">${state.selectedDish?.name || '菜品'} · ${state.weight}g · 已加入历史记录</div>
          <div class="state-actions">
            <a href="#/" class="btn btn-primary"><i data-lucide="home"></i>查看总览</a>
            <button class="btn btn-secondary" onclick="PageMeal.reset()"><i data-lucide="plus"></i>继续记录</button>
          </div>
        </div>
      </div>
    `;
  }

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
        if (w > h && w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize; }
        else if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        state.previewImage = e.target.result;
        state.compressedBase64 = canvas.toDataURL('image/jpeg', 0.85).replace('data:image/jpeg;base64,', '');
        state.imgSize = { w, h };
        state.error = null;
        App.rerender();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    state.previewImage = null; state.compressedBase64 = null; state.step = 'upload'; App.rerender();
  }
  function backToUpload() {
    state.step = 'upload'; state.candidates = []; state.measureSummary = null; state.error = null; App.rerender();
  }

  // 把视觉定量结果映射为候选列表
  function mapMeasure(data) {
    return data.items.map(it => ({
      name: it.name,
      probability: String(it.confidence / 100),
      calorie: String(it.kcal_per_100g || ''),
      measure: {
        shape: it.shape, areaCm2: it.area_cm2, thicknessCm: it.thickness_cm, volumeCm3: it.volume_cm3,
        density: it.density_g_cm3, massG: it.mass_g, kcal: it.kcal, kcalRange: it.kcal_range,
        depthSource: it.depth_source, scaleReliable: it.scale_reliable
      }
    }));
  }

  async function startRecognize() {
    if (!state.compressedBase64) { UI.toast('请先上传图片', 'warning'); return; }
    state.error = null; state.step = 'recognizing'; state.isMock = false;
    state.depthStatus = { active: true, text: '初始化本地视觉引擎…', device: null, preview: null, failed: false };
    state.depthRes = null;
    App.rerender();

    const dataUri = 'data:image/jpeg;base64,' + state.compressedBase64;
    // 浏览器端相对深度 与 多模态实例分割 并行，缩短等待
    const depthP = (typeof DepthWeb !== 'undefined')
      ? DepthWeb.estimate(dataUri, (txt) => tickDepth(txt)).catch(e => ({ ok: false, error: String((e && e.message) || e) }))
      : Promise.resolve({ ok: false });
    const rawP = Recognize.measureRaw(state.compressedBase64);
    const [depthRes, rawRes] = await Promise.all([depthP, rawP]);

    state.depthRes = (depthRes && depthRes.ok) ? depthRes : null;
    if (state.depthRes) {
      tickDepth('深度场计算完成（' + String(state.depthRes.device || '').toUpperCase() + '，' + state.depthRes.ms + 'ms）', state.depthRes.preview, state.depthRes.device);
    } else {
      tickDepth('本地深度未启用，改用形状厚度估计', null, null, true);
    }

    if (rawRes.success) {
      const mr = Recognize.analyzeMeasure(rawRes.raw, state.imgSize.w, state.imgSize.h, state.depthRes);
      if (mr.success) {
        state.candidates = mapMeasure(mr.data);
        state.measureSummary = mr.data;
        state.lowConfidence = state.candidates.every(c => parseFloat(c.probability) < 0.3);
        state.step = 'candidates';
        UI.toast(`定量分析完成：${mr.data.food_count} 项食物，估重约 ${mr.data.total_mass_g}g`, 'success');
        App.rerender();
        return;
      }
    }
    // 兜底：仅类型识别（用户手动给克重）
    const dr = await Recognize.dish(state.compressedBase64);
    if (dr.success) {
      state.candidates = dr.results;
      state.measureSummary = null;
      state.lowConfidence = dr.results.every(c => parseFloat(c.probability) < 0.3);
      state.step = 'candidates';
      UI.toast('已完成类型识别，可手动确认份量', 'info');
    } else {
      state.error = { title: '识别失败', detail: '可重试、重新拍摄，或使用"快速体验"查看完整流程。' };
      state.step = 'upload';
    }
    App.rerender();
  }

  function tickDepth(text, preview, device, failed) {
    if (!state.depthStatus) state.depthStatus = { active: true };
    state.depthStatus.text = text;
    if (preview) state.depthStatus.preview = preview;
    if (device) state.depthStatus.device = device;
    if (failed) state.depthStatus.failed = true;
    const el = document.getElementById('depthProgress');
    if (el) el.textContent = '深度感知：' + text;
  }

  function cancelRecognize() { state.step = 'upload'; App.rerender(); }

  function useMockData() {
    state.candidates = MOCK_DISHES.map(d => ({ ...d }));
    state.isMock = true; state.lowConfidence = false;
    state.measureSummary = {
      reference_type: 'grid1cm', food_count: MOCK_DISHES.length,
      total_mass_g: MOCK_DISHES.reduce((a, b) => a + b.measure.massG, 0),
      total_kcal: MOCK_DISHES.reduce((a, b) => a + b.measure.kcal, 0),
      total_kcal_range: [MOCK_DISHES.reduce((a, b) => a + b.measure.kcalRange[0], 0), MOCK_DISHES.reduce((a, b) => a + b.measure.kcalRange[1], 0)]
    };
    state.step = 'candidates'; state.error = null;
    UI.toast('已载入体验数据（含视觉定量推导）', 'info');
    App.rerender();
  }

  async function loadNutrition(dishName) {
    state.nutritionLoading = true; App.rerender();
    const result = await Recognize.nutrition(dishName);
    if (result.success) state.nutrition = result.data;
    state.nutritionLoading = false; App.rerender();
  }

  function selectDish(index) {
    state.selectedDish = state.candidates[index];
    state.weight = state.selectedDish.measure ? state.selectedDish.measure.massG : 250;
    state.nutrition = null; state.step = 'detail';
    App.rerender();
    loadNutrition(state.selectedDish.name);
  }
  function retryNutrition() { if (state.selectedDish) loadNutrition(state.selectedDish.name); }
  function setWeight(w) { state.weight = w; App.rerender(); }

  function manualInput() {
    const name = prompt('请输入菜品名称：');
    if (name && name.trim()) {
      state.selectedDish = { name: name.trim(), probability: '0.5', calorie: '0' };
      state.isMock = true; state.weight = 250; state.nutrition = null; state.step = 'detail';
      App.rerender();
      loadNutrition(name.trim());
    }
  }

  function saveRecord() {
    const dish = state.selectedDish;
    if (!dish) return;
    const calorie100g = parseFloat(dish.calorie) || 0;
    const totalKcal = Math.round(calorie100g * state.weight / 100);
    const now = new Date();
    const hour = now.getHours();
    const period = hour >= 6 && hour < 10 ? 'breakfast' : hour >= 11 && hour < 14 ? 'lunch' : hour >= 17 && hour < 21 ? 'dinner' : 'snack';
    const nut = state.nutrition;
    const m = dish.measure;
    const record = {
      id: 'meal_' + Date.now(),
      source_type: state.isMock ? 'demo_mock' : 'smart_recognize',
      merchant_label: dish.name,
      meal_period: period,
      visual_measure: m ? {
        area_cm2: m.areaCm2, thickness_cm: m.thicknessCm, volume_cm3: m.volumeCm3,
        density_g_cm3: m.density, mass_g: m.massG, shape: m.shape, depth_source: m.depthSource
      } : null,
      items: [{
        id: 'item_' + Math.random().toString(36).slice(2),
        name: dish.name, category: 'meal',
        estimated_weight_g: state.weight, consumed_ratio: 1,
        calories_kcal: { value: totalKcal, interval: m && m.kcalRange ? { min: Math.round(calorie100g * m.kcalRange[0] / Math.max(m.kcal, 1) * state.weight / 100), max: totalKcal } : null, value_type: 'estimated' },
        protein_g: nut ? { value: parseFloat((nut.protein_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        fat_g: nut ? { value: parseFloat((nut.fat_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        carbs_g: nut ? { value: parseFloat((nut.carbs_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        sugar_g: nut && nut.sugar_g ? { value: parseFloat((nut.sugar_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        sodium_mg: nut && nut.sodium_mg ? { value: Math.round(nut.sodium_mg * state.weight / 100), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        confidence: parseFloat(dish.probability) || 0.5,
        source_ids: [], value_type: 'estimated',
        warnings: [m ? '视觉定量估算：分割标定→体积→估重，结果可手动修正' : '智能识别结果，按每100g参考值×份量估算']
      }],
      status: 'confirmed',
      created_at: now.toISOString(), updated_at: now.toISOString()
    };
    const records = AppState.getRecords();
    records.push(record);
    AppState.setRecords(records);
    state.step = 'saved';
    UI.toast(`已保存：${dish.name} ${state.weight}g / ${totalKcal} kcal`, 'success');
    App.rerender();
  }

  function reset() {
    state = { step: 'upload', previewImage: null, compressedBase64: null, imgSize: { w: 1024, h: 1024 }, candidates: [], selectedDish: null, weight: 250, nutrition: null, nutritionLoading: false, error: null, isMock: false, lowConfidence: false, measureSummary: null, depthStatus: null, depthRes: null };
    App.rerender();
  }

  return { render, handleImage, clearImage, startRecognize, cancelRecognize, useMockData, selectDish, retryNutrition, setWeight, manualInput, saveRecord, reset, backToUpload };
})();
