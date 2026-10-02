#!/usr/bin/env node
// Phép thử "không có bài" (yêu cầu 8.5): xuất CÂU HỎI + PHƯƠNG ÁN, không bài đọc/lời thoại, không đáp án.
// Dán nguyên văn vào lời nhắc của một phiên AI mới, CẤM dùng công cụ (phiên đọc được kho sẽ thấy đáp án),
// rồi chấm bằng tools/blind-score.mjs. Câu tốt chỉ trả lời được khi đọc/nghe bài, nên tỉ lệ đúng phải gần mức ngẫu nhiên.
// Dùng: node tools/blind-export.mjs [--type pl-r,v-r] [--mock a1] [--sample N] [--seed S] > out.txt
// --mock: chỉ câu của một đề thi thử, kể cả câu dùng phương án chung (TRUE/FALSE/NOT GIVEN, tiêu đề, nối).
import { loadGroups, optsOf } from './groups.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../content/exam');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const types = arg('--type')?.split(','), mock = arg('--mock'), sample = Number(arg('--sample') ?? 0);
let seed = Number(arg('--seed') ?? 1);
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const by = new Map();
for (const g of loadGroups(ROOT)) {
  if (types && !types.includes(g.qtype)) continue;
  if (mock && !g.id.startsWith(`m-${mock}-`)) continue;
  for (const it of g.items) if (typeof it.ans === 'string' && (it.opts || (mock && g.options))) by.set(g.qtype, [...(by.get(g.qtype) ?? []), { ...it, opts: optsOf(it, g) }]);
}
const out = [];
for (const [, its] of by) {
  let pick = its;
  if (sample && its.length > sample) { pick = its.map(it => [rnd(), it]).sort((a, b) => a[0] - b[0]).slice(0, sample).map(x => x[1]); }
  for (const it of pick) out.push(`[${it.id}] ${it.q}\n  ${it.opts.map(o => `${o.k}) ${o.t}`).join('   ')}`);
}
process.stdout.write(out.join('\n') + '\n');
