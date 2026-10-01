// Kiểm tra đầu vào thích ứng (yêu cầu 5.6, 5.10): Đọc rồi Nghe, mỗi kỹ năng ≤ 7,5 phút, câu khó dần theo câu trả lời.
// Mỗi lần chọn một bài (đoạn đọc/đoạn nghe) có tổng lượng thông tin lớn nhất ở band hiện tại, bốc ngẫu nhiên trong 3 bài tốt nhất
// để người làm lại không gặp y hệt. Dừng một kỹ năng khi: đủ 12 câu, hoặc ≥ 6 câu và sai số < 0,45, hoặc hết giờ, hoặc hết bài.

import { estimate, information, bandOf, margin, type Response } from './irt.ts';
import { itemOptions, type Group, type Item } from './content.ts';
import { markItem } from './score.ts';

export const SECTION_MS = 7.5 * 60 * 1000;
export const MAX_ITEMS = 12;
export const MIN_ITEMS = 6;
export const SE_STOP = 0.45;

export type PSkill = 'R' | 'L';

export interface PAnswer { id: string; group: string; given: string | undefined; correct: boolean; b: number; g: number }

export interface PSection {
  skill: PSkill;
  started: number;         // thời điểm bắt đầu (ms)
  used: string[];          // id nhóm đã làm
  answers: PAnswer[];
  done: boolean;
}

export interface PState {
  order: PSkill[];
  i: number;               // kỹ năng đang làm (chỉ số trong order)
  sections: PSection[];
  cur: string | null;      // id nhóm đang hiện
  finished: boolean;
}

export const guessOf = (it: Item, g: Group): number => { const n = itemOptions(it, g).length; return n ? 1 / n : 0; };

export function newPlacement(skills: PSkill[], now: number): PState {
  return { order: skills, i: 0, sections: skills.map(s => ({ skill: s, started: now, used: [], answers: [], done: false })), cur: null, finished: false };
}

export function sectionEstimate(sec: PSection): { theta: number; se: number; n: number } {
  const resp: Response[] = sec.answers.map(a => ({ item: { b: a.b, c: a.g }, correct: a.correct }));
  return estimate(resp);
}

export function remainingMs(sec: PSection, now: number): number {
  return Math.max(0, SECTION_MS - (now - sec.started));
}

function shouldStop(sec: PSection, pool: Group[], now: number): boolean {
  const n = sec.answers.length;
  if (n >= MAX_ITEMS || remainingMs(sec, now) <= 0) return true;
  if (n >= MIN_ITEMS && sectionEstimate(sec).se < SE_STOP) return true;
  return !pool.some(g => !sec.used.includes(g.id));
}

export function pickGroup(sec: PSection, pool: Group[], hidden: Set<string>, rand: () => number = Math.random): Group | undefined {
  const theta = sectionEstimate(sec).theta, room = MAX_ITEMS - sec.answers.length;
  const cand = pool.filter(g => !sec.used.includes(g.id))
    .map(g => ({ g, items: g.items.filter(it => !hidden.has(it.id)) }))
    .filter(c => c.items.length > 0 && c.items.length <= Math.max(1, room))
    .map(c => ({ g: c.g, info: c.items.reduce((s, it) => s + information(theta, { b: it.b, c: guessOf(it, c.g) }), 0) / c.items.length }))
    .sort((p, q) => q.info - p.info).slice(0, 3);
  if (!cand.length) return undefined;
  return cand[Math.min(cand.length - 1, Math.floor(rand() * cand.length))]!.g;
}

// Chuyển sang bài kế tiếp (hoặc kỹ năng kế tiếp, hoặc kết thúc). Trả về nhóm cần hiện, hoặc null khi xong.
export function advance(st: PState, pools: Record<PSkill, Group[]>, hidden: Set<string>, now: number, rand?: () => number): Group | null {
  while (st.i < st.order.length) {
    const sec = st.sections[st.i]!, pool = pools[sec.skill];
    if (!sec.done && !shouldStop(sec, pool, now)) {
      const g = pickGroup(sec, pool, hidden, rand);
      if (g) { st.cur = g.id; sec.used.push(g.id); return g; }
    }
    sec.done = true;
    st.i++;
    const next = st.sections[st.i];
    if (next) next.started = now;   // đồng hồ của kỹ năng sau bắt đầu khi tới lượt
  }
  st.cur = null; st.finished = true;
  return null;
}

// Ghi câu trả lời của nhóm đang hiện. Câu bỏ trống tính là sai (như bài thi thật).
export function answerGroup(st: PState, g: Group, given: Record<string, string | undefined>, hidden: Set<string>): void {
  const sec = st.sections[st.i];
  if (!sec || st.cur !== g.id) return;
  for (const it of g.items) {
    if (hidden.has(it.id)) continue;
    const m = markItem(it, g, given[it.id]);
    sec.answers.push({ id: it.id, group: g.id, given: given[it.id], correct: m.got === m.of, b: it.b, g: guessOf(it, g) });
  }
}

export interface PResult { skill: PSkill; n: number; theta: number; se: number; band: number; pm: number }

export function results(st: PState): PResult[] {
  return st.sections.filter(s => s.answers.length).map(s => {
    const e = sectionEstimate(s);
    return { skill: s.skill, n: s.answers.length, theta: e.theta, se: e.se, band: bandOf(e.theta), pm: margin(e.se) };
  });
}
