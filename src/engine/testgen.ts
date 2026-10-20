// v141 Bài ngẫu nhiên theo tiêu chí ra bài (người sáng lập 16/10/2026): Thi chuyển cấp và Thử sức không dùng bộ soạn sẵn nữa.
// Mỗi lần làm, máy sinh một bài mới theo BẢNG TIÊU CHÍ của cấp (BLUEPRINT: kỹ năng × dạng câu × số câu), từ ba nguồn:
//   1. khuôn (testbank.ts): biển báo / tin nhắn, email ngắn, hội thoại; điền ngẫu nhiên tên, ngày, giờ, giá, nơi…; đáp án máy tự tính;
//   2. câu theo nút của đích (host.probe): Từ vựng / Ngữ pháp / Phát âm, bỏ câu đã gặp (ev.seen);
//   3. nhóm có sẵn chưa dùng (bộ cổng cũ nhập vào ngân hàng): giọng thu sẵn, bỏ câu đã ra trong bài trước (gg.used).
// Chống đoán: phương án nhiễu cùng loại và ĐỀU có mặt trong bài / lời thoại (bài học phép thử "không có bài"); vị trí đáp án đúng
// chia đều rồi xáo. Cùng hạt → cùng bài (chữa bài, kiểm tra). Độ khó b theo khuôn × cấp: ước tính, chưa hiệu chỉnh trên người thật.
// Thuần hàm.

import type { Group, Item } from '../exam/content.ts';
import type { GwTask } from './gatews.ts';
import { NAMES, DAYS, TIMES, AM_END, PLACES, THINGS, COLOURS, SHOPS, ITEMS, EVENTS, SUBJECTS, TRANSPORT, FOODS, TOWNS, RELS, ACTS, WSITS, STORIES, SPEAK, SPEAK_U, WSIT_K, STORY_K, SPEAK_K } from './testbank.ts';

import { GEN_LV } from './gate.ts';

export type Lv = 'A1' | 'A2';
export const GEN_GOALS: Record<string, Lv> = GEN_LV;
const BAND: Record<Lv, number> = { A1: 1, A2: 2.75 };   // ngưỡng gate.ts GATE_THR (+0,25): câu "đúng tầm" của cấp

// ---------- Ngẫu nhiên có hạt ----------
export type Rng = () => number;
export function rngOf(seed: number): Rng {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = <T>(r: Rng, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
export function take<T>(r: Rng, xs: readonly T[], n: number): T[] { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a.slice(0, n); }
const num = (r: Rng, lo: number, hi: number, k: number): number[] => { const s = new Set<number>(); while (s.size < k) s.add(lo + Math.floor(r() * (hi - lo + 1))); return [...s]; };
// Ba giờ tăng dần trong một khoảng của TIMES (giờ hẹn mới phải sau giờ bận, giờ đóng cửa sau giờ mở…).
const tup = (r: Rng, lo?: number, hi?: number): [string, string, string] => { const am = r() < 0.5, a = lo ?? (am ? 0 : AM_END + 1), b = hi ?? (am ? AM_END : TIMES.length - 1); const ix = num(r, a, b, 3).sort((x, y) => x - y); return ix.map(i => TIMES[i]!) as [string, string, string]; };
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// v175 (góp ý #9): mạo từ theo âm đầu, there is / are theo số của danh từ. Khuôn chỉ có từ thường (không có "hour", "uniform"…).
export const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const plural = (w: string) => /s$/.test(w);
export const noneOf = (w: string) => (plural(w) ? `There aren't any ${w}` : `There's no ${w}`);

// ---------- Câu trắc nghiệm 3 phương án, vị trí đúng theo hàng đợi cân bằng ----------
export function slotsOf(r: Rng, k = 3): { next(): number } { let q: number[] = []; return { next() { if (!q.length) q = take(r, Array.from({ length: k }, (_, i) => i), k); return q.pop()!; } }; }
const KEYS = ['A', 'B', 'C', 'D'];
function mcq(id: string, q: string, ans: string, ds: string[], b: number, ev: { p: number; s: string }, why: string, slot: number, tag: string): Item {
  const opts = [...ds]; opts.splice(slot, 0, ans);
  return { id, q, opts: opts.map((t, i) => ({ k: KEYS[i]!, t })), ans: KEYS[slot]!, b, ev, why, tag };
}

// ---------- Khuôn Đọc phần 1: biển báo / tin nhắn (mỗi khuôn 1 đoạn + 1 câu) ----------
interface Fact { text: string; q: string; ans: string; ds: [string, string]; why: string; tag: string }
type Fam = (r: Rng, lv: Lv) => Fact;
// Không để quan hệ to / nhỏ, sớm / muộn tự lộ đáp án (phép thử "không có bài"): khuôn giá hỏi ba món ngang hàng; khuôn hẹn giờ có ba biến thể.
const notices: Fam[] = [
  r => { const sh = take(r, SHOPS, 3), ts = take(r, TIMES.slice(AM_END + 4), 3), k = Math.floor(r() * 3); return { text: `Closing times today: ${sh.map((x, i) => `${x} ${ts[i]}`).join(', ')}.`, q: `What time does ${sh[k]} close today?`, ans: ts[k]!, ds: ts.filter((_, i) => i !== k) as [string, string], why: `"${sh[k]} ${ts[k]}".`, tag: 'giờ' }; },
  r => { const shop = pick(r, SHOPS), its = take(r, ITEMS, 3), ps = num(r, 3, 30, 3), k = Math.floor(r() * 3); return { text: `${shop} today: ${its.map((x, i) => `${x} ${ps[i]} dollars`).join(', ')}.`, q: `How much is the ${its[k]} today?`, ans: `${ps[k]} dollars`, ds: ps.filter((_, i) => i !== k).map(p => `${p} dollars`) as [string, string], why: `"${its[k]} ${ps[k]} dollars".`, tag: 'giá' }; },
  r => { const [n1, n2] = take(r, NAMES, 2), ev = pick(r, EVENTS), [a, b, c] = take(r, PLACES, 3) as [string, string, string]; const k = r() < 0.5; return { text: `Hi ${n1}, the ${ev} isn't at ${a} now. It's at ${b}. Let's meet at ${c} first. ${n2}`, q: k ? `Where is the ${ev} now?` : `Where will ${n1} and ${n2} meet first?`, ans: k ? b : c, ds: k ? [a, c] : [a, b], why: k ? `"It's at ${b}" (không còn ở ${a}).` : `"Let's meet at ${c} first".`, tag: 'nơi' }; },
  r => { const tw = pick(r, TOWNS), day = pick(r, DAYS.slice(5)), [t1, t2, t3] = tup(r); return { text: `Buses to ${tw}: ${t1}, ${t2} and ${t3}. The ${t2} bus does not run on ${day}s.`, q: `Which bus can you NOT take on a ${day}?`, ans: `the ${t2} bus`, ds: [`the ${t1} bus`, `the ${t3} bus`], why: `"The ${t2} bus does not run on ${day}s".`, tag: 'giờ' }; },
  r => { const s = pick(r, SUBJECTS), [r1, r2, r3] = num(r, 2, 19, 3).map(String) as [string, string, string]; const k = r() < 0.5; return { text: `${s} class is in Room ${r1} today because Room ${r2} is closed. Next week the class goes back to Room ${r2}. Room ${r3} is the teachers' room.`, q: k ? `Where is the ${s} class today?` : `Where is the ${s} class next week?`, ans: `Room ${k ? r1 : r2}`, ds: k ? [`Room ${r2}`, `Room ${r3}`] : [`Room ${r1}`, `Room ${r3}`], why: k ? `"in Room ${r1} today".` : `"Next week the class goes back to Room ${r2}".`, tag: 'nơi' }; },
  r => { const n = pick(r, NAMES), th = pick(r, THINGS), [c1, c2, c3] = take(r, COLOURS, 3) as [string, string, string]; return { text: `FOUND at reception: ${an(c1)} ${th} and ${an(c3)} ${th}. ${n} lost ${an(th)} too, but ${n}'s ${th} is ${c2}.`, q: `What colour is ${n}'s ${th}?`, ans: c2, ds: [c1, c3], why: `"${n}'s ${th} is ${c2}": hai cái ở quầy là của người khác.`, tag: 'chi tiết' }; },
  r => { const place = pick(r, ['LIBRARY', 'SPORTS CENTRE', 'YOUTH CLUB']), what = take(r, ['books', 'DVDs', 'magazines', 'comics', 'computer games', 'maps', 'tennis rackets', 'board games'], 3), d = num(r, 2, 21, 3).map(n => (n % 7 === 0 ? `${n / 7} week${n > 7 ? 's' : ''}` : `${n} days`)), k = Math.floor(r() * 3); return { text: `${place}: you can borrow ${what[0]} for ${d[0]}, ${what[1]} for ${d[1]} and ${what[2]} for ${d[2]}.`, q: `How long can you keep ${what[k]}?`, ans: d[k]!, ds: d.filter((_, i) => i !== k) as [string, string], why: `"${what[k]} for ${d[k]}".`, tag: 'chi tiết' }; },
];

// ---------- Khuôn Nghe phần 1: hội thoại ngắn, có đổi ý (đáp án là lần chốt cuối) ----------
interface Talk { lines: Array<[string, string]>; q: string; ans: string; ds: [string, string]; why: string; tag: string }
type TFam = (r: Rng, lv: Lv) => Talk;
const talks: TFam[] = [
  r => { const [e, m, l] = tup(r), v = Math.floor(r() * 4);   // đáp án lần lượt là giờ muộn nhất / sớm nhất / ở giữa (nói đầu)
    if (v === 0) return { lines: [['A', `Shall we meet at ${e} tomorrow?`], ['B', `Sorry, I have a lesson until ${m}. Is ${l} OK?`], ['A', `Yes, ${l} is fine.`]], q: 'What time will they meet?', ans: l, ds: [e, m], why: `Chốt cuối: "${l} is fine". ${e} bị từ chối, ${m} là giờ học xong.`, tag: 'giờ' };
    if (v === 1) return { lines: [['A', `Shall we meet at ${l} tomorrow?`], ['B', `Sorry, I start work at ${m}. Can we meet at ${e}?`], ['A', `OK, ${e} then.`]], q: 'What time will they meet?', ans: e, ds: [l, m], why: `Chốt cuối: "${e} then". ${l} bị từ chối, ${m} là giờ B đi làm.`, tag: 'giờ' };
    if (v === 3) return { lines: [['A', `Can we meet at ${m} tomorrow?`], ['B', `Yes, ${m} is good. I finish work at ${e}, and I have dinner at ${l}.`]], q: 'What time will they meet?', ans: m, ds: [e, l], why: `"Yes, ${m} is good". ${e} là giờ tan làm, ${l} là giờ ăn tối.`, tag: 'giờ' };
    return { lines: [['A', `Shall we meet at ${l} tomorrow?`], ['B', `That's too late for me. And I'm busy until ${e}. What about ${m}?`], ['A', `Great, ${m} then.`]], q: 'What time will they meet?', ans: m, ds: [l, e], why: `Chốt cuối: "${m} then". ${l} quá muộn, ${e} là giờ B còn bận.`, tag: 'giờ' }; },
  r => { const its = take(r, ITEMS, 3), ps = num(r, 3, 30, 3), k = Math.floor(r() * 3); return { lines: [['A', `How much is the ${its[0]}?`], ['B', `It's ${ps[0]} dollars. The ${its[1]} is ${ps[1]}, and the ${its[2]} is ${ps[2]}.`], ['A', `OK, I'll take the ${its[k]}.`]], q: `How much will A pay?`, ans: `${ps[k]} dollars`, ds: ps.filter((_, i) => i !== k).map(p => `${p} dollars`) as [string, string], why: `A chọn "${its[k]}", giá ${ps[k]} dollars.`, tag: 'giá' }; },
  r => { const ev = pick(r, EVENTS), [a, b, c] = take(r, PLACES, 3) as [string, string, string]; return { lines: [['A', `Is the ${ev} at ${a}?`], ['B', `No, they moved it to ${b}.`], ['A', `OK. Shall we meet at ${c} before?`], ['B', 'Good idea.']], q: `Where is the ${ev}?`, ans: b, ds: [a, c], why: `"they moved it to ${b}". ${c} là chỗ hẹn trước.`, tag: 'nơi' }; },
  r => { const ev = pick(r, EVENTS), [d1, d2, d3] = take(r, DAYS, 3) as [string, string, string]; return { lines: [['A', `Is your ${ev} on ${d1}?`], ['B', `It was, but now it's on ${d2}.`], ['A', `Oh, I'm busy on ${d3}, but ${d2} is fine. I'll come.`]], q: `When is the ${ev}?`, ans: d2, ds: [d1, d3], why: `"now it's on ${d2}". ${d1} là ngày cũ, ${d3} là ngày A bận.`, tag: 'ngày' }; },
  r => { const a = pick(r, ['bus', 'train']), [b, c] = take(r, TRANSPORT.filter(t => t !== a), 2) as [string, string]; return { lines: [['A', `Did you come by ${a} today?`], ['B', `No, the ${a} was late, so I came by ${b}.`], ['A', 'And tomorrow?'], ['B', `Tomorrow I'll go by ${c}.`]], q: 'How did B come today?', ans: `by ${b}`, ds: [`by ${a}`, `by ${c}`], why: `"so I came by ${b}". ${a} bị trễ, ${c} là ngày mai.`, tag: 'cách đi' }; },
  r => { const [a, b, c] = take(r, FOODS, 3) as [string, string, string];
    if (r() < 0.5) return { lines: [['A', `Do you want ${a} for dinner?`], ['B', `No, I had ${a} for lunch. Can we have ${b}?`], ['A', `${noneOf(b)} at home. What about ${c}?`], ['B', `OK, ${c} then.`]], q: 'What will they have for dinner?', ans: c, ds: [a, b], why: `Chốt: "${c} then". Không có ${b}; ${a} đã ăn trưa.`, tag: 'món' };
    // v175 (góp ý #10): đáp án nói đầu tiên, câu cuối là phương án nhiễu (không chọn được bằng mẹo "nói sau cùng")
    return { lines: [['A', `Shall we have ${a} for dinner?`], ['B', `Yes, good idea. I had ${b} for lunch, so not ${b}.`], ['A', `OK. And tomorrow we can have ${c}.`]], q: 'What will they have for dinner?', ans: a, ds: [b, c], why: `"Shall we have ${a}" → "Yes". ${b} là bữa trưa; ${c} là ngày mai.`, tag: 'món' }; },
];

// ---------- Đọc phần 2 / Nghe phần 2: một câu chuyện, 3–4 câu hỏi (mỗi câu có đủ 3 giá trị trong bài) ----------
interface Tale { paras: string[]; qs: Fact[]; script: Array<[string, string]> }
// v175 (góp ý #10): bốn khung (chuyến đi, sinh nhật, lớp mới, đi mua sắm), câu chữ đổi theo biến thể: đáp án không nằm cố định sau
// một cụm ("so we went by…", số đầu tiên…). Câu hỏi đầu của mỗi khung là câu A1 bỏ đi (A1 3 câu, A2 4 câu).
type TaleFam = (r: Rng) => Tale;
const trip: TaleFam = r => {
  const me = pick(r, NAMES), fr = pick(r, NAMES.filter(n => n !== me)), tw = pick(r, TOWNS), day = pick(r, DAYS);
  const [ra, rb, rc] = take(r, RELS, 3) as [string, string, string], t1 = pick(r, ['bus', 'train']), [t2, t3] = take(r, TRANSPORT.filter(t => t !== t1), 2) as [string, string];   // chỉ xe buýt / tàu mới "đầy"
  const [p1, p2, p3] = num(r, 5, 40, 3).map(String) as [string, string, string], [a1, a2, a3] = take(r, ACTS, 3) as [string, string, string], v = r() < 0.5;
  const paras = [
    `Hi ${fr}, last ${day} I went to ${tw} with my ${ra}. My ${rb} wanted to come too, but was ill, so I sent some photos to my ${rb} and my ${rc}.`,
    v ? `We wanted to take the ${t1}, but it was full, so we went by ${t2}. We came home by ${t3}.` : `We came home by ${t3}. Going there was different: the ${t1} was full, and we went by ${t2}.`,
    v ? `The museum tickets were ${p2} dollars. Last year they were ${p1} dollars, and next year they will be ${p3}.` : `Last year the museum tickets were ${p1} dollars. This year they were ${p2}, and next year they will be ${p3}.`,
    v ? `Next month I want to ${a1}. My ${ra} wants to ${a2}, but I don't want to ${a3}. Write soon! ${me}` : `My ${ra} wants to ${a2} next month. I don't want to ${a3}. I want to ${a1}! Write soon! ${me}`,
  ];
  const qs: Fact[] = [
    { text: '', q: `Who went to ${tw} with ${me}?`, ans: `${me}'s ${ra}`, ds: [`${me}'s ${rb}`, `${me}'s ${rc}`], why: `"I went to ${tw} with my ${ra}". ${rb} bị ốm; ${rc} chỉ nhận ảnh.`, tag: 'người' },
    { text: '', q: `How did they travel to ${tw}?`, ans: `by ${t2}`, ds: [`by ${t1}`, `by ${t3}`], why: `Đi bằng ${t2}. ${t1} đã đầy; ${t3} là lúc về.`, tag: 'cách đi' },
    { text: '', q: 'How much were the museum tickets?', ans: `${p2} dollars`, ds: [`${p1} dollars`, `${p3} dollars`], why: `Năm nay vé ${p2} dollars. ${p1} là năm ngoái, ${p3} là năm sau.`, tag: 'giá' },
    { text: '', q: `What does ${me} want to do next month?`, ans: a1, ds: [a2, a3], why: `"I want to ${a1}". ${a2} là của người khác; ${a3} là việc không muốn.`, tag: 'ý định' },
  ];
  const script: Array<[string, string]> = [
    ['A', `Hi ${me}! Where did you go last ${day}?`], ['B', `I went to ${tw} with my ${ra}. My ${rb} was ill, so I sent photos to my ${rb} and my ${rc}.`],
    ['A', `Did you take the ${t1}?`], ['B', v ? `We wanted to, but it was full, so we went by ${t2}. We came home by ${t3}.` : `No, it was full. We went by ${t2}, and we came home by ${t3}.`],
    ['A', 'Were the museum tickets expensive?'], ['B', v ? `They were ${p2} dollars. Last year they were ${p1}, and next year they will be ${p3}.` : `Last year they were ${p1} dollars. This year they were ${p2}, and next year they will be ${p3}.`],
    ['A', 'What are your plans for next month?'], ['B', v ? `I want to ${a1}. My ${ra} wants to ${a2}, but I don't want to ${a3}.` : `My ${ra} wants to ${a2}, and I don't want to ${a3}. I want to ${a1}.`],
  ];
  return { paras, qs, script };
};
const party: TaleFam = r => {
  const me = pick(r, NAMES), fr = pick(r, NAMES.filter(n => n !== me)), [d1, d2, d3] = take(r, DAYS, 3) as [string, string, string], [t1, t2, t3] = tup(r, AM_END + 1, TIMES.length - 1);
  const [ra, rb, rc] = take(r, RELS, 3) as [string, string, string], [f1, f2, f3] = take(r, FOODS, 3) as [string, string, string], pl = pick(r, PLACES), v = r() < 0.5;
  const paras = [
    v ? `Hi ${fr}, my birthday party is on ${d2}. I wanted it on ${d1}, but my ${ra} can't come on ${d1}. ${d3} is my ${rb}'s birthday, not mine!` : `Hi ${fr}, ${d3} is my ${rb}'s birthday, and my ${ra} can't come on ${d1}. So my birthday party is on ${d2}!`,
    v ? `The party starts at ${t2}. Please don't come at ${t1}: we are at ${pl} then. We finish at ${t3}.` : `We are at ${pl} at ${t1}, so please come at ${t2}. The party finishes at ${t3}.`,
    `We are having ${f1} and ${f2}. ${noneOf(f3)}, sorry: my ${ra} doesn't like ${plural(f3) ? 'them' : 'it'}.`,
    `My ${rc} is bringing music. Can you bring some games? Love, ${me}`,
  ];
  const qs: Fact[] = [
    { text: '', q: `Who is bringing music?`, ans: `${me}'s ${rc}`, ds: [`${me}'s ${ra}`, `${me}'s ${rb}`], why: `"My ${rc} is bringing music".`, tag: 'người' },
    { text: '', q: `When is ${me}'s party?`, ans: d2, ds: [d1, d3], why: `Tiệc vào ${d2}. ${d1}: có người không đến được; ${d3}: sinh nhật người khác.`, tag: 'ngày' },
    { text: '', q: 'What time does the party start?', ans: t2, ds: [t1, t3], why: `Tiệc bắt đầu ${t2}. ${t1} còn ở ${pl}; ${t3} là giờ kết thúc.`, tag: 'giờ' },
    { text: '', q: 'What food is NOT at the party?', ans: f3, ds: [f1, f2], why: `"${noneOf(f3)}". ${f1} và ${f2} thì có.`, tag: 'món' },
  ];
  const script: Array<[string, string]> = [
    ['A', `Hi ${me}! When is your birthday party?`], ['B', v ? `It's on ${d2}. My ${ra} can't come on ${d1}, and ${d3} is my ${rb}'s birthday.` : `Not ${d1}: my ${ra} can't come then. And ${d3} is my ${rb}'s birthday. So it's on ${d2}.`],
    ['A', 'What time?'], ['B', v ? `It starts at ${t2} and finishes at ${t3}. We are at ${pl} at ${t1}.` : `We are at ${pl} at ${t1}, so come at ${t2}. It finishes at ${t3}.`],
    ['A', 'What are you having?'], ['B', `${cap(f1)} and ${f2}. ${noneOf(f3)}: my ${ra} doesn't like ${plural(f3) ? 'them' : 'it'}.`],
    ['A', 'Can I bring something?'], ['B', `Some games, please. My ${rc} is bringing music.`],
  ];
  return { paras, qs, script };
};
const klass: TaleFam = r => {
  const me = pick(r, NAMES), fr = pick(r, NAMES.filter(n => n !== me)), sb = pick(r, SUBJECTS), d = pick(r, DAYS), [pl1, pl2, pl3] = take(r, PLACES, 3) as [string, string, string];
  const [p1, p2, p3] = num(r, 5, 40, 3).map(String) as [string, string, string], t1 = pick(r, TRANSPORT), [t2, t3] = take(r, TRANSPORT.filter(t => t !== t1), 2) as [string, string];
  const [ra, rb] = take(r, RELS, 2) as [string, string], [a1, a2, a3] = take(r, ACTS, 3) as [string, string, string], v = r() < 0.5;
  const paras = [
    v ? `Hi ${fr}, I'm in a new ${sb} class now. It's on ${d}s at ${pl2}, not at ${pl1}. After class we go to ${pl3}.` : `Hi ${fr}, I go to ${pl3} after my new ${sb} class. The class is at ${pl2} on ${d}s. The old class was at ${pl1}.`,
    v ? `The class is ${p2} dollars a month. The old class was ${p1} dollars, and the online class is ${p3}.` : `The online class is ${p3} dollars a month and the old class was ${p1}. My new class is ${p2} dollars.`,
    `My ${ra} goes there by ${t1} and my ${rb} goes by ${t3}. I go by ${t2}.`,
    v ? `Next week the class is going to ${a1}. I wanted to ${a2}, but the teacher says we can ${a3} next month. ${me}` : `The teacher says we can ${a3} next month. I wanted to ${a2}, but next week we are going to ${a1}. ${me}`,
  ];
  const qs: Fact[] = [
    { text: '', q: `Where is the new ${sb} class?`, ans: pl2, ds: [pl1, pl3], why: `Lớp mới ở ${pl2}. ${pl1} là lớp cũ; ${pl3} là chỗ đi sau giờ học.`, tag: 'nơi' },
    { text: '', q: 'How much is the new class?', ans: `${p2} dollars`, ds: [`${p1} dollars`, `${p3} dollars`], why: `Lớp mới ${p2} dollars. ${p1}: lớp cũ; ${p3}: lớp trực tuyến.`, tag: 'giá' },
    { text: '', q: `How does ${me} go to the class?`, ans: `by ${t2}`, ds: [`by ${t1}`, `by ${t3}`], why: `"I go by ${t2}". ${t1}, ${t3} là của người khác.`, tag: 'cách đi' },
    { text: '', q: 'What is the class going to do next week?', ans: a1, ds: [a2, a3], why: `Tuần sau: ${a1}. ${a2} là điều ${me} muốn; ${a3} là tháng sau.`, tag: 'ý định' },
  ];
  const script: Array<[string, string]> = [
    ['A', `Hi ${me}! Where is your new ${sb} class?`], ['B', v ? `It's at ${pl2} on ${d}s. The old class was at ${pl1}. After class we go to ${pl3}.` : `The old class was at ${pl1}. The new class is at ${pl2}, and after class we go to ${pl3}.`],
    ['A', 'Is it expensive?'], ['B', v ? `It's ${p2} dollars a month. The old class was ${p1}, and the online class is ${p3}.` : `The online class is ${p3} dollars and the old class was ${p1}. This class is ${p2}.`],
    ['A', 'How do you get there?'], ['B', `My ${ra} goes by ${t1} and my ${rb} goes by ${t3}. I go by ${t2}.`],
    ['A', 'What are you doing next week?'], ['B', v ? `We're going to ${a1}. I wanted to ${a2}, and we can ${a3} next month.` : `We can ${a3} next month. I wanted to ${a2}, but next week we're going to ${a1}.`],
  ];
  return { paras, qs, script };
};
const shop: TaleFam = r => {
  const me = pick(r, NAMES), fr = pick(r, NAMES.filter(n => n !== me)), day = pick(r, DAYS), th = pick(r, THINGS), [c1, c2, c3] = take(r, COLOURS, 3) as [string, string, string];
  const [p1, p2, p3] = num(r, 5, 40, 3).map(String) as [string, string, string], [pl1, pl2, pl3] = take(r, PLACES, 3) as [string, string, string], [ra, rb, rc] = take(r, RELS, 3) as [string, string, string], v = r() < 0.5;
  const paras = [
    `Hi ${fr}, last ${day} I went shopping with my ${rb}. I bought ${an(c2)} ${th} for my ${ra}. The ${c1} one was too small and the ${c3} one was too big.`,
    v ? `It was ${p2} dollars. In other shops it is ${p1} or ${p3} dollars.` : `In other shops it is ${p1} or ${p3} dollars, but I paid ${p2}.`,
    v ? `Then we wanted to go to ${pl1}, but it was closed. ${cap(pl3)} was open, so we went there. We didn't go to ${pl2}.` : `Then we went to ${pl3}. We didn't go to ${pl2}, and ${pl1} was closed.`,
    `Next ${day} my ${rc} is coming with us. ${me}`,
  ];
  const qs: Fact[] = [
    { text: '', q: `Who is coming shopping next ${day}?`, ans: `${me}'s ${rc}`, ds: [`${me}'s ${ra}`, `${me}'s ${rb}`], why: `"Next ${day} my ${rc} is coming with us".`, tag: 'người' },
    { text: '', q: `What colour is the ${th} that ${me} bought?`, ans: c2, ds: [c1, c3], why: `"I bought ${an(c2)} ${th}". Cái ${c1} quá nhỏ, cái ${c3} quá to.`, tag: 'chi tiết' },
    { text: '', q: `How much was the ${th}?`, ans: `${p2} dollars`, ds: [`${p1} dollars`, `${p3} dollars`], why: `Trả ${p2} dollars; ${p1}, ${p3} là giá ở cửa hàng khác.`, tag: 'giá' },
    { text: '', q: 'Where did they go after the shop?', ans: pl3, ds: [pl1, pl2], why: `Họ đến ${pl3}. ${pl1} đóng cửa; ${pl2} không đến.`, tag: 'nơi' },
  ];
  const script: Array<[string, string]> = [
    ['A', `Hi ${me}! What did you do last ${day}?`], ['B', `I went shopping with my ${rb}. I bought ${an(c2)} ${th} for my ${ra}. The ${c1} one was too small and the ${c3} one was too big.`],
    ['A', 'Was it expensive?'], ['B', v ? `It was ${p2} dollars. Other shops have it for ${p1} or ${p3}.` : `Other shops have it for ${p1} or ${p3} dollars. I paid ${p2}.`],
    ['A', 'Where did you go after that?'], ['B', v ? `${cap(pl1)} was closed, so we went to ${pl3}. We didn't go to ${pl2}.` : `We went to ${pl3}. ${cap(pl1)} was closed and we didn't go to ${pl2}.`],
    ['A', 'Are you going again?'], ['B', `Yes, next ${day}. My ${rc} is coming with us.`],
  ];
  return { paras, qs, script };
};
const TALES: TaleFam[] = [trip, party, klass, shop];
function tale(r: Rng, lv: Lv): Tale {
  const t = pick(r, TALES)(r);
  return { ...t, qs: lv === 'A1' ? t.qs.slice(1) : t.qs };
}

// ---------- Câu theo nút (Từ vựng / Ngữ pháp / Phát âm) ----------
export interface NodeQ { id: string; level: number; g: number; prompt: string; opts?: string[]; ans?: number; say?: string }
export interface NodePool { node: string; area: string; cefr: string; items: NodeQ[] }

// ---------- Bảng tiêu chí ra bài ----------
export type Part = 'r1' | 'r2' | 'vg' | 'l1' | 'l2' | 'pro' | 'w' | 's';
export const BLUEPRINT: Record<Lv, Record<Part, number>> = {
  A1: { r1: 4, r2: 3, vg: 6, l1: 4, l2: 3, pro: 0, w: 2, s: 1 },
  A2: { r1: 5, r2: 4, vg: 8, l1: 5, l2: 4, pro: 0, w: 2, s: 1 },
};
// Thử sức một kỹ năng: phần nào, bao nhiêu câu (ngắn).
export const TRY_PARTS: Record<string, Partial<Record<Part, number>>> = {
  voc: { vg: 8 }, gra: { vg: 8 }, pro: { pro: 6 }, rd: { r1: 3, r2: 4 }, lis: { l1: 4, l2: 3 }, spk: { s: 1 }, wr: { w: 1 },
};

export interface GenIn {
  goal: string; seed: number;
  bank: Group[];                       // nhóm có sẵn của cấp (bộ cổng cũ), có thể rỗng
  used: ReadonlySet<string>;           // mã câu có sẵn đã ra ở bài trước
  pools: NodePool[];                   // câu theo nút của đích
  seen: (node: string, id: string) => boolean;
  parts?: Partial<Record<Part, number>>;   // mặc định: BLUEPRINT của cấp (Thi chuyển cấp)
  areas?: string[];                    // Thử sức: chỉ lấy câu nút thuộc các kỹ năng này (voc / gra / pro)
}
export interface GenOut { id: string; goal: string; seed: number; groups: Group[]; ws: GwTask[]; bankIds: string[] }

const G = (lv: Lv, id: string, kind: Group['kind'], qtype: string, title: string, instr: string, items: Item[], extra: Partial<Group>): Group =>
  ({ id, kind, exams: [], qtype, level: lv, band: BAND[lv], mode: 'gate', title, instr, items, ...extra });

export function genForm(x: GenIn): GenOut {
  const lv = GEN_GOALS[x.goal] ?? 'A2', r = rngOf(x.seed), slot = slotsOf(r), parts = x.parts ?? BLUEPRINT[lv], b0 = BAND[lv];
  const id = `${lv.toLowerCase()}-g${x.seed % 1e6}`, groups: Group[] = [], bankIds: string[] = [];
  const jb = () => Math.round((b0 + (r() - 0.5) * 0.6) * 100) / 100;   // độ khó quanh mức của cấp
  // Đọc 1: biển báo / tin nhắn
  if (parts.r1) {
    const fams = take(r, notices, Math.min(parts.r1, notices.length)), paras: string[] = [], items: Item[] = [];
    fams.forEach((f, i) => { const v = f(r, lv); paras.push(`${i + 1}. ${v.text}`); items.push(mcq(`${id}-r1-${i}`, `${i + 1}. ${v.q}`, v.ans, v.ds, jb(), { p: i, s: v.text }, v.why, slot.next(), v.tag)); });
    groups.push(G(lv, `${id}-r1`, 'reading', 'pl-r', 'Notices and messages', 'Read the notices and messages. Choose the correct answer.', items, { paras }));
  }
  // Đọc 2: nhóm có sẵn chưa dùng, hết thì khuôn
  if (parts.r2) {
    const old = x.bank.find(g => g.kind === 'reading' && g.items.length >= 3 && g.items.every(it => !x.used.has(it.id)));
    if (old && !x.parts) { groups.push(old); bankIds.push(...old.items.map(it => it.id)); }
    else { const t = tale(r, lv), qs = t.qs.slice(0, parts.r2); groups.push(G(lv, `${id}-r2`, 'reading', 'pl-r', 'An email', 'Read the email and answer the questions.', qs.map((f, i) => mcq(`${id}-r2-${i}`, f.q, f.ans, f.ds, jb(), { p: 0, s: t.paras[0]! }, f.why, slot.next(), f.tag)), { paras: t.paras })); }
  }
  // Từ vựng + Ngữ pháp (+ Phát âm khi Thử sức): câu theo nút, chưa gặp, rải đều các nút
  const nodeItems = (n: number, areas: string[]): Item[] => {
    const ps = take(r, x.pools.filter(p => areas.includes(p.area)), x.pools.length), out: Item[] = [];
    for (const p of ps) {
      if (out.length >= n) break;
      const q = take(r, p.items.filter(i => i.opts && i.opts.length >= 2 && i.ans !== undefined && !x.seen(p.node, i.id)), 1)[0];
      if (!q) continue;
      const k = KEYS.slice(0, q.opts!.length);
      out.push({ id: `${id}-n-${out.length}`, q: q.prompt, opts: q.opts!.map((t, i) => ({ k: k[i]!, t })), ans: k[q.ans!]!, b: Math.round((b0 + (q.level - 2) * 0.4) * 100) / 100, ev: { p: 0, s: p.node }, why: `Phần: ${p.node}`, tag: p.area });
    }
    return out;
  };
  if (parts.vg) { const it = nodeItems(parts.vg, x.areas ?? ['voc', 'gra']); if (it.length) groups.push(G(lv, `${id}-vg`, 'reading', 'pl-r', 'Words and grammar', 'Choose the correct answer.', it, {})); }
  if (parts.pro) { const it = nodeItems(parts.pro, ['pro']); if (it.length) groups.push(G(lv, `${id}-pro`, 'reading', 'pl-r', 'Sounds', 'Choose the correct answer.', it, {})); }
  // Nghe 1: hội thoại ngắn sinh từ khuôn, phát bằng máy đọc
  if (parts.l1) {
    const fams = take(r, talks, Math.min(parts.l1, talks.length)), script: Group['script'] = [], items: Item[] = [];
    fams.forEach((f, i) => { const v = f(r, lv); script!.push({ sp: 'N', t: `Number ${i + 1}.` }); v.lines.forEach(([sp, t]) => script!.push({ sp, t })); items.push(mcq(`${id}-l1-${i}`, `${i + 1}. ${v.q}`, v.ans, v.ds, jb(), { p: i, s: v.lines.at(-1)![1] }, v.why, slot.next(), v.tag)); });
    groups.push(G(lv, `${id}-l1`, 'listening', 'pl-l', 'Short conversations', 'Listen to the short conversations and choose the correct answer.', items, { script }));
  }
  // Nghe 2: nhóm có sẵn chưa dùng (giọng thu), hết thì khuôn
  if (parts.l2) {
    const old = x.bank.find(g => g.kind === 'listening' && g.items.length >= 3 && g.items.every(it => !x.used.has(it.id)));
    if (old && !x.parts) { groups.push(old); bankIds.push(...old.items.map(it => it.id)); }
    else { const t = tale(r, lv), qs = t.qs.slice(0, parts.l2); groups.push(G(lv, `${id}-l2`, 'listening', 'pl-l', 'A conversation', 'Listen to the conversation and answer the questions.', qs.map((f, i) => mcq(`${id}-l2-${i}`, f.q, f.ans, f.ds, jb(), { p: 0, s: t.script[1]![1] }, f.why, slot.next(), f.tag)), { script: t.script.map(([sp, t2]) => ({ sp, t: t2 })) })); }
  }
  // Viết + Nói
  const ws: GwTask[] = [];
  const minW = lv === 'A1' ? 20 : 25, minS = lv === 'A1' ? 25 : 35;
  if (parts.w) {
    const s = pick(r, WSITS), n = pick(r, NAMES), [xe, xv] = pick(r, s.x), f = (t: string) => t.replace(/\{N\}/g, n).replace(/\{X\}/g, xe).replace(/\{XV\}/g, xv);
    ws.push({ id: `${id}-w1`, kind: 'w', lv, en: s.en, vi: s.vi, p: f(s.p) + ` Write ${minW} words or more.`, pv: f(s.pv), c: s.c, k: WSIT_K[s.en] ?? [], u: s.u, min: minW, max: minW + 45, par: 1, reg: 'i' });
    if (parts.w > 1) {
      const st = pick(r, STORIES), n2 = pick(r, NAMES), g = (t: string) => t.replace(/\{N\}/g, n2);
      ws.push({ id: `${id}-w2`, kind: 'w', lv, en: st.en, vi: st.vi, p: `Write the story from these three scenes. Scene 1: ${g(st.s[0])} Scene 2: ${g(st.s[1])} Scene 3: ${g(st.s[2])} Write ${minS} words or more.`,
        pv: `Kể lại câu chuyện theo ba cảnh (≥ ${minS} từ): ${st.v.map(g).join('; ')}.`, c: ['Cảnh 1', 'Cảnh 2', 'Cảnh 3', 'Dùng thì quá khứ'], k: [...(STORY_K[st.en] ?? [[], [], []]), [['@past']]], u: [['One day', 'Một hôm'], ['Then', 'Sau đó'], ['suddenly', 'bỗng nhiên'], ['In the end', 'Cuối cùng']], min: minS, max: minS + 55, par: 1, reg: 'i' });
    }
  }
  if (parts.s) {
    const qs = (['now', 'past', 'future', 'opinion'] as const).map(k => pick(r, SPEAK[k]));
    ws.push({ id: `${id}-s1`, kind: 's', lv, en: 'About You', vi: 'Về bạn', p: `Answer these questions. ${qs.map(q => q[0]).join(' ')}`, pv: `Trả lời: ${qs.map(q => q[1].toLowerCase()).join('; ')}.`, c: qs.map(q => q[1]), k: qs.map(q => SPEAK_K[q[0]] ?? []), u: SPEAK_U, min: lv === 'A1' ? 20 : 30, max: 200, par: 1, reg: 'i' });
  }
  return { id, goal: x.goal, seed: x.seed, groups, ws, bankIds };
}
