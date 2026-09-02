/* 商家菜品管理页 */
const PageMerchantDishes = (() => {
  const state = { search: '', category: 'all', status: 'all', editingId: null, showAdd: false };

  const dishes = [
    { id: 1, name: '轻食鸡胸沙拉', category: '沙拉', price: 32, cal: 285, protein: 32, fat: 8, carb: 18, sodium: 420, status: '上架', weeklySales: 342, rating: 4.8, source: '营养师确认', version: 'v2.3', updated: '2026-08-28' },
    { id: 2, name: '藜麦三文鱼碗', category: '主食碗', price: 45, cal: 420, protein: 28, fat: 16, carb: 42, sodium: 380, status: '上架', weeklySales: 287, rating: 4.9, source: '实验室检测', version: 'v1.8', updated: '2026-08-25' },
    { id: 3, name: '低脂牛肉卷', category: '卷饼', price: 28, cal: 310, protein: 26, fat: 10, carb: 28, sodium: 510, status: '上架', weeklySales: 256, rating: 4.6, source: '商家自填', version: 'v3.1', updated: '2026-09-01' },
    { id: 4, name: '杂粮鸡腿饭', category: '主食碗', price: 26, cal: 480, protein: 24, fat: 14, carb: 58, sodium: 620, status: '上架', weeklySales: 198, rating: 4.5, source: '营养师确认', version: 'v2.0', updated: '2026-08-20' },
    { id: 5, name: '豆腐蔬菜汤', category: '汤品', price: 18, cal: 120, protein: 12, fat: 4, carb: 14, sodium: 350, status: '上架', weeklySales: 167, rating: 4.7, source: '实验室检测', version: 'v1.5', updated: '2026-08-15' },
    { id: 6, name: '牛油果鸡蛋吐司', category: '早餐', price: 24, cal: 350, protein: 18, fat: 18, carb: 32, sodium: 290, status: '上架', weeklySales: 145, rating: 4.6, source: '商家自填', version: 'v1.2', updated: '2026-08-10' },
    { id: 7, name: '香辣鸡腿堡', category: '汉堡', price: 22, cal: 520, protein: 22, fat: 24, carb: 48, sodium: 780, status: '下架', weeklySales: 89, rating: 4.3, source: '商家自填', version: 'v1.0', updated: '2026-07-20' },
    { id: 8, name: '希腊酸奶水果杯', category: '甜品', price: 20, cal: 180, protein: 10, fat: 5, carb: 28, sodium: 80, status: '上架', weeklySales: 134, rating: 4.8, source: '营养师确认', version: 'v2.1', updated: '2026-08-30' },
    { id: 9, name: '紫薯燕麦粥', category: '早餐', price: 16, cal: 220, protein: 8, fat: 3, carb: 42, sodium: 120, status: '上架', weeklySales: 112, rating: 4.5, source: '商家自填', version: 'v1.3', updated: '2026-08-18' },
    { id: 10, name: '照烧鸡腿定食', category: '主食碗', price: 38, cal: 560, protein: 30, fat: 18, carb: 62, sodium: 850, status: '上架', weeklySales: 178, rating: 4.7, source: '实验室检测', version: 'v2.5', updated: '2026-08-22' },
    { id: 11, name: '蔬菜春卷', category: '小食', price: 15, cal: 160, protein: 6, fat: 6, carb: 22, sodium: 320, status: '上架', weeklySales: 98, rating: 4.4, source: '商家自填', version: 'v1.1', updated: '2026-08-05' },
    { id: 12, name: '抹茶拿铁', category: '饮品', price: 18, cal: 140, protein: 6, fat: 4, carb: 22, sodium: 60, status: '下架', weeklySales: 76, rating: 4.6, source: '商家自填', version: 'v1.0', updated: '2026-07-15' }
  ];

  const categories = ['all', '沙拉', '主食碗', '卷饼', '汤品', '早餐', '汉堡', '甜品', '小食', '饮品'];

  function getFiltered() {
    return dishes.filter(d => {
      if (state.search && !d.name.includes(state.search)) return false;
      if (state.category !== 'all' && d.category !== state.category) return false;
      if (state.status !== 'all' && d.status !== state.status) return false;
      return true;
    });
  }

  function sourceTag(s) {
    const colors = { '营养师确认': 'tag-success', '实验室检测': 'tag-info', '商家自填': 'tag-warning' };
    return `<span class="tag ${colors[s] || 'tag-default'}">${s}</span>`;
  }

  function renderNutritionDetail(d) {
    return `<div style="background:#F7FAFC;border-radius:10px;padding:16px;margin-top:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong style="color:#0B7285;">营养信息（每100g）</strong>
        <div style="display:flex;gap:8px;align-items:center;">${sourceTag(d.source)}<span style="font-size:11px;color:#9AA8B5;">${d.version} · ${d.updated}</span></div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:12px;">
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#0B7285;">${d.cal}</div><div style="font-size:11px;color:#9AA8B5;">热量(kcal)</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#2A9D8F;">${d.protein}</div><div style="font-size:11px;color:#9AA8B5;">蛋白质(g)</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#E9C46A;">${d.fat}</div><div style="font-size:11px;color:#9AA8B5;">脂肪(g)</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#F4A261;">${d.carb}</div><div style="font-size:11px;color:#9AA8B5;">碳水(g)</div></div>
        <div style="text-align:center;"><div style="font-size:20px;font-weight:700;color:#E76F51;">${d.sodium}</div><div style="font-size:11px;color:#9AA8B5;">钠(mg)</div></div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn btn-sm" onclick="UI.toast('营养信息编辑功能','info')">编辑营养</button>
        <button class="btn btn-sm btn-outline" onclick="UI.toast('已提交营养师复核','success')">提交复核</button>
      </div>
    </div>`;
  }

  function render() {
    const filtered = getFiltered();
    return `
    <div class="page-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
      <div><h1><i data-lucide="utensils"></i> 菜品管理</h1>
      <p style="color:#6B7C8D;margin-top:4px;">共 ${dishes.length} 道菜品 · ${dishes.filter(d=>d.status==='上架').length} 道上架中</p></div>
      <button class="btn btn-primary" onclick="UI.toast('新增菜品表单','info')"><i data-lucide="plus"></i> 新增菜品</button>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
        <div style="flex:1;min-width:200px;position:relative;">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;color:#9AA8B5;"></i>
          <input type="text" class="form-input" id="dishSearch" placeholder="搜索菜品名称..." value="${state.search}" style="padding-left:34px;">
        </div>
        <select class="form-input" id="dishCategory" style="width:auto;min-width:120px;">
          ${categories.map(c => `<option value="${c}" ${state.category===c?'selected':''}>${c==='all'?'全部分类':c}</option>`).join('')}
        </select>
        <select class="form-input" id="dishStatus" style="width:auto;min-width:100px;">
          <option value="all" ${state.status==='all'?'selected':''}>全部状态</option>
          <option value="上架" ${state.status==='上架'?'selected':''}>上架</option>
          <option value="下架" ${state.status==='下架'?'selected':''}>下架</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="card-body" style="overflow-x:auto;padding:0;">
        <table class="data-table" style="margin:0;">
          <thead><tr>
            <th>菜品名称</th><th>分类</th><th>价格</th><th>热量/100g</th><th>状态</th><th>本周销量</th><th>评分</th><th>数据来源</th><th>操作</th>
          </tr></thead>
          <tbody>${filtered.map(d => `
            <tr>
              <td style="font-weight:500;color:#2C3E50;">${d.name}</td>
              <td><span class="tag tag-default">${d.category}</span></td>
              <td>¥${d.price}</td>
              <td>${d.cal} kcal</td>
              <td><span class="tag ${d.status==='上架'?'tag-success':'tag-not-connected'}">${d.status}</span></td>
              <td>${d.weeklySales}</td>
              <td style="color:#E9C46A;">★ ${d.rating}</td>
              <td>${sourceTag(d.source)}</td>
              <td style="white-space:nowrap;">
                <button class="btn btn-sm btn-outline" onclick="PageMerchantDishes.toggleDetail(${d.id})">详情</button>
                <button class="btn btn-sm" onclick="UI.toast('编辑 ${d.name}','info')">编辑</button>
                <button class="btn btn-sm ${d.status==='上架'?'btn-warning':'btn-success'}" onclick="UI.toast('已${d.status==='上架'?'下架':'上架'} ${d.name}','success')">${d.status==='上架'?'下架':'上架'}</button>
              </td>
            </tr>
            ${state.editingId === d.id ? `<tr><td colspan="9" style="padding:0 16px 16px;">${renderNutritionDetail(d)}</td></tr>` : ''}
          `).join('')}</tbody>
        </table>
        ${filtered.length === 0 ? '<div style="padding:40px;text-align:center;color:#9AA8B5;">未找到匹配的菜品</div>' : ''}
      </div>
    </div>`;
  }

  function toggleDetail(id) {
    state.editingId = state.editingId === id ? null : id;
    App.rerender();
  }

  function bindEvents() {
    const s = document.getElementById('dishSearch');
    const c = document.getElementById('dishCategory');
    const st = document.getElementById('dishStatus');
    if (s) s.addEventListener('input', e => { state.search = e.target.value; App.rerender(); });
    if (c) c.addEventListener('change', e => { state.category = e.target.value; App.rerender(); });
    if (st) st.addEventListener('change', e => { state.status = e.target.value; App.rerender(); });
  }

  return { render, bindEvents, toggleDetail };
})();
