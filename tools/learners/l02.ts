// Bot người học L02 — Người học yếu / nhiều lỗ hổng. Lõi chơi app: tools/learners/core.ts. App KHÔNG thấy hồ sơ này.
// Ground truth (hồ sơ ẩn):
//   - Mục tiêu CEFR B1 (bot tự chọn ở màn Mục tiêu sau bài dò — việc người học được làm; bot không tự chọn bài học).
//   - Từ vựng A1 0,85 / A2 0,6 / B1 0,2; ngữ pháp A1 0,5 / A2 0,3 / B1 0,08 (nút thắt chính: nền ngữ pháp); âm (nghe) 0,2.
//   - Nhớ lại yếu: câu tự gõ s^2,2; dùng có kiểm soát (mức 4) s^2,8. Transfer thấp: câu mới ×0,7 (lên dần ×1 khi nhớ bền), câu quen +0,2.
//   - Nhớ lâu thấp–vừa: S = 1,5 ngày. Đoán mò khi không chắc (ít bấm "Không biết").
//   - Học nhanh sau giải thích rõ: thẻ mới / bí kíp +30%, dòng "vì sao" +15%; thấy đáp án +8%.
//   - Hiểu sai ở 3 nút: g-a1-01 (to be) và g-a1-04 (số nhiều) — kiểu 1, luôn chọn cùng một phương án sai; g-a1-08 (hiện tại đơn) —
//     kiểu 2, sai cùng mẫu (bỏ/thêm -s, -ed) nhưng chữ khác nhau mỗi câu. Giải thích chung làm hiểu sai giảm 15%;
//     giải thích nhắm đúng câu sai hay gặp ("Bạn hay trả lời…") giảm 60%.
// Kịch bản ép (ghi cờ `forced` trong row): S01 sai một lần giữa chuỗi đúng; S02 sai 3 lần liên tiếp; S03 câu chọn đúng / câu gõ sai;
// S04 câu quen đúng / câu mới sai; S06 sai khi rương ôn hỏi phần đã Đạt. S05, S07, S10 lấy từ hành vi tự nhiên (analyze-l02.ts).
// Chạy: node --experimental-strip-types --no-warnings tools/learners/l02.ts [--seed 1] [--rate 1] [--out reports/learners/L02]

import { run, NODE, type Profile, type Decision } from './core.ts';

const PRIOR: Record<string, Record<string, number>> = {
  u: { 'Pre-A1': 0.9, A1: 0.85, A2: 0.6, B1: 0.2, B2: 0.05, C1: 0.02 },
  g: { 'Pre-A1': 0.6, A1: 0.5, A2: 0.3, B1: 0.08, B2: 0.03, C1: 0.01 },
  ph: { 'Pre-A1': 0.25, A1: 0.2, A2: 0.15, B1: 0.08, B2: 0.04, C1: 0.02 },
  fn: { 'Pre-A1': 0.5, A1: 0.4, A2: 0.25, B1: 0.1, B2: 0.04, C1: 0.02 },
};
// Transfer thấp nhưng không cố định: câu mới ×0,7 khi kiến thức còn mới, tăng dần tới ×1 khi đã nhớ bền (S ≥ 16 ngày, tức đã nhớ lại
// đúng cách quãng nhiều lần). Ôn cách quãng vì vậy giúp dùng được ở câu mới — giả định sư phạm, ghi rõ để người đọc tự đánh giá.
export const tf = (S: number): number => 0.7 + 0.3 * Math.min(1, Math.max(0, (S - 1.5) / 14.5));
// Năng lực thật ở một mức với câu MỚI, tự lực (không quen câu, không đoán): thước đo "yếu / vững" để so với kết luận của app.
export function truthAt(s: number, level: number, S = 1.5): number {
  const sn = s * tf(S);
  return level <= 2 ? sn : Math.pow(sn, level >= 4 ? 2.8 : 2.2);
}
export const MIS: Record<string, 1 | 2> = { 'g:g-a1-01': 1, 'g:g-a1-04': 1, 'g:g-a1-08': 2 };

// Kiểu 2: sai cùng mẫu, chữ khác nhau (bỏ -s ngôi thứ ba, hoặc thêm -ed).
function pattern(right: string): string {
  const w = right.split(' ');
  const i = w.findIndex(x => x.length > 3 && /s$/i.test(x.replace(/[^a-z]/gi, '')) && !/^(this|was|is|has|does|yes)$/i.test(x.replace(/[^a-z]/gi, '')));
  if (i >= 0) { w[i] = w[i]!.replace(/s([^a-z]*)$/i, '$1'); return w.join(' '); }
  const j = w.length - 1; w[j] = w[j]!.replace(/([a-z]+)([^a-z]*)$/i, '$1ed$2'); return w.join(' ');
}

const S = { s01: '', s01done: false, s02: '', s02left: 0, s02done: false, s03: '', s03left: 0, s03done: false, s04: 0, s06: 0 };

export const L02: Profile = {
  name: 'L02', out: 'reports/learners/L02', S0: 1.5,
  prior: node => (PRIOR[node.split(':')[0]!] ?? PRIOR.fn!)[NODE.get(node)?.cefr ?? 'A2'] ?? 0.1,
  pCorrect: (x, s0, q, novel, opts) => {
    const s = novel ? s0 * tf(x.S) : Math.min(1, s0 + 0.2);
    return opts ? s + (1 - s) / opts : Math.pow(s, q.level >= 4 ? 2.8 : 2.2);
  },
  gain: { ok: 0.04, bad: 0.08, card: 0.3, teach: 0.3, why: 0.15, diagOk: 0.02 },
  dunno: (s, rnd) => s < 0.25 && rnd() < 0.2,
  cause: (c, q, x, novel) => {
    const s = c.eff(x, c.day());
    if ((x.mis ?? (MIS[q.node] ? 0.7 : 0)) > 0.3) return 'misconception';
    if (x.peak >= 0.8 && s < x.peak - 0.2) return 'retention';
    if (s < 0.35) return 'knowledge';
    if (q.level <= 2) return s < 0.75 ? 'partial' : 'none';   // nhận ra: biết lơ mơ hay biết
    // Mức 3 (tự nhớ ra) / 4 (dùng có kiểm soát): câu quen mà vẫn khó → lỗ hổng nhớ lại / dùng; câu quen được mà câu mới không → transfer.
    // Theo NÚT ở mức này (không theo câu cụ thể): lỗ hổng là gì nếu hỏi một câu mới.
    const e = q.level >= 4 ? 2.8 : 2.2, fam = Math.pow(Math.min(1, s + 0.2), e), nov = Math.pow(s * tf(x.S), e);
    void novel;
    if (fam < 0.5) return q.level >= 4 ? 'use' : 'recall';
    if (nov < 0.5) return 'transfer';
    return 'none';
  },
  // Giải thích chung (thẻ, bí kíp, dòng vì sao) chỉ làm hiểu sai yếu đi chút ít; giải thích nhắm đúng câu sai hay gặp ("Bạn hay trả lời…")
  // mới gỡ được phần lớn.
  // Giải thích chung (thẻ, bí kíp, dòng vì sao) chỉ làm hiểu sai yếu đi chút ít; giải thích nhắm đúng câu sai hay gặp mới gỡ được.
  explained: (c, node, how) => { const x = c.k(node); if (x.mis) { const f = how === 'targeted' ? 0.4 : 0.85; x.mis = x.mis * f < 0.05 ? 0 : x.mis * f; c.note('mis-explained', { node, how, mis: +x.mis.toFixed(3) }); } },
  decide: (c, q, x, _p, ok): Decision | null => {
    const day = c.day(), prev = c.rows.filter(r => r.node === q.node), quest = q.run === 'quest' && q.game !== 'camp';
    // ---- Kịch bản ép (trên câu app đang hỏi; bot không tự chọn bài) ----
    if (quest && !S.s01done && day >= 1 && prev.filter(r => r.ok && !r.forced).length >= 2 && q.node !== S.s02 && q.node !== S.s03) { S.s01 = q.node; S.s01done = true; c.note('S01', { node: q.node }); return { ok: false, forced: 'S01' }; }
    if (quest && S.s02 === q.node && S.s02left > 0) { S.s02left--; return { ok: false, forced: 'S02' }; }
    if (quest && !S.s02done && day >= 2 && prev.length >= 1 && q.node !== S.s01 && q.node !== S.s03 && !MIS[q.node]) { S.s02 = q.node; S.s02done = true; S.s02left = 2; c.note('S02', { node: q.node }); return { ok: false, forced: 'S02' }; }
    if (quest && S.s03 === q.node && S.s03left > 0) { S.s03left--; return q.opts ? { ok: true, forced: 'S03' } : { ok: false, forced: 'S03' }; }
    if (quest && !S.s03done && day >= 3 && q.opts && q.node.startsWith('g:') && q.node !== S.s01 && q.node !== S.s02 && !MIS[q.node]) { S.s03 = q.node; S.s03done = true; S.s03left = 5; c.note('S03', { node: q.node }); return { ok: true, forced: 'S03' }; }
    if (S.s04 < 2 && day >= 4 && (q.game === 'boss' || q.run === 'xfer') && !x.seen.has(q.id) && prev.some(r => r.ok)) { S.s04++; c.note('S04', { node: q.node }); return { ok: false, forced: 'S04' }; }
    if (S.s06 < 2 && (q.game === 'chest' || q.gap === 'retention')) { S.s06++; c.note('S06', { node: q.node }); return { ok: false, forced: 'S06' }; }
    // ---- Hiểu sai ----
    const kind = MIS[q.node];
    if (kind && x.mis === undefined) x.mis = 0.7;
    if (kind && x.mis && c.rnd() < x.mis) {
      if (q.opts) {
        const wrong = q.opts.map((o, i) => ({ o, i })).filter(z => z.i !== q.ans);
        let pick = kind === 1 && x.belief ? wrong.find(z => z.o === x.belief) : undefined;
        if (!pick) pick = kind === 2 ? wrong.find(z => /ed\b/i.test(z.o)) ?? wrong[0] : wrong[0];
        if (kind === 1 && pick && !x.belief) x.belief = pick.o;
        return pick ? { ok: false, i: pick.i, mis: true } : null;
      }
      const right = q.accept?.[0] ?? '';
      return right ? { ok: false, typed: kind === 2 ? pattern(right) : (x.belief ?? pattern(right)), mis: true } : null;
    }
    return null;
  },
  afterDiag: async c => {
    // Người học muốn B1: vào Mục tiêu và chọn CEFR B1 (giữ mục tiêu app đã tự đặt; bao đóng B1 gồm cả A1–A2).
    const goals = c.page.locator('[data-e="go"][data-r="goals"]').filter({ visible: true }).first();
    if (await goals.count()) { await goals.click(); await c.sleep(400); }
    const pick = c.page.locator('[data-r="pick/cefr"]').filter({ visible: true }).first();
    if (await pick.count()) { await pick.click(); await c.sleep(300); }
    const add = c.page.locator('[data-e="add"][data-g="cefr-b1"]').filter({ visible: true }).first();
    if (await add.count()) { await add.click(); await c.sleep(400); c.note('goal-b1'); } else c.note('stuck', 'không thấy nút chọn CEFR B1');
    await c.shot('goal-b1');
    const tab = c.page.locator('#bnav button, #nav button').filter({ hasText: 'Chơi' }).filter({ visible: true }).first();
    if (await tab.count()) await tab.click();
    await c.sleep(400);
  },
};

if (import.meta.url === `file://${process.argv[1]}`) run(L02).catch(e => { console.error(e); process.exit(1); });
