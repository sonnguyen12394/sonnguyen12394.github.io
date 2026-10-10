// Mỏ Chữ (v95, game chủ lực thứ hai — GAME-CRITERIA §10.7): lưới chữ 6 × 7; vuốt qua các ô kề nhau (kể cả chéo) để tạo từ tiếng Anh.
// Ô dùng xong vỡ ra, chữ phía trên rơi xuống, chữ mới rơi vào từ trên. Mỗi màn có các NHIỆM VỤ: từ của cụm (u:) do bộ chọn chung đưa ra,
// gợi ý bằng nghĩa tiếng Việt; phải tìm hết trong số lượt vuốt cho phép (căng thẳng không cần đồng hồ — P15). Chữ là quân cờ (M1, HG24).
// Từ nhiệm vụ luôn có đường trên lưới: nếu bị phá mất thì được gieo lại. Từ dài (≥ 5 chữ) để lại ô đá quý: dùng ô đá quý thì vỡ cả hàng.
// Thuần hàm, theo seed. Đổi điểm / lượt / ô đặc biệt là độ khó game (P14), không đổi cách chấm năng lực.

import { rand, isWord, type Lex } from './wordwheel.ts';

export const COLS = 6, ROWS = 7, N = COLS * ROWS;
export type Special = '' | 'gem' | 'gold' | 'chest';   // chest: rương (không có chữ, rơi theo trọng lực, tới hàng đáy thì thu được)
export interface Cell { ch: string; sp: Special; id: number }   // id: định danh ô (để vẽ hiệu ứng rơi)
export interface Mission { en: string; vi: string; node: string; id: string; pic?: string; target: boolean }
export type Goal = 'words' | 'ice' | 'chest';
// ice: lớp băng gắn với VỊ TRÍ ô (không rơi theo chữ), vỡ khi ô ở đó được dùng trong từ (hoặc đá quý phá hàng). chests: số rương cần đưa xuống đáy.
export interface HuntLevel { grid: Cell[]; missions: Mission[]; moves: number; nextId: number; goal: Goal; ice: boolean[]; chests: number }

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
export const usable = (c: Cell) => c.sp !== 'chest';
// v98: đường của từ bắt buộc đi qua ô `via` (rương kẹt ở hàng sát đáy cần đúng ô bên dưới bị phá).
export function findPathVia(g: Cell[], word: string, via: number): number[] | null {
  const w = word.toLowerCase();
  const go = (path: number[]): number[] | null => {
    if (path.length === w.length) return path.includes(via) ? path : null;
    const last = path[path.length - 1]!;
    for (let i = 0; i < N; i++) if (!path.includes(i) && adjacent(last, i) && g[i]!.ch === w[path.length]) { const r = go([...path, i]); if (r) return r; }
    return null;
  };
  for (let i = 0; i < N; i++) if (g[i]!.ch === w[0] && Math.max(Math.abs(col(i) - col(via)), Math.abs(row(i) - row(via))) < w.length) { const r = go([i]); if (r) return r; }
  return null;
}
// Ô then chốt của mục tiêu: ô ngay dưới mỗi rương; và các ô băng khi chỉ còn ≤ 3 (dễ kẹt vì chữ ngẫu nhiên).
export function goalCells(g: Cell[], ice: boolean[]): number[] {
  const out: number[] = [];
  g.forEach((c, i) => { if (c.sp === 'chest' && row(i) < ROWS - 1) out.push(idx(col(i), row(i) + 1)); });
  const left = ice.map((v, i) => (v ? i : -1)).filter(i => i >= 0);
  if (left.length <= 3) out.push(...left);
  return out;
}
// Bảo đảm luôn có nước đi cho mục tiêu (như keepSolvable cho nhiệm vụ): ô then chốt nào không có từ 3 chữ đi qua thì gieo một từ 3 chữ
// bắt đầu tại ô đó, tránh ô của nhiệm vụ còn lại và rương. Trả về số lần gieo.
export function keepGoalReachable(g: Cell[], ice: boolean[], words3: string[], seed: number, protect: Set<number>): number {
  const r = rand(seed), ws = words3.filter(w => /^[a-z]{3}$/.test(w)); if (!ws.length) return 0;
  let n = 0;
  for (const c of goalCells(g, ice)) {
    if (g[c]!.sp === 'chest' || ws.slice(0, 120).some(w => findPathVia(g, w, c))) continue;
    for (let tries = 0; tries < 20; tries++) {
      const w = ws[Math.floor(r() * ws.length)]!;
      const n1s = Array.from({ length: N }, (_, i) => i).filter(i => adjacent(c, i) && g[i]!.sp !== 'chest' && !protect.has(i));
      const n1 = n1s[Math.floor(r() * n1s.length)]; if (n1 === undefined) break;
      const n2s = Array.from({ length: N }, (_, i) => i).filter(i => i !== c && adjacent(n1, i) && g[i]!.sp !== 'chest' && !protect.has(i));
      const n2 = n2s[Math.floor(r() * n2s.length)]; if (n2 === undefined) continue;
      if (protect.has(c)) break;
      [c, n1, n2].forEach((i, k) => { g[i] = { ...g[i]!, ch: w[k]! }; });
      n++; break;
    }
  }
  return n;
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
  for (let i = 0; i < N; i++) if (g[i]!.sp === 'chest') locked.add(i);   // không gieo đè lên rương
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
  return { grid, missions: ms, moves: ms.length * 2 + want.spare, nextId: id, goal: 'words', ice: new Array<boolean>(N).fill(false), chests: 0 };
}

// Áp một từ: vỡ các ô của đường (ô đá quý → vỡ thêm cả hàng của nó), chữ trên rơi xuống, chữ mới lấp từ trên. Từ ≥ 5 chữ để lại một ô
// đá quý ở chỗ chữ cuối (sau khi rơi, ở cột đó). Trả về lưới mới, các ô đã vỡ (để vẽ) và độ rơi của từng ô (theo id).
export function applyWord(g0: Cell[], path: number[], seed: number, nextId: number, quiet = false): { grid: Cell[]; broken: number[]; fall: Record<number, number>; nextId: number; gemRow: number[] } {
  const r = rand(seed), broken = new Set(path), gemRow: number[] = [];
  for (const i of path) if (g0[i]!.sp === 'gem') for (let c = 0; c < COLS; c++) { const j = idx(c, row(i)); if (!broken.has(j) && g0[j]!.sp !== 'chest') { broken.add(j); gemRow.push(j); } }
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
  if (path.length >= 5 && !quiet) { const lastCol = col(path[path.length - 1]!); const top = g.findIndex((x, i) => col(i) === lastCol && fall[x.id]! > 0); const at = top >= 0 ? top : idx(lastCol, 0); g[at] = { ...g[at]!, sp: 'gem' }; }
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

// ---- v96: mục tiêu kiểu ghép 3 (M7) ----
// Loại màn xoay vòng theo số màn (từ màn 4): chỉ từ → băng → rương. Mỗi 10 màn là MÀN MỐC: hình băng thiết kế tay (tim, vòng, chữ X, kim cương…).
export function goalOf(level: number): Goal { if (level < 4) return 'words'; if (level % 10 === 0) return 'ice'; return (['words', 'ice', 'chest'] as Goal[])[level % 3]!; }
// Hình băng thiết kế tay (6 cột × 7 hàng, '#' = băng) cho màn mốc; màn băng thường dùng hình ngẫu nhiên đối xứng.
export const ICE_SHAPES: Record<string, string[]> = {
  tim: ['......', '.#..#.', '######', '######', '.####.', '..##..', '......'],
  vong: ['......', '.####.', '.#..#.', '.#..#.', '.#..#.', '.####.', '......'],
  cheo: ['#....#', '.#..#.', '..##..', '..##..', '.#..#.', '#....#', '......'],
  kimcuong: ['..##..', '.####.', '######', '.####.', '..##..', '......', '......'],
  cau: ['......', '......', '######', '#....#', '#....#', '......', '......'],
};
export const MILESTONES = Object.keys(ICE_SHAPES);
export function iceMask(level: number, seed: number): boolean[] {
  if (level % 10 === 0) { const shape = ICE_SHAPES[MILESTONES[(level / 10 - 1) % MILESTONES.length]!]!; return Array.from({ length: N }, (_, i) => shape[row(i)]![col(i)] === '#'); }
  const r = rand(seed + 991), m = new Array<boolean>(N).fill(false), k = Math.min(10, 4 + Math.floor(level / 8));
  for (let t = 0; t < k; t++) { const c = Math.floor(r() * 3), rr = 1 + Math.floor(r() * (ROWS - 2)); m[idx(c, rr)] = true; m[idx(COLS - 1 - c, rr)] = true; }   // đối xứng trái – phải
  return m;
}
// Đặt rương ở hàng trên cùng (cột khác nhau), thay chữ ở đó.
export function placeChests(g: Cell[], k: number, seed: number, nextId: number): number {
  const r = rand(seed + 313), cols = [0, 1, 2, 3, 4, 5].sort(() => r() - 0.5).slice(0, k);
  for (const c of cols) g[idx(c, 0)] = { ch: '', sp: 'chest', id: nextId++ };
  return nextId;
}
// Rương tới hàng đáy thì thu: lấy ra, các ô trên rơi xuống, lấp chữ mới. Lặp tới khi không còn rương ở đáy.
export function collectChests(g0: Cell[], seed: number, nextId: number): { grid: Cell[]; got: number; nextId: number; fall: Record<number, number> } {
  let g = g0, got = 0, id = nextId, fall: Record<number, number> = {};
  for (let k = 0; k < COLS; k++) {
    const bottom = Array.from({ length: COLS }, (_, c) => idx(c, ROWS - 1)).filter(i => g[i]!.sp === 'chest');
    if (!bottom.length) break;
    got += bottom.length;
    const a = applyWord(g, bottom, seed + k, id, true); g = a.grid; id = a.nextId; fall = { ...fall, ...a.fall };
  }
  return { grid: g, got, nextId: id, fall };
}
export function breakIce(ice: boolean[], cells: number[]): number { let n = 0; for (const i of cells) if (ice[i]) { ice[i] = false; n++; } return n; }
// Dựng màn có mục tiêu: màn từ + băng / rương; lượt cộng thêm theo khối lượng mục tiêu.
export function goalLevel(seed: number, pool: Mission[], want: { missions: number; maxLen: number; spare: number }, level: number): HuntLevel | null {
  const lv = newLevel(seed, pool, want); if (!lv) return null;
  const goal = goalOf(level);
  if (goal === 'ice') { lv.goal = 'ice'; lv.ice = iceMask(level, seed); lv.moves += Math.ceil(lv.ice.filter(Boolean).length / 3); }
  if (goal === 'chest') {
    const k = Math.min(3, 1 + Math.floor(level / 12)), locked = new Set<number>();
    for (const m of lv.missions) { const p = findPath(lv.grid, m.en); if (p) p.forEach(i => locked.add(i)); }
    lv.goal = 'chest'; lv.chests = k; lv.nextId = placeChests(lv.grid, k, seed, lv.nextId); lv.moves += k * 3;
    keepSolvable(lv.grid, lv.missions, seed + 5);
  }
  if (level >= 4) lv.moves = Math.max(lv.missions.length + 2, lv.moves + sawtooth(level, goal));
  return lv;
}
// v98 Nhịp răng cưa mỗi chương 10 màn (cân bằng mô phỏng tools/sim/levels.ts, GAME-CRITERIA §10.10): đầu chương nới lượt, cuối chương siết,
// màn mốc khó nhất; rương cần thêm lượt vì phải rơi cả cột. Mục tiêu tỉ lệ thắng của người chơi giả điển hình: đầu ≥ 85 %, giữa ~75 %,
// cuối ~65 %, mốc ~55–65 %.
export function sawtooth(level: number, goal: Goal): number {
  const pos = ((level - 1) % 10) + 1, base = pos <= 3 ? 2 : pos <= 6 ? 1 : pos <= 9 ? 0 : -1;
  return base + (goal === 'chest' ? 2 : 0) - (goal === 'ice' && pos === 10 ? 3 : 0);
}

// Từ phục vụ mục tiêu khi đã tìm hết nhiệm vụ (gợi ý cho người chơi / bot): từ có trên lưới phá được NHIỀU ô băng / ô dưới rương nhất
// (v98: trước đây lấy từ đầu tiên chạm mục tiêu, nên gợi ý chỉ phá 1 ô: mô phỏng cho thấy màn rương gần như không qua được). Hoà điểm:
// từ ngắn hơn (đỡ phá lung tung). Không có từ chạm mục tiêu thì lấy từ đầu tiên có trên lưới.
export function goalWord(g: Cell[], ice: boolean[], words: string[]): { word: string; path: number[] } | null {
  const below = new Set<number>(); g.forEach((c, i) => { if (c.sp === 'chest') for (let r = row(i) + 1; r < ROWS; r++) below.add(idx(col(i), r)); });
  const crit = goalCells(g, ice);
  let best: { word: string; path: number[]; k: number } | null = null;
  for (const w of words) {
    if (w.length < 3 || w.length > 5) continue;
    const p = findPath(g, w); if (!p) continue;
    for (const q of [p, ...crit.map(c => findPathVia(g, w, c)).filter((x): x is number[] => !!x)]) {
      const k = q.filter(i => ice[i] || below.has(i)).length + (q.some(i => crit.includes(i)) ? 2 : 0);   // ô then chốt (kẹt) được ưu tiên
      if (!best || k > best.k || (k === best.k && w.length < best.word.length)) best = { word: w, path: q, k };
    }
  }
  return best && { word: best.word, path: best.path };
}
