// Ladder Quest (spec v2.4 §19–24, P14, HG12/HG20/HG24; C61–C70, C187–C190, C341–C360). Thuần hàm.
// Học ẩn trong game: người học leo tháp, mỗi hành động (đánh quái, trinh sát, mở rương, đánh trùm) là MỘT thử thách tiếng Anh do
// engine chọn theo Next Best Action, để lên cấp CEFR nhanh nhất. Không có gameplay "rỗng".
//   Não vs giao diện (HG24): engine chọn nút + mức + câu; game chỉ quyết định cách trình bày (loại cảnh, máu, phần thưởng).
//   Tách kỹ năng game khỏi ngôn ngữ (P14): độ khó gameplay (máu quái, số tim) chỉnh theo tầng, KHÔNG đổi câu hỏi; kết quả game
//   (xu, thắng/thua, tầng) chỉ là telemetry (tier 0), không bao giờ vào mastery. Không tính giờ: không ép thời gian.
//   Lợi ích người chơi = lợi ích học (C346): xu tỉ lệ với giá trị học / thông tin của lượt (trùm transfer > trinh sát > rương ôn
//   > quái học mới > câu đã thuộc). Muốn mạnh trong game thì phải đi đúng đường học nhanh nhất.
//   Giới hạn trung thực: lượt chơi hữu hạn (một tầng ≈ 8 câu), có điểm dừng tự nhiên, không khan hiếm giả, không phạt khi nghỉ.

import type { Action } from './nba.ts';
import type { PathItem } from './path.ts';
import type { Level } from './types.ts';

export const QUEST_VER = 'quest-1';
export type Enc = 'monster' | 'scout' | 'chest' | 'camp' | 'boss';
export const ENC_VI: Record<Enc, { ico: string; vi: string; verb: string }> = {
  monster: { ico: '👾', vi: 'Quái', verb: 'Trả lời đúng để tấn công' },
  scout: { ico: '🔭', vi: 'Trinh sát', verb: 'Trả lời để dò đường' },
  chest: { ico: '🎁', vi: 'Rương', verb: 'Nhớ ra để mở rương' },
  camp: { ico: '🔥', vi: 'Trại', verb: 'Đọc bí kíp, hồi một tim' },
  boss: { ico: '🐉', vi: 'Trùm', verb: 'Câu mới chưa gặp: đánh bại trùm' },
};

// Game Challenge Model (§20): mỗi lượt là một thử thách có phiên bản, tách độ khó ngôn ngữ và độ khó gameplay.
export interface Challenge {
  id: string; gameType: Enc; node: string; level: Level; targetCompetencies: string[]; evidenceTypes: string[];
  languageDifficulty: number;     // mức mastery mà câu đo (1–5), do engine chọn
  gameplayDifficulty: number;     // 0–1, chỉ ảnh hưởng máu / tim, không đổi câu hỏi
  expectedTime: number;           // giây
  context: string; scoringRule: string; value: number; version: string;
}

export interface FloorIn {
  acts: Action[];                  // NBA đã xếp hạng (học / ôn / dò / xác minh / transfer)
  open: PathItem[];                // biên lộ trình (nút đủ tiền đề)
  review: string[];                // nút đã Đạt sắp quên (ôn), nhiều nguy cơ trước
  can: (node: string) => boolean;  // nút có câu hỏi
  started: (node: string) => boolean;   // nút đã có bằng chứng (chưa thì hỏi mức nhận ra trước)
  floor: number;
  size?: number;
  fresh?: (node: string) => boolean;    // v69: nút chưa bị hỏi quá QUEST.capDay lượt hôm nay (giãn cách, chống hỏi lặp một nút cả ngày)
  claims?: string[];                    // v69: nút chẩn đoán "suy ra đã biết" (Claim) chưa xác nhận: trinh sát / rương rảnh thì kiểm tra
  explore?: boolean;                    // v70: false = người học đang sai nhiều → trinh sát không dò khám phá (vẫn xác nhận Claim)
  neck?: string;                        // v71: điểm nghẽn hiện tại (yếu × quan trọng) → quái đầu tiên của tầng
  claimLv?: (node: string) => Level;    // v71: mức của Claim (mức cần của nút); không có thì mức 3
  order?: Enc[];                        // v72: thứ tự cảnh của game khác (Xếp Khối: nhiều rương ôn hơn); mặc định thứ tự tầng tháp
  tag?: string;                         // v72: tiền tố id lượt theo game ('b' = Xếp Khối) — id vẫn bắt đầu bằng QUEST_VER
}
// capDay: số lượt tối đa mỗi nút mỗi ngày trong tháp (giãn cách). wip: số phần đang học dở tối đa trước khi mở phần mới — học xong
// phần đã bắt đầu trước khi rải sang phần mới (bot L01: không giới hạn thì một tháng chạm 100 nút mà gần như không nút nào vững).
export const QUEST = { capDay: 3, wip: 6 } as const;

const EVT: Record<Enc, string[]> = { monster: ['recognition', 'recall'], scout: ['diagnostic'], chest: ['retention'], camp: ['micro'], boss: ['transfer', 'novel'] };
const BASE: Record<Enc, number> = { boss: 30, scout: 20, chest: 15, monster: 10, camp: 5 };

export function gameplayDifficulty(floor: number): number { return Math.min(1, 0.2 + floor * 0.05); }

// Dựng một tầng: thứ tự cảnh cố định cho nhịp chơi (quái → trinh sát → quái → rương → trại → quái → quái → trùm), nội dung do NBA.
export function planFloor(x: FloorIn): Challenge[] {
  const size = x.size ?? 8, pick = picker(x), out: Challenge[] = [];
  const order: Enc[] = x.order ?? ['monster', 'scout', 'monster', 'chest', 'camp', 'monster', 'monster', 'boss'];
  for (const k of order.slice(0, x.order ? order.length : size)) {
    const c = pick(k);
    if (c) out.push(c);
  }
  return out;
}

// v73: bộ chọn nội dung theo loại cảnh, dùng chung cho tầng tháp (thứ tự cố định) và Bàn Cờ (loại cảnh do xúc xắc). Mỗi lần gọi trả
// lượt kế tiếp cho loại cảnh đó; loại cảnh không có gì phù hợp thì về quái (học phần ưu tiên của lộ trình), như tầng tháp.
export function picker(x: FloorIn): (kind: Enc) => Challenge | null {
  const gp = gameplayDifficulty(x.floor), used = new Set<string>(), out: Challenge[] = [];
  const val = new Map(x.acts.map(a => [`${a.kind}|${a.node}`, a.u]));
  const mk = (kind: Enc, node: string, level: Level, value: number): Challenge => ({
    id: `${QUEST_VER}:${x.tag ?? ''}${x.floor}:${out.length}:${node}`, gameType: kind, node, level, targetCompetencies: [node], evidenceTypes: EVT[kind],
    languageDifficulty: level, gameplayDifficulty: gp, expectedTime: kind === 'camp' ? 60 : kind === 'boss' ? 30 : 15,
    context: `quest-${kind}`, scoringRule: 'ok', value: Math.round(value * 100) / 100, version: QUEST_VER,
  });
  const all = x.open.filter(o => x.can(o.node)), rested = x.fresh ? all.filter(o => x.fresh!(o.node)) : all;
  const busy = all.filter(o => x.started(o.node)).length, room = Math.max(0, QUEST.wip - busy);
  // Phần ưu tiên số 1 của lộ trình (chính là "Bước tiếp theo" hiển thị) luôn được vào, kể cả khi đã đủ phần đang học dở.
  const focus = (xs: PathItem[]): PathItem[] => { let k = 0; return xs.filter((o, i) => i === 0 || x.started(o.node) || k++ < room); };
  const learn = [focus(rested), focus(all)].find(xs => xs.length) ?? all;
  // v71 (bot L03): Claim được kiểm ở đúng mức đã suy ra (ngữ pháp mức 4): trước đây luôn hỏi mức 3 nên Claim mức 4 không bao giờ xác nhận
  // được; không hỏi một Claim quá giới hạn lượt / ngày.
  const claim = (): string | undefined => (x.claims ?? []).find(n => x.can(n) && !used.has(n) && (!x.fresh || x.fresh(n)));
  const clv = (n: string): Level => x.claimLv?.(n) ?? 3;
  const take = (kind: Enc): Challenge | null => {
    if (kind === 'boss') {
      const a = x.acts.find(a => (a.kind === 'transfer' || a.kind === 'verify') && x.can(a.node) && !used.has(a.node));
      if (a) { used.add(a.node); return mk('boss', a.node, a.level as Level, a.u + 0.5); }
      const o = learn.find(o => !used.has(o.node) && x.started(o.node));
      if (o) { used.add(o.node); return mk('boss', o.node, 3, val.get(`learn|${o.node}`) ?? 1); }
    }
    if (kind === 'scout') {
      const a = x.explore === false ? undefined : x.acts.find(a => a.kind === 'probe' && x.can(a.node) && !used.has(a.node));
      if (a) { used.add(a.node); return mk('scout', a.node, a.level as Level, a.u + 0.3); }
      const n = claim();
      if (n) { used.add(n); return mk('scout', n, clv(n), 0.8); }
    }
    if (kind === 'chest') {
      const n = x.review.find(n => x.can(n) && !used.has(n));
      if (n) { used.add(n); return mk('chest', n, 3, (x.acts.find(a => a.kind === 'review')?.u ?? 1)); }
      const cl = claim();   // chưa có gì sắp quên: dùng lượt này xác nhận một phần app mới chỉ đoán là bạn biết
      if (cl) { used.add(cl); return mk('scout', cl, clv(cl), 0.8); }
    }
    if (kind === 'camp') return mk('camp', '', 1, 0.3);
    if (x.neck && !used.has(x.neck) && x.can(x.neck) && (!x.fresh || x.fresh(x.neck))) { const o = x.open.find(o => o.node === x.neck); used.add(x.neck); return mk('monster', x.neck, (x.started(x.neck) ? o?.level ?? 3 : 1) as Level, (val.get(`learn|${x.neck}`) ?? 0.8) + 0.3); }
    const o = learn.find(o => !used.has(o.node)) ?? learn[out.length % Math.max(1, learn.length)];
    if (!o) return null;
    used.add(o.node);
    return mk('monster', o.node, (x.started(o.node) ? o.level : 1) as Level, val.get(`learn|${o.node}`) ?? 0.8);
  };
  return (kind: Enc) => { const c = take(kind) ?? (kind !== 'monster' ? take('monster') : null); if (c) out.push(c); return c; };
}

// Xu tỉ lệ với giá trị học của lượt (C346–C347); câu sai vẫn được ít xu nếu là câu mới (được học từ đáp án), không bao giờ âm.
export function reward(c: Challenge, ok: boolean, novel: boolean): number {
  if (c.gameType === 'camp') return BASE.camp;
  const v = Math.max(0.2, Math.min(2.5, c.value)), nov = novel ? 1 : 0.4;
  return Math.max(1, Math.round((ok ? BASE[c.gameType] : 2) * v * nov));
}

// Gameplay: tim của người chơi và máu quái theo tầng (độc lập với câu hỏi).
export function hearts(floor: number): number { return floor < 3 ? 4 : 3; }

// Tiến độ game lưu trong engine state (telemetry tier 0: không vào mastery).
export interface QuestSave { floor: number; best: number; coins: number; runs: number; wins: number; ans: number; ok: number; day: number }
export const freshQuest = (): QuestSave => ({ floor: 1, best: 0, coins: 0, runs: 0, wins: 0, ans: 0, ok: 0, day: 0 });
export function sanitizeQuest(raw: unknown): QuestSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, q = freshQuest();
  const n = (v: unknown, hi: number, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : d);
  return { floor: Math.max(1, n(x.floor, 1e4, 1)), best: n(x.best, 1e4, 0), coins: n(x.coins, 1e9, 0), runs: n(x.runs, 1e7, 0), wins: n(x.wins, 1e7, 0), ans: n(x.ans, 1e9, 0), ok: n(x.ok, 1e9, 0), day: n(x.day, 1e6, q.day) };
}
// Gộp hai máy: lấy bản tiến xa hơn của từng chỉ số (không cộng dồn để khỏi đếm trùng).
export function mergeQuest(a?: QuestSave, b?: QuestSave): QuestSave | undefined {
  if (!a) return b; if (!b) return a;
  return { floor: Math.max(a.floor, b.floor), best: Math.max(a.best, b.best), coins: Math.max(a.coins, b.coins), runs: Math.max(a.runs, b.runs), wins: Math.max(a.wins, b.wins), ans: Math.max(a.ans, b.ans), ok: Math.max(a.ok, b.ok), day: Math.max(a.day, b.day) };
}
