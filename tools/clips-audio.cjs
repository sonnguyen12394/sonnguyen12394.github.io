#!/usr/bin/env node
// v120 Thu âm thanh sẵn cho các câu app đọc to ở cấp Pre-A1–B1 (danh sách: content/clips.json, tạo bằng tools/clips-list.mjs).
// Mỗi câu một tệp a/c/<khoá>.mp3 (Kokoro-82M int8 qua sherpa-onnx, 24 kHz, MP3 32 kbps mono như tools/audio.cjs).
// Khoá do app tính (clipKey trong app.js): giọng a / b + băm câu đã chuẩn hoá. Giọng a = giọng chính, b = người B trong hội thoại.
// a/c/manifest.json giữ băm (câu, giọng, tốc độ, mô hình) của từng tệp: chạy lại chỉ thu câu mới / câu đổi, xoá tệp không còn dùng.
// Cuối cùng ghi danh mục khoá a/c/index.<băm>.json (app tải để biết câu nào có tệp); tools/build.mjs ghi tên đó vào app.js.
// Chuẩn bị như tools/audio.cjs (KOKORO_DIR, SHERPA_DIR, ffmpeg). Chia việc cho nhiều tiến trình: --shard=i/n (chạy n lệnh song song,
// rồi một lệnh không --shard để ghi manifest / danh mục).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const KOKORO = process.env.KOKORO_DIR || '/tmp/claude-0/tts/package/kokoro-int8-en-v0_19';
const SHERPA = process.env.SHERPA_DIR || '/tmp/claude-0/tts/run/node_modules/sherpa-onnx-node';
const VOICES = ['af', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'am_adam', 'am_michael', 'bf_emma', 'bf_isabella', 'bm_george', 'bm_lewis'];
const VOICE = { a: 'af_bella', b: 'am_michael' }, SPEED = 0.95, MODEL = 'kokoro-int8-v0.19', KBPS = 32;
const args = process.argv.slice(2), shardArg = args.find(a => a.startsWith('--shard='));
const [SHARD, NSHARD] = shardArg ? shardArg.slice(8).split('/').map(Number) : [0, 1];
const LIMIT = Number((args.find(a => a.startsWith('--limit=')) || '').slice(8)) || Infinity;

const DIR = path.join(ROOT, 'a/c'), manPath = path.join(DIR, 'manifest.json');
fs.mkdirSync(DIR, { recursive: true });
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/clips.json'), 'utf8'));
// Lời đọc: ký hiệu bộ phiên âm của Kokoro bỏ qua thì viết thành chữ (chữ số, %, $ đọc đúng sẵn). Băm theo lời đọc.
const speakable = t => t.replace(/(\d)\s?°C\b/g, '$1 degrees Celsius').replace(/(\d)\s?°F\b/g, '$1 degrees Fahrenheit');
const hashOf = c => crypto.createHash('sha256').update(JSON.stringify([speakable(c.t), VOICE[c.k[0]], SPEED, MODEL, KBPS])).digest('hex').slice(0, 12);
const man = fs.existsSync(manPath) ? JSON.parse(fs.readFileSync(manPath, 'utf8')) : {};
const fileOf = k => path.join(DIR, k + '.mp3');

let tts = null;
function engine() {
  if (tts) return tts;
  const sherpa = require(SHERPA), M = KOKORO + '/';
  tts = { sherpa, t: new sherpa.OfflineTts({ model: { kokoro: { model: M + 'model.int8.onnx', voices: M + 'voices.bin', tokens: M + 'tokens.txt', dataDir: M + 'espeak-ng-data' }, numThreads: Number(process.env.THREADS || 2), provider: 'cpu' }, maxNumSentences: 1 }) };
  return tts;
}
// Lời đọc: chữ cái đơn đọc như tên chữ ("Letter A."), giữ nguyên câu; khoảng lặng ngắn đầu / cuối để trình duyệt không cắt mất âm đầu.
function make(c) {
  const { sherpa, t } = engine(), sid = VOICES.indexOf(VOICE[c.k[0]]);
  const a = t.generate({ text: speakable(c.t), sid, speed: SPEED }), sr = a.sampleRate || 24000;
  const pad = n => new Float32Array(Math.round(n * sr)), parts = [pad(0.08), a.samples, pad(0.15)];
  const all = new Float32Array(parts.reduce((s, x) => s + x.length, 0)); let o = 0; for (const x of parts) { all.set(x, o); o += x.length; }
  const wav = path.join(os.tmpdir(), `el-clip-${process.pid}.wav`);
  sherpa.writeWave(wav, { samples: all, sampleRate: sr });
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', `${KBPS}k`, fileOf(c.k)]);
  fs.unlinkSync(wav);
}

if (shardArg || LIMIT < Infinity) {
  // Tiến trình thu: chỉ tạo tệp còn thiếu / đã đổi của phần mình; manifest do lệnh tổng hợp ghi.
  // Tệp đã có mà chưa vào manifest (lần chạy trước dừng giữa chừng) coi như xong; lệnh tổng hợp ghi băm cho nó.
  const todo = list.filter((c, i) => i % NSHARD === SHARD && !fs.existsSync(fileOf(c.k)) ).slice(0, LIMIT);
  const t0 = Date.now();
  todo.forEach((c, i) => { make(c); if ((i + 1) % 100 === 0) console.log(`clips ${SHARD}/${NSHARD}: ${i + 1}/${todo.length} (${Math.round((Date.now() - t0) / 1000)} s)`); });
  console.log(`clips ${SHARD}/${NSHARD}: thu ${todo.length} câu trong ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(0);   // --limit chỉ để đo thử; manifest / danh mục do lệnh tổng hợp (không cờ) ghi
}
// Tổng hợp: thu nốt câu còn thiếu (một tiến trình), ghi manifest, xoá tệp thừa, ghi danh mục khoá.
for (const c of list) if (!(man[c.k] === hashOf(c) && fs.existsSync(fileOf(c.k)))) { if (!fs.existsSync(fileOf(c.k)) || man[c.k] !== undefined) make(c); man[c.k] = hashOf(c); }
const keep = new Set(list.map(c => c.k));
for (const f of fs.readdirSync(DIR)) {
  const k = f.replace(/\.mp3$/, '');
  if (f.endsWith('.mp3') && !keep.has(k)) { fs.unlinkSync(path.join(DIR, f)); delete man[k]; }
  if (/^index\.[0-9a-f]{10}\.json$/.test(f)) fs.unlinkSync(path.join(DIR, f));
}
for (const k of Object.keys(man)) if (!keep.has(k)) delete man[k];
fs.writeFileSync(manPath, JSON.stringify(Object.fromEntries(Object.entries(man).sort()), null, 0).replace(/,"/g, ',\n"') + '\n');
const keys = [...keep].sort(), body = JSON.stringify(keys), h = crypto.createHash('sha256').update(body).digest('hex').slice(0, 10);
fs.writeFileSync(path.join(DIR, `index.${h}.json`), body);
const bytes = keys.reduce((s, k) => s + fs.statSync(fileOf(k)).size, 0);
console.log(`clips: ${keys.length} tệp, ${(bytes / 1048576).toFixed(1)} MB; danh mục a/c/index.${h}.json (chạy npm run build để ghi vào app.js)`);
