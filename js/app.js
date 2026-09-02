/* ============================================================
   主应用：路由、状态管理、导航、localStorage持久化
   纯静态架构，无后端依赖
   ============================================================ */

const AppState = (() => {
  const KEYS = { profile: 'npv2_profile', records: 'npv2_records', role: 'npv2_role' };

  function init() {
    if (!localStorage.getItem(KEYS.profile)) {
      localStorage.setItem(KEYS.profile, JSON.stringify(NPV2_DATA.DEFAULT_PROFILE));
    }
    if (!localStorage.getItem(KEYS.records)) {
      localStorage.setItem(KEYS.records, JSON.stringify([]));
    }
  }

  function getProfile() {
    try { return JSON.parse(localStorage.getItem(KEYS.profile)) || NPV2_DATA.DEFAULT_PROFILE; }
    catch { return NPV2_DATA.DEFAULT_PROFILE; }
  }

  function saveProfile(p) {
    localStorage.setItem(KEYS.profile, JSON.stringify(p));
  }

  function getRecords() {
    try { return JSON.parse(localStorage.getItem(KEYS.records)) || []; }
    catch { return []; }
  }

  function addRecord(r) {
    const records = getRecords();
    records.push(r);
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  }

  function updateRecord(id, updates) {
    const records = getRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx > -1) {
      records[idx] = { ...records[idx], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem(KEYS.records, JSON.stringify(records));
    }
  }

  function deleteRecord(id) {
    const records = getRecords().filter(r => r.id !== id);
    localStorage.setItem(KEYS.records, JSON.stringify(records));
  }

  function getRole() {
    return localStorage.getItem(KEYS.role) || 'user';
  }

  function setRole(role) {
    localStorage.setItem(KEYS.role, role);
  }

  return { init, getProfile, saveProfile, getRecords, addRecord, updateRecord, deleteRecord, getRole, setRole };
})();

const App = (() => {
  const routes = {
    '/': PageOverview,
    '/record/order': PageOrder,
    '/record/meal-photo': PageMeal,
    '/record/beverage': PageBeverage,
    '/history': PageHistory,
    '/goals': PageGoals,
    '/merchant': PageMerchant,
    '/merchant/analytics': PageMerchantAnalytics,
    '/merchant/dishes': PageMerchantDishes,
    '/merchant/community': PageMerchantCommunity,
    '/nutritionist': PageNutritionist,
    '/nutritionist/users': PageNutritionistUsers,
    '/nutritionist/articles': PageNutritionistArticles,
    '/nutritionist/stats': PageNutritionistStats,
    '/community': PageCommunity,
    '/project': PageProject
  };

  let currentRoute = '/';

  function getRouteFromHash() {
    const hash = window.location.hash.replace(/^#/, '') || '/';
    return routes[hash] ? hash : '/';
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  function rerender() {
    render();
  }

  function render() {
    currentRoute = getRouteFromHash();
    const page = routes[currentRoute];
    const main = document.getElementById('mainContent');
    if (main && page) {
      main.innerHTML = page.render();
      // 刷新图标
      if (window.lucide) lucide.createIcons({ root: main });
      // 页面特定事件绑定
      if (page.bindEvents) page.bindEvents();
      // 滚动到顶部
      main.scrollTop = 0;
      window.scrollTo(0, 0);
    }
    updateNavActive();
    updateRoleUI();
  }

  function updateNavActive() {
    document.querySelectorAll('.nav-link, .bottom-link').forEach(link => {
      const route = link.dataset.route;
      if (route === currentRoute) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function updateRoleUI() {
    const role = AppState.getRole();
    document.querySelectorAll('.role-btn').forEach(btn => {
      const isActive = btn.dataset.role === role;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
    // 根据角色显示/隐藏导航项（桌面端侧边栏）
    document.querySelectorAll('.nav-inner > [data-role], .nav-inner > .nav-group[data-role]').forEach(el => {
      const r = el.dataset.role;
      const visible = (r === 'all' || r === role);
      el.style.display = visible ? '' : 'none';
    });
    // 移动端底部导航：根据角色显示
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
      const userLinks = [
        { route: '/', icon: 'home', label: '总览' },
        { route: '/record/beverage', icon: 'cup-soda', label: '饮品' },
        { route: '/record/meal-photo', icon: 'camera', label: '拍照' },
        { route: '/history', icon: 'history', label: '历史' },
        { route: '/goals', icon: 'settings', label: '设置' }
      ];
      const merchantLinks = [
        { route: '/merchant', icon: 'store', label: '工作台' },
        { route: '/merchant/analytics', icon: 'bar-chart-3', label: '数据' },
        { route: '/merchant/dishes', icon: 'utensils', label: '菜品' },
        { route: '/merchant/community', icon: 'message-square', label: '社区' },
        { route: '/project', icon: 'award', label: '项目' }
      ];
      const nutritionistLinks = [
        { route: '/nutritionist', icon: 'stethoscope', label: '复核' },
        { route: '/nutritionist/users', icon: 'users', label: '用户' },
        { route: '/nutritionist/articles', icon: 'book-open', label: '知识' },
        { route: '/nutritionist/stats', icon: 'bar-chart-2', label: '统计' },
        { route: '/project', icon: 'award', label: '项目' }
      ];
      const links = role === 'merchant' ? merchantLinks : role === 'nutritionist' ? nutritionistLinks : userLinks;
      bottomNav.innerHTML = links.map(l =>
        `<a href="#${l.route}" class="bottom-link" data-route="${l.route}"><i data-lucide="${l.icon}"></i><span>${l.label}</span></a>`
      ).join('');
      if (window.lucide) lucide.createIcons({ root: bottomNav });
    }
  }

  function init() {
    AppState.init();

    // 路由变化
    window.addEventListener('hashchange', render);

    // 角色切换
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        AppState.setRole(role);
        updateRoleUI();
        const roleNames = { user: '用户', merchant: '商家', nutritionist: '营养师' };
        UI.toast(`已切换到${roleNames[role]}角色`, 'info');
        // 切换角色后导航到对应页面
        if (role === 'merchant') navigate('#/merchant');
        else if (role === 'nutritionist') navigate('#/nutritionist');
        else navigate('#/');
      });
    });

    // 移动端菜单
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    if (menuToggle && mainNav) {
      const iconMenu = menuToggle.querySelector('.icon-menu');
      const iconClose = menuToggle.querySelector('.icon-close');
      function toggleMenuIcon(isOpen) {
        if (iconMenu && iconClose) {
          iconMenu.style.display = isOpen ? 'none' : 'block';
          iconClose.style.display = isOpen ? 'block' : 'none';
        }
      }
      menuToggle.addEventListener('click', () => {
        const isOpen = mainNav.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen);
        toggleMenuIcon(isOpen);
      });
      // 点击导航项后关闭菜单
      mainNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          mainNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          toggleMenuIcon(false);
        });
      });
    }

    // 初始渲染
    render();

    console.log('%c营养智链Web 原型已加载', 'color:#0B7285;font-weight:bold;font-size:14px;');
    console.log('版本：2026-09-01 · 本地流程原型 · 纯静态架构 · 非医疗建议');
    console.log('数据仅存于本机浏览器 localStorage，未接入任何后端服务。');
  }

  return { init, render, rerender, navigate };
})();

// 启动
document.addEventListener('DOMContentLoaded', () => {
  // Lucide 图标加载检测
  if (typeof lucide === 'undefined') {
    console.warn('Lucide 图标库未加载，将使用文字替代');
  }
  App.init();
});
