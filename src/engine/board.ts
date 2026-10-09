// Bàn Cờ Phố (v73): bàn vòng 16 ô, tung xúc xắc, dừng ở ô nào gặp loại cảnh đó; xây nhà ở lô đất bằng xu. Thuần hàm, seed cố định.
// Xúc xắc chỉ quyết định LOẠI cảnh (yếu tố game); phần cần học của mỗi cảnh vẫn do engine chọn (quest.ts picker, thứ tự NBA).
// Nhà là trang trí + thưởng xu khi đi qua; không bao giờ trừ xu ngoài việc người chơi tự chọn xây. Không vào mastery (P13).
// Bố cục, tên ô, biểu tượng là của app (phố học tiếng Anh), không lấy bố cục / tên ô của trò chơi bàn cờ thương mại nào.

import type { Enc } from './quest.ts';
import { rand } from './blocks.ts';

export type Tile = { t: 'home' } | { t: 'lot'; name: string; ico: string } | { t: 'enc'; k: Enc };
export const TILES: Tile[] = [
  { t: 'home' },
  { t: 'enc', k: 'monster' }, { t: 'lot', name: 'Tiệm bánh', ico: '🥐' }, { t: 'enc', k: 'chest' },
  { t: 'enc', k: 'monster' }, { t: 'enc', k: 'scout' }, { t: 'lot', name: 'Thư viện', ico: '📚' }, { t: 'enc', k: 'camp' },
  { t: 'enc', k: 'monster' }, { t: 'lot', name: 'Quán trà', ico: '🍵' }, { t: 'enc', k: 'chest' }, { t: 'enc', k: 'monster' },
  { t: 'enc', k: 'boss' }, { t: 'lot', name: 'Ga tàu', ico: '🚉' }, { t: 'enc', k: 'monster' }, { t: 'enc', k: 'scout' },
];
export const SIZE = TILES.length, ROLLS = 8, MAX_LV = 3, HOME_BONUS = 10;
export const price = (lv: number): number => [40, 80, 150][lv] ?? Infinity;   // xây (lv 0 → 1), nâng 1 → 2, 2 → 3
export const toll = (lv: number): number => lv * 4;                            // xu khi đi qua nhà của mình

export interface BoardSave { pos: number; lots: number[]; spent: number; runs: number; laps: number }
export const freshBoardSave = (): BoardSave => ({ pos: 0, lots: Array(SIZE).fill(0), spent: 0, runs: 0, laps: 0 });

// Một lần tung: điểm xúc xắc (1–6) theo seed và số lần đã tung.
export function roll(seed: number, n: number): number { return 1 + Math.floor(rand(seed + n * 104729)() * 6); }

export interface Move { from: number; to: number; die: number; passed: number[]; bonus: number; lap: boolean }
// Đi `die` ô từ `pos`: các ô đi qua (không tính ô dừng), xu thưởng khi qua nhà mình / về Nhà.
export function move(s: BoardSave, die: number): Move {
  const from = s.pos, passed: number[] = [];
  let bonus = 0, lap = false;
  for (let k = 1; k <= die; k++) {
    const p = (from + k) % SIZE;
    if (p === 0) { lap = true; bonus += HOME_BONUS; }
    if (k < die) { passed.push(p); bonus += toll(s.lots[p] ?? 0); }
  }
  s.pos = (from + die) % SIZE;
  if (lap) s.laps++;
  return { from, to: s.pos, die, passed, bonus, lap };
}

// Xây / nâng nhà ở lô đang đứng: chỉ khi đủ xu (ví = xu kiếm được − xu đã tiêu).
export function canBuild(s: BoardSave, at: number, wallet: number): boolean {
  const t = TILES[at];
  return !!t && t.t === 'lot' && (s.lots[at] ?? 0) < MAX_LV && wallet >= price(s.lots[at] ?? 0);
}
export function build(s: BoardSave, at: number, wallet: number): number {
  if (!canBuild(s, at, wallet)) return 0;
  const cost = price(s.lots[at] ?? 0);
  s.lots[at] = (s.lots[at] ?? 0) + 1; s.spent += cost;
  return cost;
}

export function sanitizeBoard(raw: unknown): BoardSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const lots = Array.isArray(x.lots) ? x.lots : [];
  return { pos: n(x.pos, SIZE - 1), lots: Array.from({ length: SIZE }, (_, i) => (TILES[i]!.t === 'lot' ? n(lots[i], MAX_LV) : 0)), spent: n(x.spent, 1e9), runs: n(x.runs, 1e7), laps: n(x.laps, 1e7) };
}
// Gộp hai máy: nhà lấy cấp cao hơn, xu đã tiêu lấy lớn hơn (không tiêu hai lần cùng một khoản), vị trí theo máy chơi nhiều hơn.
export function mergeBoard(a?: BoardSave, b?: BoardSave): BoardSave | undefined {
  if (!a) return b; if (!b) return a;
  const more = a.runs >= b.runs ? a : b;
  return { pos: more.pos, lots: a.lots.map((v, i) => Math.max(v, b.lots[i] ?? 0)), spent: Math.max(a.spent, b.spent), runs: Math.max(a.runs, b.runs), laps: Math.max(a.laps, b.laps) };
}
