// v141 Kho khuôn cho bài ngẫu nhiên theo tiêu chí (testgen.ts). Chỉ dữ liệu: từ A1–A2 để điền chỗ trống, tình huống Viết,
// chuỗi cảnh kể chuyện, câu hỏi Nói. Người sáng lập 16/10/2026: bài sinh theo tiêu chí, không dùng bộ soạn sẵn (học tủ được).
// Mọi từ ở đây thuộc A1–A2 (danh sách từ của app); thêm từ thì giữ cùng cấp.

export const NAMES = ['Anna', 'Ben', 'Lan', 'Minh', 'Sara', 'Tom', 'Kim', 'Nam', 'Lucy', 'Jack', 'Mai', 'Hoa', 'Peter', 'Emma', 'Sam', 'Linh'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Giờ có am / pm, theo thứ tự trong ngày: chỉ số 0–8 là buổi sáng, 9–20 là chiều tối (khuôn chọn ba giờ cùng một buổi).
export const TIMES = ['7.30 am', '8 am', '8.30 am', '9 am', '9.15 am', '10 am', '10.30 am', '11 am', '11.45 am', '1.30 pm', '2 pm', '2.45 pm', '3 pm', '4.30 pm', '5 pm', '5.45 pm', '6 pm', '6.30 pm', '7 pm', '7.45 pm', '8.15 pm'];
export const AM_END = 8;
export const PLACES = ['the station', 'the library', 'the park', 'the cinema', 'the café', 'the bus stop', 'the museum', 'the market', 'the sports centre', 'the bookshop', 'the swimming pool', 'the bakery'];
export const THINGS = ['umbrella', 'jacket', 'bag', 'phone', 'wallet', 'watch', 'hat', 'scarf', 'notebook', 'water bottle'];
export const COLOURS = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'brown', 'grey'];
export const SHOPS = ['Green Café', 'City Books', 'Sun Pharmacy', 'Fresh Market', 'Star Bakery', 'Blue Sky Shoes'];
export const ITEMS = ['T-shirt', 'lunch box', 'book', 'football', 'pizza', 'cinema ticket', 'pair of socks', 'cup of coffee'];
export const EVENTS = ['football match', 'birthday party', 'English class', 'concert', 'school trip', 'dance lesson', 'meeting', 'cooking class'];
export const SUBJECTS = ['Maths', 'English', 'Art', 'Music', 'History', 'Science'];
export const TRANSPORT = ['bus', 'train', 'taxi', 'bike'];
export const FOODS = ['pizza', 'noodles', 'chicken', 'fish', 'rice', 'salad', 'soup', 'sandwiches'];
export const TOWNS = ['Hill Town', 'Riverside', 'Oak Park', 'Seaview', 'Greenfield', 'Kingsbridge'];
export const RELS = ['sister', 'brother', 'cousin', 'uncle', 'aunt', 'best friend'];
export const ACTS = ['go swimming', 'visit the museum', 'learn to cook', 'play tennis', 'go camping', 'take some photos', 'go to a concert', 'read more books'];

// Viết tin nhắn: tình huống + 3 ý cần có (chỗ trống {N} tên người nhận, {X} chi tiết rút ngẫu nhiên) + cụm hữu ích.
export interface WSit { en: string; vi: string; p: string; pv: string; c: string[]; u: Array<[string, string]>; x: ReadonlyArray<readonly [string, string]> }   // x: [chi tiết tiếng Anh {X}, tiếng Việt {XV}]
export const WSITS: WSit[] = [
  { en: 'Borrowing Something', vi: 'Mượn đồ', p: 'Your friend {N} has a {X}. You want to borrow it this weekend. Write a message to {N}. Ask to borrow the {X}; say why you need it; say when you will give it back.',
    pv: 'Viết tin nhắn cho {N}: hỏi mượn {XV}, nói vì sao cần, nói khi nào trả.', c: ['Hỏi mượn', 'Lý do cần', 'Khi nào trả'],
    u: [['Could I borrow', 'Mình mượn … được không'], ['because', 'vì'], ['I need it to', 'Mình cần nó để'], ['I’ll give it back on', 'Mình sẽ trả vào']], x: [['bike', 'xe đạp'], ['camera', 'máy ảnh'], ['tent', 'lều'], ['laptop', 'máy tính xách tay'], ['guitar', 'đàn ghi-ta'], ['football', 'quả bóng']] },
  { en: 'An Invitation', vi: 'Lời mời', p: 'You are going to {X} on Saturday. Write a message to your friend {N}. Invite {N} to come with you; say what time you will go; say what to bring.',
    pv: 'Viết tin nhắn mời {N} cùng đi {XV} thứ Bảy: lời mời, mấy giờ đi, cần mang gì.', c: ['Lời mời', 'Giờ đi', 'Cần mang gì'],
    u: [['Would you like to', 'Bạn có muốn'], ['Let’s meet at', 'Mình gặp lúc'], ['Don’t forget to bring', 'Nhớ mang'], ['See you', 'Hẹn gặp']], x: [['the beach', 'biển'], ['the cinema', 'xem phim'], ['a concert', 'nghe hoà nhạc'], ['the park', 'công viên'], ['a football match', 'xem bóng đá'], ['the night market', 'chợ đêm']] },
  { en: 'Changing a Plan', vi: 'Đổi kế hoạch', p: 'You planned to {X} with your friend {N} tonight, but you can’t go. Write a message to {N}. Say sorry; explain why you can’t go; suggest another day.',
    pv: 'Viết tin nhắn cho {N}: xin lỗi, nói vì sao tối nay không {XV} được, đề nghị ngày khác.', c: ['Lời xin lỗi', 'Lý do', 'Đề nghị ngày khác'],
    u: [['I’m sorry, but', 'Mình xin lỗi, nhưng'], ['I can’t', 'Mình không thể'], ['because', 'vì'], ['How about', 'Hay là']], x: [['see a film', 'đi xem phim'], ['have dinner', 'đi ăn tối'], ['play tennis', 'chơi quần vợt'], ['go shopping', 'đi mua sắm'], ['study together', 'học cùng'], ['go swimming', 'đi bơi']] },
  { en: 'A Thank-you Note', vi: 'Lời cảm ơn', p: 'Your friend {N} gave you a {X} for your birthday. Write a message to {N}. Say thank you; say what you like about the present; say when you will use it.',
    pv: 'Viết tin nhắn cảm ơn {N} vì món quà ({XV}): cảm ơn, thích điều gì, khi nào sẽ dùng.', c: ['Lời cảm ơn', 'Điều bạn thích ở món quà', 'Khi nào sẽ dùng'],
    u: [['Thank you for', 'Cảm ơn bạn vì'], ['I really like', 'Mình rất thích'], ['It’s', 'Nó'], ['I’m going to use it', 'Mình sẽ dùng nó']], x: [['book', 'cuốn sách'], ['scarf', 'khăn quàng'], ['cup', 'cái cốc'], ['bag', 'cái túi'], ['game', 'trò chơi'], ['watch', 'đồng hồ']] },
  { en: 'Asking for Help', vi: 'Nhờ giúp đỡ', p: 'You are new in the {X} class. Write a message to your classmate {N}. Ask what homework there is; ask when the next lesson is; ask where you can buy the book.',
    pv: 'Bạn mới vào lớp {XV}. Viết tin nhắn cho bạn cùng lớp {N}: hỏi bài tập về nhà, khi nào có buổi tiếp, mua sách ở đâu.', c: ['Hỏi bài tập về nhà', 'Hỏi buổi học tiếp', 'Hỏi chỗ mua sách'],
    u: [['Can you tell me', 'Bạn có thể cho mình biết'], ['What homework', 'Bài tập về nhà gì'], ['When is', 'Khi nào là'], ['Where can I buy', 'Mình mua … ở đâu']], x: [['English', 'tiếng Anh'], ['cooking', 'nấu ăn'], ['guitar', 'ghi-ta'], ['French', 'tiếng Pháp'], ['computer', 'tin học'], ['art', 'vẽ']] },
  { en: 'A Message to a Neighbour', vi: 'Nhắn hàng xóm', p: 'You are going away for {X}. Write a note to your neighbour {N}. Ask {N} to water your plants; say when you will come back; say thank you.',
    pv: 'Bạn đi vắng {XV}. Viết lời nhắn cho hàng xóm {N}: nhờ tưới cây, nói khi nào về, cảm ơn.', c: ['Nhờ tưới cây', 'Khi nào về', 'Lời cảm ơn'],
    u: [['Can you', 'Bạn có thể'], ['water my plants', 'tưới cây của tôi'], ['I will be back on', 'Tôi sẽ về vào'], ['Thank you', 'Cảm ơn']], x: [['the weekend', 'cuối tuần'], ['three days', 'ba ngày'], ['a week', 'một tuần'], ['two days', 'hai ngày']] },
];

// Chuyện theo 3 cảnh: chuỗi có lý (cảnh 1 → 2 → 3), {N} là nhân vật. A2 Key Part 7.
export interface Story { en: string; vi: string; s: [string, string, string]; v: [string, string, string] }
export const STORIES: Story[] = [
  { en: 'The Lost Dog', vi: 'Chú chó đi lạc', s: ['{N} is walking in the park and sees a small dog alone.', '{N} reads the phone number on the dog’s collar and calls it.', 'An old man arrives and is very happy to see his dog.'], v: ['{N} thấy chú chó lạc ở công viên', '{N} gọi số trên vòng cổ', 'ông cụ chủ chó đến, rất vui'] },
  { en: 'The Rainy Bus Stop', vi: 'Trạm xe buýt ngày mưa', s: ['{N} is waiting at a bus stop and it starts to rain.', 'A woman next to {N} shares her umbrella.', 'On the bus, they talk and find they work in the same building.'], v: ['{N} chờ xe buýt thì mưa', 'một người cho đi chung ô', 'hai người làm cùng tòa nhà'] },
  { en: 'The Birthday Cake', vi: 'Bánh sinh nhật', s: ['{N} is making a birthday cake for a friend.', 'The cake falls on the floor.', '{N} buys a new cake and the friend loves it.'], v: ['{N} làm bánh sinh nhật', 'bánh rơi xuống sàn', '{N} mua bánh mới, bạn rất thích'] },
  { en: 'The Wrong Train', vi: 'Lên nhầm tàu', s: ['{N} gets on a train to visit a cousin.', '{N} sees that the train is going to a different town.', '{N} gets off, phones the cousin, and the cousin comes by car.'], v: ['{N} lên tàu đi thăm họ hàng', 'tàu đi nhầm thành phố', 'xuống tàu, gọi điện, được đón bằng ô tô'] },
  { en: 'The Found Wallet', vi: 'Nhặt được ví', s: ['{N} finds a wallet on a café table.', '{N} gives the wallet to the waiter.', 'The next day, the owner comes back and thanks {N}.'], v: ['{N} nhặt được ví ở quán', 'đưa ví cho người phục vụ', 'hôm sau chủ ví đến cảm ơn'] },
  { en: 'The First Swim', vi: 'Lần đầu bơi', s: ['{N} is afraid of the water at the swimming pool.', 'A teacher helps {N} in the small pool.', 'After some weeks, {N} can swim across the big pool.'], v: ['{N} sợ nước ở bể bơi', 'thầy giúp ở bể nhỏ', 'vài tuần sau bơi qua được bể lớn'] },
  { en: 'The Picnic', vi: 'Buổi dã ngoại', s: ['{N} and some friends have a picnic by the river.', 'A strong wind blows their food and hats away.', 'They eat at a small restaurant and laugh about the day.'], v: ['{N} và bạn dã ngoại bên sông', 'gió thổi bay đồ ăn và mũ', 'cả nhóm ăn ở quán nhỏ, cười vui'] },
];

// Câu hỏi Nói (A2 Key Part 1 + một câu ý kiến). Chọn mỗi nhóm một câu để có đủ thì: hiện tại, quá khứ, tương lai, ý kiến.
export const SPEAK: Record<'now' | 'past' | 'future' | 'opinion', Array<[string, string]>> = {
  now: [['What do you usually do at the weekend?', 'Cuối tuần thường làm gì'], ['How do you go to work or school?', 'Đi làm / đi học bằng gì'], ['What do you like doing in the evening?', 'Buổi tối thích làm gì'], ['Who do you live with?', 'Sống với ai'], ['What food do you like best?', 'Thích món gì nhất']],
  past: [['What did you do last weekend?', 'Cuối tuần trước làm gì'], ['Tell me about a place you visited last year.', 'Một nơi đã đến năm ngoái'], ['What did you have for dinner yesterday?', 'Tối qua ăn gì'], ['Tell me about your last holiday.', 'Kỳ nghỉ gần nhất']],
  future: [['What are you going to do next weekend?', 'Cuối tuần tới sẽ làm gì'], ['What would you like to learn next year?', 'Năm tới muốn học gì'], ['Where would you like to travel in the future?', 'Sau này muốn đi đâu'], ['What are your plans for next month?', 'Kế hoạch tháng tới']],
  opinion: [['Do you prefer the city or the countryside? Why?', 'Thành phố hay nông thôn, vì sao'], ['Do you prefer going out or staying at home? Why?', 'Đi chơi hay ở nhà, vì sao'], ['Is it better to travel by bus or by bike? Why?', 'Xe buýt hay xe đạp, vì sao'], ['Do you like watching films at home or at the cinema? Why?', 'Xem phim ở nhà hay rạp, vì sao']],
};
export const SPEAK_U: Array<[string, string]> = [['I usually', 'Tôi thường'], ['Last weekend, I', 'Cuối tuần trước tôi'], ['I’m going to', 'Tôi sẽ'], ['I prefer … because', 'Tôi thích … hơn vì']];
