/* 总览/今日页 v3.0 - MacroFactor/Sleek风格重设计 */
const PageOverview = (() => {
  function render() {
    const profile = AppState.getProfile();
    const records = AppState.getRecords();
    const allRecords = [...NPV2_DATA.HISTORY_RECORDS, ...records];
    const today = new Date().toISOString().slice(0, 10);
    const todayRecords = allRecords.filter(r => r.created_at?.startsWith(today));

    let totalKcal = 0, totalProtein = 0, totalFat = 0, totalCarbs = 0, totalSugar = 0, sugarFromBev = 0, sugarFromMeal = 0;
    let mealKcal = { breakfast:0, lunch:0, dinner:0, snack:0 };
    let mealCount = { breakfast:0, lunch:0, dinner:0, snack:0 };
    let mealItems = { breakfast:[], lunch:[], dinner:[], snack:[] };

    for (const r of todayRecords) {
      const period = r.meal_period || 'snack';
      for (const item of (r.items || [])) {
        const k = item.calories_kcal;
        const kcal = k?.interval ? (k.interval.min + k.interval.max)/2 : (k?.value || 0);
        const prot = item.protein_g?.interval ? (item.protein_g.interval.min + item.protein_g.interval.max)/2 : (item.protein_g?.value || 0);
        const fat = item.fat_g?.interval ? (item.fat_g.interval.min + item.fat_g.interval.max)/2 : (item.fat_g?.value || 0);
        const carb = item.carbs_g?.interval ? (item.carbs_g.interval.min + item.carbs_g.interval.max)/2 : (item.carbs_g?.value || 0);
        const sug = item.sugar_g?.interval ? (item.sugar_g.interval.min + item.sugar_g.interval.max)/2 : (item.sugar_g?.value || 0);
        totalKcal += kcal; totalProtein += prot; totalFat += fat; totalCarbs += carb; totalSugar += sug;
        mealKcal[period] = (mealKcal[period]||0) + kcal;
        if (r.source_type === 'beverage' || item.category === 'beverage') sugarFromBev += sug;
        else sugarFromMeal += sug;
      }
      mealCount[period] = (mealCount[period]||0) + 1;
      mealItems[period] = [...(mealItems[period]||[]), r.merchant_label || '未命名'];
    }

    const target = profile.daily_target || { kcal:1800, protein_g:70, fat_g:60, carbs_g:220, sugar_g:50 };
    const remaining = Math.max(0, Math.round(target.kcal - totalKcal));
    const kcalPct = Math.min(100, Math.round((totalKcal / target.kcal) * 100));

    // 7天趋势数据
    const trendData = [];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(); date.setDate(date.getDate() - d);
      const ds = date.toISOString().slice(0,10);
      const dayRecords = allRecords.filter(r => r.created_at?.startsWith(ds));
      let dayKcal = 0;
      for (const r of dayRecords) for (const it of (r.items||[])) {
        if (it.calories_kcal?.interval) dayKcal += (it.calories_kcal.interval.min + it.calories_kcal.interval.max)/2;
        else if (it.calories_kcal?.value) dayKcal += it.calories_kcal.value;
      }
      trendData.push({ day: d===0 ? '今' : `${date.getMonth()+1}/${date.getDate()}`, kcal: Math.round(dayKcal), target: target.kcal });
    }

    // 问候语
    const hour = new Date().getHours();
    const greeting = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    const dateStr = new Date().toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'long' });

    // 协同事件
    const collabEvents = NPV2_DATA.COLLABORATION_EVENTS.slice(0, 4);
    const pendingInvites = collabEvents.filter(e => e.status === 'pending').length;

    return `
      <div class="page-content">
      <!-- 顶部问候区 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div>
          <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:2px;">${greeting} 👋</h1>
          <p style="font-size:0.875rem;color:var(--text-secondary);">${dateStr}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;box-shadow:var(--shadow-primary);">我</div>
        </div>
      </div>
      ${UI.demoTags(['demo','non-medical'])}

      <!-- 核心卡路里卡片 -->
      <div class="card" style="background:linear-gradient(135deg,#FFFFFF 0%,#F0F7F5 100%);border:1px solid var(--primary-100);">
        <div class="card-header" style="margin-bottom:8px;">
          <div class="card-title"><i data-lucide="flame"></i>今日热量</div>
          <span class="tag tag-demo">演示数据</span>
        </div>
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;justify-content:center;">
          ${renderLargeRing(remaining, totalKcal, target.kcal)}
          <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--success-light);border-radius:var(--radius-md);">
              <span style="font-size:0.8125rem;font-weight:600;color:var(--success);">✅ 已摄入</span>
              <span style="font-size:1.125rem;font-weight:800;color:var(--text-primary);font-variant-numeric:tabular-nums;">${Math.round(totalKcal)} kcal</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--primary-50);border-radius:var(--radius-md);">
              <span style="font-size:0.8125rem;font-weight:600;color:var(--primary);">🎯 每日目标</span>
              <span style="font-size:1.125rem;font-weight:800;color:var(--text-primary);font-variant-numeric:tabular-nums;">${target.kcal} kcal</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--accent-gold-light);border-radius:var(--radius-md);">
              <span style="font-size:0.8125rem;font-weight:600;color:var(--accent-gold);">🔥 运动估算</span>
              <span style="font-size:1.125rem;font-weight:800;color:var(--text-primary);font-variant-numeric:tabular-nums;">+200 kcal</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 宏量营养素卡片 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="pie-chart"></i>宏量营养素</div>
          <span style="font-size:0.75rem;color:var(--text-muted);">基于今日目标</span>
        </div>
        ${renderMacroRings(totalProtein, totalFat, totalCarbs, target)}
      </div>

      <!-- 三餐时间线卡片 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="clock"></i>今日餐食</div>
          <span class="tag tag-demo">演示数据</span>
        </div>
        ${renderMealTimeline(mealKcal, mealCount, mealItems)}
      </div>

      <!-- 快捷记录 -->
      <h2 style="font-size:1.0625rem;font-weight:700;margin:20px 0 12px;">记录一餐</h2>
      <div class="quick-actions">
        <a href="#/record/order" class="quick-action-card"><div class="icon-wrap"><i data-lucide="receipt"></i></div><div class="qa-title">订单导入</div><div class="qa-desc">截图/小票/文字 → 候选确认</div></a>
        <a href="#/record/meal-photo" class="quick-action-card"><div class="icon-wrap"><i data-lucide="camera"></i></div><div class="qa-title">餐食拍照</div><div class="qa-desc">固体餐识别 → 份量校正</div></a>
        <a href="#/record/beverage" class="quick-action-card"><div class="icon-wrap"><i data-lucide="cup-soda"></i></div><div class="qa-title">饮品配置</div><div class="qa-desc">品牌/SKU/糖度/小料 → 区间</div></a>
      </div>

      <!-- 7天趋势面积图 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="trending-up"></i>本周趋势</div>
          <div style="display:flex;gap:6px;">
            <button class="config-option selected" style="font-size:0.75rem;padding:4px 10px;">热量</button>
            <button class="config-option" style="font-size:0.75rem;padding:4px 10px;">蛋白</button>
            <button class="config-option" style="font-size:0.75rem;padding:4px 10px;">糖</button>
          </div>
        </div>
        ${renderAreaChart(trendData, target.kcal)}
      </div>

      <!-- 糖摄入卡片 -->
      <div class="card" style="border-left:4px solid var(--accent-coral);">
        <div class="card-header">
          <div class="card-title"><i data-lucide="candy" style="color:var(--accent-coral);"></i>今日糖摄入</div>
          ${totalSugar > 25 ? '<span class="tag tag-source-low">已超标</span>' : '<span class="tag tag-success">正常</span>'}
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div style="font-size:2.25rem;font-weight:800;letter-spacing:-0.03em;font-variant-numeric:tabular-nums;color:var(--text-primary);line-height:1;">${Math.round(totalSugar)}<span style="font-size:1rem;font-weight:500;color:var(--text-muted);">g</span></div>
          <div style="flex:1;min-width:160px;">
            <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">
              <span>饮品 ${Math.round(sugarFromBev)}g / 餐食 ${Math.round(sugarFromMeal)}g</span>
              <span>WHO建议 &lt;25g</span>
            </div>
            <div class="progress-bar" style="height:10px;"><div class="progress-fill ${totalSugar > 25 ? 'error' : 'warning'}" style="width:${Math.min(100, (totalSugar/50)*100)}%;"></div></div>
          </div>
        </div>
        ${totalSugar > 25 ? '<p style="font-size:0.75rem;color:var(--accent-coral);margin-top:10px;font-weight:500;">⚠️ 今日糖摄入已超过WHO建议的25g，建议下一餐选择无糖或三分糖饮品</p>' : ''}
      </div>

      <!-- 协同动态卡片 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="users"></i>协同动态</div>
          ${pendingInvites > 0 ? `<span class="tag tag-pending">${pendingInvites}条待处理</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          ${collabEvents.map(e => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);">
              <div style="width:32px;height:32px;border-radius:50%;background:${e.type==='merchant_update'?'var(--accent-gold-light)':e.type==='nutritionist_reply'?'var(--success-light)':e.type==='supplement_invite'?'var(--accent-coral-light)':'var(--primary-50)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <i data-lucide="${e.type==='merchant_update'?'store':e.type==='nutritionist_reply'?'stethoscope':e.type==='supplement_invite'?'alert-circle':'share-2'}" style="width:15px;height:15px;color:${e.type==='merchant_update'?'var(--accent-gold)':e.type==='nutritionist_reply'?'var(--success)':e.type==='supplement_invite'?'var(--accent-coral)':'var(--primary)'};"></i>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.875rem;font-weight:600;line-height:1.4;">${e.title}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${e.actor_name} · ${e.time}</div>
              </div>
              ${e.status==='pending' ? '<span class="tag tag-pending" style="flex-shrink:0;">待处理</span>' : '<span class="tag tag-success" style="flex-shrink:0;">已完成</span>'}
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;margin-top:10px;"><a href="#/project" class="btn btn-ghost btn-sm">查看协同闭环说明 <i data-lucide="arrow-right"></i></a></div>
      </div>

      <!-- 今日建议 -->
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="lightbulb"></i>今日建议</div>
          <span class="tag tag-non-medical">非医疗建议</span>
        </div>
        <div class="card-body">
          <p style="margin-bottom:8px;">${totalProtein < target.protein_g * 0.7 ? '🥩 蛋白质摄入偏低，下一餐可考虑增加鸡胸肉、鸡蛋、豆腐等优质蛋白。' : '✅ 蛋白质摄入尚可，注意保持均衡。'}</p>
          <p style="margin-bottom:8px;">${totalSugar > 25 ? '⚠️ 糖摄入超过WHO建议的25g/天，建议下一餐选择无糖或三分糖饮品。' : '✅ 糖摄入在建议范围内。'}</p>
          <p style="margin-bottom:8px;">${mealCount.breakfast === 0 ? '🍳 今日还未记录早餐，早餐质量影响全天代谢。' : ''}</p>
          <p style="font-size:0.8125rem;color:var(--text-muted);margin-top:8px;">以上为日常营养管理参考，基于估算中值生成，不作诊断、治疗或疗效承诺。</p>
        </div>
      </div>
      </div>
    `;
  }

  // 大环形进度图
  function renderLargeRing(remaining, consumed, target) {
    const pct = Math.min(100, Math.round((consumed / target) * 100));
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;
    return `<div class="ring-progress-large">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <defs><linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0B7285"/><stop offset="100%" stop-color="#2A9D8F"/></linearGradient></defs>
        <circle class="ring-bg" cx="100" cy="100" r="${radius}"></circle>
        <circle class="ring-fill" cx="100" cy="100" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="ring-center">
        <div class="ring-label-top">剩余</div>
        <div class="ring-value">${remaining}<span class="unit"> kcal</span></div>
        <div class="ring-label-bottom">已摄入 ${Math.round(consumed)} / ${target}</div>
      </div>
    </div>`;
  }

  // 宏量营养素迷你环形图
  function renderMacroRings(protein, fat, carbs, target) {
    const items = [
      { label:'蛋白质', value:Math.round(protein), target:target.protein_g, color:'#6366F1', bg:'#EEF0FE' },
      { label:'碳水', value:Math.round(carbs), target:target.carbs_g, color:'#D9A441', bg:'#FBF3E0' },
      { label:'脂肪', value:Math.round(fat), target:target.fat_g, color:'#2A9D8F', bg:'#E6F7F3' }
    ];
    return `<div class="mini-ring-group">
      ${items.map(item => {
        const pct = Math.min(100, Math.round((item.value / item.target) * 100));
        const r = 26;
        const circ = 2 * Math.PI * r;
        const offset = circ - (pct / 100) * circ;
        return `<div class="mini-ring-item">
          <div class="mini-ring">
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle class="mini-ring-bg" cx="34" cy="34" r="${r}"></circle>
              <circle class="mini-ring-fill" cx="34" cy="34" r="${r}" stroke="${item.color}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
            </svg>
            <div class="mini-ring-center" style="color:${item.color};">${pct}%</div>
          </div>
          <div class="mini-ring-label">${item.label}</div>
          <div class="mini-ring-value">${item.value}g / ${item.target}g</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // 三餐时间线
  function renderMealTimeline(mealKcal, mealCount, mealItems) {
    const meals = [
      { period:'breakfast', label:'早餐', time:'6:00-10:00', icon:'🌅', color:'#D9A441' },
      { period:'lunch', label:'午餐', time:'11:00-14:00', icon:'☀️', color:'#E76F51' },
      { period:'dinner', label:'晚餐', time:'17:00-21:00', icon:'🌙', color:'#0B7285' },
      { period:'snack', label:'加餐', time:'其他时间', icon:'☕', color:'#2A9D8F' }
    ];
    return `<div style="position:relative;padding-left:8px;">
      ${meals.map((m, i) => {
        const recorded = mealCount[m.period] > 0;
        const kcal = Math.round(mealKcal[m.period] || 0);
        const items = (mealItems[m.period] || []).slice(0, 2).join('、');
        return `<div style="display:flex;align-items:flex-start;gap:14px;padding:12px 0;${i < meals.length-1 ? 'border-bottom:1px solid var(--border-light);' : ''}">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;width:48px;">
            <div style="width:36px;height:36px;border-radius:50%;background:${recorded ? m.color+'20' : 'var(--bg-alt)'};display:flex;align-items:center;justify-content:center;font-size:1.125rem;">${m.icon}</div>
            <span style="font-size:0.625rem;color:var(--text-muted);font-weight:600;">${m.time}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:0.9375rem;font-weight:700;">${m.label}</span>
              ${recorded ? `<span style="font-size:1rem;font-weight:800;color:var(--text-primary);font-variant-numeric:tabular-nums;">${kcal} kcal</span>` : `<span style="font-size:0.8125rem;color:var(--text-muted);font-weight:500;">待记录</span>`}
            </div>
            ${recorded ? `<div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${items || `${mealCount[m.period]}条记录`}</div>` : ''}
          </div>
          ${recorded ? `<span class="tag tag-success" style="flex-shrink:0;align-self:center;">✓</span>` : `<a href="#/record/beverage" class="btn btn-primary btn-sm" style="flex-shrink:0;align-self:center;padding:6px 12px;min-height:32px;font-size:0.75rem;">+ 记录</a>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  // 面积图
  function renderAreaChart(data, target) {
    const w = 600, h = 160, padL = 40, padR = 10, padT = 15, padB = 25;
    const maxV = Math.max(...data.map(d => d.kcal), target, 1) * 1.15;
    const xStep = (w - padL - padR) / (data.length - 1 || 1);
    const points = data.map((d, i) => {
      const x = padL + i * xStep;
      const y = h - padB - ((d.kcal - 0) / (maxV - 0)) * (h - padT - padB);
      return { x, y, ...d };
    });
    const pathD = points.map((p, i) => `${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
    const areaD = pathD + ` L${points[points.length-1].x},${h-padB} L${points[0].x},${h-padB} Z`;
    const targetY = h - padB - (target / maxV) * (h - padT - padB);
    return `<div class="area-chart-container">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B7285" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#0B7285" stop-opacity="0"/>
        </linearGradient></defs>
        <line x1="${padL}" y1="${targetY}" x2="${w-padR}" y2="${targetY}" stroke="#D9A441" stroke-width="1.5" stroke-dasharray="5,4"/>
        <text x="${w-padR}" y="${targetY-5}" text-anchor="end" font-size="10" fill="#D9A441" font-weight="600">目标 ${target}</text>
        <path d="${areaD}" fill="url(#areaGrad)"/>
        <path d="${pathD}" fill="none" stroke="#0B7285" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i===points.length-1?5:3.5}" fill="${i===points.length-1?'#0B7285':'#fff'}" stroke="#0B7285" stroke-width="2"/>
          <text x="${p.x}" y="${h-8}" text-anchor="middle" font-size="10" fill="${i===points.length-1?'#0B7285':'#8B9AAB'}" font-weight="${i===points.length-1?'700':'400'}">${p.day}</text>`).join('')}
      </svg>
    </div>`;
  }

  return { render };
})();
