// v140 Thi chuyển cấp: phần Viết + Nói (người sáng lập 16/10/2026 chọn "đủ 4 kỹ năng ngay"). Đọc + Nghe quyết định bằng IRT
// (gate.ts); Viết / Nói chấm bằng luật + tự chấm. v158 (người sáng lập 17/10/2026): Viết / Nói vào phán quyết, mỗi bài ≥ GATE.ws (gatePassAll).
// Bài soạn mới theo dạng công khai của A2 Key (Viết: tin nhắn ≥ 25 từ trả lời 3 ý, chuyện ngắn ≥ 35 từ theo 3 cảnh; Nói: trả lời câu hỏi
// về bản thân). A1 là bản nhẹ hơn. Bài lạ: không trùng Viết theo đề / Nói theo đề ở Kỹ năng. Mỗi bộ đi với một bộ Đọc + Nghe (cùng mã).
// Do AI soạn, chưa người thật soát (như phần Đọc + Nghe). Thuần dữ liệu + hàm.

export interface GwTask {
  id: string; kind: 'w' | 's'; lv: 'A1' | 'A2';
  en: string; vi: string;
  p: string; pv: string;              // đề tiếng Anh + lời dặn tiếng Việt
  c: string[];                        // ý phải có (tự đánh dấu)
  u: Array<[string, string]>;         // cụm hữu ích (luật Viết đếm cụm đã dùng)
  min: number; max: number; par: number; reg: 'i';
}
const W = (id: string, lv: GwTask['lv'], en: string, vi: string, p: string, pv: string, c: string[], u: Array<[string, string]>, min: number, max: number): GwTask =>
  ({ id, kind: 'w', lv, en, vi, p, pv, c, u, min, max, par: 1, reg: 'i' });
const S = (id: string, lv: GwTask['lv'], en: string, vi: string, p: string, pv: string, c: string[], u: Array<[string, string]>, min: number): GwTask =>
  ({ id, kind: 's', lv, en, vi, p, pv, c, u, min, max: 200, par: 1, reg: 'i' });

export const GATE_WS: Record<string, GwTask[]> = {
  'a1-1': [
    W('g-a1-1-w1', 'A1', 'A Note to Your Neighbour', 'Lời nhắn cho hàng xóm',
      'You are going away for the weekend. Write a note to your neighbour, Ana. Ask her to water your plants. Say when you will come back. Say thank you.',
      'Bạn đi vắng cuối tuần. Viết lời nhắn cho hàng xóm Ana: nhờ tưới cây, nói khi nào bạn về, cảm ơn.',
      ['Nhờ tưới cây', 'Khi nào bạn về', 'Lời cảm ơn'], [['Can you', 'Bạn có thể'], ['water my plants', 'tưới cây của tôi'], ['I will be back on', 'Tôi sẽ về vào'], ['Thank you', 'Cảm ơn']], 20, 60),
    W('g-a1-1-w2', 'A1', 'My Bag', 'Cái túi của tôi',
      'Describe your bag. What colour is it? What is in it today? Where did you get it?',
      'Tả cái túi của bạn: màu gì, hôm nay trong túi có gì, bạn có nó ở đâu.',
      ['Màu của túi', 'Ít nhất ba thứ trong túi', 'Bạn có túi ở đâu'], [['My bag is', 'Túi của tôi màu'], ['There is', 'Có một'], ['There are', 'Có những'], ['I got it from', 'Tôi có nó từ']], 25, 60),
    S('g-a1-1-s1', 'A1', 'About Your Day', 'Một ngày của bạn',
      'Answer these questions. What time do you get up? What do you eat for breakfast? How do you go to work or school? What do you do in the evening?',
      'Trả lời: mấy giờ bạn dậy, ăn sáng gì, đi làm / đi học bằng gì, buổi tối làm gì.',
      ['Giờ dậy', 'Bữa sáng', 'Cách đi làm / đi học', 'Buổi tối'], [['I get up at', 'Tôi dậy lúc'], ['For breakfast, I have', 'Bữa sáng tôi ăn'], ['I go to work by', 'Tôi đi làm bằng'], ['In the evening, I', 'Buổi tối tôi']], 20),
  ],
  'a1-2': [
    W('g-a1-2-w1', 'A1', 'Meet Me at the Café', 'Hẹn ở quán cà phê',
      'Write a message to your friend, Tom. Invite him to a café. Say the day and the time. Say what you want to drink.',
      'Viết tin nhắn cho bạn Tom: mời đi cà phê, nói ngày giờ, nói bạn muốn uống gì.',
      ['Lời mời', 'Ngày và giờ', 'Đồ uống bạn muốn'], [['Do you want to', 'Bạn có muốn'], ['Let’s meet at', 'Mình gặp nhau lúc'], ['on Saturday', 'vào thứ Bảy'], ['I want a', 'Tôi muốn một']], 20, 60),
    W('g-a1-2-w2', 'A1', 'My Street', 'Con phố của tôi',
      'Describe the street where you live. Is it big or small? What shops are there? What do you like about it?',
      'Tả con phố bạn sống: to hay nhỏ, có những cửa hàng gì, bạn thích điều gì ở đó.',
      ['To hay nhỏ', 'Ít nhất hai cửa hàng / nơi', 'Điều bạn thích'], [['I live on', 'Tôi sống ở phố'], ['It is', 'Nó'], ['There is a', 'Có một'], ['I like it because', 'Tôi thích vì']], 25, 60),
    S('g-a1-2-s1', 'A1', 'Your Family and Home', 'Gia đình và nhà bạn',
      'Answer these questions. Who do you live with? What is your home like? What do you like doing at home? Who cooks in your family?',
      'Trả lời: bạn sống với ai, nhà bạn thế nào, ở nhà bạn thích làm gì, ai nấu ăn trong nhà.',
      ['Sống với ai', 'Nhà thế nào', 'Thích làm gì ở nhà', 'Ai nấu ăn'], [['I live with', 'Tôi sống với'], ['My home is', 'Nhà tôi'], ['At home, I like', 'Ở nhà tôi thích'], ['usually cooks', 'thường nấu ăn']], 20),
  ],
  'a2-1': [
    W('g-a2-1-w1', 'A2', 'Borrowing a Bike', 'Mượn xe đạp',
      'Your English friend, Sam, has a bike. You want to borrow it on Saturday. Write an email to Sam. In your email: ask to borrow the bike; say why you need it; say when you will give it back. Write 25 words or more.',
      'Viết email cho Sam (≥ 25 từ): hỏi mượn xe đạp thứ Bảy, nói vì sao cần, nói khi nào trả.',
      ['Hỏi mượn xe', 'Lý do cần xe', 'Khi nào trả'], [['Could I borrow', 'Mình mượn … được không'], ['because', 'vì'], ['I need it to', 'Mình cần nó để'], ['I’ll give it back on', 'Mình sẽ trả vào']], 25, 70),
    W('g-a2-1-w2', 'A2', 'The Lost Dog', 'Chú chó đi lạc',
      'Write the story from these three scenes. Scene 1: Linh is walking in the park and sees a small dog alone. Scene 2: She reads the name on its collar and phones the number. Scene 3: An old man arrives and is very happy. Write 35 words or more.',
      'Kể lại câu chuyện theo ba cảnh (≥ 35 từ): Linh thấy chú chó lạc ở công viên; cô gọi số trên vòng cổ; một ông cụ đến, rất vui.',
      ['Cảnh 1: thấy chó ở công viên', 'Cảnh 2: gọi số trên vòng cổ', 'Cảnh 3: ông cụ đến, vui', 'Dùng thì quá khứ'], [['One day', 'Một hôm'], ['was walking', 'đang đi dạo'], ['Then', 'Sau đó'], ['In the end', 'Cuối cùng']], 35, 90),
    S('g-a2-1-s1', 'A2', 'Free Time and Holidays', 'Thời gian rảnh và kỳ nghỉ',
      'Answer these questions. What do you usually do at the weekend? Tell me about a place you visited last year. What would you like to learn next year? Do you prefer the city or the countryside? Why?',
      'Trả lời: cuối tuần thường làm gì; kể một nơi bạn đến năm ngoái; năm tới muốn học gì; thích thành phố hay nông thôn, vì sao.',
      ['Cuối tuần', 'Một nơi đã đến (thì quá khứ)', 'Điều muốn học', 'Thành phố hay nông thôn + lý do'], [['At the weekend, I usually', 'Cuối tuần tôi thường'], ['Last year, I went to', 'Năm ngoái tôi đã đến'], ['I’d like to learn', 'Tôi muốn học'], ['I prefer … because', 'Tôi thích … hơn vì']], 30),
  ],
  'a2-2': [
    W('g-a2-2-w1', 'A2', 'Changing Our Plan', 'Đổi kế hoạch',
      'You and your friend, Kim, planned to see a film tonight, but you can’t go. Write a message to Kim. In your message: say sorry; explain why you can’t go; suggest another day. Write 25 words or more.',
      'Viết tin nhắn cho Kim (≥ 25 từ): xin lỗi, giải thích vì sao không đi xem phim tối nay được, đề nghị ngày khác.',
      ['Lời xin lỗi', 'Lý do không đi được', 'Đề nghị ngày khác'], [['I’m sorry, but', 'Mình xin lỗi, nhưng'], ['I can’t', 'Mình không thể'], ['because', 'vì'], ['How about', 'Hay là']], 25, 70),
    W('g-a2-2-w2', 'A2', 'The Rainy Bus Stop', 'Trạm xe buýt ngày mưa',
      'Write the story from these three scenes. Scene 1: Nam is waiting at a bus stop and it starts to rain heavily. Scene 2: A woman next to him shares her umbrella. Scene 3: On the bus, they talk and find they work in the same building. Write 35 words or more.',
      'Kể lại câu chuyện theo ba cảnh (≥ 35 từ): Nam chờ xe buýt thì mưa to; một người phụ nữ cho đi chung ô; lên xe nói chuyện mới biết làm cùng tòa nhà.',
      ['Cảnh 1: chờ xe buýt, mưa to', 'Cảnh 2: đi chung ô', 'Cảnh 3: làm cùng tòa nhà', 'Dùng thì quá khứ'], [['was waiting', 'đang chờ'], ['suddenly', 'bỗng nhiên'], ['Later', 'Sau đó'], ['They found out that', 'Họ phát hiện ra rằng']], 35, 90),
    S('g-a2-2-s1', 'A2', 'Work, Study and Food', 'Công việc, học tập và món ăn',
      'Answer these questions. What do you do, and what do you like about it? What did you do last weekend? What is your favourite food, and can you cook it? What are your plans for next month?',
      'Trả lời: bạn làm gì và thích gì ở việc đó; cuối tuần trước làm gì; món ăn yêu thích, có tự nấu được không; kế hoạch tháng tới.',
      ['Công việc / việc học + điều thích', 'Cuối tuần trước (thì quá khứ)', 'Món ăn yêu thích', 'Kế hoạch tháng tới (tương lai)'], [['I work as', 'Tôi làm nghề'], ['Last weekend, I', 'Cuối tuần trước tôi'], ['My favourite food is', 'Món tôi thích nhất là'], ['Next month, I’m going to', 'Tháng tới tôi sẽ']], 30),
  ],
};

export interface WsOut { id: string; kind: 'w' | 's'; pct: number; words: number }

// Viết: tỉ lệ tiêu chí luật đạt (writeChecks của app: độ dài, đoạn, từ nối, cụm của đề, lặp từ, độ dài câu, viết hoa / dấu câu)
// trộn với ý đã đủ do người học tự đánh dấu (luật không đọc được ý). Nói: đủ số từ (từ máy nghe hoặc tự gõ lại) + ý đã nói.
export function wsPct(t: GwTask, words: number, checks: Array<[boolean, string]>, self: boolean[]): number {
  const ideas = t.c.length ? self.filter(Boolean).length / t.c.length : 0;
  if (t.kind === 'w') { const rule = checks.length ? checks.filter(([ok]) => ok).length / checks.length : 0; return Math.round((0.6 * rule + 0.4 * ideas) * 100) / 100; }
  return Math.round(((words >= t.min ? 0.3 : 0.3 * Math.min(1, words / Math.max(1, t.min))) + 0.7 * ideas) * 100) / 100;
}
export const wordsOf = (s: string): number => (s.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []).length;

// Lên cấp sau khi qua thi chuyển cấp (người sáng lập: tự lên cấp).
export const NEXT_LV: Record<string, string> = { 'cefr-pre-a1': 'cefr-a1', 'cefr-a1': 'cefr-a2', 'cefr-a2': 'cefr-b1', 'cefr-b1': 'cefr-b2' };
