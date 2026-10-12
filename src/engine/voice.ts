// v123–v127 Phố Chữ nói (docs/GAME-CRITERIA.md §13): game mà động từ chơi là hành động ngôn ngữ thật.
//   🗣️ Quán Phố Chữ bằng giọng (v123): khách đến, bạn NÓI (hoặc gõ) để hỏi / đáp; khách hiểu thì nói lại được.
//   🌫️ Sương quay lại (v124): biển hiệu của từ bạn sắp quên mờ dần; nhớ lại tên tiếng Anh thì biển sáng lại (nhớ trễ thật, FSRS).
//   🔎 Hỏi chuyện nhân chứng (v125): manh mối chỉ có khi bạn TỰ ĐẶT câu hỏi đúng (khoảng trống thông tin).
//   ⚓ Bến Cảng lệnh giọng (v126): cần cẩu nghe lệnh một từ của cặp âm dễ lẫn; nói thiếu âm cuối thì cẩu nhấc nhầm thùng.
//   🌍 Phố thật (v127): một nhiệm vụ tiếng Anh ngoài đời mỗi tuần.
// Lớp nhập "Lời nói": mic → gõ → chọn. Câu nói / gõ là phản hồi và số đo H (hmeter.ts); chỉ câu tự gõ dùng từ đúng mới vào sổ bằng chứng.
// Thuần hàm: nội dung, chấm, lưu. Tên, luật là của app.

import { rand } from './blocks.ts';
import { freshH, mergeH, sanitizeH, type HLog } from './hmeter.ts';

// ---------- Chung ----------
export const LVS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
// Thời gian nghĩ mục tiêu mỗi lượt (giây), như hội thoại mở của app (CV_RT): A1 nới nhất.
export const RT: Record<string, number> = { A1: 6, A2: 5, B1: 4, B2: 3, C1: 2.5, C2: 2 };
export const rtOf = (lv: string): number => RT[lv] ?? 6;
export const words = (t: string): string[] => (String(t).toLowerCase().replace(/[’‘]/g, "'").match(/[a-z0-9']+/g) ?? []);
export const wcount = (t: string): number => words(t).length;
// Gốc từ thô (đủ cho so khớp từ khoá): bỏ -'s, -ies, -es, -s, -ing, -ed.
export function stem(w: string): string {
  let s = w.toLowerCase().replace(/'s$/, '');
  if (s.length > 4 && s.endsWith('ies')) s = s.slice(0, -3) + 'y';
  else if (s.length > 4 && /(ches|shes|xes|sses)$/.test(s)) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) s = s.slice(0, -1);
  if (s.length > 5 && s.endsWith('ing')) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith('ed')) s = s.slice(0, -2);
  return s;
}
export const stems = (t: string): string[] => words(t).map(stem);
// Thời gian nghĩ: từ lúc câu hỏi hiện tới lúc trả lời, trừ thời gian máy đọc câu hỏi (≈ 2,5 từ / giây).
export function thinkSec(ms: number, prompt: string): number { return Math.max(0, Math.round((ms / 1000 - wcount(prompt) / 2.5) * 10) / 10); }
// Thanh kiên nhẫn của khách (giây): đủ để nghe hết câu và nghĩ gấp ba lần mức mục tiêu.
export const patience = (lv: string, prompt: string): number => Math.round(wcount(prompt) / 2.5 + rtOf(lv) * 3);
export type Via = 'mic' | 'type' | 'pick';

// ---------- 🗣️ Quán Phố Chữ bằng giọng (hội thoại nhánh của app: CONV) ----------
export interface ConvNode { a: string; v: string; h: string; m: string; end: boolean }
export interface Conv { id: string; lv: string; title: string; vi: string; who: string; k: number; start: string; n: Record<string, ConvNode> }
export interface TurnRes { hit: boolean; next: string; reply: string }
// Khách của ca: hội thoại đúng cấp, chưa chơi trong ca, ít lần chơi trước trước.
export function pickConvs(all: Conv[], lv: string, played: Record<string, number>, seed: number, n = 2): Conv[] {
  const at = Math.max(0, LVS.indexOf(lv)), tries = [lv, ...LVS.slice(0, at).reverse(), ...LVS.slice(at + 1)], r = rand(seed), tie = new Map(all.map(c => [c.id, r()]));
  for (const L of tries) {
    const pool = all.filter(c => c.lv === L).sort((a, b) => (played[a.id] ?? 0) - (played[b.id] ?? 0) || tie.get(a.id)! - tie.get(b.id)!);
    if (pool.length) return pool.slice(0, n);
  }
  return [];
}
// Phương án chọn (bậc lùi cuối, sau khi đã thử nói / gõ): câu mẫu của lượt + câu mẫu của hai lượt khác.
export function pickOpts(c: Conv, node: string, seed: number): { opts: string[]; ans: number } {
  const me = c.n[node]?.m ?? '', others = Object.entries(c.n).filter(([k, x]) => k !== node && !x.end && x.m && x.m !== me).map(([, x]) => x.m);
  const r = rand(seed), sh = others.sort(() => r() - 0.5).slice(0, 2), opts = [me, ...sh].sort(() => r() - 0.5);
  return { opts, ans: opts.indexOf(me) };
}
// Xu một lượt: khách hiểu ngay 10 (thêm tiền tip 5 khi nghĩ kịp mức mục tiêu); hiểu sau khi hỏi lại 5; chọn đáp án 2.
export function turnCoins(first: boolean, via: Via, think: number | null, lv: string): { coins: number; tip: boolean } {
  if (via === 'pick') return { coins: 2, tip: false };
  if (!first) return { coins: 5, tip: false };
  const tip = think !== null && think <= rtOf(lv);
  return { coins: 10 + (tip ? 5 : 0), tip };
}
// "Món đặc biệt": dùng từ vừa tìm ở Mỏ Chữ / Vòng Chữ trong câu của mình (≥ 4 từ, có đúng từ đó).
export function usesWord(text: string, w: string): boolean {
  const ws = words(text), target = w.toLowerCase(), st = stem(target);
  return ws.length >= 4 && ws.some(x => x === target || stem(x) === st);
}

// ---------- 🔎 Hỏi chuyện nhân chứng ----------
// Mỗi vụ: nhân chứng biết 4 điều; người chơi phải TỰ ĐẶT câu hỏi (từ để hỏi + từ khoá) mới nhận được câu trả lời. Đủ manh mối thì chọn
// người đúng trong 3 nghi phạm (đọc mô tả tiếng Anh). Không AI: nhận câu hỏi bằng từ để hỏi + từ khoá.
export interface Fact { id: string; vi: string; q: string[]; a: string; key: string }
export interface Suspect { name: string; en: string }
export interface Case { id: string; lv: string; title: string; vi: string; who: string; intro: string; facts: Fact[]; sus: Suspect[]; ans: number }
const WH = /^(what|where|when|who|whose|why|how|which|do|does|did|is|are|was|were|can|could|have|has|had|will|would)\b/;
// Có phải câu hỏi: dấu hỏi, hoặc mở đầu bằng từ để hỏi / trợ động từ (máy nghe giọng không có dấu câu).
export function isQuestion(t: string): boolean { const s = String(t).trim().toLowerCase().replace(/^(excuse me|sorry|so|and|ok|okay|please)[,\s]+/, ''); return /\?\s*$/.test(t) || WH.test(s); }
// Mỗi mẫu trong f.q: các từ (cách nhau dấu cách) đều phải có trong câu hỏi (so gốc từ); "|" = hoặc trong một vị trí.
export function askMatch(c: Case, text: string, got: string[] = []): Fact | null {
  if (!isQuestion(text)) return null;
  const S = new Set(stems(text));
  const ok = (pat: string) => pat.split(' ').every(slot => slot.split('|').some(w => S.has(stem(w))));
  return c.facts.find(f => !got.includes(f.id) && f.q.some(ok)) ?? c.facts.find(f => f.q.some(ok)) ?? null;
}
export const CASES: Case[] = [
  { id: 'a1-bag', lv: 'A1', title: 'The Lost Bag', vi: 'Chiếc túi bị mất ở chợ', who: 'Bà Lan', intro: 'Bà Lan mất túi ở Chợ Sáng. Hỏi bà để biết túi thế nào, mất ở đâu, lúc nào.',
    facts: [
      { id: 'what', vi: 'Mất cái gì?', q: ['what lose|lost', 'what missing', 'what happen'], a: 'I lost my bag. It is a small bag.', key: 'túi nhỏ' },
      { id: 'color', vi: 'Màu gì?', q: ['what color|colour', 'is it red|blue|green|black|yellow|white|brown'], a: 'It is red. A small red bag.', key: 'màu đỏ' },
      { id: 'where', vi: 'Ở đâu?', q: ['where'], a: 'At the fruit stall, near the bananas.', key: 'sạp hoa quả' },
      { id: 'when', vi: 'Lúc nào?', q: ['when', 'what time'], a: 'At eight o’clock this morning.', key: '8 giờ sáng' },
    ],
    sus: [{ name: 'Bé Bin', en: 'Bin has a red bag. He was at the fruit stall at eight.' }, { name: 'Chú Tư', en: 'Tu has a blue bag. He was at the fish stall at ten.' }, { name: 'Cô Chi', en: 'Chi has a red hat. She was at home at eight.' }], ans: 0 },
  { id: 'a1-cat', lv: 'A1', title: 'Where Is the Cat?', vi: 'Con mèo đi lạc', who: 'Bé Bin', intro: 'Mèo của Bé Bin đi lạc. Hỏi Bin con mèo trông thế nào, tên gì, thích ăn gì.',
    facts: [
      { id: 'name', vi: 'Tên mèo?', q: ['what name', 'name'], a: 'Her name is Mimi.', key: 'Mimi' },
      { id: 'color', vi: 'Màu lông?', q: ['what color|colour', 'is she|it black|white|orange|grey|gray|brown'], a: 'She is white with a black tail.', key: 'trắng, đuôi đen' },
      { id: 'food', vi: 'Thích ăn gì?', q: ['what like|eat|food', 'does she|it like|eat'], a: 'She likes fish very much.', key: 'thích cá' },
      { id: 'where', vi: 'Mất ở đâu?', q: ['where'], a: 'I last saw her in the park.', key: 'công viên' },
    ],
    sus: [{ name: 'Mèo ở chợ cá', en: 'A white cat with a black tail is eating fish at the fish market.' }, { name: 'Mèo trên mái nhà', en: 'An orange cat is sleeping on a roof.' }, { name: 'Mèo ở công viên', en: 'A black cat with a white tail is playing in the park.' }], ans: 0 },
  { id: 'a1-key', lv: 'A1', title: 'The Shop Key', vi: 'Chìa khoá cửa hàng', who: 'Chú Tư', intro: 'Chú Tư không tìm thấy chìa khoá cửa hàng. Hỏi chú để tìm ra ai đang giữ chìa.',
    facts: [
      { id: 'what', vi: 'Chìa khoá thế nào?', q: ['what look|like', 'what key', 'how look', 'what color|colour'], a: 'It is a big gold key.', key: 'to, màu vàng' },
      { id: 'who', vi: 'Ai cầm lần cuối?', q: ['who', 'who have|has|had'], a: 'My friend Hai had it yesterday.', key: 'ông Hải' },
      { id: 'when', vi: 'Hôm nào?', q: ['when', 'what day'], a: 'Yesterday afternoon.', key: 'chiều hôm qua' },
      { id: 'where', vi: 'Ông Hải ở đâu?', q: ['where'], a: 'He works at the harbour.', key: 'bến cảng' },
    ],
    sus: [{ name: 'Ông Hải', en: 'Hai works at the harbour. He has a big gold key in his pocket.' }, { name: 'Ông Ba', en: 'Ba works at the market. He has a small silver key.' }, { name: 'Thầy Minh', en: 'Minh works at the school. He has no keys.' }], ans: 0 },
  { id: 'a2-bike', lv: 'A2', title: 'The Missing Bike', vi: 'Chiếc xe đạp biến mất', who: 'Cô Ngân', intro: 'Xe đạp của Cô Ngân biến mất. Hỏi cô xe trông thế nào, để ở đâu, cô thấy ai gần đó.',
    facts: [
      { id: 'look', vi: 'Xe thế nào?', q: ['what look|like', 'what color|colour', 'what kind|type'], a: 'It’s an old green bike with a basket.', key: 'xanh lá, có giỏ' },
      { id: 'where', vi: 'Để ở đâu?', q: ['where leave|left|park|put', 'where'], a: 'I left it outside the library.', key: 'trước thư viện' },
      { id: 'when', vi: 'Lúc nào?', q: ['when', 'what time'], a: 'Between two and three in the afternoon.', key: '2–3 giờ chiều' },
      { id: 'who', vi: 'Thấy ai?', q: ['who see|saw|there|near', 'did you see|notice', 'anyone|anybody|somebody|someone'], a: 'I saw a tall boy in a yellow T-shirt near it.', key: 'cậu cao, áo vàng' },
    ],
    sus: [{ name: 'Nam', en: 'Nam is tall and was wearing a yellow T-shirt. He was near the library at half past two.' }, { name: 'Long', en: 'Long is short and was wearing a yellow T-shirt. He was at the pool all afternoon.' }, { name: 'Phúc', en: 'Phúc is tall and was wearing a blue shirt. He was near the library at five.' }], ans: 0 },
  { id: 'a2-cake', lv: 'A2', title: 'The Birthday Cake', vi: 'Bánh sinh nhật bị ăn mất', who: 'Mẹ Bin', intro: 'Bánh sinh nhật của Bin bị ai đó ăn mất một nửa. Hỏi Mẹ Bin để tìm ra ai.',
    facts: [
      { id: 'what', vi: 'Bánh gì?', q: ['what kind|type|cake', 'what flavour|flavor'], a: 'A chocolate cake with strawberries on top.', key: 'sô-cô-la, dâu' },
      { id: 'where', vi: 'Để ở đâu?', q: ['where'], a: 'On the kitchen table.', key: 'bàn bếp' },
      { id: 'when', vi: 'Lúc nào mất?', q: ['when', 'what time'], a: 'While I was shopping, from four to five.', key: '4–5 giờ' },
      { id: 'who', vi: 'Ai ở nhà?', q: ['who home|house|there', 'who', 'was anyone|anybody|someone'], a: 'Only Bin and his uncle were at home.', key: 'Bin và chú' },
    ],
    sus: [{ name: 'Chú của Bin', en: 'Bin’s uncle was at home from four to five. He has chocolate on his shirt.' }, { name: 'Bin', en: 'Bin was at home, but he was asleep from three to six.' }, { name: 'Bà hàng xóm', en: 'The neighbour was at the market from four to five.' }], ans: 0 },
  { id: 'a2-boat', lv: 'A2', title: 'The Late Boat', vi: 'Chuyến tàu đến muộn', who: 'Ông Hải', intro: 'Một chuyến tàu đến Bến Cảng muộn hai tiếng. Hỏi Ông Hải tàu nào, chở gì, vì sao muộn.',
    facts: [
      { id: 'which', vi: 'Tàu nào?', q: ['which boat|ship', 'what name', 'what boat|ship'], a: 'The Blue Star, the small fishing boat.', key: 'Blue Star' },
      { id: 'carry', vi: 'Chở gì?', q: ['what carry|bring|on|cargo', 'what in'], a: 'It was carrying rice and fresh fish.', key: 'gạo, cá' },
      { id: 'why', vi: 'Vì sao muộn?', q: ['why'], a: 'Because the engine broke down near the island.', key: 'hỏng máy' },
      { id: 'who', vi: 'Ai lái?', q: ['who drive|captain|sail|steer', 'who'], a: 'Captain Linh was driving it.', key: 'thuyền trưởng Linh' },
    ],
    sus: [{ name: 'Blue Star', en: 'The Blue Star carries rice and fish. Its engine broke near the island. Captain: Linh.' }, { name: 'Red Moon', en: 'The Red Moon carries fruit. It arrived on time. Captain: Hai.' }, { name: 'Blue Sky', en: 'The Blue Sky carries rice. It was late because of the rain. Captain: Linh.' }], ans: 0 },
  { id: 'b1-paint', lv: 'B1', title: 'The Painting', vi: 'Bức tranh biến mất ở trường', who: 'Thầy Minh', intro: 'Bức tranh của trường biến mất trước triển lãm. Hỏi Thầy Minh đủ chi tiết để tìm người đã mang nó đi.',
    facts: [
      { id: 'what', vi: 'Tranh gì?', q: ['what painting|picture|look|show', 'what of', 'what kind|type'], a: 'It’s a painting of the harbour at sunset, quite large.', key: 'bến cảng lúc hoàng hôn' },
      { id: 'when', vi: 'Lúc nào mất?', q: ['when', 'what time'], a: 'Some time between the end of classes and the evening meeting.', key: 'sau giờ học, trước họp tối' },
      { id: 'who', vi: 'Ai có chìa khoá phòng?', q: ['who key|keys|access|open', 'who', 'does anyone|anybody have'], a: 'Only the cleaner and the art teacher have keys to that room.', key: 'lao công, cô dạy vẽ' },
      { id: 'why', vi: 'Có ai cần tranh không?', q: ['why', 'who need|want', 'reason'], a: 'The art teacher wanted to repair the frame before the exhibition.', key: 'sửa khung' },
    ],
    sus: [{ name: 'Cô dạy vẽ', en: 'The art teacher has a key to the room and took a large painting home to repair its frame after classes.' }, { name: 'Bác lao công', en: 'The cleaner has a key but was on holiday this week.' }, { name: 'Một học sinh', en: 'A student was seen near the room in the morning, carrying a small drawing.' }], ans: 0 },
  { id: 'b1-phone', lv: 'B1', title: 'The Broken Phone', vi: 'Chiếc điện thoại bị vỡ', who: 'Cô Chi', intro: 'Điện thoại của Cô Chi bị vỡ màn hình ở quán. Hỏi cô chuyện xảy ra thế nào để biết lỗi của ai.',
    facts: [
      { id: 'how', vi: 'Vỡ thế nào?', q: ['how break|broke|broken|happen', 'what happen'], a: 'Someone knocked it off the table while I was ordering.', key: 'bị gạt rơi khỏi bàn' },
      { id: 'where', vi: 'Ở bàn nào?', q: ['where', 'which table'], a: 'At the table by the window, next to the door.', key: 'bàn cạnh cửa sổ' },
      { id: 'who', vi: 'Ai ngồi gần?', q: ['who sit|sat|near|next|there', 'who', 'was anyone|anybody'], a: 'A man with a large backpack was sitting next to me.', key: 'người mang ba lô to' },
      { id: 'when', vi: 'Lúc nào?', q: ['when', 'what time'], a: 'Just after nine, when the café was busy.', key: 'sau 9 giờ' },
    ],
    sus: [{ name: 'Người ba lô to', en: 'A man with a large backpack sat by the window at nine and left quickly, hitting a table with his bag.' }, { name: 'Nhân viên quán', en: 'The waiter was making coffee behind the counter from eight to ten.' }, { name: 'Bạn của Chi', en: 'Chi’s friend arrived at ten, after the phone was broken.' }], ans: 0 },
  { id: 'b1-power', lv: 'B1', title: 'Lights Out', vi: 'Phố Chữ mất điện', who: 'Ông Ba', intro: 'Cả phố mất điện tối qua. Hỏi Ông Ba để biết chuyện gì xảy ra trước khi đèn tắt.',
    facts: [
      { id: 'when', vi: 'Lúc nào mất điện?', q: ['when', 'what time'], a: 'At about half past eight, right in the middle of the storm.', key: '8 giờ 30, lúc bão' },
      { id: 'what', vi: 'Ông nghe / thấy gì?', q: ['what hear|heard|see|saw|notice', 'did you hear|see|notice'], a: 'I heard a loud crack, and then a tree fell near the market.', key: 'cây đổ gần chợ' },
      { id: 'where', vi: 'Cây đổ ở đâu?', q: ['where'], a: 'On the corner, right onto the power line.', key: 'đè lên dây điện ở góc phố' },
      { id: 'who', vi: 'Ai đã gọi sửa?', q: ['who call|phone|repair|fix', 'who', 'has anyone|anybody'], a: 'Ms Ngan called the power company straight away.', key: 'Cô Ngân gọi thợ điện' },
    ],
    sus: [{ name: 'Cây đổ vì bão', en: 'During the storm at half past eight, a tree fell on the power line at the market corner.' }, { name: 'Có người cắt điện', en: 'Someone switched off the power at the school at nine.' }, { name: 'Máy phát hỏng', en: 'The harbour generator broke at midnight.' }], ans: 0 },
];
export function pickCase(lv: string, played: string[], seed: number): Case | null {
  const at = Math.max(0, LVS.indexOf(lv)), tries = [lv, ...LVS.slice(0, at).reverse(), ...LVS.slice(at + 1)], r = rand(seed);
  for (const L of tries) {
    const pool = CASES.filter(c => c.lv === L), fresh = pool.filter(c => !played.includes(c.id)), use = fresh.length ? fresh : pool;
    if (use.length) return use[Math.floor(r() * use.length)]!;
  }
  return null;
}
// Thứ tự nghi phạm xáo theo ván (đáp án không luôn đứng đầu).
export function suspectOrder(c: Case, seed: number): number[] { const r = rand(seed ^ 0x9e3779b9), o = c.sus.map((_, i) => i); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j]!, o[i]!]; } return o; }

// ---------- ⚓ Bến Cảng lệnh giọng (cặp âm tối thiểu) ----------
export interface SoundSet { id: string; title: string; vi: string; tip: string; pairs: Array<[string, string]> }
export interface PortOrder { set: string; target: string; other: string; title: string; tip: string }
// Lượt chơi: cặp âm yếu nhất trước (mastery thấp / chưa có), mỗi cặp 2 lệnh, tổng `n` lệnh; từ đích là một trong hai từ của cặp.
export function portOrders(sets: SoundSet[], weak: (id: string) => number, seed: number, n = 8): PortOrder[] {
  const r = rand(seed), tie = new Map(sets.map(s => [s.id, r()])), ord = [...sets].filter(s => s.pairs.length).sort((a, b) => weak(a.id) - weak(b.id) || tie.get(a.id)! - tie.get(b.id)!);
  const out: PortOrder[] = [];
  for (const s of ord.slice(0, Math.ceil(n / 2))) for (let k = 0; k < 2 && out.length < n; k++) {
    const p = s.pairs[Math.floor(r() * s.pairs.length)]!, t = r() < 0.5 ? 0 : 1;
    out.push({ set: s.id, target: p[t], other: p[1 - t]!, title: s.title, tip: s.tip });
  }
  return out;
}

// ---------- 🌫️ Sương quay lại ----------
export interface Fading { id: string; en: string; vi: string; pic: string; node: string; r: number; gap: number; due?: boolean }   // due: tới hạn ôn (app tự ghi nhớ trễ khi ôn)
// Biển hiệu: từ đã học có khả năng nhớ thấp nhất (sắp quên), tối đa n.
export const signsOf = (xs: Fading[], n = 6): Fading[] => [...xs].sort((a, b) => a.r - b.r || b.gap - a.gap).slice(0, n);
export const norm = (s: string): string => String(s).trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
// Nhớ đúng: gõ / nói đúng từ (bỏ mạo từ đầu câu); máy nghe có nhiều phương án thì một phương án đúng là đủ.
export function signOk(en: string, said: string[]): boolean { const t = norm(en); return said.some(s => { const x = norm(s).replace(/^(a|an|the)\s+/, ''); return x === t || x.split(' ').includes(t); }); }

// ---------- 🌍 Phố thật ----------
export interface RealTask { id: string; lv: string; vi: string; how: string }
export const REAL: RealTask[] = [
  { id: 'labels', lv: 'A1', vi: 'Dán nhãn tiếng Anh cho 5 đồ vật trong nhà', how: 'Viết tên tiếng Anh lên giấy nhớ, dán lên đồ, mỗi lần đi qua thì đọc to.' },
  { id: 'order', lv: 'A1', vi: 'Gọi một món bằng tiếng Anh', how: 'Ở quán (hoặc tập trước gương): “Can I have…, please?”. Ghi âm lại nếu được.' },
  { id: 'song', lv: 'A1', vi: 'Hát theo một bài tiếng Anh, chép lại 3 câu', how: 'Chọn bài bạn thích, nghe, chép 3 câu nghe được, đọc to theo nhịp.' },
  { id: 'intro', lv: 'A1', vi: 'Tự giới thiệu 30 giây bằng tiếng Anh', how: 'Tên, nơi ở, công việc / việc học, một sở thích. Ghi âm rồi nghe lại.' },
  { id: 'msg', lv: 'A2', vi: 'Nhắn một tin tiếng Anh cho bạn bè', how: 'Rủ đi chơi, hỏi thăm hoặc kể một việc hôm nay. Ít nhất 3 câu.' },
  { id: 'menu', lv: 'A2', vi: 'Đọc một thực đơn / nhãn hàng tiếng Anh ngoài đời', how: 'Ở siêu thị hoặc quán: đọc nhãn, tìm 5 từ biết và 2 từ mới, tra nghĩa.' },
  { id: 'video', lv: 'A2', vi: 'Xem một video tiếng Anh 5 phút về sở thích của bạn', how: 'Bật phụ đề tiếng Anh, ghi lại 3 cụm từ hay, nói lại một câu.' },
  { id: 'diary', lv: 'B1', vi: 'Viết nhật ký 5 câu bằng tiếng Anh', how: 'Hôm nay làm gì, cảm thấy thế nào, mai định làm gì.' },
  { id: 'call', lv: 'B1', vi: 'Nói chuyện 3 phút bằng tiếng Anh với một người', how: 'Bạn học, đồng nghiệp hoặc người nước ngoài. Hỏi ít nhất 3 câu hỏi.' },
  { id: 'explain', lv: 'B1', vi: 'Giải thích một món ăn Việt bằng tiếng Anh', how: 'Món gì, làm từ gì, ăn khi nào. Ghi âm 1 phút.' },
  { id: 'podcast', lv: 'B2', vi: 'Nghe một podcast tiếng Anh 10 phút, tóm tắt 3 ý', how: 'Chọn chủ đề bạn thích; viết hoặc nói tóm tắt.' },
  { id: 'review', lv: 'B2', vi: 'Viết một đánh giá tiếng Anh cho quán / sản phẩm', how: 'Trên trang đánh giá thật hoặc trong sổ: điểm tốt, điểm chưa tốt, có nên dùng không.' },
];
export const weekOf = (day: number): number => Math.floor((day + 3) / 7);   // tuần bắt đầu thứ Hai (1/1/1970 là thứ Năm)
export function realTask(lv: string, day: number): RealTask {
  const at = Math.max(0, LVS.indexOf(lv)), pool = REAL.filter(t => LVS.indexOf(t.lv) <= Math.max(at, 0) && LVS.indexOf(t.lv) >= at - 1);
  const use = pool.length ? pool : REAL.filter(t => t.lv === 'A1');
  return use[weekOf(day) % use.length]!;
}

// ---------- Lưu (telemetry, không vào mastery) ----------
export interface VoiceSave {
  tk: { runs: number; served: number; tips: number; coins: number; day: number; played: Record<string, number> };   // Quán bằng giọng
  ak: { runs: number; solved: number; day: number; played: string[] };   // Hỏi chuyện nhân chứng
  pt: { runs: number; ok: number; n: number; best: number; day: number };   // Bến Cảng
  sg: { runs: number; lit: number; day: number };   // Sương quay lại
  rw: { wk: number; done: string[]; total: number };   // Phố thật: tuần đã làm, id nhiệm vụ đã làm
  amb: 0 | 1;   // âm phố (tiếng ồn nền) bật
  hx: HLog;     // nhật ký số đo H (hmeter.ts)
}
export const freshVoice = (): VoiceSave => ({ tk: { runs: 0, served: 0, tips: 0, coins: 0, day: 0, played: {} }, ak: { runs: 0, solved: 0, day: 0, played: [] }, pt: { runs: 0, ok: 0, n: 0, best: 0, day: 0 }, sg: { runs: 0, lit: 0, day: 0 }, rw: { wk: 0, done: [], total: 0 }, amb: 1, hx: freshH() });
const n = (v: unknown, hi = 1e7): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
const o = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const ids = (v: unknown, max: number): string[] => (Array.isArray(v) ? [...new Set(v.filter((s): s is string => typeof s === 'string' && /^[a-z0-9-]{1,30}$/.test(s)))].slice(-max) : []);
export function sanitizeVoice(raw: unknown): VoiceSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = o(raw), tk = o(x.tk), ak = o(x.ak), pt = o(x.pt), sg = o(x.sg), rw = o(x.rw), pl = o(tk.played), played: Record<string, number> = {};
  for (const [k, v] of Object.entries(pl).slice(0, 80)) if (/^[a-z0-9-]{1,30}$/.test(k)) played[k] = n(v, 1e5);
  return {
    tk: { runs: n(tk.runs), served: n(tk.served), tips: n(tk.tips), coins: n(tk.coins), day: n(tk.day, 1e6), played },
    ak: { runs: n(ak.runs), solved: n(ak.solved), day: n(ak.day, 1e6), played: ids(ak.played, 40) },
    pt: { runs: n(pt.runs), ok: n(pt.ok), n: n(pt.n), best: n(pt.best, 100), day: n(pt.day, 1e6) },
    sg: { runs: n(sg.runs), lit: n(sg.lit), day: n(sg.day, 1e6) },
    rw: { wk: n(rw.wk, 1e6), done: ids(rw.done, 60), total: n(rw.total) },
    amb: x.amb === 0 ? 0 : 1,
    hx: sanitizeH(x.hx) ?? freshH(),
  };
}
export function mergeVoice(a?: VoiceSave, b?: VoiceSave): VoiceSave | undefined {
  if (!a) return b; if (!b) return a;
  const mx = <T extends Record<string, number>>(p: T, q: T): T => Object.fromEntries(Object.keys({ ...p, ...q }).map(k => [k, Math.max(p[k] ?? 0, q[k] ?? 0)])) as T;
  const played: Record<string, number> = { ...a.tk.played }; for (const [k, v] of Object.entries(b.tk.played)) played[k] = Math.max(played[k] ?? 0, v);
  return sanitizeVoice({
    tk: { ...mx({ runs: a.tk.runs, served: a.tk.served, tips: a.tk.tips, coins: a.tk.coins, day: a.tk.day }, { runs: b.tk.runs, served: b.tk.served, tips: b.tk.tips, coins: b.tk.coins, day: b.tk.day }), played },
    ak: { ...mx({ runs: a.ak.runs, solved: a.ak.solved, day: a.ak.day }, { runs: b.ak.runs, solved: b.ak.solved, day: b.ak.day }), played: [...new Set([...a.ak.played, ...b.ak.played])] },
    pt: mx(a.pt, b.pt), sg: mx(a.sg, b.sg),
    rw: { wk: Math.max(a.rw.wk, b.rw.wk), done: [...new Set([...a.rw.done, ...b.rw.done])], total: Math.max(a.rw.total, b.rw.total) },
    amb: a.amb && b.amb ? 1 : 0,
    hx: mergeH(a.hx, b.hx),
  });
}
