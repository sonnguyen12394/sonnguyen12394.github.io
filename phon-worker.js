// v146 Worker chấm từng âm trên máy (thử nghiệm). Tải mô hình nhận âm vị wav2vec2 (nhãn IPA espeak, bản ONNX) bằng Transformers.js,
// chạy trong worker để không đơ màn; trả logits [T × V] cho app chấm (src/engine/gop.ts). Âm thanh không rời khỏi máy.
// Mô hình và thư viện tải từ Hugging Face / jsDelivr ở lần đầu, trình duyệt lưu lại (Cache Storage "transformers-cache").
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
const MODEL = 'onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX';
let T = null, model = null, vocab = null;

self.onmessage = async (e) => {
  const m = e.data || {};
  try {
    if (m.type === 'load') {
      const t0 = performance.now();
      T = T || await import(LIB);
      T.env.allowLocalModels = false; T.env.useBrowserCache = true;
      // GitHub Pages không đặt được COOP / COEP → không có SharedArrayBuffer: chạy một luồng.
      if (T.env.backends && T.env.backends.onnx && T.env.backends.onnx.wasm) T.env.backends.onnx.wasm.numThreads = 1;
      if (!vocab) {
        const r = await fetch(`https://huggingface.co/${MODEL}/resolve/main/vocab.json`);
        if (!r.ok) throw new Error('Không tải được bộ âm (vocab.json): ' + r.status);
        vocab = await r.json();
      }
      const files = {};
      model = await T.AutoModelForCTC.from_pretrained(MODEL, {
        dtype: m.dtype || 'q8', device: 'wasm',
        progress_callback: (p) => {
          if (p && p.file && p.total) { files[p.file] = { loaded: p.loaded || 0, total: p.total }; }
          const all = Object.values(files), loaded = all.reduce((a, x) => a + x.loaded, 0), total = all.reduce((a, x) => a + x.total, 0);
          self.postMessage({ type: 'progress', loaded, total, status: p && p.status });
        },
      });
      self.postMessage({ type: 'ready', vocab, ms: performance.now() - t0 });
    } else if (m.type === 'run') {
      if (!model) throw new Error('Mô hình chưa tải xong.');
      const x = m.audio; let mean = 0; for (let i = 0; i < x.length; i++) mean += x[i]; mean /= x.length || 1;
      let v = 0; for (let i = 0; i < x.length; i++) v += (x[i] - mean) ** 2; const sd = Math.sqrt(v / (x.length || 1)) + 1e-7;
      const norm = new Float32Array(x.length); for (let i = 0; i < x.length; i++) norm[i] = (x[i] - mean) / sd;   // chuẩn hoá như bộ trích đặc trưng wav2vec2
      const t0 = performance.now();
      const out = await model({ input_values: new T.Tensor('float32', norm, [1, norm.length]) });
      const L = out.logits, data = Float32Array.from(L.data);
      self.postMessage({ type: 'logits', dims: L.dims, data, ms: performance.now() - t0 }, [data.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', msg: String((err && err.message) || err) });
  }
};
