#!/usr/bin/env node
// Xuất câu hỏi để SOÁT ĐỘC LẬP (yêu cầu 8.5): chỉ có bài đọc/lời thoại, câu hỏi, phương án — không đáp án, không giải thích.
// Một phiên AI khác tự làm từng câu; tools/review-compare.mjs so với đáp án và đánh dấu chỗ khác nhau để người soạn/chủ app quyết.
// Dùng: node tools/review-export.mjs <thư mục content> <tệp ra>
import { readFileSync, writeFileSync } from 'node:fs';
import { loadGroups } from './groups.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const FIG = join(dirname(fileURLToPath(import.meta.url)), '../content/fig');
const [dir, out] = process.argv.slice(2);
const lines = [];
let lastPart = '';
for (const g of loadGroups(dir)) {
  // Đề thi thử: ngữ liệu của một phần chỉ in một lần, các bộ câu sau in tiếp bên dưới.
  const same = g.part && g.part === lastPart;
  lastPart = g.part ?? '';
  lines.push(`### ${g.id} (${g.kind}, ${g.level}) — ${g.title}`, g.instr);
  if (g.paras && !same) lines.push(...g.paras);
  if (g.script && !same) lines.push(...g.script.map(l => `${l.sp === 'N' ? '[Narrator]' : l.sp + ':'} ${l.t}`));
  if (g.figure) { const svg = readFileSync(join(FIG, g.figure + '.svg'), 'utf8'); lines.push(`[Diagram: ${(/<title[^>]*>([^<]*)/.exec(svg) || [])[1]}. ${(/<desc[^>]*>([^<]*)/.exec(svg) || [])[1] ?? ''}]`); }
  if (g.options) lines.push('Options: ' + g.options.map(o => `${o.k}) ${o.t}`).join(' | '));
  for (const it of g.items) lines.push(`- [${it.id}] ${it.q}` + (it.opts ? '\n  ' + it.opts.map(o => `${o.k}) ${o.t}`).join('   ') : '') + (it.limit ? `\n  (NO MORE THAN ${['', 'ONE WORD', 'TWO WORDS', 'THREE WORDS', 'FOUR WORDS', 'FIVE WORDS'][it.limit]}${it.num ? ' AND/OR A NUMBER' : ''})` : ''));
  lines.push('');
}
writeFileSync(out, lines.join('\n'));
console.log(`review-export: ${out}`);
