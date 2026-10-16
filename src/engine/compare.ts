// v135 Một não, hai lối (docs/DOI-CHIEU-GAME-APP.md): người chơi vào bằng lối ⚔️ Chiến Binh (game) hoặc 📘 Học (app cũ).
// Tiến độ, bằng chứng, FSRS, bản đồ A2 vẫn DÙNG CHUNG. Chỉ thêm một bộ đếm nhỏ: mỗi nút có bao nhiêu câu trả lời đúng ở lối nào,
// để màn đối chiếu chỉ ra phần A2 nào vững nhờ game, phần nào nhờ app, phần nào game chưa có lò.
// Bộ đếm chỉ ĐỌC kết quả của ingest (không đổi bằng chứng, không đổi mastery). Thuần hàm.

export type Door = 'game' | 'app';
export interface SrcCell { g: number; a: number }   // số câu đúng có tính ở lối game / lối app
export type SrcMap = Record<string, SrcCell>;

// Lối đang dùng: cài đặt của app (st.set.door). Mặc định là lối game (hướng Chiến Binh Chữ).
export const doorOf = (root: unknown): Door => {
  const set = root && typeof root === 'object' ? (root as { set?: { door?: unknown } }).set : undefined;
  return set && set.door === 'app' ? 'app' : 'game';
};

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

// ---------- Bảng đối chiếu theo nhóm A2 ----------
export type Grp = 'u' | 'g' | 'ph' | 'fn' | 'cd';
export const GRPS: Array<{ id: Grp; ico: string; vi: string }> = [
  { id: 'u', ico: '📚', vi: 'Từ vựng' }, { id: 'g', ico: '🧩', vi: 'Ngữ pháp' }, { id: 'ph', ico: '🔊', vi: 'Phát âm' },
  { id: 'fn', ico: '💬', vi: 'Chức năng giao tiếp' }, { id: 'cd', ico: '🎯', vi: 'Việc làm được (đọc, nghe, nói, viết)' },
];
// Nhóm mà vòng game hiện có lý do để học (cho tinh hoa → rèn đồ → thắng trận). Mốc 1: chỉ ô Vũ khí = Từ vựng (cb.ts essOf).
export const GAME_PULL: ReadonlySet<Grp> = new Set<Grp>(['u']);

export interface GrpRow { id: Grp; ico: string; vi: string; total: number; solid: number; game: number; app: number; both: number; before: number; ansG: number; ansA: number; pull: boolean }
export interface CmpOut { rows: GrpRow[]; total: number; solid: number; game: number; app: number; both: number; before: number; ansG: number; ansA: number }

// need: các nút của đích (đóng tiền đề) kèm mức cần; solid(node, level): đã vững thật ở mức đó.
export function compareOf(need: Array<{ node: string; level: number }>, solid: (node: string, level: number) => boolean, src: SrcMap | undefined, pull: ReadonlySet<Grp> = GAME_PULL): CmpOut {
  const s = src ?? {};
  const rows: GrpRow[] = GRPS.map(g => ({ ...g, total: 0, solid: 0, game: 0, app: 0, both: 0, before: 0, ansG: 0, ansA: 0, pull: pull.has(g.id) }));
  const by = new Map(rows.map(r => [r.id, r]));
  const seen = new Set<string>();
  for (const r of need) {
    if (seen.has(r.node)) continue; seen.add(r.node);
    const row = by.get(r.node.split(':')[0] as Grp); if (!row) continue;
    const c = s[r.node] ?? { g: 0, a: 0 };
    row.total++; row.ansG += c.g; row.ansA += c.a;
    if (!solid(r.node, r.level)) continue;
    row.solid++;
    if (c.g && c.a) row.both++; else if (c.g) row.game++; else if (c.a) row.app++; else row.before++;
  }
  const sum = (k: keyof Pick<GrpRow, 'total' | 'solid' | 'game' | 'app' | 'both' | 'before' | 'ansG' | 'ansA'>) => rows.reduce((a, r) => a + r[k], 0);
  return { rows, total: sum('total'), solid: sum('solid'), game: sum('game'), app: sum('app'), both: sum('both'), before: sum('before'), ansG: sum('ansG'), ansA: sum('ansA') };
}

// Một câu kết luận, nói thẳng (không dùng chữ "thi / đề / kiểm tra").
// cap: số kỹ năng vững mà vòng game còn đòi (rèn tới bậc Vũ khí cao nhất); quá số này thì game hết lý do học.
export function cmpVerdict(o: CmpOut, cap?: number): string {
  const pulled = o.rows.filter(r => r.pull && r.total).map(r => r.vi), off = o.rows.filter(r => !r.pull && r.total);
  const capTxt = cap ? `, và chỉ tới khi đủ ${cap} kỹ năng vững (${o.total ? Math.max(1, Math.round((100 * cap) / o.total)) : 0}% của ${o.total} phần cần cho đích)` : '';
  const head = pulled.length ? `Game hiện chỉ cho lý do học ${pulled.join(', ')}${capTxt}.` : 'Game hiện chưa cho lý do học nhóm nào của đích.';
  const tail = off.length ? ` ${off.map(r => r.vi).join(', ')}: chỉ học được ở lối 📘 Học.` : '';
  return head + tail;
}
