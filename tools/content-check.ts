#!/usr/bin/env node
// Kiểm toàn bộ nội dung ôn thi (content/exam/**/*.json): lược đồ JSON + kiểm nghĩa (8.3) + kiểm cấp từ vựng (8.4) + tệp âm thanh có thật.
// Thoát mã 1 nếu có lỗi (CI chặn gộp). Dùng: npm run content
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { checkAll, levelReport } from '../src/content/check.ts';
import type { Group } from '../src/exam/content.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'content/exam');

function walk(d: string): string[] {
  if (!existsSync(d)) return [];
  return readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; });
}

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(JSON.parse(readFileSync(join(ROOT, 'content/schema/group.schema.json'), 'utf8')));
const list = JSON.parse(readFileSync(join(ROOT, 'content/wordlist.json'), 'utf8')) as Record<string, string>;

const groups: Group[] = [];
let schemaErr = 0;
for (const f of walk(DIR)) {
  const rel = relative(ROOT, f);
  let data: unknown;
  try { data = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.error(`✗ ${rel}: JSON hỏng (${(e as Error).message})`); schemaErr++; continue; }
  const arr = Array.isArray(data) ? data : [data];
  for (const g of arr) {
    if (!validate(g)) { schemaErr++; console.error(`✗ ${rel} ${(g as { id?: string }).id ?? ''}: sai lược đồ ${ajv.errorsText(validate.errors)}`); continue; }
    groups.push(g as Group);
    const a = (g as Group).audio;
    if ((g as Group).kind === 'listening' && !a) { schemaErr++; console.error(`✗ ${(g as Group).id}: bài nghe chưa có âm thanh (chạy tools/audio.cjs)`); }
    if (a) for (const p of [a.file, a.slow, a.noise]) if (p && !existsSync(join(ROOT, p))) { schemaErr++; console.error(`✗ ${(g as Group).id}: thiếu tệp âm thanh ${p}`); }
  }
}
const issues = checkAll(groups, list);
for (const i of issues) console.error(`✗ ${i.where}: ${i.msg}`);
const items = groups.reduce((s, g) => s + g.items.length, 0);
const worst = groups.map(g => ({ id: g.id, r: levelReport(g, list).ratio })).sort((p, q) => q.r - p.r)[0];
console.log(`content: ${groups.length} nhóm, ${items} câu; ${schemaErr + issues.length} lỗi${worst ? `; tỉ lệ từ vượt cấp cao nhất ${(worst.r * 100).toFixed(1)}% (${worst.id})` : ''}`);
process.exit(schemaErr + issues.length ? 1 : 0);
