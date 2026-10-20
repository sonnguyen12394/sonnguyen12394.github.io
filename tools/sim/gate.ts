#!/usr/bin/env node
// v171 / v172 Mô phỏng thô: học bài chính thống tới khi mở Thi chuyển cấp (📘 Học ≥ 80%, 🔁 Nhớ ≥ 50%), CÙNG thời gian học mỗi ngày.
// Dùng FSRS thật của app (src/exam/fsrs.ts) và luật Nhớ của partsOf (≥ 70% từ của unit nhớ ra sau ≥ 3 ngày, nhớ trung bình ≥ 0,9).
// Giả định: 1 từ mới ≈ 3 câu luyện, 1 lượt ôn ≈ 1,3 câu, 2 câu / phút; đúng ít hơn FSRS dự đoán 10%; nghỉ 1 ngày / tuần.
// Ngữ pháp / âm / chức năng đi theo tỉ lệ unit. Learner giả lập, không thay người thật. Dùng: npm run gatesim
import { newCard, review, retrievability, interval } from '../../src/exam/fsrs.ts';

type Mode = 'ôn trước (v171)' | 'cân bằng' | 'học trước (v172)';
function run(o: { NU: number; NG: number; NP: number; TOT: number; B: number; mode: Mode }) {
  let rnd = 11; const r = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
  type Wd = { s: number; d: number; last: number; due: number; first: number; good: number };
  const words: Wd[] = []; let lu = 0, rev = 0, lapse = 0; const res: Record<string, number> = {};
  const learnOf = (n: number) => (n + Math.min(o.NG, Math.round(n * o.NG / o.NU)) + Math.min(o.NP, Math.round(n * o.NP / o.NU))) / o.TOT;
  for (let t = 0; t < 700; t++) {
    if (t % 7 !== 6) {
      let budget = o.B; const ph2 = learnOf(lu) >= 0.8 || lu >= o.NU;
      const due = words.filter(w => w.due <= t).sort((a, b) => a.due - b.due);
      const doReview = (n: number) => { for (const w of due.splice(0, n)) { if (budget < 1.3) break; budget -= 1.3; rev++;
        const ok = r() < retrievability(t - w.last, w.s) * 0.9; if (!ok) lapse++;
        const c = review({ s: w.s, d: w.d, last: w.last, due: w.due, reps: 1, lapses: 0 }, ok ? 3 : 1, t);
        Object.assign(w, { s: c.s, d: c.d, last: t, due: ok ? t + interval(c.s) : t + 1 }); if (ok) w.good = t; } };
      const doNew = (max: number) => { for (let k = 0; k < max && lu < o.NU && budget >= 30; k++) { budget -= 30;
        for (let i = 0; i < 10; i++) { const c = newCard(3, t); words.push({ s: c.s, d: c.d, last: t, due: c.due, first: t, good: t }); } lu++; } };
      if (o.mode === 'học trước (v172)') { if (ph2) { doReview(60); if (due.length < 40) doNew(1); } else { doNew(2); doReview(12); } }
      else if (o.mode === 'cân bằng') { const keep = Math.min(30, budget); budget -= keep; doReview(999); budget += keep; doNew(1); doReview(999); }
      else { doReview(60); if (due.length < 40) doNew(1); }
    }
    let mem = 0;
    for (let u = 0; u < lu; u++) { const ws = words.slice(u * 10, u * 10 + 10);
      if (ws.filter(w => w.good - w.first >= 3).length >= 7 && ws.reduce((a, w) => a + retrievability(t - w.last, w.s), 0) / 10 >= 0.9) mem++; }
    const gL = Math.min(o.NG, Math.round(lu * o.NG / o.NU)), H = learnOf(lu), N = (mem + Math.round(gL * (lu ? mem / lu : 0))) / o.TOT;
    if (!res['Học80'] && H >= 0.8) res['Học80'] = t + 1;
    if (!res['mở'] && H >= 0.8 && N >= 0.5) Object.assign(res, { 'mở': t + 1, 'lượt ôn': rev, 'quên %': Math.round(100 * lapse / Math.max(1, rev)), 'nhớ chắc %': Math.round(100 * words.filter(w => w.s >= 20).length / words.length) });
  }
  return res;
}
const LV = { A1: { NU: 87, NG: 28, NP: 15, TOT: 130 }, A2: { NU: 174, NG: 58, NP: 33, TOT: 265 } };
console.log('Ngày tới 📘 Học 80% · ngày mở Thi chuyển cấp · tổng lượt ôn · % lượt ôn bị quên · % từ nhớ chắc (độ bền ≥ 20 ngày) lúc mở');
for (const [name, L] of Object.entries(LV)) for (const B of [60, 90]) for (const mode of ['ôn trước (v171)', 'cân bằng', 'học trước (v172)'] as Mode[])
  console.log(name, `~${B / 2} phút/ngày`, mode.padEnd(16), JSON.stringify(run({ ...L, B, mode })));
