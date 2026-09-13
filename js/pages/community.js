/* 协同社区 v3.0 —— 推荐/关注/挑战双feed · 三角色互动 · 打卡挑战 · 达人榜 · 消息中心 */
const PageCommunity = (() => {
  let posts = [];
  let searchQuery = '';
  let topicFilter = 'all';
  let sortBy = 'latest';
  let feedTab = 'recommend'; // recommend | follow | challenge
  let roleFilter = 'all';    // all | user | merchant | nutritionist
  let likedSet = {};
  let collectedSet = {};
  let collected = { meals: [], knowledge: [] };
  let streak = 3;

  function me() {
    const u = (typeof Auth !== 'undefined') ? Auth.current() : null;
    if (u) return { name: u.nickname, role: u.role, id: u.id };
    return { name: '我', role: AppState.getRole(), id: 'me' };
  }

  function init() {
    if (posts.length === 0) {
      const saved = localStorage.getItem('npv2_community_posts');
      posts = saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(NPV2_DATA.COMMUNITY_POSTS));
      posts.forEach(p => { if (!p.author_id) p.author_id = 'a_' + (p.author_name || 'x'); });
    }
    try { likedSet = JSON.parse(localStorage.getItem('npv2_liked')) || {}; } catch { likedSet = {}; }
    try { collectedSet = JSON.parse(localStorage.getItem('npv2_collected_set')) || {}; } catch { collectedSet = {}; }
    const c = localStorage.getItem('npv2_collected');
    if (c) collected = JSON.parse(c);
    streak = parseInt(localStorage.getItem('npv2_streak')) || 3;
    // 依据本地点赞集合恢复显示数
    posts.forEach(p => { if (likedSet[p.id] && !p._adj) { p.likes = (p.likes || 0) + 1; p._adj = true; } });
  }

  function save() {
    posts.forEach(p => delete p._adj);
    localStorage.setItem('npv2_community_posts', JSON.stringify(posts));
    posts.forEach(p => { if (likedSet[p.id]) p._adj = true; });
    localStorage.setItem('npv2_liked', JSON.stringify(likedSet));
    localStorage.setItem('npv2_collected_set', JSON.stringify(collectedSet));
    localStorage.setItem('npv2_collected', JSON.stringify(collected));
    localStorage.setItem('npv2_streak', String(streak));
  }

  function followingIds() {
    const u = (typeof Auth !== 'undefined') ? Auth.current() : null;
    return (u && u.following) || [];
  }

  function leaderboard() {
    const map = {};
    posts.forEach(p => {
      const k = p.author_id;
      if (!map[k]) map[k] = { id: k, name: p.author_name, role: p.author_role, score: 0, posts: 0, qual: '' };
      map[k].score += (p.likes || 0) + (p.comments ? p.comments.length * 3 : 0) + (p.collected || 0);
      map[k].posts += 1;
      (p.comments || []).forEach(c => { if (c.role === 'nutritionist' && c.author === p.author_name) map[k].qual = c.qualification || ''; });
    });
    return Object.values(map).sort((a, b) => b.score - a.score).slice(0, 5);
  }

  function render() {
    init();
    let filtered = [...posts];
    // feed tab
    if (feedTab === 'follow') {
      const ids = followingIds();
      filtered = filtered.filter(p => ids.includes(p.author_id));
    } else if (feedTab === 'challenge') {
      filtered = filtered.filter(p => (p.topic_tags || []).some(t => /打卡|挑战|控糖|减脂/.test(t)));
    }
    if (roleFilter !== 'all') filtered = filtered.filter(p => p.author_role === roleFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q) || (p.record_snapshot?.name || '').toLowerCase().includes(q));
    }
    if (topicFilter !== 'all') filtered = filtered.filter(p => (p.topic_tags || []).includes(topicFilter));
    if (sortBy === 'latest') filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (sortBy === 'hot') filtered.sort((a, b) => (b.likes + b.collected) - (a.likes + a.collected));
    else if (sortBy === 'nutrition') filtered = filtered.filter(p => p.record_snapshot).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const allTopics = NPV2_DATA.HOT_TOPICS;
    const board = leaderboard();

    return `
      <div class="page-content">
      <div class="page-header">
        <h1 class="page-title">协同社区</h1>
        <p class="page-subtitle">记录即分享 · 用户 / 商家 / 营养师同帖协同 · 营养信息可追溯</p>
      </div>

      ${renderChallenge()}
      ${renderAskBanner()}

      <!-- feed 切换 -->
      <div class="feed-tabs">
        <button class="feed-tab ${feedTab==='recommend'?'active':''}" onclick="PageCommunity.setTab('recommend')">推荐</button>
        <button class="feed-tab ${feedTab==='follow'?'active':''}" onclick="PageCommunity.setTab('follow')">关注</button>
        <button class="feed-tab ${feedTab==='challenge'?'active':''}" onclick="PageCommunity.setTab('challenge')">挑战</button>
        <button class="feed-tab" onclick="PageCommunity.openMessages()" style="position:relative;max-width:96px;">消息<span class="msg-dot"></span></button>
      </div>

      <!-- 话题横滚 -->
      <div class="role-chip-row topic-scroll">
        <button class="role-chip ${topicFilter==='all'?'active':''}" onclick="PageCommunity.filterTopic('all')">全部话题</button>
        ${allTopics.map(t => `<button class="role-chip ${topicFilter===t?'active':''}" onclick="PageCommunity.filterTopic('${t}')">#${t}</button>`).join('')}
      </div>

      <!-- 角色筛选 + 搜索 + 发帖 -->
      <div class="role-chip-row">
        <button class="role-chip ${roleFilter==='all'?'active':''}" onclick="PageCommunity.setRoleFilter('all')">全部角色</button>
        <button class="role-chip ${roleFilter==='user'?'active':''}" onclick="PageCommunity.setRoleFilter('user')">👤 用户</button>
        <button class="role-chip ${roleFilter==='merchant'?'active':''}" onclick="PageCommunity.setRoleFilter('merchant')">🏪 商家</button>
        <button class="role-chip ${roleFilter==='nutritionist'?'active':''}" onclick="PageCommunity.setRoleFilter('nutritionist')">🩺 营养师</button>
      </div>

      <div class="filter-bar">
        <div style="position:relative;flex:1;min-width:180px;max-width:320px;">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-muted);"></i>
          <input class="form-input" placeholder="搜索菜品 / 商家 / 话题..." value="${searchQuery}" oninput="PageCommunity.search(this.value)" style="padding-left:34px;">
        </div>
        <select class="form-select" onchange="PageCommunity.setSort(this.value)">
          <option value="latest" ${sortBy==='latest'?'selected':''}>最新</option>
          <option value="hot" ${sortBy==='hot'?'selected':''}>最热</option>
          <option value="nutrition" ${sortBy==='nutrition'?'selected':''}>含营养记录</option>
        </select>
        <button class="btn btn-primary btn-sm" style="margin-left:auto;" onclick="PageCommunity.newPost()"><i data-lucide="pen-line"></i>发布</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:start;" class="community-layout">
        <div id="postList">
          ${filtered.length === 0
            ? UI.emptyState('compass', feedTab === 'follow' ? '还没有关注的作者，去达人榜看看吧' : '没有找到相关内容', '<button class="btn btn-primary btn-sm" onclick="PageCommunity.setTab(\'recommend\')">去发现</button>')
            : filtered.map(p => UI.postCard(p, posts.indexOf(p))).join('')}
        </div>

        <div class="community-sidebar" style="display:flex;flex-direction:column;gap:14px;">
          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:.9375rem;margin-bottom:10px;"><i data-lucide="trophy"></i>营养达人榜</div>
            ${board.map((a, i) => `
              <div class="rank-row">
                <span class="rank-no ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:.8125rem;font-weight:700;">${a.name} <span class="post-role-badge">${a.role==='user'?'用户':a.role==='merchant'?'商家':'营养师'}</span></div>
                  <div style="font-size:.6875rem;color:var(--text-muted);">${a.posts}篇 · 热度${a.score}</div>
                </div>
                <button class="btn ${followingIds().includes(a.id)?'btn-ghost':'btn-secondary'} btn-sm" onclick="PageCommunity.followAuthor('${a.id}',this)">${followingIds().includes(a.id)?'已关注':'+ 关注'}</button>
              </div>`).join('')}
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:.9375rem;margin-bottom:10px;"><i data-lucide="medal"></i>我的成就</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <span class="medal">🔥 连续${streak}天</span>
              <span class="medal">📷 首次记录</span>
              <span class="medal">🥗 控糖达人</span>
              <span class="medal">🤝 协同之星</span>
            </div>
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:.9375rem;margin-bottom:10px;"><i data-lucide="flame"></i>热门话题</div>
            ${allTopics.slice(0,5).map((t,i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer;" onclick="PageCommunity.filterTopic('${t}')">
              <span style="width:20px;height:20px;border-radius:50%;background:${i<3?'var(--accent-coral)':'var(--bg-alt)'};color:${i<3?'#fff':'var(--text-muted)'};display:flex;align-items:center;justify-content:center;font-size:.6875rem;font-weight:700;flex-shrink:0;">${i+1}</span>
              <span style="font-size:.8125rem;color:var(--text-secondary);">#${t}</span>
            </div>`).join('')}
          </div>

          <div class="card" style="padding:16px;background:#FFF9F0;border-color:#F0D9A8;">
            <div class="card-title" style="font-size:.9375rem;margin-bottom:8px;color:#9a6b00;"><i data-lucide="shield-check"></i>社区公约</div>
            <ul style="font-size:.75rem;color:#9a6b00;line-height:1.8;list-style:disc;padding-left:16px;">
              <li>友善交流，营养结论标注依据与不确定性</li>
              <li>不做疗效承诺、不夸大测量精度</li>
              <li>商家与营养师须认证后以对应身份发言</li>
            </ul>
          </div>

          <div class="card" style="padding:16px;">
            <div class="card-title" style="font-size:.9375rem;margin-bottom:10px;"><i data-lucide="bookmark"></i>我的收藏</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="config-option" onclick="PageCommunity.showCollected('meals')">🍽️ 餐单 (${collected.meals.length})</button>
              <button class="config-option" onclick="PageCommunity.showCollected('knowledge')">📚 知识 (${collected.knowledge.length})</button>
            </div>
          </div>
        </div>
      </div>

      <style>
        @media (max-width:900px){.community-layout{grid-template-columns:1fr !important;}.community-sidebar{display:none !important;}}
        .topic-scroll::-webkit-scrollbar{display:none;}
      </style>
      </div>
    `;
  }

  function renderChallenge() {
    const goal = 7;
    const pct = Math.min(100, Math.round(streak / goal * 100));
    return `
      <div class="challenge-card">
        <div class="challenge-head">
          <div class="challenge-badge"><i data-lucide="flame" style="width:20px;height:20px;"></i></div>
          <div style="flex:1;">
            <div style="font-weight:800;font-size:.9375rem;color:#7a5200;">本周挑战 · 7 天控糖打卡</div>
            <div style="font-size:.75rem;color:#9a6b00;">记录每日三餐含糖量，连续打卡赢限定勋章</div>
          </div>
          <span class="streak-flame"><i data-lucide="flame" style="width:15px;height:15px;"></i>${streak} 天</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:.72rem;color:#9a6b00;">已完成 ${streak}/${goal} 天</span>
          <button class="btn btn-primary btn-sm" onclick="PageCommunity.checkin()"><i data-lucide="check"></i>今日打卡</button>
        </div>
      </div>`;
  }

  function renderAskBanner() {
    return `
      <div class="ask-nutri-banner">
        <div style="width:40px;height:40px;border-radius:50%;background:#6366F1;color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i data-lucide="stethoscope"></i></div>
        <div style="flex:1;">
          <div style="font-weight:700;font-size:.875rem;color:#3730A3;">拿不准这一餐怎么吃？</div>
          <div style="font-size:.75rem;color:#5b5bb5;">向认证营养师提问，通常 2 小时内收到专业回复</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="PageCommunity.askNutritionist()">我要提问</button>
      </div>`;
  }

  // ---------- 交互 ----------
  function search(q) { searchQuery = q; App.rerender(); }
  function filterTopic(t) { topicFilter = t; App.rerender(); }
  function setSort(s) { sortBy = s; App.rerender(); }
  function setTab(t) { feedTab = t; App.rerender(); }
  function setRoleFilter(r) { roleFilter = r; App.rerender(); }

  function like(idx) {
    const p = posts[idx]; if (!p) return;
    if (likedSet[p.id]) { p.likes = Math.max(0, (p.likes || 1) - 1); delete likedSet[p.id]; }
    else { p.likes = (p.likes || 0) + 1; likedSet[p.id] = true; }
    save(); App.rerender();
  }

  function toggleCollect(idx) {
    const p = posts[idx]; if (!p) return;
    if (collectedSet[p.id]) { p.collected = Math.max(0, (p.collected || 1) - 1); delete collectedSet[p.id]; UI.toast('已取消收藏', 'info'); }
    else {
      p.collected = (p.collected || 0) + 1; collectedSet[p.id] = true;
      if (p.record_snapshot) collected.meals.push(p.id); else collected.knowledge.push(p.id);
      UI.toast('已收藏', 'success');
    }
    save(); App.rerender();
  }

  function toggleComments(idx) {
    const el = document.getElementById(`comments_${idx}`);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }

  function addComment(idx) {
    const input = document.getElementById(`commentInput_${idx}`);
    const text = input?.value?.trim();
    if (!text) { UI.toast('请输入评论内容', 'warning'); return; }
    const m = me();
    posts[idx].comments = posts[idx].comments || [];
    posts[idx].comments.push({ author: m.name, role: m.role, text, time: '刚刚' });
    save(); App.rerender(); UI.toast('评论已发布', 'success');
  }

  function followAuthor(authorId, btn) {
    if (typeof Auth === 'undefined' || !Auth.current()) { UI.toast('请先登录后再关注', 'warning'); location.hash = '#/auth'; return; }
    const now = Auth.toggleFollow(authorId);
    if (btn) { btn.textContent = now ? '已关注' : '+ 关注'; btn.className = `btn ${now ? 'btn-ghost' : 'btn-secondary'} btn-sm`; }
    UI.toast(now ? '已关注' : '已取消关注', 'info');
  }

  function forward(idx) {
    const p = posts[idx]; if (!p) return;
    const txt = `${p.title} | 来自营养智链协同社区`;
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    UI.toast('内容链接已复制，可分享给好友', 'success');
  }

  function checkin() {
    if (streak >= 7) { UI.toast('本周挑战已完成，太棒了！', 'success'); return; }
    streak += 1; localStorage.setItem('npv2_streak', String(streak));
    UI.toast(streak >= 7 ? '打卡成功，获得「7天控糖」勋章！' : `打卡成功，已连续 ${streak} 天`, 'success');
    App.rerender();
  }

  function askNutritionist() { newPost('向营养师提问'); }

  function report(idx) {
    UI.modal('举报内容', `
      <p style="margin-bottom:12px;font-size:.875rem;">请选择举报原因：</p>
      <div class="form-group"><select class="form-select" id="reportReason">
        <option value="medical">疗效承诺 / 医疗化表述</option>
        <option value="precision">夸大测量精度 / 误导信息</option>
        <option value="brand">未授权品牌宣传</option>
        <option value="false">不实信息</option>
        <option value="abuse">不友善 / 人身攻击</option>
        <option value="other">其他</option>
      </select></div>
      <div class="form-group"><label class="form-label">补充说明（可选）</label><textarea class="form-textarea" id="reportDetail"></textarea></div>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button><button class="btn btn-danger" onclick="PageCommunity.confirmReport(${idx})">提交</button>`);
  }
  function confirmReport(idx) {
    const reason = document.getElementById('reportReason')?.value;
    posts[idx].reports = posts[idx].reports || [];
    posts[idx].reports.push({ reason, count: 1, time: new Date().toISOString() });
    posts[idx].moderation_status = '被举报';
    save(); document.querySelector('.modal-overlay')?.remove();
    UI.toast('举报已提交，平台将尽快审核', 'success'); App.rerender();
  }

  function viewPost(idx) {
    const p = posts[idx]; if (!p) return;
    const collabEvents = [
      { actor: 'user', actor_name: p.author_name, title: '分享内容', desc: p.title, time: p.created_at?.slice(0, 16).replace('T', ' ') },
      ...(p.comments || []).map(c => ({ actor: c.role, actor_name: c.author, title: `${c.role === 'merchant' ? '商家回复' : c.role === 'nutritionist' ? '营养师回复' : '用户评论'}`, desc: c.text, time: c.time }))
    ];
    const following = followingIds().includes(p.author_id);
    UI.modal(`内容详情 · ${p.title}`, `
      <div style="margin-bottom:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <span class="tag ${p.author_role==='merchant'?'tag-demo-data':p.author_role==='nutritionist'?'tag-pending':'tag-demo'}">${p.author_role==='user'?'用户':p.author_role==='merchant'?'商家':'营养师'}</span>
        <span class="tag tag-${p.moderation_status==='已发布'?'success':p.moderation_status==='待审核'?'pending':'error'}">${p.moderation_status}</span>
        <button class="btn ${following?'btn-ghost':'btn-secondary'} btn-sm" style="margin-left:auto;" onclick="PageCommunity.followAuthor('${p.author_id}',this)">${following?'已关注':'+ 关注作者'}</button>
        <button class="btn btn-secondary btn-sm" onclick="PageCommunity.forward(${idx})">转发</button>
      </div>
      <p style="font-size:.9375rem;color:var(--text-secondary);margin-bottom:14px;line-height:1.7;">${p.body}</p>
      ${p.record_snapshot ? `
        <div style="background:var(--bg-alt);padding:14px;border-radius:10px;margin-bottom:14px;">
          <div style="font-size:.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">📋 营养快照</div>
          <div style="font-size:.875rem;font-weight:600;margin-bottom:6px;">${p.record_snapshot.name}</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:.8125rem;color:var(--text-secondary);">
            <span>🔥 ${p.record_snapshot.kcal_interval?p.record_snapshot.kcal_interval.min+'-'+p.record_snapshot.kcal_interval.max+'kcal':'未知'}</span>
            <span>🥩 蛋白${p.record_snapshot.protein_g?p.record_snapshot.protein_g.min+'-'+p.record_snapshot.protein_g.max+'g':'未知'}</span>
            <span>🍬 糖${p.record_snapshot.sugar_g?p.record_snapshot.sugar_g.min+'-'+p.record_snapshot.sugar_g.max+'g':'未知'}</span>
          </div>
        </div>` : ''}
      <div class="divider"></div>
      <h4 style="font-size:.9375rem;margin-bottom:10px;">协同时间线</h4>
      ${UI.collabTimeline(collabEvents)}
      <div class="divider"></div>
      <h4 style="font-size:.9375rem;margin:10px 0;">评论 (${(p.comments||[]).length})</h4>
      ${(p.comments||[]).map(c => `<div style="padding:10px 0;border-bottom:1px solid var(--border-light);">
        <div style="font-size:.8125rem;font-weight:600;">${c.author} <span class="post-role-badge">${c.role||'用户'}</span> <span style="font-weight:400;color:var(--text-muted);font-size:.75rem;">· ${c.time}</span></div>
        <div style="font-size:.875rem;color:var(--text-secondary);margin-top:4px;">${c.text}</div>
      </div>`).join('') || '<p style="font-size:.8rem;color:var(--text-muted);">还没有评论，来说两句吧</p>'}
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button>`);
  }

  function newPost(presetTopic) {
    if (typeof Auth !== 'undefined' && !Auth.current()) {
      UI.toast('登录后发布内容', 'info');
    }
    const m = me();
    UI.modal('发布内容', `
      <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:10px;">将以 <b>${m.role==='user'?'用户':m.role==='merchant'?'商家':'营养师'}</b>「${m.name}」身份发布</div>
      <div class="form-group"><label class="form-label">标题</label><input class="form-input" id="newPostTitle" placeholder="分享你的饮食记录或营养发现..."></div>
      <div class="form-group"><label class="form-label">话题标签（逗号分隔）</label><input class="form-input" id="newPostTags" value="${presetTopic||''}" placeholder="例如：控糖打卡,外卖减脂搭配"></div>
      <div class="form-group"><label class="form-label">内容</label><textarea class="form-textarea" id="newPostBody" placeholder="写下你想分享的内容..."></textarea></div>
      <div class="form-group"><label class="form-label"><input type="checkbox" id="linkRecord" style="margin-right:6px;">关联一条饮食记录（自动生成营养快照）</label></div>
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">取消</button><button class="btn btn-primary" onclick="PageCommunity.confirmNewPost()">发布</button>`);
  }

  function confirmNewPost() {
    const title = document.getElementById('newPostTitle')?.value?.trim();
    const body = document.getElementById('newPostBody')?.value?.trim();
    const tags = document.getElementById('newPostTags')?.value?.split(/[,，]/).map(t => t.trim()).filter(Boolean) || [];
    const linkRecord = document.getElementById('linkRecord')?.checked;
    if (!title || !body) { UI.toast('请填写标题和内容', 'warning'); return; }
    const m = me();
    posts.unshift({
      id: 'post_' + Date.now(), author_id: m.id, author_role: m.role, author_name: m.name, verification_badge: null,
      topic_tags: tags, title, body,
      record_snapshot: linkRecord ? { name: '今日一餐', kcal_interval: { min: 520, max: 660 }, protein_g: { min: 22, max: 30 }, sugar_g: { min: 5, max: 9 }, confidence: 0.7, source: '个人记录', uncertainty: '估算区间' } : null,
      linked_record_ref: null, moderation_status: '待审核', reports: [], comments: [],
      likes: 0, collected: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), info_updated: false
    });
    save(); document.querySelector('.modal-overlay')?.remove();
    UI.toast('内容已发布', 'success'); App.rerender();
  }

  function openMessages() {
    const notices = [
      { icon: 'thumbs-up', color: '#E76F51', text: '有人赞了你的「午餐控糖搭配」', time: '10分钟前' },
      { icon: 'message-circle', color: '#6366F1', text: '营养师 林医生 回复了你的提问', time: '1小时前' },
      { icon: 'user-plus', color: '#2A9D8F', text: '轻食集·南山店 关注了你', time: '今天 09:20' },
      { icon: 'award', color: '#D9A441', text: '你获得了「首次记录」勋章', time: '昨天' },
      { icon: 'bell', color: '#0B7285', text: '本周「7天控糖打卡」进行中，快去参与', time: '2天前' }
    ];
    UI.modal('消息中心', `
      ${notices.map(n => `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light);">
        <div style="width:34px;height:34px;border-radius:50%;background:${n.color}18;color:${n.color};display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i data-lucide="${n.icon}" style="width:17px;height:17px;"></i></div>
        <div style="flex:1;"><div style="font-size:.8125rem;color:var(--text);">${n.text}</div><div style="font-size:.7rem;color:var(--text-muted);margin-top:3px;">${n.time}</div></div>
      </div>`).join('')}
    `, `<button class="btn btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">关闭</button>`);
  }

  function showCollected(type) {
    const n = collected[type].length;
    UI.toast(`收藏「${type==='meals'?'我的餐单':'营养知识'}」共 ${n} 条`, 'info');
  }

  return { render, search, filterTopic, setSort, setTab, setRoleFilter, like, toggleCollect, toggleComments, addComment, followAuthor, forward, checkin, askNutritionist, report, confirmReport, viewPost, newPost, confirmNewPost, openMessages, showCollected };
})();
