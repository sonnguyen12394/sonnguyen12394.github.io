// Xếp Khối Chữ (v72): bàn 8 × 8, đặt khối tự do, đầy hàng / cột thì xoá. Thuần hàm, seed cố định (test được).
// Học ẩn trong game: mỗi bộ khối có được sau MỘT câu trả lời do engine chọn (main.ts dùng lại qItem / qAnswer của tháp).
// Đúng / sai chỉ đổi phần thưởng game (khối đặc biệt), không bao giờ khoá người chơi; hình khối lấy theo seed, độc lập với nút và mức
// của câu (P14: độ khó game tách khỏi độ khó ngôn ngữ). Điểm, kỷ lục chỉ là số game (telemetry), không vào mastery (P13).
// Bộ hình khối và bảng màu là của app (không phải bộ 7 khối rơi của thể loại khác); đặt tự do, không rơi, không có thời gian.

export const N = 8;
export type Cell = readonly [number, number];   // [hàng, cột]
export type Special = 'bomb' | 'bolt';           // 💣 nổ vùng 3 × 3 · ⚡ xoá cả hàng và cột của ô đặt
export interface Piece { s: number; c: number; sp?: Special }
export interface BlockState { g: number[]; tray: Array<Piece | null>; score: number; combo: number; lines: number; seed: number; n: number }

// Bộ hình riêng của app: 1–3 ô, góc nhỏ, góc lớn, vuông 2 × 2 / 3 × 3, chữ thập, thanh 4–5 ô.
export const SHAPES: ReadonlyArray<ReadonlyArray<Cell>> = [
  [[0, 0]],
  [[0, 0], [0, 1]], [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
];
export const COLORS = 6;
const SPECIAL_SHAPE = 0;   // khối đặc biệt chiếm 1 ô

// PRNG mulberry32: cùng seed → cùng chuỗi khối (test, chơi lại công bằng).
export function rand(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function freshBlocks(seed: number): BlockState { return { g: Array(N * N).fill(0), tray: [], score: 0, combo: 0, lines: 0, seed: seed >>> 0, n: 0 }; }

// Bộ 3 khối kế tiếp (theo seed và số khối đã chia). `sp`: thêm một khối đặc biệt (thưởng khi trả lời đúng).
export function deal(st: BlockState, sp?: Special): Piece[] {
  const r = rand(st.seed + st.n * 7919), out: Piece[] = [];
  for (let k = 0; k < 3; k++) out.push({ s: Math.floor(r() * SHAPES.length), c: 1 + Math.floor(r() * COLORS) });
  st.n++;
  if (sp) out.push({ s: SPECIAL_SHAPE, c: 0, sp });
  st.tray = out;
  return out;
}

const at = (r: number, c: number) => r * N + c;
export function canPlace(g: number[], p: Piece, r: number, c: number): boolean {
  if (p.sp) return r >= 0 && r < N && c >= 0 && c < N && (p.sp === 'bomb' || p.sp === 'bolt' || !g[at(r, c)]);
  return SHAPES[p.s]!.every(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && rr < N && cc >= 0 && cc < N && !g[at(rr, cc)]; });
}
export function fits(g: number[], p: Piece): boolean {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (canPlace(g, p, r, c)) return true;
  return false;
}
// Còn khối nào trong khay đặt được không (hết thì hết ván).
export function anyFits(st: BlockState): boolean { return st.tray.some(p => !!p && fits(st.g, p)); }

export interface Placed { cells: number; cleared: number; gained: number; boom: number[] }
// Đặt khối `i` của khay với góc trên-trái tại (r, c). Trả về null nếu không đặt được.
export function place(st: BlockState, i: number, r: number, c: number): Placed | null {
  const p = st.tray[i];
  if (!p || !canPlace(st.g, p, r, c)) return null;
  const boom: number[] = [];
  if (p.sp === 'bomb') { for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N && st.g[at(rr, cc)]) { st.g[at(rr, cc)] = 0; boom.push(at(rr, cc)); } } }
  else if (p.sp === 'bolt') { for (let k = 0; k < N; k++) { for (const x of [at(r, k), at(k, c)]) if (st.g[x]) { st.g[x] = 0; boom.push(x); } } }
  else for (const [dr, dc] of SHAPES[p.s]!) st.g[at(r + dr, c + dc)] = p.c;
  st.tray[i] = null;
  const cells = p.sp ? 0 : SHAPES[p.s]!.length;
  // Hàng / cột đầy → xoá (tính cùng lúc, ô chung của hàng và cột chỉ xoá một lần).
  const full: number[] = [];
  for (let k = 0; k < N; k++) {
    if (Array.from({ length: N }, (_, j) => st.g[at(k, j)]).every(Boolean)) for (let j = 0; j < N; j++) full.push(at(k, j));
    if (Array.from({ length: N }, (_, j) => st.g[at(j, k)]).every(Boolean)) for (let j = 0; j < N; j++) full.push(at(j, k));
  }
  const lines = (() => { let n = 0; for (let k = 0; k < N; k++) { if (Array.from({ length: N }, (_, j) => st.g[at(k, j)]).every(Boolean)) n++; if (Array.from({ length: N }, (_, j) => st.g[at(j, k)]).every(Boolean)) n++; } return n; })();
  for (const x of full) st.g[x] = 0;
  st.combo = lines || boom.length ? st.combo + 1 : 0;
  st.lines += lines;
  const gained = cells + boom.length + lines * lines * 10 * Math.max(1, st.combo);
  st.score += gained;
  return { cells, cleared: lines, gained, boom: [...new Set([...full, ...boom])] };
}
// Ô neo của khối: ô đầu tiên của hình (hàng trên cùng, cột trái nhất của hàng đó) — người chơi chạm vào ô sẽ đặt chính ô này.
export const anchor = (p: Piece): Cell => (p.sp ? [0, 0] : SHAPES[p.s]![0]!);
export const trayEmpty = (st: BlockState): boolean => st.tray.every(p => !p);

// Bản lưu Xếp Khối (telemetry tier 0): kỷ lục, số ván, ngày chơi gần nhất, chuỗi ngày.
export interface BlocksSave { best: number; runs: number; day: number; streak: number }
export const freshBlocksSave = (): BlocksSave => ({ best: 0, runs: 0, day: 0, streak: 0 });
export function sanitizeBlocks(raw: unknown): BlocksSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { best: n(x.best, 1e9), runs: n(x.runs, 1e7), day: n(x.day, 1e6), streak: n(x.streak, 1e5) };
}
export function mergeBlocks(a?: BlocksSave, b?: BlocksSave): BlocksSave | undefined {
  if (!a) return b; if (!b) return a;
  const later = a.day >= b.day ? a : b;
  return { best: Math.max(a.best, b.best), runs: Math.max(a.runs, b.runs), day: later.day, streak: later.streak };
}
// Chuỗi ngày chơi: chơi hôm qua → +1, hôm nay đã chơi → giữ, nghỉ lâu hơn → về 1 (không phạt gì khác).
export function bumpStreak(s: BlocksSave, today: number): void {
  if (s.day === today) return;
  s.streak = s.day === today - 1 ? s.streak + 1 : 1; s.day = today;
}
