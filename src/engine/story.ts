// v101 Cốt truyện "Phố Chữ mất tiếng" (GAME-CRITERIA §10.13): nối ba game chủ lực bằng một câu chuyện.
// Sương Câm phủ Phố, cư dân mất lời nói. Mỗi chương có ba nhiệm vụ trải trên ba game: ⛏️ đào chữ (từ tìm ở Mỏ Chữ), 🎡 thắp đèn
// (thắng màn Vòng Chữ), 🃏 trả câu nói (câu đúng ở Bài Câu). Đủ thì xem cảnh truyện: cư dân nói lại (tiếng Anh đúng cấp A1, có dịch) và
// một khu Phố hồi sinh. Chương cuối mỗi khu cần thêm số kỹ năng VỮNG thật trên bản đồ năng lực (truyện thưởng cho việc học thật).
// Không ghi bằng chứng, không đổi câu hỏi hay lộ trình, không chặn chơi (P13, P14, C69).
// v128 (GAME-CRITERIA §14): bí ẩn Mờ + cú lật, 3 lựa chọn, câu người chơi tự nói, kỷ vật, khu 4 Phố Đêm và cảnh kết (hết mùa 1).

export type StoryKind = 'dig' | 'light' | 'voice';
// v128 khung truyện mới: me = câu NGƯỜI CHƠI tự nói / gõ để trả lời cho cư dân (không bắt buộc, không chặn truyện);
// pick = lựa chọn (cờ f1 / f2 / f3, đổi lời thoại về sau và cảnh kết); if = chỉ hiện khi cờ có giá trị đó.
export interface Line { who: string; en: string; vi: string; me?: 1; pick?: { f: StoryFlag; opts: Array<[string, string, string]> }; if?: [StoryFlag, string] }
export interface Clue { ico: string; name: string; vi: string }
export interface Chapter { act: number; title: string; who: string; intro: string; need: Record<StoryKind, number>; solid?: number; scene: Line[]; clue?: Clue }
export type StoryFlag = 'f1' | 'f2' | 'f3';
export const FLAGS: Record<StoryFlag, string[]> = { f1: ['truth', 'secret'], f2: ['loud', 'soft'], f3: ['book', 'song', 'flower'] };
export const ACTS = ['Mở đầu', 'Khu Chợ Sáng', 'Bến Cảng', 'Rừng Trúc', 'Phố Đêm'] as const;
export const ACT_BG: Array<[string, string]> = [['#3b2f63', '#120c26'], ['#ff9a62', '#7b4fd6'], ['#2bc0e4', '#1b3b8f'], ['#56ab2f', '#1d4d2b'], ['#5b3fa8', '#0b0820']];
// Tiếng Anh lớn lên theo khu (S10): số từ tối đa mỗi câu thoại của từng khu (test kiểm).
export const ACT_WORDS = [10, 10, 12, 14, 16] as const;
export const KIND_VI: Record<StoryKind, { ico: string; vi: string; game: string; start: string }> = {
  dig: { ico: '⛏️', vi: 'Đào viên chữ ở Mỏ Chữ', game: 'Mỏ Chữ', start: 'hnstart' },
  light: { ico: '🎡', vi: 'Thắp đèn: qua màn Vòng Chữ', game: 'Vòng Chữ', start: 'whstart' },
  voice: { ico: '🃏', vi: 'Trả câu nói: câu đúng ở Bài Câu, câu khách hiểu ở Quán Phố Chữ', game: 'Bài Câu', start: 'cdstart' },
};
// Mỗi khu dạy một cách "trả câu nói" (S4, S5): Chợ = xếp câu, Bến Cảng = nói ở Quán, Rừng Trúc = tự đặt câu hỏi, Phố Đêm = nói ở Quán.
// Câu đúng ở cả ba game đều được tính; nút chỉ dẫn sang game của khu.
const VOICE_BY_ACT: Record<number, { ico: string; vi: string; start: string }> = {
  2: { ico: '🗣️', vi: 'Trả câu nói: nói (hoặc gõ) cho khách hiểu ở Quán Phố Chữ', start: 'tkstart' },
  3: { ico: '🔎', vi: 'Trả câu nói: tự đặt câu hỏi ở Hỏi chuyện nhân chứng', start: 'akstart' },
  4: { ico: '🗣️', vi: 'Trả câu nói: nói (hoặc gõ) cho khách hiểu ở Quán Phố Chữ', start: 'tkstart' },
};
export const kindOf = (k: StoryKind, act: number): { ico: string; vi: string; start: string } => (k === 'voice' && VOICE_BY_ACT[act]) || KIND_VI[k];
const N = (dig: number, light: number, voice: number): Record<StoryKind, number> => ({ dig, light, voice });
const ME = '🙋 Bạn';

// v128 Cốt truyện "Phố Chữ mất tiếng" bản đầy đủ (GAME-CRITERIA §14): Sương Câm là Mờ, một bạn nhỏ từng nói sai ("I love rice" nghe
// thành "lice") và bị cả lớp cười, Tí cười to nhất. Mờ thôi nói; im lặng lớn thành sương nuốt lời cả phố "để không ai bị cười nữa".
// Mỗi chương cho một kỷ vật (mảnh bí ẩn); giữa truyện Tí thú nhận; ba lựa chọn đổi cảnh kết; trùm cuối là một cuộc nói chuyện.
export const CHAPTERS: Chapter[] = [
  { act: 0, title: 'Sương Câm', who: '🐯 Tí', intro: 'Một buổi sáng, Phố Chữ im bặt.', need: N(0, 0, 0),
    clue: { ico: '🧱', name: 'Câu xoá dở', vi: '“Please don’t laugh at…” viết trên tường phố. Phần sau đã bị Sương xoá.' }, scene: [
    { who: '🐯 Tí', en: "Hello! I'm Tí.", vi: 'Xin chào! Mình là Tí.' },
    { who: '🐯 Tí', en: 'A Silent Fog came. People lost their words.', vi: 'Sương Câm kéo đến. Mọi người mất hết lời nói.' },
    { who: '🧱 Bức tường', en: "Please don't laugh at…", vi: 'Làm ơn đừng cười… (phần sau đã bị xoá)' },
    { who: '🐯 Tí', en: "Who wrote this? I… I don't know.", vi: 'Ai viết vậy nhỉ? Mình… mình không biết.' },
    { who: '🐯 Tí', en: 'Dig letters, light lamps, give back words. Help me?', vi: 'Đào chữ, thắp đèn, trả lại lời nói. Bạn giúp mình nhé?' },
  ] },
  // Khu 1 · Chợ Sáng (A1, câu ≤ 10 từ)
  { act: 1, title: 'Hoa không tên', who: '🌸 Bà Lan', intro: 'Bà Lan bán hoa không gọi được tên hoa.', need: N(3, 1, 2) /* chương 1 xong được ngay buổi đầu: móc kéo quay lại */,
    clue: { ico: '🩶', name: 'Lời kể của Bà Lan', vi: 'Đêm trước Sương đến, một đứa nhỏ màu xám ngồi khóc ở góc chợ.' }, scene: [
    { who: '🌸 Bà Lan', en: 'Flowers… fresh… Oh no, I forgot the names!', vi: 'Hoa… tươi… Ôi, bà quên mất tên hoa rồi!' },
    { who: ME, me: 1, en: 'Roses and lilies! Fresh flowers!', vi: 'Hồng và loa kèn! Hoa tươi đây!' },
    { who: '🌸 Bà Lan', en: 'Yes! Thank you, dear. I can say them again.', vi: 'Đúng rồi! Cảm ơn cháu. Bà gọi lại được rồi.' },
    { who: '🌸 Bà Lan', en: 'Last night, I saw a small grey child crying.', vi: 'Đêm qua bà thấy một đứa nhỏ màu xám ngồi khóc.' },
    { who: '🐯 Tí', en: "A grey child? Let's find out more.", vi: 'Đứa nhỏ màu xám? Mình tìm hiểu thêm nhé.' },
  ] },
  { act: 1, title: 'Bánh mì im lặng', who: '🥖 Chú Tư', intro: 'Tiệm bánh mì đông khách mà không ai gọi món được.', need: N(6, 1, 3),
    clue: { ico: '📄', name: 'Trang vở gạch đỏ', vi: 'Chữ “I love rice” bị gạch đỏ. Bên cạnh có ai viết “lice!” và vẽ mặt cười.' }, scene: [
    { who: '🥖 Chú Tư', en: 'Good morning! Bread, one dollar.', vi: 'Chào buổi sáng! Bánh mì, một đô.' },
    { who: '👦 Bé Bin', en: "Can… can I… Sorry. I'm scared to talk.", vi: 'Cho… cho cháu… Thôi ạ. Cháu sợ nói lắm.' },
    { who: ME, me: 1, en: 'Can I have two, please?', vi: 'Cho cháu hai ổ ạ?' },
    { who: '🥖 Chú Tư', en: 'Of course! Here you are.', vi: 'Được chứ! Của cháu đây.' },
    { who: '👦 Bé Bin', en: 'Look! I found this paper under the table.', vi: 'Nhìn này! Cháu nhặt được tờ giấy dưới bàn.' },
    { who: '🐯 Tí', en: 'Rice… lice… Oh no.', vi: 'Rice (cơm)… lice (chấy)… Ôi không.' },
  ] },
  { act: 1, title: 'Bé Bin lạc đường', who: '👦 Bé Bin', intro: 'Biển chỉ đường mất chữ, bé Bin không tìm thấy mẹ.', need: N(8, 2, 3),
    clue: { ico: '🧣', name: 'Khăn len xám', vi: 'Mắc ở biển Lối ra. Nhỏ như khăn trẻ con, lạnh như sương.' }, scene: [
    { who: '👦 Bé Bin', en: 'Where is my mom?', vi: 'Mẹ cháu đâu rồi?' },
    { who: '🐯 Tí', en: 'Read the sign, Bin. You can do it!', vi: 'Đọc biển đi Bin. Em làm được mà!' },
    { who: '👦 Bé Bin', en: "It says… 'E-xit'. Exit!", vi: "Biển ghi… 'Lối… ra'. Lối ra!" },
    { who: ME, me: 1, en: 'Good job, Bin! Go to the exit.', vi: 'Giỏi lắm Bin! Đi ra lối ra nào.' },
    { who: '👩 Mẹ Bin', en: "Bin! I'm here! Did you read it yourself?", vi: 'Bin ơi! Mẹ đây! Con tự đọc được à?' },
    { who: '👦 Bé Bin', en: 'Yes! I was scared, but I did it.', vi: 'Dạ! Con sợ lắm, nhưng con làm được rồi.' },
  ] },
  { act: 1, title: 'Chợ Sáng thức giấc', who: '🐯 Tí', intro: 'Gom đủ lời nói để cả khu chợ thức giấc.', need: N(10, 2, 4), solid: 2,
    clue: { ico: '👣', name: 'Dấu chân xám', vi: 'Những dấu chân nhỏ màu xám đi từ chợ về phía bến cảng.' }, scene: [
    { who: '🐯 Tí', en: 'Listen! The market is talking again.', vi: 'Nghe kìa! Chợ lại rộn tiếng nói.' },
    { who: ME, me: 1, en: 'Good morning, everyone!', vi: 'Chào buổi sáng mọi người!' },
    { who: '🌸 Bà Lan', en: "We're so happy. Thank you, friend!", vi: 'Chúng tôi vui lắm. Cảm ơn bạn!' },
    { who: '🐯 Tí', en: 'Look. Small grey footprints. They go to the harbour.', vi: 'Nhìn kìa. Dấu chân nhỏ màu xám. Chúng đi về bến cảng.' },
  ] },
  // Khu 2 · Bến Cảng (A1–A2, câu ≤ 12 từ)
  { act: 2, title: 'Ông Ba và tấm lưới', who: '🎣 Ông Ba', intro: 'Thuyền đã sẵn, ông Ba không gọi được bạn thuyền.', need: N(8, 2, 3),
    clue: { ico: '🪢', name: 'Sợi lưới xám', vi: 'Ông Ba nhặt trên thuyền: lạnh và ẩm như sương.' }, scene: [
    { who: '🎣 Ông Ba', en: "My boat is ready, but I can't call my friends.", vi: 'Thuyền sẵn rồi mà ông không gọi được bạn thuyền.' },
    { who: ME, me: 1, en: "Come on, everyone! Let's go fishing!", vi: 'Nào mọi người! Đi đánh cá thôi!' },
    { who: '🎣 Ông Ba', en: "That's it! Thank you. My voice is back.", vi: 'Đúng rồi! Cảm ơn cháu. Ông nói lại được rồi.' },
    { who: '🎣 Ông Ba', en: 'A grey child sat on my boat last night. So quiet.', vi: 'Đêm qua có đứa nhỏ màu xám ngồi trên thuyền ông. Lặng thinh.' },
    { who: '👦 Bé Bin', en: 'Tí, why are you so quiet today?', vi: 'Anh Tí, sao hôm nay anh im lặng thế?' },
    { who: '🐯 Tí', en: "It's nothing. Let's go.", vi: 'Không có gì đâu. Đi thôi.' },
  ] },
  { act: 2, title: 'Bảng giờ tàu trắng trơn', who: '🎫 Cô Ngân', intro: 'Bảng giờ tàu mất hết chữ số.', need: N(9, 2, 4),
    clue: { ico: '🎟️', name: 'Vé một chiều', vi: 'Vé tàu một chiều tới Rừng Trúc. Người mua chỉ ký một chữ: “M”.' }, scene: [
    { who: '🎫 Cô Ngân', en: 'The board is empty. Nobody knows the times!', vi: 'Bảng trống trơn. Không ai biết giờ tàu!' },
    { who: ME, me: 1, en: "The next boat leaves at nine o'clock.", vi: 'Chuyến tàu tới rời bến lúc chín giờ.' },
    { who: '👦 Bé Bin', en: 'How much is a ticket?', vi: 'Vé bao nhiêu tiền ạ?' },
    { who: '🎫 Cô Ngân', en: "It's three dollars. Oh! I remember something.", vi: 'Ba đô cháu nhé. À! Cô nhớ ra một chuyện.' },
    { who: '🎫 Cô Ngân', en: 'A grey child bought a one-way ticket to the forest.', vi: 'Một đứa nhỏ màu xám mua vé một chiều đi rừng trúc.' },
  ] },
  { act: 2, title: 'Ngọn hải đăng tắt', who: '🗼 Ông Hải', intro: 'Đèn biển tắt, tàu không thấy đá ngầm.', need: N(10, 3, 4),
    clue: { ico: '🔭', name: 'Tranh vẽ của Ông Hải', vi: 'Một khuôn mặt nhỏ giữa màn sương: buồn, không giận.' }, scene: [
    { who: '🗼 Ông Hải', en: "The light is off. Ships can't see the rocks.", vi: 'Đèn tắt rồi. Tàu không thấy đá ngầm.' },
    { who: '🐯 Tí', en: "Words are light! Let's turn it on.", vi: 'Chữ chính là ánh sáng! Bật đèn lên nào.' },
    { who: ME, me: 1, en: 'Turn on the light, please!', vi: 'Bật đèn lên nào!' },
    { who: '🗼 Ông Hải', en: "It's on! The ships are safe now.", vi: 'Sáng rồi! Tàu an toàn rồi.' },
    { who: '🗼 Ông Hải', en: 'From up here, I saw it. The fog has a face.', vi: 'Từ trên này ông thấy rồi. Sương Câm có khuôn mặt.' },
    { who: '🗼 Ông Hải', en: 'It looked sad, not angry.', vi: 'Trông nó buồn, chứ không giận.' },
  ] },
  { act: 2, title: 'Bến Cảng lên đèn', who: '🐯 Tí', intro: 'Thắp sáng cả bến cảng trong đêm. Tí có chuyện muốn nói.', need: N(12, 3, 5), solid: 5,
    clue: { ico: '📸', name: 'Ảnh cũ: Tí và Mờ', vi: 'Hai bạn nhỏ cười bên cửa lớp học. Mặt sau ghi: “Best friends”.' }, scene: [
    { who: '🎣 Ông Ba', en: "Look at the sea. It's beautiful tonight.", vi: 'Nhìn biển kìa. Đêm nay đẹp quá.' },
    { who: '🐯 Tí', en: 'Friend, I have to tell you something.', vi: 'Bạn ơi, mình phải kể bạn nghe một chuyện.' },
    { who: '🐯 Tí', en: "The fog has a name. It's Mờ. It was my friend.", vi: 'Sương có tên. Tên nó là Mờ. Nó từng là bạn mình.' },
    { who: '🐯 Tí', en: "Mờ said 'I love rice', but it sounded like 'lice'.", vi: "Mờ nói 'I love rice' (con thích cơm), mà nghe thành 'lice' (chấy)." },
    { who: '🐯 Tí', en: 'Everyone laughed. I laughed the loudest. Mờ never spoke again.', vi: 'Cả lớp cười. Mình cười to nhất. Mờ không bao giờ nói nữa.' },
    { who: '👦 Bé Bin', en: 'So the fog is… a sad child?', vi: 'Vậy Sương Câm là… một bạn nhỏ đang buồn?' },
    { who: ME, me: 1, en: 'Tí, thank you for telling me the truth.', vi: 'Tí ơi, cảm ơn cậu đã nói thật với mình.' },
    { who: '🐯 Tí', en: 'Should we tell everyone the truth?', vi: 'Mình có nên kể sự thật cho mọi người không?', pick: { f: 'f1', opts: [
      ["Yes. Let's tell everyone the truth.", 'Có. Kể cho mọi người sự thật.', 'truth'],
      ["Not yet. Let's keep it a secret.", 'Chưa. Giữ bí mật đã.', 'secret'],
    ] } },
    { who: '🎫 Cô Ngân', if: ['f1', 'truth'], en: "Thank you for telling us. We'll help Mờ too.", vi: 'Cảm ơn cháu đã kể. Cả bến sẽ cùng giúp Mờ.' },
    { who: '🐯 Tí', if: ['f1', 'secret'], en: "Thank you. I'm not ready yet.", vi: 'Cảm ơn bạn. Mình chưa sẵn sàng.' },
    { who: '🐯 Tí', en: "Mờ went to the bamboo forest. Let's go.", vi: 'Mờ đã đi về rừng trúc. Mình đi thôi.' },
  ] },
  // Khu 3 · Rừng Trúc (A2, câu ≤ 14 từ)
  { act: 3, title: 'Thư viện không chữ', who: '📚 Thầy Minh', intro: 'Sách trong thư viện trắng trơn, cả những cuốn nhật ký cũ.', need: N(10, 3, 5),
    clue: { ico: '📓', name: 'Nhật ký của Mờ', vi: '“Ngày 1: Họ cười. Ngày 2: Mình không nói. Ngày 30: Không ai nói thì không ai bị cười.”' }, scene: [
    { who: '📚 Thầy Minh', en: 'All my books are empty! Even the old diaries.', vi: 'Sách của thầy trắng trơn cả! Cả mấy cuốn nhật ký cũ.' },
    { who: ME, me: 1, en: 'Once upon a time, there was a little cloud.', vi: 'Ngày xửa ngày xưa, có một đám mây nhỏ.' },
    { who: '📚 Thầy Minh', en: 'The words are back! And look, this diary has a name: Mờ.', vi: 'Chữ về rồi! Mà xem này, cuốn nhật ký này ghi tên: Mờ.' },
    { who: '📚 Thầy Minh', en: "'Day 1: They laughed. Day 2: I didn't speak.'", vi: "'Ngày 1: Họ cười. Ngày 2: Mình không nói.'" },
    { who: '📚 Thầy Minh', en: "'Day 30: If nobody speaks, nobody gets laughed at.'", vi: "'Ngày 30: Nếu không ai nói, sẽ không ai bị cười.'" },
    { who: '👦 Bé Bin', en: "That's why the fog takes words. Mờ wants to protect everyone.", vi: 'Vì thế Sương mới lấy lời nói. Mờ muốn che chở mọi người.' },
  ] },
  { act: 3, title: 'Bài hát không lời', who: '🎵 Cô Chi', intro: 'Cô Chi muốn hát mà quên hết lời.', need: N(11, 3, 5),
    clue: { ico: '🎼', name: 'Bản nhạc của Mờ', vi: 'Bài hát buổi sáng Mờ hay hát ở lớp, nét chữ tròn trịa.' }, scene: [
    { who: '🎵 Cô Chi', en: "I want to sing, but I don't remember the words.", vi: 'Cô muốn hát mà không nhớ lời.' },
    { who: ME, me: 1, en: 'The sun is up, the sky is blue.', vi: 'Mặt trời lên, trời xanh trong.' },
    { who: '🎵 Cô Chi', en: '♪ The sun is up, the sky is blue ♪ Thank you!', vi: '♪ Mặt trời lên, trời xanh trong ♪ Cảm ơn cháu!' },
    { who: '🎵 Cô Chi', en: 'Mờ loved this song. Mờ sang it every morning in class.', vi: 'Mờ thích bài này lắm. Sáng nào ở lớp Mờ cũng hát.' },
    { who: '🐯 Tí', en: 'I remember. Mờ had the best voice in our class.', vi: 'Mình nhớ. Mờ hát hay nhất lớp.' },
  ] },
  { act: 3, title: 'Con đường trúc', who: '👦 Bé Bin', intro: 'Rừng trúc có hai ngả, biển chỉ đường mờ mịt.', need: N(12, 4, 5),
    clue: { ico: '🎋', name: 'Mũi tên phấn', vi: 'Trên thân trúc có một mũi tên nhỏ, nét run run, chỉ về phía chuông.' }, scene: [
    { who: '👦 Bé Bin', en: 'Which way? Left or right? The sign is in the fog.', vi: 'Đường nào? Trái hay phải? Biển chìm trong sương.' },
    { who: ME, me: 1, en: "The sign says: 'Bell, turn left.'", vi: "Biển ghi: 'Chuông, rẽ trái.'" },
    { who: '👦 Bé Bin', en: "Tí, can I tell you a secret? I'm afraid of mistakes too.", vi: 'Anh Tí, em kể anh bí mật nhé? Em cũng sợ nói sai.' },
    { who: '🐯 Tí', en: 'Me too, Bin. Maybe everyone is a little afraid.', vi: 'Anh cũng vậy, Bin. Có lẽ ai cũng sợ một chút.' },
    { who: '👦 Bé Bin', en: "Then I'll be brave first. Let's go left!", vi: 'Vậy em sẽ dũng cảm trước. Rẽ trái thôi!' },
  ] },
  { act: 3, title: 'Chuông Lời', who: '🐯 Tí', intro: 'Chuông Lời giữa rừng đã im tiếng từ lâu. Có ai đó đang trốn gần đây.', need: N(14, 4, 6), solid: 9,
    clue: { ico: '🔔', name: 'Tiếng Chuông Lời', vi: 'Chuông rung lần đầu sau nhiều năm. Cả rừng trúc nói lại được.' }, scene: [
    { who: '🐯 Tí', en: 'This is the Word Bell. It has been silent for years.', vi: 'Đây là Chuông Lời. Nó đã im lặng nhiều năm.' },
    { who: '🌫️ Mờ', en: "Go away… Please don't laugh at me again.", vi: 'Đi đi… Làm ơn đừng cười tớ nữa.' },
    { who: ME, me: 1, en: "Mờ, we won't laugh. We just want to say hello.", vi: 'Mờ ơi, bọn mình không cười đâu. Bọn mình chỉ muốn chào cậu.' },
    { who: '🐯 Tí', en: 'How should we ring the bell?', vi: 'Mình rung chuông thế nào đây?', pick: { f: 'f2', opts: [
      ['Ring it loud! Wake up the whole forest!', 'Rung thật to! Đánh thức cả rừng!', 'loud'],
      ['Ring it softly, like a hello.', 'Rung khẽ thôi, như một lời chào.', 'soft'],
    ] } },
    { who: '🌫️ Mờ', if: ['f2', 'loud'], en: 'Too loud! Too loud!', vi: 'Ồn quá! Ồn quá!' },
    { who: '🐯 Tí', if: ['f2', 'loud'], en: "Wait, Mờ! We're sorry!", vi: 'Khoan đã Mờ! Bọn mình xin lỗi!' },
    { who: '🌫️ Mờ', if: ['f2', 'soft'], en: '…Hello? I heard you. But I am not ready.', vi: '…Xin chào? Tớ nghe thấy rồi. Nhưng tớ chưa sẵn sàng.' },
    { who: '👥 Mọi người', en: 'One, two, three… Hello!', vi: 'Một, hai, ba… Xin chào!' },
    { who: '🐯 Tí', en: 'Mờ ran to the Night Street. We must go there.', vi: 'Mờ chạy về Phố Đêm. Mình phải tới đó.' },
  ] },
  // Khu 4 · Phố Đêm (A2–B1, câu ≤ 16 từ)
  { act: 4, title: 'Phố Đêm thì thầm', who: '🏮 Chị Hằng', intro: 'Ở Phố Đêm ai cũng chỉ dám thì thầm.', need: N(12, 4, 6),
    clue: { ico: '🏮', name: 'Đèn lồng đầu tiên', vi: 'Chị Hằng thắp chiếc đèn lồng đầu tiên sau nhiều năm, khi có người dám hỏi to.' }, scene: [
    { who: '🏮 Chị Hằng', en: 'Shh. Here, people only whisper. They are afraid of mistakes.', vi: 'Suỵt. Ở đây mọi người chỉ thì thầm. Họ sợ nói sai.' },
    { who: '👦 Bé Bin', en: "Look at the signs: 'Be quiet. No mistakes.'", vi: "Nhìn biển kìa: 'Giữ im lặng. Không được sai.'" },
    { who: ME, me: 1, en: 'Excuse me. Can I buy a lantern, please?', vi: 'Xin lỗi chị. Cho em mua một chiếc đèn lồng ạ?' },
    { who: '🏮 Chị Hằng', en: 'You asked so clearly, and nobody laughed. Maybe I can try too.', vi: 'Em hỏi rõ ràng quá, mà chẳng ai cười. Có lẽ chị cũng thử được.' },
    { who: '🏮 Chị Hằng', en: 'A grey child lives at the end of this street.', vi: 'Có một bạn nhỏ màu xám sống ở cuối phố này.' },
  ] },
  { act: 4, title: 'Bin nói trước', who: '👦 Bé Bin', intro: 'Anh Khoa rủ cả phố hát, mà không ai dám lên tiếng.', need: N(13, 4, 6),
    clue: { ico: '🎖️', name: 'Huy hiệu Dũng cảm', vi: 'Của Bé Bin: lần đầu nói trước đám đông, nói sai, và không ai cười.' }, scene: [
    { who: '🎸 Anh Khoa', en: 'Who wants to sing with me? Anyone? No?', vi: 'Ai muốn hát cùng anh không? Có ai không? Không à?' },
    { who: '👦 Bé Bin', en: 'Me! I… I goed to the market today!', vi: 'Em! Hôm nay em… đi chợ ạ! (Bin nói sai: goed)' },
    { who: '🎸 Anh Khoa', en: "You mean 'went'. Great try! Thank you for being brave.", vi: "Ý em là 'went'. Thử hay lắm! Cảm ơn em đã dũng cảm." },
    { who: ME, me: 1, en: 'Well done, Bin! Mistakes help us learn.', vi: 'Giỏi lắm Bin! Nói sai giúp mình học.' },
    { who: '👦 Bé Bin', en: 'Nobody laughed! I want to speak more and more!', vi: 'Không ai cười cả! Em muốn nói nhiều hơn nữa!' },
  ] },
  { act: 4, title: 'Món quà cho Mờ', who: '🐯 Tí', intro: 'Ngày mai gặp Mờ. Mang theo món quà gì đây?', need: N(14, 5, 6),
    clue: { ico: '🎁', name: 'Món quà cho Mờ', vi: 'Món quà bạn chọn, gói bằng giấy của tiệm bánh Chú Tư.' }, scene: [
    { who: '🐯 Tí', en: 'Tomorrow we meet Mờ. What gift should we bring?', vi: 'Mai mình gặp Mờ. Mình nên mang quà gì?', pick: { f: 'f3', opts: [
      ['A new notebook, for new words.', 'Một cuốn vở mới, để viết chữ mới.', 'book'],
      ["Mờ's old song, to sing together.", 'Bài hát cũ của Mờ, để cùng hát.', 'song'],
      ["Fresh flowers from Bà Lan's shop.", 'Hoa tươi từ sạp Bà Lan.', 'flower'],
    ] } },
    { who: '📚 Thầy Minh', if: ['f3', 'book'], en: 'Here. The first page is empty, waiting for Mờ.', vi: 'Đây. Trang đầu còn trống, đang đợi Mờ.' },
    { who: '🎵 Cô Chi', if: ['f3', 'song'], en: "I'll write the words for you. Sing it together.", vi: 'Cô chép lời cho. Các cháu cùng hát nhé.' },
    { who: '🌸 Bà Lan', if: ['f3', 'flower'], en: 'Take my best roses. Say their names to Mờ.', vi: 'Cầm bó hồng đẹp nhất của bà. Nói tên hoa cho Mờ nghe.' },
    { who: ME, me: 1, en: 'Tí, are you ready to say sorry?', vi: 'Tí ơi, cậu sẵn sàng xin lỗi chưa?' },
    { who: '🐯 Tí', en: "I'm scared. But you are with me, so I'm ready.", vi: 'Mình sợ lắm. Nhưng có bạn bên cạnh, nên mình sẵn sàng.' },
  ] },
  { act: 4, title: 'Nói chuyện với Mờ', who: '🐯 Tí', intro: 'Cuối Phố Đêm, Mờ đang đợi. Trận cuối không đánh nhau: là một cuộc nói chuyện.', need: N(15, 5, 7), solid: 14,
    clue: { ico: '🌅', name: 'Bình minh Phố Chữ', vi: 'Sương Câm tan. Chỉ còn chút sương sớm, quay lại mỗi khi ta quên một từ.' }, scene: [
    { who: '🌫️ Mờ', en: 'Why are you here? Do you want to laugh at me again?', vi: 'Sao các cậu tới đây? Muốn cười tớ nữa à?' },
    { who: '🐯 Tí', en: "No. I'm sorry, Mờ. I laughed at you, and I was wrong.", vi: 'Không. Tớ xin lỗi, Mờ. Tớ đã cười cậu, và tớ đã sai.' },
    { who: ME, me: 1, en: "I make mistakes too. Everyone does. It's OK.", vi: 'Mình cũng hay nói sai. Ai cũng vậy. Không sao đâu.' },
    { who: '👥 Mọi người', if: ['f1', 'truth'], en: "We're all here, Mờ. Nobody will laugh.", vi: 'Cả phố đều ở đây, Mờ ạ. Không ai cười đâu.' },
    { who: '👥 Mọi người', if: ['f1', 'secret'], en: 'Tí told us everything today. We came to help you, Mờ.', vi: 'Hôm nay Tí đã kể hết rồi. Cả phố tới để giúp cậu, Mờ.' },
    { who: '🌫️ Mờ', if: ['f3', 'book'], en: 'A notebook… for my new words?', vi: 'Một cuốn vở… để viết chữ mới của tớ à?' },
    { who: '🌫️ Mờ', if: ['f3', 'song'], en: '♪ The sun is up… ♪ My song! You remember it!', vi: '♪ Mặt trời lên… ♪ Bài hát của tớ! Các cậu còn nhớ!' },
    { who: '🌫️ Mờ', if: ['f3', 'flower'], en: 'Roses… and lilies. I know their names!', vi: 'Hồng… và loa kèn. Tớ biết tên chúng!' },
    { who: '🌫️ Mờ', en: "OK. I'll try. I… love… rice!", vi: 'Được. Tớ thử nhé. Tớ… thích… cơm!' },
    { who: '👥 Mọi người', en: 'Yay! Perfect, Mờ!', vi: 'Hoan hô! Chuẩn rồi, Mờ!' },
    { who: '🌫️ Mờ', if: ['f2', 'loud'], en: 'And next time, please ring the bell softly!', vi: 'Mà lần sau rung chuông khẽ thôi nhé!' },
    { who: '🌫️ Mờ', if: ['f2', 'soft'], en: 'I heard your soft bell. That is why I waited for you.', vi: 'Tớ nghe tiếng chuông khẽ của các cậu. Vì thế tớ đã đợi.' },
    { who: '🐯 Tí', en: 'The fog is gone. Only a little morning mist stays.', vi: 'Sương Câm tan rồi. Chỉ còn chút sương sớm.' },
    { who: '🐯 Tí', en: 'When we forget words, the mist comes back. Then we remember them together!', vi: 'Khi mình quên từ, sương sớm quay lại. Rồi mình cùng nhớ lại!' },
    { who: '🐯 Tí', en: 'Now go outside. Say hello to someone real!', vi: 'Giờ thì ra ngoài kia. Chào một người thật bằng tiếng Anh nhé!' },
  ] },
];
// Cảnh hiện được với các cờ hiện có (lựa chọn chưa chọn vẫn hiện; câu phụ thuộc cờ chỉ hiện khi khớp).
export const linesOf = (c: Chapter, f: Partial<Record<StoryFlag, string>> = {}): Line[] => c.scene.filter(l => !l.if || f[l.if[0]] === l.if[1]);
// Kỷ vật đã có: của các chương đã xem xong (mở đầu tính khi đã xem).
export const cluesOf = (s: StorySave | undefined): Clue[] => CHAPTERS.slice(0, Math.min(CHAPTERS.length, s?.ch ?? 0)).map(c => c.clue).filter((x): x is Clue => !!x);
// Chọn sẵn phương án đầu cho lựa chọn chưa trả lời của chương (khi bấm Bỏ qua), để cảnh kết luôn đủ cờ.
export function settle(s: StorySave, c: Chapter): void { for (const l of c.scene) if (l.pick && !s.f?.[l.pick.f]) (s.f ||= {})[l.pick.f] = l.pick.opts[0]![2]; }
export function choose(s: StorySave, f: StoryFlag, v: string): boolean { if (!FLAGS[f]?.includes(v)) return false; (s.f ||= {})[f] = v; return true; }
export const COINS_CHAPTER = 20, COINS_ACT = 50;

export interface StorySave { ch: number; prog: Record<StoryKind, number>; side?: { letter?: number; cafe?: number; gift?: number }; f?: Partial<Record<StoryFlag, string>> }   // side: chương đã làm việc phụ; f: lựa chọn
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
// v115 khu truyện = cấp (SPEC "Mô hình học v111" §4): chương cuối khu có thể là trận cổng của một cấp. main.ts quyết định khu nào ứng
// với cấp nào (hiện tại: khu cuối = trận cổng của đích, nếu đích có cổng); null = khu không có cổng, giữ điều kiện kỹ năng vững.
export interface StoryGate { lv: string; passed: boolean }
export type StoryGateOf = (act: number) => StoryGate | null;
export const gateOf = (s: StorySave, gate?: StoryGateOf): StoryGate | null => { const c = chapterAt(s); return c?.solid && gate ? gate(c.act) : null; };
export const ready = (s: StorySave, solid: number, gate?: StoryGateOf): boolean => tasksDone(s) && solidOk(s, solid) && (gateOf(s, gate)?.passed ?? true);
// Xem xong cảnh truyện → sang chương sau; trả về xu thưởng và khu vừa hồi sinh (nếu là chương cuối khu).
export function advance(s: StorySave, solid: number, gate?: StoryGateOf): { coins: number; act: string | null } | null {
  if (!ready(s, solid, gate)) return null;
  const c = chapterAt(s)!, nx = CHAPTERS[s.ch + 1], actDone = c.act > 0 && (!nx || nx.act !== c.act);
  settle(s, c); s.ch++; if (c.act > 0) s.prog = N(0, 0, 0);   // mở đầu: giữ tiến độ đã tính sẵn cho chương 1
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
  if (typeof sd.gift === 'number') side.gift = n(sd.gift, CHAPTERS.length);
  const f0 = (x.f && typeof x.f === 'object' ? x.f : {}) as Record<string, unknown>, f: StorySave['f'] = {};
  for (const k of Object.keys(FLAGS) as StoryFlag[]) if (typeof f0[k] === 'string' && FLAGS[k].includes(f0[k] as string)) f[k] = f0[k] as string;
  return { ch: n(x.ch, CHAPTERS.length), prog: N(n(p.dig, 999), n(p.light, 999), n(p.voice, 999)), ...(Object.keys(side).length ? { side } : {}), ...(Object.keys(f).length ? { f } : {}) };
}
// v103 Việc phụ ở game kỹ năng (không bắt buộc, không tính vào nhiệm vụ chương, không ghi bằng chứng): cư dân của chương xuất hiện
// trong Thư (người nhờ viết) và Quán (khách đầu ca); làm xong mỗi việc một lần mỗi chương được +10 xu.
// Khuôn mặt nhân vật khi họ xuất hiện như người (khách ở Quán); biểu tượng trong truyện (🌸, 🥖…) thành món đồ cầm theo.
export const FACE: Record<string, string> = { 'Bà Lan': '👵', 'Chú Tư': '👨‍🍳', 'Bé Bin': '👦', 'Ông Ba': '👴', 'Cô Ngân': '👩', 'Ông Hải': '🧔', 'Thầy Minh': '👨‍🏫', 'Cô Chi': '👩‍🎤', 'Chị Hằng': '👩‍🦰', 'Anh Khoa': '🧑‍🎤' };
export const SIDE_COINS = 10;
export type SideKind = 'letter' | 'cafe' | 'gift';
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
    { k: 'gift', vi: `🎁 Tặng ${who[1]} một Lời đúc ở Xưởng của Tí`, start: 'bgcraft', done: st.side?.gift === curCh(st) },
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
  const f = { ...b.f, ...a.f };
  if (a.ch !== b.ch) { const w = a.ch > b.ch ? a : b; return Object.keys(f).length ? { ...w, f } : w; }
  const side = { ...b.side, ...a.side };
  return { ...(Object.keys(side).length ? { side } : {}), ...(Object.keys(f).length ? { f } : {}), ch: a.ch, prog: N(Math.max(a.prog.dig, b.prog.dig), Math.max(a.prog.light, b.prog.light), Math.max(a.prog.voice, b.prog.voice)) };
}

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
// Dòng nhỏ trong thẻ / tiêu đề game: nhiệm vụ truyện còn dở của game này (vd "📖 Đào chữ cho Bà Lan: 3/5").
export function storyNote(s: StorySave | undefined, kind: StoryKind): string {
  const st = s ?? freshStory(), c = target(st); if (!c || c.need[kind] <= 0 || st.prog[kind] >= c.need[kind]) return '';
  const verb = kind === 'dig' ? 'Đào chữ' : kind === 'light' ? 'Thắp đèn' : 'Trả câu nói';
  return `📖 ${verb} cho ${c.who.replace(/^\S+\s/, '')}: ${st.prog[kind]}/${c.need[kind]}`;
}

// Thẻ truyện ở sảnh: chương, lời dẫn, ba nhiệm vụ (bấm để vào game), nút xem cảnh, khu đã hồi sinh.
export function viewStory(s: StorySave | undefined, solid: number, gateFn?: StoryGateOf): string {
  const st = s ?? freshStory();
  if (finished(st)) return `<section class="stcard" style="background:linear-gradient(135deg,#ffb36b,#5b3fa8)" aria-label="Cốt truyện Phố Chữ"><span class="steyebrow">📖 Phố Chữ · Hết mùa 1</span><h2>🌅 Bình minh Phố Chữ</h2><p>Mờ đã nói lại, cả bốn khu đã hồi sinh. Sương sớm vẫn quay lại mỗi khi bạn quên một từ: thắp lại ở 🌫️ Sương quay lại. Mùa 2 sắp ra.</p><p class="stsmall">🎒 Kỷ vật: ${cluesOf(st).map(c => c.ico).join(' ')}</p><div class="whrow" style="justify-content:flex-start"><button class="whb wide" data-e="stscene" data-ch="${CHAPTERS.length - 1}">🔁 Xem lại cảnh kết</button><button class="whb wide" data-e="bgopen">🎒 Túi chữ</button></div></section>`;
  const c = chapterAt(st)!, [a, b] = ACT_BG[c.act]!, ok = ready(st, solid, gateFn), num = st.ch, sg = gateOf(st, gateFn);
  const tasks = (Object.keys(KIND_VI) as StoryKind[]).filter(k => c.need[k] > 0).map(k => {
    const v = kindOf(k, c.act), d = st.prog[k] >= c.need[k];
    return `<li><button class="stask${d ? ' ok' : ''}" data-e="${v.start}"><span aria-hidden="true">${d ? '✅' : v.ico}</span> ${esc(v.vi)} <b>${st.prog[k]}/${c.need[k]}</b></button></li>`;
  }).join('');
  const gate = sg && !sg.passed ? `<p class="${tasksDone(st) && solid >= (c.solid ?? 0) ? 'stgate' : 'stsmall'}">🚪 Chương cuối khu là <b>thi chuyển cấp ${esc(sg.lv)}</b>: qua bài thì ${esc(ACTS[c.act]!)} hồi sinh${solid < (c.solid ?? 0) ? ` (cần thêm ${c.solid} kỹ năng vững, bạn có ${solid})` : ''}. <button class="stlink" data-e="go" data-r="gate">Tới trận cổng</button></p>`
    : c.solid && tasksDone(st) && solid < c.solid ? `<p class="stgate">🔒 Chương cuối khu cần <b>${c.solid} kỹ năng vững</b> trên bản đồ năng lực (bạn có ${solid}). Học ở <button class="stlink" data-e="go" data-r="today">Lộ trình hôm nay</button>, mỗi kỹ năng vững là một tiếng nói được trả lại.</p>` : c.solid ? `<p class="stsmall">⭐ Chương cuối khu: cần thêm ${c.solid} kỹ năng vững thật (bạn có ${solid}).</p>` : '';
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
    ${(() => { const cl = cluesOf(st); return cl.length ? `<p class="stsmall"><button class="stlink" data-e="bgopen" data-t="clue">🎒 Kỷ vật ${cl.length}/${CHAPTERS.length}</button> ${cl.map(c => `<span title="${esc(c.name)}">${c.ico}</span>`).join(' ')}</p>` : ''; })()}
  </section>`;
}

// v118 Màn Hôm nay là một cảnh của Phố Chữ (SPEC §7 "Luật màn đầu"): khu đang ở, chương, cư dân cần giúp. Thuần hàm, không lưu gì.
export interface Scene { act: number; zone: string; no: number; title: string; intro: string; who: [string, string] | null; ready: boolean; done: boolean }
export function sceneOf(s: StorySave | undefined, solid: number, gate?: StoryGateOf): Scene {
  const st = s ?? freshStory();
  if (finished(st)) { const last = ACTS.length - 1; return { act: last, zone: ACTS[last]!, no: CHAPTERS.length, title: 'Bình minh Phố Chữ', intro: 'Mờ đã nói lại. Hết mùa 1.', who: null, ready: false, done: true }; }
  const c = st.ch === 0 ? CHAPTERS[0]! : chapterAt(st)!;
  return { act: c.act, zone: ACTS[c.act]!, no: st.ch, title: c.title, intro: c.intro, who: resident(st), ready: ready(st, solid, gate), done: false };
}
// Hình phố theo khu (SVG nội tuyến, không tải tệp): 0 Mở đầu + 1 Chợ Sáng = mái nhà + sạp có mái sọc; 2 Bến Cảng = sóng, thuyền,
// hải đăng; 3 Rừng Trúc = rặng trúc; 4 Phố Đêm = trăng khuyết, dây đèn lồng. Chỉ để trang trí (aria-hidden ở nơi gọi).
export function sceneArt(act: number): string {
  const sky = '<circle cx="300" cy="26" r="14" fill="#fff6c9" opacity=".85"/>';
  const town = `<path d="M0 92 L0 62 L22 46 L44 62 L44 92 Z M48 92 L48 54 L74 36 L100 54 L100 92 Z M250 92 L250 58 L274 42 L298 58 L298 92 Z M304 92 L304 66 L330 50 L360 66 L360 92 Z" fill="rgba(0,0,0,.28)"/>
    <g><rect x="118" y="66" width="56" height="26" fill="rgba(0,0,0,.25)"/><path d="M112 66 h68 l-6 -12 h-56 z" fill="#ffd166"/><path d="M124 54 v12 M136 54 v12 M148 54 v12 M160 54 v12" stroke="#e76f51" stroke-width="5"/>
    <rect x="184" y="70" width="52" height="22" fill="rgba(0,0,0,.25)"/><path d="M178 70 h64 l-6 -11 h-52 z" fill="#8ecae6"/><path d="M190 59 v11 M202 59 v11 M214 59 v11 M226 59 v11" stroke="#fff" stroke-width="5"/></g>`;
  const harbour = `<path d="M0 80 Q20 74 40 80 T80 80 T120 80 T160 80 T200 80 T240 80 T280 80 T320 80 T360 80 V110 H0 Z" fill="rgba(255,255,255,.25)"/>
    <path d="M60 78 h70 l-12 14 h-46 z" fill="rgba(0,0,0,.35)"/><path d="M95 78 V40 L120 72 Z" fill="#fff" opacity=".85"/>
    <path d="M286 92 L292 30 H308 L314 92 Z" fill="#fff" opacity=".9"/><path d="M290 52 h20 M289 70 h22" stroke="#e63946" stroke-width="6"/><rect x="292" y="20" width="16" height="10" fill="#ffd166"/>`;
  const bamboo = Array.from({ length: 11 }, (_, i) => { const x = 14 + i * 33, h = 40 + ((i * 37) % 30); return `<path d="M${x} 110 V${110 - h}" stroke="rgba(0,0,0,.28)" stroke-width="7"/><path d="M${x - 4} ${118 - h} h8 M${x - 4} ${132 - h} h8" stroke="rgba(255,255,255,.35)" stroke-width="2"/><path d="M${x} ${112 - h} q12 -8 20 -4" stroke="rgba(0,0,0,.22)" stroke-width="3" fill="none"/>`; }).join('');
  // Phố Đêm: trăng, mái nhà, dây đèn lồng.
  const night = `<circle cx="300" cy="26" r="14" fill="#fff6c9"/><circle cx="306" cy="22" r="12" fill="rgba(11,8,32,.9)"/>
    <path d="M0 92 L0 58 L26 40 L52 58 L52 92 Z M60 92 L60 50 L90 30 L120 50 L120 92 Z M230 92 L230 54 L258 36 L286 54 L286 92 Z M292 92 L292 62 L326 44 L360 62 L360 92 Z" fill="rgba(0,0,0,.4)"/>
    <path d="M40 40 Q180 78 330 42" stroke="rgba(255,255,255,.35)" stroke-width="1.5" fill="none"/>
    ${[70, 120, 170, 220, 270].map((x, i) => `<ellipse cx="${x}" cy="${58 + (i % 2) * 4}" rx="7" ry="9" fill="${i % 2 ? '#ff6b6b' : '#ffd166'}"/>`).join('')}`;
  const body = act === 4 ? night : act === 2 ? harbour : act === 3 ? bamboo : town;
  return `<svg viewBox="0 0 360 110" preserveAspectRatio="xMidYMax slice" width="100%" height="100%" focusable="false">${sky}${body}</svg>`;
}

// v128 Câu người chơi tự nói trong cảnh truyện: khớp khi có ≥ 75% từ của câu mẫu (không kể dấu câu, hoa thường) và độ dài đủ.
// Chỉ là phản hồi trong truyện (không vào mức thuộc); lượt nói / gõ cả câu ghi vào nhật ký H như các game nói.
const toks = (t: string): string[] => t.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);
export function sayOk(target: string, said: string): { ok: boolean; miss: string[] } {
  const want = toks(target), got = new Set(toks(said)), miss = want.filter(w => !got.has(w));
  return { ok: want.length > 0 && (want.length - miss.length) / want.length >= 0.75 && got.size >= Math.ceil(want.length * 0.6), miss };
}
