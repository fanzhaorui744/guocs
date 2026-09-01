/* ============================================================
   数据层 v2.0：所有 mock/fixture 数据
   - 6条来源型种子记录（真实知识库口径）
   - 45条饮品虚构交互候选（3品牌×15）
   - 三餐分布历史记录
   - 协同事件（用户→商家→营养师闭环）
   - 创新社区帖子（记录即帖子+三方角色互动）
   - 商家反馈聚合 + 营养师建议模板
   所有数据标注为虚构/演示
   ============================================================ */

const NPV2_DATA = (() => {

  // ========== 6条来源型种子记录 ==========
  const SOURCE_SEEDS = [
    { source_id:'seed_001', publisher:'某连锁茶饮品牌公开营养信息表（2025版）', source_type:'merchant_public_nutrition_table', url_or_document_ref:'品牌官网营养信息页（待补充可公开链接）', retrieved_at:'2026-07-15', verified_at:'2026-08-02', market_scope:'中国大陆部分城市门店', evidence_grade:'merchant_public', review_status:'accepted', notes:'来源型种子记录：品牌公开营养信息，仅覆盖部分SKU的全糖标准杯数据。' },
    { source_id:'seed_002', publisher:'中国食物成分表（第6版）', source_type:'food_composition_database', url_or_document_ref:'《中国食物成分表》标准版第6版/第一册', retrieved_at:'2026-06-20', verified_at:'2026-07-10', market_scope:'全国通用食物成分参考', evidence_grade:'standard_reference', review_status:'accepted', notes:'来源型种子记录：用于基底食材营养参考值，非品牌特定配方。' },
    { source_id:'seed_003', publisher:'某咖啡连锁品牌菜单营养标注（门店拍摄）', source_type:'in_store_menu_photo', url_or_document_ref:'门店菜单照片（本地存档，待授权确认）', retrieved_at:'2026-08-01', verified_at:null, market_scope:'合肥地区门店', evidence_grade:'unverified_photo', review_status:'pending', notes:'来源型种子记录：尚未完成授权和复核，仅作参考。' },
    { source_id:'seed_004', publisher:'美国农业部食品数据中心（USDA FoodData Central）', source_type:'external_food_database', url_or_document_ref:'https://fdc.nal.usda.gov/', retrieved_at:'2026-05-28', verified_at:'2026-07-15', market_scope:'国际食材参考', evidence_grade:'external_reference', review_status:'accepted', notes:'来源型种子记录：用于珍珠、椰果等小料营养区间参考。' },
    { source_id:'seed_005', publisher:'15份安大磬苑周边商家匿名半结构化访谈', source_type:'academic_interview_notes', url_or_document_ref:'访谈编号B01-B15（需求验证用途）', retrieved_at:'2026-07-01', verified_at:'2026-08-20', market_scope:'合肥安大磬苑周边', evidence_grade:'interview_anecdotal', review_status:'accepted', notes:'需求验证用途，不代表合作/签约/试点。10份反馈偏好批量表/Excel维护。' },
    { source_id:'seed_006', publisher:'预包装食品营养标签通则（GB 28050-2011）', source_type:'national_standard', url_or_document_ref:'GB 28050-2011', retrieved_at:'2026-06-01', verified_at:'2026-06-01', market_scope:'全国标准', evidence_grade:'regulatory', review_status:'accepted', notes:'营养标签标示规则参考。' }
  ];

  // ========== 饮品虚构交互候选（3品牌×15=45条） ==========
  const BEVERAGE_BRANDS = [
    { brand_id:'fict_tea_a', brand_name:'清叶茶铺（虚构）', aliases:['清叶','QY'] },
    { brand_id:'fict_tea_b', brand_name:'云雾制茶（虚构）', aliases:['云雾','YW'] },
    { brand_id:'fict_tea_c', brand_name:'果研所（虚构）', aliases:['果研所','GYS'] }
  ];

  function makeSkus(brand, categories) {
    return categories.map((c, i) => ({
      brand_id: brand.brand_id, brand_name: brand.brand_name,
      sku_id: `${brand.brand_id}_sku_${String(i+1).padStart(3,'0')}`,
      display_name: c.name, aliases: c.aliases || [], category: c.category,
      record_status: c.record_status || 'estimated',
      source_ids: c.source_ids || ['seed_002','seed_004'],
      source_insufficient: c.source_insufficient || false,
      available_configuration: {
        cup_sizes: c.cup_sizes || [{id:'medium',label:'中杯',ml:500},{id:'large',label:'大杯',ml:650}],
        sugar_levels: [{id:'full_sugar',label:'全糖'},{id:'less_sugar',label:'七分糖'},{id:'half_sugar',label:'半糖'},{id:'quarter_sugar',label:'三分糖'},{id:'no_sugar',label:'无糖'}],
        ice_levels: [{id:'normal_ice',label:'正常冰'},{id:'less_ice',label:'少冰'},{id:'no_ice',label:'去冰'},{id:'hot',label:'热饮'}],
        toppings: c.toppings || [
          {topping_id:'pearl',label:'珍珠',kcal_interval:{min:55,max:65}},
          {topping_id:'coconut_jelly',label:'椰果',kcal_interval:{min:35,max:45}},
          {topping_id:'pudding',label:'布丁',kcal_interval:{min:70,max:90}},
          {topping_id:'red_bean',label:'红豆',kcal_interval:{min:50,max:70}}
        ]
      },
      base_nutrition: c.base_nutrition || {
        medium: { full_sugar: { kcal:{value:null,interval:{min:180,max:240}}, protein_g:{value:2,interval:{min:1,max:3}}, fat_g:{value:4,interval:{min:2,max:6}}, carbs_g:{value:35,interval:{min:28,max:42}}, sugar_g:{value:28,interval:{min:22,max:34}}, sodium_mg:{value:null,interval:{min:15,max:35}} } },
        large: { full_sugar: { kcal:{value:null,interval:{min:240,max:320}}, protein_g:{value:3,interval:{min:2,max:4}}, fat_g:{value:5,interval:{min:3,max:7}}, carbs_g:{value:46,interval:{min:38,max:54}}, sugar_g:{value:36,interval:{min:30,max:42}}, sodium_mg:{value:null,interval:{min:20,max:45}} } }
      },
      sugar_deltas: { full_to_less:{kcal:-15,sugar_g:-4}, full_to_half:{kcal:-30,sugar_g:-8}, full_to_quarter:{kcal:-45,sugar_g:-12}, full_to_none:{kcal:-60,sugar_g:-16} },
      confidence: c.confidence || 0.55 + Math.random()*0.2,
      notes: c.notes || '虚构交互候选，仅用于演示流程。'
    }));
  }

  const brandASkus = makeSkus(BEVERAGE_BRANDS[0], [
    {name:'茉莉奶绿',category:'milk_tea',record_status:'merchant_confirmed',source_ids:['seed_001'],confidence:0.82},
    {name:'珍珠奶茶',category:'milk_tea',record_status:'estimated',confidence:0.58,source_insufficient:true},
    {name:'芋泥波波奶茶',category:'milk_tea',record_status:'estimated',confidence:0.52},
    {name:'红豆奶茶',category:'milk_tea',record_status:'estimated',confidence:0.56},
    {name:'布丁奶茶',category:'milk_tea',record_status:'estimated',confidence:0.54},
    {name:'四季春茶',category:'pure_tea',record_status:'merchant_confirmed',source_ids:['seed_001'],confidence:0.88},
    {name:'桂花乌龙',category:'pure_tea',record_status:'estimated',confidence:0.60},
    {name:'柠檬绿茶',category:'fruit_tea',record_status:'estimated',confidence:0.55},
    {name:'百香果茶',category:'fruit_tea',record_status:'estimated',confidence:0.53},
    {name:'葡萄柚绿茶',category:'fruit_tea',record_status:'estimated',confidence:0.50},
    {name:'芒果冰沙',category:'smoothie',record_status:'estimated',confidence:0.48},
    {name:'草莓奶昔',category:'smoothie',record_status:'estimated',confidence:0.46},
    {name:'咖啡拿铁',category:'coffee',record_status:'estimated',confidence:0.58},
    {name:'美式咖啡',category:'coffee',record_status:'merchant_confirmed',source_ids:['seed_001'],confidence:0.90},
    {name:'焦糖玛奇朵',category:'coffee',record_status:'estimated',confidence:0.50}
  ]);
  const brandBSkus = makeSkus(BEVERAGE_BRANDS[1], [
    {name:'云雾绿茶',category:'pure_tea',record_status:'merchant_confirmed',source_ids:['seed_001'],confidence:0.85},
    {name:'白桃乌龙',category:'pure_tea',record_status:'estimated',confidence:0.58},
    {name:'荔枝红茶',category:'pure_tea',record_status:'estimated',confidence:0.56},
    {name:'芝士奶盖绿茶',category:'milk_foam',record_status:'estimated',confidence:0.52,source_insufficient:true},
    {name:'咸蛋黄奶盖红茶',category:'milk_foam',record_status:'estimated',confidence:0.48},
    {name:'提拉米苏奶茶',category:'milk_tea',record_status:'estimated',confidence:0.50},
    {name:'黑糖珍珠鲜奶',category:'milk_tea',record_status:'estimated',confidence:0.54},
    {name:'抹茶拿铁',category:'milk_tea',record_status:'estimated',confidence:0.56},
    {name:'芋泥鲜奶',category:'milk_tea',record_status:'estimated',confidence:0.53},
    {name:'西瓜汁',category:'fruit_tea',record_status:'estimated',confidence:0.50},
    {name:'橙汁',category:'fruit_tea',record_status:'estimated',confidence:0.52},
    {name:'蓝莓酸奶',category:'smoothie',record_status:'estimated',confidence:0.48},
    {name:'木瓜牛奶',category:'smoothie',record_status:'estimated',confidence:0.50},
    {name:'燕麦拿铁',category:'coffee',record_status:'estimated',confidence:0.55},
    {name:'摩卡咖啡',category:'coffee',record_status:'estimated',confidence:0.52}
  ]);
  const brandCSkus = makeSkus(BEVERAGE_BRANDS[2], [
    {name:'满杯红柚',category:'fruit_tea',record_status:'merchant_confirmed',source_ids:['seed_001'],confidence:0.80},
    {name:'满杯百香果',category:'fruit_tea',record_status:'estimated',confidence:0.56},
    {name:'多肉葡萄',category:'fruit_tea',record_status:'estimated',confidence:0.54,source_insufficient:true},
    {name:'芝芝莓莓',category:'fruit_tea',record_status:'estimated',confidence:0.52},
    {name:'芒果班戟茶',category:'fruit_tea',record_status:'estimated',confidence:0.50},
    {name:'柠檬养乐多',category:'fruit_tea',record_status:'estimated',confidence:0.53},
    {name:'石榴绿茶',category:'fruit_tea',record_status:'estimated',confidence:0.48},
    {name:'菠萝冰茶',category:'fruit_tea',record_status:'estimated',confidence:0.51},
    {name:'水蜜桃乌龙',category:'fruit_tea',record_status:'estimated',confidence:0.55},
    {name:'荔枝气泡水',category:'sparkling',record_status:'estimated',confidence:0.46},
    {name:'葡萄气泡水',category:'sparkling',record_status:'estimated',confidence:0.48},
    {name:'酸奶紫米露',category:'smoothie',record_status:'estimated',confidence:0.50},
    {name:'香蕉牛奶',category:'smoothie',record_status:'estimated',confidence:0.52},
    {name:'抹茶冰沙',category:'smoothie',record_status:'estimated',confidence:0.49},
    {name:'可可碎片冰沙',category:'smoothie',record_status:'estimated',confidence:0.47}
  ]);
  const BEVERAGE_CATALOG = [...brandASkus, ...brandBSkus, ...brandCSkus];

  // ========== 08引擎演示目录（证据门控计算用） ==========
  const ENGINE_CATALOG = {
    catalog_id: 'engine_demo_catalog',
    catalog_version: '2026.09-demo.1',
    catalog_mode: 'synthetic_demo',
    sources: [
      { source_id: 'demo_merchant_recipe_v1', publisher: '演示茶铺（虚构）', source_type: 'merchant_recipe', evidence_grade: 'merchant_confirmed', review_status: 'accepted' },
      { source_id: 'demo_generic_estimate_v1', publisher: '通用营养估算', source_type: 'generic_estimate', evidence_grade: 'estimated', review_status: 'accepted' }
    ],
    records: [
      {
        brand_id: 'demo_tea', brand_name: '演示茶铺', sku_id: 'demo_jasmine_milk_tea', display_name: '演示茉莉鲜奶茶',
        category: 'milk_tea', record_status: 'merchant_confirmed', source_ids: ['demo_merchant_recipe_v1'],
        base_beverages: [{
          component_id: 'jasmine_medium_base', cup_size_id: 'medium', cup_size_label: '中杯', volume_ml: 500,
          ice_level_id: 'normal_ice', sugar_level_id: 'full_sugar',
          nutrition: {
            basis: { type: 'per_100_ml', quantity: 100, unit: 'ml', description: '中杯500mL正常冰全糖，每100mL' },
            value_type: 'merchant_confirmed', confidence: 0.92, source_ids: ['demo_merchant_recipe_v1'],
            nutrients: {
              kcal: { value: 40, interval: { min: 35, max: 45 } },
              protein_g: { value: 0.6, interval: { min: 0.6, max: 0.6 } },
              fat_g: { value: 0.5, interval: { min: 0.5, max: 0.5 } },
              carbohydrate_g: { value: 7.5, interval: { min: 7.5, max: 7.5 } },
              sugar_g: { value: 6.5, interval: { min: 6.5, max: 6.5 } },
              sodium_mg: { value: 20, interval: { min: 20, max: 20 } }
            }
          }
        }],
        sugar_deltas: [{
          component_id: 'jasmine_full_to_half', from_sugar_level_id: 'full_sugar', to_sugar_level_id: 'half_sugar',
          cup_size_id: 'medium', ice_level_id: 'normal_ice',
          nutrition: {
            basis: { type: 'per_100_ml', quantity: 100, unit: 'ml', description: '全糖→半糖差值，每100mL' },
            value_type: 'merchant_confirmed', confidence: 0.88, source_ids: ['demo_merchant_recipe_v1'],
            nutrients: {
              kcal: { value: -12, interval: { min: -14, max: -10 } },
              sugar_g: { value: -3.2, interval: { min: -3.5, max: -2.9 } },
              carbohydrate_g: { value: -3.2, interval: { min: -3.5, max: -2.9 } }
            }
          }
        }],
        toppings: [{
          topping_id: 'pearl', label: '珍珠',
          nutrition: {
            basis: { type: 'per_serving', quantity: 1, unit: '份', description: '标准份珍珠约30g' },
            value_type: 'merchant_confirmed', confidence: 0.85, source_ids: ['demo_merchant_recipe_v1'],
            nutrients: {
              kcal: { value: 95, interval: { min: 85, max: 105 } },
              carbohydrate_g: { value: 23, interval: { min: 21, max: 25 } },
              sugar_g: { value: 8, interval: { min: 7, max: 9 } }
            }
          }
        }]
      },
      {
        brand_id: 'demo_tea', brand_name: '演示茶铺', sku_id: 'demo_berry_tea', display_name: '演示莓果茶',
        category: 'fruit_tea', record_status: 'estimated', source_ids: ['demo_generic_estimate_v1'],
        base_beverages: [{
          component_id: 'berry_large_base', cup_size_id: 'large', cup_size_label: '大杯', volume_ml: 650,
          ice_level_id: 'less_ice', sugar_level_id: 'half_sugar',
          nutrition: {
            basis: { type: 'per_100_ml', quantity: 100, unit: 'ml', description: '大杯650mL少冰半糖，每100mL估算' },
            value_type: 'estimated', confidence: 0.65, source_ids: ['demo_generic_estimate_v1'],
            nutrients: {
              kcal: { value: null, interval: { min: 22, max: 32 } },
              carbohydrate_g: { value: null, interval: { min: 5, max: 8 } },
              sugar_g: { value: null, interval: { min: 4, max: 7 } },
              vitamin_c_mg: { value: null, interval: { min: 15, max: 30 } }
            }
          }
        }],
        sugar_deltas: [],
        toppings: []
      }
    ]
  };

  // ========== Demo 餐食案例 ==========
  const MEAL_DEMO_CASES = [
    { case_id:'demo_meal_001', name:'黄焖鸡米饭（Demo案例）', image_placeholder:'🍗',
      items:[
        {id:'m1',name:'黄焖鸡',category:'meat',estimated_weight_g:180,confidence:0.82,calories_kcal:{value:null,interval:{min:280,max:360}},protein_g:{value:28,interval:{min:24,max:32}},fat_g:{value:14,interval:{min:10,max:18}},carbs_g:{value:8,interval:{min:5,max:12}},sugar_g:{value:3,interval:{min:2,max:5}},sodium_mg:{value:null,interval:{min:400,max:600}},value_type:'estimated',source_ids:['seed_002'],warnings:['份量为视觉估算，实际可能偏差±20%']},
        {id:'m2',name:'米饭',category:'staple',estimated_weight_g:250,confidence:0.90,calories_kcal:{value:null,interval:{min:290,max:330}},protein_g:{value:6,interval:{min:5,max:7}},fat_g:{value:1,interval:{min:0,max:2}},carbs_g:{value:65,interval:{min:60,max:70}},sugar_g:{value:0,interval:{min:0,max:1}},sodium_mg:{value:5,interval:{min:3,max:8}},value_type:'estimated',source_ids:['seed_002'],warnings:[]},
        {id:'m3',name:'青椒',category:'vegetable',estimated_weight_g:60,confidence:0.75,calories_kcal:{value:null,interval:{min:12,max:20}},protein_g:{value:1,interval:{min:0,max:1}},fat_g:{value:0,interval:{min:0,max:1}},carbs_g:{value:3,interval:{min:2,max:4}},sugar_g:{value:2,interval:{min:1,max:3}},sodium_mg:{value:null,interval:{min:5,max:15}},value_type:'estimated',source_ids:['seed_002'],warnings:[]}
      ]},
    { case_id:'demo_meal_002', name:'兰州拉面（Demo案例）', image_placeholder:'🍜',
      items:[
        {id:'m1',name:'拉面',category:'staple',estimated_weight_g:300,confidence:0.85,calories_kcal:{value:null,interval:{min:420,max:520}},protein_g:{value:14,interval:{min:11,max:17}},fat_g:{value:10,interval:{min:7,max:13}},carbs_g:{value:75,interval:{min:68,max:82}},sugar_g:{value:2,interval:{min:1,max:4}},sodium_mg:{value:null,interval:{min:800,max:1200}},value_type:'estimated',source_ids:['seed_002'],warnings:['汤面实际摄入量受剩余汤汁影响','钠含量较高']},
        {id:'m2',name:'牛肉',category:'meat',estimated_weight_g:50,confidence:0.70,calories_kcal:{value:null,interval:{min:80,max:120}},protein_g:{value:14,interval:{min:11,max:17}},fat_g:{value:4,interval:{min:2,max:6}},carbs_g:{value:0,interval:{min:0,max:1}},sugar_g:{value:0,interval:{min:0,max:1}},sodium_mg:{value:null,interval:{min:30,max:60}},value_type:'estimated',source_ids:['seed_002'],warnings:['肉片数量和厚度不确定']},
        {id:'m3',name:'萝卜/香菜',category:'vegetable',estimated_weight_g:30,confidence:0.60,calories_kcal:{value:null,interval:{min:5,max:12}},protein_g:{value:0,interval:{min:0,max:1}},fat_g:{value:0,interval:{min:0,max:1}},carbs_g:{value:2,interval:{min:1,max:3}},sugar_g:{value:1,interval:{min:0,max:2}},sodium_mg:{value:null,interval:{min:10,max:25}},value_type:'estimated',source_ids:['seed_002'],warnings:['配菜识别置信度较低']}
      ]},
    { case_id:'demo_meal_003', name:'轻食沙拉（Demo案例）', image_placeholder:'🥗',
      items:[
        {id:'m1',name:'鸡胸肉',category:'meat',estimated_weight_g:120,confidence:0.88,calories_kcal:{value:null,interval:{min:150,max:190}},protein_g:{value:32,interval:{min:28,max:36}},fat_g:{value:3,interval:{min:2,max:5}},carbs_g:{value:0,interval:{min:0,max:1}},sugar_g:{value:0,interval:{min:0,max:1}},sodium_mg:{value:null,interval:{min:60,max:100}},value_type:'estimated',source_ids:['seed_002'],warnings:[]},
        {id:'m2',name:'混合生菜',category:'vegetable',estimated_weight_g:150,confidence:0.80,calories_kcal:{value:null,interval:{min:20,max:35}},protein_g:{value:2,interval:{min:1,max:3}},fat_g:{value:0,interval:{min:0,max:1}},carbs_g:{value:4,interval:{min:3,max:5}},sugar_g:{value:2,interval:{min:1,max:3}},sodium_mg:{value:null,interval:{min:20,max:40}},value_type:'estimated',source_ids:['seed_002'],warnings:[]},
        {id:'m3',name:'圣女果',category:'vegetable',estimated_weight_g:60,confidence:0.82,calories_kcal:{value:null,interval:{min:10,max:18}},protein_g:{value:1,interval:{min:0,max:1}},fat_g:{value:0,interval:{min:0,max:1}},carbs_g:{value:3,interval:{min:2,max:4}},sugar_g:{value:2,interval:{min:1,max:3}},sodium_mg:{value:null,interval:{min:3,max:8}},value_type:'estimated',source_ids:['seed_002'],warnings:[]},
        {id:'m4',name:'沙拉酱',category:'condiment',estimated_weight_g:30,confidence:0.55,calories_kcal:{value:null,interval:{min:100,max:180}},protein_g:{value:0,interval:{min:0,max:1}},fat_g:{value:10,interval:{min:7,max:15}},carbs_g:{value:4,interval:{min:2,max:6}},sugar_g:{value:3,interval:{min:2,max:5}},sodium_mg:{value:null,interval:{min:100,max:200}},value_type:'estimated',source_ids:['seed_002'],warnings:['酱料种类和用量识别置信度低，区间较宽']}
      ]}
  ];

  // ========== 三餐分布历史记录（mock，近7天） ==========
  function generateHistoryRecords() {
    const records = [];
    const now = new Date();
    const mealTemplates = [
      { period:'breakfast', label:'早餐', items:[
        {name:'豆浆+包子', kcal:{min:280,max:350}, protein:{min:10,max:14}, fat:{min:6,max:10}, carbs:{min:42,max:52}, sugar:{min:8,max:12}, sodium:{min:300,max:500} },
      ]},
      { period:'lunch', label:'午餐', items:[
        {name:'黄焖鸡米饭', kcal:{min:580,max:710}, protein:{min:35,max:42}, fat:{min:15,max:22}, carbs:{min:76,max:88}, sugar:{min:5,max:9}, sodium:{min:800,max:1200} },
      ]},
      { period:'dinner', label:'晚餐', items:[
        {name:'兰州拉面', kcal:{min:500,max:650}, protein:{min:14,max:20}, fat:{min:10,max:16}, carbs:{min:77,max:88}, sugar:{min:2,max:5}, sodium:{min:900,max:1400} },
      ]},
      { period:'snack', label:'加餐', items:[
        {name:'茉莉奶绿（半糖）', kcal:{min:150,max:210}, protein:{min:2,max:4}, fat:{min:3,max:6}, carbs:{min:28,max:38}, sugar:{min:18,max:26}, sodium:{min:15,max:35}, isBeverage:true },
      ]}
    ];
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().slice(0,10);
      // 每天随机2-4餐
      const mealCount = 2 + Math.floor(Math.random() * 3);
      const selectedPeriods = ['breakfast','lunch','dinner'].slice(0, mealCount);
      if (Math.random() > 0.5) selectedPeriods.push('snack');
      selectedPeriods.forEach((period, pi) => {
        const tmpl = mealTemplates.find(m => m.period === period) || mealTemplates[0];
        const item = tmpl.items[0];
        records.push({
          id: `hist_${dateStr}_${period}_${pi}`,
          source_type: item.isBeverage ? 'beverage' : 'meal_photo',
          raw_text: null, original_asset_ref: null,
          merchant_label: item.name, meal_period: period,
          items: [{
            id: `hi_${dateStr}_${pi}`, name: item.name,
            category: item.isBeverage ? 'beverage' : 'meal',
            estimated_weight_g: null, consumed_ratio: 1,
            calories_kcal: { value:null, interval:{min:item.kcal.min,max:item.kcal.max}, value_type:'estimated' },
            protein_g: { value:null, interval:{min:item.protein.min,max:item.protein.max}, value_type:'estimated' },
            fat_g: { value:null, interval:{min:item.fat.min,max:item.fat.max}, value_type:'estimated' },
            carbs_g: { value:null, interval:{min:item.carbs.min,max:item.carbs.max}, value_type:'estimated' },
            sugar_g: { value:null, interval:{min:item.sugar.min,max:item.sugar.max}, value_type:'estimated' },
            sodium_mg: { value:null, interval:{min:item.sodium.min,max:item.sodium.max}, value_type:'estimated' },
            confidence: 0.55 + Math.random()*0.3,
            source_ids: ['seed_002'], value_type:'estimated',
            interval: {min:item.kcal.min,max:item.kcal.max}, warnings: ['演示数据，非真实记录']
          }],
          status: 'confirmed',
          created_at: `${dateStr}T${8+pi*4}:00:00.000Z`,
          updated_at: `${dateStr}T${8+pi*4}:00:00.000Z`
        });
      });
    }
    return records;
  }
  const HISTORY_RECORDS = generateHistoryRecords();

  // ========== 协同事件（用户→商家→营养师闭环） ==========
  const COLLABORATION_EVENTS = [
    { id:'ce_001', type:'merchant_update', title:'清叶茶铺更新了「珍珠奶茶」营养资料', desc:'商家补充了中杯/大杯的糖度差值数据，置信度从58%提升到72%', time:'2026-08-30 14:20', actor:'商家', actor_name:'清叶茶铺（虚构）', related_record:'hist_xxx_lunch_0', status:'resolved' },
    { id:'ce_002', type:'nutritionist_reply', title:'营养师回复了你的复核请求', desc:'建议：今日糖摄入偏高，下次饮品可选三分糖或无糖', time:'2026-08-30 10:15', actor:'营养师', actor_name:'营养师（演示）', related_record:null, status:'resolved' },
    { id:'ce_003', type:'supplement_invite', title:'「多肉葡萄」营养信息待补充', desc:'该SKU来源不足，已向商家发出补充邀请（脱敏）', time:'2026-08-29 16:40', actor:'系统', actor_name:'营养智链', related_record:null, status:'pending' },
    { id:'ce_004', type:'merchant_update', title:'云雾制茶更新了「芝士奶盖绿茶」', desc:'商家仅提供营养区间，不公开克数（敏感配方保护）', time:'2026-08-28 11:00', actor:'商家', actor_name:'云雾制茶（虚构）', related_record:null, status:'resolved' },
    { id:'ce_005', type:'community_share', title:'你的记录被分享到社区', desc:'「半糖奶茶实测」帖子获得3条评论，含商家和营养师回复', time:'2026-08-27 20:30', actor:'用户', actor_name:'我（演示）', related_record:null, status:'resolved' }
  ];

  // ========== 创新社区帖子（记录即帖子） ==========
  const COMMUNITY_POSTS = [
    {
      id:'post_001', author_role:'user', author_name:'小柚同学', verification_badge:null,
      topic_tags:['奶茶糖度实测','外卖减脂搭配'], title:'半糖奶茶真的比全糖少一半糖吗？实测记录',
      body:'今天点了清叶茶铺的茉莉奶绿，选了半糖。用营养智链记录后发现，半糖不是糖量减半，而是糖度等级。全糖基准约28g糖，半糖约20g，只少了约8g。分享给大家参考～',
      record_snapshot: { name:'清叶茶铺 茉莉奶绿（中杯/半糖/少冰）', kcal_interval:{min:150,max:210}, sugar_g:{min:18,max:26}, protein_g:{min:2,max:4}, confidence:0.77, source:'商家公开营养表+本地规则估算', uncertainty:'估算区间，非精确测量' },
      linked_record_ref:'hist_xxx_snack_0', moderation_status:'已发布', reports:[],
      comments:[
        {id:'c1',author:'茶底研究员',role:'nutritionist',qualification:'待配置',text:'确实如此，"半糖"通常指糖度等级而非精确50%糖量。不同品牌全糖基准不同，建议以品牌公开营养信息为准。以上为日常营养管理参考，非医疗建议。',time:'2小时前'},
        {id:'c2',author:'清叶茶铺（虚构）',role:'merchant',verified:true,text:'我们品牌的半糖是全糖的约60%糖量，具体可以参考门店营养信息卡。感谢用户的实测分享！',time:'1小时前'},
        {id:'c3',author:'健康记录者',role:'user',text:'原来如此！我一直以为半糖就是一半糖，学到了。',time:'30分钟前'}
      ],
      likes:42, collected:15, created_at:'2026-08-30 15:30', updated_at:'2026-08-30 17:00',
      info_updated:false
    },
    {
      id:'post_002', author_role:'merchant', author_name:'云雾制茶（虚构）', verification_badge:'商家认证（演示）',
      topic_tags:['商家营养透明化','配方说明'], title:'关于芝士奶盖系列营养信息的说明',
      body:'近期收到用户关于奶盖热量的疑问。我们的芝士奶盖使用淡奶油和芝士粉，每份约30g。由于配方涉及商业敏感信息，我们只提供营养区间而非精确克数。如有疑问可以在本帖下留言，我们会统一回复。',
      record_snapshot: null,
      linked_record_ref:null, moderation_status:'已发布', reports:[],
      comments:[
        {id:'c1',author:'营养师（演示）',role:'nutritionist',qualification:'待配置',text:'区间信息也很有价值。建议在菜单上标注"每杯约X-Y kcal"，帮助用户做选择。',time:'3小时前'},
        {id:'c2',author:'外卖常客',role:'user',text:'区间也可以，至少知道大概范围。希望能标注中杯还是大杯。',time:'2小时前'}
      ],
      likes:68, collected:34, created_at:'2026-08-29 10:00', updated_at:'2026-08-29 18:00',
      info_updated:false
    },
    {
      id:'post_003', author_role:'user', author_name:'外卖常客', verification_badge:null,
      topic_tags:['高蛋白外卖','外卖减脂搭配'], title:'工作日午餐怎么搭配蛋白质比较够？一周记录',
      body:'记录了一周午餐，发现平均蛋白质只有目标的70%。除了鸡胸肉沙拉，番茄牛腩、卤味双拼（去皮）、豆腐类菜品蛋白质也不错。分享我的搭配经验～',
      record_snapshot: { name:'一周午餐平均', kcal_interval:{min:550,max:680}, protein_g:{min:22,max:32}, sugar_g:{min:5,max:10}, confidence:0.65, source:'用户记录聚合（演示）', uncertainty:'多日平均值' },
      linked_record_ref:null, moderation_status:'已发布', reports:[],
      comments:[
        {id:'c1',author:'营养师（演示）',role:'nutritionist',qualification:'待配置',text:'蛋白质目标可以按每公斤体重1.2-1.6g估算。番茄牛腩和豆腐都是好选择。以上为日常营养管理参考，非医疗建议。',time:'5小时前'},
        {id:'c2',author:'蛋白达人',role:'user',text:'卤味双拼去皮确实不错，我也经常点。',time:'4小时前'}
      ],
      likes:56, collected:28, created_at:'2026-08-28 12:15', updated_at:'2026-08-28 20:00',
      info_updated:false
    },
    {
      id:'post_004', author_role:'user', author_name:'果茶爱好者', verification_badge:null,
      topic_tags:['奶茶糖度实测','小料热量'], title:'珍珠和椰果哪个热量更低？实测对比',
      body:'分别点了珍珠奶茶和椰果奶茶（同品牌同杯型同糖度），记录后发现珍珠约55-65kcal/份，椰果约35-45kcal/份。想控制热量的话选椰果！',
      record_snapshot: { name:'珍珠 vs 椰果（中杯全糖对比）', kcal_interval:{min:230,max:310}, sugar_g:{min:24,max:34}, confidence:0.58, source:'通用成分估算（演示）', uncertainty:'小料份量因门店而异' },
      linked_record_ref:null, moderation_status:'待审核', reports:[],
      comments:[
        {id:'c1',author:'清叶茶铺（虚构）',role:'merchant',verified:true,text:'我们门店的珍珠标准份约60kcal，椰果约40kcal，与你的实测接近。',time:'1小时前'}
      ],
      likes:18, collected:7, created_at:'2026-08-31 09:00', updated_at:'2026-08-31 10:30',
      info_updated:false
    },
    {
      id:'post_005', author_role:'user', author_name:'糖控小分队', verification_badge:null,
      topic_tags:['营养师答疑','奶茶糖度实测'], title:'【信息已更新】多肉葡萄的糖含量原来是这样',
      body:'之前记录多肉葡萄时显示"来源不足"，后来商家补充了营养资料。更新后：大杯七分糖约160-205kcal，糖约29-41g。旧值估算偏高，已修正。',
      record_snapshot: { name:'果研所 多肉葡萄（大杯/七分糖）', kcal_interval:{min:160,max:205}, sugar_g:{min:29,max:41}, confidence:0.62, source:'商家补充资料（2026-08-30更新）', uncertainty:'估算区间' },
      old_snapshot: { kcal_interval:{min:200,max:280}, sugar_g:{min:35,max:50}, note:'旧值：来源不足时的估算' },
      linked_record_ref:null, moderation_status:'已发布', reports:[],
      comments:[
        {id:'c1',author:'果研所（虚构）',role:'merchant',verified:true,text:'感谢反馈，我们已更新该SKU的营养资料。',time:'昨天'},
        {id:'c2',author:'营养师（演示）',role:'nutritionist',qualification:'待配置',text:'商家更新后数据更准确了。七分糖果茶糖含量仍较高，注意控制频率。非医疗建议。',time:'昨天'}
      ],
      likes:35, collected:20, created_at:'2026-08-30 20:00', updated_at:'2026-08-31 08:00',
      info_updated:true
    },
    {
      id:'post_006', author_role:'user', author_name:'匿名用户', verification_badge:null,
      topic_tags:['违规内容'], title:'【已隐藏】七天瘦十斤的秘密方法！',
      body:'（内容已被审核隐藏：涉及减重疗效承诺，违反社区规则。健康管理应循序渐进，不提倡极端节食。）',
      record_snapshot: null, linked_record_ref:null, moderation_status:'已隐藏',
      reports:[{reason:'减重疗效承诺',count:5}], comments:[],
      likes:0, collected:0, created_at:'2026-08-25 22:00', updated_at:'2026-08-26 08:00',
      info_updated:false
    }
  ];

  // ========== 商家 SKU 演示数据 ==========
  const MERCHANT_SKUS = [
    { sku_id:'msku_001', brand_name:'清叶茶铺（虚构）', product_name:'茉莉奶绿', category:'奶茶', cup_size:'中杯500ml', default_sugar:'全糖', kcal:220, protein:3, fat:5, carbs:38, sugar:28, sodium:null, record_status:'已验证', value_type:'merchant_confirmed', confidence:0.82, source_id:'seed_001', version:'v1.2', effective_from:'2026-08-01', submitted_by:'演示商家账号', reviewed_by:'待复核', change_reason:'初始录入', supplement_requests:0, nutritionist_suggestions:1 },
    { sku_id:'msku_002', brand_name:'清叶茶铺（虚构）', product_name:'珍珠奶茶', category:'奶茶', cup_size:'大杯650ml', default_sugar:'全糖', kcal:null, protein:null, fat:null, carbs:null, sugar:null, sodium:null, record_status:'待审核', value_type:'estimated', confidence:0.58, source_id:'seed_002', version:'v0.9', effective_from:'2026-08-15', submitted_by:'演示商家账号', reviewed_by:'未分配', change_reason:'新提交，待复核', supplement_requests:3, nutritionist_suggestions:2 },
    { sku_id:'msku_003', brand_name:'云雾制茶（虚构）', product_name:'芝士奶盖绿茶', category:'奶盖茶', cup_size:'中杯500ml', default_sugar:'半糖', kcal:null, protein:null, fat:null, carbs:null, sugar:null, sodium:null, record_status:'部分披露', value_type:'estimated', confidence:0.52, source_id:'seed_005', version:'v1.0', effective_from:'2026-07-20', submitted_by:'演示商家账号', reviewed_by:'复核中', change_reason:'商家仅提供区间', supplement_requests:2, nutritionist_suggestions:1 },
    { sku_id:'msku_004', brand_name:'果研所（虚构）', product_name:'满杯红柚', category:'果茶', cup_size:'大杯650ml', default_sugar:'七分糖', kcal:180, protein:1, fat:0, carbs:45, sugar:38, sodium:10, record_status:'已验证', value_type:'merchant_confirmed', confidence:0.80, source_id:'seed_001', version:'v2.0', effective_from:'2026-08-10', submitted_by:'演示商家账号', reviewed_by:'已复核', change_reason:'配方更新', supplement_requests:0, nutritionist_suggestions:0 },
    { sku_id:'msku_005', brand_name:'清叶茶铺（虚构）', product_name:'四季春茶', category:'纯茶', cup_size:'中杯500ml', default_sugar:'无糖', kcal:5, protein:0, fat:0, carbs:1, sugar:0, sodium:3, record_status:'已验证', value_type:'merchant_confirmed', confidence:0.88, source_id:'seed_001', version:'v1.0', effective_from:'2026-06-01', submitted_by:'演示商家账号', reviewed_by:'已复核', change_reason:'初始录入', supplement_requests:0, nutritionist_suggestions:0 },
    { sku_id:'msku_006', brand_name:'果研所（虚构）', product_name:'多肉葡萄', category:'果茶', cup_size:'中杯500ml', default_sugar:'半糖', kcal:null, protein:null, fat:null, carbs:null, sugar:null, sodium:null, record_status:'估算', value_type:'estimated', confidence:0.50, source_id:'seed_002', version:'v0.8', effective_from:'2026-08-20', submitted_by:'演示商家账号', reviewed_by:'待复核', change_reason:'来源不足，待商家补充', supplement_requests:5, nutritionist_suggestions:3 },
    { sku_id:'msku_007', brand_name:'果研所（虚构）', product_name:'多肉葡萄（已更新）', category:'果茶', cup_size:'大杯650ml', default_sugar:'七分糖', kcal:180, protein:1, fat:0, carbs:46, sugar:35, sodium:null, record_status:'已验证', value_type:'merchant_confirmed', confidence:0.62, source_id:'seed_001', version:'v1.0', effective_from:'2026-08-30', submitted_by:'演示商家账号', reviewed_by:'已复核', change_reason:'商家补充资料', supplement_requests:0, nutritionist_suggestions:1 },
    { sku_id:'msku_008', brand_name:'清叶茶铺（虚构）', product_name:'美式咖啡', category:'咖啡', cup_size:'中杯350ml', default_sugar:'无糖', kcal:10, protein:1, fat:0, carbs:2, sugar:0, sodium:5, record_status:'已验证', value_type:'merchant_confirmed', confidence:0.90, source_id:'seed_001', version:'v1.1', effective_from:'2026-07-01', submitted_by:'演示商家账号', reviewed_by:'已复核', change_reason:'容量标注修正', supplement_requests:0, nutritionist_suggestions:0 }
  ];

  // 商家聚合反馈
  const MERCHANT_FEEDBACK = {
    total_feedback: 128, understanding_rate: 0.42, confusion_rate: 0.31, pending_review: 7,
    top_questions: [
      { question:'糖度差值是如何计算的？', count:23 },
      { question:'小料的热量为什么是区间？', count:18 },
      { question:'中杯和大杯的换算依据？', count:15 },
      { question:'为什么有些SKU显示"未知"？', count:12 }
    ],
    user_supplement_requests: [
      { sku:'珍珠奶茶（清叶茶铺）', count:3, reason:'用户反馈大杯热量缺失' },
      { sku:'多肉葡萄（果研所）', count:5, reason:'来源不足，用户希望商家补充' },
      { sku:'芝士奶盖绿茶（云雾制茶）', count:2, reason:'用户希望区分中杯/大杯' }
    ],
    nutritionist_suggestions: [
      { sku:'珍珠奶茶（清叶茶铺）', suggestion:'建议标注糖含量，用户关注度高', count:2 },
      { sku:'多肉葡萄（果研所）', suggestion:'建议区分杯型，当前仅大杯数据', count:3 },
      { sku:'芝士奶盖绿茶（云雾制茶）', suggestion:'建议标注奶盖份量，区间可更精确', count:1 }
    ],
    note:'以上为固定演示数据，不代表真实用户反馈或经营统计。'
  };

  // ========== 营养师建议模板库 ==========
  const NUTRITIONIST_TEMPLATES = [
    { id:'tpl_001', title:'糖摄入偏高', content:'今日糖摄入偏高，建议下次饮品选择三分糖或无糖，用天然食材替代添加糖。日常游离糖摄入建议不超过总能量10%。以上为日常营养管理参考，非医疗建议。' },
    { id:'tpl_002', title:'蛋白质不足', content:'今日蛋白质摄入未达标，建议下一餐增加优质蛋白，如鸡胸肉、鸡蛋、豆腐、鱼类。蛋白质目标可按每公斤体重1.2-1.6g估算。非医疗建议。' },
    { id:'tpl_003', title:'热量偏低', content:'今日热量摄入偏低，可能影响代谢和饱腹感。建议适当增加主食或健康脂肪，避免过度节食。非医疗建议。' },
    { id:'tpl_004', title:'钠摄入偏高', content:'今日钠摄入偏高，外卖菜品通常含盐较多。建议选择清淡口味，多喝水，长期高钠摄入可能影响血压。非医疗建议。' },
    { id:'tpl_005', title:'饮品频率建议', content:'本周含糖饮品摄入X次，建议控制在每周2-3次以内，可选择无糖茶或黑咖啡替代。非医疗建议。' },
    { id:'tpl_006', title:'三餐均衡提醒', content:'今日早餐营养较为单一，建议增加蛋白质和蔬菜摄入，早餐质量影响全天代谢。非医疗建议。' }
  ];

  // ========== 营养师演示队列 ==========
  const NUTRITIONIST_QUEUE = [
    {
      consent_id:'consent_001', subject_id:'demo_user_001', viewer_role:'nutritionist',
      scope:['nutrition_summary','trends','config_changes','user_notes'],
      status:'active', granted_at:'2026-08-25', expires_at:'2026-09-25', revoked_at:null,
      audit_events:[
        {time:'2026-08-25 10:00',action:'用户授权',detail:'授权范围：营养摘要/趋势/配置变更/备注'},
        {time:'2026-08-26 14:30',action:'营养师查看',detail:'查看近7天营养摘要'},
        {time:'2026-08-28 09:15',action:'营养师添加备注',detail:'建议增加早餐蛋白质摄入'}
      ],
      summary:{ records_7d:12, avg_kcal:1650, avg_protein_g:52, avg_sugar_g:48, pending_items:['8月27日饮品配置未确认糖度','8月29日餐食识别低置信'], notes:'用户整体热量摄入偏低，蛋白质未达标，糖摄入接近上限。' },
      review_status:'pending'
    },
    {
      consent_id:'consent_002', subject_id:'demo_user_002', viewer_role:'nutritionist',
      scope:['nutrition_summary','trends'], status:'expired',
      granted_at:'2026-07-01', expires_at:'2026-08-01', revoked_at:null,
      audit_events:[{time:'2026-07-01 09:00',action:'用户授权',detail:'授权范围：营养摘要/趋势，期限1个月'},{time:'2026-08-01 00:00',action:'系统到期',detail:'授权已过期'}],
      summary:null, review_status:'no_permission'
    }
  ];

  // ========== 项目展示数据 ==========
  const PROJECT_INFO = {
    competition:'安徽省大学生创新大赛产业赛道企业命题组',
    proposition:'AI 赋能外卖场景个性化营养健康管理',
    paper_status:'已投稿、返修中',
    campus_showcase:{ event:'2026年安大文化节校园公开原型展示', date:'2026-05', note:'校园展示过程记录，不等同于商家试点或客户案例。' },
    requirement_validation:'15份安大磬苑周边商家匿名半结构化访谈（需求验证用途，不代表合作/签约/试点）',
    knowledge_base:{ source_seeds:6, source_seeds_note:'6条来源型种子记录', fictional_candidates:45, fictional_candidates_note:'45条虚构交互候选（3品牌×15 SKU）', mvp_plan:'3品牌×15-20 SKU 为校赛后MVP规划' },
    beverage_engine:{ status:'08饮品引擎已提供独立契约/adapter/fixture，尚未接入主页面', current:'主页面使用本地规则Demo计算', contract_location:'G:\\国创赛\\workstreams\\08_beverage_engine\\contracts\\' },
    ip_opensource:{ paper:'已投稿、返修中（凭据待团队确认）', ip:'拟申请软件著作权（未授权）', opensource:'部分工具脚本计划开源，许可证待确定' }
  };

  // ========== 用户画像 ==========
  const DEFAULT_PROFILE = {
    id:'demo_user_001', age:21, sex:'female', height_cm:165, weight_kg:55,
    activity_level:'light', goal:'maintain', preferences:['少糖','高蛋白'], avoid_ingredients:['香菜'],
    daily_target:{ kcal:1800, protein_g:70, fat_g:60, carbs_g:220, sugar_g:50 },
    consent_status:'not_granted', consent_expires_at:null, updated_at:'2026-09-01'
  };

  // ========== 热门话题 ==========
  const HOT_TOPICS = ['奶茶糖度实测','外卖减脂搭配','商家营养透明化','营养师答疑','高蛋白外卖','小料热量对比','无糖饮品推荐','外卖钠含量'];

  // ========== 活跃商家/营养师 ==========
  const ACTIVE_MERCHANTS = [
    { name:'清叶茶铺（虚构）', verified:true, sku_count:15, response_rate:'85%' },
    { name:'云雾制茶（虚构）', verified:true, sku_count:15, response_rate:'70%' },
    { name:'果研所（虚构）', verified:true, sku_count:15, response_rate:'60%' }
  ];
  const ACTIVE_NUTRITIONISTS = [
    { name:'营养师（演示）', qualification:'待配置', response_count:12 },
    { name:'营养顾问A（演示）', qualification:'待配置', response_count:8 }
  ];

  return {
    SOURCE_SEEDS, BEVERAGE_BRANDS, BEVERAGE_CATALOG, ENGINE_CATALOG, MEAL_DEMO_CASES,
    HISTORY_RECORDS, COLLABORATION_EVENTS, COMMUNITY_POSTS,
    MERCHANT_SKUS, MERCHANT_FEEDBACK, NUTRITIONIST_TEMPLATES, NUTRITIONIST_QUEUE,
    PROJECT_INFO, DEFAULT_PROFILE, HOT_TOPICS, ACTIVE_MERCHANTS, ACTIVE_NUTRITIONISTS
  };
})();
