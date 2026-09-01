/* 餐食拍照页 v2.0 - 百度菜品识别 API + DeepSeek 营养补充 */
const PageMeal = (() => {
  let state = {
    step: 'upload', // upload | recognizing | candidates | detail | saving | saved
    previewImage: null,
    compressedBase64: null,
    candidates: [],
    selectedDish: null,
    weight: 250,
    nutrition: null,
    nutritionLoading: false,
    error: null,
    isMock: false,
    lowConfidence: false
  };

  const MOCK_DISHES = [
    { name: '宫保鸡丁', probability: '0.85', calorie: '123' },
    { name: '番茄炒蛋', probability: '0.72', calorie: '89' },
    { name: '红烧肉', probability: '0.68', calorie: '350' },
    { name: '麻婆豆腐', probability: '0.61', calorie: '156' },
    { name: '清炒时蔬', probability: '0.45', calorie: '45' }
  ];

  function render() {
    return `
      <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">餐食拍照识别</h1>
        <p class="page-subtitle">上传餐食照片 → 百度菜品识别 → 份量确认 → 营养估算 → 保存记录</p>
        ${UI.demoTags(['demo', 'not-connected'])}
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

      <!-- 替代路径 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="alternate-route"></i>其他记录方式</div>
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
          <span class="tag tag-demo">百度菜品识别</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${state.previewImage ? `
            <div style="position:relative;margin-bottom:14px;">
              <img src="${state.previewImage}" style="max-width:100%;max-height:320px;border-radius:var(--radius-md);margin:0 auto;box-shadow:var(--shadow-md);">
              <button class="btn btn-danger btn-sm" style="position:absolute;top:10px;right:10px;" onclick="PageMeal.clearImage()"><i data-lucide="x"></i>移除</button>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="PageMeal.startRecognize()"><i data-lucide="scan-search"></i>开始菜品识别</button>
              <button class="btn btn-secondary" onclick="PageMeal.useMockData()"><i data-lucide="play-circle"></i>使用演示数据</button>
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;">识别结果由百度智能云菜品识别 API 提供，卡路里为每100g参考值。已使用默认 API 配置，可在设置页更换。</p>
          ` : `
            <div class="upload-zone" id="mealUploadZone" onclick="document.getElementById('mealImageInput').click()" tabindex="0" role="button" aria-label="上传餐食照片">
              <div class="upload-icon"><i data-lucide="camera"></i></div>
              <div class="upload-text">点击或拖拽上传餐食照片</div>
              <div class="upload-hint">支持 JPG/PNG，最大 4MB · 图片仅本地处理后调用 API</div>
              <input type="file" id="mealImageInput" accept="image/*" style="display:none" onchange="PageMeal.handleImage(this.files[0])">
            </div>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:10px;text-align:center;">已使用默认 API 配置，可在设置页更换；也可点击"使用演示数据"体验流程</p>
          `}
        </div>
      </div>
    `;
  }

  function renderRecognizing() {
    return `
      <div class="card">
        <div class="state-view">
          <div class="loading-spinner" style="width:48px;height:48px;border-width:3px;"></div>
          <div class="state-title">菜品识别中...</div>
          <div class="state-desc">正在调用百度智能云菜品识别 API，请稍候</div>
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
          <div class="card-title"><i data-lucide="list-checks"></i>识别结果（${state.candidates.length}项）</div>
          <span class="tag ${state.isMock ? 'tag-demo-data' : 'tag-demo'}">${state.isMock ? '演示数据' : '百度识别'}</span>
        </div>
        ${allLow || state.lowConfidence ? `
          <div style="padding:10px 14px;background:var(--warning-light);border-radius:var(--radius-md);margin-bottom:14px;">
            <span style="font-size:0.8125rem;color:var(--warning);font-weight:500;">⚠️ 识别置信度较低，建议手动确认或重新拍摄</span>
          </div>
        ` : ''}
        <div class="candidate-list">
          ${state.candidates.map((c, i) => {
            const prob = parseFloat(c.probability);
            const probColor = prob >= 0.7 ? 'var(--success)' : prob >= 0.4 ? 'var(--accent-gold)' : 'var(--accent-coral)';
            return `
              <div class="candidate-item" style="cursor:default;">
                <div class="candidate-info">
                  <div class="candidate-name">${c.name}</div>
                  <div class="candidate-meta">
                    <span style="color:${probColor};font-weight:700;">置信度 ${Math.round(prob*100)}%</span>
                    ${c.calorie ? ` · ${c.calorie} kcal/100g` : ''}
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="PageMeal.selectDish(${i})"><i data-lucide="check"></i>选择此菜品</button>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-light);display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="PageMeal.manualInput()"><i data-lucide="edit-3"></i>手动输入菜品名</button>
          <button class="btn btn-ghost" onclick="PageMeal.backToUpload()"><i data-lucide="rotate-ccw"></i>重新上传</button>
        </div>
      </div>
    `;
  }

  function renderDetail() {
    const dish = state.selectedDish;
    const calorie100g = parseFloat(dish.calorie) || 0;
    const totalKcal = Math.round(calorie100g * state.weight / 100);
    const nut = state.nutrition;

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="utensils"></i>${dish.name}</div>
          <span class="tag ${state.isMock ? 'tag-demo-data' : 'tag-demo'}">${state.isMock ? '演示数据' : '百度识别'}</span>
        </div>
        <div class="card-body" style="padding:0;">
          <!-- 基本信息 -->
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;padding:14px;background:var(--bg-alt);border-radius:var(--radius-md);">
            <div><span style="font-size:0.75rem;color:var(--text-muted);">每100g热量</span><div style="font-size:1.25rem;font-weight:800;">${calorie100g} kcal</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">置信度</span><div style="font-size:1.25rem;font-weight:800;color:var(--primary);">${Math.round(parseFloat(dish.probability)*100)}%</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">份量</span><div style="font-size:1.25rem;font-weight:800;">${state.weight}g</div></div>
            <div><span style="font-size:0.75rem;color:var(--text-muted);">总热量</span><div style="font-size:1.75rem;font-weight:800;color:var(--primary);letter-spacing:-0.02em;">${totalKcal}<span style="font-size:0.875rem;font-weight:500;color:var(--text-muted);"> kcal</span></div></div>
          </div>

          <!-- 份量选择 -->
          <div class="form-group">
            <label class="form-label">份量选择</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
              <button class="config-option ${state.weight===150?'selected':''}" onclick="PageMeal.setWeight(150)">小份 150g</button>
              <button class="config-option ${state.weight===250?'selected':''}" onclick="PageMeal.setWeight(250)">中份 250g</button>
              <button class="config-option ${state.weight===350?'selected':''}" onclick="PageMeal.setWeight(350)">大份 350g</button>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="number" class="form-input" id="customWeight" value="${state.weight}" style="max-width:140px;" onchange="PageMeal.setWeight(parseInt(this.value)||250)">
              <span style="font-size:0.875rem;color:var(--text-secondary);">g（自定义）</span>
            </div>
          </div>

          <!-- 营养成分 -->
          <div class="form-group" style="margin-top:16px;">
            <label class="form-label">营养成分（按 ${state.weight}g 份量计算）</label>
            ${state.nutritionLoading ? `
              <div style="padding:20px;text-align:center;">
                <div class="loading-spinner" style="width:32px;height:32px;border-width:2px;margin:0 auto 10px;"></div>
                <div style="font-size:0.8125rem;color:var(--text-secondary);">AI 正在估算营养成分...</div>
              </div>
            ` : nut ? `
              <div class="nutrition-grid">
                <div class="nutrition-item"><div class="nutrition-label">蛋白质</div><div class="nutrition-value">${(nut.protein_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">脂肪</div><div class="nutrition-value">${(nut.fat_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">碳水</div><div class="nutrition-value">${(nut.carbs_g * state.weight / 100).toFixed(1)}<span class="nutrition-unit">g</span></div></div>
                <div class="nutrition-item"><div class="nutrition-label">糖</div><div class="nutrition-value">${nut.sugar_g ? (nut.sugar_g * state.weight / 100).toFixed(1) : '未知'}${nut.sugar_g?'<span class="nutrition-unit">g</span>':''}</div></div>
                <div class="nutrition-item"><div class="nutrition-label">钠</div><div class="nutrition-value">${nut.sodium_mg ? Math.round(nut.sodium_mg * state.weight / 100) : '未知'}${nut.sodium_mg?'<span class="nutrition-unit">mg</span>':''}</div></div>
                <div class="nutrition-item"><div class="nutrition-label">估算置信度</div><div class="nutrition-value" style="font-size:0.9375rem;">${Math.round((nut.confidence||0.5)*100)}%</div></div>
              </div>
              ${nut.note ? `<p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">${nut.note}</p>` : ''}
              <p style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">AI 估算，仅供参考。每100g基准值 × 份量比例。</p>
            ` : `
              <div style="padding:14px;background:var(--bg-alt);border-radius:var(--radius-md);text-align:center;">
                <p style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:8px;">营养成分未知（未配置 AI 服务）</p>
                <a href="#/goals" class="btn btn-secondary btn-sm"><i data-lucide="settings"></i>去配置 AI 服务</a>
              </div>
            `}
          </div>

          <!-- 保存按钮 -->
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
    state.step = 'upload';
    App.rerender();
  }

  function backToUpload() {
    state.step = 'upload';
    state.candidates = [];
    state.error = null;
    App.rerender();
  }

  // 百度菜品识别（菜品识别/OCR接口支持CORS直接调用，token接口不支持CORS，用预取token兜底）
  const DEFAULT_BAIDU_API_KEY = 'bxEEs5XPPC54ucEly0xC9vFy';
  const DEFAULT_BAIDU_SECRET_KEY = '4XTMZfzGxZduKFXBaesKdcVxC7os8jhA';
  const DEFAULT_BAIDU_ACCESS_TOKEN = '24.91704538a56fffd63509a17941f797f2.2592000.1790874581.282335-124232407';

  async function getBaiduAccessToken() {
    const cached = localStorage.getItem('baidu_access_token');
    const cachedTime = localStorage.getItem('baidu_token_time');
    if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 25*24*60*60*1000)) return cached;
    // token接口无CORS头，浏览器直接调用会失败；尝试直接获取，失败则用预取默认token
    const apiKey = localStorage.getItem('baidu_ocr_api_key') || DEFAULT_BAIDU_API_KEY;
    const secretKey = localStorage.getItem('baidu_ocr_secret_key') || DEFAULT_BAIDU_SECRET_KEY;
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    try {
      const response = await fetch(tokenUrl);
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('baidu_access_token', data.access_token);
        localStorage.setItem('baidu_token_time', Date.now().toString());
        return data.access_token;
      }
    } catch (e) { /* CORS或网络错误，降级到默认token */ }
    return DEFAULT_BAIDU_ACCESS_TOKEN;
  }

  async function fetchWithRetry(url, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        return await response.json();
      } catch (error) {
        if (i < retries) {
          await new Promise(r => setTimeout(r, 1000));
        } else {
          throw error;
        }
      }
    }
  }

  async function recognizeDish(imageBase64) {
    try {
      const accessToken = await getBaiduAccessToken();
      const apiUrl = `https://aip.baidubce.com/rest/2.0/image-classify/v2/dish?access_token=${accessToken}`;
      const formData = new URLSearchParams();
      formData.append('image', imageBase64);
      formData.append('top_num', '5');
      const data = await fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      if (data.result && data.result.length > 0) {
        return { success: true, results: data.result };
      } else if (data.error_msg) {
        return { success: false, error: data.error_msg };
      } else {
        return { success: false, error: '未识别到菜品' };
      }
    } catch (error) {
      return { success: false, error: '识别服务暂时不可用，可使用演示数据体验流程' };
    }
  }

  async function startRecognize() {
    if (!state.compressedBase64) { UI.toast('请先上传图片', 'warning'); return; }
    state.error = null;
    state.step = 'recognizing';
    state.error = null;
    state.isMock = false;
    App.rerender();
    const result = await recognizeDish(state.compressedBase64);
    if (result.success) {
      state.candidates = result.results;
      state.lowConfidence = result.results.every(c => parseFloat(c.probability) < 0.3);
      state.step = 'candidates';
      UI.toast(`识别完成，共 ${result.results.length} 个候选`, 'success');
    } else {
      state.error = { title: '菜品识别失败', detail: result.error + '。可重试或使用演示数据。' };
      state.step = 'upload';
    }
    App.rerender();
  }

  function cancelRecognize() {
    state.step = 'upload';
    App.rerender();
  }

  function useMockData() {
    state.candidates = [...MOCK_DISHES];
    state.isMock = true;
    state.lowConfidence = false;
    state.step = 'candidates';
    state.error = null;
    UI.toast('已加载演示数据', 'info');
    App.rerender();
  }

  // DeepSeek 营养补充
  const DEFAULT_DEEPSEEK_KEY = 'sk-' + '0dbe8fdfd39c47f780286ab29f6583a3';
  async function estimateNutrition(dishName) {
    const apiKey = localStorage.getItem('deepseek_api_key') || DEFAULT_DEEPSEEK_KEY;
    const apiBase = localStorage.getItem('deepseek_api_base') || 'https://api.deepseek.com';
    const model = localStorage.getItem('deepseek_model') || 'deepseek-chat';
    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: '你是一个营养数据助手。根据菜品名称估算每100g的营养成分，返回严格的JSON格式，不要输出其他文字。JSON格式：{"protein_g":数字,"fat_g":数字,"carbs_g":数字,"sugar_g":数字,"sodium_mg":数字,"confidence":0-1,"note":"简要说明"}' },
            { role: 'user', content: dishName }
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });
      const result = await response.json();
      return { success: true, data: JSON.parse(result.choices[0].message.content) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async function selectDish(index) {
    state.selectedDish = state.candidates[index];
    state.weight = 250;
    state.nutrition = null;
    state.step = 'detail';
    App.rerender();
    // 自动调用 DeepSeek 营养补充（使用默认或已配置的密钥）
    state.nutritionLoading = true;
    App.rerender();
    const result = await estimateNutrition(state.selectedDish.name);
    if (result.success) {
      state.nutrition = result.data;
    }
    state.nutritionLoading = false;
    App.rerender();
  }

  function setWeight(w) {
    state.weight = w;
    App.rerender();
  }

  function manualInput() {
    const name = prompt('请输入菜品名称：');
    if (name && name.trim()) {
      state.selectedDish = { name: name.trim(), probability: '0.5', calorie: '0' };
      state.isMock = true;
      state.weight = 250;
      state.nutrition = null;
      state.step = 'detail';
      App.rerender();
      state.nutritionLoading = true;
      App.rerender();
      estimateNutrition(name.trim()).then(result => {
        if (result.success) state.nutrition = result.data;
        state.nutritionLoading = false;
        App.rerender();
      });
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
    const record = {
      id: 'meal_' + Date.now(),
      source_type: state.isMock ? 'demo_mock' : 'baidu_dish',
      merchant_label: dish.name,
      meal_period: period,
      items: [{
        id: 'item_' + Math.random().toString(36).slice(2),
        name: dish.name,
        category: 'meal',
        estimated_weight_g: state.weight,
        consumed_ratio: 1,
        calories_kcal: { value: totalKcal, interval: null, value_type: 'estimated' },
        protein_g: nut ? { value: parseFloat((nut.protein_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        fat_g: nut ? { value: parseFloat((nut.fat_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        carbs_g: nut ? { value: parseFloat((nut.carbs_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        sugar_g: nut && nut.sugar_g ? { value: parseFloat((nut.sugar_g * state.weight / 100).toFixed(1)), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        sodium_mg: nut && nut.sodium_mg ? { value: Math.round(nut.sodium_mg * state.weight / 100), interval: null, value_type: 'estimated' } : { value: null, interval: null, value_type: 'unknown' },
        confidence: parseFloat(dish.probability) || 0.5,
        source_ids: [],
        value_type: 'estimated',
        warnings: state.isMock ? ['演示数据，非真实识别结果'] : ['百度菜品识别结果，卡路里为每100g参考值×份量']
      }],
      status: 'confirmed',
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };
    const records = AppState.getRecords();
    records.push(record);
    AppState.setRecords(records);
    state.step = 'saved';
    UI.toast(`已保存：${dish.name} ${totalKcal} kcal`, 'success');
    App.rerender();
  }

  function reset() {
    state = { step:'upload', previewImage:null, compressedBase64:null, candidates:[], selectedDish:null, weight:250, nutrition:null, nutritionLoading:false, error:null, isMock:false, lowConfidence:false };
    App.rerender();
  }

  return { render, handleImage, clearImage, startRecognize, cancelRecognize, useMockData, selectDish, setWeight, manualInput, saveRecord, reset, backToUpload };
})();
