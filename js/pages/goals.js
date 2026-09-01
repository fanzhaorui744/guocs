/* 目标与设置页 */
const PageGoals = (() => {
  function render() {
    const p = AppState.getProfile();
    return `
      <div class="page-header">
        <h1 class="page-title">目标与设置</h1>
        <p class="page-subtitle">日常目标 · 隐私授权 · 数据管理 · 估算边界</p>
        ${UI.demoTags(['demo', 'non-medical'])}
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

  return { render, updateProfile, togglePref, saveProfile, grantConsent, confirmGrant, revokeConsent, exportAll, clearAll };
})();
