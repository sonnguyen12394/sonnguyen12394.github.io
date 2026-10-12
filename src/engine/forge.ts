// v129 Lò rèn năng lực (GAME-CRITERIA §16): mỗi kỹ năng của mục tiêu là một món đồ 5 bậc, bậc = mức đạt THẬT trong engine
// (🪨 Mảnh = Nhận ra · 🔩 Phôi = Hiểu · ⚙️ Linh kiện = Nhớ ra · 🛠️ Đồ = Dùng có kiểm soát · 💎 Báu vật = Dùng tự do).
// Đề lấy từ chính nội dung của nút (câu dò, câu xếp lá, câu sửa lỗi, câu ở ngữ cảnh mới, câu chức năng), không có bộ đề riêng để
// học thuộc. Câu trả lời là bằng chứng thật (ctx 'forge') đi qua cùng cổng ingest: luật đoán mò, lặp lại, câu mới, xác minh mức 4–5
// giữ nguyên. Hai cách rèn: 🔨 từ dưới (kỹ năng mới, có thẻ dạy trước) và ⚡ vượt bậc (thử bậc cao trước; đúng thì bậc dưới được
// tính theo luật lan xuống của engine, sai thì lùi một bậc, không mất gì). Mỗi kỹ năng mỗi ngày tối đa FORGE_CAP lượt có tính.
// Thuần hàm.

import type { Level } from './types.ts';

// Lượt có tính mỗi kỹ năng mỗi ngày: bằng mức trần của Leo tháp cho người đang đúng nhiều (QUEST.capDay 3 → 5), để Lò rèn không thành
// đường tắt dồn bằng chứng trong một ngày (giãn cách giúp nhớ lâu; mức 4–5 còn cần câu mới, cách ngày).
export const FORGE_CAP = 5;
export const FORGE_LEN = 5;           // số câu mỗi lần rèn
export const TIER_F: Array<[string, string]> = [['⬜', 'Chưa rèn'], ['🪨', 'Mảnh'], ['🔩', 'Phôi'], ['⚙️', 'Linh kiện'], ['🛠️', 'Đồ'], ['💎', 'Báu vật']];
export const LEVEL_DO: Record<Level, string> = { 1: 'Nhận ra', 2: 'Hiểu', 3: 'Nhớ ra (tự gõ / tự xếp)', 4: 'Dùng có kiểm soát (sửa câu, câu lạ)', 5: 'Dùng tự do' };
export const FORGEABLE = /^(u|g|ph|fn):/;

export type FKind = 'mcq' | 'typed' | 'order' | 'fix';
export interface FItem { id: string; level: Level; g: number; kind: FKind; prompt: string; opts?: string[]; ans?: number; accept?: string[]; tokens?: string[]; tiles?: string[]; say?: string; bad?: string; why?: string; novel?: boolean }

// ---------- Chuẩn hoá đề từ các nguồn của app ----------
type Probe = { id: string; level: number; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[]; say?: string; tip?: string };
type Order = { id: string; level: number; g: number; prompt: string; tokens: string[]; distract: string[]; why?: string };
type Fix = { id: string; level: number; prompt: string; bad: string; accept: string[]; why: string };
type Fn = { id: string; level: number; g: number; prompt: string; opts: string[]; ans: number; why?: string; say?: string };
const lv = (n: number): Level => Math.max(1, Math.min(5, Math.round(n))) as Level;
export function shuffle<T>(xs: T[], seed: number): T[] { const a = [...xs]; let s = seed >>> 0 || 7; for (let i = a.length - 1; i > 0; i--) { s = (s * 1103515245 + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; }
export function poolOf(src: { probe?: Probe[]; order?: Order[]; fix?: Fix[]; fn?: Fn[]; transfer?: Probe[] }, seed = 1): FItem[] {
  const out: FItem[] = [];
  for (const p of src.probe ?? []) out.push({ id: p.id, level: lv(p.level), g: p.g, kind: p.opts ? 'mcq' : 'typed', prompt: p.prompt, ...(p.opts ? { opts: p.opts, ans: p.ans ?? 0 } : { accept: p.accept ?? [] }), ...(p.say ? { say: p.say } : {}), ...(p.tip ? { why: p.tip } : {}) });
  for (const p of src.transfer ?? []) if (!out.some(x => x.id === p.id)) out.push({ id: p.id, level: lv(p.level), g: p.g, kind: p.opts ? 'mcq' : 'typed', prompt: p.prompt, ...(p.opts ? { opts: p.opts, ans: p.ans ?? 0 } : { accept: p.accept ?? [] }), ...(p.say ? { say: p.say } : {}), novel: true });
  for (const o of src.order ?? []) out.push({ id: o.id, level: lv(o.level), g: o.g, kind: 'order', prompt: o.prompt, tokens: o.tokens, tiles: shuffle([...o.tokens, ...o.distract.slice(0, 2)], seed ^ o.tokens.length), ...(o.why ? { why: o.why } : {}) });
  for (const f of src.fix ?? []) out.push({ id: f.id, level: lv(f.level), g: 0, kind: 'fix', prompt: f.prompt, bad: f.bad, accept: f.accept, why: f.why });
  for (const f of src.fn ?? []) out.push({ id: f.id, level: lv(f.level), g: f.g, kind: 'mcq', prompt: f.prompt, opts: f.opts, ans: f.ans, ...(f.say ? { say: f.say } : {}), ...(f.why ? { why: f.why } : {}) });
  return out;
}
// Câu ở ngữ cảnh mới (transfer) giữ đúng mức của câu (như màn transfer của app); được ưu tiên ở mức cao (pickItem).

// ---------- Chấm ----------
export const norm = (s: string): string => s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
export function grade(it: FItem, a: { pick?: number; text?: string; order?: number[] }): { ok: boolean; given: string; right: string } {
  if (it.kind === 'mcq') { const given = it.opts?.[a.pick ?? -1] ?? ''; return { ok: a.pick === it.ans, given, right: it.opts?.[it.ans ?? 0] ?? '' }; }
  if (it.kind === 'order') { const given = (a.order ?? []).map(i => it.tiles?.[i] ?? '').join(' '); return { ok: norm(given) === norm((it.tokens ?? []).join(' ')), given, right: (it.tokens ?? []).join(' ') }; }
  const given = (a.text ?? '').trim(); return { ok: !!given && (it.accept ?? []).some(x => norm(x) === norm(given)), given, right: it.accept?.[0] ?? '' };
}

// ---------- Bậc và chọn câu ----------
// Bậc = mức cao nhất đang Đạt (bằng chứng mức cao tính cho mức thấp, nên bậc liền mạch).
export const tierOf = (pass: (l: Level) => boolean): number => ([5, 4, 3, 2, 1] as Level[]).find(l => pass(l)) ?? 0;
export const maxLevel = (pool: FItem[]): number => Math.max(0, ...pool.map(x => x.level));
// Câu cho một mức: đúng mức trước; thiếu thì mức gần nhất bên dưới. Ưu tiên câu chưa trả lời gần đây, rồi câu mới (transfer).
export function pickItem(pool: FItem[], level: number, recent: Set<string>, used: Set<string>, seed: number): FItem | null {
  for (let l = level; l >= 1; l--) {
    const at = pool.filter(x => x.level === l && !used.has(x.id));
    if (!at.length) continue;
    const fresh = at.filter(x => !recent.has(x.id)), list = fresh.length ? fresh : at;
    const nov = list.filter(x => x.novel);
    const pickFrom = nov.length && l >= 4 ? nov : list;
    return pickFrom[seed % pickFrom.length]!;
  }
  return null;
}

// ---------- Một lần rèn ----------
export type FMode = 'up' | 'jump';
export interface FRun { node: string; vi: string; need: Level; mode: FMode; cur: number; top: number; t0: number; tier0: number; n: number; ok: number; streak: number; used: string[]; item: FItem | null; res: { ok: boolean; right: string; why?: string } | null; sel: number[]; done: boolean; teach: boolean; capped: boolean; up: number[] }
// Mức bắt đầu: từ dưới = bậc hiện tại + 1; vượt bậc = mức mục tiêu cần (hoặc cao nhất có câu).
export function startLevel(mode: FMode, tier: number, need: number, top: number): number {
  const hi = Math.max(1, Math.min(top || 1, 5));
  return mode === 'jump' ? Math.min(hi, Math.max(need, tier + 1)) : Math.min(hi, tier + 1);
}
// Sau mỗi câu: từ dưới: đúng 2 câu liền thì lên mức (không quá mức cao nhất có câu); sai thì ở lại.
// Vượt bậc: đúng thì giữ (hoặc lên nếu còn bậc cao hơn); sai thì lùi một mức.
export function step(r: Pick<FRun, 'mode' | 'cur' | 'top' | 'streak'>, ok: boolean): { cur: number; streak: number } {
  if (ok) { const s = r.streak + 1; return s >= 2 && r.cur < r.top ? { cur: r.cur + 1, streak: 0 } : { cur: r.cur, streak: s }; }
  return { cur: r.mode === 'jump' ? Math.max(1, r.cur - 1) : r.cur, streak: 0 };
}

// ---------- Độ phủ cấp ----------
export type Area = 'u' | 'g' | 'fn' | 'ph' | 'other';
export const AREA_F: Record<Area, string> = { u: '📚 Từ vựng', g: '🧩 Ngữ pháp', fn: '💬 Chức năng giao tiếp', ph: '🔤 Âm', other: '🎯 Can-Do & kỹ năng (đo bằng bài làm: đọc, nghe, viết, nói)' };
export const areaOf = (node: string): Area => { const k = node.split(':')[0]!; return k === 'u' || k === 'g' || k === 'fn' || k === 'ph' ? k : 'other'; };
export interface Cov { node: string; vi: string; need: Level; tier: number; pass: boolean; area: Area }
export function coverage(rows: Cov[]): { done: number; total: number; by: Array<{ area: Area; done: number; total: number; rows: Cov[] }>; missing: Cov[] } {
  const by = (Object.keys(AREA_F) as Area[]).map(area => { const rs = rows.filter(r => r.area === area); return { area, done: rs.filter(r => r.pass).length, total: rs.length, rows: rs }; }).filter(x => x.total);
  return { done: rows.filter(r => r.pass).length, total: rows.length, by, missing: rows.filter(r => !r.pass) };
}
