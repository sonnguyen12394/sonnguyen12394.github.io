// L4 — Decision Snapshot (spec v2.4 §28 L4, §37, HG30, MT20): mỗi quyết định quan trọng lưu lại số liệu, ngưỡng, luật và
// id các sự kiện bằng chứng dẫn tới nó, để trả lời "vì sao app kết luận vậy" và tái tạo được quyết định (replay).
// Bằng chứng mà snapshot tham chiếu được giữ khi dọn sổ L1 (critical evidence, C109).

import type { Level } from '../types.ts';
import { betaStat, PASS_M, PASS_LB } from '../mastery.ts';
import type { EvStore } from './types.ts';

export type SnapKind = 'mastery' | 'testout' | 'readiness' | 'nba' | 'diag';
export interface Alt { node: string; score: number; dep: number; min: number }
export interface Snapshot {
  id: string;
  ts: number;
  day: number;
  kind: SnapKind;
  subj: string;                 // nút, mục tiêu…
  lv?: Level;
  dec: string;                  // PASS / FAIL / READY / NOT_READY / CHOSEN / kết quả chẩn đoán
  m?: { a: number; b: number; n: number; mean: number; lb: number; ctx: number; qt: number; nov: number };
  thr?: { m: number; lb: number };
  info?: Record<string, number | string>;
  alt?: Alt[];                  // NBA: các ứng viên đầu bảng
  evs: string[];                // id sự kiện bằng chứng (≤ 12)
  rule: string;
}

export const SNAP_MAX = 400, SNAP_PROTECT = 100;

// Thêm một snapshot. `key` để bỏ trùng: snapshot mới cùng loại + chủ thể + quyết định như cái gần nhất thì bỏ qua.
export function addSnap(st: EvStore, s: Omit<Snapshot, 'id'>, dedupe = true): Snapshot | null {
  if (dedupe) {
    for (let i = st.snap.length - 1; i >= 0; i--) {
      const x = st.snap[i]!;
      if (x.kind !== s.kind || x.subj !== s.subj || (x.lv ?? 0) !== (s.lv ?? 0)) continue;
      if (x.dec === s.dec && JSON.stringify(x.alt?.map(a => a.node) ?? null) === JSON.stringify(s.alt?.map(a => a.node) ?? null)
        && JSON.stringify(x.info ?? null) === JSON.stringify(s.info ?? null)) return null;
      break;
    }
  }
  st.sseq = (st.sseq ?? 0) + 1;
  const snap: Snapshot = { id: `s${st.sseq}.${s.ts.toString(36)}`, ...s, evs: s.evs.slice(-12) };
  st.snap.push(snap);
  if (st.snap.length > SNAP_MAX) {
    // Bỏ snapshot NBA cũ trước (chúng nhiều, ít giá trị audit), rồi mới tới loại khác.
    const nba = st.snap.findIndex(x => x.kind === 'nba');
    st.snap.splice(nba >= 0 && nba < st.snap.length - 20 ? nba : 0, 1);
  }
  return snap;
}

// Sự kiện bằng chứng cần giữ vì snapshot quan trọng gần đây tham chiếu.
export function protectedEvents(st: EvStore): Set<string> {
  const out = new Set<string>();
  const imp = st.snap.filter(s => s.kind !== 'nba').slice(-SNAP_PROTECT);
  for (const s of imp) for (const id of s.evs) out.add(id);
  return out;
}

// Tái tạo quyết định từ chính dữ liệu trong snapshot. Trả về quyết định tính lại (so với s.dec để audit).
export function replay(s: Snapshot): string {
  switch (s.kind) {
    case 'mastery': {
      if (!s.m || !s.thr) return '?';
      const b = betaStat(s.m.a, s.m.b), numbers = b.m >= s.thr.m && b.lb >= s.thr.lb;
      if (s.info?.ro === 'yes') return 'REOPEN';
      if (numbers && s.info?.vf === 'yes') return 'VERIFY';
      return numbers ? 'PASS' : 'FAIL';
    }
    case 'testout': {
      const got = Number(s.info?.got), of = Number(s.info?.of), pass = s.info?.pass === 'yes';
      return got === of && of > 0 && pass ? 'PASS' : 'FAIL';
    }
    case 'readiness': {
      const p = Number(s.info?.p), need = Number(s.info?.need ?? 0.8);
      return s.info?.achieved === 'yes' ? 'ACHIEVED' : p >= need ? 'READY' : 'NOT_READY';
    }
    case 'nba': {
      const top = [...(s.alt ?? [])].sort((x, y) => y.score - x.score || (x.node < y.node ? -1 : 1))[0];
      return top && top.node === s.subj ? 'CHOSEN' : 'MISMATCH';
    }
    case 'diag': return `u=${s.info?.u};g=${s.info?.g}`;
  }
}

export const MASTERY_THR = { m: PASS_M, lb: PASS_LB };
