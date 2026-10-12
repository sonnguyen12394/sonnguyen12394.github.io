// v128 Túi chữ · Xưởng của Tí · Chỉ số (GAME-CRITERIA §15): kho đồ, thu thập, chế tạo, nâng chỉ số; đều là tiếng Anh.
// Bảy luật nền (§15.1):
//   1. Đồ là đơn vị ngôn ngữ: viên chữ, ngọc từ, từ ghép, cụm từ, câu ("Lời").
//   2. Chế tạo là hành động ngôn ngữ: chọn đúng tiền tố / hậu tố rồi TỰ GÕ từ, chọn đúng động từ của cụm, xếp câu rồi nói / gõ lại không nhìn.
//   3. Chỉ số nhân vật là năng lực THẬT (kỹ năng vững trên bản đồ năng lực, số đo H đã đủ số liệu): không mua, không đeo đồ mà tăng.
//   4. Đồ trang bị chỉ đổi độ khó / xu của game (P14), không đổi cách chấm; chỉ phát huy khi chỉ số thật đủ (quên thì phải ôn lại).
//   5. Nguyên liệu SUY RA từ việc học đã có (từ tìm được, lượt tự nói / tự gõ, lần nhớ lại sau nhiều ngày); nguyên liệu quý chỉ có
//      khi nói hoặc nhớ lâu. Độ hiếm của ngọc từ = độ nhớ thật của từ (số ngày khác nhau trả lời đúng, khoảng cách).
//   6. Không phạt: làm sai không mất nguyên liệu; từ sắp quên chỉ mờ đi, nhớ lại là sáng.
//   7. Không bán bằng tiền.
// Chế tạo không ghi bằng chứng (không vào mức thuộc, P13); lượt tự nói / tự gõ cả câu ghi nhật ký H như các game nói.
// Thuần hàm (trừ phần sinh đề theo seed).

import type { EvEvent } from './ev/types.ts';

// ---------- Nguyên liệu ----------
export type Mat = 'chu' | 'noi' | 'muc' | 'nho';
export const MAT: Record<Mat, { ico: string; vi: string; how: string }> = {
  chu: { ico: '✨', vi: 'Viên chữ', how: 'Tìm từ ở ⛏️ Mỏ Chữ và 🎡 Vòng Chữ' },
  muc: { ico: '✍️', vi: 'Mực', how: 'Tự gõ cả câu (≥ 3 từ) trong game nói, Thư, Xưởng' },
  noi: { ico: '🗣️', vi: 'Lời nói', how: 'Tự NÓI cả câu (≥ 3 từ) cho máy nghe: Quán, Hỏi chuyện, cảnh truyện, Xưởng' },
  nho: { ico: '🧠', vi: 'Ký ức', how: 'Nhớ lại từ sau ≥ 7 ngày (🌫️ Sương quay lại, ôn đến hạn)' },
};
export const MATS = Object.keys(MAT) as Mat[];
export const STARTER = 10;   // quà của Tí: đủ cho hai lần chế tạo đầu
// Đồ làm ra.
export type Item = 'tu' | 'cum' | 'loi' | 'loiv';
export const ITEM: Record<Item, { ico: string; vi: string; how: string }> = {
  tu: { ico: '🔩', vi: 'Từ ghép', how: 'Ghép từ gốc với tiền tố / hậu tố' },
  cum: { ico: '🔗', vi: 'Cụm từ', how: 'Ghép đúng động từ với danh từ' },
  loi: { ico: '💬', vi: 'Lời', how: 'Đúc câu từ các lá chữ' },
  loiv: { ico: '🌟', vi: 'Lời vàng', how: 'Thổi hồn: nói câu vừa đúc, hoặc gõ lại không nhìn' },
};
export const ITEMS = Object.keys(ITEM) as Item[];
export type Cost = Partial<Record<Mat | Item, number>>;
export const ICO = (k: Mat | Item): string => (k in MAT ? MAT[k as Mat].ico : ITEM[k as Item].ico);

// ---------- Công thức (nội dung) ----------
// Ghép từ: [gốc, phụ tố, kết quả, nghĩa của kết quả, khu mở]. Phụ tố mở dần theo khu truyện (truyện mở linh kiện mới cho Xưởng).
export const AFFIX: Array<[string, number]> = [['-er', 1], ['-y', 1], ['un-', 1], ['-ful', 2], ['-less', 2], ['-ly', 2], ['re-', 3], ['-ness', 3], ['dis-', 3], ['-ment', 4], ['-ship', 4], ['im-', 4]];
export const MORPH: Array<[string, string, string, string]> = [
  ['teach', '-er', 'teacher', 'giáo viên'], ['play', '-er', 'player', 'người chơi'], ['sing', '-er', 'singer', 'ca sĩ'], ['farm', '-er', 'farmer', 'nông dân'],
  ['work', '-er', 'worker', 'công nhân'], ['read', '-er', 'reader', 'người đọc'], ['rain', '-y', 'rainy', 'có mưa'], ['sun', '-y', 'sunny', 'nắng'],
  ['wind', '-y', 'windy', 'có gió'], ['cloud', '-y', 'cloudy', 'nhiều mây'], ['snow', '-y', 'snowy', 'có tuyết'], ['happy', 'un-', 'unhappy', 'không vui'],
  ['kind', 'un-', 'unkind', 'không tử tế'], ['lock', 'un-', 'unlock', 'mở khoá'], ['tidy', 'un-', 'untidy', 'bừa bộn'],
  ['help', '-ful', 'helpful', 'hay giúp đỡ, hữu ích'], ['care', '-ful', 'careful', 'cẩn thận'], ['use', '-ful', 'useful', 'có ích'],
  ['home', '-less', 'homeless', 'vô gia cư'], ['care', '-less', 'careless', 'bất cẩn'], ['slow', '-ly', 'slowly', 'chậm rãi'],
  ['quick', '-ly', 'quickly', 'nhanh chóng'], ['friend', '-ly', 'friendly', 'thân thiện'], ['sad', '-ly', 'sadly', 'buồn bã'],
  ['do', 're-', 'redo', 'làm lại'], ['read', 're-', 'reread', 'đọc lại'], ['write', 're-', 'rewrite', 'viết lại'], ['kind', '-ness', 'kindness', 'lòng tốt'],
  ['dark', '-ness', 'darkness', 'bóng tối'], ['happy', '-ness', 'happiness', 'hạnh phúc'], ['like', 'dis-', 'dislike', 'không thích'], ['agree', 'dis-', 'disagree', 'không đồng ý'],
  ['move', '-ment', 'movement', 'chuyển động'], ['enjoy', '-ment', 'enjoyment', 'niềm vui thích'], ['friend', '-ship', 'friendship', 'tình bạn'],
  ['possible', 'im-', 'impossible', 'không thể'], ['polite', 'im-', 'impolite', 'bất lịch sự'],
];
// Lưu ý chính tả khi ghép (phản hồi sau khi gõ sai).
export const SPELL: Record<string, string> = {
  sunny: 'sun + y: nhân đôi n (sun → sunny).', happiness: 'happy + ness: y đổi thành i (happy → happiness).', untidy: 'un + tidy: giữ nguyên tidy.',
  homeless: 'home + less: giữ e.', careful: 'care + ful: giữ e; hậu tố -ful chỉ có một chữ l.', useful: 'use + ful: giữ e; -ful một chữ l.', helpful: '-ful chỉ có một chữ l.',
};
export const affixesOpen = (act: number): string[] => AFFIX.filter(x => x[1] <= Math.max(1, act)).map(x => x[0]);
// Cụm từ (collocation): [động từ, phần sau, nghĩa, khu mở].
export const COLLOC: Array<[string, string, string, number]> = [
  ['have', 'breakfast', 'ăn sáng', 1], ['have', 'a shower', 'tắm vòi sen', 1], ['go', 'shopping', 'đi mua sắm', 1], ['do', 'homework', 'giải bài tập về nhà', 1],
  ['take', 'a photo', 'chụp ảnh', 1], ['make', 'a cake', 'làm bánh', 1], ['play', 'football', 'chơi bóng đá', 1], ['go', 'home', 'về nhà', 1],
  ['make', 'a mistake', 'mắc lỗi', 2], ['make', 'friends', 'kết bạn', 2], ['do', 'the dishes', 'rửa bát', 2], ['take', 'a bus', 'đi xe buýt', 2],
  ['catch', 'a cold', 'bị cảm lạnh', 2], ['have', 'a rest', 'nghỉ ngơi', 2], ['go', 'swimming', 'đi bơi', 2], ['take', 'a break', 'nghỉ giải lao', 2],
  ['make', 'a decision', 'ra quyết định', 3], ['do', 'exercise', 'tập thể dục', 3], ['keep', 'a secret', 'giữ bí mật', 3], ['pay', 'attention', 'chú ý', 3],
  ['make', 'a noise', 'gây ồn', 3], ['take', 'care of', 'chăm sóc', 3], ['tell', 'the truth', 'nói sự thật', 3], ['say', 'sorry', 'xin lỗi', 3],
  ['make', 'progress', 'tiến bộ', 4], ['do', 'your best', 'cố hết sức', 4], ['keep', 'calm', 'giữ bình tĩnh', 4], ['break', 'a promise', 'thất hứa', 4],
  ['give', 'advice', 'cho lời khuyên', 4], ['take', 'part in', 'tham gia', 4], ['make', 'a wish', 'ước một điều', 4], ['pay', 'a visit', 'ghé thăm', 4],
];
export const VERBS = ['make', 'do', 'take', 'have', 'go', 'play', 'catch', 'keep', 'pay', 'tell', 'say', 'break', 'give'];
// Lỗi kết hợp người Việt hay mắc (giải thích khi chọn sai).
export const COL_WHY: Record<string, string> = {
  'make a mistake': 'Tiếng Anh nói “make a mistake”, không nói “do a mistake”.', 'do homework': '“do” đi với việc phải làm: do homework, do the dishes, do exercise.',
  'take a photo': '“take a photo” (không phải “make a photo” hay “do a photo”).', 'make a decision': '“make a decision” (không phải “do a decision”).',
  'have breakfast': 'Bữa ăn đi với “have”: have breakfast / lunch / dinner.', 'pay attention': '“pay attention” = trả sự chú ý; không dùng “give attention”.',
  'tell the truth': '“tell the truth”, “tell a story”; nhưng “say sorry”, “say hello”.', 'say sorry': '“say sorry / hello / goodbye”; “tell” cần người nghe hoặc câu chuyện.',
  'catch a cold': 'Bệnh lây: “catch a cold”.', 'keep a secret': 'Giữ = “keep”: keep a secret, keep calm, keep a promise.', 'break a promise': 'Thất hứa = “break a promise”.',
};
// Đúc câu: câu của cư dân theo khu (cấp lớn dần: A1 → B1). Lá chữ = các từ của câu.
export const SENT: Array<[string, string, string, number]> = [
  ['Bà Lan', 'Can I have some roses, please?', 'Cho tôi ít hoa hồng nhé?', 1], ['Bà Lan', 'These flowers are very beautiful.', 'Những bông hoa này đẹp quá.', 1],
  ['Chú Tư', 'How much is this bread?', 'Ổ bánh mì này bao nhiêu tiền?', 1], ['Chú Tư', 'I want two eggs and some milk.', 'Tôi muốn hai quả trứng và ít sữa.', 1],
  ['Bé Bin', 'Where is the exit, please?', 'Lối ra ở đâu ạ?', 1], ['Bé Bin', 'My mom is next to the shop.', 'Mẹ cháu ở cạnh cửa hàng.', 1],
  ['Tí', 'Good morning! How are you today?', 'Chào buổi sáng! Hôm nay bạn thế nào?', 1], ['Bà Lan', 'The market opens at six o’clock.', 'Chợ mở cửa lúc sáu giờ.', 1],
  ['Ông Ba', 'We are going fishing this morning.', 'Sáng nay chúng ta đi đánh cá.', 2], ['Ông Ba', 'The sea is very calm today.', 'Hôm nay biển rất lặng.', 2],
  ['Cô Ngân', 'What time does the boat leave?', 'Mấy giờ tàu chạy?', 2], ['Cô Ngân', 'A return ticket costs five dollars.', 'Vé khứ hồi giá năm đô.', 2],
  ['Ông Hải', 'The lighthouse helps ships at night.', 'Hải đăng giúp tàu vào ban đêm.', 2], ['Ông Hải', 'I can see a boat near the rocks.', 'Tôi thấy một chiếc thuyền gần đá ngầm.', 2],
  ['Bé Bin', 'Can you tell me the way?', 'Anh chỉ đường giúp em được không?', 2], ['Tí', 'I have to tell you the truth.', 'Mình phải nói cho bạn sự thật.', 2],
  ['Thầy Minh', 'I have read this book three times.', 'Thầy đã đọc cuốn này ba lần.', 3], ['Thầy Minh', 'Libraries are quiet places for reading.', 'Thư viện là nơi yên tĩnh để đọc.', 3],
  ['Cô Chi', 'Singing makes me feel happy.', 'Hát làm cô thấy vui.', 3], ['Cô Chi', 'I used to sing every morning.', 'Cô từng hát mỗi sáng.', 3],
  ['Bé Bin', 'I am afraid of making mistakes.', 'Em sợ nói sai.', 3], ['Bé Bin', 'Which way should we go now?', 'Giờ mình nên đi đường nào?', 3],
  ['Tí', 'We should ring the bell softly.', 'Mình nên rung chuông thật khẽ.', 3], ['Mờ', 'Please don’t laugh at me again.', 'Làm ơn đừng cười tớ nữa.', 3],
  ['Chị Hằng', 'If you ask clearly, people will understand.', 'Nếu em hỏi rõ ràng, mọi người sẽ hiểu.', 4], ['Chị Hằng', 'These lanterns were made by hand.', 'Những chiếc đèn lồng này làm bằng tay.', 4],
  ['Anh Khoa', 'Thank you for being so brave.', 'Cảm ơn em đã dũng cảm.', 4], ['Anh Khoa', 'Mistakes help us learn faster.', 'Sai giúp chúng ta học nhanh hơn.', 4],
  ['Bé Bin', 'I went to the market yesterday.', 'Hôm qua em đã đi chợ.', 4], ['Tí', 'I’m sorry that I laughed at you.', 'Tớ xin lỗi vì đã cười cậu.', 4],
  ['Mờ', 'I would like to try again.', 'Tớ muốn thử lại.', 4], ['Mờ', 'Nobody laughed when I made a mistake.', 'Không ai cười khi tớ nói sai.', 4],
];

// ---------- Trang bị (chỉ đổi game, phát huy khi chỉ số thật đủ) ----------
export type StatId = 'voc' | 'gra' | 'pro' | 'spk' | 'lis' | 'mem' | 'use';
export type Perk = 'moves' | 'pat' | 'vcoin' | 'wcoin';
export interface Gear { id: string; ico: string; vi: string; eff: string; cost: Cost; req: Partial<Record<StatId, number>>; perk: [Perk, number]; after?: string; act?: number }
export const GEAR: Gear[] = [
  { id: 'pick1', ico: '⛏️', vi: 'Cuốc Bạc', eff: 'Mỏ Chữ: +2 lượt vuốt mỗi màn', cost: { tu: 3, cum: 2, chu: 10 }, req: { voc: 2 }, perk: ['moves', 2] },
  { id: 'tea', ico: '🫖', vi: 'Ấm Trà Kiên Nhẫn', eff: 'Quán nói: khách kiên nhẫn gấp rưỡi, đáp trong lúc đó vẫn được tip', cost: { loi: 3, cum: 3, noi: 2 }, req: { spk: 2 }, perk: ['pat', 1.5] },
  { id: 'bell', ico: '🔔', vi: 'Chuông Đồng', eff: 'Game nói (Quán, Hỏi chuyện, Bến Cảng, Sương): +25% xu', cost: { loiv: 3, noi: 3, nho: 1 }, req: { pro: 2 }, perk: ['vcoin', 1.25] },
  { id: 'lamp', ico: '🏮', vi: 'Đèn Lồng Phố Đêm', eff: 'Vòng Chữ: +5 xu mỗi màn thắng', cost: { tu: 4, loi: 2, chu: 15 }, req: { gra: 2 }, perk: ['wcoin', 5], act: 4 },
  { id: 'pick2', ico: '💎', vi: 'Cuốc Kim Cương', eff: 'Mỏ Chữ: +4 lượt vuốt (thay Cuốc Bạc)', cost: { tu: 6, loiv: 2, nho: 2, chu: 20 }, req: { voc: 5, mem: 3 }, perk: ['moves', 4], after: 'pick1' },
];

// ---------- Chỉ số thật ----------
export const STAT: Record<StatId, { ico: string; vi: string; src: string; up: string; start: string }> = {
  voc: { ico: '📚', vi: 'Từ vựng', src: 'Số cụm từ vững trên bản đồ năng lực', up: '🌱 Vườn từ', start: 'gdstart' },
  gra: { ico: '🧩', vi: 'Ngữ pháp', src: 'Số điểm ngữ pháp vững', up: '🃏 Bài Câu', start: 'cdstart' },
  pro: { ico: '🔤', vi: 'Phát âm', src: 'Cặp âm vững + Bảng đo H7', up: '⚓ Bến Cảng lệnh giọng', start: 'ptstart' },
  spk: { ico: '🗣️', vi: 'Nói', src: 'Bảng đo H1, H5, H8 (tự nói, phản xạ, hội thoại)', up: '🗣️ Quán Phố Chữ', start: 'tkstart' },
  lis: { ico: '👂', vi: 'Nghe', src: 'Bảng đo H3, H4 (nghe liền mạch, nghe tiếng thật)', up: '📻 Đài Phố Chữ', start: 'rdstart' },
  mem: { ico: '🧠', vi: 'Trí nhớ', src: 'Bảng đo H6 (nhớ sau ≥ 7 / 30 ngày)', up: '🌫️ Sương quay lại', start: 'sgstart' },
  use: { ico: '🌍', vi: 'Dùng thật', src: 'Chức năng giao tiếp vững + Bảng đo H2, H10', up: '🔎 Hỏi chuyện nhân chứng', start: 'akstart' },
};
export const STATS = Object.keys(STAT) as StatId[];
export const LV_AT = [1, 3, 6, 10, 15, 22, 30, 40, 55, 75];   // số kỹ năng vững để lên Lv 1…10
export const lvOf = (n: number): number => LV_AT.filter(t => n >= t).length;
export interface StatIn { pass: Record<string, number>; h: Record<string, { score: number; measured: boolean }> }
export interface StatRow { id: StatId; lv: number; next: string; measured: boolean }
export function statsOf(x: StatIn): StatRow[] {
  const H = (...ids: string[]) => { const m = ids.map(i => x.h[i]).filter((r): r is { score: number; measured: boolean } => !!r?.measured); return m.length ? Math.round(m.reduce((a, r) => a + r.score, 0) / m.length) : null; };
  const cnt = (p: string) => { const n = x.pass[p] ?? 0, lv = lvOf(n), t = LV_AT[lv]; return { lv, next: t === undefined ? 'tối đa' : `còn ${t - n} kỹ năng vững nữa lên Lv ${lv + 1}` }; };
  const hRow = (id: StatId, v: number | null, base?: { lv: number; next: string }): StatRow => {
    const lv = Math.max(base?.lv ?? 0, v ?? 0);
    return { id, lv, measured: v !== null || (base?.lv ?? 0) > 0, next: v === null && !base?.lv ? 'chưa đủ số liệu: chơi thêm để Bảng đo H đo được' : v !== null && v >= (base?.lv ?? 0) ? 'lên theo Bảng đo H của bạn' : base!.next };
  };
  const voc = cnt('u'), gra = cnt('g');
  return [
    { id: 'voc', lv: voc.lv, next: voc.next, measured: true }, { id: 'gra', lv: gra.lv, next: gra.next, measured: true },
    hRow('pro', H('H7'), cnt('ph')), hRow('spk', H('H1', 'H5', 'H8')), hRow('lis', H('H3', 'H4')), hRow('mem', H('H6')), hRow('use', H('H2', 'H10'), cnt('fn')),
  ];
}
export const charLv = (rows: StatRow[]): number => 1 + Math.floor(rows.reduce((a, r) => a + r.lv, 0) / 3);
export const reqOk = (g: Gear, rows: StatRow[]): boolean => (Object.entries(g.req) as Array<[StatId, number]>).every(([k, v]) => (rows.find(r => r.id === k)?.lv ?? 0) >= v);

// ---------- Bản lưu ----------
export interface BagSave { sp: Record<Mat, number>; it: Record<Item, number>; mk: number; words: string[]; gear: string[]; alb: Record<string, number>; day: number }
export const freshBag = (): BagSave => ({ sp: { chu: 0, noi: 0, muc: 0, nho: 0 }, it: { tu: 0, cum: 0, loi: 0, loiv: 0 }, mk: 0, words: [], gear: [], alb: {}, day: 0 });
const nn = (v: unknown, hi = 1e7): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
const ob = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
export function sanitizeBag(raw: unknown): BagSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = ob(raw), sp = ob(x.sp), it = ob(x.it), out = freshBag();
  for (const m of MATS) out.sp[m] = nn(sp[m]);
  for (const i of ITEMS) out.it[i] = nn(it[i], 9999);
  out.mk = nn(x.mk); out.day = nn(x.day, 1e6);
  out.words = (Array.isArray(x.words) ? x.words : []).filter((w): w is string => typeof w === 'string' && /^[a-z]{2,16}$/.test(w)).slice(-40);
  out.gear = [...new Set((Array.isArray(x.gear) ? x.gear : []).filter((g): g is string => typeof g === 'string' && GEAR.some(d => d.id === g)))];
  for (const [k, v] of Object.entries(ob(x.alb))) if (/^u:[a-z0-9._-]{1,60}$/.test(k)) { const t = nn(v, 2); if (t) out.alb[k] = t; }
  return out;
}
export function mergeBag(a?: BagSave, b?: BagSave): BagSave | undefined {
  if (!a) return b; if (!b) return a;
  const o = freshBag();
  for (const m of MATS) o.sp[m] = Math.max(a.sp[m], b.sp[m]);
  for (const i of ITEMS) o.it[i] = Math.max(a.it[i], b.it[i]);
  o.mk = Math.max(a.mk, b.mk); o.day = Math.max(a.day, b.day);
  o.words = [...new Set([...b.words, ...a.words])].slice(-40); o.gear = [...new Set([...a.gear, ...b.gear])];
  for (const k of new Set([...Object.keys(a.alb), ...Object.keys(b.alb)])) o.alb[k] = Math.max(a.alb[k] ?? 0, b.alb[k] ?? 0);
  return o;
}

// ---------- Kho: nguyên liệu suy ra ----------
export interface Earned { chu: number; noi: number; muc: number; nho: number }
export interface EarnIn { words: number; sp: number; ty: number; recall: number }
export const earned = (x: EarnIn): Earned => ({ chu: STARTER + x.words, noi: x.sp, muc: x.ty, nho: x.recall });
export const have = (e: Earned, s: BagSave, k: Mat | Item): number => (k in MAT ? Math.max(0, e[k as Mat] - s.sp[k as Mat]) : s.it[k as Item]);
export const canPay = (e: Earned, s: BagSave, c: Cost): boolean => (Object.entries(c) as Array<[Mat | Item, number]>).every(([k, v]) => have(e, s, k) >= v);
export function pay(e: Earned, s: BagSave, c: Cost): boolean {
  if (!canPay(e, s, c)) return false;
  for (const [k, v] of Object.entries(c) as Array<[Mat | Item, number]>) { if (k in MAT) s.sp[k as Mat] += v; else s.it[k as Item] -= v; }
  return true;
}
export const costVi = (c: Cost): string => (Object.entries(c) as Array<[Mat | Item, number]>).map(([k, v]) => `${v} ${ICO(k)}`).join(' + ');
export const CRAFT_COST: Record<'morph' | 'col' | 'sent', Cost> = { morph: { chu: 2 }, col: { chu: 2 }, sent: { chu: 3 } };

// ---------- Ngọc từ: độ hiếm = độ nhớ thật ----------
export type Tier = 0 | 1 | 2 | 3;
export const TIER = [['⚪', 'Thường', 'đúng 1 ngày'], ['🟢', 'Tốt', 'đúng ≥ 2 ngày khác nhau'], ['🔵', 'Hiếm', 'đúng ≥ 3 ngày, cách nhau ≥ 7 ngày'], ['🟣', 'Huyền thoại', 'đúng ≥ 4 ngày, cách nhau ≥ 30 ngày, hoặc hoa 🌸 trong Vườn từ đã ≥ 21 ngày']] as const;
export interface Gem { id: string; days: number; first: number; last: number; tier: Tier }
const WID = /^w:([^:]+):/;
// Từ đã tìm / trả lời đúng (sổ bằng chứng) + cây trong Vườn từ (bậc 3 = hoa).
export function gemsOf(led: Pick<EvEvent, 'ok' | 'item' | 'day'>[], plants: Record<string, { s: number; d: number }> = {}): Map<string, Gem> {
  const by = new Map<string, Set<number>>();
  for (const x of led) { if (!x.ok) continue; const m = WID.exec(x.item ?? ''); if (!m) continue; let s = by.get(m[1]!); if (!s) by.set(m[1]!, (s = new Set())); s.add(x.day); }
  for (const [id, p] of Object.entries(plants)) if (p.s >= 1 && !by.has(id)) by.set(id, new Set([p.d]));
  const out = new Map<string, Gem>();
  for (const [id, ds] of by) {
    const a = [...ds].sort((p, q) => p - q), first = a[0]!, last = a[a.length - 1]!, span = last - first, bloom = (plants[id]?.s ?? 0) >= 3 && last - (plants[id]?.d ?? last) >= 0;
    const tier: Tier = (a.length >= 4 && span >= 30) || (bloom && span >= 21) ? 3 : a.length >= 3 && span >= 7 ? 2 : a.length >= 2 ? 1 : 0;
    out.set(id, { id, days: a.length, first, last, tier });
  }
  return out;
}
// Album theo cụm từ (unit): đủ ≥ 50% → ⭐ (+10 xu), đủ 100% → 🏆 (+40 xu); mỗi mốc nhận một lần.
export const ALB_COINS = [0, 10, 40] as const;
export interface Album { node: string; total: number; got: number; tier: 0 | 1 | 2; claimed: number }
export function albumsOf(lex: Array<{ id: string; node: string }>, gems: Map<string, Gem>, claimed: Record<string, number>): Album[] {
  const by = new Map<string, { t: number; g: number }>();
  for (const w of lex) { const a = by.get(w.node) ?? { t: 0, g: 0 }; a.t++; if (gems.has(w.id)) a.g++; by.set(w.node, a); }
  return [...by].filter(([, a]) => a.g > 0).map(([node, a]) => ({ node, total: a.t, got: a.g, tier: (a.g >= a.t ? 2 : a.g * 2 >= a.t ? 1 : 0) as 0 | 1 | 2, claimed: claimed[node] ?? 0 }))
    .sort((p, q) => q.tier - q.claimed - (p.tier - p.claimed) || q.got / q.total - p.got / p.total);
}
export function claimAlbum(s: BagSave, a: Album): number {
  let coins = 0;
  for (let t = (s.alb[a.node] ?? 0) + 1; t <= a.tier; t++) coins += ALB_COINS[t]!;
  if (a.tier > (s.alb[a.node] ?? 0)) s.alb[a.node] = a.tier;
  return coins;
}

// ---------- Sinh đề chế tạo (theo seed) ----------
export function rng(seed: number): () => number { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const pickN = <T>(xs: T[], n: number, r: () => number): T[] => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a.slice(0, n); };
export interface MorphTask { base: string; aff: string; out: string; vi: string; opts: string[] }
// Ưu tiên gốc là từ người chơi đã có trong túi (ngọc từ); phụ tố đã mở theo khu.
export function morphTask(act: number, seed: number, mine: Set<string> = new Set(), avoid: string[] = []): MorphTask {
  const r = rng(seed), open = affixesOpen(act), pool = MORPH.filter(m => open.includes(m[1]) && !avoid.includes(m[2]));
  const all = pool.length ? pool : MORPH.filter(m => open.includes(m[1])), pref = all.filter(m => mine.has(m[0]));
  const [base, aff, out, vi] = (pref.length && r() < 0.6 ? pickN(pref, 1, r) : pickN(all, 1, r))[0]!;
  const others = pickN(open.filter(a => a !== aff), 3, r), opts = pickN([aff, ...others], others.length + 1, r);
  return { base, aff, out, vi, opts };
}
// Chọn phụ tố: đúng → sang bước gõ; sai → "đồ hỏng" kèm lý do (có khi là một từ thật khác nghĩa).
export function morphPick(t: MorphTask, aff: string): { ok: boolean; why: string } {
  if (aff === t.aff) return { ok: true, why: '' };
  const other = MORPH.find(m => m[0] === t.base && m[1] === aff);
  return { ok: false, why: other ? `“${other[2]}” cũng là từ thật nhưng nghĩa là “${other[3]}”, không phải “${t.vi}”.` : `${aff.startsWith('-') ? `${t.base} + ${aff.slice(1)}` : `${aff.slice(0, -1)} + ${t.base}`} không thành từ tiếng Anh: ra đồ hỏng (không mất nguyên liệu).` };
}
export const typedOk = (want: string, got: string): boolean => got.trim().toLowerCase().replace(/[’']/g, "'") === want.toLowerCase();
export interface ColTask { verb: string; rest: string; vi: string; opts: string[] }
export function colTask(act: number, seed: number, avoid: string[] = []): ColTask {
  const r = rng(seed), pool = COLLOC.filter(c => c[3] <= Math.max(1, act) && !avoid.includes(`${c[0]} ${c[1]}`)), all = pool.length ? pool : COLLOC.filter(c => c[3] <= Math.max(1, act));
  const [verb, rest, vi] = pickN(all, 1, r)[0]!, wrong = pickN(VERBS.filter(v => v !== verb && !COLLOC.some(c => c[0] === v && c[1] === rest)), 3, r);
  return { verb, rest, vi, opts: pickN([verb, ...wrong], 4, r) };
}
export function colPick(t: ColTask, verb: string): { ok: boolean; why: string } {
  const ph = `${t.verb} ${t.rest}`;
  return verb === t.verb ? { ok: true, why: COL_WHY[ph] ?? '' } : { ok: false, why: COL_WHY[ph] ?? `Tiếng Anh nói “${ph}”, không nói “${verb} ${t.rest}”.` };
}
export interface SentTask { who: string; en: string; vi: string; tiles: string[] }
// Câu của cư dân đang cần giúp (nếu có) được ưu tiên: đúc xong thì tặng được cho họ (việc phụ của truyện).
export function sentTask(act: number, seed: number, who?: string, avoid: string[] = []): SentTask {
  const r = rng(seed), lv = Math.max(1, Math.min(4, act)), near = SENT.filter(s => s[3] <= lv && s[3] >= lv - 1 && !avoid.includes(s[1]));
  const pool = near.length ? near : SENT.filter(s => s[3] <= lv), mine = who ? pool.filter(s => s[0] === who) : [];
  const [w, en, vi] = (mine.length && r() < 0.7 ? pickN(mine, 1, r) : pickN(pool, 1, r))[0]!;
  const toks = en.split(' ');
  let tiles = pickN(toks, toks.length, r);
  for (let k = 0; k < 4 && tiles.join(' ') === en; k++) tiles = pickN(toks, toks.length, r);
  return { who: w, en, vi, tiles };
}
export const sentOk = (t: SentTask, order: number[]): boolean => order.map(i => t.tiles[i]).join(' ') === t.en;
const toks = (s: string): string[] => s.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
// Thổi hồn: gõ lại không nhìn phải đủ từ, đúng thứ tự (bỏ qua dấu câu, hoa thường); nói thì máy nghe ra ≥ 75% từ.
export function soulOk(en: string, said: string, via: 'mic' | 'type'): boolean {
  const w = toks(en), g = toks(said);
  if (via === 'type') return w.join(' ') === g.join(' ');
  const set = new Set(g); return w.filter(x => set.has(x)).length / w.length >= 0.75;
}
