// Sổ lỗi sai (yêu cầu 9.3): câu làm sai tự vào sổ; ôn lại đúng lúc theo FSRS-5; nhóm theo dạng câu hỏi và nhóm lỗi.
// Làm đúng 3 lần liên tiếp và độ bền trí nhớ ≥ 30 ngày thì coi là đã vững (vẫn giữ trong sổ, lịch giãn dần).

import { newCard, review, type Grade } from './fsrs.ts';
import type { XState, NbEntry } from './state.ts';

export const MASTER_OK = 3;
export const MASTER_S = 30;

export function addWrong(x: XState, id: string, qt: string, today: number, tag?: string): void {
  const old = x.nb[id];
  const card = old ? review(old, 1, today) : newCard(1, today);
  const e: NbEntry = { ...card, id, qt, ok: 0 };
  const t = tag ?? old?.tag;
  if (t) e.tag = t;
  x.nb[id] = e;
}

// Kết quả khi ôn lại một câu trong sổ: đúng → "được" (3), sai → "quên" (1).
export function reviewed(x: XState, id: string, correct: boolean, today: number): NbEntry | undefined {
  const old = x.nb[id];
  if (!old) return undefined;
  const g: Grade = correct ? 3 : 1;
  const card = review(old, g, today);
  const e: NbEntry = { ...old, ...card, ok: correct ? old.ok + 1 : 0 };
  x.nb[id] = e;
  return e;
}

export const mastered = (e: NbEntry): boolean => e.ok >= MASTER_OK && e.s >= MASTER_S;

export function dueList(x: XState, today: number, hidden: Set<string> = new Set()): NbEntry[] {
  return Object.values(x.nb).filter(e => e.due <= today && !hidden.has(e.id)).sort((a, b) => a.due - b.due || a.s - b.s);
}

export interface NbGroup { key: string; total: number; due: number; mastered: number }

export function groups(x: XState, today: number, by: 'qt' | 'tag' = 'qt'): NbGroup[] {
  const m = new Map<string, NbGroup>();
  for (const e of Object.values(x.nb)) {
    const k = (by === 'qt' ? e.qt : e.tag) || 'khác';
    const g = m.get(k) ?? { key: k, total: 0, due: 0, mastered: 0 };
    g.total++; if (e.due <= today) g.due++; if (mastered(e)) g.mastered++;
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.due - a.due || b.total - a.total);
}
