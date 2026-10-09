#!/usr/bin/env node
// Sinh đồ thị năng lực và Target Model (docs/SPEC.md, Quyết định kỹ thuật §1) từ:
//   - content/engine/src/app-dump.json (tools/engine-dump.mjs đọc CANDO, UNITS, GPOINTS từ app đang chạy),
//   - danh mục dạng câu thi (src/exam/content.ts), số câu theo dạng (src/exam/gen/index.json),
//   - chỉnh tay trong content/engine/overrides.json (thẻ ngữ cảnh, thêm/bớt cạnh).
// Ghi content/engine/{nodes.json, edges.json, goals/*.json, coverage.md}. Kết quả xác định (chạy lại ra y hệt).
// Dùng: node --experimental-strip-types tools/engine-gen.ts
import { hash6 } from '../src/engine/ev/store.ts';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QTYPES } from '../src/exam/content.ts';
import { bandToCefr } from '../src/exam/scales.ts';
import { validate, audit, index, closure, defaultLevel } from '../src/engine/graph.ts';
import type { Area, Cefr, Ctx, Dim, Edge, EvType, Goal, Level, Node, Req, ReqType, Skill } from '../src/engine/types.ts';
import { CEFRS } from '../src/engine/types.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = (f: string) => join(ROOT, f);
const VERSION = '1.0';

interface DumpAct { at: string; t: string }
interface Dump {
  cando: Array<{ id: string; lv: Cefr; grp: string; grp0: string | null; vi: string; en: string; refs: Array<{ t: string; acts: DumpAct[] }> }>;
  units: Array<{ id: string; level: Cefr; title: string; vi: string; words: number }>;
  gpoints: Array<{ id: string; level: Cefr; title: string; vi: string }>;
  content?: { words: Array<{ id: string; unit: string; cloze: boolean; col: boolean; raw: string }>; gram: Array<{ id: string; mc: string[]; ty: string[]; fx: string[]; or: string[] }>; pa: Array<{ id: string; n: number }>;
    sounds: Array<{ id: string; a: string; b: string; title: string; vi: string; pairs: string[] }>; funcs: Array<{ id: string; lv: Cefr; en: string; vi: string; exps: string[] }> };
}
interface Overrides { ctx?: Record<string, Ctx[]>; edgesAdd?: Edge[]; edgesDel?: Array<{ from: string; to: string }> }

const dump = JSON.parse(readFileSync(P('content/engine/src/app-dump.json'), 'utf8')) as Dump;
const ov = (existsSync(P('content/engine/overrides.json')) ? JSON.parse(readFileSync(P('content/engine/overrides.json'), 'utf8')) : {}) as Overrides;
// Pre-A1 (khởi động cho người mới tinh): danh sách bài là hằng PREA1 viết tĩnh trong app.js.
const appSrc = readFileSync(P('app.js'), 'utf8');
const preA1 = [...appSrc.matchAll(/^ \{id:'pa-([a-z0-9]+)',vi:'([^']+)',en:'([^']+)'/gm)].map(m => ({ id: m[1]!, vi: m[2]!, en: m[3]! }));
if (preA1.length < 5) throw new Error(`Pre-A1: chỉ đọc được ${preA1.length} bài từ PREA1 trong app.js`);
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
for (const p of preA1) nodes.push({
  id: `pa:${p.id}`, kind: 'cando', area: 'voc', skill: 'L', cefr: null, vi: `Pre-A1: ${p.vi}`, en: p.en, ctx: ['daily'],
  acts: [{ at: `data-pa="pa-${p.id}"`, t: `Pre-A1: ${p.vi}` }], minutes: 10,
});
// v67 (C14, C17–C19): nút âm vị riêng (26 cặp âm tối thiểu) và nút chức năng giao tiếp riêng (chào hỏi, đề nghị, xin lỗi…),
// mỗi nút có hoạt động để đo; Can-Do tham chiếu cặp âm / chức năng thì nối tới các nút này như với unit, điểm ngữ pháp.
for (const x of dump.content?.sounds ?? []) nodes.push({
  id: `ph:${x.id}`, kind: 'sound', area: 'pro', skill: 'L', cefr: 'A1', vi: `Phân biệt âm ${x.a} – ${x.b} (${x.vi})`, en: x.title, ctx: ['daily'],
  acts: [{ at: `data-snd="${x.id}"`, t: `Cặp âm ${x.title}` }], minutes: 10,
});
for (const f of dump.content?.funcs ?? []) nodes.push({
  id: `fn:${f.id}`, kind: 'func', area: 'spk', skill: 'S', cefr: f.lv, vi: f.vi, en: f.en, ctx: ['daily'],
  acts: [{ at: `data-fn="${f.id}"`, t: f.vi }], minutes: 15,
});
// Dạng câu thi Nghe/Đọc (bỏ dạng chỉ dùng cho kiểm tra đầu vào) và bài Viết/Nói thi.
for (const q of QTYPES.filter(q => !q.id.startsWith('pl-'))) nodes.push({
  id: `x:${q.id}`, kind: 'task', area: 'task', skill: q.skill as Skill, cefr: null, vi: q.vi, en: q.en, ctx: ['exam'],
  acts: [{ at: `data-xr="type/${q.id}"`, t: q.vi }], minutes: 30,
});
const PROD: Array<[string, Skill, string, string, DumpAct[]]> = [
  ['xw:ielts-t1-ac', 'W', 'IELTS Viết Task 1 (Academic): mô tả biểu đồ, quy trình', 'IELTS Writing Task 1 (Academic)', [{ at: 'data-act="vxnew" data-m="w" data-ex="ielts-ac"', t: 'Thi thử Viết IELTS Academic' }]],
  ['xw:ielts-t1-gt', 'W', 'IELTS Viết Task 1 (General): viết thư', 'IELTS Writing Task 1 (General Training)', [{ at: 'data-act="vxnew" data-m="w" data-ex="ielts-gt"', t: 'Thi thử Viết IELTS General' }]],
  ['xw:ielts-t2', 'W', 'IELTS Viết Task 2: bài luận', 'IELTS Writing Task 2', [{ at: 'data-act="vxnew" data-m="w" data-ex="ielts-ac"', t: 'Thi thử Viết IELTS' }]],
  ['xs:ielts-p1', 'S', 'IELTS Nói Part 1: hỏi đáp chủ đề quen thuộc', 'IELTS Speaking Part 1', [{ at: 'data-act="vxnew" data-m="s" data-ex="ielts-ac"', t: 'Thi thử Nói IELTS' }]],
  ['xs:ielts-p2', 'S', 'IELTS Nói Part 2: nói 2 phút theo thẻ đề', 'IELTS Speaking Part 2', [{ at: 'data-act="vxnew" data-m="s" data-ex="ielts-ac"', t: 'Thi thử Nói IELTS' }]],
  ['xs:ielts-p3', 'S', 'IELTS Nói Part 3: thảo luận', 'IELTS Speaking Part 3', [{ at: 'data-act="vxnew" data-m="s" data-ex="ielts-ac"', t: 'Thi thử Nói IELTS' }]],
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
const add = (from: string, to: string, type: Edge['type'], w: number, why: NonNullable<Edge['why']>, alt?: { alt: string; need: number }) => edges.push({ from, to, type, w, why, ver: VERSION, ...(alt ?? {}) });
const unitIds = new Set(dump.units.map(u => u.id)), gpIds = new Set(dump.gpoints.map(p => p.id));
const sndIds = new Set((dump.content?.sounds ?? []).map(x => x.id)), fnIds = new Set((dump.content?.funcs ?? []).map(x => x.id));
for (const c of dump.cando) {
  const to = new Set<string>();
  for (const r of c.refs) for (const a of r.acts) {
    const mu = /data-unit="([^"]+)"/.exec(a.at), mg = /data-gp="([^"]+)"/.exec(a.at);
    if ((r.t === 'u' || r.t === 'ul') && mu && unitIds.has(mu[1]!)) to.add(`u:${mu[1]}`);
    if ((r.t === 'g' || r.t === 'gl') && mg && gpIds.has(mg[1]!)) to.add(`g:${mg[1]}`);
    const ms = /data-snd="([^"]+)"/.exec(a.at), mf = /data-fn="([^"]+)"/.exec(a.at);
    if (r.t === 'snd' && ms && sndIds.has(ms[1]!)) to.add(`ph:${ms[1]}`);
    if (r.t === 'f' && mf && fnIds.has(mf[1]!)) to.add(`fn:${mf[1]}`);
  }
  // v67 tiền đề thay thế (spec §15, C34/C156/C207): Can-Do về VỐN TỪ theo chủ đề (≥ 4 unit) đo độ rộng, không đòi đủ từng unit —
  // mở khi đã Đạt ≥ 80% số unit của nó (nhiều đường tới cùng một Can-Do). Can-Do ngữ pháp giữ nguyên: mỗi cấu trúc đều cần.
  const units = [...to].filter(t => t.startsWith('u:'));
  const alt = /-voc\d+$/.test(c.id) && units.length >= 4 ? { alt: `cd:${c.id}#voc`, need: Math.ceil(units.length * 0.8) } : undefined;
  for (const t of [...to].sort()) add(`cd:${c.id}`, t, 'hard', 1, 'cando-act', t.startsWith('u:') ? alt : undefined);
}
// Cùng mảng, cấp dưới liền kề là tiền đề cứng (muốn đọc ở B2 phải đọc được ở B1); cùng nhóm gốc (grp0) nếu có thì chỉ nối nhóm đó.
for (const c of dump.cando) {
  const i = CEFRS.indexOf(c.lv);
  if (i <= 0) continue;
  const below = dump.cando.filter(d => d.grp === c.grp && d.lv === CEFRS[i - 1]);
  const same = below.filter(d => d.grp0 && d.grp0 === c.grp0);
  for (const d of (same.length ? same : below)) add(`cd:${c.id}`, `cd:${d.id}`, 'hard', 0.8, 'level-ladder');
}
// Can-Do A1 "đánh vần, số, giờ…" là đích của các bài Pre-A1 (cdActs tham chiếu t:'pa'): mỗi bài là tiền đề cứng.
for (const c of dump.cando) for (const r of c.refs) if (r.t === 'pa') for (const a of r.acts) {
  const m = /data-pa="pa-([a-z0-9]+)"/.exec(a.at);
  if (m && preA1.some(p => p.id === m[1])) add(`cd:${c.id}`, `pa:${m[1]}`, 'hard', 1, 'pa-act');
}
// Ngữ pháp: điểm trước là tiền đề mềm của điểm sau (thứ tự bài trong app).
for (let i = 1; i < dump.gpoints.length; i++) add(`g:${dump.gpoints[i]!.id}`, `g:${dump.gpoints[i - 1]!.id}`, 'soft', 0.5, 'gram-order');
// Bài thi → Can-Do kỹ năng cùng loại ở B1 (tiền đề mềm: làm bài thi cần nền kỹ năng).
const B1 = (area: string) => dump.cando.filter(c => c.grp === area && c.lv === 'B1').map(c => `cd:${c.id}`);
const AREA_OF: Record<Skill, string> = { L: 'lis', R: 'rd', W: 'wr', S: 'spk' };
for (const n of nodes) if (n.kind === 'task') for (const t of B1(AREA_OF[n.skill!])) add(n.id, t, 'soft', 0.5, 'exam-base');
for (const e of ov.edgesAdd ?? []) edges.push({ why: 'manual', ver: VERSION, ...e });
const del = new Set((ov.edgesDel ?? []).map(e => `${e.from}>${e.to}`));
const finalEdges = [...new Map(edges.filter(e => !del.has(`${e.from}>${e.to}`)).map(e => [`${e.from}>${e.to}`, e])).values()]
  .sort((a, b) => (a.from + a.to < b.from + b.to ? -1 : 1));

// ---------- Knowledge Model (v57, spec v2.4 §14, §17) ----------
interface Knowledge { contrast: Array<{ ids: string[]; why: string }>; mis: Record<string, string[]> }
const know = JSON.parse(readFileSync(P('content/engine/knowledge.json'), 'utf8')) as Knowledge;
const INTER = /conversation|discuss|interact|respond|reply|exchange|negotiat|take part|phone|interview|ask (and|for|simple|questions)|hội thoại|trao đổi|thảo luận|đáp lời|phỏng vấn/i;
const PRAG = /polite|formal|informal|register|appropriate|tone|tactful|diplomatic|lịch sự|trang trọng|thân mật|phù hợp|tế nhị/i;
const DISC = /paragraph|essay|organi[sz]|coheren|link|structure|argument|summar|report|narrat|story|mediat|đoạn văn|bài luận|mạch lạc|tóm tắt|lập luận|kể lại|chuyển ý/i;
const cefrI = (c: Cefr | null) => (c ? CEFRS.indexOf(c) : -1);
const usesBy = new Map<string, string[]>();
for (const e of finalEdges) if (e.type === 'hard' && e.why === 'cando-act') (usesBy.get(e.to) ?? usesBy.set(e.to, []).get(e.to)!).push(e.from);
const contrastOf = new Map<string, Set<string>>();
for (const grp of know.contrast) for (const a of grp.ids) for (const b of grp.ids) if (a !== b) (contrastOf.get(a) ?? contrastOf.set(a, new Set()).get(a)!).add(b);
const unitWordsN = new Map(dump.units.map(u => [`u:${u.id}`, u.words]));
for (const n of nodes) {
  const text = `${n.en ?? ''} ${n.vi}`, dims = new Set<Dim>();
  if (n.area === 'voc') dims.add('lex');
  if (n.area === 'gra') dims.add('gram');
  if (n.area === 'pro' || n.id.startsWith('pa:abc') || n.id.startsWith('pa:spell')) dims.add('phon');
  if (n.area === 'lis' || n.area === 'rd' || n.skill === 'L' || n.skill === 'R') dims.add('rec');
  if (n.area === 'wr' || n.area === 'spk' || n.skill === 'W' || n.skill === 'S') dims.add('prod');
  if (n.id === 'pa:class') dims.add('inter');   // hỏi lại, xin nhắc lại: tương tác đầu tiên
  if (n.kind === 'sound') dims.add('phon');
  if (n.kind === 'func') { dims.add('inter'); dims.add('prag'); }
  if (n.kind === 'cando' || n.kind === 'task') { if (INTER.test(text) || n.id.startsWith('xs:')) dims.add('inter'); if (PRAG.test(text)) dims.add('prag'); if (DISC.test(text) || n.id.startsWith('xw:')) dims.add('disc'); }
  if (!dims.size) dims.add(n.kind === 'vocab' ? 'lex' : 'rec');
  n.ver = VERSION;
  n.dims = [...dims].sort();
  n.diff = n.id.startsWith('pa:') ? 0 : Math.round(((cefrI(n.cefr) < 0 ? 2.5 : cefrI(n.cefr)) + (n.kind === 'task' ? 0.5 : n.kind === 'cando' ? 0.3 : 0)) / 5.5 * 100) / 100;
  const prod = n.skill === 'W' || n.skill === 'S';
  n.evReq = n.kind === 'vocab' || n.id.startsWith('pa:') ? { lv: [1, 3], types: ['choice', 'typed'] as EvType[] }
    : n.kind === 'grammar' ? { lv: [2, 3, 4], types: ['choice', 'typed', 'production'] as EvType[] }
    : n.kind === 'task' ? { lv: [3, 4, 5], types: ['task'] as EvType[] }
    : n.kind === 'sound' ? { lv: [1, 2], types: ['choice'] as EvType[] }
    : n.kind === 'func' ? { lv: [2, 3], types: ['choice', 'typed'] as EvType[] }
    : prod ? { lv: [4, 5], types: ['production', 'task'] as EvType[] } : { lv: [3], types: ['task'] as EvType[] };
  n.imp = { tr: n.kind === 'sound' ? 0.6 : n.kind === 'func' ? 0.8 : n.kind === 'grammar' ? 0.8 : prod ? 0.9 : n.kind === 'vocab' ? 0.5 : 0.7, re: n.id.startsWith('pa:') ? 1 : n.kind === 'vocab' ? 0.9 : n.kind === 'grammar' ? 0.8 : 0.5 };
  n.scope = n.kind === 'vocab' ? `${unitWordsN.get(n.id) ?? 0} từ của chủ đề “${n.en ?? n.vi}”` : n.kind === 'grammar' ? `Điểm ngữ pháp: ${n.en ?? n.vi}` : n.en ?? n.vi;
  const ct = contrastOf.get(n.id); if (ct) n.contrast = [...ct].sort();
  const ms = know.mis[n.id]; if (ms) n.mis = ms;
  const us = usesBy.get(n.id); if (us) n.uses = [...new Set(us)].sort();
}
const unknownK = [...know.contrast.flatMap(g => g.ids), ...Object.keys(know.mis)].filter(id => !nodes.some(n => n.id === id));
if (unknownK.length) throw new Error(`knowledge.json trỏ tới nút không có: ${unknownK.join(', ')}`);

// ---------- Target Model ----------
const candos = (pred: (c: Dump['cando'][number]) => boolean) => dump.cando.filter(pred);
const REQ_TYPE: Record<string, ReqType> = { voc: 'foundation', gra: 'foundation', pro: 'foundation', lis: 'skill', rd: 'skill', wr: 'skill', spk: 'skill' };
function cdReq(c: Dump['cando'][number], high: boolean): Req {
  const prod = c.grp === 'wr' || c.grp === 'spk';
  const level: Level = c.grp === 'voc' || c.grp === 'lis' || c.grp === 'rd' ? 3 : prod && high ? 5 : 4;
  return { node: `cd:${c.id}`, level, type: c.grp0 === 'com' ? 'performance' : REQ_TYPE[c.grp]! };
}
const goals: Goal[] = [];
goals.push({
  id: 'cefr-pre-a1', version: VERSION, kind: 'cefr', vi: 'Khởi động Pre-A1 (người mới tinh)', target: 'Pre-A1', cefr: null, status: 'active',
  req: preA1.map(p => ({ node: `pa:${p.id}`, level: 3 as Level, type: 'foundation' as const })),
});
const CEFR_VI: Record<Cefr, string> = { A1: 'Sơ cấp', A2: 'Sơ trung cấp', B1: 'Trung cấp', B2: 'Trung cao cấp', C1: 'Cao cấp', C2: 'Thành thạo' };
for (const L of CEFRS) goals.push({
  id: `cefr-${L.toLowerCase()}`, version: VERSION, kind: 'cefr', vi: `Tiếng Anh tổng quát ${L} (${CEFR_VI[L]})`, target: L, cefr: L, status: 'active',
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
  goals.push({ id: `${kind}-${b.toFixed(1)}`, version: VERSION, kind, vi: `IELTS ${kind === 'ielts-ac' ? 'Academic' : 'General Training'} ${b.toFixed(1)}`, target: b.toFixed(1), cefr: L, status: 'future', req });
}
for (const [L, lv, vi] of [['B1', 3, 'Bậc 3 (B1)'], ['B2', 4, 'Bậc 4 (B2)'], ['C1', 5, 'Bậc 5 (C1)']] as Array<[Cefr, Level, string]>) goals.push({
  id: `vstep-${L.toLowerCase()}`, version: VERSION, kind: 'vstep', vi: `VSTEP ${vi}`, target: L, cefr: L, status: 'future',
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
  id: `comm-${ctx}`, version: VERSION, kind: 'comm', vi, target: ctx, cefr: lvs[lvs.length - 1]!, status: 'future',
  req: candos(c => lvs.includes(c.lv) && nodeById.get(`cd:${c.id}`)!.ctx.includes(ctx)).map(c => cdReq(c, false)),
});

// ---------- Kiểm và ghi ----------
const graph = { nodes, edges: finalEdges, goals };
const errs = validate(graph);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
const au = audit(graph);
if (au.unreachable.length) { console.error(`nút mục tiêu không có hoạt động nào để học: ${au.unreachable.join(', ')}`); process.exit(1); }
mkdirSync(P('content/engine/goals'), { recursive: true });
const json = (x: unknown) => JSON.stringify(x, null, 1) + '\n';
// v67 (C5, C197): mục tiêu tự khai mô hình Readiness của nó; engine chọn mô hình theo dữ liệu, không rẽ nhánh theo loại kỳ thi.
for (const g of goals) g.readiness = g.kind === 'cefr' || g.kind === 'comm' ? 'mastery' : 'exam-score';
writeFileSync(P('content/engine/nodes.json'), json(nodes));
writeFileSync(P('content/engine/edges.json'), json(finalEdges));
const keep = new Set(goals.map(g => `${g.id}.json`));
for (const f of readdirSync(P('content/engine/goals'))) if (!keep.has(f)) unlinkSync(P(`content/engine/goals/${f}`));
for (const g of goals) writeFileSync(P(`content/engine/goals/${g.id}.json`), json(g));

// ---------- v67 Bản đồ nội dung → nút (C55, C56, C60) ----------
// Mỗi câu học nền: id câu (đúng id app ghi vào bằng chứng) → nút, các mức nó đo, băm nội dung (phiên bản từng câu).
// Nội dung không gắn được nút (mồ côi) hoặc nút học nền không có câu nào → dừng build.
if (dump.content) {
  const nodeIds = new Set(nodes.map(n => n.id)), map: Record<string, Array<[string, number[], string]>> = {}, orphans: string[] = [];
  const put = (node: string, id: string, lv: number[], raw: string) => { if (!nodeIds.has(node)) { orphans.push(`${id} → ${node}`); return; } (map[node] ||= []).push([id, lv, hash6(raw)]); };
  for (const w of dump.content.words) {
    const node = `u:${w.unit}`;
    put(node, `w:${w.id}:rec`, [1, 2], w.raw); put(node, `w:${w.id}:rcl`, [3], w.raw); put(node, `w:${w.id}:spl`, [3], w.raw);
    if (w.cloze) put(node, `w:${w.id}:ctx`, [4], w.raw);
    if (w.col) put(node, `w:${w.id}:col`, [4], w.raw);
  }
  for (const p of dump.content.gram) {
    const node = `g:${p.id}`;
    p.mc.forEach((x, i) => put(node, `g:${p.id}|cho|c${i}`, [2], x)); p.ty.forEach((x, i) => put(node, `g:${p.id}|typ|t${i}`, [3], x));
    p.fx.forEach((x, i) => put(node, `g:${p.id}|fix|x${i}`, [4], x)); p.or.forEach((x, i) => put(node, `g:${p.id}|ord|o${i}`, [3], x));
  }
  for (const a of dump.content.pa) put(`pa:${a.id.replace(/^pa-/, '')}`, `pa:${a.id}`, [1, 3], `${a.id}:${a.n}`);
  for (const x of dump.content.sounds ?? []) x.pairs.forEach((p, i) => put(`ph:${x.id}`, `snd:${x.id}:${i}`, [1, 2], p));
  for (const f of dump.content.funcs ?? []) f.exps.forEach((p, i) => put(`fn:${f.id}`, `fn:${f.id}:${i}`, [2, 3], p));
  const empty = nodes.filter(n => (n.kind === 'vocab' || n.kind === 'grammar') && !map[n.id]?.length).map(n => n.id);
  if (orphans.length || empty.length) throw new Error(`engine-gen: nội dung mồ côi ${orphans.length} (${orphans.slice(0, 3).join(', ')}), nút không có câu ${empty.length} (${empty.slice(0, 3).join(', ')})`);
  const total = Object.values(map).reduce((t, xs) => t + xs.length, 0);
  writeFileSync(P('content/engine/content-map.json'), JSON.stringify({ version: VERSION, items: total, nodes: Object.keys(map).length, map }) + '\n');
  console.log(`engine-gen: bản đồ nội dung ${total} câu → ${Object.keys(map).length} nút, 0 mồ côi`);
}

// ---------- Bảng phủ: mỗi nút cần có cái để đo ở mức mục tiêu đòi ----------
const ix = index(graph);
const itemsByType: Record<string, number> = {};
for (const [, , , qt] of Object.values(examIdx.items)) itemsByType[qt] = (itemsByType[qt] ?? 0) + 1;
const unitWords = new Map(dump.units.map(u => [`u:${u.id}`, u.words]));
function measures(n: Node): number {
  if (n.id.startsWith('pa:')) return n.acts.length;
  if (n.kind === 'vocab') return unitWords.get(n.id) ?? 0;
  if (n.kind === 'task') return n.id.startsWith('x:') ? itemsByType[n.id.slice(2)] ?? 0 : n.acts.length;
  return n.acts.length;
}
const lines = ['# Bảng phủ engine', '', 'Tạo bởi `tools/engine-gen.ts`. Mỗi mục tiêu: số nút ghi trực tiếp, số nút sau khi đóng tiền đề cứng, số nút chưa có gì để đo (cần nội dung ở M6).', '',
  '| Mục tiêu | Trạng thái | Phiên bản | Nút ghi | Sau đóng tiền đề | Chưa có gì để đo |', '|---|---|---|---|---|---|'];
const empty = new Set<string>();
for (const g of goals) {
  const all = closure(ix, g.req, defaultLevel);
  const none = all.filter(r => measures(ix.node.get(r.node)!) === 0);
  none.forEach(r => empty.add(r.node));
  lines.push(`| ${g.vi} (\`${g.id}\`) | ${g.status === 'active' ? 'MVP' : 'tương lai'} | ${g.version} | ${g.req.length} | ${all.length} | ${none.length ? none.map(r => r.node).join(', ') : '0'} |`);
}
lines.push('', `Tổng: ${nodes.length} nút (${nodes.filter(n => n.kind === 'cando').length} Can-Do, ${nodes.filter(n => n.kind === 'vocab').length} cụm từ vựng, ${nodes.filter(n => n.kind === 'grammar').length} điểm ngữ pháp, ${nodes.filter(n => n.kind === 'task').length} dạng bài thi), ${finalEdges.length} cạnh (${finalEdges.filter(e => e.type === 'hard').length} cứng), ${goals.length} mục tiêu. Nút chưa có gì để đo: ${empty.size}.`, '');
// ---------- Kiểm định Knowledge/Graph (v57) ----------
const DIMS: Dim[] = ['lex', 'gram', 'phon', 'rec', 'prod', 'inter', 'prag', 'disc'];
const DIMV: Record<Dim, string> = { lex: 'Từ vựng', gram: 'Ngữ pháp', phon: 'Âm vị', rec: 'Tiếp nhận', prod: 'Sản sinh', inter: 'Tương tác', prag: 'Ngữ dụng', disc: 'Diễn ngôn' };
lines.push('## Universal Language Core theo mục tiêu đang mở', '', 'Số nút (kể cả tiền đề) thuộc từng năng lực của spec v2.4 §14. Một nút có thể thuộc nhiều năng lực.', '',
  `| Mục tiêu | ${DIMS.map(d => DIMV[d]).join(' | ')} |`, `|---|${DIMS.map(() => '---').join('|')}|`,
  ...Object.entries(au.balance).map(([id, b]) => `| \`${id}\` | ${DIMS.map(d => b[d] ?? 0).join(' | ')} |`), '');
const thin = Object.entries(au.balance).flatMap(([id, b]) => DIMS.filter(d => !b[d]).map(d => `${id}: ${DIMV[d]}`));
lines.push('## Kiểm định đồ thị', '',
  `- Nút mồ côi (không thuộc mục tiêu nào, không có cạnh): ${au.orphan.length ? au.orphan.join(', ') : '0'}.`,
  `- Nút mục tiêu không học được (không có hoạt động): ${au.unreachable.length || 0}.`,
  `- Tiền đề cứng ngược cấp (tiền đề ở cấp cao hơn): ${au.inverse.length ? au.inverse.slice(0, 20).join('; ') + (au.inverse.length > 20 ? ` … (${au.inverse.length})` : '') : '0'}.`,
  `- Nút trùng tên cùng loại: ${au.dup.length ? au.dup.map(d => d.join(' = ')).slice(0, 20).join('; ') : '0'}.`,
  `- Nhóm tiền đề thay thế sai (need > số nút): ${au.altBad.length || 0}.`,
  `- Năng lực Universal Core chưa có nút ở mục tiêu: ${thin.length ? thin.join('; ') : 'không'}.`,
  `- Cạnh có lý do: ${finalEdges.filter(e => e.why).length}/${finalEdges.length}; nút có cặp dễ nhầm: ${nodes.filter(n => n.contrast).length}; nút có lỗi hay gặp: ${nodes.filter(n => n.mis).length}.`, '');

writeFileSync(P('content/engine/coverage.md'), lines.join('\n'));
console.log(`engine-gen: ${nodes.length} nút, ${finalEdges.length} cạnh, ${goals.length} mục tiêu; nút chưa có gì để đo: ${empty.size}`);
