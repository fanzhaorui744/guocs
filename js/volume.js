/* ============================================================
   餐食视觉定量计算内核 Volume
   分割多边形 → 参照物标定 → 视角矫正 → 体积 → 质量 → 热量
   坐标体系：归一化 0~999（左上(0,0)，右下(999,999)）
   纯函数、无外部依赖，可离线运行；与后端 VolumeEstimator 同口径
   ============================================================ */
const Volume = (() => {

  // 食物视密度中值表（g/cm³），模型未给密度时按菜名兜底
  const DENSITY_RULES = [
    [/汤|奶茶|奶绿|豆浆|粥|饮|可乐|果汁|咖啡|拿铁|水/, 1.00],
    [/炸鸡|薯条|面包|油条|春卷|烘焙|酥|蓬松|爆米花/, 0.42],
    [/炒青菜|青菜|生菜|沙拉|蔬菜|菜心|西兰花|黄瓜|冬瓜|时蔬|豆角|茄子/, 0.50],
    [/米饭|炒饭|土豆泥|薯泥|红薯|紫薯|饭团/, 0.68],
    [/炒面|面条|米粉|河粉|粉|意面/, 0.80],
    [/水果|瓜|苹果|香蕉|橙/, 0.65],
    [/肉|蛋|豆腐|鱼|虾|鸡|牛|猪|排/, 1.05]
  ];
  const DEFAULT_DENSITY = 0.85;

  function densityOf(name, given) {
    if (Number(given) > 0.1 && Number(given) < 3) return Number(given);
    for (const [re, v] of DENSITY_RULES) if (re.test(name || '')) return v;
    return DEFAULT_DENSITY;
  }

  // 鞋带公式：归一化多边形面积（0~999 坐标系）
  function polygonAreaNorm(poly) {
    if (!Array.isArray(poly) || poly.length < 3) return 0;
    let s = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i];
      const [x2, y2] = poly[(i + 1) % poly.length];
      s += Number(x1) * Number(y2) - Number(x2) * Number(y1);
    }
    return Math.abs(s) / 2;
  }

  function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

  /**
   * 参照物标定：返回每归一化单位对应的物理厘米 {ux,uy,reliable,type}
   * 有网格四角时分别求 x/y 边做非等比校正；否则用 px_length 等比；
   * 都没有则按标准视场经验兜底（区间放宽）。
   */
  function calibrate(reference, imgW, imgH) {
    const r = reference || {};
    const ar = (imgW && imgH) ? imgW / imgH : 1; // 像素宽高比，用于 y 方向校正
    if (r.type === 'grid1cm') {
      const kcm = Number(r.known_cm) > 0 ? Number(r.known_cm) : 1.0;
      // 1) 整网格纸外边框 + 行列格数平均法：单格边长 = 整纸跨度 / 格数（最稳）
      const gp = Array.isArray(r.grid_pts) ? r.grid_pts : [];
      const cols = Number(r.grid_cols) || 0, rows = Number(r.grid_rows) || 0;
      if (gp.length >= 4 && cols >= 1) {
        const gx = Math.max(dist(gp[0], gp[1]), 1e-6); // 整纸上边宽
        const ex = gx / cols;
        let ey = ex;
        if (rows >= 1) { const gy = Math.max(dist(gp[0], gp[3]), 1e-6); ey = gy / rows; }
        return { ux: kcm / ex, uy: kcm / ey, reliable: true, type: r.type };
      }
      // 2) 单个最小格四角
      const pts = Array.isArray(r.px_points) ? r.px_points : [];
      if (pts.length >= 4) {
        const ex = Math.max(dist(pts[0], pts[1]), 1e-6); // 上边宽
        const ey = Math.max(dist(pts[0], pts[3]), 1e-6); // 左边高
        return { ux: kcm / ex, uy: kcm / ey, reliable: true, type: r.type };
      }
    }
    // 3) 已知标定边长度
    if (Number(r.px_length) > 1 && Number(r.known_cm) > 0) {
      const u = r.known_cm / r.px_length;
      return { ux: u, uy: u / ar * ar, reliable: r.scale_reliable !== false, type: r.type || 'ref' };
    }
    // 4) 经验兜底：归一化 999 宽度 ≈ 25cm 视场
    const ux = 25 / 999;
    return { ux, uy: ux, reliable: false, type: 'none' };
  }

  // 斜拍一阶视角补偿：俯视面积被压缩，除以 cos(tilt)
  function tiltCompensate(area, tiltDeg) {
    const t = Math.max(0, Math.min(60, Number(tiltDeg) || 0));
    return area / Math.cos(t * Math.PI / 180);
  }

  /**
   * 形状体积模型（cm³）
   * S=俯视面积cm², h=平均厚度cm
   */
  function shapeVolume(S, h, shape, domeRatio, fillRatio) {
    const phi = fillRatio > 0 && fillRatio <= 1 ? fillRatio : 1;
    const H = Math.max(h, 0.1);
    switch (shape) {
      case 'flat':
      case 'prism':  return S * H * phi;
      case 'liquid': return S * H;
      case 'ellipsoid': return S * H * (2 / 3) * Math.PI / 2 * phi || S * H * 1.05 * phi;
      case 'pile':   return S * H * 0.6 * phi;
      case 'dome':
      default: {
        const dr = Math.max(1, Math.min(2, Number(domeRatio) || 1.5));
        const k = 0.5 + 0.5 / dr; // 隆起越明显，等效高度系数越小（0.5~1）
        return S * H * k * phi;
      }
    }
  }

  // 由 bbox 求椭球三轴（cm）
  function ellipsoidVolume(bbox, scale, h) {
    if (!Array.isArray(bbox) || bbox.length < 4) return null;
    const [, , w, hgt] = bbox;
    const L = Number(w) * scale.ux;
    const Wd = Number(hgt) * scale.uy;
    const H = 2 * Math.max(Number(h) || 0.1, 0.1);
    return (Math.PI / 6) * L * Wd * H;
  }

  /**
   * 单个食物定量
   * food: 主提示词输出的一个实例；depthHeightCm 为 DepthAnything 融合后的平均高度（可选）
   */
  function measureOne(food, scale, view, imgW, imgH, depthHeightCm) {
    const A_norm = polygonAreaNorm(food.polygon);
    let areaCm2 = A_norm * scale.ux * scale.uy;
    areaCm2 = tiltCompensate(areaCm2, view && view.tilt_deg);
    if (!isFinite(areaCm2) || areaCm2 <= 0) { // 多边形异常时用 bbox 兜底
      const b = food.bbox || [];
      areaCm2 = (Number(b[2]) || 0) * (Number(b[3]) || 0) * scale.ux * scale.uy * 0.85;
    }
    const useDepth = Number(depthHeightCm) > 0;
    const h = useDepth ? depthHeightCm : Number(food.thickness_cm_est);
    let volumeCm3;
    if (food.shape === 'ellipsoid') {
      volumeCm3 = ellipsoidVolume(food.bbox, scale, h) || shapeVolume(areaCm2, h, food.shape, food.dome_ratio, food.fill_ratio);
    } else {
      // 无论厚度来自语义估计还是深度场，都使用同一套形状系数，保证两条口径自洽
      volumeCm3 = shapeVolume(areaCm2, h, food.shape, food.dome_ratio, food.fill_ratio);
    }
    const density = densityOf(food.name, food.density_g_cm3);
    const massG = volumeCm3 * density;
    const kcal100 = Number(food.calorie_per_100g) || 0;
    const kcal = massG / 100 * kcal100;
    const band = scale.reliable ? 0.20 : 0.35; // 无参照物放宽区间
    return {
      name: food.name || '未知食物',
      confidence: Math.max(0, Math.min(100, Number(food.confidence) || 50)),
      shape: food.shape || 'dome',
      area_cm2: round2(areaCm2),
      thickness_cm: round2(Math.max(h, 0.1)),
      volume_cm3: round2(volumeCm3),
      density_g_cm3: round2(density),
      mass_g: Math.round(massG),
      kcal_per_100g: Math.round(kcal100),
      kcal: Math.round(kcal),
      kcal_range: kcal100 > 0 ? [Math.round(kcal * (1 - band)), Math.round(kcal * (1 + band))] : null,
      mass_range_g: [Math.round(massG * (1 - band)), Math.round(massG * (1 + band))],
      depth_source: useDepth ? 'depth_model' : 'semantic',
      scale_reliable: scale.reliable,
      polygon: food.polygon || [],
      bbox: food.bbox || []
    };
  }

  /**
   * 整餐定量分析
   * payload: 主提示词返回 {view,reference,foods[]}
   * depthMap: 可选 {foodIndex: avgHeightCm}，由 DepthAnything 融合得到
   */
  function analyze(payload, imgW, imgH, depthMap) {
    const view = payload.view || { angle: 'tilt', tilt_deg: 25, quality: 'ok' };
    const scale = calibrate(payload.reference, imgW, imgH);
    const items = (payload.foods || []).map((f, i) =>
      measureOne(f, scale, view, imgW, imgH, depthMap ? depthMap[i] : null));
    const sum = (k) => items.reduce((a, b) => a + (b[k] || 0), 0);
    const totalMass = Math.round(sum('mass_g'));
    const totalKcal = Math.round(sum('kcal'));
    const lo = items.reduce((a, b) => a + (b.kcal_range ? b.kcal_range[0] : b.kcal), 0);
    const hi = items.reduce((a, b) => a + (b.kcal_range ? b.kcal_range[1] : b.kcal), 0);
    return {
      view, reference_type: scale.type, scale_reliable: scale.reliable,
      scale: { ux: round4(scale.ux), uy: round4(scale.uy) },
      items,
      total_mass_g: totalMass,
      total_kcal: totalKcal,
      total_kcal_range: [Math.round(lo), Math.round(hi)],
      food_count: items.length
    };
  }

  /**
   * DepthAnything 相对深度场 → 每个食物平均物理高度（cm）
   * depthGrid: 与图对齐的归一化深度二维数组(0~1,行×列)；rows/cols 为分辨率
   * 用食物多边形做掩膜，相对高差 × 语义厚度锚定绝对量级
   */
  function fuseDepth(depthGrid, rows, cols, items, payload) {
    const out = {};
    if (!Array.isArray(depthGrid) || !rows || !cols) return out;
    (payload.foods || []).forEach((food, i) => {
      let sumD = 0, maxD = -1, edgeD = 1, n = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const nx = c / (cols - 1) * 999, ny = r / (rows - 1) * 999;
          if (pointInPolygon([nx, ny], food.polygon)) {
            const d = Number(depthGrid[r][c]); if (!isFinite(d)) continue;
            sumD += d; n++; maxD = Math.max(maxD, d); edgeD = Math.min(edgeD, d);
          }
        }
      }
      if (n > 0 && maxD > edgeD) {
        const seed = Number(food.thickness_cm_est) || 2; // 语义厚度锚定绝对量级
        const avgRel = sumD / n;
        // 以语义平均厚度为锚，深度相对形态做 ±25% 温和校正，避免相对深度整体抬升厚度
        const r = (avgRel - edgeD) / (maxD - edgeD);
        const h = Math.max(0.2, seed * (0.75 + 0.25 * r));
        out[i] = round2(h);
      }
    });
    return out;
  }

  function pointInPolygon(p, poly) {
    if (!Array.isArray(poly) || poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > p[1]) !== (yj > p[1])) &&
        (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function round2(x) { return Math.round(Number(x) * 100) / 100; }
  function round4(x) { return Math.round(Number(x) * 10000) / 10000; }

  return { analyze, fuseDepth, polygonAreaNorm, calibrate, shapeVolume, densityOf };
})();
