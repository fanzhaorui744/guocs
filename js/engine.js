/* ============================================================
   饮品计算引擎（前端本地规则 Demo）
   - 复刻 08 饮品引擎契约结构的前端实现
   - 标注：本地规则Demo/契约待接入，08引擎未接入主页面
   - 不把单张照片转kcal，必须经过配置确认
   - null/未知不转0，区间结果value=null
   ============================================================ */

const BeverageEngine = (() => {

  const ENGINE_INFO = {
    name: '本地规则Demo引擎',
    version: '0.1.0-demo',
    contract_version: '1.0.0',
    status: '本地规则Demo/契约待接入',
    note: '08饮品引擎（G:\\国创赛\\workstreams\\08_beverage_engine）尚未接入主页面，此处为前端本地规则计算，仅用于演示流程。',
    catalog_id: 'fictional_demo_catalog',
    catalog_version: '2026.09-demo.1',
    effective_from: '2026-09-01',
    effective_to: null
  };

  /**
   * 文本匹配候选（模拟OCR/文本匹配，未接入真实OCR）
   * @param {string} text - 订单文本
   * @returns {Array} 候选列表
   */
  function matchCandidates(text) {
    if (!text || !text.trim()) return [];
    const lower = text.toLowerCase();
    const candidates = [];
    for (const sku of NPV2_DATA.BEVERAGE_CATALOG) {
      let score = 0;
      const searchFields = [sku.display_name, sku.brand_name, ...(sku.aliases || [])];
      for (const field of searchFields) {
        if (lower.includes(field.toLowerCase())) {
          score += 0.4;
          if (field === sku.display_name) score += 0.3;
        }
      }
      // 品牌名匹配加分
      if (lower.includes(sku.brand_name.toLowerCase())) score += 0.2;
      if (score > 0) {
        candidates.push({
          brand_id: sku.brand_id,
          brand_name: sku.brand_name,
          sku_id: sku.sku_id,
          display_name: sku.display_name,
          score: Math.min(score, 0.99),
          match_source: '本地文本关键词匹配（OCR未接入，原型模拟）',
          record_status: sku.record_status,
          available_configuration: sku.available_configuration
        });
      }
    }
    return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
  }

  /**
   * 检查配置是否完整确认
   * @param {Object} config - BeverageConfig
   * @returns {Object} {complete, missing[]}
   */
  function validateConfig(config) {
    const missing = [];
    if (!config.brand_id || !config.confirmations?.brand) missing.push('品牌');
    if (!config.sku_id || !config.confirmations?.sku) missing.push('SKU/产品');
    if (!config.cup_size_id || !config.confirmations?.cup_size) missing.push('杯型/容量');
    if (!config.sugar_level_id || !config.confirmations?.sugar_level) missing.push('糖度');
    if (!config.ice_level_id || !config.confirmations?.ice_level) missing.push('冰量');
    // 小料允许为空（不加小料），但如果选择了必须确认
    if (config.toppings && config.toppings.length > 0 && !config.confirmations?.toppings) {
      missing.push('小料');
    }
    return { complete: missing.length === 0, missing };
  }

  /**
   * 检查是否满足透明杯比例辅助输入条件
   * 必须同时满足：透明 + 未封口 + 液面可见 + 可靠初始容量
   */
  function canUseConsumedRatio(config) {
    return config.cup_state === 'transparent_open'
      && config.volume_ml > 0
      && config.consumed_ratio_source === 'user_estimate';
  }

  /**
   * 计算营养估算
   * @param {Object} config - BeverageConfig（必须完整确认）
   * @returns {Object} NutritionEstimate
   */
  function estimate(config) {
    const validation = validateConfig(config);
    if (!validation.complete) {
      return {
        display_mode: 'unknown',
        display_text: '配置未确认，无法计算',
        confidence: 0,
        nutrients: makeUnknownNutrients(),
        serving_basis: null,
        components: [],
        sources: [],
        warnings: [`以下字段未确认：${validation.missing.join('、')}。请完成配置后再计算。`],
        catalog_id: ENGINE_INFO.catalog_id,
        catalog_version: ENGINE_INFO.catalog_version,
        effective_from: ENGINE_INFO.effective_from,
        effective_to: null,
        value_type: 'unknown'
      };
    }

    // 查找SKU
    const sku = NPV2_DATA.BEVERAGE_CATALOG.find(s => s.sku_id === config.sku_id);
    if (!sku) {
      return {
        display_mode: 'unknown',
        display_text: '未找到对应SKU的营养资料',
        confidence: 0,
        nutrients: makeUnknownNutrients(),
        warnings: ['该SKU在虚构示例目录中不存在，或营养资料来源不足。'],
        value_type: 'unknown',
        catalog_id: ENGINE_INFO.catalog_id,
        catalog_version: ENGINE_INFO.catalog_version,
        effective_from: ENGINE_INFO.effective_from
      };
    }

    // 获取基底营养
    const cupKey = config.cup_size_id === 'large' ? 'large' : 'medium';
    const sugarKey = config.sugar_level_id === 'full_sugar' ? 'full_sugar' : 'full_sugar'; // 基准用全糖
    const base = sku.base_nutrition?.[cupKey]?.[sugarKey];

    if (!base) {
      return {
        display_mode: 'unknown',
        display_text: '该杯型/糖度组合暂无营养资料',
        confidence: 0,
        nutrients: makeUnknownNutrients(),
        warnings: [`${cupKey === 'large' ? '大杯' : '中杯'}配置的营养资料缺失，显示为未知/待补充。`],
        value_type: 'unknown',
        catalog_id: ENGINE_INFO.catalog_id,
        catalog_version: ENGINE_INFO.catalog_version,
        effective_from: ENGINE_INFO.effective_from
      };
    }

    // 深拷贝基底
    let nutrients = JSON.parse(JSON.stringify(base));
    const components = [{
      component_id: `base_${sku.sku_id}_${cupKey}`,
      component_type: 'base_beverage',
      label: `${sku.display_name}（${cupKey === 'large' ? '大杯' : '中杯'}，全糖基准）`,
      nutrition: JSON.parse(JSON.stringify(base))
    }];

    // 糖度差值
    if (config.sugar_level_id !== 'full_sugar' && sku.sugar_deltas) {
      const deltaMap = {
        less_sugar: 'full_to_less',
        half_sugar: 'full_to_half',
        quarter_sugar: 'full_to_quarter',
        no_sugar: 'full_to_none'
      };
      const deltaKey = deltaMap[config.sugar_level_id];
      const delta = sku.sugar_deltas[deltaKey];
      if (delta) {
        nutrients = applyDelta(nutrients, delta);
        components.push({
          component_id: `sugar_delta_${config.sugar_level_id}`,
          component_type: 'sugar_delta',
          label: `糖度调整：全糖→${sugarLabel(config.sugar_level_id)}`,
          delta: delta
        });
      }
    }

    // 小料
    const toppings = config.toppings || [];
    for (const top of toppings) {
      const topDef = (sku.available_configuration?.toppings || []).find(t => t.topping_id === top.topping_id);
      if (topDef && topDef.kcal_interval) {
        const servings = top.servings || 1;
        const topNutrients = {
          kcal: { value: null, interval: { min: topDef.kcal_interval.min * servings, max: topDef.kcal_interval.max * servings } },
          protein_g: { value: null, interval: { min: 0, max: 2 * servings } },
          fat_g: { value: null, interval: { min: 0, max: 3 * servings } },
          carbs_g: { value: null, interval: { min: 8 * servings, max: 18 * servings } },
          sugar_g: { value: null, interval: { min: 3 * servings, max: 10 * servings } },
          sodium_mg: { value: null, interval: { min: 5 * servings, max: 20 * servings } }
        };
        nutrients = addNutrients(nutrients, topNutrients);
        components.push({
          component_id: `topping_${top.topping_id}`,
          component_type: 'topping',
          label: `${topDef.label} × ${servings}份`,
          nutrition: topNutrients
        });
      }
    }

    // consumed_ratio 缩放（仅在满足条件时）
    let consumedRatioApplied = false;
    if (canUseConsumedRatio(config) && config.consumed_ratio > 0 && config.consumed_ratio < 1) {
      nutrients = scaleNutrients(nutrients, config.consumed_ratio);
      consumedRatioApplied = true;
      components.push({
        component_id: 'consumed_ratio_scale',
        component_type: 'consumed_ratio',
        label: `按实际摄入比例 ${(config.consumed_ratio * 100).toFixed(0)}% 缩放`,
        note: '仅缩放已有依据的营养区间，不改变SKU/杯型/糖度/小料配置。'
      });
    }

    // 置信度
    let confidence = sku.confidence || 0.55;
    if (config.sugar_level_id !== 'full_sugar') confidence -= 0.05;
    if (toppings.length > 0) confidence -= 0.03 * toppings.length;
    if (consumedRatioApplied) confidence -= 0.08;
    confidence = Math.max(0.2, Math.min(0.95, confidence));

    // 警告
    const warnings = [];
    if (sku.record_status === 'estimated') {
      warnings.push('该SKU为估算值（estimated），非商家确认配方，区间仅供参考。');
    }
    if (toppings.length > 0) {
      warnings.push('小料营养为通用成分估算区间，不同品牌配方差异较大。');
    }
    if (consumedRatioApplied) {
      warnings.push('剩余比例为用户目测估算，可能存在较大偏差。透明开口杯且液面可见时才允许此输入。');
    }
    if (config.cup_state === 'sealed' || config.cup_state === 'opaque') {
      warnings.push('封口/不透明杯体无法通过视觉判断剩余量，已按整杯计算。');
    }
    warnings.push('本结果为日常营养管理参考，非医疗建议。不作诊断、治疗或疗效承诺。');

    // 来源
    const sources = (sku.source_ids || [])
      .map(sid => NPV2_DATA.SOURCE_SEEDS.find(s => s.source_id === sid))
      .filter(Boolean);

    return {
      display_mode: confidence > 0.7 ? 'estimated' : 'low_confidence',
      display_text: formatDisplayText(nutrients, confidence),
      confidence: confidence,
      nutrients: nutrients,
      serving_basis: {
        type: 'per_cup',
        quantity: 1,
        unit: 'cup',
        volume_ml: config.volume_ml || (cupKey === 'large' ? 650 : 500),
        description: `${sku.brand_name} ${sku.display_name}，${cupKey === 'large' ? '大杯' : '中杯'}${config.volume_ml ? ` ${config.volume_ml}mL` : ''}，${sugarLabel(config.sugar_level_id)}，${iceLabel(config.ice_level_id)}${toppings.length > 0 ? '，含小料' : ''}${consumedRatioApplied ? `，实际摄入约${(config.consumed_ratio*100).toFixed(0)}%` : ''}`
      },
      components: components,
      sources: sources,
      warnings: warnings,
      catalog_id: ENGINE_INFO.catalog_id,
      catalog_version: ENGINE_INFO.catalog_version,
      effective_from: ENGINE_INFO.effective_from,
      effective_to: null,
      value_type: 'estimated',
      engine_info: ENGINE_INFO
    };
  }

  // ========== 辅助函数 ==========

  function makeUnknownNutrients() {
    return {
      kcal: { value: null, interval: null, value_type: 'unknown' },
      protein_g: { value: null, interval: null, value_type: 'unknown' },
      fat_g: { value: null, interval: null, value_type: 'unknown' },
      carbs_g: { value: null, interval: null, value_type: 'unknown' },
      sugar_g: { value: null, interval: null, value_type: 'unknown' },
      sodium_mg: { value: null, interval: null, value_type: 'unknown' }
    };
  }

  function applyDelta(base, delta) {
    const result = JSON.parse(JSON.stringify(base));
    for (const key of Object.keys(delta)) {
      if (result[key]) {
        if (result[key].interval) {
          result[key].interval.min += delta[key];
          result[key].interval.max += delta[key];
        }
        if (result[key].value !== null && result[key].value !== undefined) {
          result[key].value += delta[key];
        }
      }
    }
    return result;
  }

  function addNutrients(a, b) {
    const result = JSON.parse(JSON.stringify(a));
    for (const key of Object.keys(b)) {
      if (!result[key]) {
        result[key] = JSON.parse(JSON.stringify(b[key]));
      } else {
        if (b[key].interval) {
          if (!result[key].interval) result[key].interval = { min: 0, max: 0 };
          result[key].interval.min += b[key].interval.min;
          result[key].interval.max += b[key].interval.max;
        }
        if (b[key].value !== null && b[key].value !== undefined) {
          if (result[key].value !== null && result[key].value !== undefined) {
            result[key].value += b[key].value;
          } else {
            result[key].value = null; // 一方为区间则整体为区间
          }
        } else {
          result[key].value = null;
        }
      }
    }
    return result;
  }

  function scaleNutrients(n, ratio) {
    const result = JSON.parse(JSON.stringify(n));
    for (const key of Object.keys(result)) {
      if (result[key].interval) {
        result[key].interval.min = Math.round(result[key].interval.min * ratio);
        result[key].interval.max = Math.round(result[key].interval.max * ratio);
      }
      if (result[key].value !== null && result[key].value !== undefined) {
        result[key].value = Math.round(result[key].value * ratio * 10) / 10;
      }
    }
    return result;
  }

  function sugarLabel(id) {
    const map = { full_sugar:'全糖', less_sugar:'七分糖', half_sugar:'半糖', quarter_sugar:'三分糖', no_sugar:'无糖' };
    return map[id] || id;
  }
  function iceLabel(id) {
    const map = { normal_ice:'正常冰', less_ice:'少冰', no_ice:'去冰', hot:'热饮' };
    return map[id] || id;
  }

  function formatDisplayText(nutrients, confidence) {
    const kcal = nutrients.kcal;
    if (kcal.value !== null && kcal.value !== undefined) {
      return `约 ${kcal.value} kcal`;
    }
    if (kcal.interval) {
      return `约 ${kcal.interval.min}–${kcal.interval.max} kcal（置信度 ${(confidence*100).toFixed(0)}%）`;
    }
    return '未知/待补充';
  }

  /**
   * 格式化营养值用于显示
   * @param {Object} nutrient - {value, interval, value_type}
   * @param {string} unit - 单位
   * @returns {string}
   */
  function formatNutrient(nutrient, unit) {
    if (!nutrient) return '未知/待补充';
    if (nutrient.value_type === 'unknown' || (nutrient.value === null && !nutrient.interval)) {
      return '未知/待补充';
    }
    if (nutrient.value !== null && nutrient.value !== undefined) {
      return `${nutrient.value} ${unit}`;
    }
    if (nutrient.interval) {
      return `${nutrient.interval.min}–${nutrient.interval.max} ${unit}`;
    }
    return '未知/待补充';
  }

  return {
    ENGINE_INFO,
    matchCandidates,
    validateConfig,
    canUseConsumedRatio,
    estimate,
    formatNutrient,
    sugarLabel,
    iceLabel
  };
})();

/* ============================================================
   证据门控饮品引擎（08引擎核心逻辑前端移植）
   - 严格遵守证据门控：只有 official/merchant_confirmed/estimated 可计算
   - 糖度delta必须验证，不能按比例猜测
   - 小料必须验证，estimated不参与总量
   - unknown不按0合并，结果显示"未知"
   - 区间非退化时value=null
   - consumed_ratio只缩放已知营养项
   ============================================================ */
class EvidenceBeverageEngine {
  constructor(catalog) {
    this.catalog = catalog || { records: [], sources: [], catalog_mode: 'synthetic_demo' };
    this.NUTRIENTS = ['kcal', 'protein_g', 'fat_g', 'carbohydrate_g', 'sugar_g', 'sodium_mg'];
    this.VERIFIED_TYPES = ['official', 'merchant_confirmed'];
    this.CALCULABLE_TYPES = ['official', 'merchant_confirmed', 'estimated'];
  }

  estimate(request) {
    const warnings = [];
    const required = ['brand_id', 'sku_id', 'cup_size_id', 'sugar_level_id', 'ice_level_id'];
    const missing = required.filter(f => !request[f]);
    if (missing.length > 0) {
      return this._unknownResponse(request, [{ code: 'CONFIGURATION_MISSING', message: '品牌、SKU、杯型、糖度和冰量必须完整', details: missing }]);
    }

    const records = this.catalog.records.filter(r => r.brand_id === request.brand_id && r.sku_id === request.sku_id);
    if (records.length === 0) {
      return this._unknownResponse(request, [{ code: 'SKU_NOT_FOUND', message: '目录中没有该 SKU' }]);
    }

    const record = records[0];
    if (!this.CALCULABLE_TYPES.includes(record.record_status)) {
      return this._unknownResponse(request, [{ code: 'PARTIAL_RECORD', message: '该记录只有部分事实，不能输出伪精确总热量' }], record);
    }

    // 查找 base beverage
    const bases = record.base_beverages || [];
    const cupBases = bases.filter(b => b.cup_size_id === request.cup_size_id);
    if (cupBases.length === 0) {
      return this._unknownResponse(request, [{ code: 'CUP_SIZE_UNAVAILABLE', message: '没有该杯型的已验证 base beverage' }], record);
    }
    const matchedBases = cupBases.filter(b => b.ice_level_id === request.ice_level_id);
    if (matchedBases.length === 0) {
      return this._unknownResponse(request, [{ code: 'ICE_LEVEL_UNAVAILABLE', message: '没有该冰量的已验证 base beverage' }], record);
    }
    const base = matchedBases[0];
    const volumeMl = base.volume_ml;

    const components = [this._resolveComponent(base, 'base_beverage', 1, volumeMl, warnings)];

    // 糖度 delta
    const baseSugar = base.sugar_level_id || 'unknown';
    if (request.sugar_level_id !== baseSugar) {
      const deltas = record.sugar_deltas || [];
      const delta = deltas.find(d =>
        d.from_sugar_level_id === baseSugar &&
        d.to_sugar_level_id === request.sugar_level_id &&
        d.cup_size_id === request.cup_size_id &&
        d.ice_level_id === request.ice_level_id
      );
      if (!delta || !this.VERIFIED_TYPES.includes(delta.nutrition?.value_type)) {
        warnings.push({ code: 'SUGAR_DELTA_NOT_VERIFIED', message: '请求糖度相对 base beverage 的差值没有经过验证，不能按比例猜测' });
        components.push(this._unknownComponent('unverified_sugar_delta', 'sugar_delta'));
      } else {
        components.push(this._resolveComponent(delta, 'sugar_delta', 1, volumeMl, warnings));
      }
    }

    // 小料
    const toppingRequests = request.toppings || [];
    const toppings = record.toppings || [];
    for (const tr of toppingRequests) {
      const topping = toppings.find(t => t.topping_id === tr.topping_id);
      if (!topping || !this.VERIFIED_TYPES.includes(topping.nutrition?.value_type)) {
        warnings.push({ code: 'TOPPING_NOT_VERIFIED', message: `小料 ${tr.topping_id} 没有已验证的标准份营养数据` });
        components.push(this._unknownComponent(tr.topping_id, 'topping'));
        continue;
      }
      components.push(this._resolveComponent(topping, 'topping', tr.servings || 1, volumeMl, warnings));
    }

    // 饮用比例
    const ratio = request.consumed_ratio != null ? request.consumed_ratio : 1;
    if (ratio < 1) {
      warnings.push({ code: 'CONSUMED_RATIO_APPLIED', message: '营养结果仅按实际饮用比例缩放' });
    }

    // 合并营养
    const nutrients = {};
    for (const nutrient of this.NUTRIENTS) {
      nutrients[nutrient] = this._combineNutrient(nutrient, components, ratio);
    }

    const knownCount = Object.values(nutrients).filter(n => n.value_type !== 'unknown').length;
    const status = knownCount === 0 ? 'unknown' : knownCount === this.NUTRIENTS.length ? 'ok' : 'partial';

    return {
      schema_version: '1.0.0',
      status,
      identity: { brand_id: request.brand_id, sku_id: request.sku_id, display_name: record.display_name, record_status: record.record_status },
      serving_basis: {
        cup_size_id: request.cup_size_id,
        cup_size_label: base.cup_size_label,
        volume_ml: volumeMl,
        sugar_level_id: request.sugar_level_id,
        ice_level_id: request.ice_level_id,
        toppings: toppingRequests,
        consumed_ratio: ratio
      },
      nutrients,
      value_type: nutrients.kcal.value_type,
      confidence: nutrients.kcal.confidence,
      components: components.map(c => this._publicComponent(c)),
      sources: this._collectSources(components, record),
      warnings,
      display_policy: {
        precise_total_allowed: nutrients.kcal.display_mode === 'exact',
        headline: nutrients.kcal.display_text,
        unknown_must_not_be_coerced_to_zero: true
      }
    };
  }

  _resolveComponent(component, role, servings, volumeMl, warnings) {
    const profile = component.nutrition || {};
    const componentId = component.component_id || component.topping_id || role + '_component';
    const basis = profile.basis || {};
    const basisComplete = basis.type === 'per_serving' || basis.type === 'per_100_ml';
    const sourceIds = profile.source_ids || [];
    const valueType = profile.value_type || 'unknown';

    if (!basisComplete) {
      warnings.push({ code: 'SERVING_BASIS_INCOMPLETE', message: `组件 ${componentId} 缺少完整 serving basis` });
    }

    let scale = 1;
    if (basis.type === 'per_100_ml' && basisComplete && volumeMl) {
      scale = volumeMl / (basis.quantity || 100) * servings;
    } else if (basis.type === 'per_serving' && basisComplete) {
      scale = servings / (basis.quantity || 1);
    }

    const confidence = profile.confidence || 0;
    const rawNutrients = profile.nutrients || {};
    const globallyValid = basisComplete && valueType !== 'unknown';
    const terms = {};

    for (const nutrient of this.NUTRIENTS) {
      const raw = rawNutrients[nutrient];
      if (!globallyValid || !raw) {
        terms[nutrient] = { known: false };
        continue;
      }
      try {
        let lower, upper;
        if (raw.interval) {
          lower = raw.interval.min;
          upper = raw.interval.max;
        } else {
          lower = upper = raw.value;
        }
        if (lower > upper) throw new Error('invalid interval');
        if (valueType === 'estimated' && lower === upper) throw new Error('estimated must be range');
        const value = raw.value != null ? raw.value : (lower + upper) / 2;
        terms[nutrient] = {
          known: true,
          value: value * scale,
          lower: lower * scale,
          upper: upper * scale,
          value_type: valueType,
          confidence
        };
      } catch (e) {
        terms[nutrient] = { known: false };
      }
    }

    return {
      component_id: componentId,
      role,
      label: component.label || component.cup_size_label || componentId,
      value_type: globallyValid ? valueType : 'unknown',
      confidence: globallyValid ? confidence : 0,
      source_ids: sourceIds,
      basis,
      applied_scale: scale,
      terms
    };
  }

  _unknownComponent(componentId, role) {
    const terms = {};
    for (const n of this.NUTRIENTS) terms[n] = { known: false };
    return { component_id: componentId, role, label: componentId, value_type: 'unknown', confidence: 0, source_ids: [], basis: null, applied_scale: 1, terms };
  }

  _combineNutrient(nutrient, components, ratio) {
    const terms = components.map(c => c.terms[nutrient] || { known: false });
    if (!terms.length || terms.some(t => !t.known)) {
      return { value: null, unit: nutrient === 'kcal' ? 'kcal' : nutrient === 'sodium_mg' ? 'mg' : 'g', value_type: 'unknown', interval: null, confidence: 0, display_mode: 'unknown', display_text: '未知' };
    }
    const value = terms.reduce((s, t) => s + t.value, 0) * ratio;
    const lower = terms.reduce((s, t) => s + t.lower, 0) * ratio;
    const upper = terms.reduce((s, t) => s + t.upper, 0) * ratio;
    const valueTypes = terms.map(t => t.value_type);
    const valueType = valueTypes.includes('estimated') ? 'estimated' : valueTypes.includes('merchant_confirmed') ? 'merchant_confirmed' : 'official';
    const confidence = Math.min(...terms.map(t => t.confidence));
    const unit = nutrient === 'kcal' ? 'kcal' : nutrient === 'sodium_mg' ? 'mg' : 'g';

    let displayMode, displayText;
    if (valueType === 'estimated') {
      displayMode = 'estimated_range';
      displayText = `估算 ${this._round(lower)}-${this._round(upper)} ${unit}`;
    } else if (lower === upper) {
      displayMode = 'exact';
      displayText = `${this._round(value)} ${unit}`;
    } else {
      displayMode = 'range';
      displayText = `${this._round(lower)}-${this._round(upper)} ${unit}`;
    }

    return {
      value: (valueType === 'estimated' || lower !== upper) ? null : this._round(value),
      unit,
      value_type: valueType,
      interval: { min: this._round(lower), max: this._round(upper) },
      confidence,
      display_mode: displayMode,
      display_text: displayText
    };
  }

  _round(n) {
    const r = Math.round(n * 100) / 100;
    return Number.isInteger(r) ? r : r;
  }

  _publicComponent(c) {
    const contributions = {};
    for (const n of this.NUTRIENTS) {
      const t = c.terms[n] || { known: false };
      contributions[n] = t.known ? { value: this._round(t.value), unit: n === 'kcal' ? 'kcal' : n === 'sodium_mg' ? 'mg' : 'g', interval: { min: this._round(t.lower), max: this._round(t.upper) } } : null;
    }
    return { component_id: c.component_id, role: c.role, label: c.label, value_type: c.value_type, confidence: c.confidence, serving_basis: c.basis, applied_scale: c.applied_scale, source_ids: c.source_ids, contributions };
  }

  _collectSources(components, record) {
    const sourceIds = new Set();
    for (const c of components) for (const id of (c.source_ids || [])) sourceIds.add(id);
    for (const id of (record.source_ids || [])) sourceIds.add(id);
    const sources = this.catalog.sources || [];
    return Array.from(sourceIds).map(id => sources.find(s => s.source_id === id)).filter(Boolean).map(s => ({ source_id: s.source_id, publisher: s.publisher, source_type: s.source_type, evidence_grade: s.evidence_grade, review_status: s.review_status }));
  }

  _unknownResponse(request, warnings, record) {
    const nutrients = {};
    for (const n of this.NUTRIENTS) {
      nutrients[n] = { value: null, unit: n === 'kcal' ? 'kcal' : n === 'sodium_mg' ? 'mg' : 'g', value_type: 'unknown', interval: null, confidence: 0, display_mode: 'unknown', display_text: '未知' };
    }
    return {
      schema_version: '1.0.0',
      status: 'unknown',
      identity: { brand_id: request.brand_id, sku_id: request.sku_id, display_name: record?.display_name, record_status: record?.record_status },
      serving_basis: { cup_size_id: request.cup_size_id, volume_ml: null, sugar_level_id: request.sugar_level_id, ice_level_id: request.ice_level_id, toppings: request.toppings || [], consumed_ratio: request.consumed_ratio || 1 },
      nutrients,
      value_type: 'unknown',
      confidence: 0,
      components: [],
      sources: record ? this._collectSources([], record) : [],
      warnings,
      display_policy: { precise_total_allowed: false, headline: '未知', unknown_must_not_be_coerced_to_zero: true }
    };
  }
}

