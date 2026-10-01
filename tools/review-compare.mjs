#!/usr/bin/env node
// So câu trả lời của phiên soát độc lập (JSON {id: đáp án}) với đáp án của bên soạn. In ra câu khác nhau (yêu cầu 8.5).
// Dùng: node tools/review-compare.mjs <thư mục content> <answers.json>
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const [dir, ansFile] = process.argv.slice(2);
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; });
const theirs = JSON.parse(readFileSync(ansFile, 'utf8'));
let n = 0, diff = 0;
for (const f of walk(dir).sort()) for (const g of [JSON.parse(readFileSync(f, 'utf8'))].flat()) for (const it of g.items) {
  n++;
  const mine = typeof it.ans === 'string' ? it.ans : Array.isArray(it.ans) ? [...it.ans].sort().join(',') : it.ans.accept.join(' | ');
  const t = theirs[it.id];
  const same = t !== undefined && (typeof it.ans === 'object' && !Array.isArray(it.ans) ? it.ans.accept.some(a => a.toLowerCase() === String(t).toLowerCase().trim()) : String(t).split(',').map(s => s.trim()).sort().join(',') === mine);
  if (!same) { diff++; console.log(`≠ ${it.id}: bên soạn ${mine} · bên soát ${t ?? '(bỏ trống)'}`); }
}
console.log(`review-compare: ${n} câu, ${diff} câu khác nhau`);
