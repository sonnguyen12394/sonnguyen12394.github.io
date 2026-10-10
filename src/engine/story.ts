// v101 Cốt truyện "Phố Chữ mất tiếng" (GAME-CRITERIA §10.13): nối ba game chủ lực bằng một câu chuyện.
// Sương Câm phủ Phố, cư dân mất lời nói. Mỗi chương có ba nhiệm vụ trải trên ba game: ⛏️ đào chữ (từ tìm ở Mỏ Chữ), 🎡 thắp đèn
// (thắng màn Vòng Chữ), 🃏 trả câu nói (câu đúng ở Bài Câu). Đủ thì xem cảnh truyện: cư dân nói lại (tiếng Anh đúng cấp A1, có dịch) và
// một khu Phố hồi sinh. Chương cuối mỗi khu cần thêm số kỹ năng VỮNG thật trên bản đồ năng lực (truyện thưởng cho việc học thật).
// Không ghi bằng chứng, không đổi câu hỏi hay lộ trình, không chặn chơi (P13, P14, C69).

export type StoryKind = 'dig' | 'light' | 'voice';
export interface Line { who: string; en: string; vi: string }
export interface Chapter { act: number; title: string; who: string; intro: string; need: Record<StoryKind, number>; solid?: number; scene: Line[] }
export const ACTS = ['Mở đầu', 'Khu Chợ Sáng', 'Bến Cảng', 'Rừng Trúc'] as const;
export const ACT_BG: Array<[string, string]> = [['#3b2f63', '#120c26'], ['#ff9a62', '#7b4fd6'], ['#2bc0e4', '#1b3b8f'], ['#56ab2f', '#1d4d2b']];
export const KIND_VI: Record<StoryKind, { ico: string; vi: string; game: string; start: string }> = {
  dig: { ico: '⛏️', vi: 'Đào viên chữ ở Mỏ Chữ', game: 'Mỏ Chữ', start: 'hnstart' },
  light: { ico: '🎡', vi: 'Thắp đèn: qua màn Vòng Chữ', game: 'Vòng Chữ', start: 'whstart' },
  voice: { ico: '🃏', vi: 'Trả câu nói: câu đúng ở Bài Câu', game: 'Bài Câu', start: 'cdstart' },
};
const N = (dig: number, light: number, voice: number): Record<StoryKind, number> => ({ dig, light, voice });

export const CHAPTERS: Chapter[] = [
  { act: 0, title: 'Sương Câm', who: '🐯 Tí', intro: 'Một buổi sáng, Phố Chữ im bặt.', need: N(0, 0, 0), scene: [
    { who: '🐯 Tí', en: "Hello! I'm Tí.", vi: 'Xin chào! Mình là Tí.' },
    { who: '🐯 Tí', en: 'A Silent Fog covered our street. People lost their words.', vi: 'Sương Câm phủ kín phố mình. Mọi người mất hết lời nói.' },
    { who: '🐯 Tí', en: 'Dig letters, light the wheel, give back sentences. Will you help me?', vi: 'Đào chữ, thắp vòng đu quay, trả lại câu nói. Bạn giúp mình nhé?' },
  ] },
  // Khu 1 · Chợ Sáng
  { act: 1, title: 'Hoa không tên', who: '🌸 Bà Lan', intro: 'Bà Lan bán hoa không gọi được tên hoa.', need: N(3, 1, 2) /* chương 1 xong được ngay buổi đầu: móc kéo quay lại */, scene: [
    { who: '🌸 Bà Lan', en: 'Flowers! Fresh flowers! Roses and lilies!', vi: 'Hoa đây! Hoa tươi đây! Hồng và loa kèn!' },
    { who: '🌸 Bà Lan', en: 'Thank you, dear. I can say their names again.', vi: 'Cảm ơn cháu. Bà gọi lại được tên hoa rồi.' },
    { who: '🐯 Tí', en: 'One stall is bright. Many more to go!', vi: 'Một sạp đã sáng. Còn nhiều sạp nữa!' },
  ] },
  { act: 1, title: 'Bánh mì im lặng', who: '🥖 Chú Tư', intro: 'Tiệm bánh mì đông khách mà không ai gọi món được.', need: N(6, 1, 3), scene: [
    { who: '🥖 Chú Tư', en: 'Good morning! Bread, one dollar.', vi: 'Chào buổi sáng! Bánh mì, một đô.' },
    { who: '👦 Bé Bin', en: 'Can I have two, please?', vi: 'Cho cháu hai ổ ạ?' },
    { who: '🥖 Chú Tư', en: 'Of course! Here you are.', vi: 'Được chứ! Của cháu đây.' },
  ] },
  { act: 1, title: 'Bé Bin lạc đường', who: '👦 Bé Bin', intro: 'Biển chỉ đường mất chữ, bé Bin không tìm thấy mẹ.', need: N(8, 2, 3), scene: [
    { who: '👦 Bé Bin', en: 'Where is my mom?', vi: 'Mẹ cháu đâu rồi?' },
    { who: '🐯 Tí', en: "Look! The sign says 'Exit'.", vi: "Nhìn kìa! Biển ghi 'Lối ra'." },
    { who: '👩 Mẹ Bin', en: "Bin! I'm here!", vi: 'Bin ơi! Mẹ ở đây!' },
  ] },
  { act: 1, title: 'Chợ Sáng thức giấc', who: '🐯 Tí', intro: 'Gom đủ lời nói để cả khu chợ thức giấc.', need: N(10, 2, 4), solid: 2, scene: [
    { who: '🐯 Tí', en: 'Listen! The market is talking again.', vi: 'Nghe kìa! Chợ lại rộn tiếng nói.' },
    { who: '🌸 Bà Lan', en: "We're so happy. Thank you, friend!", vi: 'Chúng tôi vui lắm. Cảm ơn bạn!' },
    { who: '🐯 Tí', en: "The fog went to the harbour. Let's go!", vi: 'Sương Câm trôi về phía bến cảng. Đi thôi!' },
  ] },
  // Khu 2 · Bến Cảng
  { act: 2, title: 'Ông Ba và tấm lưới', who: '🎣 Ông Ba', intro: 'Thuyền đã sẵn, ông Ba không gọi được bạn thuyền.', need: N(8, 2, 3), scene: [
    { who: '🎣 Ông Ba', en: "My boat is ready, but I can't call my friends.", vi: 'Thuyền sẵn rồi mà ông không gọi được bạn thuyền.' },
    { who: '🎣 Ông Ba', en: "Come on, everyone! Let's go fishing!", vi: 'Nào mọi người! Đi đánh cá thôi!' },
  ] },
  { act: 2, title: 'Bảng giờ tàu trắng trơn', who: '🎫 Cô Ngân', intro: 'Bảng giờ tàu mất hết chữ số.', need: N(9, 2, 4), scene: [
    { who: '🎫 Cô Ngân', en: "The next boat leaves at nine o'clock.", vi: 'Chuyến tàu tới rời bến lúc chín giờ.' },
    { who: '👦 Bé Bin', en: 'How much is a ticket?', vi: 'Vé bao nhiêu tiền ạ?' },
    { who: '🎫 Cô Ngân', en: "It's three dollars.", vi: 'Ba đô cháu nhé.' },
  ] },
  { act: 2, title: 'Ngọn hải đăng tắt', who: '🗼 Ông Hải', intro: 'Đèn biển tắt, tàu không thấy đá ngầm.', need: N(10, 3, 4), scene: [
    { who: '🗼 Ông Hải', en: "The light is off. Ships can't see the rocks.", vi: 'Đèn tắt rồi. Tàu không thấy đá ngầm.' },
    { who: '🐯 Tí', en: "Words are light! Let's turn it on.", vi: 'Chữ chính là ánh sáng! Bật đèn lên nào.' },
    { who: '🗼 Ông Hải', en: "It's on! The ships are safe now.", vi: 'Sáng rồi! Tàu an toàn rồi.' },
  ] },
  { act: 2, title: 'Bến Cảng lên đèn', who: '🐯 Tí', intro: 'Thắp sáng cả bến cảng trong đêm.', need: N(12, 3, 5), solid: 5, scene: [
    { who: '🎣 Ông Ba', en: "Look at the sea. It's beautiful tonight.", vi: 'Nhìn biển kìa. Đêm nay đẹp quá.' },
    { who: '🐯 Tí', en: 'The fog is hiding in the bamboo forest.', vi: 'Sương Câm đang trốn trong rừng trúc.' },
    { who: '🎫 Cô Ngân', en: 'Be careful, and come back soon!', vi: 'Cẩn thận nhé, rồi mau quay về!' },
  ] },
  // Khu 3 · Rừng Trúc
  { act: 3, title: 'Thư viện không chữ', who: '📚 Thầy Minh', intro: 'Sách trong thư viện trắng trơn.', need: N(10, 3, 5), scene: [
    { who: '📚 Thầy Minh', en: 'All my books are empty!', vi: 'Sách của thầy trắng trơn cả!' },
    { who: '📚 Thầy Minh', en: "Now I can read again: 'Once upon a time…'", vi: "Giờ thầy đọc lại được rồi: 'Ngày xửa ngày xưa…'" },
  ] },
  { act: 3, title: 'Bài hát không lời', who: '🎵 Cô Chi', intro: 'Cô Chi muốn hát mà quên hết lời.', need: N(11, 3, 5), scene: [
    { who: '🎵 Cô Chi', en: "I want to sing, but I don't remember the words.", vi: 'Cô muốn hát mà không nhớ lời.' },
    { who: '🎵 Cô Chi', en: '♪ The sun is up, the sky is blue ♪', vi: '♪ Mặt trời lên, trời xanh trong ♪' },
  ] },
  { act: 3, title: 'Con đường trúc', who: '👦 Bé Bin', intro: 'Rừng trúc có hai ngả, biển chỉ đường mờ mịt.', need: N(12, 4, 5), scene: [
    { who: '👦 Bé Bin', en: 'Which way? Left or right?', vi: 'Đường nào? Trái hay phải?' },
    { who: '🐯 Tí', en: "The sign says: 'Bell, turn left.'", vi: "Biển ghi: 'Chuông, rẽ trái.'" },
  ] },
  { act: 3, title: 'Chuông Lời', who: '🐯 Tí', intro: 'Chuông Lời giữa rừng đã im tiếng từ lâu.', need: N(14, 4, 6), solid: 9, scene: [
    { who: '🐯 Tí', en: 'This is the Word Bell. It is silent.', vi: 'Đây là Chuông Lời. Nó đang im lặng.' },
    { who: '👥 Mọi người', en: 'One, two, three… Hello!', vi: 'Một, hai, ba… Xin chào!' },
    { who: '🐯 Tí', en: 'The fog is running to the Night Street. To be continued!', vi: 'Sương Câm chạy về Phố Đêm. Còn tiếp!' },
  ] },
];
export const COINS_CHAPTER = 20, COINS_ACT = 50;

export interface StorySave { ch: number; prog: Record<StoryKind, number>; side?: { letter?: number; cafe?: number } }   // side: chương đã làm việc phụ
export const freshStory = (): StorySave => ({ ch: 0, prog: N(0, 0, 0) });
export const chapterAt = (s: StorySave): Chapter | null => CHAPTERS[s.ch] ?? null;
export const finished = (s: StorySave): boolean => s.ch >= CHAPTERS.length;

// Cộng tiến độ cho chương hiện tại (chặn ở mức cần). Trả về true nếu một nhiệm vụ vừa xong.
// Chương nhận tiến độ: đang ở mở đầu (chưa xem cảnh) thì tính sẵn cho chương 1, không để mất công chơi.
const target = (s: StorySave): Chapter | null => (s.ch === 0 ? CHAPTERS[1] ?? null : chapterAt(s));
export function storyAdd(s: StorySave, kind: StoryKind, n: number): boolean {
  const c = target(s); if (!c || n <= 0) return false;
  const before = s.prog[kind] >= c.need[kind];
  s.prog[kind] = Math.min(c.need[kind], s.prog[kind] + n);
  return !before && s.prog[kind] >= c.need[kind] && c.need[kind] > 0;
}
// Đủ nhiệm vụ game? Đủ kỹ năng vững (chương cuối khu)?
export const tasksDone = (s: StorySave): boolean => { const c = chapterAt(s); return !!c && (Object.keys(c.need) as StoryKind[]).every(k => s.prog[k] >= c.need[k]); };
export const solidOk = (s: StorySave, solid: number): boolean => { const c = chapterAt(s); return !!c && solid >= (c.solid ?? 0); };
export const ready = (s: StorySave, solid: number): boolean => tasksDone(s) && solidOk(s, solid);
// Xem xong cảnh truyện → sang chương sau; trả về xu thưởng và khu vừa hồi sinh (nếu là chương cuối khu).
export function advance(s: StorySave, solid: number): { coins: number; act: string | null } | null {
  if (!ready(s, solid)) return null;
  const c = chapterAt(s)!, nx = CHAPTERS[s.ch + 1], actDone = c.act > 0 && (!nx || nx.act !== c.act);
  s.ch++; if (c.act > 0) s.prog = N(0, 0, 0);   // mở đầu: giữ tiến độ đã tính sẵn cho chương 1
  return { coins: c.act === 0 ? 0 : actDone ? COINS_ACT : COINS_CHAPTER, act: actDone ? ACTS[c.act]! : null };
}
export const revived = (s: StorySave): string[] => ACTS.slice(1).filter((_, i) => { const last = CHAPTERS.map((c, k) => (c.act === i + 1 ? k : -1)).filter(k => k >= 0).pop() ?? 99; return s.ch > last; });

export function sanitizeStory(raw: unknown): StorySave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const p = (x.prog && typeof x.prog === 'object' ? x.prog : {}) as Record<string, unknown>;
  const sd = (x.side && typeof x.side === 'object' ? x.side : {}) as Record<string, unknown>, side: StorySave['side'] = {};
  if (typeof sd.letter === 'number') side.letter = n(sd.letter, CHAPTERS.length);
  if (typeof sd.cafe === 'number') side.cafe = n(sd.cafe, CHAPTERS.length);
  return { ch: n(x.ch, CHAPTERS.length), prog: N(n(p.dig, 999), n(p.light, 999), n(p.voice, 999)), ...(Object.keys(side).length ? { side } : {}) };
}
// v103 Việc phụ ở game kỹ năng (không bắt buộc, không tính vào nhiệm vụ chương, không ghi bằng chứng): cư dân của chương xuất hiện
// trong Thư (người nhờ viết) và Quán (khách đầu ca); làm xong mỗi việc một lần mỗi chương được +10 xu.
export const SIDE_COINS = 10;
export type SideKind = 'letter' | 'cafe';
// Cư dân của chương đang nhận tiến độ (Tí / "mọi người" thì không có).
export function resident(s: StorySave | undefined): [string, string] | null {
  const c = target(s ?? freshStory()); if (!c || /^(🐯|👥)/.test(c.who)) return null;
  const [ico, ...nm] = c.who.split(' '); return [ico!, nm.join(' ')];
}
const curCh = (s: StorySave) => (s.ch === 0 ? 1 : s.ch);
export function sideTasks(s: StorySave | undefined): Array<{ k: SideKind; vi: string; start: string; done: boolean }> {
  const st = s ?? freshStory(), who = resident(st); if (!who) return [];
  return [
    { k: 'letter', vi: `✉️ Viết thư cho ${who[1]} (Thư gửi cư dân)`, start: 'ltstart', done: st.side?.letter === curCh(st) },
    { k: 'cafe', vi: `☕ Mời ${who[1]} ở Quán Cà Phê (xong một ca)`, start: 'cfstart', done: st.side?.cafe === curCh(st) },
  ];
}
// Đánh dấu việc phụ xong cho chương hiện tại; trả về true nếu lần đầu (được thưởng).
export function sideDone(s: StorySave, k: SideKind): boolean {
  if (!resident(s)) return false;
  const ch = curCh(s); s.side ||= {};
  if (s.side[k] === ch) return false;
  s.side[k] = ch; return true;
}
export function mergeStory(a?: StorySave, b?: StorySave): StorySave | undefined {
  if (!a) return b; if (!b) return a;
  if (a.ch !== b.ch) return a.ch > b.ch ? a : b;
  const side = { ...b.side, ...a.side };
  return { ...(Object.keys(side).length ? { side } : {}), ch: a.ch, prog: N(Math.max(a.prog.dig, b.prog.dig), Math.max(a.prog.light, b.prog.light), Math.max(a.prog.voice, b.prog.voice)) };
}

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// Dòng nhỏ trong thẻ / tiêu đề game: nhiệm vụ truyện còn dở của game này (vd "📖 Đào chữ cho Bà Lan: 3/5").
export function storyNote(s: StorySave | undefined, kind: StoryKind): string {
  const st = s ?? freshStory(), c = target(st); if (!c || c.need[kind] <= 0 || st.prog[kind] >= c.need[kind]) return '';
  const verb = kind === 'dig' ? 'Đào chữ' : kind === 'light' ? 'Thắp đèn' : 'Trả câu nói';
  return `📖 ${verb} cho ${c.who.replace(/^\S+\s/, '')}: ${st.prog[kind]}/${c.need[kind]}`;
}

// Thẻ truyện ở sảnh: chương, lời dẫn, ba nhiệm vụ (bấm để vào game), nút xem cảnh, khu đã hồi sinh.
export function viewStory(s: StorySave | undefined, solid: number): string {
  const st = s ?? freshStory();
  if (finished(st)) return `<section class="stcard" style="background:linear-gradient(135deg,#8e2de2,#160b3d)"><h2>📖 Phố Chữ · Còn tiếp…</h2><p>Bạn đã hồi sinh ${ACTS.slice(1).join(', ')}. Sương Câm đã trốn về Phố Đêm: chương mới sắp ra.</p><div class="whrow" style="justify-content:flex-start"><button class="whb wide" data-e="stscene" data-ch="${CHAPTERS.length - 1}">🔁 Xem lại cảnh cuối</button></div></section>`;
  const c = chapterAt(st)!, [a, b] = ACT_BG[c.act]!, ok = ready(st, solid), num = st.ch;
  const tasks = (Object.keys(KIND_VI) as StoryKind[]).filter(k => c.need[k] > 0).map(k => {
    const v = KIND_VI[k], d = st.prog[k] >= c.need[k];
    return `<li><button class="stask${d ? ' ok' : ''}" data-e="${v.start}"><span aria-hidden="true">${d ? '✅' : v.ico}</span> ${esc(v.vi)} <b>${st.prog[k]}/${c.need[k]}</b></button></li>`;
  }).join('');
  const gate = c.solid && tasksDone(st) && solid < c.solid ? `<p class="stgate">🔒 Chương cuối khu cần <b>${c.solid} kỹ năng vững</b> trên bản đồ năng lực (bạn có ${solid}). Học ở <button class="stlink" data-e="go" data-r="today">Lộ trình hôm nay</button>, mỗi kỹ năng vững là một tiếng nói được trả lại.</p>` : c.solid ? `<p class="stsmall">⭐ Chương cuối khu: cần thêm ${c.solid} kỹ năng vững thật (bạn có ${solid}).</p>` : '';
  const rv = revived(st);
  return `<section class="stcard" style="background:linear-gradient(135deg,${a},${b})" aria-label="Cốt truyện Phố Chữ">
    <span class="steyebrow">📖 Phố Chữ mất tiếng · ${esc(ACTS[c.act]!)}${num ? ` · chương ${num}` : ''}</span>
    <h2>${esc(c.who.split(' ')[0]!)} ${esc(c.title)}</h2>
    <p>${esc(c.intro)}</p>
    ${tasks ? `<ul class="stasks">${tasks}</ul>` : ''}
    ${gate}
    ${(() => { const sd = sideTasks(st); return sd.length ? `<p class="stsmall" style="margin:8px 0 4px">Việc phụ (không bắt buộc, +${SIDE_COINS} xu mỗi việc):</p><ul class="stasks">${sd.map(t => `<li><button class="stask${t.done ? ' ok' : ''}" data-e="${t.start}"><span aria-hidden="true">${t.done ? '✅' : '•'}</span> ${esc(t.vi)}</button></li>`).join('')}</ul>` : ''; })()}
    <div class="whrow" style="justify-content:flex-start">${ok ? `<button class="whbig" data-e="stscene" data-ch="${num}">▶ ${num === 0 ? 'Bắt đầu câu chuyện' : 'Xem cảnh truyện'}</button>` : ''}</div>
    ${rv.length ? `<p class="stsmall">🏙️ Đã hồi sinh: ${rv.map(esc).join(', ')}</p>` : ''}
  </section>`;
}
