/* 目标与设置页 */
const PageGoals = (() => {
  function render() {
    const p = AppState.getProfile();
    return `
      <div class="page-header">
        <h1 class="page-title">目标与设置</h1>
        <p class="page-subtitle">日常目标 · AI服务配置 · 隐私授权 · 数据管理 · 估算边界</p>
        ${UI.demoTags(['demo', 'non-medical'])}
      </div>

      <!-- AI 服务配置 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="cpu"></i>AI 服务配置</div>
          <span id="apiStatusTag" class="tag tag-demo">未配置</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">DeepSeek API Key</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="password" class="form-input" id="deepseekApiKey" placeholder="sk-..." value="${localStorage.getItem('deepseek_api_key') || 'sk-0dbe8fdfd39c47f780286ab29f6583a3'}" style="flex:1;">
              <button class="btn btn-secondary btn-sm" id="toggleKeyBtn" onclick="PageGoals.toggleKeyVisibility()" style="flex-shrink:0;" aria-label="显示/隐藏密钥">
                <svg id="eyeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
            <p class="form-hint">演示用 Key 已自动填入，建议替换为您自己的。API Key 仅保存在本地浏览器，不会上传到任何服务器。</p>
          </div>
          <div class="form-group">
            <label class="form-label">API 地址</label>
            <input type="text" class="form-input" id="deepseekApiBase" placeholder="https://api.deepseek.com" value="${localStorage.getItem('deepseek_api_base') || 'https://api.deepseek.com'}">
            <p class="form-hint">默认 https://api.deepseek.com，如使用代理或兼容服务可修改。</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="PageGoals.saveApiConfig()"><i data-lucide="save"></i>保存配置</button>
            <button class="btn btn-secondary" onclick="PageGoals.testApiConnection()"><i data-lucide="zap"></i>测试连接</button>
          </div>
          <div id="apiTestResult" style="margin-top:12px;"></div>
        </div>
      </div>

      <!-- 百度 OCR 配置 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="scan-text"></i>OCR 服务配置（百度智能云）</div>
          <span id="ocrStatusTag" class="tag tag-demo">未配置</span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">API Key</label>
            <input type="text" class="form-input" id="baiduOcrApiKey" placeholder="API Key" value="${localStorage.getItem('baidu_ocr_api_key') || 'bxEEs5XPPC54ucEly0xC9vFy'}">
          </div>
          <div class="form-group">
            <label class="form-label">Secret Key</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="password" class="form-input" id="baiduOcrSecretKey" placeholder="Secret Key" value="${localStorage.getItem('baidu_ocr_secret_key') || '4XTMZfzGxZduKFXBaesKdcVxC7os8jhA'}" style="flex:1;">
              <button class="btn btn-secondary btn-sm" onclick="PageGoals.toggleOcrKeyVisibility()" style="flex-shrink:0;" aria-label="显示/隐藏密钥">
                <svg id="ocrEyeIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">CORS 代理地址</label>
            <input type="text" class="form-input" id="baiduOcrProxy" placeholder="https://api.allorigins.win/raw?url=" value="${localStorage.getItem('baidu_ocr_proxy') || 'https://api.allorigins.win/raw?url='}">
            <p class="form-hint">公共代理仅用于演示，生产环境请使用自有后端代理保护 Secret Key。</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-primary" onclick="PageGoals.saveOcrConfig()"><i data-lucide="save"></i>保存配置</button>
            <button class="btn btn-secondary" onclick="PageGoals.testOcrConnection()"><i data-lucide="zap"></i>测试连接</button>
          </div>
          <div id="ocrTestResult" style="margin-top:12px;"></div>
          <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:10px;">演示用密钥已自动填入。生产环境建议使用后端代理，不要在前端暴露 Secret Key。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="target"></i>日常营养目标</div>
          <span class="tag tag-non-medical">非医疗目标</span>
        </div>
        <div class="card-body">
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-bottom:12px;">以下目标为日常营养管理参考，不是医疗目标。如有特殊健康需求请咨询专业人士。</p>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">目标类型</label>
              <select class="form-select" id="goalType" onchange="PageGoals.updateProfile()">
                <option value="lose" ${p.goal==='lose'?'selected':''}>减脂</option>
                <option value="maintain" ${p.goal==='maintain'?'selected':''}>维持</option>
                <option value="gain" ${p.goal==='gain'?'selected':''}>增肌</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">活动水平</label>
              <select class="form-select" id="activityLevel" onchange="PageGoals.updateProfile()">
                <option value="sedentary" ${p.activity_level==='sedentary'?'selected':''}>久坐</option>
                <option value="light" ${p.activity_level==='light'?'selected':''}>轻度活动</option>
                <option value="moderate" ${p.activity_level==='moderate'?'selected':''}>中度活动</option>
                <option value="active" ${p.activity_level==='active'?'selected':''}>活跃</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">每日热量目标 (kcal)</label><input type="number" class="form-input" id="targetKcal" value="${p.daily_target.kcal}"></div>
            <div class="form-group"><label class="form-label">蛋白质目标 (g)</label><input type="number" class="form-input" id="targetProtein" value="${p.daily_target.protein_g}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">脂肪目标 (g)</label><input type="number" class="form-input" id="targetFat" value="${p.daily_target.fat_g}"></div>
            <div class="form-group"><label class="form-label">碳水目标 (g)</label><input type="number" class="form-input" id="targetCarbs" value="${p.daily_target.carbs_g}"></div>
          </div>
          <div class="form-group">
            <label class="form-label">糖摄入参考上限 (g)</label>
            <input type="number" class="form-input" id="targetSugar" value="${p.daily_target.sugar_g}" style="max-width:200px;">
            <p class="form-hint">WHO建议游离糖摄入不超过总能量10%，约50g/天（2000kcal饮食）。</p>
          </div>
          <div class="form-group">
            <label class="form-label">饮食偏好（多选）</label>
            <div class="config-options">
              ${['少糖','高蛋白','低脂','素食','清真','无麸质'].map(x=>`<button class="config-option ${(p.preferences||[]).includes(x)?'selected':''}" onclick="this.classList.toggle('selected');PageGoals.togglePref('${x}')">${x}</button>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">需避开食材</label>
            <input class="form-input" id="avoidIngredients" value="${(p.avoid_ingredients||[]).join('、')}" placeholder="用顿号分隔，例如：香菜、花生">
          </div>
          <button class="btn btn-primary" onclick="PageGoals.saveProfile()"><i data-lucide="save"></i>保存目标设置</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="shield"></i>隐私与授权</div>
          <span class="tag tag-demo">本地演示</span>
        </div>
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--color-bg);border-radius:8px;margin-bottom:12px;">
            <div>
              <strong>营养师查看授权</strong>
              <div style="font-size:0.8125rem;color:var(--color-text-secondary);">状态：${p.consent_status==='granted'?'已授权（至'+p.consent_expires_at+'）':'未授权'}</div>
            </div>
            ${p.consent_status==='granted'
              ? '<button class="btn btn-danger btn-sm" onclick="PageGoals.revokeConsent()">撤回授权</button>'
              : '<button class="btn btn-primary btn-sm" onclick="PageGoals.grantConsent()">授权营养师查看</button>'}
          </div>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);">授权后，营养师角色可查看结构化营养摘要、趋势、配置变更和用户备注。不包含原始截图、个人身份信息。可随时撤回，撤回后审计记录保留。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="database"></i>数据管理</div>
          <span class="tag tag-demo-data">仅存本机</span>
        </div>
        <div class="card-body">
          <p style="font-size:0.875rem;margin-bottom:12px;">所有数据保存在本机浏览器 localStorage 中，不上传任何服务器。</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" onclick="PageGoals.exportAll()"><i data-lucide="download"></i>导出所有数据</button>
            <button class="btn btn-danger" onclick="PageGoals.clearAll()"><i data-lucide="trash-2"></i>清空所有本地数据</button>
          </div>
          <p style="font-size:0.75rem;color:var(--color-error);margin-top:8px;"><i data-lucide="alert-triangle" style="width:14px;height:14px;vertical-align:middle;"></i> 清空操作不可恢复，请先导出备份。</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="info"></i>估算边界与免责声明</div>
          <span class="tag tag-non-medical">非医疗建议</span>
        </div>
        <div class="card-body" style="font-size:0.875rem;color:var(--color-text-secondary);line-height:1.8;">
          <p>• 所有营养估算为区间值或未知状态，不是精确测量。</p>
          <p>• 单张奶茶/果茶照片不直接转换为kcal，必须经过配置确认。</p>
          <p>• Depth Anything相对深度不作为液体深度使用。</p>
          <p>• null、未知或缺失值不转换为0或默认值，显示"未知/待补充"。</p>
          <p>• 健康输出为日常营养管理参考，不作诊断、治疗或疗效承诺。</p>
          <p>• 未接入真实外卖平台、商家接口、支付、云同步或线上服务。</p>
          <p>• 饮品引擎为本地规则Demo，08引擎尚未接入主页面。</p>
        </div>
      </div>
    `;
  }

  function updateProfile() { /* 实时更新可选 */ }

  function togglePref(pref) {
    const p = AppState.getProfile();
    const idx = (p.preferences || []).indexOf(pref);
    if (idx > -1) p.preferences.splice(idx, 1);
    else p.preferences.push(pref);
    AppState.saveProfile(p);
  }

  function saveProfile() {
    const p = AppState.getProfile();
    p.goal = document.getElementById('goalType').value;
    p.activity_level = document.getElementById('activityLevel').value;
    p.daily_target = {
      kcal: parseInt(document.getElementById('targetKcal').value) || 1800,
      protein_g: parseInt(document.getElementById('targetProtein').value) || 70,
      fat_g: parseInt(document.getElementById('targetFat').value) || 60,
      carbs_g: parseInt(document.getElementById('targetCarbs').value) || 220,
      sugar_g: parseInt(document.getElementById('targetSugar').value) || 50
    };
    p.avoid_ingredients = document.getElementById('avoidIngredients').value.split(/[、,，]/).filter(Boolean);
    p.updated_at = new Date().toISOString().slice(0, 10);
    AppState.saveProfile(p);
    UI.toast('目标设置已保存', 'success');
  }

  function grantConsent() {
    UI.modal('授权营养师查看', `
      <p style="margin-bottom:12px;font-size:0.9375rem;">授权后，营养师角色可查看以下信息：</p>
      <ul style="list-style:disc;padding-left:20px;margin-bottom:16px;font-size:0.875rem;color:var(--color-text-secondary);">
        <li>结构化营养摘要和趋势</li>
        <li>饮品/餐食配置变更记录</li>
        <li>用户备注和反馈</li>
      </ul>
      <p style="font-size:0.8125rem;color:var(--color-text-muted);margin-bottom:12px;">不包含：原始订单截图、个人身份信息、精确健康数据。授权期限30天，可随时撤回。</p>
      <div class="form-group">
        <label class="form-label">授权期限</label>
        <select class="form-select" id="consentDays">
          <option value="7">7天</option>
          <option value="30" selected>30天</option>
          <option value="90">90天</option>
        </select>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button>
      <button class="btn btn-primary" onclick="PageGoals.confirmGrant()">确认授权</button>
    `);
  }

  function confirmGrant() {
    const days = parseInt(document.getElementById('consentDays')?.value) || 30;
    const p = AppState.getProfile();
    p.consent_status = 'granted';
    p.consent_expires_at = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    AppState.saveProfile(p);
    document.querySelector('.modal-overlay')?.remove();
    UI.toast(`已授权营养师查看，期限${days}天`, 'success');
    App.rerender();
  }

  function revokeConsent() {
    UI.confirmDialog('撤回授权', '确定撤回营养师查看授权吗？撤回后营养师将无法查看您的数据，已有审计记录保留。', () => {
      const p = AppState.getProfile();
      p.consent_status = 'revoked';
      p.consent_expires_at = null;
      AppState.saveProfile(p);
      UI.toast('已撤回授权', 'success');
      App.rerender();
    }, '撤回', true);
  }

  function exportAll() {
    const data = {
      export_time: new Date().toISOString(),
      profile: AppState.getProfile(),
      records: AppState.getRecords(),
      note: '本地演示数据完整导出'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `all_data_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('已导出所有数据', 'success');
  }

  function clearAll() {
    UI.confirmDialog('清空所有本地数据', '此操作将删除所有记录、画像和设置，且不可恢复。建议先导出备份。确定继续吗？', () => {
      localStorage.clear();
      AppState.init();
      UI.toast('已清空所有本地数据', 'success');
      App.rerender();
    }, '清空所有数据', true);
  }

  // DeepSeek API 配置
  function toggleKeyVisibility() {
    const input = document.getElementById('deepseekApiKey');
    const icon = document.getElementById('eyeIcon');
    if (input && icon) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.innerHTML = isPassword
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }

  function saveApiConfig() {
    const key = document.getElementById('deepseekApiKey')?.value?.trim();
    const base = document.getElementById('deepseekApiBase')?.value?.trim() || 'https://api.deepseek.com';
    if (key) {
      localStorage.setItem('deepseek_api_key', key);
      localStorage.setItem('deepseek_api_base', base);
      const tag = document.getElementById('apiStatusTag');
      if (tag) { tag.textContent = '已配置'; tag.className = 'tag tag-success'; }
      UI.toast('DeepSeek 配置已保存', 'success');
    } else {
      UI.toast('请输入 API Key', 'warning');
    }
  }

  async function testApiConnection() {
    const resultEl = document.getElementById('apiTestResult');
    if (resultEl) resultEl.innerHTML = '<div style="padding:10px;background:var(--bg-alt);border-radius:8px;font-size:0.8125rem;">正在测试连接...</div>';
    const apiKey = document.getElementById('deepseekApiKey')?.value?.trim() || localStorage.getItem('deepseek_api_key');
    const apiBase = document.getElementById('deepseekApiBase')?.value?.trim() || 'https://api.deepseek.com';
    try {
      const response = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: '你好' }], max_tokens: 10 })
      });
      if (response.ok) {
        if (resultEl) resultEl.innerHTML = '<div style="padding:10px;background:var(--success-light);color:var(--success);border-radius:8px;font-size:0.8125rem;font-weight:600;">✓ 连接成功，API Key 有效</div>';
        UI.toast('DeepSeek 连接成功', 'success');
      } else {
        const err = await response.json().catch(() => ({}));
        if (resultEl) resultEl.innerHTML = `<div style="padding:10px;background:var(--error-light);color:var(--error);border-radius:8px;font-size:0.8125rem;">✗ 连接失败：${response.status} ${err.error?.message || ''}</div>`;
      }
    } catch (e) {
      if (resultEl) resultEl.innerHTML = `<div style="padding:10px;background:var(--error-light);color:var(--error);border-radius:8px;font-size:0.8125rem;">✗ 连接失败：${e.message}</div>`;
    }
  }

  // 百度 OCR 配置
  function toggleOcrKeyVisibility() {
    const input = document.getElementById('baiduOcrSecretKey');
    const icon = document.getElementById('ocrEyeIcon');
    if (input && icon) {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.innerHTML = isPassword
        ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
        : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    }
  }

  function saveOcrConfig() {
    const apiKey = document.getElementById('baiduOcrApiKey')?.value?.trim();
    const secretKey = document.getElementById('baiduOcrSecretKey')?.value?.trim();
    const proxy = document.getElementById('baiduOcrProxy')?.value?.trim() || 'https://api.allorigins.win/raw?url=';
    if (apiKey && secretKey) {
      localStorage.setItem('baidu_ocr_api_key', apiKey);
      localStorage.setItem('baidu_ocr_secret_key', secretKey);
      localStorage.setItem('baidu_ocr_proxy', proxy);
      const tag = document.getElementById('ocrStatusTag');
      if (tag) { tag.textContent = '已配置'; tag.className = 'tag tag-success'; }
      UI.toast('百度 OCR 配置已保存', 'success');
    } else {
      UI.toast('请输入 API Key 和 Secret Key', 'warning');
    }
  }

  async function testOcrConnection() {
    const resultEl = document.getElementById('ocrTestResult');
    if (resultEl) resultEl.innerHTML = '<div style="padding:10px;background:var(--bg-alt);border-radius:8px;font-size:0.8125rem;">正在获取 access_token...</div>';
    const apiKey = document.getElementById('baiduOcrApiKey')?.value?.trim() || localStorage.getItem('baidu_ocr_api_key') || 'bxEEs5XPPC54ucEly0xC9vFy';
    const secretKey = document.getElementById('baiduOcrSecretKey')?.value?.trim() || localStorage.getItem('baidu_ocr_secret_key') || '4XTMZfzGxZduKFXBaesKdcVxC7os8jhA';
    const proxy = document.getElementById('baiduOcrProxy')?.value?.trim() || 'https://api.allorigins.win/raw?url=';
    try {
      const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
      const response = await fetch(proxy + encodeURIComponent(tokenUrl));
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('baidu_access_token', data.access_token);
        localStorage.setItem('baidu_token_time', Date.now().toString());
        if (resultEl) resultEl.innerHTML = `<div style="padding:10px;background:var(--success-light);color:var(--success);border-radius:8px;font-size:0.8125rem;font-weight:600;">✓ 连接成功，access_token 已获取（有效期30天）</div>`;
        UI.toast('百度 OCR 连接成功', 'success');
      } else {
        if (resultEl) resultEl.innerHTML = `<div style="padding:10px;background:var(--error-light);color:var(--error);border-radius:8px;font-size:0.8125rem;">✗ 失败：${data.error_description || '密钥无效'}</div>`;
      }
    } catch (e) {
      if (resultEl) resultEl.innerHTML = `<div style="padding:10px;background:var(--error-light);color:var(--error);border-radius:8px;font-size:0.8125rem;">✗ 失败：${e.message}（代理可能不可用）</div>`;
    }
  }

  return { render, updateProfile, togglePref, saveProfile, grantConsent, confirmGrant, revokeConsent, exportAll, clearAll, toggleKeyVisibility, saveApiConfig, testApiConnection, toggleOcrKeyVisibility, saveOcrConfig, testOcrConnection };
})();
