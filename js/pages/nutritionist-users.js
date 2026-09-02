/* 营养师用户管理页 */
const PageNutritionistUsers = (() => {
  const state = { search: '', target: 'all', expandedId: null };

  const users = [
    { id: 1, name: '小鹿减脂中', avatar: '🦌', age: 26, gender: '女', bmi: 24.5, target: '减脂', height: 165, weight: 66.8, bmr: 1380, targetWeight: 58, activity: '高', lastRecord: '10分钟前', followed: true,
      weekIntake: [{ day: '周一', cal: 1450, protein: 82, fat: 45, carb: 168 }, { day: '周二', cal: 1520, protein: 88, fat: 48, carb: 172 }, { day: '周三', cal: 1380, protein: 78, fat: 42, carb: 158 }, { day: '周四', cal: 1620, protein: 92, fat: 52, carb: 185 }, { day: '周五', cal: 1480, protein: 85, fat: 46, carb: 170 }, { day: '周六', cal: 1750, protein: 95, fat: 58, carb: 195 }, { day: '周日', cal: 1420, protein: 80, fat: 44, carb: 162 }],
      targetCal: 1400, targetProtein: 85, targetFat: 47, targetCarb: 170,
      alerts: [{ type: 'warning', text: '连续2天热量超标（周六1750/1400）' }, { type: 'info', text: '蛋白质摄入稳定，达标率92%' }],
      history: [{ date: '2026-09-01', advice: '建议晚餐减少精制碳水，增加蔬菜比例', type: '饮食调整' }, { date: '2026-08-28', advice: '本周减脂进度良好，继续保持当前热量缺口', type: '鼓励' }] },
    { id: 2, name: '控糖日记', avatar: '🍵', age: 34, gender: '男', bmi: 26.8, target: '控糖', height: 178, weight: 84.5, bmr: 1680, targetWeight: 78, activity: '中', lastRecord: '1小时前', followed: true,
      weekIntake: [{ day: '周一', cal: 1680, protein: 78, fat: 52, carb: 210 }, { day: '周二', cal: 1720, protein: 82, fat: 55, carb: 218 }, { day: '周三', cal: 1590, protein: 75, fat: 48, carb: 198 }, { day: '周四', cal: 1850, protein: 88, fat: 62, carb: 235 }, { day: '周五', cal: 1650, protein: 80, fat: 50, carb: 205 }, { day: '周六', cal: 1920, protein: 90, fat: 68, carb: 248 }, { day: '周日', cal: 1600, protein: 76, fat: 49, carb: 200 }],
      targetCal: 1600, targetProtein: 80, targetFat: 53, targetCarb: 200,
      alerts: [{ type: 'danger', text: '连续3天碳水超标，血糖波动风险增加' }, { type: 'warning', text: '周六晚餐含糖饮料摄入，建议替换' }],
      history: [{ date: '2026-09-02', advice: '建议用杂粮饭替代白米饭，减少餐后血糖峰值', type: '饮食调整' }, { date: '2026-08-30', advice: '建议增加餐后30分钟散步，有助于血糖控制', type: '运动建议' }] },
    { id: 3, name: '健身教练阿杰', avatar: '💪', age: 28, gender: '男', bmi: 22.1, target: '增肌', height: 182, weight: 73.2, bmr: 1720, targetWeight: 78, activity: '高', lastRecord: '30分钟前', followed: false,
      weekIntake: [{ day: '周一', cal: 2450, protein: 168, fat: 68, carb: 285 }, { day: '周二', cal: 2520, protein: 172, fat: 72, carb: 292 }, { day: '周三', cal: 2380, protein: 162, fat: 65, carb: 278 }, { day: '周四', cal: 2600, protein: 178, fat: 75, carb: 300 }, { day: '周五', cal: 2480, protein: 170, fat: 70, carb: 288 }, { day: '周六', cal: 2550, protein: 175, fat: 73, carb: 295 }, { day: '周日', cal: 2400, protein: 165, fat: 67, carb: 280 }],
      targetCal: 2500, targetProtein: 175, targetFat: 72, targetCarb: 290,
      alerts: [{ type: 'success', text: '各项营养素达标率均超过95%' }, { type: 'info', text: '增肌进度符合预期，建议维持当前方案' }],
      history: [{ date: '2026-09-01', advice: '训练日可额外补充20g蛋白质，促进肌肉合成', type: '营养补充' }] },
    { id: 4, name: '美食探店喵', avatar: '🐱', age: 24, gender: '女', bmi: 23.2, target: '均衡', height: 160, weight: 59.5, bmr: 1280, targetWeight: 58, activity: '低', lastRecord: '昨天', followed: false,
      weekIntake: [{ day: '周一', cal: 1580, protein: 62, fat: 58, carb: 195 }, { day: '周二', cal: 1650, protein: 65, fat: 62, carb: 205 }, { day: '周三', cal: 1420, protein: 58, fat: 52, carb: 178 }, { day: '周四', cal: 1720, protein: 68, fat: 65, carb: 215 }, { day: '周五', cal: 1550, protein: 60, fat: 56, carb: 192 }, { day: '周六', cal: 1850, protein: 72, fat: 72, carb: 230 }, { day: '周日', cal: 1480, protein: 59, fat: 54, carb: 185 }],
      targetCal: 1500, targetProtein: 70, targetFat: 50, targetCarb: 190,
      alerts: [{ type: 'warning', text: '蛋白质摄入偏低，平均仅63g/天（目标70g）' }, { type: 'info', text: '周末外食频率较高，注意油脂摄入' }],
      history: [{ date: '2026-08-29', advice: '建议每餐增加一拳蛋白质食物，如鸡蛋、豆腐、瘦肉', type: '饮食调整' }] },
    { id: 5, name: '营养师小林', avatar: '🥗', age: 31, gender: '女', bmi: 21.5, target: '减脂', height: 168, weight: 60.8, bmr: 1350, targetWeight: 56, activity: '中', lastRecord: '2小时前', followed: true,
      weekIntake: [{ day: '周一', cal: 1380, protein: 78, fat: 42, carb: 158 }, { day: '周二', cal: 1420, protein: 80, fat: 44, carb: 162 }, { day: '周三', cal: 1350, protein: 76, fat: 40, carb: 155 }, { day: '周四', cal: 1450, protein: 82, fat: 45, carb: 168 }, { day: '周五', cal: 1400, protein: 79, fat: 43, carb: 160 }, { day: '周六', cal: 1520, protein: 85, fat: 48, carb: 175 }, { day: '周日', cal: 1380, protein: 77, fat: 42, carb: 158 }],
      targetCal: 1400, targetProtein: 80, targetFat: 44, targetCarb: 160,
      alerts: [{ type: 'success', text: '营养达标率98%，执行非常好' }],
      history: [{ date: '2026-09-01', advice: '继续保持，下周可尝试增加力量训练', type: '运动建议' }] },
    { id: 6, name: '程序员老王', avatar: '💻', age: 38, gender: '男', bmi: 28.5, target: '控糖', height: 175, weight: 87.5, bmr: 1650, targetWeight: 80, activity: '低', lastRecord: '3天前', followed: true,
      weekIntake: [{ day: '周一', cal: 1950, protein: 72, fat: 78, carb: 245 }, { day: '周二', cal: 2100, protein: 75, fat: 85, carb: 268 }, { day: '周三', cal: 1880, protein: 68, fat: 72, carb: 238 }, { day: '周四', cal: 2200, protein: 78, fat: 92, carb: 280 }, { day: '周五', cal: 1980, protein: 70, fat: 80, carb: 250 }, { day: '周六', cal: 2350, protein: 82, fat: 98, carb: 295 }, { day: '周日', cal: 1920, protein: 69, fat: 75, carb: 242 }],
      targetCal: 1700, targetProtein: 85, targetFat: 57, targetCarb: 210,
      alerts: [{ type: 'danger', text: '连续7天热量超标，平均超标23%' }, { type: 'danger', text: '脂肪摄入严重超标，平均82g/天（目标57g）' }, { type: 'warning', text: '久坐少动，建议增加日常活动量' }],
      history: [{ date: '2026-08-25', advice: '建议严格控制外卖油脂，选择清炒/蒸煮类菜品', type: '饮食调整' }, { date: '2026-08-20', advice: '建议每工作1小时起身活动5分钟', type: '运动建议' }, { date: '2026-08-15', advice: '建议就医检查血脂和血糖指标', type: '就医提醒' }] }
  ];

  const targets = ['all', '减脂', '增肌', '控糖', '均衡'];

  function getFiltered() {
    return users.filter(u => {
      if (state.search && !u.name.includes(state.search)) return false;
      if (state.target !== 'all' && u.target !== state.target) return false;
      return true;
    });
  }

  function bmiColor(bmi) {
    if (bmi < 18.5) return '#2A9D8F';
    if (bmi < 24) return '#2A9D8F';
    if (bmi < 28) return '#E9C46A';
    return '#E76F51';
  }

  function renderIntakeChart(u) {
    const days = u.weekIntake;
    const w = 480, h = 160, pad = 35;
    const max = Math.max(...days.map(d => d.cal)) * 1.15;
    const pts = days.map((d, i) => {
      const x = pad + i * (w - pad * 2) / (days.length - 1);
      const y = h - pad - (d.cal / max) * (h - pad * 2);
      return { x, y, ...d };
    });
    const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    const targetY = h - pad - (u.targetCal / max) * (h - pad * 2);
    let dots = pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#0B7285"><title>${p.day}: ${p.cal}kcal</title></circle>`).join('');
    let labels = pts.map(p => `<text x="${p.x}" y="${h-12}" text-anchor="middle" font-size="10" fill="#9AA8B5">${p.day}</text>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
      <line x1="${pad}" y1="${targetY}" x2="${w-pad}" y2="${targetY}" stroke="#E9C46A" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="${w-pad}" y="${targetY-4}" text-anchor="end" font-size="10" fill="#E9C46A">目标${u.targetCal}</text>
      ${labels}<path d="${path}" fill="none" stroke="#0B7285" stroke-width="2" stroke-linecap="round"/>${dots}
    </svg>`;
  }

  function renderProgress(u) {
    const avgCal = Math.round(u.weekIntake.reduce((s, d) => s + d.cal, 0) / 7);
    const avgProtein = Math.round(u.weekIntake.reduce((s, d) => s + d.protein, 0) / 7);
    const calRate = Math.min(100, Math.round(avgCal / u.targetCal * 100));
    const proRate = Math.min(100, Math.round(avgProtein / u.targetProtein * 100));
    return `<div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>热量达标率</span><span style="color:${calRate>110?'#E76F51':calRate>=90?'#2A9D8F':'#E9C46A'};">${calRate}% (${avgCal}/${u.targetCal})</span></div>
      <div style="height:6px;background:#EEF2F6;border-radius:3px;overflow:hidden;"><div style="width:${Math.min(100,calRate)}%;height:100%;background:linear-gradient(90deg,#0B7285,#2A9D8F);border-radius:3px;"></div></div>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>蛋白质达标率</span><span style="color:${proRate>=90?'#2A9D8F':'#E9C46A'};">${proRate}% (${avgProtein}g/${u.targetProtein}g)</span></div>
      <div style="height:6px;background:#EEF2F6;border-radius:3px;overflow:hidden;"><div style="width:${proRate}%;height:100%;background:linear-gradient(90deg,#2A9D8F,#5BA89F);border-radius:3px;"></div></div>
    </div>`;
  }

  function renderUserCard(u) {
    const expanded = state.expandedId === u.id;
    return `<div class="card" style="margin-bottom:14px;">
      <div class="card-body" style="padding:16px;">
        <div style="display:flex;gap:14px;align-items:center;cursor:pointer;" onclick="PageNutritionistUsers.toggle(${u.id})">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#0B7285,#2A9D8F);display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0;">${u.avatar}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <strong style="color:#2C3E50;font-size:15px;">${u.name}</strong>
              ${u.followed ? '<span class="tag tag-warning" style="font-size:10px;">关注</span>' : ''}
              <span class="tag tag-info" style="font-size:10px;">${u.target}</span>
            </div>
            <div style="font-size:12px;color:#9AA8B5;margin-top:3px;">${u.gender} · ${u.age}岁 · BMI <span style="color:${bmiColor(u.bmi)};font-weight:600;">${u.bmi}</span> · 活跃度${u.activity} · 最近记录 ${u.lastRecord}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:11px;color:#9AA8B5;">体重/目标</div>
            <div style="font-size:14px;font-weight:600;color:#0B7285;">${u.weight}kg → ${u.targetWeight}kg</div>
          </div>
          <i data-lucide="${expanded?'chevron-up':'chevron-down'}" style="color:#9AA8B5;flex-shrink:0;"></i>
        </div>
        ${expanded ? `
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #EEF2F6;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;">
            <div style="text-align:center;background:#F7FAFC;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:#0B7285;">${u.height}cm</div><div style="font-size:11px;color:#9AA8B5;">身高</div></div>
            <div style="text-align:center;background:#F7FAFC;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:#2A9D8F;">${u.bmr}</div><div style="font-size:11px;color:#9AA8B5;">基础代谢(kcal)</div></div>
            <div style="text-align:center;background:#F7FAFC;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:#E9C46A;">${u.targetCal}</div><div style="font-size:11px;color:#9AA8B5;">目标热量(kcal)</div></div>
            <div style="text-align:center;background:#F7FAFC;border-radius:10px;padding:10px;"><div style="font-size:18px;font-weight:700;color:#F4A261;">${u.targetProtein}g</div><div style="font-size:11px;color:#9AA8B5;">目标蛋白质</div></div>
          </div>
          <h4 style="margin:0 0 8px;font-size:13px;color:#2C3E50;">近7天热量摄入趋势</h4>
          <div style="margin-bottom:16px;">${renderIntakeChart(u)}</div>
          <h4 style="margin:0 0 8px;font-size:13px;color:#2C3E50;">营养达标率</h4>
          <div style="margin-bottom:16px;">${renderProgress(u)}</div>
          <h4 style="margin:0 0 8px;font-size:13px;color:#2C3E50;">异常提醒</h4>
          <div style="margin-bottom:16px;">${u.alerts.map(a => `<div style="padding:8px 12px;border-radius:8px;margin-bottom:6px;font-size:12px;background:${a.type==='danger'?'#FEF2F2':a.type==='warning'?'#FFFBEB':a.type==='success'?'#ECFDF5':'#F0F9FF'};color:${a.type==='danger'?'#B91C1C':a.type==='warning'?'#92400E':a.type==='success'?'#065F46':'#075985'};">${a.text}</div>`).join('')}</div>
          <h4 style="margin:0 0 8px;font-size:13px;color:#2C3E50;">历史建议记录</h4>
          ${u.history.map(h => `<div style="padding:8px 12px;background:#F7FAFC;border-radius:8px;margin-bottom:6px;font-size:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:3px;"><span class="tag tag-info" style="font-size:10px;">${h.type}</span><span style="color:#9AA8B5;">${h.date}</span></div><div style="color:#2C3E50;">${h.advice}</div></div>`).join('')}
          <div style="margin-top:14px;display:flex;gap:8px;">
            <button class="btn btn-sm btn-primary" onclick="UI.toast('已打开建议编辑器','info')">发送建议</button>
            <button class="btn btn-sm btn-outline" onclick="UI.toast('查看完整档案','info')">查看档案</button>
            <button class="btn btn-sm ${u.followed?'btn-warning':'btn-success'}" onclick="UI.toast('${u.followed?'已取消关注':'已标记关注'}','success')">${u.followed?'取消关注':'标记关注'}</button>
          </div>
        </div>` : ''}
      </div>
    </div>`;
  }

  function render() {
    const filtered = getFiltered();
    return `
    <div class="page-header">
      <h1><i data-lucide="users"></i> 用户管理</h1>
      <p style="color:#6B7C8D;margin-top:4px;">共 ${users.length} 位服务用户 · ${users.filter(u=>u.followed).length} 位重点关注</p>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <div style="flex:1;min-width:200px;position:relative;">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;color:#9AA8B5;"></i>
          <input type="text" class="form-input" id="userSearch" placeholder="搜索用户昵称..." value="${state.search}" style="padding-left:34px;">
        </div>
        <select class="form-input" id="userTarget" style="width:auto;min-width:120px;">
          ${targets.map(t => `<option value="${t}" ${state.target===t?'selected':''}>${t==='all'?'全部目标':t}</option>`).join('')}
        </select>
      </div>
    </div>

    ${filtered.map(renderUserCard).join('')}
    ${filtered.length === 0 ? '<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:#9AA8B5;">未找到匹配的用户</div></div>' : ''}`;
  }

  function toggle(id) { state.expandedId = state.expandedId === id ? null : id; App.rerender(); }
  function bindEvents() {
    const s = document.getElementById('userSearch');
    const t = document.getElementById('userTarget');
    if (s) s.addEventListener('input', e => { state.search = e.target.value; App.rerender(); });
    if (t) t.addEventListener('change', e => { state.target = e.target.value; App.rerender(); });
  }
  return { render, bindEvents, toggle };
})();
