// Bot người học L03 — Người học trung bình. Lõi chơi app: tools/learners/core.ts. App KHÔNG thấy hồ sơ này.
// Ground truth (--target b1, người học A2+): từ vựng mạnh (A1 0,9 / A2 0,75 / B1 0,5), ngữ pháp vừa (A1 0,8 / A2 0,6 / B1 0,3),
// nghe yếu (âm 0,35 — nút thắt), chức năng giao tiếp (gần "nói") yếu (A1 0,55 / A2 0,4). --target b2: người học B1, mọi thứ lên một bậc.
//   Nhận ra tốt; nhớ lại s^1,6; dùng có kiểm soát (mức 4) s^2; transfer câu mới ×0,85, lên ×1 khi nhớ bền (S ≥ 16 ngày); câu quen +0,15.
//   Nhớ lâu vừa (S = 3 ngày); học sau giải thích +20%, dòng "vì sao" +10%, thấy đáp án +6%, trả lời đúng +4%; ít bấm "Không biết".
// Kịch bản ép (cờ `forced`): S05 sai một lần giữa chuỗi đúng; S06 sai 4 lần liên tiếp; S11 câu quen đúng / câu mới sai;
// S13 phần đã Đạt quên khi rương ôn hỏi. Biến thể: --rate 2 (S01 tiến bộ nhanh), --rate 0.5 (S02 tiến bộ chậm), --short (S15 1 tầng/ngày).
// Chạy: node --experimental-strip-types --no-warnings tools/learners/l03.ts [--target b1|b2] [--seed 1] [--rate 1] [--short] [--out …]

import { run, NODE, arg, pickGoal, type Profile, type Decision } from './core.ts';

const TARGET = arg('target', 'b1') === 'b2' ? 'b2' : 'b1', SHORT = process.argv.includes('--short');
const PRIOR: Record<'b1' | 'b2', Record<string, Record<string, number>>> = {
  b1: {
    u: { 'Pre-A1': 0.95, A1: 0.9, A2: 0.75, B1: 0.5, B2: 0.2, C1: 0.05 },
    g: { 'Pre-A1': 0.9, A1: 0.8, A2: 0.6, B1: 0.3, B2: 0.1, C1: 0.03 },
    ph: { 'Pre-A1': 0.4, A1: 0.35, A2: 0.3, B1: 0.25, B2: 0.2, C1: 0.1 },
    fn: { 'Pre-A1': 0.65, A1: 0.55, A2: 0.4, B1: 0.2, B2: 0.08, C1: 0.03 },
  },
  b2: {
    u: { 'Pre-A1': 0.97, A1: 0.95, A2: 0.9, B1: 0.75, B2: 0.45, C1: 0.15 },
    g: { 'Pre-A1': 0.95, A1: 0.9, A2: 0.8, B1: 0.6, B2: 0.3, C1: 0.08 },
    ph: { 'Pre-A1': 0.5, A1: 0.45, A2: 0.4, B1: 0.35, B2: 0.3, C1: 0.2 },
    fn: { 'Pre-A1': 0.8, A1: 0.7, A2: 0.55, B1: 0.4, B2: 0.2, C1: 0.08 },
  },
};
export const tf = (S: number): number => 0.85 + 0.15 * Math.min(1, Math.max(0, (S - 3) / 13));
const ex = (level: number) => (level >= 4 ? 2 : 1.6);
// Năng lực thật ở một mức với câu MỚI, tự lực: thước đo yếu / vững để so với kết luận của app.
export function truthAt(s: number, level: number, S = 3): number {
  const sn = s * tf(S);
  return level <= 2 ? sn : Math.pow(sn, ex(level));
}

const S = { s05: false, s06: '', s06left: 0, s06done: false, s11: 0, s13: 0 };

export const L03: Profile = {
  name: `L03-${TARGET}`, out: `reports/learners/L03/${TARGET}`, S0: 3,
  prior: node => (PRIOR[TARGET][node.split(':')[0]!] ?? PRIOR[TARGET].fn!)[NODE.get(node)?.cefr ?? 'A2'] ?? 0.1,
  pCorrect: (x, s0, q, novel, opts) => {
    const s = novel ? s0 * tf(x.S) : Math.min(1, s0 + 0.15);
    return opts ? s + (1 - s) / opts : Math.pow(s, ex(q.level));
  },
  gain: { ok: 0.04, bad: 0.06, card: 0.2, teach: 0.2, why: 0.1, diagOk: 0.02 },
  dunno: (s, rnd) => s < 0.25 && rnd() < 0.3,
  ...(SHORT ? { floors: () => 1 } : {}),
  cause: (c, q, x) => {
    const s = c.eff(x, c.day());
    if (x.peak >= 0.8 && s < x.peak - 0.2) return 'retention';
    if (s < 0.35) return 'knowledge';
    if (q.level <= 2) return s < 0.75 ? 'partial' : 'none';
    const fam = Math.pow(Math.min(1, s + 0.15), ex(q.level)), nov = Math.pow(s * tf(x.S), ex(q.level));
    if (fam < 0.5) return q.level >= 4 ? 'use' : 'recall';
    if (nov < 0.5) return 'transfer';
    return 'none';
  },
  decide: (c, q, x): Decision | null => {
    const day = c.day(), prev = c.rows.filter(r => r.node === q.node), quest = q.run === 'quest' && q.game !== 'camp';
    // S05: một lỗi giữa chuỗi đúng (≥ 3 lượt đúng tự nhiên ở nút).
    if (quest && !S.s05 && day >= 2 && prev.filter(r => r.ok && !r.forced).length >= 3 && q.node !== S.s06) { S.s05 = true; c.note('S05', { node: q.node }); return { ok: false, forced: 'S05' }; }
    // S06: sai 4 lần liên tiếp ở một nút.
    if (quest && S.s06 === q.node && S.s06left > 0) { S.s06left--; return { ok: false, forced: 'S06' }; }
    if (quest && !S.s06done && day >= 3 && prev.length >= 1) { S.s06 = q.node; S.s06done = true; S.s06left = 3; c.note('S06', { node: q.node }); return { ok: false, forced: 'S06' }; }
    // S11: câu quen đúng nhưng câu mới (trùm / transfer) sai.
    if (S.s11 < 2 && day >= 4 && (q.game === 'boss' || q.run === 'xfer') && !x.seen.has(q.id) && prev.some(r => r.ok)) { S.s11++; c.note('S11', { node: q.node }); return { ok: false, forced: 'S11' }; }
    // S13: phần đã Đạt, rương ôn hỏi sau một thời gian → quên.
    if (S.s13 < 2 && day >= 7 && (q.game === 'chest' || q.gap === 'retention')) { S.s13++; c.note('S13', { node: q.node }); return { ok: false, forced: 'S13' }; }
    return null;
  },
  afterDiag: c => pickGoal(c, TARGET === 'b2' ? 'cefr-b2' : 'cefr-b1'),
};

if (import.meta.url === `file://${process.argv[1]}`) run(L03).catch(e => { console.error(e); process.exit(1); });
