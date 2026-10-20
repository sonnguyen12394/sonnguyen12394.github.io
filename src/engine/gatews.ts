// v140 Thi chuyển cấp: phần Viết + Nói (người sáng lập 16/10/2026 chọn "đủ 4 kỹ năng ngay"). Đọc + Nghe quyết định bằng IRT
// (gate.ts); Viết / Nói chấm bằng luật + ý máy tìm bằng từ khoá (v161; trước đó tự đánh dấu). v158 (người sáng lập 17/10/2026): Viết / Nói vào phán quyết, mỗi bài ≥ GATE.ws (gatePassAll).
// Bài soạn mới theo dạng công khai của A2 Key (Viết: tin nhắn ≥ 25 từ trả lời 3 ý, chuyện ngắn ≥ 35 từ theo 3 cảnh; Nói: trả lời câu hỏi
// về bản thân). A1 là bản nhẹ hơn. Bài lạ: không trùng Viết theo đề / Nói theo đề ở Kỹ năng. Mỗi bộ đi với một bộ Đọc + Nghe (cùng mã).
// Do AI soạn, chưa người thật soát (như phần Đọc + Nghe). Thuần dữ liệu + hàm.

export interface GwTask {
  id: string; kind: 'w' | 's'; lv: 'A1' | 'A2';
  en: string; vi: string;
  p: string; pv: string;              // đề tiếng Anh + lời dặn tiếng Việt
  c: string[];                        // ý phải có (tên tiếng Việt)
  k?: Kw[];                           // v161 từ khoá của từng ý (cùng thứ tự c): máy chấm ý, không tự đánh dấu
  u: Array<[string, string]>;         // cụm hữu ích (luật Viết đếm cụm đã dùng)
  min: number; max: number; par: number; reg: 'i';
}
const W = (id: string, lv: GwTask['lv'], en: string, vi: string, p: string, pv: string, c: string[], u: Array<[string, string]>, min: number, max: number, k: Kw[]): GwTask =>
  ({ id, kind: 'w', lv, en, vi, p, pv, c, k, u, min, max, par: 1, reg: 'i' });
const S = (id: string, lv: GwTask['lv'], en: string, vi: string, p: string, pv: string, c: string[], u: Array<[string, string]>, min: number, k: Kw[]): GwTask =>
  ({ id, kind: 's', lv, en, vi, p, pv, c, k, u, min, max: 200, par: 1, reg: 'i' });

// v161 (người sáng lập 18/10/2026 "làm cả ba sửa"): ý của Viết / Nói do máy tìm bằng từ khoá, bỏ tự đánh dấu.
// Một ý = mảng nhóm; ý đạt khi MỌI nhóm có ít nhất một từ khớp (khớp đầu từ: "book" khớp "books"; đuôi "$" = đúng cả từ; số đọc bằng chữ đổi ra số).
// Nhóm đặc biệt: ['@past'] = có ≥ 2 động từ quá khứ; ['@n3', ...ds] = có ≥ 3 mục khác nhau trong ds; ['@num'] gộp với nhóm thường = có một con số.
// Từ khoá do AI soạn, chưa người thật soát; chỉ đo "có nói tới ý đó", không đo đúng sai ngữ pháp (phần luật Viết đo hình thức).
export type Kw = string[][];
const NUMW: Record<string, number> = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50 };
export function normEn(s: string): string {
  const t = String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean), out: string[] = [];
  for (let i = 0; i < t.length; i++) {
    const a = NUMW[t[i]!]; if (a === undefined) { out.push(t[i]!); continue; }
    const b = NUMW[t[i + 1] ?? '']; if (a >= 20 && b !== undefined && b > 0 && b < 10) { out.push(String(a + b)); i++; } else out.push(String(a));
  }
  return ' ' + out.join(' ') + ' ';
}
const PAST_IRR = new Set('was were went saw had did made got came took gave found bought ate drank met left felt thought told said ran sat stood fell lost wore won swam sang began brought caught taught knew grew drove rode wrote spent paid slept woke sent kept heard became forgot flew blew broke chose hid hit put cut let shut threw understood arrived'.split(' '));
const NOT_ED = new Set(['need', 'feed', 'speed', 'bed', 'red', 'seed', 'weed', 'shed', 'bread', 'head', 'ahead', 'indeed', 'hundred', 'used', 'tired', 'interested', 'excited', 'bored', 'married', 'crowded']);
const pastN = (h: string): number => h.trim().split(' ').filter(w => PAST_IRR.has(w) || (w.length > 3 && w.endsWith('ed') && !NOT_ED.has(w))).length;
const hasW = (h: string, w: string): boolean => (w.endsWith('$') ? h.includes(normEn(w.slice(0, -1))) : h.includes(' ' + normEn(w).trim()));   // "tea$" = đúng cả từ (không khớp "teacher")
function groupOk(h: string, g: string[]): boolean {
  if (g[0] === '@past') return pastN(h) >= 2;
  if (/^@n\d+$/.test(g[0] ?? '')) { const n = Number(g[0]!.slice(2)) || 2; return g.slice(1).filter(w => hasW(h, w)).length >= n; }
  return g.some(w => (w === '@num' ? /\s\d+\s/.test(h) : hasW(h, w)));
}
export const ideaHits = (t: GwTask, text: string): boolean[] => { const h = normEn(text); return t.c.map((_, i) => { const k = t.k?.[i]; return !!k && k.length > 0 && k.every(g => groupOk(h, g)); }); };
// Bộ từ dùng chung
export const KW = {
  day: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'tonight', 'weekend', 'next week', 'today', 'morning', 'afternoon', 'evening', 'week', 'month', '@num'],
  time: ['@num', "o'clock", 'oclock', 'morning', 'afternoon', 'evening', 'noon', 'half past', 'pm$', 'night'],
  food: ['rice', 'bread', 'pho$', 'noodle', 'egg', 'milk', 'coffee', 'tea$', 'banana', 'apple', 'cake', 'sandwich', 'cereal', 'soup', 'fruit', 'juice', 'banh', 'chicken', 'fish', 'beef', 'pork', 'meat', 'vegetable', 'salad', 'pizza', 'pasta', 'burger', 'spring roll', 'cheese', 'yoghurt', 'yogurt', 'sticky rice', 'xoi', 'bun$', 'chocolate', 'ice cream', 'tofu', 'shrimp', 'seafood', 'hot pot', 'curry', 'sushi', 'potato', 'chips', 'water'],
  drink: ['coffee', 'tea$', 'juice', 'milk', 'water', 'smoothie', 'lemonade', 'cola', 'coke', 'soda', 'chocolate', 'latte', 'cappuccino', 'beer', 'drink'],
  colour: ['black', 'white', 'red$', 'blue', 'green', 'yellow', 'brown', 'pink', 'grey', 'gray', 'orange', 'purple', 'colour', 'color', 'dark', 'light'],
  bring: ['bring', 'take', 'carry', 'remember', "don't forget", 'dont forget'],
  sorry: ['sorry', 'apologi', "i'm afraid", 'im afraid', 'unfortunately'],   // v175 góp ý #25: "I'm afraid I can't" cũng là xin lỗi
  why: ['because', 'so$', 'as i$', 'since', 'need', 'have to', 'must', 'want to', 'to go', 'to visit', 'to take', 'busy', 'ill$', 'sick', 'work'],
  back: ['back', 'return'],
  family: ['mother', 'father', 'mum', 'mom', 'dad', 'parent', 'wife', 'husband', 'son', 'daughter', 'brother', 'sister', 'grand', 'family', 'friend', 'alone', 'myself', 'children', 'child', 'uncle', 'aunt', 'cousin', 'roommate', 'flatmate'],
  act: ['go', 'went', 'play', 'watch', 'read', 'cook', 'visit', 'meet', 'sleep', 'relax', 'swim', 'shop', 'clean', 'study', 'walk', 'run', 'listen', 'see', 'stay', 'work', 'ride', 'eat', 'drink', 'dance', 'sing', 'draw', 'chat', 'talk', 'travel', 'learn', 'help'],
  future: ['going to', 'will', "i'll", 'plan', 'want to', 'would like', "i'd like", 'hope', 'gonna', 'might', 'maybe'],
  because: ['because', 'so$', 'since', 'as it', 'as i$', 'cause'],
  transport: ['bus', 'bike', 'bicycle', 'motorbike', 'motorcycle', 'scooter', 'car', 'taxi', 'train', 'foot', 'walk', 'grab', 'metro', 'drive'],
  like: ['like', 'love', 'enjoy', 'favourite', 'favorite', 'prefer', 'great', 'nice', 'beautiful', 'lovely', 'interesting', 'fun', 'good', 'happy'],
};

export const GATE_WS: Record<string, GwTask[]> = {
  'a1-1': [
    W('g-a1-1-w1', 'A1', 'A Note to Your Neighbour', 'Lời nhắn cho hàng xóm',
      'You are going away for the weekend. Write a note to your neighbour, Ana. Ask her to water your plants. Say when you will come back. Say thank you.',
      'Bạn đi vắng cuối tuần. Viết lời nhắn cho hàng xóm Ana: nhờ tưới cây, nói khi nào bạn về, cảm ơn.',
      ['Nhờ tưới cây', 'Khi nào bạn về', 'Lời cảm ơn'], [['Can you', 'Bạn có thể'], ['water my plants', 'tưới cây của tôi'], ['I will be back on', 'Tôi sẽ về vào'], ['Thank you', 'Cảm ơn']], 20, 60,
      [[['water'], ['plant', 'flower', 'garden', 'tree']], [KW.back, KW.day], [['thank']]]),
    W('g-a1-1-w2', 'A1', 'My Bag', 'Cái túi của tôi',
      'Describe your bag. What colour is it? What is in it today? Where did you get it?',
      'Tả cái túi của bạn: màu gì, hôm nay trong túi có gì, bạn có nó ở đâu.',
      ['Màu của túi', 'Ít nhất ba thứ trong túi', 'Bạn có túi ở đâu'], [['My bag is', 'Túi của tôi màu'], ['There is', 'Có một'], ['There are', 'Có những'], ['I got it from', 'Tôi có nó từ']], 25, 60,
      [[KW.colour], [['@n3', 'phone', 'book', 'pen', 'pencil', 'key', 'wallet', 'purse', 'money', 'bottle', 'notebook', 'laptop', 'computer', 'umbrella', 'glasses', 'card', 'tissue', 'comb', 'lipstick', 'charger', 'headphone', 'sandwich', 'apple', 'banana', 'cake', 'water', 'snack', 'map', 'ticket', 'camera', 'mirror', 'brush', 'towel', 'jacket', 'hat', 'scarf', 'ruler', 'eraser', 'rubber', 'tablet', 'mask', 'medicine', 'cup', 'lunch', 'box']], [['got', 'bought', 'buy', 'gift', 'gave', 'from', 'present', 'shop', 'market']]]),
    S('g-a1-1-s1', 'A1', 'About Your Day', 'Một ngày của bạn',
      'Answer these questions. What time do you get up? What do you eat for breakfast? How do you go to work or school? What do you do in the evening?',
      'Trả lời: mấy giờ bạn dậy, ăn sáng gì, đi làm / đi học bằng gì, buổi tối làm gì.',
      ['Giờ dậy', 'Bữa sáng', 'Cách đi làm / đi học', 'Buổi tối'], [['I get up at', 'Tôi dậy lúc'], ['For breakfast, I have', 'Bữa sáng tôi ăn'], ['I go to work by', 'Tôi đi làm bằng'], ['In the evening, I', 'Buổi tối tôi']], 20,
      [[['get up', 'wake', 'got up'], KW.time], [['breakfast', 'eat', 'have'], KW.food], [['by', 'walk', 'drive', 'ride', 'take'], KW.transport], [['evening', 'night', 'after dinner', 'tonight']]]),
  ],
  'a1-2': [
    W('g-a1-2-w1', 'A1', 'Meet Me at the Café', 'Hẹn ở quán cà phê',
      'Write a message to your friend, Tom. Invite him to a café. Say the day and the time. Say what you want to drink.',
      'Viết tin nhắn cho bạn Tom: mời đi cà phê, nói ngày giờ, nói bạn muốn uống gì.',
      ['Lời mời', 'Ngày và giờ', 'Đồ uống bạn muốn'], [['Do you want to', 'Bạn có muốn'], ['Let’s meet at', 'Mình gặp nhau lúc'], ['on Saturday', 'vào thứ Bảy'], ['I want a', 'Tôi muốn một']], 20, 60,
      [[['want to', 'would you like', "let's", 'lets', 'shall we', 'come', 'join', 'invite', 'how about', 'can you']], [['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'tonight', 'weekend', 'today'], KW.time], [KW.drink]]),
    W('g-a1-2-w2', 'A1', 'My Street', 'Con phố của tôi',
      'Describe the street where you live. Is it big or small? What shops are there? What do you like about it?',
      'Tả con phố bạn sống: to hay nhỏ, có những cửa hàng gì, bạn thích điều gì ở đó.',
      ['To hay nhỏ', 'Ít nhất hai cửa hàng / nơi', 'Điều bạn thích'], [['I live on', 'Tôi sống ở phố'], ['It is', 'Nó'], ['There is a', 'Có một'], ['I like it because', 'Tôi thích vì']], 25, 60,
      [[['big', 'small', 'large', 'long', 'short', 'busy', 'quiet', 'narrow', 'wide', 'little', 'noisy']], [['@n2', 'shop', 'market', 'cafe', 'coffee', 'restaurant', 'supermarket', 'bakery', 'pharmacy', 'school', 'hospital', 'bank', 'park', 'bookshop', 'store', 'hotel', 'cinema', 'gym', 'post office', 'hairdresser', 'salon', 'library', 'church', 'temple', 'pagoda', 'office', 'garage', 'stall']], [KW.like]]),
    S('g-a1-2-s1', 'A1', 'Your Family and Home', 'Gia đình và nhà bạn',
      'Answer these questions. Who do you live with? What is your home like? What do you like doing at home? Who cooks in your family?',
      'Trả lời: bạn sống với ai, nhà bạn thế nào, ở nhà bạn thích làm gì, ai nấu ăn trong nhà.',
      ['Sống với ai', 'Nhà thế nào', 'Thích làm gì ở nhà', 'Ai nấu ăn'], [['I live with', 'Tôi sống với'], ['My home is', 'Nhà tôi'], ['At home, I like', 'Ở nhà tôi thích'], ['usually cooks', 'thường nấu ăn']], 20,
      [[['live with', 'with my', 'live alone', 'by myself'], KW.family], [['home', 'house', 'flat', 'apartment', 'room'], ['big', 'small', 'new', 'old', 'nice', 'beautiful', 'quiet', 'bedroom', 'room', 'floor', 'garden', 'kitchen', 'clean', 'near', 'cosy', 'cozy']], [['like', 'love', 'enjoy'], ['watch', 'read', 'cook', 'play', 'listen', 'sleep', 'relax', 'garden', 'tv', 'music', 'game', 'film', 'movie', 'clean', 'sing', 'draw', 'talk', 'chat', 'study']], [['cook']]]),
  ],
  'a2-1': [
    W('g-a2-1-w1', 'A2', 'Borrowing a Bike', 'Mượn xe đạp',
      'Your English friend, Sam, has a bike. You want to borrow it on Saturday. Write an email to Sam. In your email: ask to borrow the bike; say why you need it; say when you will give it back. Write 25 words or more.',
      'Viết email cho Sam (≥ 25 từ): hỏi mượn xe đạp thứ Bảy, nói vì sao cần, nói khi nào trả.',
      ['Hỏi mượn xe', 'Lý do cần xe', 'Khi nào trả'], [['Could I borrow', 'Mình mượn … được không'], ['because', 'vì'], ['I need it to', 'Mình cần nó để'], ['I’ll give it back on', 'Mình sẽ trả vào']], 25, 70,
      [[['borrow', 'lend', 'use your', 'can i have', 'could i have']], [KW.why], [KW.back, KW.day]]),
    W('g-a2-1-w2', 'A2', 'The Lost Dog', 'Chú chó đi lạc',
      'Write the story from these three scenes. Scene 1: Linh is walking in the park and sees a small dog alone. Scene 2: She reads the name on its collar and phones the number. Scene 3: An old man arrives and is very happy. Write 35 words or more.',
      'Kể lại câu chuyện theo ba cảnh (≥ 35 từ): Linh thấy chú chó lạc ở công viên; cô gọi số trên vòng cổ; một ông cụ đến, rất vui.',
      ['Cảnh 1: thấy chó ở công viên', 'Cảnh 2: gọi số trên vòng cổ', 'Cảnh 3: ông cụ đến, vui', 'Dùng thì quá khứ'], [['One day', 'Một hôm'], ['was walking', 'đang đi dạo'], ['Then', 'Sau đó'], ['In the end', 'Cuối cùng']], 35, 90,
      [[['dog', 'puppy'], ['park']], [['phone', 'call', 'number', 'collar', 'rang']], [['man', 'owner'], ['happy', 'glad', 'smile', 'thank', 'pleased', 'delighted']], [['@past']]]),
    S('g-a2-1-s1', 'A2', 'Free Time and Holidays', 'Thời gian rảnh và kỳ nghỉ',
      'Answer these questions. What do you usually do at the weekend? Tell me about a place you visited last year. What would you like to learn next year? Do you prefer the city or the countryside? Why?',
      'Trả lời: cuối tuần thường làm gì; kể một nơi bạn đến năm ngoái; năm tới muốn học gì; thích thành phố hay nông thôn, vì sao.',
      ['Cuối tuần', 'Một nơi đã đến (thì quá khứ)', 'Điều muốn học', 'Thành phố hay nông thôn + lý do'], [['At the weekend, I usually', 'Cuối tuần tôi thường'], ['Last year, I went to', 'Năm ngoái tôi đã đến'], ['I’d like to learn', 'Tôi muốn học'], ['I prefer … because', 'Tôi thích … hơn vì']], 30,
      [[['weekend', 'saturday', 'sunday']], [['went', 'visited', 'travelled', 'traveled', 'was in', 'stayed', 'saw', 'spent', 'last year']], [['learn', 'study', 'take a course', 'class']], [['city', 'countryside', 'country', 'village', 'town'], ['because', 'so$', 'since', 'as it']]]),
  ],
  'a2-2': [
    W('g-a2-2-w1', 'A2', 'Changing Our Plan', 'Đổi kế hoạch',
      'You and your friend, Kim, planned to see a film tonight, but you can’t go. Write a message to Kim. In your message: say sorry; explain why you can’t go; suggest another day. Write 25 words or more.',
      'Viết tin nhắn cho Kim (≥ 25 từ): xin lỗi, giải thích vì sao không đi xem phim tối nay được, đề nghị ngày khác.',
      ['Lời xin lỗi', 'Lý do không đi được', 'Đề nghị ngày khác'], [['I’m sorry, but', 'Mình xin lỗi, nhưng'], ['I can’t', 'Mình không thể'], ['because', 'vì'], ['How about', 'Hay là']], 25, 70,
      [[KW.sorry], [['because', 'have to', 'must', 'ill$', 'sick', 'work', 'busy', 'as i$', 'since', 'need to', 'my mother', 'my father']], [['how about', 'what about', 'can we', 'could we', 'shall we', 'another day', 'instead', 'next', "let's", 'lets', 'are you free'], ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'weekend', 'next week', 'another day', 'day']]]),
    W('g-a2-2-w2', 'A2', 'The Rainy Bus Stop', 'Trạm xe buýt ngày mưa',
      'Write the story from these three scenes. Scene 1: Nam is waiting at a bus stop and it starts to rain heavily. Scene 2: A woman next to him shares her umbrella. Scene 3: On the bus, they talk and find they work in the same building. Write 35 words or more.',
      'Kể lại câu chuyện theo ba cảnh (≥ 35 từ): Nam chờ xe buýt thì mưa to; một người phụ nữ cho đi chung ô; lên xe nói chuyện mới biết làm cùng tòa nhà.',
      ['Cảnh 1: chờ xe buýt, mưa to', 'Cảnh 2: đi chung ô', 'Cảnh 3: làm cùng tòa nhà', 'Dùng thì quá khứ'], [['was waiting', 'đang chờ'], ['suddenly', 'bỗng nhiên'], ['Later', 'Sau đó'], ['They found out that', 'Họ phát hiện ra rằng']], 35, 90,
      [[['bus'], ['rain']], [['umbrella']], [['same', 'together'], ['building', 'office', 'company', 'work']], [['@past']]]),
    S('g-a2-2-s1', 'A2', 'Work, Study and Food', 'Công việc, học tập và món ăn',
      'Answer these questions. What do you do, and what do you like about it? What did you do last weekend? What is your favourite food, and can you cook it? What are your plans for next month?',
      'Trả lời: bạn làm gì và thích gì ở việc đó; cuối tuần trước làm gì; món ăn yêu thích, có tự nấu được không; kế hoạch tháng tới.',
      ['Công việc / việc học + điều thích', 'Cuối tuần trước (thì quá khứ)', 'Món ăn yêu thích', 'Kế hoạch tháng tới (tương lai)'], [['I work as', 'Tôi làm nghề'], ['Last weekend, I', 'Cuối tuần trước tôi'], ['My favourite food is', 'Món tôi thích nhất là'], ['Next month, I’m going to', 'Tháng tới tôi sẽ']], 30,
      [[['work', 'job', 'student', 'study', 'teach', 'engineer', 'doctor', 'nurse', 'office', 'worker', 'manager', 'driver', 'shop', 'farmer'], KW.like], [['last weekend', 'saturday', 'sunday'], ['@past']], [['favourite', 'favorite', 'love', 'like', 'best'], KW.food], [['going to', 'will', 'plan', 'want to', 'would like', 'hope', "i'd like", "i'm"], ['next month', 'month']]]),
  ],
};

export interface WsOut { id: string; kind: 'w' | 's'; pct: number; words: number; typed?: boolean; ideas?: Array<[string, boolean]> }   // v161 typed: Nói gõ lại; ideas: ✓ / ✗ từng ý

// v161 Viết = 50% ý máy tìm thấy + 50% luật (writeChecks của app: độ dài, đoạn, từ nối, cụm của đề, lặp từ, độ dài câu, viết hoa / dấu câu):
// không có ý nào thì tối đa 50% (< GATE.ws), nên viết đúng hình thức mà lạc đề không đậu. Nói = 70% ý + 30% đủ số từ (lời máy chép).
// Bài lưu từ bản cũ không có từ khoá (k) thì ý tính 0.
export function wsPct(t: GwTask, text: string, checks: Array<[boolean, string]>): number {
  const hit = ideaHits(t, text), ideas = t.c.length ? hit.filter(Boolean).length / t.c.length : 0, words = wordsOf(text);
  if (t.kind === 'w') { const rule = checks.length ? checks.filter(([ok]) => ok).length / checks.length : 0; return Math.round((0.5 * rule + 0.5 * ideas) * 100) / 100; }
  return Math.round(((words >= t.min ? 0.3 : 0.3 * Math.min(1, words / Math.max(1, t.min))) + 0.7 * ideas) * 100) / 100;
}
export const wordsOf = (s: string): number => (s.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []).length;

// Lên cấp sau khi qua thi chuyển cấp (người sáng lập: tự lên cấp).
export const NEXT_LV: Record<string, string> = { 'cefr-pre-a1': 'cefr-a1', 'cefr-a1': 'cefr-a2', 'cefr-a2': 'cefr-b1', 'cefr-b1': 'cefr-b2' };
