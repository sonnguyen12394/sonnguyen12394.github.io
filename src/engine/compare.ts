// v136–v138 nguồn câu đúng + đối chiếu (docs/DOI-CHIEU-GAME-APP.md). Ba phần ⚔️ Chơi · 📘 Học · 🎯 Mục tiêu dùng chung một bộ não:
// tiến độ, bằng chứng, FSRS, bản đồ A2. Chỉ thêm một bộ đếm nhỏ: mỗi nút có bao nhiêu câu đúng ở phần game / phần học app,
// để 🎯 Mục tiêu chỉ ra phần nào vững nhờ game, phần nào nhờ app, kỹ năng nào game chưa có lò.
// Bộ đếm chỉ ĐỌC kết quả của ingest (không đổi bằng chứng, không đổi mastery). Thuần hàm.

export type Door = 'game' | 'app';
export interface SrcCell { g: number; a: number }   // số câu đúng có tính ở phần game / phần học app
export type SrcMap = Record<string, SrcCell>;

// v138 ba phần (Chơi · Học · Mục tiêu): không còn đổi lối. Nguồn của câu đúng = NƠI học: ngữ cảnh của lò game
// (Vườn từ, Vòng Chữ, Mỏ Chữ, Lò rèn = cb.ts ESS_GAMES; test khoá hai danh sách khớp nhau) là game, mọi chỗ khác là app.
export const GAME_CTX: ReadonlySet<string> = new Set(['learn', 'wheel', 'hunt', 'forge']);
export const doorOfCtx = (ctx: unknown): Door => (typeof ctx === 'string' && GAME_CTX.has(ctx) ? 'game' : 'app');

const NODE = /^(cd|u|g|ph|fn):[a-z0-9][a-z0-9._-]{0,60}$/;
const CAP = 1e6;
const cnt = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(CAP, Math.round(v))) : 0);

// Ghi một câu: chỉ câu đúng đã vào sổ (ingest trả về sự kiện) mới đếm.
export function tally(src: SrcMap, node: string, ok: boolean, counted: boolean, door: Door): void {
  if (!ok || !counted || !NODE.test(node)) return;
  const c = src[node] ?? (src[node] = { g: 0, a: 0 });
  if (door === 'game') c.g = Math.min(CAP, c.g + 1); else c.a = Math.min(CAP, c.a + 1);
}

export function sanitizeSrc(raw: unknown): SrcMap | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: SrcMap = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!NODE.test(k) || !v || typeof v !== 'object') continue;
    const x = v as Record<string, unknown>, c = { g: cnt(x.g), a: cnt(x.a) };
    if (c.g || c.a) out[k] = c;
  }
  return Object.keys(out).length ? out : undefined;
}

// Đồng bộ hai máy: lấy số lớn hơn từng ô (không cộng, để không đếm trùng).
export function mergeSrc(a?: SrcMap, b?: SrcMap): SrcMap | undefined {
  if (!a) return b; if (!b) return a;
  const out: SrcMap = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = { g: Math.max(a[k]?.g ?? 0, b[k]?.g ?? 0), a: Math.max(a[k]?.a ?? 0, b[k]?.a ?? 0) };
  return out;
}

// ---------- Bảng đối chiếu theo 7 kỹ năng (v137) ----------
// Kỹ năng = trường `area` của nút; khớp 1–1 với 7 ô đồ của game (SPEC khối 13/10/2026 mục 5). Chức năng giao tiếp (fn) có area spk → Nói.
export type Grp = 'voc' | 'gra' | 'pro' | 'lis' | 'spk' | 'rd' | 'wr';
export const SKILLS: Array<{ id: Grp; ico: string; vi: string; slot: string; mid?: true }> = [
  { id: 'voc', ico: '📚', vi: 'Từ vựng', slot: 'Vũ khí' }, { id: 'gra', ico: '🧩', vi: 'Ngữ pháp', slot: 'Giáp' },
  { id: 'pro', ico: '🔊', vi: 'Phát âm', slot: 'Giày' }, { id: 'lis', ico: '🎧', vi: 'Nghe', slot: 'Khiên' },
  { id: 'spk', ico: '🗣️', vi: 'Nói', slot: 'Bùa', mid: true }, { id: 'rd', ico: '📖', vi: 'Đọc', slot: 'Mũ' },
  { id: 'wr', ico: '✍️', vi: 'Viết', slot: 'Nhẫn', mid: true },
];
export const isGrp = (v: unknown): v is Grp => SKILLS.some(k => k.id === v);
// Nhóm mà vòng game hiện có lý do để học (cho tinh hoa → rèn đồ → thắng trận). Mốc 1: chỉ ô Vũ khí = Từ vựng (cb.ts essOf).
export const GAME_PULL: ReadonlySet<Grp> = new Set<Grp>(['voc']);

export interface GrpRow { id: Grp; ico: string; vi: string; slot: string; mid: boolean; total: number; solid: number; game: number; app: number; both: number; before: number; ansG: number; ansA: number; pull: boolean }
export interface CmpOut { rows: GrpRow[]; total: number; solid: number; game: number; app: number; both: number; before: number; ansG: number; ansA: number }
export interface Need { node: string; level: number; area?: string }

// need: các nút của đích (đóng tiền đề) kèm mức cần và kỹ năng; solid(node, level): đã vững thật ở mức đó.
export function compareOf(need: Need[], solid: (node: string, level: number) => boolean, src: SrcMap | undefined, pull: ReadonlySet<Grp> = GAME_PULL): CmpOut {
  const s = src ?? {};
  const rows: GrpRow[] = SKILLS.map(g => ({ id: g.id, ico: g.ico, vi: g.vi, slot: g.slot, mid: !!g.mid, total: 0, solid: 0, game: 0, app: 0, both: 0, before: 0, ansG: 0, ansA: 0, pull: pull.has(g.id) }));
  const by = new Map(rows.map(r => [r.id, r]));
  const seen = new Set<string>();
  for (const r of need) {
    if (seen.has(r.node)) continue; seen.add(r.node);
    const row = isGrp(r.area) ? by.get(r.area) : undefined; if (!row) continue;
    const c = s[r.node] ?? { g: 0, a: 0 };
    row.total++; row.ansG += c.g; row.ansA += c.a;
    if (!solid(r.node, r.level)) continue;
    row.solid++;
    if (c.g && c.a) row.both++; else if (c.g) row.game++; else if (c.a) row.app++; else row.before++;
  }
  const sum = (k: keyof Pick<GrpRow, 'total' | 'solid' | 'game' | 'app' | 'both' | 'before' | 'ansG' | 'ansA'>) => rows.reduce((a, r) => a + r[k], 0);
  return { rows, total: sum('total'), solid: sum('solid'), game: sum('game'), app: sum('app'), both: sum('both'), before: sum('before'), ansG: sum('ansG'), ansA: sum('ansA') };
}

// Bảng 7 kỹ năng ở Thư viện: % vững từng kỹ năng; "thiếu nhất" = kỹ năng % thấp nhất còn phần chưa vững.
export interface SkillRow { id: Grp; ico: string; vi: string; slot: string; mid: boolean; solid: number; total: number; low: boolean }
export function skillRows(o: CmpOut): SkillRow[] {
  const open = o.rows.filter(r => r.total && r.solid < r.total);
  const lowId = open.length ? open.reduce((a, r) => (r.solid / r.total < a.solid / a.total ? r : a)).id : null;
  return o.rows.filter(r => r.total).map(r => ({ id: r.id, ico: r.ico, vi: r.vi, slot: r.slot, mid: r.mid, solid: r.solid, total: r.total, low: r.id === lowId }));
}

// Một câu kết luận, nói thẳng (không dùng chữ "thi / đề / kiểm tra").
// cap: số kỹ năng vững mà vòng game còn đòi (rèn tới bậc Vũ khí cao nhất); quá số này thì game hết lý do học.
export function cmpVerdict(o: CmpOut, cap?: number): string {
  const pulled = o.rows.filter(r => r.pull && r.total).map(r => r.vi), off = o.rows.filter(r => !r.pull && r.total);
  const capTxt = cap ? `, và chỉ tới khi đủ ${cap} kỹ năng vững (${o.total ? Math.max(1, Math.round((100 * cap) / o.total)) : 0}% của ${o.total} phần cần cho đích)` : '';
  const head = pulled.length ? `Game hiện chỉ cho lý do học ${pulled.join(', ')}${capTxt}.` : 'Game hiện chưa cho lý do học nhóm nào của đích.';
  const tail = off.length ? ` ${off.map(r => r.vi).join(', ')}: hiện chỉ học được ở phần 📘 Học.` : '';
  return head + tail;
}
