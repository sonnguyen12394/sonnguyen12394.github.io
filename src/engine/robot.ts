// Ra lệnh cho robot (v84, F8 nói + F2 gọi tên từ): lưới 5 × 5, robot ở Nhà (góc trên trái); trên bàn có đồ vật là hình (emoji) của từ
// người học đang học. Nhiệm vụ (tiếng Việt): nhặt 2 đồ rồi về Nhà. Ra lệnh bằng tiếng Anh — nói (máy nghe giọng) hoặc gõ:
// "go up / down / left / right (two steps)", "pick up the <tên đồ>", "go home"; nhiều lệnh nối bằng "then" / "and" / dấu phẩy.
// Robot chỉ nhặt khi gọi đúng tên tiếng Anh của đồ (luật chơi = gọi tên từ, G1). Lệnh không vào mức thuộc (nói / gõ tự do là phản hồi, G3).
// Thuần hàm, theo seed. Không tính giờ, sai không mất gì. Tên, hình của app.

import { rand } from './blocks.ts';

export const N = 5;
export interface Item { r: number; c: number; en: string; vi: string; pic: string; target: boolean; got: boolean }
export interface Board { r: number; c: number; items: Item[]; moves: number; cmds: number }
export type Act = { k: 'move'; dr: number; dc: number; n: number } | { k: 'pick'; w: string } | { k: 'home' } | { k: 'bad'; t: string };

// Đặt đồ vật: ô khác Nhà, không trùng, cách Nhà ≥ 2 bước. words: [đích, đích, nhiễu, nhiễu…].
export function layout(seed: number, words: Array<{ en: string; vi: string; pic: string }>, targets = 2): Board {
  const r = rand(seed), cells: Array<[number, number]> = [];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (y + x >= 2) cells.push([y, x]);
  const items: Item[] = [];
  for (let i = 0; i < words.length && cells.length; i++) {
    const [y, x] = cells.splice(Math.floor(r() * cells.length), 1)[0]!, w = words[i]!;
    items.push({ r: y, c: x, en: w.en, vi: w.vi, pic: w.pic, target: i < targets, got: false });
  }
  return { r: 0, c: 0, items, moves: 0, cmds: 0 };
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, '1': 1, '2': 2, '3': 3, '4': 4, once: 1, twice: 2 };
const DIR: Record<string, [number, number]> = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1], north: [-1, 0], south: [1, 0], west: [0, -1], east: [0, 1] };
// Tách một câu lệnh (máy nghe ra hoặc gõ) thành các hành động.
export function parse(text: string): Act[] {
  const t = text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ,]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return [];
  return t.split(/\s*(?:,|\bthen\b|\band then\b|\band\b|\bafter that\b)\s*/).filter(Boolean).map((p): Act => {
    if (/\b(go|come|walk|move)?\s*(back )?home\b|\bgo back\b/.test(p)) return { k: 'home' };
    const pk = p.match(/\b(?:pick up|pick|take|get|grab|collect)\s+(?:up\s+)?(?:the |a |an |some |my )?([a-z' -]+?)(?:\s+up)?$/);
    if (pk) return { k: 'pick', w: pk[1]!.trim() };
    const mv = p.match(/\b(up|down|left|right|north|south|east|west)\b/);
    if (mv) {
      const n = p.match(/\b(one|two|three|four|1|2|3|4|once|twice)\b/);
      const [dr, dc] = DIR[mv[1]!]!;
      return { k: 'move', dr, dc, n: n ? NUM[n[1]!]! : 1 };
    }
    return { k: 'bad', t: p };
  });
}
// Cùng một từ, cho phép số nhiều thường gặp (apple / apples, box / boxes, cherry / cherries).
const forms = (w: string) => [w, w + 's', w + 'es', w.replace(/y$/, 'ies')];
export const sameWord = (a: string, b: string): boolean => { const x = a.toLowerCase().trim(), y = b.toLowerCase().trim(); return forms(x).includes(y) || forms(y).includes(x); };
export const won = (b: Board): boolean => b.r === 0 && b.c === 0 && b.items.filter(i => i.target).every(i => i.got);

// Chạy các hành động; trả về lời robot (tiếng Việt) cho từng bước. Đi ra ngoài lưới thì dừng ở mép (không phạt).
export function run(b0: Board, acts: Act[]): { b: Board; log: Array<{ ok: boolean; msg: string }>; picked: Item[]; misnamed: Item[] } {
  const b: Board = { ...b0, items: b0.items.map(i => ({ ...i })) }, log: Array<{ ok: boolean; msg: string }> = [], picked: Item[] = [], misnamed: Item[] = [];
  b.cmds++;
  for (const a of acts) {
    if (a.k === 'move') {
      let n = 0;
      for (let s = 0; s < a.n; s++) { const r = b.r + a.dr, c = b.c + a.dc; if (r < 0 || c < 0 || r >= N || c >= N) break; b.r = r; b.c = c; n++; b.moves++; }
      log.push({ ok: n > 0, msg: n ? `Đi ${n} bước ${a.dr < 0 ? 'lên' : a.dr > 0 ? 'xuống' : a.dc < 0 ? 'sang trái' : 'sang phải'}.` : 'Đụng tường, không đi được.' });
    } else if (a.k === 'home') {
      b.moves += b.r + b.c; b.r = 0; b.c = 0; log.push({ ok: true, msg: 'Về Nhà.' });
    } else if (a.k === 'pick') {
      const here = b.items.find(i => i.r === b.r && i.c === b.c && !i.got);
      if (!here) { log.push({ ok: false, msg: `Ở đây không có “${a.w}”.` }); continue; }
      if (sameWord(a.w, here.en)) { here.got = true; picked.push(here); log.push({ ok: true, msg: `Nhặt ${here.pic} ${here.en}!` }); }
      else { misnamed.push(here); log.push({ ok: false, msg: `Robot không hiểu “${a.w}”. Đồ ở đây bắt đầu bằng “${here.en[0]}…” (${here.en.length} chữ cái).` }); }
    } else log.push({ ok: false, msg: `Robot không hiểu lệnh “${a.t}”.` });
  }
  return { b, log, picked, misnamed };
}

export interface RobotSave { runs: number; wins: number; picked: number; best: number; day: number }
export const freshRobotSave = (): RobotSave => ({ runs: 0, wins: 0, picked: 0, best: 0, day: 0 });
export function sanitizeRobot(raw: unknown): RobotSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), wins: n(x.wins, 1e7), picked: n(x.picked, 1e8), best: n(x.best, 1e4), day: n(x.day, 1e6) };
}
export function mergeRobot(a?: RobotSave, b?: RobotSave): RobotSave | undefined {
  if (!a) return b; if (!b) return a;
  const best = a.best && b.best ? Math.min(a.best, b.best) : Math.max(a.best, b.best);   // kỷ lục = ít lệnh nhất
  return { runs: Math.max(a.runs, b.runs), wins: Math.max(a.wins, b.wins), picked: Math.max(a.picked, b.picked), best, day: Math.max(a.day, b.day) };
}
