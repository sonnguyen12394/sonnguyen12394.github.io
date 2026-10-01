#!/usr/bin/env node
// Tạo âm thanh bài nghe ở KHÂU LÀM NỘI DUNG (yêu cầu 2.2, 6.6): đọc lời thoại trong content/exam, mỗi người nói một giọng
// Kokoro-82M (giấy phép Apache-2.0; bản int8 đóng gói cho sherpa-onnx), ghép có khoảng nghỉ, xuất MP3 32 kbps mono vào a/.
// Kết quả là tệp tĩnh được commit; app không chạy mô hình nào lúc học. Chỉ tạo lại khi lời thoại/giọng/tốc độ đổi (a/manifest.json).
//
// Chuẩn bị (một lần, không nằm trong package.json vì nặng ~100 MB):
//   npm pack n8n-nodes-ttsbro && tar xzf n8n-nodes-ttsbro-*.tgz   → package/kokoro-int8-en-v0_19 (mô hình + giọng)
//   npm i sherpa-onnx-node@1.13.8 (ở một thư mục riêng)
//   KOKORO_DIR=<…/kokoro-int8-en-v0_19> SHERPA_DIR=<…/node_modules/sherpa-onnx-node> node tools/audio.cjs [--slow] [--noise] [id…]
// Cần ffmpeg (libmp3lame).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const KOKORO = process.env.KOKORO_DIR || '/tmp/claude-0/tts/package/kokoro-int8-en-v0_19';
const SHERPA = process.env.SHERPA_DIR || '/tmp/claude-0/tts/run/node_modules/sherpa-onnx-node';
// Thứ tự giọng trong voices.bin của bản Kokoro v0.19 (sherpa-onnx): Mỹ (a…), Anh (b…); f = nữ, m = nam.
const VOICES = ['af', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis'];
const args = process.argv.slice(2), want = new Set(args.filter(a => !a.startsWith('--')));
const SLOW = args.includes('--slow'), NOISE = args.includes('--noise');

function walk(d) { if (!fs.existsSync(d)) return []; return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.json') ? [path.join(d, e.name)] : []).sort(); }

let tts = null;
function engine() {
  if (tts) return tts;
  const sherpa = require(SHERPA);
  const M = KOKORO + '/';
  tts = { sherpa, t: new sherpa.OfflineTts({ model: { kokoro: { model: M + 'model.int8.onnx', voices: M + 'voices.bin', tokens: M + 'tokens.txt', dataDir: M + 'espeak-ng-data' }, numThreads: 4, provider: 'cpu' }, maxNumSentences: 1 }) };
  return tts;
}

// Đọc chữ số, ký hiệu theo kiểu người nói trong đề (giữ nguyên chính tả trong lời thoại hiển thị).
const speakable = t => t.replace(/£(\d+)/g, '$1 pounds').replace(/\$(\d+)/g, '$1 dollars').replace(/(\d)\s?%/g, '$1 percent');

function synth(lines, voices, speed) {
  const { sherpa, t } = engine(), sr = 24000, out = [];
  let prev = null;
  for (const l of lines) {
    const v = voices[l.sp]; const sid = VOICES.indexOf(v);
    if (sid < 0) throw new Error(`người nói "${l.sp}" chưa có giọng hợp lệ (${v})`);
    const gap = prev === null ? 0.3 : prev === l.sp ? 0.35 : 0.6;
    out.push(new Float32Array(Math.round(gap * sr)));
    const a = t.generate({ text: speakable(l.t), sid, speed });
    out.push(a.samples);
    prev = l.sp;
  }
  out.push(new Float32Array(Math.round(0.5 * sr)));
  const n = out.reduce((s, x) => s + x.length, 0), all = new Float32Array(n);
  let o = 0; for (const x of out) { all.set(x, o); o += x.length; }
  return { samples: all, sr, sherpa };
}

function encode(samples, sr, sherpa, file, noise) {
  const wav = path.join(require('os').tmpdir(), 'el-audio-' + process.pid + '.wav');
  sherpa.writeWave(wav, { samples, sampleRate: sr });
  const filt = noise ? ['-filter_complex', 'anoisesrc=color=pink:amplitude=0.03:r=24000[n];[0:a][n]amix=inputs=2:duration=first:weights=1 1[a]', '-map', '[a]'] : [];
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, ...filt, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '32k', file]);
  fs.unlinkSync(wav);
  return samples.length / sr;
}

const manPath = path.join(ROOT, 'a/manifest.json');
fs.mkdirSync(path.join(ROOT, 'a'), { recursive: true });
const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
let made = 0;
for (const f of walk(path.join(ROOT, 'content/exam'))) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8')), arr = Array.isArray(data) ? data : [data];
  let changed = false;
  for (const g of arr) {
    if (g.kind !== 'listening' || !g.script || (want.size && !want.has(g.id))) continue;
    if (!g.voices) throw new Error(`${g.id}: thiếu "voices" (người nói → giọng)`);
    const variants = [['file', 1, false, ''], ...(SLOW || g.mode === 'practice' ? [['slow', 0.8, false, '.slow']] : []), ...(NOISE || g.mode === 'practice' ? [['noise', 1, true, '.noise']] : [])];
    for (const [key, speed, noise, suf] of variants) {
      const rel = `a/${g.id}${suf}.mp3`, h = crypto.createHash('sha256').update(JSON.stringify([g.script, g.voices, speed, noise, 'kokoro-int8-v0.19', 32])).digest('hex').slice(0, 16);
      if (man[rel] && man[rel].h === h && fs.existsSync(path.join(ROOT, rel))) { if (key === 'file' && (!g.audio || g.audio.file !== rel)) { g.audio = { file: rel, dur: man[rel].dur, voices: [...new Set(Object.values(g.voices))] }; changed = true; } continue; }
      const { samples, sr, sherpa } = synth(g.script, g.voices, speed);
      const dur = Math.round(encode(samples, sr, sherpa, path.join(ROOT, rel), noise) * 10) / 10;
      man[rel] = { h, dur };
      made++;
      if (key === 'file') g.audio = { ...(g.audio || {}), file: rel, dur, voices: [...new Set(Object.values(g.voices))] };
      else g.audio = { ...(g.audio || {}), [key]: rel };
      changed = true;
      console.log(`âm thanh: ${rel} (${dur}s)`);
    }
  }
  if (changed) fs.writeFileSync(f, JSON.stringify(Array.isArray(data) ? arr : arr[0], null, 2) + '\n');
}
fs.writeFileSync(manPath, JSON.stringify(Object.fromEntries(Object.entries(man).sort()), null, 1) + '\n');
console.log(`audio: tạo ${made} tệp`);
