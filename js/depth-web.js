/* ============================================================
   DepthWeb —— 纯浏览器端单目相对深度感知
   transformers.js + Depth-Anything-Small（模型权重随站点自托管）
   WebGPU(fp16) 优先，失败自动降级 WASM(q8)
   零后端 / 零费用 / 图片不出端；任何失败都向外抛错，由调用方退回形状语义厚度
   ============================================================ */
const DepthWeb = (() => {
  const MODEL = 'Xenova/depth-anything-small-hf';
  const GRID = 40; // 输出深度网格分辨率（rows×cols）
  const LIB_CDNS = [
    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js',
    'https://fastly.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js',
    'https://unpkg.com/@xenova/transformers@2.17.2/dist/transformers.min.js',
    'https://esm.sh/@xenova/transformers@2.17.2'
  ];

  let libPromise = null;    // 运行库单例
  let pipePromise = null;   // 管线单例（含失败可重置）
  let pipe = null;
  const meta = { device: null, dtype: null };
  let phase = 'idle';       // idle | loading | ready | error
  let phaseText = '';

  function status() { return { phase, phaseText, device: meta.device, dtype: meta.dtype }; }

  function hasWebGPU() { try { return !!navigator.gpu; } catch (e) { return false; } }

  // 站点内模型目录（兼容根路径与 /guocs/ 子路径、hash 路由）
  function siteModelsPath() {
    try { return location.pathname.replace(/[^/]*$/, '') + 'models/'; }
    catch (e) { return 'models/'; }
  }

  // 动态 ESM 导入运行库，多 CDN 轮询（CDN 仅提供 JS 运行库，权重走站点本地）
  async function loadLib() {
    if (libPromise) return libPromise;
    libPromise = (async () => {
      let lastErr;
      for (const url of LIB_CDNS) {
        try {
          const m = await import(/* webpackIgnore: true */ url);
          const mod = (m && m.pipeline) ? m : (m.default && m.default.pipeline ? m.default : null);
          if (mod && mod.pipeline) return mod;
          lastErr = new Error('运行库导出为空');
        } catch (e) { lastErr = e; }
      }
      throw lastErr || new Error('深度引擎运行库加载失败（网络不可用）');
    })();
    return libPromise;
  }

  // 权重随站点自托管：只走本地同源目录，避免运行时回连被墙/跨域受限的模型源
  function applyLocal(env) {
    try {
      env.allowLocalModels = true;
      env.allowRemoteModels = false;
      env.localModelPath = siteModelsPath();
      env.useBrowserCache = true; // 权重缓存到浏览器，二次免下载
    } catch (e) { /* 用默认值 */ }
  }

  async function buildPipe(device, dtype, onProgress) {
    const mod = await loadLib();
    applyLocal(mod.env);
    const opts = {
      device,
      dtype,
      progress_callback: (e) => {
        if (!onProgress) return;
        if (e.status === 'downloading' || e.status === 'progress') {
          const pct = e.progress ? Math.round(e.progress) + '%' : '';
          onProgress(`加载本地视觉引擎 ${pct} ${e.file ? e.file.split('/').pop() : ''}`.trim());
        } else if (e.status === 'compiling') {
          onProgress('正在编译深度模型（' + device.toUpperCase() + '）…');
        } else if (e.status === 'ready' || e.status === 'done') {
          onProgress('深度模型就绪');
        }
      }
    };
    return await mod.pipeline('depth-estimation', MODEL, opts);
  }

  // 懒加载：WebGPU(fp16) → WASM(q8) 依次尝试
  async function ensure(onProgress) {
    if (pipe) return { ok: true, device: meta.device, dtype: meta.dtype };
    if (pipePromise) return pipePromise;
    phase = 'loading';
    const set = (t) => { phaseText = t; onProgress && onProgress(t); };
    pipePromise = (async () => {
      const attempts = [];
      if (hasWebGPU()) attempts.push({ device: 'webgpu', dtype: 'fp16' });
      attempts.push({ device: 'wasm', dtype: 'q8' });
      let err;
      for (const a of attempts) {
        try {
          set('正在加载本地视觉引擎（' + a.device.toUpperCase() + '）…');
          pipe = await buildPipe(a.device, a.dtype, set);
          meta.device = a.device; meta.dtype = a.dtype;
          phase = 'ready'; phaseText = '深度模型就绪';
          return { ok: true, device: a.device, dtype: a.dtype };
        } catch (e) { err = e; pipe = null; }
      }
      phase = 'error'; phaseText = '本地深度引擎不可用，已改用形状估计';
      pipePromise = null; // 允许后续重试
      throw err || new Error('深度模型加载失败');
    })();
    return pipePromise;
  }

  // 把任意分辨率深度张量降采样为 rows×cols 的 0~1 归一化网格
  function downsample(data, H, W, rows, cols) {
    const sum = Array.from({ length: rows }, () => new Float64Array(cols));
    const cnt = Array.from({ length: rows }, () => new Uint16Array(cols));
    let mn = Infinity, mx = -Infinity;
    for (let y = 0; y < H; y++) {
      const r = Math.min(rows - 1, Math.floor(y / H * rows));
      for (let x = 0; x < W; x++) {
        const v = Number(data[y * W + x]);
        if (!isFinite(v)) continue;
        const c = Math.min(cols - 1, Math.floor(x / W * cols));
        sum[r][c] += v; cnt[r][c]++; if (v < mn) mn = v; if (v > mx) mx = v;
      }
    }
    const grid = [];
    const span = (mx > mn) ? (mx - mn) : 1;
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const mean = cnt[r][c] ? sum[r][c] / cnt[r][c] : mn;
        row.push(Number(((mean - mn) / span).toFixed(4)));
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * 对一张图做相对深度估计
   * @param imageInput dataURI 字符串 / URL / HTMLImageElement / RawImage
   * @returns {ok,grid,rows,cols,device,dtype,ms,preview(dataURI灰度深度图)}
   */
  async function estimate(imageInput, onProgress) {
    await ensure(onProgress);
    const t0 = performance.now();
    const out = await pipe(imageInput);
    const td = out && out.predicted_depth;
    if (!td || !td.data) throw new Error('深度输出为空');
    const dims = td.dims || [];
    const H = dims.length >= 2 ? dims[dims.length - 2] : Math.sqrt(td.data.length) | 0;
    const W = dims.length >= 2 ? dims[dims.length - 1] : Math.sqrt(td.data.length) | 0;
    const grid = downsample(td.data, H, W, GRID, GRID);
    const ms = Math.round(performance.now() - t0);
    return {
      ok: true, grid, rows: GRID, cols: GRID,
      device: meta.device, dtype: meta.dtype, ms,
      preview: gridPreview(grid)
    };
  }

  // 深度网格 → 灰度预览 dataURI（近亮远暗）
  function gridPreview(grid) {
    try {
      const rows = grid.length, cols = grid[0].length;
      const cv = document.createElement('canvas'); cv.width = cols; cv.height = rows;
      const ctx = cv.getContext('2d'); const img = ctx.createImageData(cols, rows);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const v = Math.round(255 * grid[r][c]), i = (r * cols + c) * 4;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      return cv.toDataURL('image/png');
    } catch (e) { return null; }
  }

  function reset() { pipe = null; pipePromise = null; libPromise = null; phase = 'idle'; phaseText = ''; }

  return { status, ensure, estimate, reset, hasWebGPU };
})();
