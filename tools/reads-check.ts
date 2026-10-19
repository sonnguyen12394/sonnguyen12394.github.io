#!/usr/bin/env node
// v164 (bản 102) Kiểm kho bài đọc thêm của Ôn luyện (units[uid].reads trong data/lv-<cấp>.json, hoặc một tệp lô {uid: [bài…]}).
// Người sáng lập 18/10/2026: não tạo bài đọc nhắm chỗ thiếu; kho do AI soạn, máy kiểm luật dưới đây (chưa người thật kiểm):
//   - 55–110 từ; chứa ≥ 5 từ của chính unit (khớp dạng từ);
//   - từ vượt cấp unit hoặc ngoài danh sách CEFR (content/wordlist.json, lemma.ts; tên riêng, tên Việt bỏ qua) ≤ 5% (bài cũ của unit cũng ở mức này);
//   - 3 câu hiểu bài: đáp án khác hai phương án sai; "why" là câu trích nguyên văn có trong bài (căn cứ đáp án);
//   - câu mở đầu không trùng bài khác (kể cả bài cũ của unit).
// Dùng: node --experimental-strip-types tools/reads-check.ts [lô.json]   (không đối số: kiểm data/lv-A1 + lv-A2)
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { levelOf, tokens, LEVELS } from '../src/content/lemma.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const list = JSON.parse(readFileSync(join(ROOT, 'content/wordlist.json'), 'utf8')) as Record<string, string>;
const src = readFileSync(join(ROOT, 'app.js'), 'utf8'), a = src.indexOf('\nconst CONTENT = '), lines = src.slice(a + 1).split('\n'); let j = 1;
while (j < lines.length && !/^(const|let|var|function|async function|\/\*|\/\/)/.test(lines[j]!)) j++;
interface W { word: string } interface U { id: string; words: W[]; level: string }
const C = runInNewContext('(' + lines.slice(0, j).join('\n').replace(/^const CONTENT = /, '').replace(/;\s*$/, '') + ')') as { levels: Array<{ id: string; units: U[] }> };
const UNITS = new Map<string, U>(); for (const L of C.levels) for (const u of L.units) UNITS.set(u.id, { ...u, level: L.id });
// từ của các unit ≤ cấp cũng coi là trong cấp (danh sách unit của app rộng hơn danh sách CEFR ở vài chỗ)
const OWN: Record<string, Set<string>> = {};
for (const L of C.levels) { const i = LEVELS.indexOf(L.id as never); OWN[L.id] = new Set(C.levels.filter(x => LEVELS.indexOf(x.id as never) <= i).flatMap(x => x.units.flatMap(u => u.words.map(w => w.word.toLowerCase())))); }
export interface Read { title: string; tvi: string; text: string; vi: string; qs: Array<{ q: string; a: string; w: string[]; why: string }> }
const VN = new Set('lan minh nam mai hoa linh tuan hung huong ha hanoi noi ho chi saigon da nang hue hai phong can tho nha trang sapa sa pa vung tau tet pho banh mi bun dong ao dai com vietnam vietnamese tom anna ben lucy kim sam peter emma jack sara mr mrs ms english'.split(' '));
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const stem = (w: string) => new RegExp(`\\b${esc(w.toLowerCase()).replace(/y$/, '(?:y|ie|i)').replace(/e$/, 'e?')}(?:s|es|d|ed|ing|er|est|ly|'s)?\\b`, 'i');
const flat = (s: string) => String(s).replace(/[’‘]/g, "'").toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();

export function checkRead(uid: string, r: Read, i: number, seen: Set<string>): string[] {
  const u = UNITS.get(uid), errs: string[] = [], id = `${uid}#${i}`;
  if (!u) return [`${id}: không có unit`];
  for (const k of ['title', 'tvi', 'text', 'vi'] as const) if (typeof r[k] !== 'string' || !r[k].trim()) errs.push(`${id}: thiếu ${k}`);
  const T = String(r.text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''), tk = tokens(T), n = (T.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length;
  if (n < 55 || n > 110) errs.push(`${id}: ${n} từ (cần 55–110)`);
  const own = u.words.filter(w => stem(w.word).test(T)).length;
  if (own < 5) errs.push(`${id}: chỉ có ${own} từ của unit (cần ≥ 5)`);
  const li = LEVELS.indexOf(u.level as never), over = tk.filter(t => !t.proper).map(t => t.w.toLowerCase().replace(/[’]/g, "'")).filter(w => { if (OWN[u.level]!.has(w) || VN.has(w)) return false; const L = levelOf(w, list); return !L || LEVELS.indexOf(L) > li; });
  if (over.length / Math.max(1, n) > 0.05) errs.push(`${id}: từ ngoài / trên cấp ${u.level}: ${[...new Set(over)].join(', ')}`);
  const qs = Array.isArray(r.qs) ? r.qs : [];
  if (qs.length !== 3) errs.push(`${id}: cần 3 câu hỏi (có ${qs.length})`);
  const FT = flat(T);
  qs.forEach((q, k) => {
    if (!q || !q.q || !q.a || !Array.isArray(q.w) || q.w.length !== 2) { errs.push(`${id} q${k}: thiếu q / a / w[2]`); return; }
    if (q.w.some(x => flat(x) === flat(q.a)) || flat(q.w[0]!) === flat(q.w[1]!)) errs.push(`${id} q${k}: phương án trùng`);
    const why = flat(q.why || '');
    if (!why || !FT.includes(why)) errs.push(`${id} q${k}: "why" phải là câu trích nguyên văn trong bài`);
  });
  const open = FT.split(/(?<=\w) (?=\w)/).slice(0, 8).join(' ');
  if (seen.has(open)) errs.push(`${id}: mở đầu trùng bài khác`); seen.add(open);
  return errs;
}
export function checkAll(map: Record<string, Read[]>, seen = new Set<string>()) { const errs: string[] = []; let n = 0;
  for (const [uid, rs] of Object.entries(map)) (rs || []).forEach((r, i) => { n++; errs.push(...checkRead(uid, r, i, seen)); });
  return { n, errs }; }

// Kho trong data/ (gọi từ tools/content-check.ts).
export function checkData() { const map: Record<string, Read[]> = {}, seen = new Set<string>();
  for (const lv of ['A1', 'A2']) { const df = readdirSync(join(ROOT, 'data')).find(x => x.startsWith(`lv-${lv}.`))!; const d = JSON.parse(readFileSync(join(ROOT, 'data', df), 'utf8')) as { units: Record<string, { reading?: { text: string }; }> };
    for (const [uid, ud] of Object.entries(d.units)) if (ud.reading) seen.add(flat(ud.reading.text).split(' ').slice(0, 8).join(' '));
    const rf = readdirSync(join(ROOT, 'data')).find(x => x.startsWith(`rd-${lv}.`)); if (rf) Object.assign(map, JSON.parse(readFileSync(join(ROOT, 'data', rf), 'utf8')) as Record<string, Read[]>); }
  return checkAll(map, seen); }
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const f = process.argv[2]; let map: Record<string, Read[]> = {}; const seen = new Set<string>();
  if (f) map = JSON.parse(readFileSync(f, 'utf8'));
  else for (const lv of ['A1', 'A2']) { const df = readdirSync(join(ROOT, 'data')).find(x => x.startsWith(`lv-${lv}.`))!; const d = JSON.parse(readFileSync(join(ROOT, 'data', df), 'utf8')) as { units: Record<string, { reading?: { text: string }; }> };
    for (const [uid, ud] of Object.entries(d.units)) if (ud.reading) seen.add(flat(ud.reading.text).split(' ').slice(0, 8).join(' '));
    const rf = readdirSync(join(ROOT, 'data')).find(x => x.startsWith(`rd-${lv}.`)); if (rf) Object.assign(map, JSON.parse(readFileSync(join(ROOT, 'data', rf), 'utf8')) as Record<string, Read[]>); }
  const r = checkAll(map, seen);
  for (const e of r.errs) console.log('✗ ' + e);
  console.log(`reads-check: ${r.n} bài, ${r.errs.length} lỗi`);
  process.exit(r.errs.length ? 1 : 0);
}
