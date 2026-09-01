/* ============================================================
   通用组件库 v2.0
   - 状态标签、营养卡片、来源抽屉、模态框、Toast
   - SVG数据可视化：环形进度、宏量环形图、三餐柱状图、7天趋势
   - 协同时间线、社区帖子卡片
   ============================================================ */

const UI = (() => {

  // ========== 状态标签 ==========
  function tag(type, text) { return `<span class="tag tag-${type}">${text}</span>`; }

  function demoTags(tags = []) {
    return '';
  }

  // ========== 营养值展示 ==========
  function nutrientValue(nutrient, unit, label) {
    if (!nutrient || nutrient.value_type === 'unknown' || (nutrient.value === null && !nutrient.interval)) {
      return `<div class="nutrition-item"><div class="nutrition-label">${label}</div><div class="nutrition-value unknown">未知/待补充</div></div>`;
    }
    let valClass = '', valText = '';
    if (nutrient.value !== null && nutrient.value !== undefined) {
      valText = `${nutrient.value} <span class="nutrition-unit">${unit}</span>`;
    } else if (nutrient.interval) {
      valClass = 'interval';
      valText = `${nutrient.interval.min}–${nutrient.interval.max} <span class="nutrition-unit">${unit}</span>`;
    }
    return `<div class="nutrition-item"><div class="nutrition-label">${label}</div><div class="nutrition-value ${valClass}">${valText}</div></div>`;
  }

  function nutritionGrid(nutrients) {
    if (!nutrients) return '';
    return `<div class="nutrition-grid">
      ${nutrientValue(nutrients.kcal, 'kcal', '热量')}
      ${nutrientValue(nutrients.protein_g, 'g', '蛋白质')}
      ${nutrientValue(nutrients.fat_g, 'g', '脂肪')}
      ${nutrientValue(nutrients.carbs_g, 'g', '碳水化合物')}
      ${nutrientValue(nutrients.sugar_g, 'g', '糖')}
      ${nutrientValue(nutrients.sodium_mg, 'mg', '钠')}
    </div>`;
  }

  // ========== SVG 环形进度条 ==========
  function ringProgress(value, max, opts = {}) {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const radius = opts.radius || 56;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    const colorClass = pct > 90 ? 'error' : pct > 70 ? 'warning' : '';
    return `<div class="ring-progress" style="width:${radius*2+20}px;height:${radius*2+20}px;">
      <svg width="${radius*2+20}" height="${radius*2+20}">
        <circle class="ring-bg" cx="${radius+10}" cy="${radius+10}" r="${radius}"></circle>
        <circle class="ring-fill ${colorClass}" cx="${radius+10}" cy="${radius+10}" r="${radius}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="ring-center">
        <div class="ring-value">${pct}<span class="unit">%</span></div>
        <div class="ring-label">${opts.label || '今日热量'}</div>
      </div>
    </div>`;
  }

  // ========== SVG 宏量营养素环形图 ==========
  function macroDonut(protein, fat, carbs, opts = {}) {
    const total = protein + fat + carbs || 1;
    const pPct = (protein / total) * 100;
    const fPct = (fat / total) * 100;
    const cPct = (carbs / total) * 100;
    const r = 50, cx = 60, cy = 60;
    const circ = 2 * Math.PI * r;
    // 三段环形
    const pOffset = 0;
    const fOffset = circ * (1 - pPct/100);
    const cOffset = circ * (1 - (pPct+fPct)/100);
    return `<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <svg width="120" height="120" style="flex-shrink:0;">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-border-light)" stroke-width="14"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-primary-500)" stroke-width="14"
          stroke-dasharray="${circ*pPct/100} ${circ}" stroke-dashoffset="0" transform="rotate(-90 ${cx} ${cy})"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-accent-500)" stroke-width="14"
          stroke-dasharray="${circ*fPct/100} ${circ}" stroke-dashoffset="${-circ*pPct/100}" transform="rotate(-90 ${cx} ${cy})"/>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-warning-500)" stroke-width="14"
          stroke-dasharray="${circ*cPct/100} ${circ}" stroke-dashoffset="${-circ*(pPct+fPct)/100}" transform="rotate(-90 ${cx} ${cy})"/>
        <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="14" font-weight="700" fill="var(--color-text)">${opts.totalKcal || ''}</text>
        <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">kcal</text>
      </svg>
      <div class="macro-legend" style="flex:1;min-width:120px;">
        <div class="macro-legend-item"><span class="macro-dot protein"></span>蛋白质 <span class="macro-legend-value">${Math.round(protein)}g (${Math.round(pPct)}%)</span></div>
        <div class="macro-legend-item"><span class="macro-dot fat"></span>脂肪 <span class="macro-legend-value">${Math.round(fat)}g (${Math.round(fPct)}%)</span></div>
        <div class="macro-legend-item"><span class="macro-dot carbs"></span>碳水 <span class="macro-legend-value">${Math.round(carbs)}g (${Math.round(cPct)}%)</span></div>
      </div>
    </div>`;
  }

  // ========== SVG 三餐热量分布柱状图 ==========
  function mealBarChart(meals, opts = {}) {
    // meals: [{label, kcal, recorded, icon}]
    const maxKcal = Math.max(...meals.map(m => m.kcal), 1);
    const chartH = 120;
    return `<div style="display:flex;align-items:flex-end;justify-content:space-around;height:${chartH+40}px;padding:0 10px;">
      ${meals.map(m => {
        const h = m.recorded ? Math.max(4, (m.kcal / maxKcal) * chartH) : 4;
        const isToday = !m.recorded;
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;">
          <div style="font-size:0.6875rem;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;">${m.recorded ? Math.round(m.kcal)+'kcal' : '—'}</div>
          <div style="width:100%;max-width:48px;height:${h}px;background:${m.recorded ? 'linear-gradient(180deg,var(--color-primary-400),var(--color-primary-600))' : 'repeating-linear-gradient(45deg,var(--color-border-light),var(--color-border-light) 4px,var(--color-bg) 4px,var(--color-bg) 8px)'};border-radius:6px 6px 0 0;transition:height 0.6s ease;"></div>
          <div style="font-size:0.6875rem;color:var(--color-text-muted);font-weight:600;">${m.icon} ${m.label}</div>
          ${!m.recorded ? '<div style="font-size:0.625rem;color:var(--color-accent-600);font-weight:600;">待记录</div>' : `<div style="font-size:0.625rem;color:var(--color-text-muted);">${m.itemCount||0}项</div>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  // ========== SVG 7天趋势折线图 ==========
  function trendChart(data, opts = {}) {
    // data: [{day, kcal, target}]
    const w = 320, h = 100, pad = 20;
    const maxV = Math.max(...data.map(d => d.kcal), opts.target || 0, 1) * 1.1;
    const minV = 0;
    const xStep = (w - pad*2) / (data.length - 1 || 1);
    const points = data.map((d, i) => {
      const x = pad + i * xStep;
      const y = h - pad - ((d.kcal - minV) / (maxV - minV)) * (h - pad*2);
      return { x, y, ...d };
    });
    const pathD = points.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
    const areaD = pathD + ` L${points[points.length-1].x},${h-pad} L${points[0].x},${h-pad} Z`;
    const targetY = opts.target ? h - pad - ((opts.target - minV) / (maxV - minV)) * (h - pad*2) : null;
    return `<svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:100%;height:auto;">
      ${targetY ? `<line x1="${pad}" y1="${targetY}" x2="${w-pad}" y2="${targetY}" stroke="var(--color-accent-500)" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${w-pad}" y="${targetY-4}" text-anchor="end" font-size="9" fill="var(--color-accent-600)">目标${opts.target}</text>` : ''}
      <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--color-primary-500)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--color-primary-500)" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${areaD}" fill="url(#trendGrad)"/>
      <path d="${pathD}" fill="none" stroke="var(--color-primary-600)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i===points.length-1?4:3}" fill="${i===points.length-1?'var(--color-primary-600)':'#fff'}" stroke="var(--color-primary-600)" stroke-width="2"/>
        <text x="${p.x}" y="${h-4}" text-anchor="middle" font-size="9" fill="var(--color-text-muted)">${p.day}</text>`).join('')}
    </svg>`;
  }

  // ========== 糖摄入卡片 ==========
  function sugarCard(sugarFromBeverage, sugarFromMeal, limit = 25) {
    const total = sugarFromBeverage + sugarFromMeal;
    const overLimit = total > limit;
    const pct = Math.min(100, (total / (limit * 2)) * 100);
    return `<div class="stat-card" style="border-left:3px solid ${overLimit?'var(--color-error-500)':'var(--color-warning-500)'};">
      <div class="stat-label">今日糖摄入 <span class="tag ${overLimit?'tag-error':'tag-warning'}" style="margin-left:4px;">${overLimit?'超WHO建议':'正常'}</span></div>
      <div class="stat-value">${Math.round(total)} <span class="unit">g</span></div>
      <div class="stat-sub">饮品 ${Math.round(sugarFromBeverage)}g / 餐食 ${Math.round(sugarFromMeal)}g</div>
      <div class="progress-bar" style="margin-top:8px;"><div class="progress-fill ${overLimit?'error':'warning'}" style="width:${pct}%"></div></div>
      <div class="stat-sub" style="margin-top:4px;">WHO建议游离糖<${limit}g/天 · 饮品是主要来源</div>
    </div>`;
  }

  // ========== 结果卡片 ==========
  function resultCard(result, opts = {}) {
    if (!result) return '';
    const confPct = Math.round((result.confidence || 0) * 100);
    const confColor = confPct >= 70 ? 'var(--color-success-500)' : confPct >= 50 ? 'var(--color-warning-500)' : 'var(--color-error-500)';
    const warnings = (result.warnings || []).map(w => `<div class="warning-item"><i data-lucide="alert-triangle"></i><span>${w}</span></div>`).join('');
    const sources = (result.sources || []).map(s => `<div class="source-item"><div class="source-publisher">${s.publisher}</div><div class="source-meta">类型：${s.source_type} · 采集：${s.retrieved_at||'未知'} · 证据等级：${s.evidence_grade} · 复核：${s.review_status}</div>${s.notes?`<div class="source-meta">备注：${s.notes}</div>`:''}</div>`).join('');
    const components = (result.components || []).map(c => `<div class="source-item"><div class="source-publisher">${c.label}</div><div class="source-meta">类型：${c.component_type}${c.note?' · '+c.note:''}</div></div>`).join('');
    return `<div class="result-card">
      <div class="result-header">
        <div><div class="result-title">${result.display_text || '营养估算结果'}</div>
        <div class="result-meta">${result.serving_basis?.description || ''}${result.catalog_version?` · 目录版本：${result.catalog_version}`:''}${result.effective_from?` · 生效：${result.effective_from}`:''}</div></div>
        <div class="result-confidence"><span>置信度 ${confPct}%</span><div class="confidence-bar"><div class="confidence-fill" style="width:${confPct}%;background:${confColor}"></div></div></div>
      </div>
      ${nutritionGrid(result.nutrients)}
      ${warnings ? `<div class="result-warnings">${warnings}</div>` : ''}
      <div class="divider"></div>
      <details><summary class="detail-toggle"><i data-lucide="info"></i>查看计算拆分与不确定性</summary>
        <div class="detail-content">
          <h4 style="font-size:0.875rem;margin-bottom:8px;">计算组成</h4>
          ${components || '<p style="font-size:0.8125rem;color:var(--color-text-muted);">无计算组成信息</p>'}
          <h4 style="font-size:0.875rem;margin:12px 0 8px;">数据来源</h4>
          ${sources || '<p style="font-size:0.8125rem;color:var(--color-text-muted);">来源不足</p>'}
          ${result.engine_info ? `<h4 style="font-size:0.875rem;margin:12px 0 8px;">引擎信息</h4><div class="source-item"><div class="source-publisher">${result.engine_info.name} v${result.engine_info.version}</div><div class="source-meta">${result.engine_info.status}</div><div class="source-meta">${result.engine_info.note}</div></div>` : ''}
        </div>
      </details>
    </div>`;
  }

  // ========== 协同时间线 ==========
  function collabTimeline(events) {
    if (!events || events.length === 0) return '<p style="font-size:0.8125rem;color:var(--color-text-muted);">暂无协同事件</p>';
    const roleColors = { user:'var(--color-primary-500)', merchant:'var(--color-accent-500)', nutritionist:'var(--color-warning-500)', system:'var(--color-unknown-500)' };
    return `<div class="timeline">
      ${events.map(e => `<div class="timeline-item">
        <div class="timeline-title" style="display:flex;align-items:center;gap:6px;">
          <span class="tag" style="background:${roleColors[e.actor]||'var(--color-unknown-500)'}20;color:${roleColors[e.actor]||'var(--color-unknown-600)'};border-color:transparent;">${e.actor_name || e.actor}</span>
          ${e.title}
        </div>
        <div class="timeline-desc">${e.desc || ''} · ${e.time || ''}</div>
      </div>`).join('')}
    </div>`;
  }

  // ========== 社区帖子卡片（记录即帖子） ==========
  function postCard(p, idx) {
    const isHidden = p.moderation_status === '已隐藏';
    const isPending = p.moderation_status === '待审核';
    const rs = p.record_snapshot;
    return `<div class="post-item" style="${isHidden?'opacity:0.6;':''}">
      <div class="post-header">
        <div class="post-avatar">${p.author_name?.[0] || 'U'}</div>
        <div><div class="post-author">${p.author_name} ${p.verification_badge?`<span class="post-role-badge">${p.verification_badge}</span>`:''}<span class="post-role-badge">${p.author_role==='user'?'用户':p.author_role==='merchant'?'商家':'营养师'}</span></div></div>
        <div class="post-time">${p.created_at?.slice(0,16).replace('T',' ') || ''}</div>
      </div>
      ${isPending ? '<div class="tag tag-pending" style="margin-bottom:8px;">待审核 · 仅自己可见</div>' : ''}
      ${isHidden ? '<div class="tag tag-error" style="margin-bottom:8px;">已隐藏 · 违反社区规则</div>' : ''}
      ${p.info_updated ? '<div class="tag tag-success" style="margin-bottom:8px;"><i data-lucide="refresh-cw" style="width:12px;height:12px;"></i>信息已更新</div>' : ''}
      <div class="post-title">${p.title}</div>
      <div class="post-body">${p.body}</div>
      ${rs ? `<div style="margin-top:10px;padding:12px;background:var(--color-bg-alt);border-radius:10px;border:1px solid var(--color-border-light);">
        <div style="font-size:0.75rem;font-weight:700;color:var(--color-text-secondary);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.03em;">📋 记录营养快照</div>
        <div style="font-size:0.8125rem;font-weight:600;margin-bottom:6px;">${rs.name}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.75rem;color:var(--color-text-secondary);">
          <span>🔥 ${rs.kcal_interval?rs.kcal_interval.min+'-'+rs.kcal_interval.max+'kcal':'未知'}</span>
          <span>🥩 蛋白${rs.protein_g?rs.protein_g.min+'-'+rs.protein_g.max+'g':'未知'}</span>
          <span>🍬 糖${rs.sugar_g?rs.sugar_g.min+'-'+rs.sugar_g.max+'g':'未知'}</span>
          <span class="tag ${rs.confidence>=0.7?'tag-success':rs.confidence>=0.5?'tag-pending':'tag-source-low'}">置信度${Math.round((rs.confidence||0)*100)}%</span>
        </div>
        <div style="font-size:0.6875rem;color:var(--color-text-muted);margin-top:6px;">来源：${rs.source || '未知'} · ${rs.uncertainty || ''}</div>
        ${p.old_snapshot ? `<details style="margin-top:6px;"><summary style="font-size:0.6875rem;color:var(--color-accent-600);cursor:pointer;">查看旧值→新值变化</summary><div style="font-size:0.6875rem;color:var(--color-text-muted);margin-top:4px;">旧值：${p.old_snapshot.kcal_interval.min}-${p.old_snapshot.kcal_interval.max}kcal，糖${p.old_snapshot.sugar_g.min}-${p.old_snapshot.sugar_g.max}g · ${p.old_snapshot.note}</div></details>` : ''}
      </div>` : ''}
      ${(p.topic_tags||[]).length ? `<div class="post-tags">${p.topic_tags.map(t=>`<span class="post-tag">#${t}</span>`).join('')}</div>` : ''}
      <div class="post-footer">
        <button class="post-action" onclick="PageCommunity.like(${idx})"><i data-lucide="thumbs-up"></i>${p.likes||0}</button>
        <button class="post-action" onclick="PageCommunity.toggleCollect(${idx})"><i data-lucide="bookmark"></i>${p.collected||0}</button>
        <button class="post-action" onclick="PageCommunity.toggleComments(${idx})"><i data-lucide="message-circle"></i>${(p.comments||[]).length}</button>
        <button class="post-action" onclick="PageCommunity.report(${idx})"><i data-lucide="flag"></i>举报</button>
        <button class="post-action" style="margin-left:auto;" onclick="PageCommunity.viewPost(${idx})"><i data-lucide="external-link"></i>详情</button>
      </div>
      <div id="comments_${idx}" style="display:none;">
        <div class="comment-list">
          ${(p.comments||[]).map(c => `<div class="comment-item"><div class="comment-avatar">${c.author?.[0]||'U'}</div><div class="comment-body"><div class="comment-header">${c.author} <span class="post-role-badge">${c.role||'用户'}</span>${c.qualification?` <span class="post-role-badge">资质:${c.qualification}</span>`:''} · ${c.time}</div><div class="comment-text">${c.text}</div></div></div>`).join('')}
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;"><input class="form-input" id="commentInput_${idx}" placeholder="写评论..." style="flex:1;"><button class="btn btn-primary btn-sm" onclick="PageCommunity.addComment(${idx})">发送</button></div>
      </div>
    </div>`;
  }

  // ========== 状态视图 ==========
  function stateView(type, opts = {}) {
    const configs = {
      idle: { icon:'image-plus', title:opts.title||'尚未选择照片', desc:opts.desc||'上传餐食照片开始识别，或使用替代路径。', actions:opts.actions||[] },
      uploading: { icon:'loader-2', title:opts.title||'正在处理...', desc:opts.desc||'本地演示模拟识别中，请稍候。', actions:opts.actions||[], loading:true },
      complete: { icon:'check-circle-2', title:opts.title||'识别完成', desc:opts.desc||'', actions:opts.actions||[] },
      partial: { icon:'alert-circle', title:opts.title||'部分识别', desc:opts.desc||'部分菜品已识别，部分待确认。', actions:opts.actions||[] },
      low_conf: { icon:'help-circle', title:opts.title||'识别置信度较低', desc:opts.desc||'结果区间较大，建议人工确认。', actions:opts.actions||[] },
      error: { icon:'x-circle', title:opts.title||'识别失败/服务不可用', desc:opts.desc||'请使用替代路径。', actions:opts.actions||[] },
      permission: { icon:'shield-alert', title:opts.title||'权限不足', desc:opts.desc||'需要相机或文件访问权限。', actions:opts.actions||[] },
      unknown: { icon:'help-circle', title:opts.title||'未知/待补充', desc:opts.desc||'资料不足，无法提供估算。', actions:opts.actions||[] },
      empty: { icon:'inbox', title:opts.title||'暂无数据', desc:opts.desc||'', actions:opts.actions||[] }
    };
    const c = configs[type] || configs.empty;
    return `<div class="state-view">
      ${c.loading ? '<div class="loading-spinner"></div>' : `<div class="state-icon"><i data-lucide="${c.icon}"></i></div>`}
      <div class="state-title">${c.title}</div>
      ${c.desc ? `<div class="state-desc">${c.desc}</div>` : ''}
      ${c.actions.length ? `<div class="state-actions">${c.actions.join('')}</div>` : ''}
    </div>`;
  }

  // ========== Toast / Modal ==========
  function toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success:'check-circle', error:'x-circle', warning:'alert-triangle', info:'info' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i data-lucide="${icons[type]||'info'}" style="width:18px;height:18px;flex-shrink:0;margin-top:1px;"></i><span>${message}</span>`;
    container.appendChild(el);
    if (window.lucide) lucide.createIcons({ root: el });
    setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity 0.3s'; setTimeout(()=>el.remove(), 300); }, duration);
  }

  function modal(title, bodyHTML, footerHTML = '', opts = {}) {
    const container = document.getElementById('modalContainer');
    if (!container) return;
    const id = 'modal_' + Date.now();
    const el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = id;
    el.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="${id}_title">
      <div class="modal-header"><div class="modal-title" id="${id}_title">${title}</div><button class="modal-close" aria-label="关闭"><i data-lucide="x"></i></button></div>
      <div class="modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="modal-footer">${footerHTML}</div>` : ''}
    </div>`;
    container.appendChild(el);
    if (window.lucide) lucide.createIcons({ root: el });
    const close = () => { el.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    el.querySelector('.modal-close').addEventListener('click', close);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    document.addEventListener('keydown', onKey);
    const focusable = el.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
    return { close, element: el };
  }

  function confirmDialog(title, message, onConfirm, confirmText = '确认', danger = false) {
    const footer = `<button class="btn btn-secondary" id="confirm_cancel">取消</button><button class="btn ${danger?'btn-danger':'btn-primary'}" id="confirm_ok">${confirmText}</button>`;
    const m = modal(title, `<p style="font-size:0.9375rem;color:var(--color-text-secondary);">${message}</p>`, footer);
    m.element.querySelector('#confirm_cancel').addEventListener('click', m.close);
    m.element.querySelector('#confirm_ok').addEventListener('click', () => { m.close(); onConfirm(); });
  }

  // ========== 其他 ==========
  function stepper(steps, current) {
    return `<div class="stepper">${steps.map((s, i) => {
      const cls = i < current ? 'completed' : i === current ? 'active' : '';
      return `<div class="step-item ${cls}"><div class="step-num">${i < current ? '<i data-lucide="check" style="width:14px;height:14px;"></i>' : (i+1)}</div><span class="step-label">${s}</span></div>${i < steps.length-1 ? '<div class="step-connector"></div>' : ''}`;
    }).join('')}</div>`;
  }

  function uploadZone(id, opts = {}) {
    return `<div class="upload-zone" id="${id}" tabindex="0" role="button" aria-label="${opts.label||'上传图片'}">
      <div class="upload-icon"><i data-lucide="${opts.icon||'upload-cloud'}"></i></div>
      <div class="upload-text">${opts.text||'点击或拖拽上传图片'}</div>
      <div class="upload-hint">${opts.hint||'支持 JPG/PNG，图片仅本地预览，不上传服务器'}</div>
      <input type="file" id="${id}_input" accept="image/*" style="display:none" aria-label="选择图片文件">
    </div>`;
  }

  function emptyState(icon, text, actionHTML = '') {
    return `<div class="empty-state"><i data-lucide="${icon}"></i><p>${text}</p>${actionHTML}</div>`;
  }

  function refreshIcons(root = document) { if (window.lucide) lucide.createIcons({ root }); }

  return {
    tag, demoTags, nutrientValue, nutritionGrid,
    ringProgress, macroDonut, mealBarChart, trendChart, sugarCard,
    resultCard, collabTimeline, postCard,
    stateView, toast, modal, confirmDialog, stepper, uploadZone, emptyState, refreshIcons
  };
})();
