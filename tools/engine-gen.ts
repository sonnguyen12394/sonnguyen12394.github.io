#!/usr/bin/env node
// Sinh đồ thị năng lực và Target Model (docs/SPEC.md, Quyết định kỹ thuật §1) từ:
//   - content/engine/src/app-dump.json (tools/engine-dump.mjs đọc CANDO, UNITS, GPOINTS từ app đang chạy),
//   - danh mục dạng câu thi (src/exam/content.ts), số câu theo dạng (src/exam/gen/index.json),
//   - chỉnh tay trong content/engine/overrides.json (thẻ ngữ cảnh, thêm/bớt cạnh).
// Ghi content/engine/{nodes.json, edges.json, goals/*.json, coverage.md}. Kết quả xác định (chạy lại ra y hệt).
// Dùng: node --experimental-strip-types tools/engine-gen.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QTYPES } from '../src/exam/content.ts';
import { bandToCefr } from '../src/exam/scales.ts';
import { validate, index, closure, defaultLevel } from '../src/engine/graph.ts';
import type { Area, Cefr, Ctx, Edge, Goal, Level, Node, Req, ReqType, Skill } from '../src/engine/types.ts';
import { CEFRS } from '../src/engine/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (f: string) => join(ROOT, f);
const VERSION = '1.0';

interface DumpAct { at: string; t: string }
interface Dump {
  cando: Array<{ id: string; lv: Cefr; grp: string; grp0: string | null; vi: string; en: string; refs: Array<{ t: string; acts: DumpAct[] }> }>;
  units: Array<{ id: string; level: Cefr; title: string; vi: string; words: number }>;
  gpoints: Array<{ id: string; level: Cefr; title: string; vi: string }>;
}
interface Overrides { ctx?: Record<string, Ctx[]>; edgesAdd?: Edge[]; edgesDel?: Array<{ from: string; to: string }> }

const dump = JSON.parse(readFileSync(P('content/engine/src/app-dump.json'), 'utf8')) as Dump;
const ov = (existsSync(P('content/engine/overrides.json')) ? JSON.parse(readFileSync(P('content/engine/overrides.json'), 'utf8')) : {}) as Overrides;
const examIdx = JSON.parse(readFileSync(P('src/exam/gen/index.json'), 'utf8')) as { items: Record<string, [number, number, string, string]> };

const SKILL: Partial<Record<string, Skill>> = { lis: 'L', rd: 'R', wr: 'W', spk: 'S' };
const AREAS = new Set(['voc', 'gra', 'pro', 'lis', 'rd', 'wr', 'spk']);

// Thẻ ngữ cảnh cho mục tiêu giao tiếp: đoán theo từ khoá trong câu Can-Do, chỉnh tay ở overrides.json khi đoán sai.
const CTX_RE: Array<[Ctx, RegExp]> = [
  ['travel', /travel|trip|hotel|airport|direction|tourist|holiday|ticket|booking|journey|transport|sightseeing|du lịch|khách sạn|sân bay|chỉ đường/i],
  ['work', /\bwork|\bjob|meeting|colleague|office|business|interview|customer|workplace|professional|career|công việc|nơi làm việc|đồng nghiệp|phỏng vấn|khách hàng|cuộc họp/i],
  ['study', /stud|lecture|academic|essay|\bclass|school|course|research|report|seminar|học thuật|bài giảng|bài luận|lớp học|trường/i],
  ['daily', /yourself|family|food|drink|shop|home|town|weather|friend|free time|hobb|health|daily|routine|phone|message|invit|price|everyday|bản thân|gia đình|mua sắm|hằng ngày|đời thường/i],
];
function ctxOf(c: Dump['cando'][number]): Ctx[] {
  const text = `${c.en} ${c.vi}`;
  const out = CTX_RE.filter(([, re]) => re.test(text)).map(([k]) => k);
  if (!out.includes('daily') && (c.lv === 'A1' || c.lv === 'A2') && (c.grp === 'spk' || c.grp === 'lis')) out.push('daily');
  return out;
}

const uniqActs = (acts: DumpAct[]): DumpAct[] => [...new Map(acts.map(a => [a.at, a])).values()];
const ACT_MIN: Array<[RegExp, number]> = [[/data-unit=/, 0], [/data-gp=/, 0], [/data-dlg=|data-fn=/, 8], [/data-wt=|data-stk=/, 15], [/data-lr=|data-story=/, 12]];
const actMinutes = (a: DumpAct): number => (ACT_MIN.find(([re]) => re.test(a.at))?.[1] ?? 10);

// ---------- Nút ----------
const nodes: Node[] = [];
for (const u of dump.units) nodes.push({
  id: `u:${u.id}`, kind: 'vocab', area: 'voc', skill: null, cefr: u.level, vi: u.vi || u.title, en: u.title, ctx: [],
  acts: [{ at: `data-unit="${u.id}"`, t: u.title }], minutes: Math.max(10, u.words * 2),
});
for (const p of dump.gpoints) nodes.push({
  id: `g:${p.id}`, kind: 'grammar', area: 'gra', skill: null, cefr: p.level, vi: p.vi || p.title, en: p.title, ctx: [],
  acts: [{ at: `data-gp="${p.id}"`, t: p.title }], minutes: 20,
});
for (const c of dump.cando) {
  if (!AREAS.has(c.grp)) throw new Error(`Can-Do ${c.id}: nhóm lạ ${c.grp}`);
  const acts = uniqActs(c.refs.flatMap(r => r.acts));
  nodes.push({
    id: `cd:${c.id}`, kind: 'cando', area: c.grp as Area, skill: SKILL[c.grp] ?? null, cefr: c.lv, vi: c.vi, en: c.en,
    ctx: ov.ctx?.[`cd:${c.id}`] ?? ctxOf(c), acts, minutes: Math.max(10, acts.reduce((s, a) => s + actMinutes(a), 0)),
  });
}
// Dạng câu thi Nghe/Đọc (bỏ dạng chỉ dùng cho kiểm tra đầu vào) và bài Viết/Nói thi.
for (const q of QTYPES.filter(q => !q.id.startsWith('pl-'))) nodes.push({
  id: `x:${q.id}`, kind: 'task', area: 'task', skill: q.skill as Skill, cefr: null, vi: q.vi, en: q.en, ctx: ['exam'],
  acts: [{ at: `data-xr="type/${q.id}"`, t: q.vi }], minutes: 30,
});
const PROD: Array<[string, Skill, string, string, DumpAct[]]> = [
  ['xw:ielts-t1-ac', 'W', 'IELTS Viết Task 1 (Academic): mô tả biểu đồ, quy trình', 'IELTS Writing Task 1 (Academic)', []],
  ['xw:ielts-t1-gt', 'W', 'IELTS Viết Task 1 (General): viết thư', 'IELTS Writing Task 1 (General Training)', []],
  ['xw:ielts-t2', 'W', 'IELTS Viết Task 2: bài luận', 'IELTS Writing Task 2', []],
  ['xs:ielts-p1', 'S', 'IELTS Nói Part 1: hỏi đáp chủ đề quen thuộc', 'IELTS Speaking Part 1', []],
  ['xs:ielts-p2', 'S', 'IELTS Nói Part 2: nói 2 phút theo thẻ đề', 'IELTS Speaking Part 2', []],
  ['xs:ielts-p3', 'S', 'IELTS Nói Part 3: thảo luận', 'IELTS Speaking Part 3', []],
  ['xw:vstep-t1', 'W', 'VSTEP Viết bài 1: thư/email', 'VSTEP Writing Task 1', [{ at: 'data-act="vxnew" data-m="w"', t: 'Thi thử Viết VSTEP' }]],
  ['xw:vstep-t2', 'W', 'VSTEP Viết bài 2: bài luận', 'VSTEP Writing Task 2', [{ at: 'data-act="vxnew" data-m="w"', t: 'Thi thử Viết VSTEP' }]],
  ['xs:vstep-p1', 'S', 'VSTEP Nói phần 1: giao tiếp xã hội', 'VSTEP Speaking Part 1', [{ at: 'data-act="vxnew" data-m="s"', t: 'Thi thử Nói VSTEP' }]],
  ['xs:vstep-p2', 'S', 'VSTEP Nói phần 2: thảo luận giải pháp', 'VSTEP Speaking Part 2', [{ at: 'data-act="vxnew" data-m="s"', t: 'Thi thử Nói VSTEP' }]],
  ['xs:vstep-p3', 'S', 'VSTEP Nói phần 3: phát triển chủ đề', 'VSTEP Speaking Part 3', [{ at: 'data-act="vxnew" data-m="s"', t: 'Thi thử Nói VSTEP' }]],
];
for (const [id, skill, vi, en, acts] of PROD) nodes.push({ id, kind: 'task', area: 'task', skill, cefr: null, vi, en, ctx: ['exam'], acts, minutes: 40 });
nodes.sort((a, b) => (a.id < b.id ? -1 : 1));

// ---------- Cạnh ----------
const edges: Edge[] = [];
const add = (from: string, to: string, type: Edge['type'], w: number) => edges.push({ from, to, type, w });
const unitIds = new Set(dump.units.map(u => u.id)), gpIds = new Set(dump.gpoints.map(p => p.id));
for (const c of dump.cando) {
  const to = new Set<string>();
  for (const r of c.refs) for (const a of r.acts) {
    const mu = /data-unit="([^"]+)"/.exec(a.at), mg = /data-gp="([^"]+)"/.exec(a.at);
    if ((r.t === 'u' || r.t === 'ul') && mu && unitIds.has(mu[1]!)) to.add(`u:${mu[1]}`);
    if ((r.t === 'g' || r.t === 'gl') && mg && gpIds.has(mg[1]!)) to.add(`g:${mg[1]}`);
  }
  for (const t of [...to].sort()) add(`cd:${c.id}`, t, 'hard', 1);
}
// Cùng mảng, cấp dưới liền kề là tiền đề cứng (muốn đọc ở B2 phải đọc được ở B1); cùng nhóm gốc (grp0) nếu có thì chỉ nối nhóm đó.
for (const c of dump.cando) {
  const i = CEFRS.indexOf(c.lv);
  if (i <= 0) continue;
  const below = dump.cando.filter(d => d.grp === c.grp && d.lv === CEFRS[i - 1]);
  const same = below.filter(d => d.grp0 && d.grp0 === c.grp0);
  for (const d of (same.length ? same : below)) add(`cd:${c.id}`, `cd:${d.id}`, 'hard', 0.8);
}
// Ngữ pháp: điểm trước là tiền đề mềm của điểm sau (thứ tự bài trong app).
for (let i = 1; i < dump.gpoints.length; i++) add(`g:${dump.gpoints[i]!.id}`, `g:${dump.gpoints[i - 1]!.id}`, 'soft', 0.5);
// Bài thi → Can-Do kỹ năng cùng loại ở B1 (tiền đề mềm: làm bài thi cần nền kỹ năng).
const B1 = (area: string) => dump.cando.filter(c => c.grp === area && c.lv === 'B1').map(c => `cd:${c.id}`);
const AREA_OF: Record<Skill, string> = { L: 'lis', R: 'rd', W: 'wr', S: 'spk' };
for (const n of nodes) if (n.kind === 'task') for (const t of B1(AREA_OF[n.skill!])) add(n.id, t, 'soft', 0.5);
for (const e of ov.edgesAdd ?? []) edges.push(e);
const del = new Set((ov.edgesDel ?? []).map(e => `${e.from}>${e.to}`));
const finalEdges = [...new Map(edges.filter(e => !del.has(`${e.from}>${e.to}`)).map(e => [`${e.from}>${e.to}`, e])).values()]
  .sort((a, b) => (a.from + a.to < b.from + b.to ? -1 : 1));

// ---------- Target Model ----------
const candos = (pred: (c: Dump['cando'][number]) => boolean) => dump.cando.filter(pred);
const REQ_TYPE: Record<string, ReqType> = { voc: 'foundation', gra: 'foundation', pro: 'foundation', lis: 'skill', rd: 'skill', wr: 'skill', spk: 'skill' };
function cdReq(c: Dump['cando'][number], high: boolean): Req {
  const prod = c.grp === 'wr' || c.grp === 'spk';
  const level: Level = c.grp === 'voc' || c.grp === 'lis' || c.grp === 'rd' ? 3 : prod && high ? 5 : 4;
  return { node: `cd:${c.id}`, level, type: c.grp0 === 'com' ? 'performance' : REQ_TYPE[c.grp]! };
}
const goals: Goal[] = [];
const CEFR_VI: Record<Cefr, string> = { A1: 'Sơ cấp', A2: 'Sơ trung cấp', B1: 'Trung cấp', B2: 'Trung cao cấp', C1: 'Cao cấp', C2: 'Thành thạo' };
for (const L of CEFRS) goals.push({
  id: `cefr-${L.toLowerCase()}`, version: VERSION, kind: 'cefr', vi: `Tiếng Anh tổng quát ${L} (${CEFR_VI[L]})`, target: L, cefr: L,
  req: candos(c => c.lv === L).map(c => cdReq(c, L === 'C1' || L === 'C2')),
});
const taskLevel = (x: number, lo: number, hi: number): Level => (x < lo ? 3 : x < hi ? 4 : 5);
const IEXAM = QTYPES.filter(q => q.exams.includes('ielts-ac') && !q.id.startsWith('pl-'));
for (const kind of ['ielts-ac', 'ielts-gt'] as const) for (let b = 4; b <= 9; b += 0.5) {
  const L = bandToCefr(b), lv = taskLevel(b, 5.5, 7), high = b >= 7;
  const t1 = kind === 'ielts-ac' ? 'xw:ielts-t1-ac' : 'xw:ielts-t1-gt';
  const req: Req[] = [
    ...candos(c => c.lv === L).map(c => cdReq(c, high)),
    ...IEXAM.map(q => ({ node: `x:${q.id}`, level: lv, type: 'performance' as const })),
    ...[t1, 'xw:ielts-t2', 'xs:ielts-p1', 'xs:ielts-p2', 'xs:ielts-p3'].map(node => ({ node, level: lv, type: 'performance' as const })),
  ];
  goals.push({ id: `${kind}-${b.toFixed(1)}`, version: VERSION, kind, vi: `IELTS ${kind === 'ielts-ac' ? 'Academic' : 'General Training'} ${b.toFixed(1)}`, target: b.toFixed(1), cefr: L, req });
}
for (const [L, lv, vi] of [['B1', 3, 'Bậc 3 (B1)'], ['B2', 4, 'Bậc 4 (B2)'], ['C1', 5, 'Bậc 5 (C1)']] as Array<[Cefr, Level, string]>) goals.push({
  id: `vstep-${L.toLowerCase()}`, version: VERSION, kind: 'vstep', vi: `VSTEP ${vi}`, target: L, cefr: L,
  req: [
    ...candos(c => c.lv === L).map(c => cdReq(c, L === 'C1')),
    ...['v-l1', 'v-l2', 'v-l3', 'v-r'].map(q => ({ node: `x:${q}`, level: lv, type: 'performance' as const })),
    ...['xw:vstep-t1', 'xw:vstep-t2', 'xs:vstep-p1', 'xs:vstep-p2', 'xs:vstep-p3'].map(node => ({ node, level: lv, type: 'performance' as const })),
  ],
});
const COMM: Array<[Ctx, string, Cefr[]]> = [
  ['daily', 'Giao tiếp hằng ngày', ['A1', 'A2', 'B1']], ['travel', 'Giao tiếp khi du lịch', ['A1', 'A2', 'B1']],
  ['work', 'Giao tiếp nơi làm việc', ['A2', 'B1', 'B2']], ['study', 'Giao tiếp trong học tập', ['B1', 'B2', 'C1']],
];
const nodeById = new Map(nodes.map(n => [n.id, n]));
for (const [ctx, vi, lvs] of COMM) goals.push({
  id: `comm-${ctx}`, version: VERSION, kind: 'comm', vi, target: ctx, cefr: lvs[lvs.length - 1]!,
  req: candos(c => lvs.includes(c.lv) && nodeById.get(`cd:${c.id}`)!.ctx.includes(ctx)).map(c => cdReq(c, false)),
});

// ---------- Kiểm và ghi ----------
const graph = { nodes, edges: finalEdges, goals };
const errs = validate(graph);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
mkdirSync(P('content/engine/goals'), { recursive: true });
const json = (x: unknown) => JSON.stringify(x, null, 1) + '\n';
writeFileSync(P('content/engine/nodes.json'), json(nodes));
writeFileSync(P('content/engine/edges.json'), json(finalEdges));
const keep = new Set(goals.map(g => `${g.id}.json`));
for (const f of readdirSync(P('content/engine/goals'))) if (!keep.has(f)) unlinkSync(P(`content/engine/goals/${f}`));
for (const g of goals) writeFileSync(P(`content/engine/goals/${g.id}.json`), json(g));

// ---------- Bảng phủ: mỗi nút cần có cái để đo ở mức mục tiêu đòi ----------
const ix = index(graph);
const itemsByType: Record<string, number> = {};
for (const [, , , qt] of Object.values(examIdx.items)) itemsByType[qt] = (itemsByType[qt] ?? 0) + 1;
const unitWords = new Map(dump.units.map(u => [`u:${u.id}`, u.words]));
function measures(n: Node): number {
  if (n.kind === 'vocab') return unitWords.get(n.id) ?? 0;
  if (n.kind === 'task') return n.id.startsWith('x:') ? itemsByType[n.id.slice(2)] ?? 0 : n.acts.length;
  return n.acts.length;
}
const lines = ['# Bảng phủ engine', '', 'Tạo bởi `tools/engine-gen.ts`. Mỗi mục tiêu: số nút ghi trực tiếp, số nút sau khi đóng tiền đề cứng, số nút chưa có gì để đo (cần nội dung ở M6).', '',
  '| Mục tiêu | Phiên bản | Nút ghi | Sau đóng tiền đề | Chưa có gì để đo |', '|---|---|---|---|---|'];
const empty = new Set<string>();
for (const g of goals) {
  const all = closure(ix, g.req, defaultLevel);
  const none = all.filter(r => measures(ix.node.get(r.node)!) === 0);
  none.forEach(r => empty.add(r.node));
  lines.push(`| ${g.vi} (\`${g.id}\`) | ${g.version} | ${g.req.length} | ${all.length} | ${none.length ? none.map(r => r.node).join(', ') : '0'} |`);
}
lines.push('', `Tổng: ${nodes.length} nút (${nodes.filter(n => n.kind === 'cando').length} Can-Do, ${nodes.filter(n => n.kind === 'vocab').length} cụm từ vựng, ${nodes.filter(n => n.kind === 'grammar').length} điểm ngữ pháp, ${nodes.filter(n => n.kind === 'task').length} dạng bài thi), ${finalEdges.length} cạnh (${finalEdges.filter(e => e.type === 'hard').length} cứng), ${goals.length} mục tiêu. Nút chưa có gì để đo: ${empty.size}.`, '');
writeFileSync(P('content/engine/coverage.md'), lines.join('\n'));
console.log(`engine-gen: ${nodes.length} nút, ${finalEdges.length} cạnh, ${goals.length} mục tiêu; nút chưa có gì để đo: ${empty.size}`);
