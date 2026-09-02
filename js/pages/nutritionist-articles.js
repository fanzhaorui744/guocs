/* 营养师知识发布页 */
const PageNutritionistArticles = (() => {
  const state = { tab: 'list', editingId: null, filter: 'all' };

  const articles = [
    { id: 1, title: '减脂期外卖怎么选？营养师教你3个搭配公式', category: '减脂指南', time: '2026-09-01', views: 2340, likes: 156, collects: 89, status: '已发布', cover: '🥗' },
    { id: 2, title: '控糖人群必看：低GI食物清单与外卖选择技巧', category: '控糖建议', time: '2026-08-28', views: 1890, likes: 134, collects: 76, status: '已发布', cover: '🍵' },
    { id: 3, title: '蛋白质摄入全攻略：你每天到底需要多少蛋白质？', category: '营养科普', time: '2026-08-25', views: 3120, likes: 245, collects: 156, status: '已发布', cover: '💪' },
    { id: 4, title: '常见食材营养速查表（收藏版）', category: '食材百科', time: '2026-08-20', views: 4560, likes: 378, collects: 289, status: '已发布', cover: '📖' },
    { id: 5, title: '秋季养生：润燥养肺的5道推荐菜品', category: '营养科普', time: '2026-09-02', views: 0, likes: 0, collects: 0, status: '草稿', cover: '🍂' },
    { id: 6, title: '外卖酱料热量排行榜，第一名居然是它！', category: '减脂指南', time: '2026-09-02', views: 0, likes: 0, collects: 0, status: '草稿', cover: '🥫' }
  ];

  const categories = ['营养科普', '减脂指南', '控糖建议', '食材百科'];

  function render() {
    if (state.tab === 'editor') return renderEditor();
    if (state.tab === 'stats') return renderStats();
    const filtered = state.filter === 'all' ? articles : articles.filter(a => a.status === state.filter);
    return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
      <div><h1><i data-lucide="book-open"></i> 知识发布</h1>
      <p style="color:#6B7C8D;margin-top:4px;">共 ${articles.length} 篇 · ${articles.filter(a=>a.status==='已发布').length} 篇已发布</p></div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline" onclick="PageNutritionistArticles.setTab('stats')"><i data-lucide="bar-chart-2"></i> 数据看板</button>
        <button class="btn btn-primary" onclick="PageNutritionistArticles.setTab('editor')"><i data-lucide="plus"></i> 写文章</button>
      </div>
    </div>

    <div class="tabs" style="margin-bottom:16px;">
      <button class="tab-btn ${state.filter==='all'?'active':''}" onclick="PageNutritionistArticles.setFilter('all')">全部 (${articles.length})</button>
      <button class="tab-btn ${state.filter==='已发布'?'active':''}" onclick="PageNutritionistArticles.setFilter('已发布')">已发布 (${articles.filter(a=>a.status==='已发布').length})</button>
      <button class="tab-btn ${state.filter==='草稿'?'active':''}" onclick="PageNutritionistArticles.setFilter('草稿')">草稿 (${articles.filter(a=>a.status==='草稿').length})</button>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
      ${filtered.map(a => `<div class="card">
        <div class="card-body" style="padding:0;">
          <div style="height:120px;background:linear-gradient(135deg,#0B7285,#2A9D8F);display:flex;align-items:center;justify-content:center;font-size:48px;border-radius:12px 12px 0 0;">${a.cover}</div>
          <div style="padding:14px 16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <span class="tag tag-info" style="font-size:11px;">${a.category}</span>
              <span class="tag ${a.status==='已发布'?'tag-success':'tag-not-connected'}" style="font-size:11px;">${a.status}</span>
              <span style="font-size:11px;color:#9AA8B5;margin-left:auto;">${a.time}</span>
            </div>
            <h4 style="margin:0 0 10px;color:#2C3E50;font-size:14px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${a.title}</h4>
            <div style="display:flex;gap:14px;font-size:12px;color:#9AA8B5;margin-bottom:12px;">
              <span><i data-lucide="eye" style="width:13px;vertical-align:middle;"></i> ${a.views}</span>
              <span><i data-lucide="heart" style="width:13px;vertical-align:middle;"></i> ${a.likes}</span>
              <span><i data-lucide="bookmark" style="width:13px;vertical-align:middle;"></i> ${a.collects}</span>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-sm" onclick="UI.toast('编辑文章','info')">编辑</button>
              <button class="btn btn-sm ${a.status==='已发布'?'btn-warning':'btn-success'}" onclick="UI.toast('已${a.status==='已发布'?'下架':'发布'}','success')">${a.status==='已发布'?'下架':'发布'}</button>
              <button class="btn btn-sm btn-outline" onclick="UI.toast('查看数据','info')">数据</button>
            </div>
          </div>
        </div>
      </div>`).join('')}
    </div>`;
  }

  function renderEditor() {
    return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
      <h1><i data-lucide="edit-3"></i> ${state.editingId ? '编辑文章' : '写新文章'}</h1>
      <button class="btn btn-outline" onclick="PageNutritionistArticles.setTab('list')"><i data-lucide="arrow-left"></i> 返回列表</button>
    </div>
    <div class="card">
      <div class="card-body">
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:6px;">文章标题</label>
          <input type="text" class="form-input" placeholder="输入吸引人的标题..." value="${state.editingId ? articles.find(a=>a.id===state.editingId)?.title || '' : ''}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;" class="responsive-2col">
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:6px;">分类</label>
            <select class="form-input">${categories.map(c => `<option>${c}</option>`).join('')}</select>
          </div>
          <div>
            <label style="display:block;font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:6px;">封面图标</label>
            <input type="text" class="form-input" placeholder="输入emoji如 🥗" value="🥗">
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:6px;">关联菜品/标签</label>
          <input type="text" class="form-input" placeholder="如：轻食沙拉, 减脂, 高蛋白">
        </div>
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#2C3E50;margin-bottom:6px;">正文内容</label>
          <textarea class="form-input" rows="12" placeholder="在这里撰写文章内容...支持纯文本格式。&#10;&#10;建议结构：&#10;1. 引入问题&#10;2. 核心观点&#10;3. 实操建议&#10;4. 总结"></textarea>
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-primary" onclick="UI.toast('文章已发布','success')"><i data-lucide="send"></i> 发布</button>
          <button class="btn btn-outline" onclick="UI.toast('已保存为草稿','info')"><i data-lucide="save"></i> 存草稿</button>
          <button class="btn btn-outline" onclick="UI.toast('预览模式','info')"><i data-lucide="eye"></i> 预览</button>
        </div>
      </div>
    </div>`;
  }

  function renderStats() {
    const totalViews = articles.reduce((s, a) => s + a.views, 0);
    const totalLikes = articles.reduce((s, a) => s + a.likes, 0);
    const totalCollects = articles.reduce((s, a) => s + a.collects, 0);
    const fansData = [120, 135, 148, 162, 178, 195, 210, 228, 245, 262, 280, 298];
    const w = 500, h = 180, pad = 40;
    const max = Math.max(...fansData) * 1.1;
    const pts = fansData.map((v, i) => ({ x: pad + i * (w - pad * 2) / (fansData.length - 1), y: h - pad - (v / max) * (h - pad * 2), v }));
    const path = pts.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
    return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
      <h1><i data-lucide="bar-chart-2"></i> 数据看板</h1>
      <button class="btn btn-outline" onclick="PageNutritionistArticles.setTab('list')"><i data-lucide="arrow-left"></i> 返回列表</button>
    </div>
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:20px;">
      <div class="stat-card"><div class="stat-label">总阅读量</div><div class="stat-value">${totalViews.toLocaleString()}</div><div class="stat-trend up">+18% 本月</div></div>
      <div class="stat-card"><div class="stat-label">总点赞</div><div class="stat-value">${totalLikes.toLocaleString()}</div><div class="stat-trend up">+24% 本月</div></div>
      <div class="stat-card"><div class="stat-label">总收藏</div><div class="stat-value">${totalCollects.toLocaleString()}</div><div class="stat-trend up">+15% 本月</div></div>
      <div class="stat-card"><div class="stat-label">粉丝数</div><div class="stat-value">298</div><div class="stat-trend up">+32 本月</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>近12个月粉丝增长趋势</h3></div>
      <div class="card-body">
        <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;">
          <defs><linearGradient id="fansGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2A9D8F" stop-opacity="0.2"/><stop offset="100%" stop-color="#2A9D8F" stop-opacity="0.02"/></linearGradient></defs>
          ${[0,1,2,3].map(i => { const y = h-pad-(i*(h-pad*2)/3); return `<line x1="${pad}" y1="${y}" x2="${w-pad}" y2="${y}" stroke="#EEF2F6"/><text x="${pad-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#9AA8B5">${Math.round(max*(3-i)/3)}</text>`; }).join('')}
          <path d="${path} L${pts[pts.length-1].x},${h-pad} L${pts[0].x},${h-pad} Z" fill="url(#fansGrad)"/>
          <path d="${path}" fill="none" stroke="#2A9D8F" stroke-width="2.5" stroke-linecap="round"/>
          ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#2A9D8F"><title>${p.v}粉丝</title></circle>`).join('')}
        </svg>
      </div>
    </div>`;
  }

  function setTab(tab) { state.tab = tab; App.rerender(); }
  function setFilter(f) { state.filter = f; App.rerender(); }
  function bindEvents() {}
  return { render, bindEvents, setTab, setFilter };
})();
