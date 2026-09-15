/* 登录/注册页 —— Supabase 认证 */
const PageAuth = (() => {
  let state = {
    mode: 'login', // login | signup
    email: '',
    password: '',
    nickname: '',
    loading: false,
    error: null,
    success: null
  };

  function render() {
    const isConfigured = typeof SupabaseDB !== 'undefined' && SupabaseDB.isConfigured();
    
    return `
      <div class="page-content" style="max-width:420px;margin:0 auto;padding-top:40px;">
        <!-- Logo -->
        <div style="text-align:center;margin-bottom:32px;">
          <div style="width:72px;height:72px;border-radius:20px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:var(--shadow-primary);">
            <i data-lucide="leaf" style="width:36px;height:36px;color:#fff;"></i>
          </div>
          <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;">营养智链</h1>
          <p style="font-size:0.875rem;color:var(--text-secondary);">外卖个性化营养管理平台</p>
        </div>

        ${!isConfigured ? `
          <div class="card" style="border-left:4px solid var(--color-warning);">
            <div class="card-body">
              <div style="display:flex;align-items:flex-start;gap:10px;">
                <i data-lucide="alert-triangle" style="width:20px;height:20px;color:var(--color-warning);flex-shrink:0;margin-top:2px;"></i>
                <div>
                  <h3 style="font-size:0.9375rem;font-weight:700;margin-bottom:6px;">Supabase 未配置</h3>
                  <p style="font-size:0.8125rem;color:var(--text-secondary);line-height:1.6;margin-bottom:12px;">
                    当前使用本地模式，数据保存在浏览器中。如需多设备同步和用户账号，请配置 Supabase。
                  </p>
                  <a href="#/" class="btn btn-primary btn-sm"><i data-lucide="arrow-left"></i>返回首页（本地模式）</a>
                </div>
              </div>
            </div>
          </div>
        ` : `
          <!-- 切换标签 -->
          <div style="display:flex;background:var(--color-bg);border-radius:12px;padding:4px;margin-bottom:20px;">
            <button onclick="PageAuth.setMode('login')" style="flex:1;padding:10px;border-radius:8px;border:none;background:${state.mode==='login'?'var(--primary-gradient)':'transparent'};color:${state.mode==='login'?'#fff':'var(--text-secondary)'};font-weight:600;font-size:0.875rem;cursor:pointer;transition:all 0.2s;">
              登录
            </button>
            <button onclick="PageAuth.setMode('signup')" style="flex:1;padding:10px;border-radius:8px;border:none;background:${state.mode==='signup'?'var(--primary-gradient)':'transparent'};color:${state.mode==='signup'?'#fff':'var(--text-secondary)'};font-weight:600;font-size:0.875rem;cursor:pointer;transition:all 0.2s;">
              注册
            </button>
          </div>

          <!-- 错误提示 -->
          ${state.error ? `
            <div style="background:#FEF2F2;border:1px solid #FECACA;color:#DC2626;padding:12px 14px;border-radius:10px;font-size:0.8125rem;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;">
              <i data-lucide="alert-circle" style="width:16px;height:16px;flex-shrink:0;margin-top:1px;"></i>
              <span>${state.error}</span>
            </div>
          ` : ''}

          <!-- 成功提示 -->
          ${state.success ? `
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;color:#16A34A;padding:12px 14px;border-radius:10px;font-size:0.8125rem;margin-bottom:16px;display:flex;align-items:flex-start;gap:8px;">
              <i data-lucide="check-circle" style="width:16px;height:16px;flex-shrink:0;margin-top:1px;"></i>
              <span>${state.success}</span>
            </div>
          ` : ''}

          <!-- 表单 -->
          <div class="card">
            <div class="card-body" style="padding:24px;">
              ${state.mode === 'signup' ? `
                <div class="form-group" style="margin-bottom:16px;">
                  <label class="form-label">昵称</label>
                  <input type="text" class="form-input" id="authNickname" placeholder="请输入昵称" value="${state.nickname}" style="width:100%;">
                </div>
              ` : ''}
              
              <div class="form-group" style="margin-bottom:16px;">
                <label class="form-label">邮箱</label>
                <input type="email" class="form-input" id="authEmail" placeholder="请输入邮箱" value="${state.email}" style="width:100%;">
              </div>
              
              <div class="form-group" style="margin-bottom:20px;">
                <label class="form-label">密码</label>
                <input type="password" class="form-input" id="authPassword" placeholder="请输入密码（至少6位）" style="width:100%;">
              </div>

              <button class="btn btn-primary btn-block" onclick="PageAuth.submit()" ${state.loading?'disabled':''} style="margin-bottom:16px;">
                ${state.loading ? '<span class="loading-spinner" style="width:18px;height:18px;border-width:2px;margin:0;"></span>处理中...' : (state.mode === 'login' ? '<i data-lucide="log-in"></i>登录' : '<i data-lucide="user-plus"></i>注册')}
              </button>

              <!-- 分割线 -->
              <div style="display:flex;align-items:center;gap:12px;margin:20px 0;">
                <div style="flex:1;height:1px;background:var(--color-border-light);"></div>
                <span style="font-size:0.75rem;color:var(--text-muted);">或</span>
                <div style="flex:1;height:1px;background:var(--color-border-light);"></div>
              </div>

              <!-- 第三方登录 -->
              <div style="display:flex;gap:10px;">
                <button class="btn btn-secondary btn-block" onclick="PageAuth.oauth('google')" style="flex:1;">
                  <svg width="18" height="18" viewBox="0 0 24 24" style="margin-right:6px;"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button class="btn btn-secondary btn-block" onclick="PageAuth.oauth('github')" style="flex:1;">
                  <i data-lucide="github" style="width:18px;height:18px;margin-right:6px;"></i>
                  GitHub
                </button>
              </div>

              <p style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:20px;line-height:1.6;">
                登录即表示同意<a href="#" style="color:var(--color-primary);">服务条款</a>和<a href="#" style="color:var(--color-primary);">隐私政策</a>
              </p>
            </div>
          </div>

          <!-- 本地模式入口 -->
          <div style="text-align:center;margin-top:20px;">
            <a href="#/" onclick="PageAuth.useLocalMode()" style="font-size:0.8125rem;color:var(--text-secondary);text-decoration:underline;">
              暂不登录，使用本地模式
            </a>
          </div>
        `}
      </div>
    `;
  }

  function setMode(mode) {
    state.mode = mode;
    state.error = null;
    state.success = null;
    App.rerender();
  }

  async function submit() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value;
    const nickname = document.getElementById('authNickname')?.value?.trim();

    if (!email) { state.error = '请输入邮箱'; App.rerender(); return; }
    if (!password || password.length < 6) { state.error = '密码至少6位'; App.rerender(); return; }

    state.loading = true;
    state.error = null;
    state.success = null;
    App.rerender();

    try {
      if (state.mode === 'login') {
        const result = await SupabaseDB.signIn(email, password);
        if (result.success) {
          state.success = '登录成功，正在跳转...';
          App.rerender();
          setTimeout(() => App.navigate('#/'), 1000);
        } else {
          state.error = result.error || '登录失败';
        }
      } else {
        const result = await SupabaseDB.signUp(email, password, nickname);
        if (result.success) {
          state.success = '注册成功！请检查邮箱验证后登录';
          state.mode = 'login';
        } else {
          state.error = result.error || '注册失败';
        }
      }
    } catch (e) {
      state.error = e.message || '操作失败';
    }

    state.loading = false;
    App.rerender();
  }

  async function oauth(provider) {
    if (typeof SupabaseDB === 'undefined' || !SupabaseDB.isConfigured()) {
      state.error = 'Supabase 未配置';
      App.rerender();
      return;
    }
    try {
      // 第三方登录需要在 Supabase Dashboard 中启用对应 provider
      state.error = `请先在 Supabase Dashboard → Authentication → Providers 中启用 ${provider} 登录`;
      App.rerender();
    } catch (e) {
      state.error = e.message;
      App.rerender();
    }
  }

  function useLocalMode() {
    // 本地模式不需要特殊处理，直接返回首页
    return true;
  }

  return { render, setMode, submit, oauth, useLocalMode };
})();
