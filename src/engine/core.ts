// Lõi dùng chung, build thành script thường x/core.<băm>.js (biến toàn cục ELCORE), nạp TRƯỚC app.js:
//   - FSRS-5 cho mọi lịch ôn (từ vựng, ngữ pháp học nền và sổ lỗi sai ôn thi): một hệ duy nhất (spec §5);
//   - ghi bằng chứng mastery ngay khi người học trả lời, kể cả khi mô-đun engine chưa tải (không mất câu nào).
// Thuần hàm trên bản lưu st (st.e); mô-đun engine dùng chung các tệp nguồn này.

import { review, newCard, interval, retrievability, type Card, type Grade } from '../exam/fsrs.ts';
import { record, prior, statusOf, betaStat, type Evidence, type Status } from './mastery.ts';
import { migrateE, E_V, type EState } from './state.ts';
import type { Level } from './types.ts';

function eOf(st: { e?: unknown }): EState {
  const cur = st.e as EState | undefined;
  if (cur && typeof cur === 'object' && cur.v === E_V && cur.m) return cur;
  st.e = migrateE(st.e);
  return st.e as EState;
}

export const fsrs = { review, newCard, interval, retrievability };

export function ev(st: { e?: unknown }, e: Evidence, today: number): boolean {
  try { return record(eOf(st).m, e, today, eOf(st).r); } catch { return false; }
}

export function stat(st: { e?: unknown }, node: string, level: Level): Status { return statusOf(eOf(st).m, node, level); }

export function seed(st: { e?: unknown }, node: string, upTo: Level, a: number, b: number): void { prior(eOf(st).m, node, upTo, a, b); }

export function priorsDone(st: { e?: unknown }): boolean { return eOf(st).pri === 1; }
export function markPriors(st: { e?: unknown }): void { eOf(st).pri = 1; }

export const beta = betaStat;
export type { Card, Grade, Evidence, Status };
