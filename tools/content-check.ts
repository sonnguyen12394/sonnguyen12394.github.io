#!/usr/bin/env node
// Kiểm toàn bộ nội dung ôn thi (content/exam/**/*.json): lược đồ JSON + kiểm nghĩa (8.3) + kiểm cấp từ vựng (8.4) + tệp âm thanh có thật.
// Thoát mã 1 nếu có lỗi (CI chặn gộp). Dùng: npm run content
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import { checkAll, checkMock, levelReport, suggestVariants } from '../src/content/check.ts';
import { expandPart, isMockPart, type MockTest } from '../src/exam/mock.ts';
import { QT } from '../src/exam/content.ts';
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

const validateType = ajv.compile(JSON.parse(readFileSync(join(ROOT, 'content/schema/type.schema.json'), 'utf8')));
const groups: Group[] = [];
let schemaErr = 0;
const VI = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const typeIds = new Set<string>();
for (const f of walk(join(DIR, 'types'))) {
  const t = JSON.parse(readFileSync(f, 'utf8')) as { id: string; lesson: string[]; steps: string[]; tips: string[]; traps: string[] };
  if (!validateType(t)) { schemaErr++; console.error(`✗ ${relative(ROOT, f)}: sai lược đồ ${ajv.errorsText(validateType.errors)}`); continue; }
  if (!QT[t.id]) { schemaErr++; console.error(`✗ ${relative(ROOT, f)}: dạng câu "${t.id}" không có trong danh mục`); }
  for (const s of [...t.lesson, ...t.steps, ...t.tips, ...t.traps]) if (!VI.test(s)) { schemaErr++; console.error(`✗ ${t.id}: câu bài học phải bằng tiếng Việt: ${s.slice(0, 40)}`); }
  typeIds.add(t.id);
}
const MOCK_INDEX = join(DIR, 'mock/index.json');
const tests: MockTest[] = existsSync(MOCK_INDEX) ? JSON.parse(readFileSync(MOCK_INDEX, 'utf8')) as MockTest[] : [];
const PART_KEYS = new Set(['id', 'kind', 'exams', 'level', 'band', 'title', 'paras', 'script', 'audio', 'vi', 'voices', 'allow', 'tips', 'sets']);
const SET_KEYS = new Set(['qtype', 'instr', 'options', 'figure', 'items']);
for (const f of walk(DIR).filter(p => !p.includes('/types/') && p !== MOCK_INDEX)) {
  const rel = relative(ROOT, f);
  let data: unknown;
  try { data = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { console.error(`✗ ${rel}: JSON hỏng (${(e as Error).message})`); schemaErr++; continue; }
  const arr = (Array.isArray(data) ? data : [data]).flatMap(g => {
    if (!isMockPart(g)) return [g];
    // Phần đề thi thử: khoá lạ ở phần/bộ câu bị bỏ qua khi mở rộng, nên báo ngay (lược đồ nhóm kiểm phần còn lại).
    for (const k of Object.keys(g)) if (!PART_KEYS.has(k)) { schemaErr++; console.error(`✗ ${rel} ${g.id}: khoá lạ "${k}" ở phần đề`); }
    for (const st of g.sets) for (const k of Object.keys(st)) if (!SET_KEYS.has(k)) { schemaErr++; console.error(`✗ ${rel} ${g.id}: khoá lạ "${k}" ở bộ câu`); }
    return expandPart(g);
  });
  for (const g of arr) {
    if (!validate(g)) { schemaErr++; console.error(`✗ ${rel} ${(g as { id?: string }).id ?? ''}: sai lược đồ ${ajv.errorsText(validate.errors)}`); continue; }
    groups.push(g as Group);
    const a = (g as Group).audio;
    if ((g as Group).kind === 'listening' && !a) { schemaErr++; console.error(`✗ ${(g as Group).id}: bài nghe chưa có âm thanh (chạy tools/audio.cjs)`); }
    if (a) for (const p of [a.file, a.slow, a.noise]) if (p && !existsSync(join(ROOT, p))) { schemaErr++; console.error(`✗ ${(g as Group).id}: thiếu tệp âm thanh ${p}`); }
    const fig = (g as Group).figure;
    if (fig) {
      const fp = join(ROOT, 'content/fig', fig + '.svg');
      if (!existsSync(fp)) { schemaErr++; console.error(`✗ ${(g as Group).id}: thiếu hình content/fig/${fig}.svg`); }
      else {
        const svg = readFileSync(fp, 'utf8');
        // cùng luật với tools/build.mjs: chỉ SVG tĩnh, có <title> cho trình đọc màn hình (WCAG 1.1.1)
        if (/<script|<foreignObject|\son\w+\s*=|(?:href|src)\s*=\s*["'](?!#)/i.test(svg)) { schemaErr++; console.error(`✗ ${fig}.svg: có script/thuộc tính sự kiện/liên kết ngoài`); }
        if (!/<title[^>]*>[^<]{5,}<\/title>/.test(svg)) { schemaErr++; console.error(`✗ ${fig}.svg: thiếu <title> mô tả hình`); }
        // Người dùng trình đọc màn hình chỉ có <desc>: mỗi nhãn số được hỏi phải được định vị trong đó (WCAG 1.1.1).
        const desc = /<desc[^>]*>([^<]*)<\/desc>/.exec(svg)?.[1] ?? '';
        for (const it of (g as Group).items) if (/^\d+$/.test(it.q) && !new RegExp(`(?:number|numbered) ${it.q}\\b`, 'i').test(desc)) { schemaErr++; console.error(`✗ ${fig}.svg: <desc> không nói vị trí nhãn ${it.q} (${it.id})`); }
      }
    }
  }
}
const issues = [...checkAll(groups, list), ...checkMock(tests, groups)];
// Mỗi dạng câu có bài luyện phải có bài học (6.2)
for (const q of new Set(groups.filter(g => g.mode === 'practice').map(g => g.qtype))) if (!typeIds.has(q)) issues.push({ where: q, msg: 'dạng câu có bài luyện nhưng chưa có bài học (content/exam/types)' });
for (const i of issues) console.error(`✗ ${i.where}: ${i.msg}`);
for (const i of suggestVariants(groups)) console.warn(`⚠ ${i.where}: ${i.msg}`);
const items = groups.reduce((s, g) => s + g.items.length, 0);
const worst = groups.map(g => ({ id: g.id, r: levelReport(g, list).ratio })).sort((p, q) => q.r - p.r)[0];
console.log(`content: ${groups.length} nhóm, ${items} câu; ${schemaErr + issues.length} lỗi${worst ? `; tỉ lệ từ vượt cấp cao nhất ${(worst.r * 100).toFixed(1)}% (${worst.id})` : ''}`);
process.exit(schemaErr + issues.length ? 1 : 0);
