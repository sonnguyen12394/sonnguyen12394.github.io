#!/usr/bin/env node
// v171–v173 Mô phỏng: cách cân học / ôn nào tới Thi chuyển cấp (📘 Học ≥ 80%, 🔁 Nhớ ≥ 50%) sớm nhất, CÙNG thời gian học mỗi ngày.
// FSRS thật của app (src/exam/fsrs.ts); luật Nhớ của partsOf: unit có ≥ 70% từ nhớ ra sau ≥ 3 ngày và nhớ trung bình ≥ 0,9.
// Giả định (suy luận, chưa đo người thật): 1 từ mới ≈ 5,3 câu theo luồng bài của app (người đã biết từ: 3 câu), 1 lượt ôn ≈ 1,3 câu, 2 câu / phút;
// ngữ pháp / âm / chức năng tốn thêm theo tỉ lệ unit; mỗi unit mới gặp lại 4 từ cũ (ôn lồng mixDue: quên thì vá ngay).
// Ngoài số ngày, in "nhớ TB": khả năng nhớ trung bình mọi từ của cấp lúc mở, để biết có đủ sức làm bài Thi chuyển cấp không.
// Learner giả lập, không thay người thật. Dùng: npm run gatesim
import { newCard, review, retrievability, interval } from '../../src/exam/fsrs.ts';

export type Strat = 'A ôn trước' | 'B học trước' | 'C ôn thưa' | 'D không ôn' | 'E ôn thưa + chọn unit';
export type Who = { name: string; ms: number; known: number; acc: number; off: number };
export const LV = { A1: { NU: 87, NG: 28, NP: 15, TOT: 130 }, A2: { NU: 174, NG: 58, NP: 33, TOT: 265 } };
type Lv = typeof LV.A1;
// Thời gian mỗi unit kể cả phần ngữ pháp / âm / chức năng đi kèm (câu).
// Đếm từ app.js: 10 thẻ (≈ 0,5 câu / thẻ) + 9 câu xen thẻ + 1 lượt luyện 15 + 4 câu + bài cuối unit 20 câu ≈ 53 câu; từ đã biết ≈ 3 câu.
let PER_WORD = 5.3;
const unitCost = (L: Lv, known: number) => 10 * (PER_WORD - 2.3 * known) + 30 * L.NG / L.NU + 20 * L.NP / L.NU;

export function run(L: Lv, B: number, s: Strat, who: Who, rLearn = 0.75) {
  let rnd = 11; const r = () => ((rnd = (rnd * 1103515245 + 12345) % 2147483648) / 2147483648);
  type Wd = { u: number; s: number; d: number; last: number; due: number; first: number; good: number };
  const words: Wd[] = []; let lu = 0, q = 0, prog = 0; const res = { days: 0, recall: 0, minutes: 0, lapse: 0, rev: 0 };
  const learnOf = (n: number) => (n + Math.min(L.NG, Math.round(n * L.NG / L.NU)) + Math.min(L.NP, Math.round(n * L.NP / L.NU))) / L.TOT;
  const R = (w: Wd, t: number) => retrievability((t - w.last) / who.ms, w.s);   // hay quên: trí nhớ thật phai nhanh hơn lịch của app
  const rev = (w: Wd, t: number, rr: number) => { res.rev++; const ok = r() < R(w, t) * who.acc; if (!ok) res.lapse++;
    const c = review({ s: w.s, d: w.d, last: w.last, due: w.due, reps: 1, lapses: 0 }, ok ? 3 : 1, t);
    Object.assign(w, { s: c.s, d: c.d, last: t, due: ok ? t + interval(c.s, rr) : t + 1 }); if (ok) w.good = t; };
  const memOf = (t: number) => { let m = 0; for (let u = 0; u < lu; u++) { const ws = words.slice(u * 10, u * 10 + 10);
    if (ws.filter(w => w.good - w.first >= 3).length >= 7 && ws.reduce((a, w) => a + R(w, t), 0) / 10 >= 0.9) m++; } return m; };
  for (let t = 0; t < 900; t++) {
    if (t % 7 >= 7 - who.off) continue;
    let budget = B; const ph2 = learnOf(lu) >= 0.8 || lu >= L.NU;
    const rr = !ph2 && (s === 'C ôn thưa' || s === 'E ôn thưa + chọn unit') ? rLearn : 0.9;
    // giai đoạn ôn: đến hạn = tới lịch HOẶC nhớ đã dưới 0,9 (lịch cũ theo mức nhớ thấp hơn)
    const reviewDue = (cap: number, pick?: (w: Wd) => boolean) => { const due = words.filter(w => (w.due <= t || ph2 && R(w, t) < 0.9) && (!pick || pick(w))).sort((a, b) => R(a, t) - R(b, t));
      for (const w of due.slice(0, cap)) { if (budget < 1.3) break; budget -= 1.3; q += 1.3; rev(w, t, rr); } return due.length; };
    const learn = (max: number) => { const cost = unitCost(L, who.known);   // một unit có thể học qua nhiều ngày (prog cộng dồn)
      for (let k = 0; k < Math.min(max, 2) && lu < L.NU && budget > 0; k++) { const use = Math.min(budget, cost - prog); budget -= use; q += use; prog += use; if (prog < cost) break; prog = 0;
        for (let i = 0; i < 10; i++) { const kn = r() < who.known, c = newCard(kn ? 4 : 3, t), st = c.s * who.ms;
          words.push({ u: lu, s: st, d: c.d, last: t, due: t + interval(st, rr), first: t, good: t }); }
        for (let i = 0; i < 4 && lu > 0; i++) { const w = words[Math.floor(r() * lu * 10)]!; budget -= 1.3; q += 1.3; rev(w, t, rr); }   // ôn lồng: gặp lại từ cũ
        lu++; } };
    if (!ph2) {
      if (s === 'A ôn trước') { const left = reviewDue(60); if (left < 40) learn(1); }
      else if (s === 'B học trước') { learn(2); reviewDue(12); }
      else if (s === 'D không ôn') learn(9);
      else { reviewDue(999); learn(9); }   // C / E: ôn hết đến hạn theo mức nhớ thấp (rLearn), phần còn lại học mới
    } else if (s === 'E ôn thưa + chọn unit') {
      // chỉ ôn các unit dễ đạt Nhớ nhất cho tới khi đủ 55% nút; còn lại để sau Thi chuyển cấp
      const need = Math.ceil(0.65 * lu), rank = [...Array(lu).keys()].sort((a, b) => words.slice(b * 10, b * 10 + 10).reduce((x, w) => x + R(w, t), 0) - words.slice(a * 10, a * 10 + 10).reduce((x, w) => x + R(w, t), 0));
      const keep = new Set(rank.slice(0, need)); reviewDue(999, w => keep.has(w.u)); learn(1);
    } else { const left = reviewDue(60); if (left < 40) learn(1); }
    if (learnOf(lu) >= 0.8 && (memOf(t) + Math.round(Math.min(L.NG, Math.round(lu * L.NG / L.NU)) * memOf(t) / Math.max(1, lu))) / L.TOT >= 0.5) {
      res.days = t + 1; res.recall = Math.round(100 * words.reduce((a, w) => a + R(w, t), 0) / Math.max(1, words.length)) / 100; res.minutes = Math.round(q / 2); break; }
  }
  return res;
}

const WHO: Who[] = [
  { name: 'mới, nhớ TB', ms: 1, known: 0, acc: 0.9, off: 1 },
  { name: 'mới, hay quên', ms: 0.6, known: 0, acc: 0.9, off: 1 },
  { name: 'mất gốc (biết 40% từ)', ms: 1, known: 0.4, acc: 0.9, off: 1 },
  { name: 'mới, nghỉ 2 ngày/tuần', ms: 1, known: 0, acc: 0.9, off: 2 },
];
const STR: Strat[] = ['A ôn trước', 'B học trước', 'C ôn thưa', 'D không ôn', 'E ôn thưa + chọn unit'];
// Thêm cột: số ngày tới 📘 Học 80% của B (phần còn lại là giai đoạn ôn dồn).
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === 'cost') {
  // Rút gọn bài học: số câu / từ mới (5,3 = luồng hiện tại) → số ngày của B (người mới, nhớ TB, nghỉ 1 ngày / tuần)
  console.log('câu/từ'.padEnd(10) + ['A1 30p', 'A1 45p', 'A2 30p', 'A2 45p'].map(x => x.padEnd(10)).join(''));
  for (const c of [5.3, 4.4, 3.4]) { PER_WORD = c;
    console.log(String(c).replace('.', ',').padEnd(10) + ([['A1', 60], ['A1', 90], ['A2', 60], ['A2', 90]] as const).map(([l, b]) => String(run(LV[l], b, 'B học trước', WHO[0]!).days).padEnd(10)).join('')); }
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Số ngày tới mở Thi chuyển cấp (nhớ TB mọi từ của cấp lúc mở). "—" = quá 900 ngày.');
  for (const lv of ['A1', 'A2'] as const) for (const B of [30, 60, 90]) {
    console.log(`\n${lv} · ~${B / 2} phút/ngày`.padEnd(26) + STR.map(s => s.padEnd(22)).join(''));
    for (const w of WHO) console.log(w.name.padEnd(25) + STR.map(s => { const x = run(LV[lv], B, s, w); return (x.days ? `${x.days} (${x.recall.toFixed(2).replace('.', ',')})` : '—').padEnd(22); }).join(''));
  }
}
