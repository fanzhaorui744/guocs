/* ============================================================
 * Supabase 接入模块 —— 营养智链
 * 功能：认证 + 数据同步 + 本地云端双写
 * 使用前请在 CONFIG 中填入你的 SUPABASE_URL 和 SUPABASE_ANON_KEY
 * ============================================================ */

const SupabaseDB = (() => {
  // ========== 配置（请填入你的 Supabase 项目信息） ==========
  const CONFIG = {
    SUPABASE_URL: 'https://your-project.supabase.co',      // ← 替换为你的项目 URL
    SUPABASE_ANON_KEY: 'your-anon-key',                      // ← 替换为你的 anon key
    STORAGE_BUCKET_MEAL: 'meal-images',
    STORAGE_BUCKET_BEVERAGE: 'beverage-images',
    STORAGE_BUCKET_AVATAR: 'avatars'
  };

  // ========== 状态 ==========
  let supabaseClient = null;
  let currentUser = null;
  let isInitialized = false;
  let syncListeners = [];

  // ========== 初始化 ==========
  function init() {
    if (isInitialized) return;
    try {
      // 检查是否已配置
      if (CONFIG.SUPABASE_URL === 'https://your-project.supabase.co' || 
          CONFIG.SUPABASE_ANON_KEY === 'your-anon-key') {
        console.log('[Supabase] 未配置，使用本地 localStorage 模式');
        isInitialized = true;
        return;
      }
      // 动态加载 Supabase SDK
      if (typeof window.supabase === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          createClient();
        };
        script.onerror = () => {
          console.warn('[Supabase] SDK 加载失败，使用本地模式');
        };
        document.head.appendChild(script);
      } else {
        createClient();
      }
      isInitialized = true;
    } catch (e) {
      console.error('[Supabase] 初始化失败:', e);
    }
  }

  function createClient() {
    try {
      supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      // 监听认证状态变化
      supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        if (event === 'SIGNED_IN') {
          console.log('[Supabase] 用户登录:', currentUser.email);
          // 登录后从云端拉取数据
          pullAllData();
        } else if (event === 'SIGNED_OUT') {
          console.log('[Supabase] 用户登出');
          currentUser = null;
        }
        notifySyncListeners('auth', currentUser);
      });
      // 检查当前会话
      supabaseClient.auth.getSession().then(({ data }) => {
        currentUser = data.session?.user || null;
        if (currentUser) {
          console.log('[Supabase] 已登录:', currentUser.email);
          pullAllData();
        }
      });
      console.log('[Supabase] 客户端初始化成功');
    } catch (e) {
      console.error('[Supabase] 创建客户端失败:', e);
    }
  }

  // ========== 认证功能 ==========

  // 注册
  async function signUp(email, password, nickname) {
    if (!supabaseClient) return { success: false, error: 'Supabase 未配置' };
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { nickname: nickname || '营养达人' }
        }
      });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 登录
  async function signIn(email, password) {
    if (!supabaseClient) return { success: false, error: 'Supabase 未配置' };
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 登出
  async function signOut() {
    if (!supabaseClient) return { success: false };
    try {
      await supabaseClient.auth.signOut();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // 获取当前用户
  function getUser() {
    return currentUser;
  }

  // 是否已登录
  function isLoggedIn() {
    return !!currentUser;
  }

  // 获取用户 profile
  async function getProfile() {
    if (!supabaseClient || !currentUser) return null;
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      if (error) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  // 更新用户 profile
  async function updateProfile(updates) {
    if (!supabaseClient || !currentUser) return { success: false };
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', currentUser.id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // ========== 数据同步 ==========

  // 同步餐食记录到云端
  async function syncMealRecords(records) {
    if (!supabaseClient || !currentUser || !records || records.length === 0) return;
    try {
      const mealRecords = records.filter(r => r.source_type !== 'beverage' && r.items?.some(i => i.category === 'meal'));
      if (mealRecords.length === 0) return;
      
      const toInsert = mealRecords.map(r => {
        const item = r.items?.[0] || {};
        return {
          user_id: currentUser.id,
          dish_name: r.merchant_label || item.name || '未知食物',
          category: item.category || 'meal',
          mass_g: item.estimated_weight_g || null,
          kcal: item.calories_kcal?.value || null,
          kcal_min: item.calories_kcal?.interval?.min || null,
          kcal_max: item.calories_kcal?.interval?.max || null,
          protein_g: item.protein_g?.value || null,
          fat_g: item.fat_g?.value || null,
          carbs_g: item.carbs_g?.value || null,
          sugar_g: item.sugar_g?.value || null,
          sodium_mg: item.sodium_mg?.value || null,
          meal_period: r.meal_period || 'snack',
          source_type: r.source_type || 'smart_recognize',
          confidence: item.confidence || null,
          visual_measure: r.visual_measure || null,
          created_at: r.created_at || new Date().toISOString()
        };
      });
      
      const { error } = await supabaseClient.from('meal_records').insert(toInsert);
      if (error) console.error('[Supabase] 同步餐食记录失败:', error);
      else console.log(`[Supabase] 同步了 ${toInsert.length} 条餐食记录`);
    } catch (e) {
      console.error('[Supabase] 同步餐食记录异常:', e);
    }
  }

  // 同步饮品记录到云端
  async function syncBeverageRecords(records) {
    if (!supabaseClient || !currentUser || !records || records.length === 0) return;
    try {
      const bevRecords = records.filter(r => r.source_type === 'beverage' || r.items?.some(i => i.category === 'beverage'));
      if (bevRecords.length === 0) return;
      
      const toInsert = bevRecords.map(r => {
        const item = r.items?.[0] || {};
        return {
          user_id: currentUser.id,
          drink_name: r.merchant_label || item.name || '未知饮品',
          brand_name: r.brand_name || null,
          volume_ml: item.volume_ml || 500,
          cup_size: r.cup_size || 'medium',
          sugar_level: r.sugar_level || 'full_sugar',
          ice_level: r.ice_level || 'normal_ice',
          toppings: r.toppings || [],
          kcal: item.calories_kcal?.value || null,
          kcal_min: item.calories_kcal?.interval?.min || null,
          kcal_max: item.calories_kcal?.interval?.max || null,
          protein_g: item.protein_g?.value || null,
          fat_g: item.fat_g?.value || null,
          carbs_g: item.carbs_g?.value || null,
          sugar_g: item.sugar_g?.value || null,
          consumed_ratio: r.consumed_ratio || 1.0,
          source_type: r.source_type || 'beverage_config',
          created_at: r.created_at || new Date().toISOString()
        };
      });
      
      const { error } = await supabaseClient.from('beverage_records').insert(toInsert);
      if (error) console.error('[Supabase] 同步饮品记录失败:', error);
      else console.log(`[Supabase] 同步了 ${toInsert.length} 条饮品记录`);
    } catch (e) {
      console.error('[Supabase] 同步饮品记录异常:', e);
    }
  }

  // 同步用户自定义饮品到云端
  async function syncUserBeverages(beverages) {
    if (!supabaseClient || !currentUser || !beverages || beverages.length === 0) return;
    try {
      const toInsert = beverages.map(b => ({
        user_id: currentUser.id,
        drink_name: b.display_name || b.name,
        brand_name: b.brand_name || '用户添加',
        category: b.category || 'other',
        aliases: b.aliases || [],
        base_nutrition: b.base_nutrition || {},
        sugar_deltas: b.sugar_deltas || null,
        available_configuration: b.available_configuration || null,
        confidence: b.confidence || 0.5,
        notes: b.notes || null
      }));
      
      const { error } = await supabaseClient.from('user_beverages').insert(toInsert, { onConflict: 'user_id,drink_name' });
      if (error) console.error('[Supabase] 同步用户饮品失败:', error);
      else console.log(`[Supabase] 同步了 ${toInsert.length} 个用户饮品`);
    } catch (e) {
      console.error('[Supabase] 同步用户饮品异常:', e);
    }
  }

  // 从云端拉取所有数据
  async function pullAllData() {
    if (!supabaseClient || !currentUser) return null;
    try {
      console.log('[Supabase] 从云端拉取数据...');
      
      // 并行拉取
      const [mealRes, bevRes, userBevRes, profileRes] = await Promise.all([
        supabaseClient.from('meal_records').select('*').order('created_at', { ascending: false }).limit(500),
        supabaseClient.from('beverage_records').select('*').order('created_at', { ascending: false }).limit(500),
        supabaseClient.from('user_beverages').select('*'),
        getProfile()
      ]);
      
      const result = {
        mealRecords: mealRes.data || [],
        beverageRecords: bevRes.data || [],
        userBeverages: userBevRes.data || [],
        profile: profileRes
      };
      
      console.log(`[Supabase] 拉取完成: 餐食${result.mealRecords.length}条, 饮品${result.beverageRecords.length}条, 自定义饮品${result.userBeverages.length}个`);
      notifySyncListeners('pull', result);
      return result;
    } catch (e) {
      console.error('[Supabase] 拉取数据异常:', e);
      return null;
    }
  }

  // 全量同步（本地→云端）
  async function pushAllData(localRecords, localUserBeverages) {
    if (!isLoggedIn()) return;
    await Promise.all([
      syncMealRecords(localRecords),
      syncBeverageRecords(localRecords),
      syncUserBeverages(localUserBeverages)
    ]);
    notifySyncListeners('push', null);
  }

  // ========== 存储（图片上传） ==========
  async function uploadMealImage(filePath, fileName) {
    if (!supabaseClient || !currentUser) return null;
    try {
      const { data, error } = await supabaseClient.storage
        .from(CONFIG.STORAGE_BUCKET_MEAL)
        .upload(`${currentUser.id}/${fileName}`, filePath, { contentType: 'image/jpeg' });
      if (error) return null;
      const { data: urlData } = supabaseClient.storage
        .from(CONFIG.STORAGE_BUCKET_MEAL)
        .getPublicUrl(`${currentUser.id}/${fileName}`);
      return urlData?.publicUrl || null;
    } catch (e) {
      return null;
    }
  }

  // ========== 监听器 ==========
  function onSync(callback) {
    syncListeners.push(callback);
    return () => {
      syncListeners = syncListeners.filter(l => l !== callback);
    };
  }

  function notifySyncListeners(type, data) {
    syncListeners.forEach(l => {
      try { l(type, data); } catch(e) {}
    });
  }

  // ========== 配置检查 ==========
  function isConfigured() {
    return CONFIG.SUPABASE_URL !== 'https://your-project.supabase.co' && 
           CONFIG.SUPABASE_ANON_KEY !== 'your-anon-key';
  }

  function getConfig() {
    return { ...CONFIG };
  }

  // 动态更新配置（运行时）
  function setConfig(url, anonKey) {
    CONFIG.SUPABASE_URL = url;
    CONFIG.SUPABASE_ANON_KEY = anonKey;
    isInitialized = false;
    init();
  }

  // ========== 导出 ==========
  return {
    init,
    // 认证
    signUp,
    signIn,
    signOut,
    getUser,
    isLoggedIn,
    getProfile,
    updateProfile,
    // 数据同步
    syncMealRecords,
    syncBeverageRecords,
    syncUserBeverages,
    pullAllData,
    pushAllData,
    // 存储
    uploadMealImage,
    // 监听器
    onSync,
    // 配置
    isConfigured,
    getConfig,
    setConfig
  };
})();

// 自动初始化
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SupabaseDB.init());
  } else {
    SupabaseDB.init();
  }
}
