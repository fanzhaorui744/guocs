/* 商家工作台 */
const PageMerchant = (() => {
  let tab = 'skus'; // skus|import|review|feedback
  let searchQuery = '';
  let statusFilter = 'all';

  function render() {
    return `
      <div class="page-header">
        <h1 class="page-title">商家工作台</h1>
        <p class="page-subtitle">SKU维护 · Excel导入 · 审核流 · 聚合反馈</p>
        ${UI.demoTags(['demo', 'demo-data', 'not-connected'])}
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.8125rem;color:var(--color-text-secondary);flex-wrap:wrap;">
          <i data-lucide="store" style="width:16px;height:16px;color:var(--color-primary);"></i>
          <span>当前角色：商家（本地演示账号）· 不代表真实合作或资质已核验 · API为后续规划，当前未接入</span>
        </div>
      </div>

      <div class="filter-bar">
        <div style="display:flex;gap:4px;background:var(--color-bg);padding:4px;border-radius:6px;flex-wrap:wrap;">
          <button class="btn btn-sm ${tab==='skus'?'btn-primary':'btn-ghost'}" onclick="PageMerchant.setTab('skus')"><i data-lucide="list"></i>SKU列表</button>
          <button class="btn btn-sm ${tab==='import'?'btn-primary':'btn-ghost'}" onclick="PageMerchant.setTab('import')"><i data-lucide="file-spreadsheet"></i>Excel导入</button>
          <button class="btn btn-sm ${tab==='review'?'btn-primary':'btn-ghost'}" onclick="PageMerchant.setTab('review')"><i data-lucide="clipboard-check"></i>审核流</button>
          <button class="btn btn-sm ${tab==='feedback'?'btn-primary':'btn-ghost'}" onclick="PageMerchant.setTab('feedback')"><i data-lucide="message-square"></i>聚合反馈</button>
        </div>
      </div>

      ${tab === 'skus' ? renderSkus() : ''}
      ${tab === 'import' ? renderImport() : ''}
      ${tab === 'review' ? renderReview() : ''}
      ${tab === 'feedback' ? renderFeedback() : ''}
    `;
  }

  function renderSkus() {
    let skus = [...NPV2_DATA.MERCHANT_SKUS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      skus = skus.filter(s => s.product_name.toLowerCase().includes(q) || s.brand_name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      skus = skus.filter(s => s.record_status === statusFilter);
    }

    return `
      <div class="filter-bar">
        <input class="form-input" placeholder="搜索SKU/品牌..." value="${searchQuery}" oninput="PageMerchant.search(this.value)" style="max-width:240px;">
        <select class="form-select" onchange="PageMerchant.filterStatus(this.value)">
          <option value="all">全部状态</option>
          <option value="已验证">已验证</option>
          <option value="待审核">待审核</option>
          <option value="部分披露">部分披露</option>
          <option value="估算">估算</option>
          <option value="停用">停用</option>
        </select>
        <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="PageMerchant.addSku()"><i data-lucide="plus"></i>手动添加SKU</button>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>品牌</th><th>产品名</th><th>分类</th><th>规格</th><th>默认糖度</th>
                <th>热量(kcal)</th><th>状态</th><th>置信度</th><th>版本</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${skus.map(s => `
                <tr>
                  <td>${s.brand_name}</td>
                  <td><strong>${s.product_name}</strong></td>
                  <td>${s.category}</td>
                  <td>${s.cup_size}</td>
                  <td>${s.default_sugar}</td>
                  <td style="font-variant-numeric:tabular-nums;">${s.kcal !== null ? s.kcal : '<span style="color:var(--color-unknown);">未知</span>'}</td>
                  <td><span class="tag ${s.record_status==='已验证'?'tag-success':s.record_status==='待审核'?'tag-pending':s.record_status==='停用'?'tag-error':'tag-demo-data'}">${s.record_status}</span></td>
                  <td>${Math.round((s.confidence||0)*100)}%</td>
                  <td>${s.version}</td>
                  <td>
                    <div class="table-actions">
                      <button class="btn btn-ghost btn-sm" onclick="PageMerchant.editSku('${s.sku_id}')" aria-label="编辑"><i data-lucide="edit-3"></i></button>
                      <button class="btn btn-ghost btn-sm" onclick="PageMerchant.viewSku('${s.sku_id}')" aria-label="查看来源"><i data-lucide="eye"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px;"><span class="tag tag-demo-data">固定演示数据</span> 以上SKU为虚构演示数据，不代表真实商家菜单或营养信息。</p>
    `;
  }

  function renderImport() {
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="file-spreadsheet"></i>Excel批量导入</div>
          <span class="tag tag-not-connected">预览为Demo模拟</span>
        </div>
        <div class="card-body">
          <p style="font-size:0.875rem;color:var(--color-text-secondary);margin-bottom:12px;">批量导入SKU营养资料。需求依据：15份安大磬苑周边商家匿名半结构化访谈中，10份反馈偏好批量表/Excel维护（待补充访谈证据）。</p>

          <div class="form-group">
            <label class="form-label">上传Excel文件（.xlsx/.csv）</label>
            ${UI.uploadZone('excelUpload', { icon: 'file-spreadsheet', text: '点击上传Excel文件', hint: '当前为Demo模拟，不会真实解析文件' })}
          </div>

          <button class="btn btn-secondary" onclick="PageMerchant.simulateImport()"><i data-lucide="play"></i>加载Demo导入预览</button>

          <div id="importPreview" style="margin-top:16px;display:none;">
            <div class="divider"></div>
            <h3 style="font-size:0.9375rem;margin-bottom:10px;">导入预览（Demo模拟）</h3>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;">
              <div class="summary-card" style="padding:10px;"><div class="label">总行数</div><div class="value" style="font-size:1.25rem;">12</div></div>
              <div class="summary-card" style="padding:10px;"><div class="label">可导入</div><div class="value" style="font-size:1.25rem;color:var(--color-success);">9</div></div>
              <div class="summary-card" style="padding:10px;"><div class="label">有错误</div><div class="value" style="font-size:1.25rem;color:var(--color-error);">2</div></div>
              <div class="summary-card" style="padding:10px;"><div class="label">重复SKU</div><div class="value" style="font-size:1.25rem;color:var(--color-warning);">1</div></div>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead><tr><th>行号</th><th>品牌</th><th>产品</th><th>杯型</th><th>热量</th><th>状态</th><th>错误信息</th></tr></thead>
                <tbody>
                  <tr><td>1</td><td>清叶茶铺</td><td>乌龙奶茶</td><td>中杯</td><td>210</td><td><span class="tag tag-success">可导入</span></td><td>-</td></tr>
                  <tr><td>2</td><td>清叶茶铺</td><td>茉莉奶绿</td><td>中杯</td><td>195</td><td><span class="tag tag-pending">重复</span></td><td>SKU已存在，将更新版本</td></tr>
                  <tr><td>3</td><td>云雾制茶</td><td>（空）</td><td>大杯</td><td>280</td><td><span class="tag tag-error">错误</span></td><td>产品名为空</td></tr>
                  <tr><td>4</td><td>果研所</td><td>柠檬茶</td><td>中杯</td><td>abc</td><td><span class="tag tag-error">错误</span></td><td>热量格式无效（非数字）</td></tr>
                  <tr><td>5</td><td>果研所</td><td>满杯橙子</td><td>大杯</td><td>160</td><td><span class="tag tag-success">可导入</span></td><td>缺失字段：钠（将标记为未知）</td></tr>
                </tbody>
              </table>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px;">
              <button class="btn btn-primary" onclick="PageMerchant.confirmImport()"><i data-lucide="check"></i>确认导入9条</button>
              <button class="btn btn-secondary" onclick="document.getElementById('importPreview').style.display='none'">取消</button>
            </div>
            <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:8px;">导入失败不会静默跳过，所有错误行均显示。缺失的营养字段将标记为"未知/待补充"，不填0。</p>
          </div>
        </div>
      </div>
    `;
  }

  function renderReview() {
    const pending = NPV2_DATA.MERCHANT_SKUS.filter(s => s.record_status === '待审核' || s.record_status === '部分披露');
    return `
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i data-lucide="clipboard-check"></i>审核队列</div>
          <span class="tag tag-pending">${pending.length}项待复核</span>
        </div>
        <div class="card-body">
          ${pending.map(s => `
            <div style="border:1px solid var(--color-border);border-radius:10px;padding:14px;margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <strong>${s.brand_name} · ${s.product_name}</strong>
                <span class="tag ${s.record_status==='待审核'?'tag-pending':'tag-source-low'}">${s.record_status}</span>
              </div>
              <div style="font-size:0.8125rem;color:var(--color-text-secondary);margin-bottom:8px;">
                版本：${s.version} · 提交人：${s.submitted_by} · 变更原因：${s.change_reason} · 生效：${s.effective_from}
              </div>
              <div style="font-size:0.8125rem;margin-bottom:10px;">
                营养：kcal=${s.kcal ?? '未知'} · 蛋白质=${s.protein ?? '未知'}g · 糖=${s.sugar ?? '未知'}g · 钠=${s.sodium ?? '未知（null）'}mg
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-success btn-sm" style="background:var(--color-success);color:#fff;" onclick="PageMerchant.reviewAction('${s.sku_id}','approve')"><i data-lucide="check"></i>通过</button>
                <button class="btn btn-secondary btn-sm" onclick="PageMerchant.reviewAction('${s.sku_id}','reject')"><i data-lucide="x"></i>驳回</button>
                <button class="btn btn-ghost btn-sm" onclick="PageMerchant.reviewAction('${s.sku_id}','rollback')"><i data-lucide="rotate-ccw"></i>版本回滚</button>
                <button class="btn btn-ghost btn-sm" onclick="PageMerchant.viewAudit('${s.sku_id}')"><i data-lucide="history"></i>变更记录</button>
              </div>
            </div>
          `).join('')}
          ${pending.length === 0 ? UI.emptyState('check-circle-2', '暂无待审核项') : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i data-lucide="info"></i>营养展示策略</div></div>
        <div class="card-body" style="font-size:0.875rem;color:var(--color-text-secondary);">
          <p>• 敏感配方不要求公开克数，可只提交可展示的营养字段或区间。</p>
          <p>• 但来源和适用范围必须可追溯，包含来源类型、采集日期、证据等级、复核状态。</p>
          <p>• 商家端文案使用"提交营养资料""保存本地方案""待复核"等中性表达。</p>
          <p>• 不出现"已上线到平台""已接入订单""官方精确库"等无凭据说法。</p>
        </div>
      </div>
    `;
  }

  function renderFeedback() {
    const f = NPV2_DATA.MERCHANT_FEEDBACK;
    return `
      <div class="grid-3">
        <div class="summary-card"><div class="label">反馈总数</div><div class="value">${f.total_feedback}</div><div class="sub"><span class="tag tag-demo-data">固定演示数据</span></div></div>
        <div class="summary-card"><div class="label">理解度</div><div class="value">${Math.round(f.understanding_rate*100)}%</div><div class="sub">用户理解营养标签比例</div></div>
        <div class="summary-card"><div class="label">困惑率</div><div class="value">${Math.round(f.confusion_rate*100)}%</div><div class="sub">用户表示困惑比例</div></div>
      </div>

      <!-- 用户补充邀请 -->
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <div class="card-title"><i data-lucide="message-square-plus"></i>用户补充邀请（脱敏聚合）</div>
          <span class="tag tag-pending">${f.user_supplement_requests.length}个SKU待补充</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${f.user_supplement_requests.map(req => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--color-border-light);">
              <div>
                <div style="font-weight:600;font-size:0.875rem;">${req.sku}</div>
                <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;">${req.reason} · ${req.count}位用户请求</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="PageMerchant.reviewAction('${req.sku}','supplement')"><i data-lucide="edit-3"></i>补充资料</button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 营养师建议聚合 -->
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <div class="card-title"><i data-lucide="stethoscope"></i>营养师建议聚合（脱敏）</div>
          <span class="tag tag-demo">演示数据</span>
        </div>
        <div class="card-body" style="padding:0;">
          ${f.nutritionist_suggestions.map(s => `
            <div style="padding:12px 0;border-bottom:1px solid var(--color-border-light);">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="font-weight:600;font-size:0.875rem;">${s.sku}</div>
                <span class="tag tag-pending">${s.count}位营养师建议</span>
              </div>
              <div style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:4px;">💡 ${s.suggestion}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:16px;">
        <div class="card-header"><div class="card-title"><i data-lucide="message-square"></i>高频问题（脱敏聚合）</div><span class="tag tag-demo-data">固定演示数据</span></div>
        <div class="card-body">
          ${f.top_questions.map((q,i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--color-border-light);">
              <span style="font-size:0.875rem;">${i+1}. ${q.question}</span>
              <span class="tag tag-demo">${q.count}次提及</span>
            </div>
          `).join('')}
          <p style="font-size:0.75rem;color:var(--color-text-muted);margin-top:12px;"><i data-lucide="shield" style="width:14px;height:14px;vertical-align:middle;"></i> 仅显示脱敏、聚合的用户理解/使用反馈，不暴露个人健康数据。${f.note}</p>
        </div>
      </div>
    `;
  }

  // 交互方法
  function setTab(t) { tab = t; App.rerender(); }
  function search(q) { searchQuery = q; App.rerender(); }
  function filterStatus(s) { statusFilter = s; App.rerender(); }
  function addSku() { UI.toast('手动添加SKU：请填写品牌、产品、规格、营养字段（Demo）', 'info'); }
  function editSku(id) { UI.toast(`编辑SKU ${id}（Demo模拟）`, 'info'); }
  function viewSku(id) {
    const s = NPV2_DATA.MERCHANT_SKUS.find(x => x.sku_id === id);
    if (!s) return;
    const source = NPV2_DATA.SOURCE_SEEDS.find(x => x.source_id === s.source_id);
    UI.modal('SKU详情与来源', `
      <div style="font-size:0.875rem;line-height:1.8;">
        <p><strong>品牌：</strong>${s.brand_name}</p>
        <p><strong>产品：</strong>${s.product_name}（${s.category}）</p>
        <p><strong>规格：</strong>${s.cup_size} · 默认糖度：${s.default_sugar}</p>
        <p><strong>营养：</strong>kcal=${s.kcal ?? '未知'} · 蛋白质=${s.protein ?? '未知'}g · 脂肪=${s.fat ?? '未知'}g · 碳水=${s.carbs ?? '未知'}g · 糖=${s.sugar ?? '未知'}g · 钠=${s.sodium ?? '未知（null）'}mg</p>
        <p><strong>状态：</strong>${s.record_status} · 置信度：${Math.round((s.confidence||0)*100)}%</p>
        <p><strong>版本：</strong>${s.version} · 生效：${s.effective_from} · 提交人：${s.submitted_by}</p>
        <div class="divider"></div>
        <h4 style="font-size:0.875rem;margin-bottom:6px;">来源信息</h4>
        ${source ? `
          <p><strong>发布者：</strong>${source.publisher}</p>
          <p><strong>类型：</strong>${source.source_type}</p>
          <p><strong>采集：</strong>${source.retrieved_at} · 复核：${source.verified_at || '未复核'}</p>
          <p><strong>证据等级：</strong>${source.evidence_grade} · 复核状态：${source.review_status}</p>
          <p><strong>市场范围：</strong>${source.market_scope}</p>
          <p style="font-size:0.8125rem;color:var(--color-text-secondary);margin-top:6px;">${source.notes}</p>
        ` : '<p style="color:var(--color-unknown);">来源不足/待补充</p>'}
      </div>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button>`);
  }
  function simulateImport() {
    const prev = document.getElementById('importPreview');
    if (prev) prev.style.display = 'block';
    UI.toast('已加载Demo导入预览', 'success');
  }
  function confirmImport() {
    UI.toast('已导入9条SKU（Demo模拟，实际未写入）', 'success');
    tab = 'skus';
    App.rerender();
  }
  function reviewAction(id, action) {
    const map = { approve: '已通过', reject: '已驳回', rollback: '已回滚到上一版本' };
    UI.toast(`${map[action] || action}（Demo模拟）`, 'success');
  }
  function viewAudit(id) {
    UI.modal('变更记录', `
      <div class="timeline">
        <div class="timeline-item"><div class="timeline-title">v1.2 · 2026-08-01</div><div class="timeline-desc">提交人：演示商家账号 · 变更：初始录入 · 复核人：待复核</div></div>
        <div class="timeline-item"><div class="timeline-title">v1.1 · 2026-07-15</div><div class="timeline-desc">提交人：演示商家账号 · 变更：糖度标注修正 · 复核人：已复核</div></div>
        <div class="timeline-item"><div class="timeline-title">v1.0 · 2026-06-01</div><div class="timeline-desc">提交人：演示商家账号 · 变更：创建SKU · 复核人：已复核</div></div>
      </div>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button>`);
  }

  return { render, setTab, search, filterStatus, addSku, editSku, viewSku, simulateImport, confirmImport, reviewAction, viewAudit };
})();
