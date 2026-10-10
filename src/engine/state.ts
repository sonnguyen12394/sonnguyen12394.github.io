// Trạng thái engine trong bản lưu (st.e), có phiên bản và nâng cấp từng bước như src/exam/state.ts.
// v1 (M1): mục tiêu đã chọn. v2 (M2): kho mastery theo (nút, mức) + câu vừa trả lời (giảm trọng số khi lặp trong 24 giờ).
// v3 (M3): kết quả chẩn đoán gần nhất (cấp ước tính từ vựng, ngữ pháp).
// v4 (v53, spec v2.4): kho bằng chứng L0–L2 (`ev`); kho mastery `m` thành trạng thái dẫn xuất, luôn tính lại được từ `ev`.

import type { Cell, MasteryStore } from './mastery.ts';
import type { EvStore } from './ev/types.ts';
import { fromCells, mergeEv, recomputeAll, verify } from './ev/store.ts';
import { sanitizeEv } from './ev/sanitize.ts';
import type { Level } from './types.ts';
import { sanitizeQuest, mergeQuest, type QuestSave } from './quest.ts';
import { sanitizeMeasure, mergeMeasure, type MeasureSave } from './measure.ts';
import { sanitizeBlocks, mergeBlocks, type BlocksSave } from './blocks.ts';
import { sanitizeBoard, mergeBoard, type BoardSave } from './board.ts';
import { sanitizeCards, mergeCards, type CardsSave } from './cards.ts';
import { sanitizeCafe, mergeCafe, type CafeSave } from './cafe.ts';
import { sanitizeBubbles, mergeBubbles, type BubblesSave } from './bubbles.ts';
import { sanitizePuzzle, mergePuzzle, type PuzzleSave } from './puzzle.ts';
import { sanitizeCase, mergeCase, type CaseSave } from './detective.ts';
import { sanitizeKara, mergeKara, type KaraSave } from './karaoke.ts';
import { sanitizeShop, mergeShop, type ShopSave } from './workshop.ts';
import { sanitizeLetter, mergeLetter, type LetterSave } from './letters.ts';
import { sanitizeRobot, mergeRobot, type RobotSave } from './robot.ts';
import { sanitizeGarden, mergeGarden, type GardenSave } from './garden.ts';
import { sanitizeDir, mergeDir, type DirSave } from './director.ts';
import { sanitizePlay, mergePlay, type PlaySave } from './play.ts';
import { sanitizeTown, mergeTown, type TownSave } from './town.ts';

export const E_V = 4;

export interface DiagResult { day: number; u: number; g: number; n: number }   // u, g: chỉ số CEFR ước tính (0–5, bước 0,5); n: số nút đã dò

export interface GoalSel {
  id: string;            // id mục tiêu (content/engine/goals/<id>.json)
  version: string;       // phiên bản Target Model lúc chọn: đổi phiên bản không làm hỏng dữ liệu cũ (spec mục 5)
  since: number;         // ngày chọn
  date: number | null;   // ngày thi / hạn đạt (nếu có)
}

export interface EState {
  v: number;
  goals: GoalSel[];
  m: MasteryStore;                 // L3 dẫn xuất: nút → mức → Beta(α, β), tính từ ev
  ev: EvStore;                     // L0 quan sát, L1 sổ bằng chứng, L2 thống kê, tiên nghiệm
  r: Record<string, number>;       // id câu → ngày trả lời gần nhất (chỉ giữ 2 ngày)
  pri: number;                     // đã nạp tiên nghiệm từ tiến độ cũ (1) hay chưa (0)
  diag: DiagResult | null;
  q?: QuestSave;                   // v62 Ladder Quest: tiến độ game (telemetry, không vào mastery)
  ms?: MeasureSave;                // v63 đo hiệu quả học: bộ câu giữ riêng + các lần đo trước / sau / trễ
  bk?: BlocksSave;                 // v72 Xếp Khối: kỷ lục, số ván, chuỗi ngày (telemetry, không vào mastery)
  bd?: BoardSave;                  // v73 Bàn Cờ Phố: vị trí, nhà đã xây, xu đã tiêu (telemetry, không vào mastery)
  gc?: CardsSave;                  // v74 Bài Câu: kỷ lục, số ván, bàn thắng (telemetry, không vào mastery)
  gq?: CafeSave;                   // v75 Quán Cà Phê: sao, số ca (telemetry, không vào mastery)
  gs?: BubblesSave;                // v76 Bắt Âm: kỷ lục, màn (telemetry, không vào mastery)
  gt?: CaseSave & { lastId?: string };   // v78 Thám tử: số hồ sơ / phá án (telemetry)
  gr?: CaseSave & { lastId?: string };   // v79 Đài phát thanh: số bản tin (telemetry)
  gk?: KaraSave & { lastId?: string };   // v81 Karaoke: số bài / kỷ lục (telemetry)
  gw?: ShopSave;                   // v82 Xưởng sửa câu: số hộp / kỷ lục (telemetry)
  gl?: LetterSave & { lastId?: string };   // v83 Thư gửi cư dân phố: số thư / quà (telemetry)
  gb?: RobotSave;                  // v84 Ra lệnh cho robot: nhiệm vụ / đồ nhặt (telemetry)
  gf?: { runs: number; day: number };   // v86 Thám hiểm sương mù: số lần thám hiểm (telemetry)
  gv?: GardenSave;                 // v87 Vườn từ: bậc từng cây (từ câu trả lời), số hoa (không vào mastery)
  gp?: DirSave;                    // v88 bộ não chọn game: lộ trình 3 chặng hôm nay, game đã chơi xong, game vừa chơi
  tw?: TownSave;                   // v91 Phố: xu đã tiêu (trang trí, hồi tim), số món trang trí từng công trình (telemetry)
  pm?: PlaySave;                   // v89 số liệu chơi: ván, tự chọn, xong / bỏ giữa, thời gian (telemetry, chỉ ở máy này)
  gd?: PuzzleSave;                 // v77 Câu đố ngày: số ngày giải, sao (telemetry, không vào mastery)
}

export const GOAL_MAX = 4;

export function freshE(): EState { return { v: E_V, goals: [], m: {}, ev: sanitizeEv(null), r: {}, pri: 0, diag: null }; }

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const day = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e6 ? Math.round(v) : null);
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9.-]{0,40}$/.test(v);

export function migrateE(raw: unknown): EState {
  const x = obj(raw);
  if (typeof x.v !== 'number') return freshE();
  if (x.v === 1) { x.m = {}; x.r = {}; x.pri = 0; x.v = 2; }   // v1 → v2: thêm kho mastery
  if (x.v === 2) { x.diag = null; x.v = 3; }                    // v2 → v3: kết quả chẩn đoán
  if (x.v === 3) {                                               // v3 → v4: ô Beta cũ thành thống kê "legacy" + tiên nghiệm
    const cur = sanitizeE({ ...x, v: 4, ev: null });
    const day = Math.max(0, ...Object.values(cur.m).flatMap(cs => Object.values(cs ?? {}).map(c => c!.d)));
    x.ev = fromCells(cur.m, day); x.v = 4;
  }
  return sanitizeE(x);
}

export function sanitizeE(raw: unknown): EState {
  const x = obj(raw), out = freshE(), seen = new Set<string>();
  for (const g0 of Array.isArray(x.goals) ? x.goals : []) {
    const g = obj(g0);
    if (!idOk(g.id) || seen.has(g.id)) continue;
    seen.add(g.id);
    out.goals.push({ id: g.id, version: typeof g.version === 'string' && /^\d+\.\d+$/.test(g.version) ? g.version : '1.0', since: day(g.since) ?? 0, date: day(g.date) });
    if (out.goals.length >= GOAL_MAX) break;
  }
  const num = (v: unknown, lo: number, hi: number, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const strs = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.length <= 40).slice(0, max) : []);
  for (const [id, cells0] of Object.entries(obj(x.m))) {
    if (!/^(cd|u|g|pa|x|xw|xs|ph|fn):[a-z0-9][a-z0-9._-]{0,60}$/.test(id)) continue;
    const cells: Partial<Record<Level, Cell>> = {};
    for (const [k, c0] of Object.entries(obj(cells0))) {
      const l = Number(k), c = obj(c0);
      if (!(l >= 1 && l <= 5)) continue;
      cells[l as Level] = { a: num(c.a, 0.01, 1e5, 1), b: num(c.b, 0.01, 1e5, 1), n: num(c.n, 0, 1e5, 0), q: strs(c.q, 6), c: strs(c.c, 8), d: Math.round(num(c.d, 0, 1e6, 0)) };
    }
    if (Object.keys(cells).length) out.m[id] = cells;
  }
  const newest = Math.max(0, ...Object.values(obj(x.r)).filter((d): d is number => typeof d === 'number'));
  for (const [k, d] of Object.entries(obj(x.r))) if (typeof d === 'number' && k.length <= 80 && d >= newest - 1) out.r[k] = Math.round(d);
  out.ev = sanitizeEv(x.ev);
  if (x.ev && typeof x.ev === 'object') verify(out.ev, out.m);   // ô Beta lưu sai lệch so với thống kê → sửa theo thống kê (C399)
  out.pri = x.pri === 1 ? 1 : 0;
  const dg = obj(x.diag);
  if (x.diag && typeof x.diag === 'object') out.diag = { day: day(dg.day) ?? 0, u: num(dg.u, 0, 5, 0), g: num(dg.g, 0, 5, 0), n: Math.round(num(dg.n, 0, 1000, 0)) };
  const q = sanitizeQuest(x.q);
  if (q) out.q = q;
  const ms = sanitizeMeasure(x.ms);
  if (ms) out.ms = ms;
  const bk = sanitizeBlocks(x.bk);
  if (bk) out.bk = bk;
  const bd = sanitizeBoard(x.bd);
  if (bd) out.bd = bd;
  const gc = sanitizeCards(x.gc);
  if (gc) out.gc = gc;
  const gq = sanitizeCafe(x.gq);
  if (gq) out.gq = gq;
  const gs = sanitizeBubbles(x.gs);
  if (gs) out.gs = gs;
  const gd = sanitizePuzzle(x.gd);
  if (gd) out.gd = gd;
  const gw = sanitizeShop(x.gw);
  { const g = x.gf as { runs?: unknown; day?: unknown } | undefined; if (g && typeof g === 'object') out.gf = { runs: Math.max(0, Math.min(1e7, Math.round(Number(g.runs) || 0))), day: Math.max(0, Math.min(1e6, Math.round(Number(g.day) || 0))) }; }
  const gb = sanitizeRobot(x.gb);
  const gv = sanitizeGarden(x.gv);
  if (gv) out.gv = gv;
  const gp = sanitizeDir(x.gp);
  if (gp) out.gp = gp;
  const pm = sanitizePlay(x.pm);
  if (pm) out.pm = pm;
  const tw = sanitizeTown(x.tw);
  if (tw) out.tw = tw;
  if (gb) out.gb = gb;
  { const raw = x.gl as { lastId?: unknown } | undefined, v = sanitizeLetter(raw); if (v) out.gl = { ...v, ...(typeof raw?.lastId === 'string' ? { lastId: raw.lastId.slice(0, 40) } : {}) }; }
  if (gw) out.gw = gw;
  { const raw = x.gk as { lastId?: unknown } | undefined, v = sanitizeKara(raw); if (v) out.gk = { ...v, ...(typeof raw?.lastId === 'string' ? { lastId: raw.lastId.slice(0, 40) } : {}) }; }
  for (const k of ['gt', 'gr'] as const) { const raw = x[k] as { lastId?: unknown } | undefined, v = sanitizeCase(raw); if (v) out[k] = { ...v, ...(typeof raw?.lastId === 'string' ? { lastId: raw.lastId.slice(0, 40) } : {}) }; }
  return out;
}

// Gộp hai máy (đồng bộ): hợp các mục tiêu, máy nào chọn trước thì giữ ngày chọn sớm hơn; ngày thi lấy bản có giá trị.
export function mergeE(a: unknown, b: unknown): EState {
  const A = sanitizeE(a), B = sanitizeE(b), by = new Map(A.goals.map(g => [g.id, g]));
  for (const g of B.goals) {
    const cur = by.get(g.id);
    if (!cur) by.set(g.id, g);
    else by.set(g.id, { ...cur, since: Math.min(cur.since, g.since), date: cur.date ?? g.date });
  }
  const ev = mergeEv(A.ev, B.ev);
  return sanitizeE({ v: E_V, goals: [...by.values()].sort((p, q) => p.since - q.since), m: recomputeAll(ev), ev, r: { ...B.r, ...A.r }, pri: A.pri || B.pri ? 1 : 0, diag: !A.diag ? B.diag : !B.diag ? A.diag : A.diag.day >= B.diag.day ? A.diag : B.diag, q: mergeQuest(A.q, B.q), ms: mergeMeasure(A.ms, B.ms), bk: mergeBlocks(A.bk, B.bk), bd: mergeBoard(A.bd, B.bd), gc: mergeCards(A.gc, B.gc), gq: mergeCafe(A.gq, B.gq), gs: mergeBubbles(A.gs, B.gs), gd: mergePuzzle(A.gd, B.gd), gt: mergeCase(A.gt, B.gt), gr: mergeCase(A.gr, B.gr), gk: mergeKara(A.gk, B.gk), gw: mergeShop(A.gw, B.gw), gl: mergeLetter(A.gl, B.gl), gb: mergeRobot(A.gb, B.gb), gv: mergeGarden(A.gv, B.gv), pm: mergePlay(A.pm, B.pm), tw: mergeTown(A.tw, B.tw), gp: mergeDir(A.gp, B.gp), gf: A.gf || B.gf ? { runs: Math.max(A.gf?.runs ?? 0, B.gf?.runs ?? 0), day: Math.max(A.gf?.day ?? 0, B.gf?.day ?? 0) } : undefined });
}
