// Lõi dùng chung, build thành script thường x/core.<băm>.js (biến toàn cục ELCORE), nạp TRƯỚC app.js:
//   - FSRS-5 cho mọi lịch ôn (từ vựng, ngữ pháp học nền và sổ lỗi sai ôn thi): một hệ duy nhất (spec §5);
//   - ghi bằng chứng ngay khi người học trả lời, kể cả khi mô-đun engine chưa tải (không mất câu nào).
//     Từ v53 (spec v2.4): mỗi câu trả lời là một Observation đi qua Evidence Evaluator → sổ L1 + thống kê L2 → ô Beta L3.
//   - gộp hai máy (đồng bộ) không phụ thuộc mô-đun engine đã tải hay chưa.
// Thuần hàm trên bản lưu st (st.e); mô-đun engine dùng chung các tệp nguồn này.

import { review, newCard, interval, retrievability, type Card, type Grade } from '../exam/fsrs.ts';
import { statusOf, betaStat, type Evidence, type Status } from './mastery.ts';
import { migrateE, mergeE, E_V, type EState } from './state.ts';
import { ingest, setPrior, recomputeAll } from './ev/store.ts';
import { RULE, RULE_ID } from './ev/evaluate.ts';
import type { Observation, EvEvent } from './ev/types.ts';
import type { Level } from './types.ts';
import { microDecide, type MicroDecision } from './micro.ts';

function eOf(st: { e?: unknown }): EState {
  const cur = st.e as EState | undefined;
  if (cur && typeof cur === 'object' && cur.v === E_V && cur.m && cur.ev) return cur;
  st.e = migrateE(st.e);
  return st.e as EState;
}

// Mã thiết bị: phân vùng thống kê của máy này (gộp hai máy theo kiểu G-counter). Lưu ngoài bản đồng bộ.
let devCache = '';
export function dev(): string {
  if (devCache) return devCache;
  try {
    const cur = typeof localStorage !== 'undefined' ? localStorage.getItem('el-dev') : null;
    if (cur && /^[a-z0-9]{6}$/.test(cur)) return (devCache = cur);
    const id = Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');
    if (typeof localStorage !== 'undefined') localStorage.setItem('el-dev', id);
    return (devCache = id);
  } catch { return (devCache = 'nodev0'); }
}

export const fsrs = { review, newCard, interval, retrievability };
export const rules = { ...RULE, id: RULE_ID };

// Phiên học: đổi khi app mở lại (provenance §36: session).
const SESS = Date.now().toString(36);

// Ghi một quan sát. Lỗi không làm hỏng lượt học, nhưng được đếm và ghi lại (không còn nuốt lỗi im lặng).
export function ev(st: { e?: unknown }, o: Evidence & Observation, today: number): EvEvent | null {
  let e: EState | null = null;
  try {
    e = eOf(st);
    return ingest(e.ev, e.m, { sess: SESS, ...o }, { dev: dev(), ts: Date.now(), day: today, recent: e.r });
  } catch (x) {
    try { if (e) { e.ev.integ.err++; e.ev.integ.last = `${new Date().toISOString()} ${String(x).slice(0, 150)}`; } } catch { /* bỏ qua */ }
    if (typeof console !== 'undefined') console.warn('ELCORE.ev', x);
    return null;
  }
}

export function stat(st: { e?: unknown }, node: string, level: Level): Status { return statusOf(eOf(st).m, node, level); }

export function seed(st: { e?: unknown }, node: string, upTo: Level, a: number, b: number, today = 0): void {
  const e = eOf(st);
  setPrior(e.ev, e.m, node, upTo, a, b, 'legacy', today);
}

export function priorsDone(st: { e?: unknown }): boolean { return eOf(st).pri === 1; }
export function markPriors(st: { e?: unknown }): void { eOf(st).pri = 1; }

// Gộp phần engine của hai bản lưu (đồng bộ nhiều máy).
export function merge(a: unknown, b: unknown): EState { return mergeE(a, b); }

// Tính lại toàn bộ ô Beta từ thống kê (sau khi đổi luật hoặc để kiểm toàn vẹn).
export function recompute(st: { e?: unknown }): number {
  const e = eOf(st), m = recomputeAll(e.ev);
  e.m = m;
  return Object.keys(m).length;
}

// Xuất bản nghiên cứu đầy đủ (§88 Full Research Export): kèm L0 quan sát, sổ L1 và provenance.
export function research(st: { e?: unknown }): unknown {
  const e = eOf(st);
  return { schema: 'english-ladder-research/1', rules: rules, dev: dev(), at: new Date().toISOString(), engine: e };
}

export const beta = betaStat;

// Sau một câu sai: ghi nhận / hỏi thêm / mời bí kíp / học phần nền ngay (§51–53). app.js gọi ngay trong màn phản hồi.
export function micro(st: { e?: unknown }, node: string, level: Level, today: number, inGame = false): MicroDecision {
  const e = eOf(st);
  return microDecide({ ev: e.ev, m: e.m, node, lv: level, today, inGame });
}
export type { Card, Grade, Evidence, Status };
