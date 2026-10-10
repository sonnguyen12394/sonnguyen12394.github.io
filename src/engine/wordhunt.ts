// Mỏ Chữ (v95, game chủ lực thứ hai — GAME-CRITERIA §10.7): lưới chữ 6 × 7; vuốt qua các ô kề nhau (kể cả chéo) để tạo từ tiếng Anh.
// Ô dùng xong vỡ ra, chữ phía trên rơi xuống, chữ mới rơi vào từ trên. Mỗi màn có các NHIỆM VỤ: từ của cụm (u:) do bộ chọn chung đưa ra,
// gợi ý bằng nghĩa tiếng Việt; phải tìm hết trong số lượt vuốt cho phép (căng thẳng không cần đồng hồ — P15). Chữ là quân cờ (M1, HG24).
// Từ nhiệm vụ luôn có đường trên lưới: nếu bị phá mất thì được gieo lại. Từ dài (≥ 5 chữ) để lại ô đá quý: dùng ô đá quý thì vỡ cả hàng.
// Thuần hàm, theo seed. Đổi điểm / lượt / ô đặc biệt là độ khó game (P14), không đổi cách chấm năng lực.

import { rand, isWord, type Lex } from './wordwheel.ts';

export const COLS = 6, ROWS = 7, N = COLS * ROWS;
export type Special = '' | 'gem' | 'gold';
export interface Cell { ch: string; sp: Special; id: number }   // id: định danh ô (để vẽ hiệu ứng rơi)
export interface Mission { en: string; vi: string; node: string; id: string; pic?: string; target: boolean }
export interface HuntLevel { grid: Cell[]; missions: Mission[]; moves: number; nextId: number }

// Chữ lấp chỗ theo tần suất tiếng Anh (bỏ bớt chữ hiếm để lưới dễ ghép từ).
const FREQ = 'eeeeeeeeeeeettttttttaaaaaaaaooooooooiiiiiiinnnnnnnsssssshhhhhhrrrrrrddddllllcccuuummmwwffggyyppbbvk';
const letter = (r: () => number) => FREQ[Math.floor(r() * FREQ.length)]!;
export const idx = (c: number, r: number) => r * COLS + c;
export const col = (i: number) => i % COLS;
export const row = (i: number) => Math.floor(i / COLS);
export const adjacent = (a: number, b: number) => a !== b && Math.abs(col(a) - col(b)) <= 1 && Math.abs(row(a) - row(b)) <= 1;
export const wordOf = (g: Cell[], path: number[]) => path.map(i => g[i]!.ch).join('');

// Đường đi kề nhau (không lặp ô) mang đúng chữ của từ; null nếu không có. DFS.
export function findPath(g: Cell[], word: string): number[] | null {
  const w = word.toLowerCase();
  const go = (path: number[]): number[] | null => {
    if (path.length === w.length) return path;
    const last = path[path.length - 1]!;
    for (let i = 0; i < N; i++) if (!path.includes(i) && adjacent(last, i) && g[i]!.ch === w[path.length]) { const r = go([...path, i]); if (r) return r; }
    return null;
  };
  for (let i = 0; i < N; i++) if (g[i]!.ch === w[0]) { const r = go([i]); if (r) return r; }
  return null;
}
// Gieo một từ thành đường kề ngẫu nhiên, tránh các ô "khoá" (ô của từ nhiệm vụ khác vừa gieo). Trả về đường hoặc null.
function plantPath(len: number, r: () => number, locked: Set<number>): number[] | null {
  for (let tries = 0; tries < 60; tries++) {
    const start = Math.floor(r() * N); if (locked.has(start)) continue;
    const path = [start];
    while (path.length < len) {
      const last = path[path.length - 1]!, opts: number[] = [];
      for (let i = 0; i < N; i++) if (!path.includes(i) && !locked.has(i) && adjacent(last, i)) opts.push(i);
      if (!opts.length) break;
      path.push(opts[Math.floor(r() * opts.length)]!);
    }
    if (path.length === len) return path;
  }
  return null;
}
export function plant(g: Cell[], word: string, r: () => number, locked = new Set<number>()): boolean {
  const p = plantPath(word.length, r, locked); if (!p) return false;
  p.forEach((i, k) => { g[i] = { ...g[i]!, ch: word[k]! }; locked.add(i); });
  return true;
}

// Đường cong độ khó theo màn (P14): số nhiệm vụ và lượt vuốt.
export function huntCurve(level: number): { missions: number; maxLen: number; spare: number } {
  const missions = level <= 3 ? 3 : level <= 15 ? 4 : 5, maxLen = level <= 5 ? 5 : 6, spare = level <= 3 ? 8 : level <= 10 ? 6 : 4;
  return { missions, maxLen, spare };
}
export function newLevel(seed: number, pool: Mission[], want: { missions: number; maxLen: number; spare: number }): HuntLevel | null {
  const r = rand(seed), ms: Mission[] = [], seen = new Set<string>();
  const cands = pool.filter(m => isWord(m.en) && m.en.length >= 3 && m.en.length <= want.maxLen);
  const order = cands.map(m => ({ m, k: (m.target ? 0 : 1) + r() })).sort((a, b) => a.k - b.k).map(x => x.m);
  for (const m of order) { if (ms.length >= want.missions) break; if (!seen.has(m.en)) { seen.add(m.en); ms.push(m); } }
  if (ms.length < Math.min(2, want.missions)) return null;
  let id = 0;
  const grid: Cell[] = Array.from({ length: N }, () => ({ ch: letter(r), sp: '' as Special, id: id++ }));
  const locked = new Set<number>();
  for (const m of ms) if (!plant(grid, m.en, r, locked)) return null;
  return { grid, missions: ms, moves: ms.length * 2 + want.spare, nextId: id };
}

// Áp một từ: vỡ các ô của đường (ô đá quý → vỡ thêm cả hàng của nó), chữ trên rơi xuống, chữ mới lấp từ trên. Từ ≥ 5 chữ để lại một ô
// đá quý ở chỗ chữ cuối (sau khi rơi, ở cột đó). Trả về lưới mới, các ô đã vỡ (để vẽ) và độ rơi của từng ô (theo id).
export function applyWord(g0: Cell[], path: number[], seed: number, nextId: number): { grid: Cell[]; broken: number[]; fall: Record<number, number>; nextId: number; gemRow: number[] } {
  const r = rand(seed), broken = new Set(path), gemRow: number[] = [];
  for (const i of path) if (g0[i]!.sp === 'gem') for (let c = 0; c < COLS; c++) { const j = idx(c, row(i)); if (!broken.has(j)) { broken.add(j); gemRow.push(j); } }
  const g: Cell[] = new Array(N), fall: Record<number, number> = {};
  for (let c = 0; c < COLS; c++) {
    const keep: Cell[] = [];
    for (let rr = ROWS - 1; rr >= 0; rr--) { const i = idx(c, rr); if (!broken.has(i)) keep.push(g0[i]!); }
    let rr = ROWS - 1;
    for (const cell of keep) { g[idx(c, rr)] = cell; rr--; }
    const gaps = rr + 1;
    for (; rr >= 0; rr--) { const cell: Cell = { ch: letter(r), sp: r() < 0.05 ? 'gold' : '', id: nextId++ }; g[idx(c, rr)] = cell; fall[cell.id] = gaps; }
    // độ rơi của ô cũ: số ô vỡ bên dưới nó trong cột
    for (let k = 0; k < ROWS; k++) { const cell = g[idx(c, k)]!; if (fall[cell.id] === undefined) { const old = g0.findIndex(x => x.id === cell.id); fall[cell.id] = k - row(old); } }
  }
  if (path.length >= 5) { const lastCol = col(path[path.length - 1]!); const top = g.findIndex((x, i) => col(i) === lastCol && fall[x.id]! > 0); const at = top >= 0 ? top : idx(lastCol, 0); g[at] = { ...g[at]!, sp: 'gem' }; }
  return { grid: g, broken: [...broken], fall, nextId, gemRow };
}
// Giữ cho mọi nhiệm vụ còn lại luôn tìm được: từ nào mất đường thì gieo lại.
export function keepSolvable(g: Cell[], left: Mission[], seed: number): string[] {
  const r = rand(seed), redone: string[] = [], locked = new Set<number>();
  for (const m of left) { const p = findPath(g, m.en); if (p) p.forEach(i => locked.add(i)); }
  for (const m of left) if (!findPath(g, m.en) && plant(g, m.en, r, locked)) redone.push(m.en);
  return redone;
}
// Điểm game (telemetry): 10 / chữ, từ dài nhân thêm, ô vàng ×2, mỗi ô vỡ thêm nhờ đá quý +5.
export function points(word: string, gold: boolean, extra: number): number {
  const base = word.length * 10 * (word.length >= 6 ? 3 : word.length >= 5 ? 2 : 1);
  return (gold ? base * 2 : base) + extra * 5;
}
export const huntStars = (movesLeft: number, total: number): number => (movesLeft >= total * 0.4 ? 3 : movesLeft >= total * 0.15 ? 2 : 1);

// Thử thách ngày: cùng lưới cho mọi người (nhiệm vụ từ kho cấp A1–A2), không ghi bằng chứng.
export function dailyHunt(day: number, lex: Lex[]): HuntLevel | null {
  const pool = lex.filter(x => isWord(x.en) && x.en.length >= 3 && x.en.length <= 5 && (x.lv === 'A1' || x.lv === 'A2')).sort((a, b) => (a.en < b.en ? -1 : 1))
    .map(x => ({ en: x.en, vi: x.vi, node: x.node, id: x.id, ...(x.pic ? { pic: x.pic } : {}), target: false }));
  const r = rand(day * 7919 + 13), pick: Mission[] = [];
  for (let k = 0; k < 4 && pool.length; k++) pick.push(pool.splice(Math.floor(r() * pool.length), 1)[0]!);
  return newLevel(day * 31 + 7, pick, { missions: 4, maxLen: 5, spare: 6 });
}

export interface HuntSave { lv: number; stars: number; words: number; runs: number; best: number; day: number; daily: { day: number; done: boolean; streak: number } }
export const freshHuntSave = (): HuntSave => ({ lv: 1, stars: 0, words: 0, runs: 0, best: 0, day: 0, daily: { day: 0, done: false, streak: 0 } });
export function sanitizeHunt(raw: unknown): HuntSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : d);
  const d = (x.daily && typeof x.daily === 'object' ? x.daily : {}) as Record<string, unknown>;
  return { lv: Math.max(1, n(x.lv, 1e6, 1)), stars: n(x.stars, 1e8), words: n(x.words, 1e8), runs: n(x.runs, 1e7), best: n(x.best, 1e9), day: n(x.day, 1e6), daily: { day: n(d.day, 1e6), done: !!d.done, streak: n(d.streak, 1e5) } };
}
export function mergeHunt(a?: HuntSave, b?: HuntSave): HuntSave | undefined {
  if (!a) return b; if (!b) return a;
  const daily = a.daily.day !== b.daily.day ? (a.daily.day > b.daily.day ? a.daily : b.daily) : a.daily.done ? a.daily : b.daily;
  return { lv: Math.max(a.lv, b.lv), stars: Math.max(a.stars, b.stars), words: Math.max(a.words, b.words), runs: Math.max(a.runs, b.runs), best: Math.max(a.best, b.best), day: Math.max(a.day, b.day), daily };
}
