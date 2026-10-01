#!/usr/bin/env node
// Tạo content/wordlist.json: từ → cấp CEFR thấp nhất, lấy từ danh sách từ A1–C2 của app (CONTENT trong app.js),
// gồm cả từ phái sinh trong forms/family. Dùng để kiểm cấp độ từ vựng của bài đọc/nghe (yêu cầu 8.4).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const s = readFileSync(join(ROOT, 'app.js'), 'utf8');
const a = s.indexOf('\nconst CONTENT = ');
const lines = s.slice(a + 1).split('\n');
let j = 1;
while (j < lines.length && !/^(const|let|var|function|async function|\/\*|\/\/)/.test(lines[j])) j++;
const C = vm.runInNewContext('(' + lines.slice(0, j).join('\n').replace(/^const CONTENT = /, '').replace(/;\s*$/, '') + ')');
const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const out = {};
const put = (w, L) => {
  w = String(w).toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').replace(/[’]/g, "'").trim();
  if (!w || /[^a-z' -]/.test(w)) return;
  for (const part of w.includes(' ') ? [w] : [w]) if (!out[part] || ORDER.indexOf(L) < ORDER.indexOf(out[part])) out[part] = L;
};
for (const L of C.levels) for (const u of L.units) for (const w of u.words) {
  put(w.word, L.id);
  for (const f of w.forms || []) put(f[1], L.id);
  for (const f of w.family || []) put(f, L.id);
}
const sorted = Object.fromEntries(Object.entries(out).sort(([p], [q]) => (p < q ? -1 : 1)));
writeFileSync(join(ROOT, 'content/wordlist.json'), JSON.stringify(sorted, null, 0).replace(/,"/g, ',\n"') + '\n');
console.log(`wordlist: ${Object.keys(sorted).length} mục`);
