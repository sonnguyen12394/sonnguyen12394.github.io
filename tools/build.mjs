#!/usr/bin/env node
// Build của English Ladder. Kết quả vẫn là web tĩnh (GitHub Pages), được commit cùng mã nguồn:
//   1. src/exam/main.ts → x/exam.<băm>.js (esbuild, ES module, nén);
//   2. ghi tên tệp đó vào app.js (const EXAM_JS) để app nạp đúng bản;
//   3. đồng bộ số bản phát hành (APP_VERSION trong app.js) sang sw.js (VERSION, CORE) và index.html (?v=).
// CI chạy `npm run fresh`: build lại rồi kiểm không có khác biệt, nên tệp đã commit luôn khớp mã nguồn.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expandPart, isMockPart } from '../src/exam/mock.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = f => join(ROOT, f);
const hash = buf => createHash('sha256').update(buf).digest('hex').slice(0, 10);

function setLine(file, re, line) {
  const s = readFileSync(P(file), 'utf8');
  if (!re.test(s)) throw new Error(`${file}: không thấy ${re}`);
  const out = s.replace(re, () => line);
  if (out !== s) writeFileSync(P(file), out);
}

// 0. Nội dung ôn thi: content/exam/**/*.json → data/exam/<gói>.<băm>.json (tải dần theo gói) + src/exam/gen/index.json
//    (danh sách gói và tham số từng câu, đóng vào mô-đun để ước tính band mà không phải tải gói). Kiểm nội dung ở tools/content-check.ts.
const QSKILL = q => (q.startsWith('l-') || /^v-l/.test(q) ? 'L' : 'R');
function walk(d) { if (!existsSync(d)) return []; return readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.json') ? [join(d, e.name)] : []).sort(); }
// Đề thi thử: content/exam/mock/index.json là danh mục đề; các tệp khác trong mock/ là danh sách "phần" của đề, mở rộng
// thành nhóm câu thường bằng expandPart (src/exam/mock.ts, dùng chung với app và kiểm nội dung).
const MOCK_INDEX = P('content/exam/mock/index.json');
const groups = walk(P('content/exam')).filter(f => !f.includes('/types/') && f !== MOCK_INDEX).flatMap(f => { const d = JSON.parse(readFileSync(f, 'utf8')); return Array.isArray(d) ? d : [d]; })
  .flatMap(g => isMockPart(g) ? expandPart(g) : [g])
  .filter(g => g && g.id && Array.isArray(g.items)).sort((a, b) => (a.id < b.id ? -1 : 1));
const mockTests = existsSync(MOCK_INDEX) ? JSON.parse(readFileSync(MOCK_INDEX, 'utf8')) : [];
const packOf = g => g.mode === 'place' ? 'place' : g.mode === 'mock' ? 'm-' + (/^m-([a-z0-9]+)-/.exec(g.id) || [, 'x'])[1] : 'p-' + g.qtype;
const packs = {};
for (const g of groups) (packs[packOf(g)] ||= []).push(g);
mkdirSync(P('data/exam'), { recursive: true });
const index = { packs: {}, items: {}, mocks: [] };
const keep = new Set();
// Hình (sơ đồ, bản đồ) vẽ bằng SVG ở content/fig/<id>.svg, nhúng vào gói để dùng offline cùng một lần tải.
// Chỉ nhận SVG tĩnh: không script, không thuộc tính on*, không liên kết ngoài (tools/content-check.ts kiểm cùng luật).
const svgOf = id => {
  const f = P(`content/fig/${id}.svg`);
  if (!existsSync(f)) throw new Error(`thiếu hình content/fig/${id}.svg`);
  const svg = readFileSync(f, 'utf8').replace(/<\?xml[^>]*>\s*/, '').trim();
  if (/<script|<foreignObject|\son\w+\s*=|(?:href|src)\s*=\s*["'](?!#)/i.test(svg)) throw new Error(`hình ${id} không an toàn`);
  return svg;
};
for (const [name, gs] of Object.entries(packs).sort(([a], [b]) => (a < b ? -1 : 1))) {
  const body = Buffer.from(JSON.stringify(gs.map(g => g.figure ? { ...g, svg: svgOf(g.figure) } : g)));
  const file = `data/exam/${name}.${hash(body)}.json`;
  keep.add(file.slice('data/exam/'.length));
  if (!existsSync(P(file))) writeFileSync(P(file), body);
  index.packs[name] = { file, groups: gs.length, items: gs.reduce((n, g) => n + g.items.length, 0), qtypes: [...new Set(gs.map(g => g.qtype))].sort(), exams: [...new Set(gs.flatMap(g => g.exams))].sort() };
  for (const g of gs) for (const it of g.items) index.items[it.id] = [it.b, guessOf(g, it), QSKILL(g.qtype), g.qtype];
}
function guessOf(g, it) {
  if (typeof it.ans === 'string') { const n = (it.opts || g.options || []).length; return n ? Math.round(100 / n) / 100 : 0; }
  if (Array.isArray(it.ans)) return 0.1;
  return 0;
}
// Bài học các dạng câu: một gói nhỏ "types"
const types = walk(P('content/exam/types')).map(f => JSON.parse(readFileSync(f, 'utf8'))).sort((a, b) => (a.id < b.id ? -1 : 1));
if (types.length) {
  const body = Buffer.from(JSON.stringify(types)), file = `data/exam/types.${hash(body)}.json`;
  keep.add(file.slice('data/exam/'.length));
  if (!existsSync(P(file))) writeFileSync(P(file), body);
  index.packs.types = { file, groups: 0, items: 0, qtypes: types.map(t => t.id), exams: [] };
}
// Danh mục đề (nhỏ, đóng vào mô-đun để liệt kê đề mà không phải tải gói). Số điểm mỗi kỹ năng tính từ nội dung thật.
for (const t of mockTests) {
  const n = sk => groups.filter(g => t[sk].includes(g.part)).reduce((s, g) => s + g.items.reduce((k, it) => k + (Array.isArray(it.ans) ? it.ans.length : 1), 0), 0);
  // Thời lượng âm thanh phần Nghe (giây), để trang đầu đề nói đúng thời gian thật thay vì số danh nghĩa.
  const dur = Math.round([...new Set(groups.filter(g => t.L.includes(g.part)).map(g => g.part))].reduce((s, p) => s + (groups.find(g => g.part === p).audio?.dur ?? 0), 0));
  index.mocks.push({ id: t.id, exam: t.exam, title: t.title, L: t.L, R: t.R, ...(t.adj ? { adj: t.adj } : {}), n: { L: n('L'), R: n('R') }, dur });
}
// Viết/Nói theo kỳ thi (IELTS) + bài mẫu chú thích band: content/ws/*.json → data/exam/ws.<băm>.json; app.js tải khi mở thi thử
// Viết/Nói (WS_JSON). Hình biểu đồ Task 1 nhúng như hình của gói câu.
let wsFile = null;
if (existsSync(P('content/ws'))) {
  const ws = { samples: [] };
  for (const f of readdirSync(P('content/ws')).filter(f => f.endsWith('.json')).sort()) {
    const d = JSON.parse(readFileSync(P('content/ws/' + f), 'utf8'));
    if (Array.isArray(d)) ws.samples.push(...d); else Object.assign(ws, d);
  }
  ws.samples.sort((a, b) => (a.id < b.id ? -1 : 1));
  for (const t of ws.w1ac || []) if (t.fig) t.svg = svgOf(t.fig.replace(/\.svg$/, ''));
  const body = Buffer.from(JSON.stringify(ws));
  wsFile = `data/exam/ws.${hash(body)}.json`;
  keep.add(wsFile.slice('data/exam/'.length));
  if (!existsSync(P(wsFile))) writeFileSync(P(wsFile), body);
}
for (const f of readdirSync(P('data/exam'))) if (!keep.has(f)) unlinkSync(P('data/exam/' + f));
mkdirSync(P('src/exam/gen'), { recursive: true });
const idxText = JSON.stringify(index) + '\n';
if (!existsSync(P('src/exam/gen/index.json')) || readFileSync(P('src/exam/gen/index.json'), 'utf8') !== idxText) writeFileSync(P('src/exam/gen/index.json'), idxText);

// 0b. Engine (docs/SPEC.md): content/engine/{nodes,edges,goals} → data/engine/graph.<băm>.json (tải khi cần)
//     + src/engine/gen/meta.json (danh mục mục tiêu, đóng vào mô-đun để màn chọn mục tiêu mở ngay).
const ENG = P('content/engine');
const eNodes = JSON.parse(readFileSync(join(ENG, 'nodes.json'), 'utf8')), eEdges = JSON.parse(readFileSync(join(ENG, 'edges.json'), 'utf8'));
const eGoals = readdirSync(join(ENG, 'goals')).filter(f => f.endsWith('.json')).sort().map(f => JSON.parse(readFileSync(join(ENG, 'goals', f), 'utf8')));
const gBody = Buffer.from(JSON.stringify({ nodes: eNodes, edges: eEdges, goals: eGoals }));
const gFile = `data/engine/graph.${hash(gBody)}.json`;
mkdirSync(P('data/engine'), { recursive: true });
for (const f of readdirSync(P('data/engine'))) if (`data/engine/${f}` !== gFile) unlinkSync(P('data/engine/' + f));
if (!existsSync(P(gFile))) writeFileSync(P(gFile), gBody);
mkdirSync(P('src/engine/gen'), { recursive: true });
const metaText = JSON.stringify({ file: gFile, nodes: eNodes.length, edges: eEdges.length,
  goals: eGoals.map(g => ({ id: g.id, kind: g.kind, vi: g.vi, target: g.target, cefr: g.cefr, version: g.version, status: g.status, n: g.req.length })) }) + '\n';
if (!existsSync(P('src/engine/gen/meta.json')) || readFileSync(P('src/engine/gen/meta.json'), 'utf8') !== metaText) writeFileSync(P('src/engine/gen/meta.json'), metaText);

// 1. Mô-đun ôn thi
const r = await build({
  entryPoints: [P('src/exam/main.ts')], bundle: true, format: 'esm', target: 'es2020',
  minify: true, write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
});
const code = r.outputFiles[0].contents;
const examName = `x/exam.${hash(code)}.js`;
mkdirSync(P('x'), { recursive: true });
for (const f of readdirSync(P('x'))) if (/^exam\.[0-9a-f]{10}\.js$/.test(f) && `x/${f}` !== examName) unlinkSync(P('x/' + f));
if (!existsSync(P(examName)) || !readFileSync(P(examName)).equals(Buffer.from(code))) writeFileSync(P(examName), code);

// 1b. Mô-đun engine
const re = await build({
  entryPoints: [P('src/engine/main.ts')], bundle: true, format: 'esm', target: 'es2020',
  minify: true, write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
});
const ecode = re.outputFiles[0].contents;
const engName = `x/engine.${hash(ecode)}.js`;
for (const f of readdirSync(P('x'))) if (/^engine\.[0-9a-f]{10}\.js$/.test(f) && `x/${f}` !== engName) unlinkSync(P('x/' + f));
if (!existsSync(P(engName)) || !readFileSync(P(engName)).equals(Buffer.from(ecode))) writeFileSync(P(engName), ecode);

// 1c. Lõi dùng chung (FSRS + ghi bằng chứng mastery): script thường, biến toàn cục ELCORE, nạp trước app.js.
const rc = await build({
  entryPoints: [P('src/engine/core.ts')], bundle: true, format: 'iife', globalName: 'ELCORE', target: 'es2020',
  minify: true, write: false, legalComments: 'none', charset: 'utf8', logLevel: 'warning',
});
const ccode = rc.outputFiles[0].contents;
const coreName = `x/core.${hash(ccode)}.js`;
for (const f of readdirSync(P('x'))) if (/^core\.[0-9a-f]{10}\.js$/.test(f) && `x/${f}` !== coreName) unlinkSync(P('x/' + f));
if (!existsSync(P(coreName)) || !readFileSync(P(coreName)).equals(Buffer.from(ccode))) writeFileSync(P(coreName), ccode);

// 2. app.js biết tên tệp
setLine('app.js', /^const EXAM_JS = .*$/m, `const EXAM_JS = '${examName}';   // tools/build.mjs ghi`);
setLine('app.js', /^const ENGINE_JS = .*$/m, `const ENGINE_JS = '${engName}';   // tools/build.mjs ghi`);
if (wsFile) setLine('app.js', /^const WS_JSON = .*$/m, `const WS_JSON = '${wsFile}';   // tools/build.mjs ghi`);

// 3. Số bản phát hành
const app = readFileSync(P('app.js'), 'utf8');
const ver = Number((/APP_VERSION = (\d+)/.exec(app) || [])[1]);
if (!ver) throw new Error('không đọc được APP_VERSION');
setLine('sw.js', /^const VERSION = .*$/m, `const VERSION = 'vl-v${ver}';`);
setLine('sw.js', /^const CORE = .*$/m, `const CORE = ['./', 'index.html', 'app.js?v=${ver}', '${coreName}', '${examName}', '${engName}', 'manifest.webmanifest', 'privacy.html', 'icons/icon-192.png', 'icons/icon-512.png'];`);
setLine('index.html', /^(<script src="x\/core\.[0-9a-f]{10}\.js" defer><\/script>)?<script src="app\.js\?v=\d+"( defer)?><\/script>$/m, `<script src="${coreName}" defer></script><script src="app.js?v=${ver}" defer></script>`);

console.log(`build: ${engName} (${(ecode.length / 1024).toFixed(1)} KB), đồ thị ${gFile} (${(gBody.length / 1024).toFixed(0)} KB); ${examName} (${(code.length / 1024).toFixed(1)} KB), bản ${ver}; nội dung ${groups.length} nhóm, ${Object.keys(index.items).length} câu, ${Object.keys(index.packs).length} gói`);
