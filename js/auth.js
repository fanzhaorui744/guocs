/* ============================================================
   账户与会话：本地注册/登录（演示级，数据仅存本机浏览器）
   注册时选择 用户 / 商家 / 营养师 角色，登录后进入对应角色工作台
   ============================================================ */
const Auth = (() => {
  const K_ACCOUNTS = 'npv2_accounts';
  const K_SESSION = 'npv2_session';

  function accounts() {
    try { return JSON.parse(localStorage.getItem(K_ACCOUNTS)) || []; } catch { return []; }
  }
  function saveAccounts(list) { localStorage.setItem(K_ACCOUNTS, JSON.stringify(list)); }

  function register({ nickname, account, password, role, extra }) {
    if (!nickname || !account || !password || !role) return { ok: false, msg: '信息不完整' };
    const list = accounts();
    if (list.some(a => a.account === account)) return { ok: false, msg: '该账号已被注册' };
    const u = {
      id: 'u_' + Date.now(), nickname, account, password, role,
      extra: extra || {}, following: [], achievements: ['新人报到'],
      streak: 0, created_at: new Date().toISOString()
    };
    list.push(u); saveAccounts(list);
    localStorage.setItem(K_SESSION, u.id);
    return { ok: true, user: u };
  }

  function login(account, password) {
    const u = accounts().find(a => a.account === account && a.password === password);
    if (!u) return { ok: false, msg: '账号或密码不正确' };
    localStorage.setItem(K_SESSION, u.id);
    return { ok: true, user: u };
  }

  function logout() { localStorage.removeItem(K_SESSION); }

  function current() {
    const id = localStorage.getItem(K_SESSION);
    if (!id) return null;
    return accounts().find(a => a.id === id) || null;
  }

  function isLoggedIn() { return !!current(); }

  function updateCurrent(patch) {
    const list = accounts();
    const id = localStorage.getItem(K_SESSION);
    const i = list.findIndex(a => a.id === id);
    if (i > -1) { list[i] = { ...list[i], ...patch }; saveAccounts(list); return list[i]; }
    return null;
  }

  function toggleFollow(authorId) {
    const u = current(); if (!u) return false;
    const set = new Set(u.following || []);
    if (set.has(authorId)) set.delete(authorId); else set.add(authorId);
    updateCurrent({ following: [...set] });
    return set.has(authorId);
  }
  function isFollowing(authorId) {
    const u = current(); return u && (u.following || []).includes(authorId);
  }

  const ROLE_META = {
    user: { name: '普通用户', icon: 'user', desc: '记录三餐、拍照定量、管理个人营养目标', color: '#0B7285' },
    merchant: { name: '商家', icon: 'store', desc: '维护菜品营养、查看经营数据、运营社区互动', color: '#D9A441' },
    nutritionist: { name: '营养师', icon: 'stethoscope', desc: '复核记录、服务用户、发布营养科普内容', color: '#6366F1' }
  };
  function roleHome(role) {
    return role === 'merchant' ? '#/merchant' : role === 'nutritionist' ? '#/nutritionist' : '#/';
  }

  return { register, login, logout, current, isLoggedIn, updateCurrent, toggleFollow, isFollowing, ROLE_META, roleHome, accounts };
})();

/* 注册/登录页 */
const PageAuth = (() => {
  let mode = 'login'; // login | register
  let role = 'user';

  function render() {
    return `
      <div class="page-content" style="max-width:460px;margin:0 auto;padding-top:20px;">
        <div class="card">
          <div style="text-align:center;padding:18px 16px 6px;">
            <img src="assets/logo-mark.png" style="height:52px;margin-bottom:10px;" onerror="this.style.display='none'">
            <div style="font-size:1.25rem;font-weight:800;color:var(--text);">营养智链</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:4px;">外卖个性化营养管理平台 · 三端协同</div>
          </div>
          <div style="display:flex;gap:8px;padding:14px 18px 4px;">
            <button class="config-option ${mode==='login'?'selected':''}" style="flex:1;justify-content:center;" onclick="PageAuth.setMode('login')">登录</button>
            <button class="config-option ${mode==='register'?'selected':''}" style="flex:1;justify-content:center;" onclick="PageAuth.setMode('register')">注册</button>
          </div>
          <div class="card-body">
            ${mode === 'login' ? loginForm() : registerForm()}
          </div>
        </div>
        <p style="text-align:center;font-size:0.72rem;color:var(--text-muted);margin-top:14px;">
          演示账户体系，账号与数据仅保存在本机浏览器，不会上传服务器
        </p>
      </div>
    `;
  }

  function loginForm() {
    return `
      <div class="form-group"><label class="form-label">账号</label>
        <input class="form-input" id="authAccount" placeholder="手机号 / 用户名" autocomplete="username"></div>
      <div class="form-group"><label class="form-label">密码</label>
        <input class="form-input" id="authPassword" type="password" placeholder="请输入密码" autocomplete="current-password"></div>
      <button class="btn btn-primary btn-block" onclick="PageAuth.doLogin()"><i data-lucide="log-in"></i>登录</button>
      <div style="text-align:center;margin-top:12px;font-size:0.8125rem;color:var(--text-secondary);">
        还没有账号？<a href="javascript:void(0)" onclick="PageAuth.setMode('register')" style="color:var(--primary);font-weight:600;">立即注册</a>
      </div>
    `;
  }

  function registerForm() {
    const roles = Object.entries(Auth.ROLE_META);
    return `
      <div class="form-group"><label class="form-label">昵称</label>
        <input class="form-input" id="regNickname" placeholder="给自己起个昵称"></div>
      <div class="form-group"><label class="form-label">账号</label>
        <input class="form-input" id="regAccount" placeholder="手机号 / 用户名"></div>
      <div style="display:flex;gap:10px;">
        <div class="form-group" style="flex:1;"><label class="form-label">密码</label>
          <input class="form-input" id="regPassword" type="password" placeholder="设置密码"></div>
        <div class="form-group" style="flex:1;"><label class="form-label">确认密码</label>
          <input class="form-input" id="regPassword2" type="password" placeholder="再次输入"></div>
      </div>
      <div class="form-group">
        <label class="form-label">选择身份（注册后进入对应工作台）</label>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
          ${roles.map(([key, m]) => `
            <button type="button" onclick="PageAuth.pickRole('${key}')"
              style="border:2px solid ${role===key?m.color:'var(--border-light)'};border-radius:12px;padding:12px 6px;text-align:center;background:${role===key?m.color+'14':'#fff'};cursor:pointer;">
              <i data-lucide="${m.icon}" style="width:22px;height:22px;color:${m.color};"></i>
              <div style="font-size:0.8125rem;font-weight:700;margin-top:4px;">${m.name}</div>
            </button>`).join('')}
        </div>
        <p style="font-size:0.72rem;color:var(--text-muted);margin-top:6px;">${Auth.ROLE_META[role].desc}</p>
      </div>
      ${role === 'merchant' ? `<div class="form-group"><label class="form-label">店铺名称（选填）</label><input class="form-input" id="regShop" placeholder="如：轻食集·南山店"></div>` : ''}
      ${role === 'nutritionist' ? `<div class="form-group"><label class="form-label">资质 / 擅长领域（选填）</label><input class="form-input" id="regQual" placeholder="如：注册营养师 · 减脂/控糖"></div>` : ''}
      <button class="btn btn-primary btn-block" onclick="PageAuth.doRegister()"><i data-lucide="user-plus"></i>注册并进入</button>
      <div style="text-align:center;margin-top:12px;font-size:0.8125rem;color:var(--text-secondary);">
        已有账号？<a href="javascript:void(0)" onclick="PageAuth.setMode('login')" style="color:var(--primary);font-weight:600;">去登录</a>
      </div>
    `;
  }

  function setMode(m) { mode = m; App.rerender(); }
  function pickRole(r) { role = r; App.rerender(); }

  function enterAs(user) {
    AppState.setRole(user.role);
    UI.toast(`欢迎，${user.nickname}`, 'success');
    location.hash = Auth.roleHome(user.role);
    App.render();
  }

  function doLogin() {
    const account = document.getElementById('authAccount')?.value.trim();
    const password = document.getElementById('authPassword')?.value;
    if (!account || !password) { UI.toast('请输入账号和密码', 'warning'); return; }
    const r = Auth.login(account, password);
    if (!r.ok) { UI.toast(r.msg, 'error'); return; }
    enterAs(r.user);
  }

  function doRegister() {
    const nickname = document.getElementById('regNickname')?.value.trim();
    const account = document.getElementById('regAccount')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const password2 = document.getElementById('regPassword2')?.value;
    if (!nickname || !account || !password) { UI.toast('请填写昵称、账号和密码', 'warning'); return; }
    if (password.length < 3) { UI.toast('密码至少 3 位', 'warning'); return; }
    if (password !== password2) { UI.toast('两次密码不一致', 'warning'); return; }
    const extra = {};
    if (role === 'merchant') extra.shop = document.getElementById('regShop')?.value.trim() || '';
    if (role === 'nutritionist') extra.qualification = document.getElementById('regQual')?.value.trim() || '';
    const r = Auth.register({ nickname, account, password, role, extra });
    if (!r.ok) { UI.toast(r.msg, 'error'); return; }
    enterAs(r.user);
  }

  return { render, setMode, pickRole, doLogin, doRegister };
})();
