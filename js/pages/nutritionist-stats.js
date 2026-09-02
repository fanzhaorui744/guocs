/* 营养师数据统计页 */
const PageNutritionistStats = (() => {
  const monthlyReviews = [42, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85, 80, 75, 82, 88, 79, 92, 86, 95, 89, 98, 93, 102, 97, 105, 100, 108, 103, 110, 106];
  const adviceTypes = [
    { label: '饮食调整', value: 45, color: '#0B7285' },
    { label: '运动建议', value: 25, color: '#2A9D8F' },
    { label: '营养补充', value: 18, color: '#E9C46A' },
    { label: '就医提醒', value: 12, color: '#E76F51' }
  ];
  const userGrowth = [8, 12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45];
  const rankings = [
    { rank: 1, name: '张营养师', reviews: 320, advice: 185, score: 98 },
    { rank: 2, name: '李营养师', reviews: 285, advice: 162, score: 96 },
    { rank: 3, name: '我（当前）', reviews: 268, advice: 156, score: 95, isMe: true },
    { rank: 4, name: '王营养师', reviews: 245, advice: 140, score: 93 },
    { rank: 5, name: '陈营养师', reviews: 220, advice: 128, score: 91 }
  ];
  const hotTopics = [
    { topic: '#减脂餐搭配', count: 156 },
    { topic: '#控糖饮食', count: 134 },
    { topic: '#高蛋白食谱', count: 118 },
    { topic: '#外卖健康选择', count: 95 },
    { topic: '#低卡零食', count: 78 }
  ];

  function renderBarChart() {
    const w = 600, h = 200, pad = 35;
    const max = Math.max(...monthlyReviews) * 1.1;
    const bw = (w - pad * 2) / monthlyReviews.length * 0.7;
    let bars = monthlyReviews.map((v, i) => {
      const x = pad + i * (w - pad * 2) / monthlyReviews.length + ((w - pad * 2) / monthlyReviews.length - bw) / 2;
      const bh = (v / max) * (h - pad * 2);
      const y = h - pad - bh;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="url(#barGrad)"><title>第${i+1}天: ${v}条复核</title></rect>`;
    }).join('');
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
      <defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0B7285"/><stop offset="100%" stop-color="#2A9D8F"/></linearGradient></defs>
      ${[0,1,2,3].map(i => { const y = h-pad-(i*(h-pad*2)/3); return `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#EEF2F6"/><text x="${pad-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#9AA8B5">${Math.round(max*(3-i)/3)}</text>`; }).join('')}
      ${bars}
      <text x="${w/2}" y="${h-8}" text-anchor="middle" font-size="11" fill="#9AA8B5">近30天复核量趋势</text>
    </svg>`;
  }

  function renderPie() {
    const total = adviceTypes.reduce((s, d) => s + d.value, 0);
    const cx = 90, cy = 90, r = 70, ir = 42;
    let startAngle = -Math.PI / 2;
    let paths = '';
    let legend = '';
    adviceTypes.forEach(d => {
      const angle = (d.value / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
      const xi1 = cx + ir * Math.cos(endAngle), yi1 = cy + ir * Math.sin(endAngle);
      const xi2 = cx + ir * Math.cos(startAngle), yi2 = cy + ir * Math.sin(startAngle);
      const large = angle > Math.PI ? 1 : 0;
      paths += `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi2},${yi2} Z" fill="${d.color}"/>`;
      legend += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><span style="width:12px;height:12px;border-radius:3px;background:${d.color};display:inline-block;"></span><span style="font-size:13px;color:#2C3E50;flex:1;">${d.label}</span><span style="font-size:13px;color:#6B7C8D;font-weight:600;">${d.value}%</span></div>`;
      startAngle = endAngle;
    });
    return `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
      <svg viewBox="0 0 180 180" style="width:150px;height:150px;flex-shrink:0;">${paths}
        <text x="${cx}" y="${cy-5}" text-anchor="middle" font-size="10" fill="#9AA8B5">建议类型</text>
        <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="16" font-weight="700" fill="#0B7285">${total}%</text>
      </svg><div style="flex:1;min-width:120px;">${legend}</div></div>`;
  }

  function renderLineChart() {
    const w = 400, h = 160, pad = 35;
    const max = Math.max(...userGrowth) * 1.15;
    const pts = userGrowth.map((v, i) => ({ x: pad + i * (w - pad * 2) / (userGrowth.length - 1), y: h - pad - (v / max) * (h - pad * 2), v }));
    const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
      ${[0,1,2].map(i => { const y = h-pad-(i*(h-pad*2)/2); return `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#EEF2F6"/>`; }).join('')}
      <path d="${path}" fill="none" stroke="#2A9D8F" stroke-width="2.5" stroke-linecap="round"/>
      ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#2A9D8F"><title>${p.v}位用户</title></circle>`).join('')}
      <text x="${w/2}" y="${h-8}" text-anchor="middle" font-size="10" fill="#9AA8B5">近12月服务用户增长</text>
    </svg>`;
  }

  function render() {
    return `
    <div class="page-header">
      <h1><i data-lucide="bar-chart-3"></i> 数据统计</h1>
      <p style="color:#6B7C8D;margin-top:4px;">个人工作数据与平台排名</p>
    </div>

    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:20px;">
      <div class="stat-card"><div class="stat-label">本月复核记录</div><div class="stat-value">106</div><div class="stat-trend up">+12% 环比</div></div>
      <div class="stat-card"><div class="stat-label">发送建议数</div><div class="stat-value">156</div><div class="stat-trend up">+8% 环比</div></div>
      <div class="stat-card"><div class="stat-label">发布文章数</div><div class="stat-value">4</div><div class="stat-trend up">+1 环比</div></div>
      <div class="stat-card"><div class="stat-label">服务用户数</div><div class="stat-value">45</div><div class="stat-trend up">+7 环比</div></div>
      <div class="stat-card"><div class="stat-label">复核准确率</div><div class="stat-value">92%</div><div class="stat-trend up">+3% 环比</div></div>
      <div class="stat-card"><div class="stat-label">用户满意度</div><div class="stat-value">4.7</div><div class="stat-trend up">+0.2 环比</div></div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;" class="responsive-2col">
      <div class="card">
        <div class="card-header"><h3>近30天复核量趋势</h3><span class="tag tag-success">日均89条</span></div>
        <div class="card-body">${renderBarChart()}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>建议类型分布</h3></div>
        <div class="card-body">${renderPie()}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="responsive-2col">
      <div class="card">
        <div class="card-header"><h3>服务用户增长</h3></div>
        <div class="card-body">${renderLineChart()}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>热门营养话题 Top5</h3></div>
        <div class="card-body">
          ${hotTopics.map((t, i) => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span style="width:24px;height:24px;border-radius:6px;background:${i<3?'linear-gradient(135deg,#0B7285,#2A9D8F)':'#EEF2F6'};color:${i<3?'#fff':'#9AA8B5'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${i+1}</span>
            <span style="flex:1;font-size:13px;color:#2C3E50;">${t.topic}</span>
            <span style="font-size:12px;color:#9AA8B5;">${t.count}次</span>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:20px;">
      <div class="card-header"><h3>营养师活跃度排行</h3><span class="tag tag-info">本月</span></div>
      <div class="card-body" style="overflow-x:auto;padding:0;">
        <table class="data-table" style="margin:0;">
          <thead><tr><th>排名</th><th>营养师</th><th>复核数</th><th>建议数</th><th>综合评分</th></tr></thead>
          <tbody>${rankings.map(r => `<tr style="${r.isMe?'background:#F0FDF9;font-weight:600;':''}">
            <td><span style="display:inline-flex;width:26px;height:26px;border-radius:50%;background:${r.rank<=3?'linear-gradient(135deg,#0B7285,#2A9D8F)':'#EEF2F6'};color:${r.rank<=3?'#fff':'#9AA8B5'};align-items:center;justify-content:center;font-size:12px;font-weight:700;">${r.rank}</span></td>
            <td>${r.name}${r.isMe?' <span class="tag tag-success" style="font-size:10px;">我</span>':''}</td>
            <td>${r.reviews}</td><td>${r.advice}</td>
            <td style="color:#E9C46A;">★ ${r.score}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
  }

  function bindEvents() {}
  return { render, bindEvents };
})();
