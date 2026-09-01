/* 记录与趋势页 */
const PageHistory = (() => {
  let filter = 'all'; // all|7d|30d
  let periodFilter = 'all'; // all|breakfast|lunch|dinner|snack
  let view = 'list'; // list|trend

  function render() {
    const records = AppState.getRecords().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    let filtered = filterRecords(records, filter);
    if (periodFilter !== 'all') filtered = filtered.filter(r => r.meal_period === periodFilter);

    return `
      <div class="page-header">
        <h1 class="page-title">记录与趋势</h1>
        <p class="page-subtitle">日/周/月筛选 · 修改/删除/补录 · 来源查看 · 本地存储</p>
        ${UI.demoTags(['demo', 'demo-data'])}
      </div>

      <div class="filter-bar">
        <div style="display:flex;gap:4px;background:var(--color-bg-alt);padding:4px;border-radius:8px;">
          <button class="btn btn-sm ${filter==='all'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setFilter('all')">全部</button>
          <button class="btn btn-sm ${filter==='7d'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setFilter('7d')">近7天</button>
          <button class="btn btn-sm ${filter==='30d'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setFilter('30d')">近30天</button>
        </div>
        <div style="display:flex;gap:4px;background:var(--color-bg-alt);padding:4px;border-radius:8px;flex-wrap:wrap;">
          <button class="btn btn-sm ${periodFilter==='all'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setPeriod('all')">全部时段</button>
          <button class="btn btn-sm ${periodFilter==='breakfast'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setPeriod('breakfast')">🌅早餐</button>
          <button class="btn btn-sm ${periodFilter==='lunch'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setPeriod('lunch')">☀️午餐</button>
          <button class="btn btn-sm ${periodFilter==='dinner'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setPeriod('dinner')">🌙晚餐</button>
          <button class="btn btn-sm ${periodFilter==='snack'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setPeriod('snack')">☕加餐</button>
        </div>
        <div style="display:flex;gap:4px;background:var(--color-bg-alt);padding:4px;border-radius:8px;">
          <button class="btn btn-sm ${view==='list'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setView('list')"><i data-lucide="list"></i>列表</button>
          <button class="btn btn-sm ${view==='trend'?'btn-primary':'btn-ghost'}" onclick="PageHistory.setView('trend')"><i data-lucide="trending-up"></i>趋势</button>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="PageHistory.exportData()"><i data-lucide="download"></i>导出JSON</button>
          <a href="#/record/beverage" class="btn btn-primary btn-sm"><i data-lucide="plus"></i>补录</a>
        </div>
      </div>

      ${view === 'trend' ? renderTrend(filtered) : renderList(filtered)}

      ${filtered.length === 0 ? UI.emptyState('inbox', '暂无记录，点击右上角"补录"开始记录') : ''}
    `;
  }

  function filterRecords(records, f) {
    if (f === 'all') return records;
    const days = f === '7d' ? 7 : 30;
    const cutoff = Date.now() - days * 86400000;
    return records.filter(r => new Date(r.created_at).getTime() >= cutoff);
  }

  function renderList(records) {
    return records.map(r => {
      const kcal = (r.items || []).reduce((sum, it) => {
        if (it.calories_kcal?.interval) return sum + (it.calories_kcal.interval.min + it.calories_kcal.interval.max) / 2;
        if (it.calories_kcal?.value) return sum + it.calories_kcal.value;
        return sum;
      }, 0);
      const date = new Date(r.created_at);
      const dateStr = date.toLocaleDateString('zh-CN', {month:'short',day:'numeric'}) + ' ' + date.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
      return `<div class="record-item">
        <div class="record-icon"><i data-lucide="${r.source_type==='beverage'?'cup-soda':r.source_type==='meal_photo'?'camera':'receipt'}"></i></div>
        <div class="record-content">
          <div class="record-title">${r.merchant_label || '未命名记录'}
            ${r.status==='pending_confirmation'?' <span class="tag tag-pending">待确认</span>':''}
            ${r.source_type==='beverage'?' <span class="tag tag-demo">饮品</span>':' <span class="tag tag-demo">餐食</span>'}
          </div>
          <div class="record-meta">${r.meal_period || ''} · ${(r.items||[]).length}项 · ${dateStr}</div>
          <div class="record-nutrition">约 ${Math.round(kcal)} kcal（估算中值）</div>
          ${(r.items||[]).some(it=>it.warnings&&it.warnings.length) ? `<div style="font-size:0.75rem;color:var(--color-warning);margin-top:4px;"><i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> 含不确定性警告</div>` : ''}
        </div>
        <div class="record-actions">
          <button class="btn btn-ghost btn-sm" onclick="PageHistory.viewDetail('${r.id}')" aria-label="查看详情"><i data-lucide="eye"></i></button>
          <button class="btn btn-ghost btn-sm" onclick="PageHistory.editRecord('${r.id}')" aria-label="编辑"><i data-lucide="edit-3"></i></button>
          <button class="btn btn-ghost btn-sm" style="color:var(--color-error);" onclick="PageHistory.deleteRecord('${r.id}')" aria-label="删除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>`;
    }).join('');
  }

  function renderTrend(records) {
    // 按天聚合
    const byDay = {};
    for (const r of records) {
      const day = r.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { kcal: 0, protein: 0, sugar: 0, count: 0 };
      for (const it of (r.items || [])) {
        if (it.calories_kcal?.interval) byDay[day].kcal += (it.calories_kcal.interval.min + it.calories_kcal.interval.max) / 2;
        if (it.protein_g?.interval) byDay[day].protein += (it.protein_g.interval.min + it.protein_g.interval.max) / 2;
        if (it.sugar_g?.interval) byDay[day].sugar += (it.sugar_g.interval.min + it.sugar_g.interval.max) / 2;
      }
      byDay[day].count++;
    }
    const days = Object.keys(byDay).sort();
    const maxKcal = Math.max(...days.map(d => byDay[d].kcal), 1);

    if (days.length === 0) return UI.emptyState('bar-chart-3', '暂无趋势数据');

    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="bar-chart-3"></i>每日热量趋势（估算中值）</div>
          <span class="tag tag-demo-data">演示数据</span>
        </div>
        <div class="card-body">
          <div style="display:flex;align-items:flex-end;gap:8px;height:180px;padding:10px 0;">
            ${days.map(d => {
              const h = Math.max(4, (byDay[d].kcal / maxKcal) * 160);
              return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;">
                <div style="font-size:0.6875rem;color:var(--color-text-muted);">${Math.round(byDay[d].kcal)}</div>
                <div style="width:100%;max-width:32px;height:${h}px;background:var(--color-primary);border-radius:4px 4px 0 0;opacity:0.85;"></div>
                <div style="font-size:0.6875rem;color:var(--color-text-muted);">${d.slice(5)}</div>
              </div>`;
            }).join('')}
          </div>
          <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px;">柱状图高度为估算中值，非精确测量。数据仅存于本机浏览器。</p>
        </div>
      </div>
      <div class="grid-3">
        <div class="card"><div class="card-title" style="font-size:0.875rem;">平均热量</div><div style="font-size:1.5rem;font-weight:700;">${Math.round(days.reduce((s,d)=>s+byDay[d].kcal,0)/days.length)} <span style="font-size:0.875rem;font-weight:400;color:var(--color-text-muted);">kcal/天</span></div></div>
        <div class="card"><div class="card-title" style="font-size:0.875rem;">平均蛋白质</div><div style="font-size:1.5rem;font-weight:700;">${Math.round(days.reduce((s,d)=>s+byDay[d].protein,0)/days.length)} <span style="font-size:0.875rem;font-weight:400;color:var(--color-text-muted);">g/天</span></div></div>
        <div class="card"><div class="card-title" style="font-size:0.875rem;">平均糖摄入</div><div style="font-size:1.5rem;font-weight:700;">${Math.round(days.reduce((s,d)=>s+byDay[d].sugar,0)/days.length)} <span style="font-size:0.875rem;font-weight:400;color:var(--color-text-muted);">g/天</span></div></div>
      </div>
    `;
  }

  function viewDetail(id) {
    const r = AppState.getRecords().find(x => x.id === id);
    if (!r) return;
    const itemsHTML = (r.items || []).map(it => `
      <div style="border:1px solid var(--color-border);border-radius:8px;padding:10px;margin-bottom:8px;">
        <div style="font-weight:500;margin-bottom:6px;">${it.name}
          ${it.confidence?`<span class="tag ${it.confidence>=0.7?'tag-success':it.confidence>=0.5?'tag-pending':'tag-source-low'}" style="margin-left:6px;">置信度${Math.round(it.confidence*100)}%</span>`:''}
        </div>
        ${UI.nutritionGrid({
          kcal: it.calories_kcal, protein_g: it.protein_g, fat_g: it.fat_g,
          carbs_g: it.carbs_g, sugar_g: it.sugar_g, sodium_mg: it.sodium_mg || {value:null,interval:null,value_type:'unknown'}
        })}
        ${it.warnings&&it.warnings.length?`<div style="font-size:0.75rem;color:var(--color-warning);margin-top:6px;">⚠ ${it.warnings.join('；')}</div>`:''}
        ${it.beverage_result?`<details style="margin-top:6px;"><summary class="detail-toggle">查看饮品计算详情</summary><div class="detail-content" style="font-size:0.75rem;color:var(--color-text-secondary);">
          目录版本：${it.beverage_result.catalog_version} · 生效：${it.beverage_result.effective_from}<br>
          serving basis：${it.beverage_result.serving_basis?.description || '未知'}<br>
          来源：${(it.beverage_result.sources||[]).map(s=>s.publisher).join('；') || '来源不足'}
        </div></details>`:''}
      </div>
    `).join('');
    UI.modal('记录详情', `
      <div style="margin-bottom:12px;font-size:0.875rem;color:var(--color-text-secondary);">
        ${r.merchant_label} · ${r.meal_period} · ${new Date(r.created_at).toLocaleString('zh-CN')}
      </div>
      ${r.raw_text?`<div style="background:var(--color-bg);padding:8px 12px;border-radius:6px;font-size:0.8125rem;margin-bottom:12px;"><strong>原始文本：</strong><br>${r.raw_text}</div>`:''}
      ${itemsHTML || '<p>无明细项</p>'}
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button>`);
  }

  function editRecord(id) {
    UI.toast('编辑功能：可修改餐次、备注和实际摄入比例', 'info');
    viewDetail(id);
  }

  function deleteRecord(id) {
    UI.confirmDialog('删除记录', '确定要删除这条记录吗？此操作不可恢复。', () => {
      AppState.deleteRecord(id);
      UI.toast('记录已删除', 'success');
      App.rerender();
    }, '删除', true);
  }

  function exportData() {
    const records = AppState.getRecords();
    const profile = AppState.getProfile();
    const data = { export_time: new Date().toISOString(), profile, records, note: '本地演示数据导出，不含真实身份信息' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nutrition_records_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('已导出JSON文件', 'success');
  }

  function setFilter(f) { filter = f; App.rerender(); }
  function setPeriod(p) { periodFilter = p; App.rerender(); }
  function setView(v) { view = v; App.rerender(); }

  return { render, setFilter, setPeriod, setView, viewDetail, editRecord, deleteRecord, exportData };
})();
