#!/usr/bin/env node
// Chấm phép thử "không có bài" (xem tools/blind-export.mjs). Đầu vào: một hoặc nhiều tệp JSON {id: chữ cái} (mỗi phiên một tệp).
// In tỉ lệ đúng theo dạng so với mức ngẫu nhiên; thoát mã 1 nếu dạng nào vượt ngưỡng nghiệm thu
// (≤ 45% với 4 phương án, ≤ 55% với 3 phương án — ngẫu nhiên 25%/33% cộng biên cho may rủi và hiểu biết chung chính đáng).
// Câu trả lời có thể kèm độ tự tin "C/H" (H chắc, M có lý do, L đoán): câu đoán đúng với độ tự tin H là câu cần viết lại trước.
// Dùng: node tools/blind-score.mjs phien1.json [phien2.json …]
import { readFileSync } from 'node:fs';
import { loadGroups, optsOf } from './groups.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../content/exam');
const key = new Map();
for (const g of loadGroups(ROOT)) for (const it of g.items) if (typeof it.ans === 'string' && optsOf(it, g).length) key.set(it.id, { ans: it.ans, q: (g.mode === 'mock' ? 'đề:' : '') + g.qtype, n: optsOf(it, g).length });
const runs = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
const st = new Map(), hits = new Map(), sure = new Set();
for (const r of runs) for (const [id, a] of Object.entries(r)) {
  const k = key.get(id); if (!k) { console.log(`? ${id}: không có trong kho`); continue; }
  const s = st.get(k.q) ?? { n: 0, ok: 0, opts: 0 }; s.n++; s.opts += k.n;
  const [letter, conf] = String(a).trim().toUpperCase().split('/');
  if (letter === String(k.ans).toUpperCase()) { s.ok++; hits.set(id, (hits.get(id) ?? 0) + 1); if (conf === 'H') sure.add(id); }
  st.set(k.q, s);
}
let fail = false;
for (const [q, s] of [...st].sort()) {
  const n = Math.round(s.opts / s.n), lim = n <= 3 ? 0.55 : 0.45, p = s.ok / s.n, bad = p > lim; fail ||= bad;
  console.log(`${bad ? '✗' : '✓'} ${q.padEnd(10)} ${String(s.ok).padStart(3)}/${String(s.n).padEnd(3)} ${Math.round(p * 100)}%  (ngẫu nhiên ${Math.round(100 / n)}%, ngưỡng ${Math.round(lim * 100)}%)`);
}
const all = [...hits].filter(([, c]) => c === runs.length).map(([id]) => id);
if (runs.length > 1) console.log(`Đoán đúng ở cả ${runs.length} phiên (${all.length}): ${all.join(' ')}`);
if (sure.size) console.log(`Đoán đúng với độ tự tin cao (${sure.size}): ${[...sure].join(' ')}`);
process.exit(fail ? 1 : 0);
