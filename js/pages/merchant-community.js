/* 商家社区运营页 */
const PageMerchantCommunity = (() => {
  const state = { tab: 'posts', announcement: '' };

  const posts = [
    { id: 1, user: '小鹿减脂中', avatar: '🦌', dish: '轻食鸡胸沙拉', title: '这家轻食店的沙拉真的绝了！鸡胸肉嫩到爆汁', content: '连续吃了一周，热量控制得很好，蛋白质也够。酱料是低卡的，吃起来完全没有负担...', views: 1280, likes: 89, comments: 23, time: '2小时前', pinned: true, quality: true },
    { id: 2, user: '控糖日记', avatar: '🍵', dish: '藜麦三文鱼碗', title: '减脂期外卖怎么选？亲测有效的搭配公式', content: '主食选藜麦/杂粮，蛋白质选三文鱼/鸡胸，蔬菜占一半。这家店的搭配完全符合...', views: 2150, likes: 156, comments: 41, time: '5小时前', pinned: false, quality: true },
    { id: 3, user: '健身教练阿杰', avatar: '💪', dish: '低脂牛肉卷', title: '练后餐首选！蛋白质含量拉满', content: '训练后30分钟内补充蛋白质，这个牛肉卷刚好26g蛋白，脂肪只有10g...', views: 980, likes: 67, comments: 18, time: '昨天', pinned: false, quality: false },
    { id: 4, user: '美食探店喵', avatar: '🐱', dish: '照烧鸡腿定食', title: '一周外卖减脂餐打卡Day3', content: '今天吃的照烧鸡腿定食，去皮后热量降低不少，搭配杂粮饭很满足...', views: 3420, likes: 234, comments: 67, time: '2天前', pinned: false, quality: true },
    { id: 5, user: '营养师小林', avatar: '🥗', dish: '豆腐蔬菜汤', title: '低卡高纤的晚餐选择，暖胃又饱腹', content: '豆腐提供优质植物蛋白，蔬菜纤维丰富，一碗只有120大卡...', views: 756, likes: 45, comments: 12, time: '3天前', pinned: false, quality: false }
  ];

  const announcements = [
    { id: 1, title: '秋季新品上市：南瓜藜麦暖碗', content: '限时优惠，首单立减8元', status: '已发布', time: '2026-09-01', views: 1234 },
    { id: 2, title: '会员日特惠：每周三全场88折', content: '会员专享，叠加优惠券更划算', status: '已发布', time: '2026-08-25', views: 3456 },
    { id: 3, title: '夏季冰饮系列下架通知', content: '感谢支持，秋季暖饮即将上线', status: '已过期', time: '2026-08-15', views: 890 }
  ];

  const hotTags = [
    { tag: '#减脂餐', count: 234 },
    { tag: '#低卡外卖', count: 189 },
    { tag: '#高蛋白', count: 156 },
    { tag: '#控糖饮食', count: 134 },
    { tag: '#轻食探店', count: 98 }
  ];

  function renderPostCard(p) {
    return `<div class="card" style="margin-bottom:14px;">
      <div class="card-body" style="padding:16px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#0B7285,#2A9D8F);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${p.avatar}</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
              <strong style="color:#2C3E50;">${p.user}</strong>
              ${p.pinned ? '<span class="tag tag-warning" style="font-size:10px;">置顶</span>' : ''}
              ${p.quality ? '<span class="tag tag-success" style="font-size:10px;">优质</span>' : ''}
              <span style="font-size:12px;color:#9AA8B5;margin-left:auto;">${p.time}</span>
            </div>
            <div style="font-size:13px;color:#6B7C8D;margin-bottom:6px;">提到：<span class="tag tag-info" style="font-size:11px;">${p.dish}</span></div>
            <h4 style="margin:0 0 6px;color:#2C3E50;font-size:15px;">${p.title}</h4>
            <p style="margin:0 0 10px;color:#6B7C8D;font-size:13px;line-height:1.6;">${p.content}</p>
            <div style="display:flex;gap:20px;color:#9AA8B5;font-size:12px;">
              <span><i data-lucide="eye" style="width:14px;vertical-align:middle;"></i> ${p.views}</span>
              <span><i data-lucide="heart" style="width:14px;vertical-align:middle;"></i> ${p.likes}</span>
              <span><i data-lucide="message-circle" style="width:14px;vertical-align:middle;"></i> ${p.comments}</span>
            </div>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-sm" onclick="UI.toast('回复 @${p.user}','info')"><i data-lucide="message-square"></i> 回复</button>
              <button class="btn btn-sm btn-outline" onclick="UI.toast('${p.pinned?'已取消置顶':'已置顶'}','success')">${p.pinned?'取消置顶':'置顶'}</button>
              <button class="btn btn-sm btn-outline" onclick="UI.toast('${p.quality?'已取消优质标记':'已标记为优质内容'}','success')">${p.quality?'取消优质':'标记优质'}</button>
              <button class="btn btn-sm btn-warning" onclick="UI.toast('已隐藏该帖子','warning')">隐藏</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  function render() {
    return `
    <div class="page-header">
      <h1><i data-lucide="users"></i> 社区运营</h1>
      <p style="color:#6B7C8D;margin-top:4px;">本店相关内容管理与互动</p>
    </div>

    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-bottom:20px;">
      <div class="stat-card"><div class="stat-label">本月新增帖子</div><div class="stat-value">47</div><div class="stat-trend up">+18% 环比</div></div>
      <div class="stat-card"><div class="stat-label">总浏览量</div><div class="stat-value">12.4K</div><div class="stat-trend up">+32% 环比</div></div>
      <div class="stat-card"><div class="stat-label">总互动量</div><div class="stat-value">1,856</div><div class="stat-trend up">+24% 环比</div></div>
      <div class="stat-card"><div class="stat-label">优质内容占比</div><div class="stat-value">34%</div><div class="stat-trend up">+6% 环比</div></div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;" class="responsive-2col">
      <div>
        <div class="tabs" style="margin-bottom:16px;">
          <button class="tab-btn ${state.tab==='posts'?'active':''}" onclick="PageMerchantCommunity.setTab('posts')">相关帖子 (${posts.length})</button>
          <button class="tab-btn ${state.tab==='announce'?'active':''}" onclick="PageMerchantCommunity.setTab('announce')">商家公告</button>
        </div>
        ${state.tab === 'posts' ? posts.map(renderPostCard).join('') : `
          <div class="card" style="margin-bottom:16px;">
            <div class="card-body">
              <h4 style="margin:0 0 12px;color:#0B7285;">发布新公告</h4>
              <input type="text" class="form-input" id="annTitle" placeholder="公告标题..." style="margin-bottom:8px;">
              <textarea class="form-input" id="annContent" placeholder="公告内容..." rows="2" style="margin-bottom:8px;"></textarea>
              <button class="btn btn-primary" onclick="UI.toast('公告已发布','success')">发布公告</button>
            </div>
          </div>
          ${announcements.map(a => `<div class="card" style="margin-bottom:12px;">
            <div class="card-body" style="padding:14px 16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="color:#2C3E50;">${a.title}</strong>
                <span class="tag ${a.status==='已发布'?'tag-success':'tag-not-connected'}">${a.status}</span>
              </div>
              <p style="margin:0 0 8px;color:#6B7C8D;font-size:13px;">${a.content}</p>
              <div style="display:flex;gap:16px;font-size:12px;color:#9AA8B5;">
                <span>${a.time}</span><span>浏览 ${a.views}</span>
              </div>
            </div>
          </div>`).join('')}
        `}
      </div>

      <div>
        <div class="card" style="margin-bottom:20px;">
          <div class="card-header"><h3>热门话题 Top5</h3></div>
          <div class="card-body">
            ${hotTags.map((t, i) => `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <span style="width:24px;height:24px;border-radius:6px;background:${i<3?'linear-gradient(135deg,#0B7285,#2A9D8F)':'#EEF2F6'};color:${i<3?'#fff':'#9AA8B5'};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${i+1}</span>
              <span style="flex:1;font-size:13px;color:#2C3E50;">${t.tag}</span>
              <span style="font-size:12px;color:#9AA8B5;">${t.count}帖</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-header"><h3>运营提示</h3></div>
          <div class="card-body" style="font-size:13px;color:#6B7C8D;line-height:1.8;">
            <p>• 优质内容可获得平台流量扶持</p>
            <p>• 建议每周发布2-3条公告</p>
            <p>• 及时回复用户评论可提升好感度</p>
            <p>• 置顶帖子可增加50%曝光</p>
          </div>
        </div>
      </div>
    </div>`;
  }

  function setTab(tab) { state.tab = tab; App.rerender(); }
  function bindEvents() {}
  return { render, bindEvents, setTab };
})();
