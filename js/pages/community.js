/* 协同社区 v2.0 - 饮食记录协同社区 */
const PageCommunity = (() => {
  let posts = [];
  let searchQuery = '';
  let topicFilter = 'all';
  let sortBy = 'latest';
  let collected = { meals: [], knowledge: [] };

  function init() {
    if (posts.length === 0) {
      const saved = localStorage.getItem('npv2_community_posts');
      posts = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(NPV2_DATA.COMMUNITY_POSTS));
    }
    const c = localStorage.getItem('npv2_collected');
    if (c) collected = JSON.parse(c);
  }

  function save() {
    localStorage.setItem('npv2_community_posts', JSON.stringify(posts));
    localStorage.setItem('npv2_collected', JSON.stringify(collected));
  }

  function render() {
    init();
    let filtered = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || (p.record_snapshot?.name||'').toLowerCase().includes(q));
    }
    if (topicFilter !== 'all') {
      filtered = filtered.filter(p => (p.topic_tags || []).includes(topicFilter));
    }
    if (sortBy === 'latest') filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'hot') filtered.sort((a,b) => (b.likes+b.collected) - (a.likes+a.collected));
    else if (sortBy === 'nutrition') filtered = filtered.filter(p => p.record_snapshot).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    const allTopics = NPV2_DATA.HOT_TOPICS;

    return `
      <div class="page-header">
        <h1 class="page-title">饮食记录协同社区</h1>
        <p class="page-subtitle">记录即帖子 · 用户/商家/营养师三方协同 · 营养信息可追溯</p>
        ${UI.demoTags(['demo','demo-data'])}
      </div>

      <div class="card" style="margin-bottom:16px;padding:12px 16px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:0.8125rem;color:var(--color-text-secondary);flex-wrap:wrap;">
          <i data-lucide="info" style="width:16px;height:16px;color:var(--color-primary-600);"></i>
          <span>本地演示账号 / 不会上传网络 / 内容为虚构演示数据 / 健康讨论为日常营养管理参考，非医疗建议</span>
        </div>
      </div>

      <!-- 话题标签横向滚动 -->
      <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;scrollbar-width:none;" class="topic-scroll">
        <button class="config-option ${topicFilter==='all'?'selected':''}" onclick="PageCommunity.filterTopic('all')" style="white-space:nowrap;">全部</button>
        ${allTopics.map(t => `<button class="config-option ${topicFilter===t?'selected':''}" onclick="PageCommunity.filterTopic('${t}')" style="white-space:nowrap;">#${t}</button>`).join('')}
      </div>

      <!-- 搜索和排序 -->
      <div class="filter-bar">
        <div style="position:relative;flex:1;min-width:200px;max-width:320px;">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--color-text-muted);"></i>
          <input class="form-input" placeholder="搜索菜品/商家/营养标签/话题..." value="${searchQuery}" oninput="PageCommunity.search(this.value)" style="padding-left:34px;">
        </div>
        <select class="form-select" onchange="PageCommunity.setSort(this.value)">
          <option value="latest" ${sortBy==='latest'?'selected':''}>最新发布</option>
          <option value="hot" ${sortBy==='hot'?'selected':''}>最热互动</option>
          <option value="nutrition" ${sortBy==='nutrition'?'selected':''}>含营养记录</option>
        </select>
        <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="PageCommunity.newPost()"><i data-lucide="plus"></i>发布帖子</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start;" class="community-layout">
        <!-- 主信息流 -->
        <div id="postList">
          ${filtered.length === 0 ? UI.emptyState('message-square', '没有找到相关帖子') :
            filtered.map((p) => {
              const realIdx = posts.indexOf(p);
              return UI.postCard(p, realIdx);
            }).join('')
          }
        </div>

        <!-- 桌面端侧边栏 -->
        <div class="community-sidebar" style="display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:0.9375rem;margin-bottom:10px;"><i data-lucide="flame"></i>热门话题 Top5</div>
            ${allTopics.slice(0,5).map((t,i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;" onclick="PageCommunity.filterTopic('${t}')">
              <span style="width:20px;height:20px;border-radius:50%;background:${i<3?'var(--color-accent-500)':'var(--color-unknown-100)'};color:${i<3?'#fff':'var(--color-text-muted)'};display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:700;flex-shrink:0;">${i+1}</span>
              <span style="font-size:0.8125rem;color:var(--color-text-secondary);">#${t}</span>
            </div>`).join('')}
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:0.9375rem;margin-bottom:10px;"><i data-lucide="store"></i>活跃商家</div>
            ${NPV2_DATA.ACTIVE_MERCHANTS.map(m => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--color-primary-50);display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:700;color:var(--color-primary-600);">${m.name[0]}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.8125rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name} <span class="tag tag-success" style="font-size:0.625rem;padding:1px 5px;">认证</span></div>
                <div style="font-size:0.6875rem;color:var(--color-text-muted);">${m.sku_count}个SKU · 响应率${m.response_rate}</div>
              </div>
            </div>`).join('')}
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:0.9375rem;margin-bottom:10px;"><i data-lucide="stethoscope"></i>营养师推荐</div>
            ${NPV2_DATA.ACTIVE_NUTRITIONISTS.map(n => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
              <div style="width:28px;height:28px;border-radius:50%;background:var(--color-warning-50);display:flex;align-items:center;justify-content:center;font-size:0.6875rem;font-weight:700;color:var(--color-warning-600);">${n.name[0]}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:0.8125rem;font-weight:600;">${n.name}</div>
                <div style="font-size:0.6875rem;color:var(--color-text-muted);">资质：${n.qualification} · ${n.response_count}条回复</div>
              </div>
            </div>`).join('')}
          </div>

          <div class="card" style="padding:16px;background:var(--color-warning-50);border-color:var(--color-warning-100);">
            <div class="card-title" style="font-size:0.9375rem;margin-bottom:8px;color:var(--color-warning-700);"><i data-lucide="shield-alert"></i>社区规则</div>
            <ul style="font-size:0.75rem;color:var(--color-warning-700);line-height:1.8;list-style:disc;padding-left:16px;">
              <li>禁止医疗化建议和减重疗效承诺</li>
              <li>禁止夸大热量精度和误导性营养信息</li>
              <li>禁止未授权品牌宣传</li>
              <li>健康讨论为日常营养管理参考，非医疗建议</li>
            </ul>
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:0.9375rem;margin-bottom:10px;"><i data-lucide="bookmark"></i>我的收藏</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="config-option" onclick="PageCommunity.showCollected('meals')">🍽️ 我的餐单 (${collected.meals.length})</button>
              <button class="config-option" onclick="PageCommunity.showCollected('knowledge')">📚 营养知识 (${collected.knowledge.length})</button>
            </div>
          </div>
        </div>
      </div>

      <style>
        @media (max-width: 900px) { .community-layout { grid-template-columns: 1fr !important; } .community-sidebar { display: none !important; } }
        .topic-scroll::-webkit-scrollbar { display: none; }
      </style>
    `;
  }

  function search(q) { searchQuery = q; App.rerender(); }
  function filterTopic(t) { topicFilter = t; App.rerender(); }
  function setSort(s) { sortBy = s; App.rerender(); }

  function like(idx) { posts[idx].likes = (posts[idx].likes||0) + 1; save(); App.rerender(); }
  function toggleCollect(idx) {
    posts[idx].collected = (posts[idx].collected||0) + 1;
    collected.meals.push(posts[idx].id);
    save(); App.rerender();
    UI.toast('已收藏到"我的餐单"（本地演示）', 'success');
  }
  function toggleComments(idx) {
    const el = document.getElementById(`comments_${idx}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
  function addComment(idx) {
    const input = document.getElementById(`commentInput_${idx}`);
    const text = input?.value?.trim();
    if (!text) { UI.toast('请输入评论内容', 'warning'); return; }
    posts[idx].comments = posts[idx].comments || [];
    posts[idx].comments.push({ author:'我（演示用户）', role:'user', text, time:'刚刚' });
    save(); App.rerender();
    UI.toast('评论已发布（本地演示）', 'success');
  }

  function report(idx) {
    UI.modal('举报帖子', `
      <p style="margin-bottom:12px;font-size:0.875rem;">请选择举报原因：</p>
      <div class="form-group"><select class="form-select" id="reportReason">
        <option value="medical">医疗建议/疗效承诺</option>
        <option value="precision">夸大热量精度/误导性营养信息</option>
        <option value="brand">未授权品牌宣传</option>
        <option value="false">不实信息</option>
        <option value="other">其他</option>
      </select></div>
      <div class="form-group"><label class="form-label">补充说明（可选）</label><textarea class="form-textarea" id="reportDetail"></textarea></div>
      <p style="font-size:0.75rem;color:var(--color-text-muted);">审核规则：禁止医疗化、减重保证、夸大热量精度和未授权品牌宣传。</p>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button><button class="btn btn-danger" onclick="PageCommunity.confirmReport(${idx})">提交举报</button>`);
  }
  function confirmReport(idx) {
    const reason = document.getElementById('reportReason')?.value;
    posts[idx].reports = posts[idx].reports || [];
    posts[idx].reports.push({ reason, count:1, time:new Date().toISOString() });
    posts[idx].moderation_status = '被举报';
    save(); document.querySelector('.modal-overlay')?.remove();
    UI.toast('举报已提交，等待审核（本地演示）', 'success');
    App.rerender();
  }

  function viewPost(idx) {
    const p = posts[idx];
    if (!p) return;
    // 帖子详情：记录信息 + 协同时间线 + 评论区
    const collabEvents = [
      { actor:'user', actor_name:p.author_name, title:'用户分享记录', desc:p.title, time:p.created_at?.slice(0,16).replace('T',' ') },
      ...(p.comments||[]).map(c => ({ actor:c.role, actor_name:c.author, title:`${c.role==='merchant'?'商家回复':c.role==='nutritionist'?'营养师回复':'用户评论'}`, desc:c.text, time:c.time }))
    ];
    UI.modal(`帖子详情 - ${p.title}`, `
      <div style="margin-bottom:14px;">
        <span class="tag ${p.author_role==='merchant'?'tag-demo-data':p.author_role==='nutritionist'?'tag-pending':'tag-demo'}">${p.author_role==='user'?'用户':p.author_role==='merchant'?'商家':'营养师'}</span>
        <span class="tag tag-${p.moderation_status==='已发布'?'success':p.moderation_status==='待审核'?'pending':'error'}" style="margin-left:6px;">${p.moderation_status}</span>
        ${p.info_updated ? '<span class="tag tag-success" style="margin-left:6px;">信息已更新</span>' : ''}
      </div>
      <p style="font-size:0.9375rem;color:var(--color-text-secondary);margin-bottom:14px;line-height:1.7;">${p.body}</p>
      ${p.record_snapshot ? `
        <div style="background:var(--color-bg-alt);padding:14px;border-radius:10px;margin-bottom:14px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--color-text-secondary);margin-bottom:6px;">📋 记录营养快照</div>
          <div style="font-size:0.875rem;font-weight:600;margin-bottom:6px;">${p.record_snapshot.name}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:0.8125rem;color:var(--color-text-secondary);">
            <span>🔥 ${p.record_snapshot.kcal_interval?p.record_snapshot.kcal_interval.min+'-'+p.record_snapshot.kcal_interval.max+'kcal':'未知'}</span>
            <span>🥩 蛋白${p.record_snapshot.protein_g?p.record_snapshot.protein_g.min+'-'+p.record_snapshot.protein_g.max+'g':'未知'}</span>
            <span>🍬 糖${p.record_snapshot.sugar_g?p.record_snapshot.sugar_g.min+'-'+p.record_snapshot.sugar_g.max+'g':'未知'}</span>
            <span class="tag tag-demo">置信度${Math.round((p.record_snapshot.confidence||0)*100)}%</span>
          </div>
          <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:6px;">来源：${p.record_snapshot.source||'未知'} · ${p.record_snapshot.uncertainty||''}</div>
        </div>
      ` : ''}
      <div class="divider"></div>
      <h4 style="font-size:0.9375rem;margin-bottom:10px;">📊 协同时间线</h4>
      ${UI.collabTimeline(collabEvents)}
      <div class="divider"></div>
      <h4 style="font-size:0.9375rem;margin-bottom:10px;">💬 评论 (${(p.comments||[]).length})</h4>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <button class="config-option selected">全部</button>
        <button class="config-option">用户</button>
        <button class="config-option">商家</button>
        <button class="config-option">营养师</button>
      </div>
      ${(p.comments||[]).map(c => `<div style="padding:10px 0;border-bottom:1px solid var(--color-border-light);">
        <div style="font-size:0.8125rem;font-weight:600;">${c.author} <span class="post-role-badge">${c.role||'用户'}</span>${c.qualification?` <span class="post-role-badge">资质:${c.qualification}</span>`:''} <span style="font-weight:400;color:var(--color-text-muted);font-size:0.75rem;">· ${c.time}</span></div>
        <div style="font-size:0.875rem;color:var(--color-text-secondary);margin-top:4px;">${c.text}</div>
      </div>`).join('')}
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button><button class="btn btn-primary" onclick="document.querySelector('.modal-overlay').remove();PageCommunity.toggleComments(${idx})">查看/写评论</button>`);
  }

  function newPost() {
    UI.modal('发布帖子', `
      <div class="form-group"><label class="form-label">标题</label><input class="form-input" id="newPostTitle" placeholder="分享你的饮食记录或营养发现..."></div>
      <div class="form-group"><label class="form-label">话题标签（逗号分隔）</label><input class="form-input" id="newPostTags" placeholder="例如：奶茶糖度实测,外卖减脂搭配"></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-textarea" id="newPostBody" placeholder="分享你的饮食记录经验..."></textarea></div>
      <div class="form-group"><label class="form-label"><input type="checkbox" id="linkRecord" style="margin-right:6px;"> 关联一条饮食记录（自动生成营养快照）</label></div>
      <p style="font-size:0.75rem;color:var(--color-text-muted);">发布后进入"待审核"状态，审核通过后公开显示。禁止医疗化、减重保证、夸大热量精度。</p>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button><button class="btn btn-primary" onclick="PageCommunity.confirmNewPost()">发布</button>`);
  }
  function confirmNewPost() {
    const title = document.getElementById('newPostTitle')?.value?.trim();
    const body = document.getElementById('newPostBody')?.value?.trim();
    const tags = document.getElementById('newPostTags')?.value?.split(/[,，]/).map(t=>t.trim()).filter(Boolean) || [];
    const linkRecord = document.getElementById('linkRecord')?.checked;
    if (!title || !body) { UI.toast('请填写标题和内容', 'warning'); return; }
    const newPost = {
      id:'post_'+Date.now(), author_role:'user', author_name:'我（演示用户）', verification_badge:null,
      topic_tags:tags, title, body,
      record_snapshot: linkRecord ? { name:'今日午餐（演示）', kcal_interval:{min:550,max:680}, protein_g:{min:22,max:32}, sugar_g:{min:5,max:10}, confidence:0.65, source:'用户记录（演示）', uncertainty:'估算区间' } : null,
      linked_record_ref:null, moderation_status:'待审核', reports:[], comments:[],
      likes:0, collected:0, created_at:new Date().toISOString(), updated_at:new Date().toISOString(), info_updated:false
    };
    posts.unshift(newPost); save();
    document.querySelector('.modal-overlay')?.remove();
    UI.toast('帖子已发布，待审核（本地演示）', 'success');
    App.rerender();
  }

  function showCollected(type) {
    UI.toast(`收藏分类"${type==='meals'?'我的餐单':'营养知识'}"：${collected[type].length}条（本地演示）`, 'info');
  }

  return { render, search, filterTopic, setSort, like, toggleCollect, toggleComments, addComment, report, confirmReport, viewPost, newPost, confirmNewPost, showCollected };
})();
