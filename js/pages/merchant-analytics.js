/* 商家数据分析页 */
const PageMerchantAnalytics = (() => {
  const state = { activeTab: 'overview' };

  const dailyOrders = [
    { date: '08-27', orders: 142, revenue: 3580 },
    { date: '08-28', orders: 168, revenue: 4210 },
    { date: '08-29', orders: 155, revenue: 3890 },
    { date: '08-30', orders: 189, revenue: 4750 },
    { date: '08-31', orders: 203, revenue: 5120 },
    { date: '09-01', orders: 176, revenue: 4430 },
    { date: '09-02', orders: 198, revenue: 4980 }
  ];

  const dishClicks = [
    { name: '轻食鸡胸沙拉', clicks: 342, trend: '+12%' },
    { name: '藜麦三文鱼碗', clicks: 287, trend: '+8%' },
    { name: '低脂牛肉卷', clicks: 256, trend: '+15%' },
    { name: '杂粮鸡腿饭', clicks: 198, trend: '-3%' },
    { name: '豆腐蔬菜汤', clicks: 167, trend: '+22%' }
  ];

  const communityPosts = [
    { title: '这家轻食店的沙拉真的绝了！', views: 1280, likes: 89, comments: 23, time: '2小时前' },
    { title: '减脂期外卖怎么选？亲测有效', views: 2150, likes: 156, comments: 41, time: '5小时前' },
    { title: '营养师推荐的控糖套餐测评', views: 980, likes: 67, comments: 18, time: '昨天' },
    { title: '一周外卖减脂餐打卡', views: 3420, likes: 234, comments: 67, time: '2天前' }
  ];

  const userPreferences = [
    { label: '高蛋白', value: 35, color: '#0B7285' },
    { label: '低脂', value: 28, color: '#2A9D8F' },
    { label: '低糖', value: 22, color: '#E9C46A' },
    { label: '均衡', value: 15, color: '#F4A261' }
  ];

  function renderLineChart() {
    const w = 560, h = 200, pad = 40;
    const max = Math.max(...dailyOrders.map(d => d.orders)) * 1.15;
    const points = dailyOrders.map((d, i) => {
      const x = pad + (i * (w - pad * 2) / (dailyOrders.length - 1));
      const y = h - pad - (d.orders / max * (h - pad * 2));
      return { x, y, ...d };
    });
    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    const area = path + ` L${points[points.length-1].x},${h-pad} L${points[0].x},${h-pad} Z`;
    let dots = points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#0B7285" stroke="#fff" stroke-width="2"><title>${p.date}: ${p.orders}单</title></circle>`).join('');
    let labels = points.map(p => `<text x="${p.x}" y="${h-15}" text-anchor="middle" font-size="11" fill="#6B7C8D">${p.date}</text>`).join('');
    let yLabels = '';
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(max * i / 4);
      const y = h - pad - (val / max * (h - pad * 2));
      yLabels += `<text x="${pad-8}" y="${y+4}" text-anchor="end" font-size="10" fill="#9AA8B5">${val}</text>`;
      yLabels += `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#E8EDF2" stroke-width="1"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
      <defs><linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B7285" stop-opacity="0.25"/><stop offset="100%" stop-color="#0B7285" stop-opacity="0.02"/>
      </linearGradient></defs>
      ${yLabels}${labels}<path d="${area}" fill="url(#orderGrad)"/>
      <path d="${path}" fill="none" stroke="#0B7285" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}
    </svg>`;
  }

  function renderHBarChart() {
    const max = Math.max(...dishClicks.map(d => d.clicks));
    return dishClicks.map((d, i) => {
      const pct = (d.clicks / max * 100).toFixed(0);
      const color = i === 0 ? '#0B7285' : i === 1 ? '#2A9D8F' : '#5BA89F';
      return `<div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span style="font-size:13px;color:#2C3E50;font-weight:500;">${d.name}</span>
          <span style="font-size:12px;color:#6B7C8D;">${d.clicks}次 <span style="color:#2A9D8F;">${d.trend}</span></span>
        </div>
        <div style="height:8px;background:#EEF2F6;border-radius:4px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,${color},${color}dd);border-radius:4px;transition:width .6s;"></div>
        </div>
      </div>`;
    }).join('');
  }

  function renderPieChart() {
    const total = userPreferences.reduce((s, d) => s + d.value, 0);
    const cx = 90, cy = 90, r = 70, ir = 42;
    let startAngle = -Math.PI / 2;
    let paths = '';
    let legend = '';
    userPreferences.forEach(d => {
      const angle = (d.value / total) * Math.PI * 2;
      const endAngle = startAngle + angle;
      const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
      const xi1 = cx + ir * Math.cos(endAngle), yi1 = cy + ir * Math.sin(endAngle);
      const xi2 = cx + ir * Math.cos(startAngle), yi2 = cy + ir * Math.sin(startAngle);
      const large = angle > Math.PI ? 1 : 0;
      paths += `<path d="M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi2},${yi2} Z" fill="${d.color}"/>`;
      legend += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="width:12px;height:12px;border-radius:3px;background:${d.color};display:inline-block;"></span>
        <span style="font-size:13px;color:#2C3E50;flex:1;">${d.label}</span>
        <span style="font-size:13px;color:#6B7C8D;font-weight:600;">${d.value}%</span>
      </div>`;
      startAngle = endAngle;
    });
    return `<div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
      <svg viewBox="0 0 180 180" style="width:160px;height:160px;flex-shrink:0;">${paths}
        <text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="11" fill="#9AA8B5">用户偏好</text>
        <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="18" font-weight="700" fill="#0B7285">${total}%</text>
      </svg>
      <div style="flex:1;min-width:120px;">${legend}</div>
    </div>`;
  }

  function render() {
    return `
    <div class="page-header">
      <h1><i data-lucide="bar-chart-3"></i> 数据分析</h1>
      <p style="color:#6B7C8D;margin-top:4px;">经营数据全景 · 实时更新</p>
    </div>

    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:20px;">
      <div class="stat-card"><div class="stat-label">今日订单量</div><div class="stat-value">198</div><div class="stat-trend up">+12.5% 环比</div></div>
      <div class="stat-card"><div class="stat-label">菜品识别次数</div><div class="stat-value">1,247</div><div class="stat-trend up">+8.3% 环比</div></div>
      <div class="stat-card"><div class="stat-label">社区帖子浏览</div><div class="stat-value">8,562</div><div class="stat-trend up">+23.1% 环比</div></div>
      <div class="stat-card"><div class="stat-label">用户收藏数</div><div class="stat-value">342</div><div class="stat-trend down">-2.1% 环比</div></div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:20px;" class="responsive-2col">
      <div class="card">
        <div class="card-header"><h3>近7天订单趋势</h3><span class="tag tag-success">实时</span></div>
        <div class="card-body">${renderLineChart()}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>用户营养偏好分布</h3></div>
        <div class="card-body">${renderPieChart()}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;" class="responsive-2col">
      <div class="card">
        <div class="card-header"><h3>菜品点击率排行 Top5</h3></div>
        <div class="card-body">${renderHBarChart()}</div>
      </div>
      <div class="card">
        <div class="card-header"><h3>社区帖子互动排行</h3></div>
        <div class="card-body" style="overflow-x:auto;">
          <table class="data-table">
            <thead><tr><th>标题</th><th>浏览</th><th>点赞</th><th>评论</th><th>时间</th></tr></thead>
            <tbody>${communityPosts.map(p => `<tr>
              <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${p.title}">${p.title}</td>
              <td>${p.views}</td><td>${p.likes}</td><td>${p.comments}</td><td style="color:#9AA8B5;font-size:12px;">${p.time}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>`;
  }

  function bindEvents() {}
  return { render, bindEvents };
})();
