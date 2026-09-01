/* 营养师复核页 */
const PageNutritionist = (() => {
  let selectedConsent = null;

  function render() {
    const profile = AppState.getProfile();
    const queue = NPV2_DATA.NUTRITIONIST_QUEUE;

    return `
      <div class="page-header">
        <h1 class="page-title">营养师复核</h1>
        <p class="page-subtitle">授权摘要 · 核对清单 · 建议备注 · 审计记录</p>
        ${UI.demoTags(['demo', 'non-medical', 'pending'])}
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.8125rem;color:var(--color-text-secondary);flex-wrap:wrap;">
          <i data-lucide="stethoscope" style="width:16px;height:16px;color:var(--color-primary);"></i>
          <span>当前角色：营养师（本地演示）· 身份/资质：<strong>待配置</strong> · 不代表真实合作营养师或专业团队已入驻</span>
        </div>
      </div>

      ${profile.consent_status !== 'granted' ? `
        <div class="card" style="border-color:var(--color-warning);">
          <div class="card-header">
            <div class="card-title"><i data-lucide="shield-alert"></i>无活跃授权</div>
            <span class="tag tag-pending">待用户授权</span>
          </div>
          <div class="card-body">
            <p style="margin-bottom:12px;">当前没有用户授权营养师查看数据。营养师只能在用户明确授权后查看结构化摘要。</p>
            <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-bottom:12px;">演示说明：可以在"目标与设置 → 隐私与授权"中模拟用户授权，然后返回此页面查看。</p>
            <div style="display:flex;gap:8px;">
              <a href="#/goals" class="btn btn-primary">前往授权设置</a>
              <button class="btn btn-secondary" onclick="PageNutritionist.simulateGrant()">模拟已有授权（Demo）</button>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="clipboard-list"></i>复核队列</div>
          <span class="tag tag-demo">${queue.length}条（演示数据）</span>
        </div>
        <div class="card-body">
          ${queue.map((c, i) => `
            <div style="border:1px solid var(--color-border);border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer;${selectedConsent===i?'border-color:var(--color-primary);background:var(--color-primary-light);':''}" onclick="PageNutritionist.selectConsent(${i})">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong>用户 ${c.subject_id.replace('demo_user_','')} · 营养摘要复核</strong>
                <span class="tag ${c.status==='active'?'tag-success':c.status==='expired'?'tag-unknown':'tag-error'}">${c.status==='active'?'已授权':c.status==='expired'?'已过期':'已撤回'}</span>
              </div>
              <div style="font-size:0.8125rem;color:var(--color-text-secondary);">
                授权范围：${(c.scope||[]).join('、')} · 期限：${c.granted_at?.slice(0,10)} 至 ${c.expires_at?.slice(0,10) || '未知'}
              </div>
              <div style="font-size:0.8125rem;color:var(--color-text-muted);margin-top:4px;">
                复核状态：${c.review_status === 'pending' ? '待复核' : c.review_status === 'completed' ? '已完成本地复核' : c.review_status === 'needs_info' ? '需补充信息' : c.review_status === 'revoked' ? '用户撤回授权' : '无权限查看'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${selectedConsent !== null ? renderDetail(queue[selectedConsent]) : ''}
    `;
  }

  function renderDetail(c) {
    if (!c) return '';
    const hasPermission = c.status === 'active';

    return `
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <div class="card-title"><i data-lucide="file-text"></i>授权摘要与复核</div>
          <span class="tag ${hasPermission?'tag-success':'tag-error'}">${hasPermission?'可查看':'无权限'}</span>
        </div>
        <div class="card-body">
          ${!hasPermission ? `
            <div class="state-view">
              <div class="state-icon"><i data-lucide="lock"></i></div>
              <div class="state-title">无权限查看</div>
              <div class="state-desc">该用户授权已${c.status==='expired'?'过期':'撤回'}，营养师无法查看详细数据。请联系用户重新授权。</div>
            </div>
          ` : `
            ${c.summary ? `
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
                <div class="summary-card" style="padding:10px;"><div class="label">近7天记录</div><div class="value" style="font-size:1.25rem;">${c.summary.records_7d}</div></div>
                <div class="summary-card" style="padding:10px;"><div class="label">平均热量</div><div class="value" style="font-size:1.25rem;">${c.summary.avg_kcal}</div></div>
                <div class="summary-card" style="padding:10px;"><div class="label">平均蛋白质</div><div class="value" style="font-size:1.25rem;">${c.summary.avg_protein_g}g</div></div>
                <div class="summary-card" style="padding:10px;"><div class="label">平均糖</div><div class="value" style="font-size:1.25rem;">${c.summary.avg_sugar_g}g</div></div>
              </div>

              <div class="config-section">
                <div class="config-section-title"><i data-lucide="check-square"></i>核对清单</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  ${(c.summary.pending_items || []).map((item, i) => `
                    <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem;cursor:pointer;">
                      <input type="checkbox" onchange="this.parentElement.style.opacity=this.checked?'0.5':'1'">
                      <span>${item}</span>
                      <span class="tag tag-pending">待确认</span>
                    </label>
                  `).join('')}
                  <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem;cursor:pointer;">
                    <input type="checkbox" checked>
                    <span style="opacity:0.5;">近7天营养摘要已查看</span>
                    <span class="tag tag-success">已核对</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;font-size:0.875rem;cursor:pointer;">
                    <input type="checkbox" checked>
                    <span style="opacity:0.5;">来源和版本信息已确认</span>
                    <span class="tag tag-success">已核对</span>
                  </label>
                </div>
              </div>

              <div class="form-group" style="margin-top:16px;">
                <label class="form-label">复核备注/建议 <span class="tag tag-non-medical" style="margin-left:6px;">非医疗建议</span></label>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                  ${NPV2_DATA.NUTRITIONIST_TEMPLATES.map(t => `<button class="config-option" style="font-size:0.75rem;padding:5px 10px;" onclick="const ta=document.getElementById('nutNote');if(ta){ta.value+='${t.content.replace(/'/g,"\\'").replace(/\n/g,' ')}';}">${t.title}</button>`).join('')}
                </div>
                <textarea class="form-textarea" id="nutNote" placeholder="输入日常营养管理建议，或点击上方模板快速插入...">${c.summary.notes || ''}</textarea>
                <p class="form-hint">区间和来源不可被覆盖成单一精确值。所有建议为日常健康管理参考，不作诊断、治疗或疗效保证。</p>
              </div>

              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-primary" onclick="PageNutritionist.reviewAction('completed')"><i data-lucide="check"></i>完成本地复核</button>
                <button class="btn btn-secondary" onclick="PageNutritionist.reviewAction('needs_info')"><i data-lucide="alert-circle"></i>标记需补充信息</button>
                <button class="btn btn-ghost" onclick="PageNutritionist.reviewAction('revoked')"><i data-lucide="user-x"></i>用户撤回授权</button>
              </div>
            ` : '<p>暂无摘要数据</p>'}
          `}

          <div class="divider"></div>
          <div class="config-section">
            <div class="config-section-title"><i data-lucide="history"></i>访问审计记录</div>
            <div class="timeline">
              ${(c.audit_events || []).map(e => `
                <div class="timeline-item">
                  <div class="timeline-title">${e.action}</div>
                  <div class="timeline-desc">${e.time} · ${e.detail}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function selectConsent(i) { selectedConsent = selectedConsent === i ? null : i; App.rerender(); }
  function simulateGrant() {
    const p = AppState.getProfile();
    p.consent_status = 'granted';
    p.consent_expires_at = new Date(Date.now() + 30*86400000).toISOString().slice(0,10);
    AppState.saveProfile(p);
    UI.toast('已模拟用户授权（Demo）', 'success');
    App.rerender();
  }
  function reviewAction(action) {
    const map = { completed: '已完成本地复核', needs_info: '已标记需补充信息', revoked: '用户已撤回授权' };
    UI.toast(`${map[action] || action}（Demo模拟）`, 'success');
  }

  return { render, selectConsent, simulateGrant, reviewAction };
})();
