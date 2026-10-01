// Lịch ôn FSRS-5 (Free Spaced Repetition Scheduler, J. Ye và cộng sự; thuật toán mở, đã kiểm chứng trên dữ liệu lớn của Anki).
// Dùng cho sổ lỗi sai và thẻ ôn của phần ôn thi. Công thức và tham số mặc định theo bản FSRS-5 công bố:
// https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
// Đánh giá G: 1 = quên, 2 = khó, 3 = được, 4 = dễ.

export type Grade = 1 | 2 | 3 | 4;

export const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192,
  1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621,
] as const;

export const DECAY = -0.5;
export const FACTOR = 19 / 81;   // để R(S, S) = 0.9
export const RETENTION = 0.9;
export const MAX_IVL = 3650;

export interface Card {
  s: number;     // độ bền trí nhớ (ngày)
  d: number;     // độ khó 1–10
  last: number;  // ngày ôn gần nhất (số ngày kể từ 1/1/1970)
  due: number;   // ngày đến hạn
  reps: number;
  lapses: number;
}

const w = (i: number): number => W[i]!;
const clampD = (d: number): number => Math.min(10, Math.max(1, d));

export function retrievability(elapsed: number, s: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsed)) / s, DECAY);
}

export function interval(s: number, r = RETENTION): number {
  const ivl = (s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
  return Math.min(MAX_IVL, Math.max(1, Math.round(ivl)));
}

const initD = (g: Grade): number => clampD(w(4) - Math.exp(w(5) * (g - 1)) + 1);

export function newCard(g: Grade, today: number): Card {
  const s = w(g - 1), d = initD(g);
  return { s, d, last: today, due: today + (g === 1 ? 0 : interval(s)), reps: 1, lapses: g === 1 ? 1 : 0 };
}

function nextD(d: number, g: Grade): number {
  const dd = -w(6) * (g - 3);
  const d1 = d + (dd * (10 - d)) / 9;
  return clampD(w(7) * initD(4) + (1 - w(7)) * d1);
}

function sRecall(d: number, s: number, r: number, g: Grade): number {
  const hard = g === 2 ? w(15) : 1, easy = g === 4 ? w(16) : 1;
  return s * (Math.exp(w(8)) * (11 - d) * Math.pow(s, -w(9)) * (Math.exp(w(10) * (1 - r)) - 1) * hard * easy + 1);
}

function sForget(d: number, s: number, r: number): number {
  const sf = w(11) * Math.pow(d, -w(12)) * (Math.pow(s + 1, w(13)) - 1) * Math.exp(w(14) * (1 - r));
  return Math.min(sf, s);
}

export function review(c: Card, g: Grade, today: number): Card {
  const elapsed = today - c.last;
  let s: number;
  if (elapsed <= 0) s = c.s * Math.exp(w(17) * (g - 3 + w(18)));   // ôn lại trong cùng ngày
  else {
    const r = retrievability(elapsed, c.s);
    s = g === 1 ? sForget(c.d, c.s, r) : sRecall(c.d, c.s, r, g);
  }
  s = Math.max(0.1, s);
  return {
    s, d: nextD(c.d, g), last: today,
    due: today + (g === 1 ? 0 : interval(s)),
    reps: c.reps + 1, lapses: c.lapses + (g === 1 ? 1 : 0),
  };
}
