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
import { validate as validateGraph } from '../src/engine/graph.ts';
import type { Node, Edge, Goal } from '../src/engine/types.ts';

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
// Engine (docs/SPEC.md §1): lược đồ nút/cạnh/mục tiêu + toàn vẹn đồ thị (không vòng lặp, id tồn tại, mục tiêu có phiên bản).
{
  const E = join(ROOT, 'content/engine'), eschema = JSON.parse(readFileSync(join(ROOT, 'content/schema/engine.schema.json'), 'utf8'));
  const eajv = new Ajv({ allErrors: true, schemas: [eschema] });
  const vNode = eajv.getSchema('engine#/definitions/node')!, vEdge = eajv.getSchema('engine#/definitions/edge')!, vGoal = eajv.getSchema('engine#/definitions/goal')!;
  const nodes = JSON.parse(readFileSync(join(E, 'nodes.json'), 'utf8')) as Node[], edges = JSON.parse(readFileSync(join(E, 'edges.json'), 'utf8')) as Edge[];
  const goals = walk(join(E, 'goals')).map(f => JSON.parse(readFileSync(f, 'utf8')) as Goal);
  for (const n of nodes) if (!vNode(n)) { schemaErr++; console.error(`✗ engine nút ${n.id}: ${eajv.errorsText(vNode.errors)}`); }
  for (const e of edges) if (!vEdge(e)) { schemaErr++; console.error(`✗ engine cạnh ${e.from} → ${e.to}: ${eajv.errorsText(vEdge.errors)}`); }
  for (const g of goals) if (!vGoal(g)) { schemaErr++; console.error(`✗ engine mục tiêu ${g.id}: ${eajv.errorsText(vGoal.errors)}`); }
  for (const msg of validateGraph({ nodes, edges, goals })) { schemaErr++; console.error(`✗ engine: ${msg}`); }
  console.log(`engine: ${nodes.length} nút, ${edges.length} cạnh, ${goals.length} mục tiêu`);
}
// Viết/Nói theo kỳ thi + bài mẫu chú thích band (content/ws/*.json): lược đồ, đề mẫu tồn tại, độ dài tối thiểu, đủ các band mỗi loại bài.
{
  const W = join(ROOT, 'content/ws'), wschema = JSON.parse(readFileSync(join(ROOT, 'content/schema/ws.schema.json'), 'utf8'));
  const wajv = new Ajv({ allErrors: true, schemas: [wschema] });
  const V: Record<string, ReturnType<typeof wajv.getSchema>> = Object.fromEntries(['w1ac', 'w1gt', 'w2', 's', 'sample'].map(k => [k, wajv.getSchema(`ws#/definitions/${k}`)]));
  const ws: Record<string, Array<Record<string, unknown>>> = { samples: [] };
  for (const f of existsSync(W) ? walk(W) : []) {
    const d = JSON.parse(readFileSync(f, 'utf8'));
    if (Array.isArray(d)) ws.samples!.push(...d); else for (const [k, v] of Object.entries(d)) { if (!V[k]) { schemaErr++; console.error(`✗ ${relative(ROOT, f)}: khoá lạ "${k}"`); continue; } ws[k] = v as Array<Record<string, unknown>>; }
  }
  for (const k of ['w1ac', 'w1gt', 'w2', 's']) for (const t of ws[k] ?? []) {
    if (!V[k]!(t)) { schemaErr++; console.error(`✗ ws ${String(t.id)}: ${wajv.errorsText(V[k]!.errors)}`); }
    if (k === 'w1ac' && !existsSync(join(ROOT, 'content/fig', String(t.fig).replace(/\.svg$/, '') + '.svg'))) { schemaErr++; console.error(`✗ ws ${String(t.id)}: thiếu hình ${String(t.fig)}`); }
  }
  const ids = new Set(Object.values(ws).flat().map(t => String(t.id)));
  const MIN: Record<string, number> = { w1ac: 150, w1gt: 150, w2: 250, s2: 150, vw1: 120, vw2: 250 };
  const words = (t: string): number => t.split(/\s+/).filter(w => /[a-z]/i.test(w)).length;
  for (const sm of ws.samples ?? []) {
    if (!V.sample!(sm)) { schemaErr++; console.error(`✗ ws ${String(sm.id)}: ${wajv.errorsText(V.sample!.errors)}`); continue; }
    const task = String(sm.task), pr = String(sm.prompt);
    if (!task.startsWith('v') && !ids.has(pr)) { schemaErr++; console.error(`✗ ws ${String(sm.id)}: không có đề ${pr}`); }
    if (words(String(sm.text)) < MIN[task]! * 0.95) { schemaErr++; console.error(`✗ ws ${String(sm.id)}: ${words(String(sm.text))} từ, cần ≥ ${MIN[task]}`); }
  }
  const tasks = [...new Set((ws.samples ?? []).map(s => String(s.task)))];
  for (const t of tasks) if (new Set((ws.samples ?? []).filter(s => s.task === t).map(s => s.band)).size < 3) { schemaErr++; console.error(`✗ ws: bài mẫu ${t} cần ≥ 3 mức band`); }
  console.log(`ws: ${(ws.w1ac ?? []).length + (ws.w1gt ?? []).length + (ws.w2 ?? []).length} đề Viết, ${(ws.s ?? []).length} bộ đề Nói, ${(ws.samples ?? []).length} bài mẫu`);
}
console.log(`content: ${groups.length} nhóm, ${items} câu; ${schemaErr + issues.length} lỗi${worst ? `; tỉ lệ từ vượt cấp cao nhất ${(worst.r * 100).toFixed(1)}% (${worst.id})` : ''}`);
process.exit(schemaErr + issues.length ? 1 : 0);
