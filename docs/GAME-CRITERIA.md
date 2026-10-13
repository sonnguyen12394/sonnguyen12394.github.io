# Tiêu chí chấm trò chơi theo chức năng học (thang 10)

Tài liệu dùng để:
- **thiết kế** game mới: game nào hợp với chức năng học nào;
- **chấm** game đang có trước khi đưa cho người dùng.

Căn cứ:
- spec v2.4: P13 điểm game không phải năng lực; P14 độ khó game tách khỏi độ khó ngôn ngữ; P15 tốc độ chỉ là tín hiệu phụ; HG12 / HG20 / HG24;
- khảo sát chức năng của app (v73);
- báo cáo bot người học L01–L03 (`reports/learners/`).

Tài liệu chỉ nêu **thể loại** game làm cảm hứng, không dùng tên / hình / bố cục của game thương mại (xem test `test/unit/ip-names.test.ts`).

## 1. Các chức năng học của app (13 nhóm)

| # | Chức năng | Người học làm gì (trong app) | Kỹ năng | Bằng chứng ghi lại |
|---|---|---|---|---|
| F1 | **Xếp lớp & chẩn đoán** | Kiểm tra Nghe + Đọc đầu vào, bài dò từ vựng / ngữ pháp, dò trong tháp | Từ vựng, ngữ pháp, nghe, đọc | Cấp ước tính, tiên nghiệm theo nút |
| F2 | **Học từ vựng mới** | Thẻ từ, nhận ra / nhớ lại / chính tả / ngữ cảnh / kết hợp từ (515 bài, 9.345 từ) | Từ vựng | Mastery theo nút, thẻ ôn |
| F3 | **Ngữ pháp** | Chọn, gõ dạng, sửa lỗi, sắp xếp câu (154 điểm ngữ pháp) | Ngữ pháp | Mastery mức 1–4 |
| F4 | **Phát âm & phân biệt âm** | 26 cặp âm, đuôi -s / -ed, trọng âm, nối âm, ngữ điệu, kiểm tra phát âm | Nghe âm, phát âm | Hồ sơ âm hay nhầm |
| F5 | **Nghe hiểu** | Chép chính tả, nghe chọn nghĩa / câu đáp, nghe bài dài B1–C2 | Nghe | Điểm nghe, band |
| F6 | **Đọc hiểu** | Bài đọc trong bài học, truyện dài kỳ, văn bản đời thường, bài dài B1–C2 | Đọc | Điểm đọc, band |
| F7 | **Giao tiếp & hội thoại** | 58 chức năng giao tiếp, hội thoại, đóng vai, hội thoại nhánh, phản xạ | Chức năng giao tiếp, nghe – nói | Nút `fn:`, Can-do |
| F8 | **Nói** | Nói nhại, nói theo đề, nói đáp lời, nhắc lại câu | Nói, lưu loát | Tự chấm, khớp từ khi nhắc lại |
| F9 | **Viết** | Viết theo đề, chuyển ý Việt → Anh, kho viết câu | Viết, dùng có kiểm soát (mức 4–5) | Lỗi, hồ sơ từ CEFR, tự chấm |
| F10 | **Ôn tập & nhớ lâu** | Ôn đúng hạn (FSRS), rương ôn | Mọi nút đã học | Khả năng nhớ |
| F11 | **Sửa lỗi gốc & dùng ở ngữ cảnh mới** | Bí kíp 60 giây, transfer câu mới, kiểm tra bỏ qua, truy gốc tiền đề | Phần đang sai / vừa Đạt | Giả thuyết hiểu sai, transfer, Đạt / mở lại |
| F12 | **Luyện thi** | 26 dạng câu IELTS / VSTEP, đề thi thử, sổ lỗi sai, kế hoạch tới ngày thi | Kỹ năng thi 4 kỹ năng | Band ± khoảng tin cậy |
| F13 | **Thói quen & động lực** | Chuỗi ngày, nhiệm vụ, giải đấu tuần, sưu tập, năng lượng / Super giả lập | (không phải kỹ năng) | Telemetry, không vào năng lực |

---

## 2. Tiêu chí chung cho MỌI trò chơi (10 tiêu chí × 10 điểm)

Mỗi tiêu chí có mốc chấm:
- **0** = vi phạm;
- **5** = tạm được;
- **10** = đạt chuẩn.

Điểm game = trung bình có trọng số (trọng số ghi trong ngoặc).

**Bắt buộc:** một game chỉ được đưa ra cho người dùng khi G3 ≥ 8 và G9 ≥ 8.

| # | Tiêu chí | 0 điểm | 5 điểm | 10 điểm |
|---|---|---|---|---|
| G1 (×2) | **Học là luật chơi** | Câu hỏi là "cổng" chắn giữa các lượt chơi, không liên quan nhau | Câu hỏi trao phần thưởng dùng trong game | Hành động chơi chính là dùng tiếng Anh (xếp câu, nghe để phục vụ khách…) |
| G2 (×2) | **Đúng mục đích chức năng** | Loại câu không khớp chức năng phục vụ | Khớp một phần | Đúng dạng bằng chứng của chức năng (bảng §3) |
| G3 (×2) | **Bằng chứng sạch** (P13–P15) | Tốc độ tay / mẹo game / đoán mò quyết định kết quả | Có nhiễu nhưng có hiệu chỉnh | Chỉ câu trả lời vào năng lực; ≥ 3 lựa chọn hoặc tự gõ; tốc độ chỉ là tín hiệu phụ |
| G4 | **Engine chọn nội dung** | Ngẫu nhiên / cố định | Có ưu tiên nhưng lặp thừa | Theo NBA / FSRS; giãn cách; không luyện lại phần đã vững |
| G5 | **Độ khó tách đôi** (P14) | Khó game = khó ngôn ngữ | Tách nhưng chỉnh tay | Độ khó ngôn ngữ thích ứng theo người học; độ khó game chỉnh riêng |
| G6 | **Phản hồi học tập** | Chỉ báo đúng / sai | Có đáp án | Đáp án + "vì sao" + cơ hội sửa ngay; không ngắt nhịp chơi quá 5 giây |
| G7 (×2) | **Hấp dẫn thật** | Không có quyết định, không có thế giới | Có hình / tiếng hoặc có lựa chọn | Có quyết định ý nghĩa, tiến trình dài hạn, hình – tiếng – chuyển động, muốn chơi lại |
| G8 | **Mật độ học** | < 1 câu có ích / phút | 2–3 câu / phút | ≥ 4 câu có ích / phút, ván 3–8 phút |
| G9 | **Động lực trung thực** (HG20) | Phạt khi sai / nghỉ, dark pattern | Không phạt nhưng gây áp lực | Sai không mất gì, nghỉ không mất gì, tiến độ thật tách khỏi điểm game và ghi rõ |
| G10 | **Phát hành được** | Dùng tên / hình / âm thanh của người khác | Tự làm nhưng nặng hoặc khó truy cập | Tự làm, offline, có thể truy cập, Lighthouse ≥ 90, không tên thương hiệu |

---

## 3. Tiêu chí riêng theo chức năng (chấm thêm, 10 điểm mỗi tiêu chí) và game phù hợp

Điểm "phù hợp chức năng" = trung bình các tiêu chí riêng. Game nên dùng cho một chức năng khi **G ≥ 7 và F ≥ 7**.

### F1 Xếp lớp & chẩn đoán
- **F1a Thông tin trên mỗi câu.** Mỗi câu chọn theo lợi ích thông tin, hội tụ ≤ 16 phần. Mốc 10 khi ước lượng lệch thật ≤ ½ bậc.
- **F1b Không áp lực, không phần thưởng cho đúng.** Người chơi không có lý do để đoán bừa; có "Không biết".
- **F1c Phủ đủ vùng kỹ năng.** Có thử từ vựng, ngữ pháp và nghe.
- **Game hợp:** 🗺️ *Thám hiểm sương mù*: mỗi câu dò mở một ô bản đồ, đúng hay sai đều mở. Thể loại: bản đồ khám phá.

### F2 Học từ vựng mới
- **F2a Đi đúng bậc** nhận ra → nhớ lại → chính tả → ngữ cảnh.
- **F2b Dạy trước khi hỏi** phần chưa gặp, ngắn (≤ 2 thẻ).
- **F2c Có hình / âm / ví dụ** gắn với từ.
- **Game hợp:**
  - 🃏 *Lật thẻ ghép đôi*: từ ↔ nghĩa / hình / âm, thể loại trí nhớ;
  - 📒 *Sổ sưu tập thẻ*: thẻ lên sao theo mức thật;
  - 🧱 Xếp Khối cho phần nhớ lại.

### F3 Ngữ pháp
- **F3a Người chơi tạo ra câu**: xếp / điền / sửa, không chỉ chọn.
- **F3b Đối chiếu đúng – sai** để bắt lỗi hiểu sai.
- **F3c Mức 4 (dùng có kiểm soát)** được đo bằng câu mới.
- **Game hợp:**
  - 🃏 **Bài Câu**: lá từ xếp thành câu đúng để "ra bài", điểm = chip × nhân; thể loại deckbuilder;
  - 🧩 *Xưởng câu*: sửa máy bằng cách sửa câu sai.

### F4 Phát âm & phân biệt âm
- **F4a Nghe rồi phân biệt cặp âm**, ≥ 3 lựa chọn hoặc lặp lại để trừ đoán mò.
- **F4b Có phát lại chậm / so sánh.**
- **F4c Có phần nói** (nhận dạng giọng), nếu máy hỗ trợ; không có thì không phạt.
- **Game hợp:**
  - 🎯 *Bắt âm*: bong bóng mang từ /ɪ/–/iː/ bay lên, chạm đúng từ vừa nghe; không tính giờ ở chế độ học;
  - 🎤 *Karaoke nói nhại* có thanh điểm khớp từ.

### F5 Nghe hiểu
- **F5a Nội dung nghe là trung tâm**: không đọc được thì không chơi được.
- **F5b Tăng dần**: từ → câu → đoạn; có tốc độ chậm.
- **F5c Câu hỏi ý chính / chi tiết / suy luận**, không chỉ nghe một từ.
- **Game hợp:**
  - ☕ **Quán cà phê**: khách gọi món bằng lời nói, phục vụ đúng thì quán đông; thể loại phục vụ khách;
  - 📻 *Đài phát thanh bí ẩn*: nghe bản tin tìm manh mối.

### F6 Đọc hiểu
- **F6a Văn bản dài vừa đủ** (≥ 60 từ) với câu hỏi ý chính / chi tiết / suy luận.
- **F6b Lý do để đọc**: manh mối, quyết định cốt truyện.
- **F6c Từ mới trong bài nối về thẻ từ.**
- **Game hợp:**
  - 🔍 **Thám tử**: đọc thư, biển báo, tin nhắn để phá án; thể loại giải đố cốt truyện;
  - 🚪 *Phòng thoát hiểm*: đọc hướng dẫn để mở khoá.

### F7 Giao tiếp & hội thoại
- **F7a Tình huống thật**: gọi món, hỏi đường, xin lỗi…, gắn đúng nút `fn:`.
- **F7b Chọn / nói câu đáp phù hợp ngữ cảnh**, không chỉ đúng ngữ pháp.
- **F7c Hậu quả trong game theo lựa chọn**: khách vui / khó chịu, cốt truyện rẽ nhánh.
- **Game hợp:**
  - ⚓ **Chợ Ghép**: đơn hàng đến bằng hội thoại, ghép đồ để giao; thể loại merge;
  - 💬 *Nhắn tin nhập vai*: chat rẽ nhánh với nhân vật.

### F8 Nói
- **F8a Người học thật sự nói thành tiếng.**
- **F8b Đo khách quan** khi có thể (khớp từ khi nhắc lại); tự chấm có hướng dẫn khi không.
- **F8c An toàn tâm lý**: không ai nghe, thử lại không mất gì.
- **Game hợp:**
  - 🤖 *Ra lệnh cho robot*: nói câu lệnh để robot đi mê cung;
  - 🎤 Karaoke nói nhại.

### F9 Viết
- **F9a Tự viết câu** (không chọn), có kiểm từ khoá / lỗi.
- **F9b Từ ngắn đến dài**: câu → đoạn → bài.
- **F9c Phản hồi có điểm cụ thể**: lỗi, vốn từ CEFR, ý chính.
- **Game hợp:**
  - ✉️ *Thư gửi cư dân phố*: viết thư theo yêu cầu, nhân vật trả lời theo mức đạt;
  - 🧩 Xưởng câu ở chế độ tự gõ.

### F10 Ôn tập & nhớ lâu
- **F10a Hỏi đúng lúc sắp quên** (FSRS, R < 0,85), không hỏi phần đang nhớ tốt.
- **F10b Ván ngắn hằng ngày** (3–5 phút), dễ vào lại.
- **F10c Nhớ lại tự lực** (tự gõ / không gợi ý) chiếm phần lớn.
- **Game hợp:**
  - 🧱 **Xếp Khối Chữ** (đang có);
  - 📅 *Câu đố ngày*: nhóm 16 từ thành 4 nhóm theo nghĩa / ngữ pháp;
  - 🎲 Bàn Cờ Phố (ô rương).

### F11 Sửa lỗi gốc & transfer
- **F11a Bí kíp nhắm đúng lỗi hiểu sai**, có câu thử ngay sau.
- **F11b Câu mới chưa gặp** để chứng minh dùng được.
- **F11c Phần nền thiếu được dạy trước.**
- **Game hợp:**
  - 👑 *Trùm / tinh anh* ở mọi game (câu mới);
  - 🔥 lửa trại = bí kíp;
  - 🔍 Thám tử (ngữ cảnh mới).

### F12 Luyện thi
- **F12a Đúng định dạng và thời gian thi thật** (ở đây được tính giờ vì thi thật tính giờ).
- **F12b Ước lượng band trung thực** có khoảng tin cậy.
- **F12c Sổ lỗi sai được ôn lại.**
- **Game hợp:**
  - ⚔️ *Đấu trường đề*: chuỗi trận theo từng dạng câu thi, hạ "quái" = đúng dạng câu;
  - sổ lỗi = bộ sưu tập quái cần đánh lại.

### F13 Thói quen & động lực
- **F13a Lý do quay lại mỗi ngày** không dựa vào sợ mất: chuỗi ngày có ngày nghỉ được bảo vệ.
- **F13b Tiến trình dài hạn nhìn thấy được**: phố, sổ thẻ, bản đồ.
- **F13c Không tăng áp lực bằng tiền / quảng cáo.**
- **Game hợp:**
  - 🎲 **Bàn Cờ Phố** (đang có);
  - giải đấu tuần;
  - sổ sưu tập.

---

## 4. Chấm các game hiện có (v73)

| Tiêu chí | 🏰 Leo tháp | 🧱 Xếp Khối Chữ | 🎲 Bàn Cờ Phố | ⏱️ Tốc độ 60 giây | 🔗 Ghép cặp |
|---|---|---|---|---|---|
| G1 Học là luật chơi (×2) | 4 | 5 | 4 | 4 | 6 |
| G2 Đúng mục đích (×2) | 7 | 8 | 6 | 5 | 5 |
| G3 Bằng chứng sạch (×2) | 9 | 9 | 9 | 7 | 7 |
| G4 Engine chọn nội dung | 9 | 9 | 9 | 2 | 2 |
| G5 Độ khó tách đôi | 9 | 9 | 9 | 3 | 3 |
| G6 Phản hồi học tập | 8 | 7 | 8 | 4 | 5 |
| G7 Hấp dẫn thật (×2) | 4 | 7 | 6 | 6 | 6 |
| G8 Mật độ học | 8 | 6 | 5 | 9 | 7 |
| G9 Động lực trung thực | 9 | 9 | 9 | 8 | 9 |
| G10 Phát hành được | 9 | 9 | 9 | 8 | 8 |
| **Điểm có trọng số (÷ 14)** | **7,1** | **7,6** | **7,1** | **5,6** | **5,9** |

### Căn cứ từng game

**🏰 Leo tháp** (`src/engine/quest.ts`, `questview.ts`)
- Mỗi lượt là một câu do NBA chọn (G4).
- Tim / xu / tầng không vào mastery (G3, test `engine-quest.test.ts`).
- Có bí kíp và dòng "vì sao" (G6).
- Không có quyết định của người chơi, chỉ có emoji (G1, G7 thấp).

**🧱 Xếp Khối Chữ** (`blocks.ts`)
- Ưu tiên rương ôn, đúng mục đích ôn tập (G2).
- Hình khối theo seed, độc lập với câu (G5, test `engine-blocks.test.ts`).
- Người chơi có quyết định đặt khối và combo (G7).
- Mất thời gian đặt khối giữa các câu (G8 = 6).
- Phản hồi khi sai bị rút gọn để giữ nhịp chơi (G6 = 7).

**🎲 Bàn Cờ Phố** (`board.ts`)
- Xúc xắc chỉ chọn loại cảnh; thứ tự NBA giữ nguyên (test `engine-board.test.ts`).
- Ô Nhà và lô đất không có câu: bot đo 5–6 câu mỗi 8 lượt tung (G8 = 5).
- Xây nhà tạo tiến trình dài hạn (G7 = 6).

**⏱️ Tốc độ 60 giây** (`app.js` `startSpeed`)
- Câu lấy ngẫu nhiên trong các từ đã học (`gamePool`), không theo engine (G4 = 2) và không thích ứng (G5 = 3).
- Câu nhận ra 4 lựa chọn, tính giờ 60 giây.
- Câu trả lời chỉ vào thống kê (`tally(..., side=true)`), không vào bản đồ năng lực. Vì vậy không làm bẩn bằng chứng, nhưng cũng không tạo bằng chứng (G3 = 7).
- Sai chỉ hiện "từ = nghĩa" (G6 = 4).

**🔗 Ghép cặp** (`startMatch`)
- Giống Tốc độ 60 giây: 6 từ ngẫu nhiên, không tính giờ cứng, chỉ giữ kỷ lục thời gian.
- Ghép nhầm có câu giải thích (G6 = 5).

**Nhận xét gốc rễ:**
- Điểm thấp nhất của cả 5 game là **G1 (học là luật chơi)**: câu hỏi vẫn là "cổng" trước lượt chơi.
- Muốn lên 9–10 phải có game mà **hành động chơi chính là dùng tiếng Anh**: Bài Câu (xếp câu), Quán cà phê (nghe để phục vụ), Thám tử (đọc để phá án).
- Hai game cũ cần chuyển sang **câu do engine chọn** (dùng lại `qItem` / `qAnswer` như ba game mới) thì mới tính là học: G4 2 → 9.

## 4b. Chấm 3 game mới (v74–v76)

| Tiêu chí | 🃏 Bài Câu | ☕ Quán Cà Phê | 🎯 Bắt Âm |
|---|---|---|---|
| G1 Học là luật chơi (×2) | 8 | 7 | 8 |
| G2 Đúng mục đích (×2) | 9 | 8 | 9 |
| G3 Bằng chứng sạch (×2) | 9 | 8 | 9 |
| G4 Engine chọn nội dung | 9 | 9 | 9 |
| G5 Độ khó tách đôi | 9 | 9 | 8 |
| G6 Phản hồi học tập | 8 | 8 | 9 |
| G7 Hấp dẫn thật (×2) | 7 | 7 | 7 |
| G8 Mật độ học | 6 | 8 | 9 |
| G9 Động lực trung thực | 9 | 9 | 9 |
| G10 Phát hành được | 9 | 9 | 8 |
| **Điểm có trọng số (÷ 14)** | **8,3** | **8,0** | **8,4** |

### Điểm theo chức năng

| Game | Chức năng | Tiêu chí riêng | Điểm |
|---|---|---|---|
| 🃏 Bài Câu | F3 ngữ pháp | F3a 9 · F3b 7 · F3c 7 | **7,7** ✓ |
| ☕ Quán Cà Phê | F7 giao tiếp | F7a 8 · F7b 8 · F7c 5 | **7,0** ✓ |
| ☕ Quán Cà Phê | F5 nghe | F5a 8 · F5b 5 · F5c 5 | **6,0** ✗ |
| 🎯 Bắt Âm | F4 phát âm | F4a 9 · F4b 8 · F4c 3 | **6,7** ✗ |

Ghi chú tiêu chí riêng:
- **F3b 7:** chỉ có lá bẫy khi câu chứa đúng từ hay sai.
- **F3c 7:** mới đo mức 3, chưa đo mức 4.
- **F7c 5:** chưa có cốt truyện rẽ nhánh.
- **F5b / F5c 5:** chỉ có câu đơn, chưa có đoạn và câu hỏi ý chính.
- **F4c 3:** chưa có phần nói.

### Căn cứ từng game

**🃏 Bài Câu** (`cards.ts`, `app.js eOrder`)
- Người chơi tự dựng câu: lá bài là từ của câu → bằng chứng mức 3, `g = 0` (G1, G3; e2e `cards.spec.ts`).
- Bùa và mục tiêu bàn chỉ đổi cách tính điểm (G5; test `engine-cards.test.ts`).
- Thua bàn không kết thúc ván (G9).
- Mỗi câu mất khoảng 20–30 giây để xếp, nên khoảng 2 câu / phút (G8 = 6).

**☕ Quán Cà Phê** (`cafe.ts`, `app.js eFn`)
- Nghe câu khách nói bằng giọng máy → nghe hiểu mức 2; chọn câu đáp đúng văn phong → mức 3; luôn 4 lựa chọn (G3; e2e `cafe.spec.ts`).
- Mới dùng câu đơn, chưa có đoạn hội thoại và câu hỏi ý chính → chưa đủ cho F5.

**🎯 Bắt Âm** (`bubbles.ts`)
- 3 bong bóng: đoán mò chỉ trúng 1/3. Câu nghe phân biệt âm dùng chung (tháp, dò) cũng đổi từ 2 lên 3 lựa chọn: sửa lỗi Đạt nhờ đoán mà báo cáo L03 nêu.
- Bong bóng trôi vào rồi đứng yên, không bắt chạm đích di động: tránh nhiễu kỹ năng tay (G3).
- Cần giọng đọc của máy (G10 = 8). Máy không có giọng thì báo rõ, không hỏi.

**Kết luận:**
- Cả 3 game đạt ngưỡng phát hành: G3 ≥ 8, G9 ≥ 8, tổng ≥ 7,5, G1 ≥ 7.
- F3 và F7 đạt.
- **F5 (nghe đoạn) và F4 (nói)** chưa đạt: cần 📻 Đài phát thanh và 🎤 Karaoke / 🤖 Robot ở đợt sau.

## 4c. Chấm 3 game đợt 2 (v77–v79)

| Tiêu chí | 📅 Câu đố ngày | 🔍 Thám tử | 📻 Đài phát thanh |
|---|---|---|---|
| G1 Học là luật chơi (×2) | 7 | 8 | 8 |
| G2 Đúng mục đích (×2) | 8 | 9 | 9 |
| G3 Bằng chứng sạch (×2) | 9 | 8 | 8 |
| G4 Engine chọn nội dung | 9 | 7 | 7 |
| G5 Độ khó tách đôi | 8 | 8 | 8 |
| G6 Phản hồi học tập | 7 | 9 | 8 |
| G7 Hấp dẫn thật (×2) | 7 | 6 | 6 |
| G8 Mật độ học | 6 | 5 | 5 |
| G9 Động lực trung thực | 9 | 9 | 9 |
| G10 Phát hành được | 9 | 9 | 8 |
| **Điểm có trọng số (÷ 14)** | **7,9** | **7,8** | **7,6** |

### Điểm theo chức năng

| Game | Chức năng | Tiêu chí riêng | Điểm |
|---|---|---|---|
| 📅 Câu đố ngày | F10 ôn tập | F10a 8 · F10b 9 · F10c 7 | **8,0** ✓ |
| 📅 Câu đố ngày | F2 từ mới | F2a 7 · F2b 6 · F2c 7 | **6,7** (phụ) |
| 🔍 Thám tử | F6 đọc hiểu | F6a 7 · F6b 7 · F6c 8 | **7,3** ✓ |
| 📻 Đài phát thanh | F5 nghe | F5a 9 · F5b 8 · F5c 7 | **8,0** ✓ |

Ghi chú tiêu chí riêng:
- **F10c 7:** cụm đã học thì nhớ lại tự gõ; cụm còn mới thì chọn từ theo nghĩa trong 4 (mức 2).
- **F2b 6:** từ chưa học có hình emoji và nút xem nghĩa, nhưng chưa có thẻ dạy riêng.
- **F6a 7:** bài A1 thường ngắn hơn 60 từ; câu hỏi bài của unit không có nhãn ý chính / chi tiết.
- **F6c 8:** chạm từ trong hồ sơ để xem nghĩa và nghe; từ chưa học gạch đậm.
- **F5c 7:** bài nghe dài và bài A1–A2 có câu ý chính / chi tiết / suy luận; bản tin từ bài của unit chỉ có câu chi tiết.

### Căn cứ từng game

**📅 Câu đố ngày** (`puzzle.ts`, `app.js eGroup`)
- 4 cụm từ do engine chọn: cụm sắp quên trước, rồi đang học, rồi lộ trình (G4, F10a).
- Mỗi bàn 4 **họ chủ đề** khác nhau (`family()`): cụm gần nghĩa (Ngày / Tháng / Giờ) không cùng bàn, cụm trừu tượng (đại từ, giới từ, thành ngữ…) không dùng. Đây là gốc rễ của lỗi "một từ hợp hai nhóm" thấy khi chạy thử.
- Ghép nhóm **không** vào năng lực (sai một nhóm không chỉ ra được hổng nút nào). Bằng chứng chỉ từ câu nhớ lại sau mỗi nhóm: từ khác của cùng cụm, không có trên bàn; nhiễu cùng chủ đề (G3; e2e `puzzle.spec.ts`).
- Không giới hạn lượt nộp, sai chỉ bớt sao; bỏ ngày không mất gì (G9).

**🔍 Thám tử** (`detective.ts`, `app.js eTexts`)
- Bài đúng cấp người học đang học (cấp hay gặp nhất của lộ trình), chưa làm trước, bài của unit đã học trước: từ quen trong ngữ cảnh mới (F11).
- Mỗi manh mối 3 lựa chọn; câu ý chính là "kết luận vụ án". Sai thì tô sáng câu chứa đáp án + "vì sao" + thử lại một lần (không tính điểm) (G6).
- Điểm bài lưu như tab Đọc (`st.lread`, `st.units[].read`), nên Can-Do đọc tăng như làm ở tab đó. Không gửi bằng chứng vào nút từ / ngữ pháp (G3; e2e `case.spec.ts`).
- Mỗi bài 3–6 câu trong 2–4 phút (G8 = 5).

**📻 Đài phát thanh** (`detective.ts` dùng chung, `caseview.ts`)
- Nghe cả bài bằng giọng máy (hai giọng với bài hội thoại); lời ẩn tới cuối; nghe lại / nghe chậm không giới hạn (F5a, F5b).
- Điểm lưu như tab Nghe (`st.lread`, `st.units[].listen`). Máy không có giọng thì ẩn thẻ game và báo rõ (G10 = 8).

**Kết luận:**
- Cả 3 game đạt ngưỡng phát hành: G3 ≥ 8, G9 ≥ 8, G1 ≥ 7, tổng ≥ 7,5.
- F10, F6 và **F5** đạt (F5 trước đây 6,0 ✗ vì chỉ có câu đơn).
- Còn chưa có game: F8 nói, F9 viết, F12 luyện thi, F1 chẩn đoán.

## 5. Đề xuất ưu tiên (chức năng chưa có game, xếp theo lợi ích ÷ công sức)

| Thứ tự | Game | Chức năng phục vụ | Lý do |
|---|---|---|---|
| 1 | 🃏 Bài Câu | F3 ngữ pháp, F11 | G1 cao nhất; dùng câu có sẵn (sắp xếp câu, câu ví dụ) |
| 2 | ☕ Quán cà phê | F5 nghe, F7 giao tiếp | Lấp chỗ trống lớn nhất: nghe đang là nút thắt (L03); 58 nút `fn:` chưa có game |
| 3 | 📅 Câu đố ngày | F10 ôn tập, F2 | Rất dễ làm, thói quen hằng ngày |
| 4 | 🔍 Thám tử | F6 đọc, F11 transfer | Cần viết cốt truyện |
| 5 | 🎯 Bắt âm / 🎤 Karaoke / 🤖 Robot | F4, F8 | Cần nhận dạng giọng, phụ thuộc máy |
| 6 | ⚔️ Đấu trường đề | F12 | Khi bật lại mục tiêu IELTS / VSTEP |

---

## 6. Ứng viên đợt 3: chức năng còn thiếu game và các thể loại đang thịnh hành (2026)

Xu hướng thị trường 2026 (AppMagic, Sensor Tower qua PocketGamer.biz):
- xếp hình / match-3 dẫn đầu doanh thu casual;
- **merge** tăng nhanh nhất (+74%);
- game xếp khối dẫn lượt tải;
- game điều khiển bằng giọng nói và nhập vai hội thoại AI đang nổi trong mảng học ngôn ngữ.

Chỉ lấy **thể loại**, không dùng tên / hình / âm thanh của game nào (test `ip-names`).

Năng lực app dùng được:
- nhận diện giọng của trình duyệt `asrMatch` / `asrWord` (`app.js`): Chrome / Edge / Safari iOS, cần mạng; hiện chỉ là phản hồi, không vào mức thuộc;
- ghi âm `HAS_REC`;
- chấm viết theo luật `perfEst`;
- `WTASKS` / `STASKS`;
- 26 dạng câu thi `x:` (mục tiêu thi đang tắt).

### 6.1 Chức năng còn trống / chưa đạt

| Chức năng | Tình trạng | Điểm hiện tại |
|---|---|---|
| **F8 Nói** | chưa có game | — |
| **F9 Viết** | chưa có game | — |
| **F1 Xếp lớp & chẩn đoán** | chỉ có bài chẩn đoán dạng câu hỏi | — |
| **F12 Luyện thi** | chưa có game (mục tiêu thi đang tắt) | — |
| F4 Phát âm | Bắt Âm thiếu phần **nói** | 6,7 ✗ |
| F2 Từ mới | Câu đố ngày (phụ) | 6,7 ✗ |
| F13 Thói quen | Bàn Cờ Phố | 7,1 (tạm) |
| (game cũ) | Tốc độ 60 giây 5,6 · Ghép cặp 5,9: chưa dùng engine | ✗ |

### 6.2 Chấm các thể loại ứng viên

Cột G: G1 · G2 · G3 · G4 · G5 · G6 · G7 · G8 · G9 · G10. 

| Ứng viên (thể loại thịnh hành) | Chức năng | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 | **Tổng** | Điểm chức năng | Phát hành? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 🎤 **Karaoke nói nhại** (nhịp điệu) | F8 | 8 | 8 | 8 | 7 | 7 | 7 | 7 | 8 | 9 | 6 | **7,6** | F8 8,0 | ✓ |
| 🤖 **Ra lệnh cho robot** (điều khiển bằng giọng) | F8 | 9 | 8 | 8 | 8 | 8 | 7 | 8 | 7 | 9 | 6 | **7,9** | F8 8,3 | ✓ |
| 🎭 Lồng tiếng cảnh phim | F8 | 8 | 7 | 8 | 6 | 6 | 6 | 8 | 6 | 9 | 6 | 7,2 | F8 7,3 | ✗ (tổng < 7,5) |
| 🗣️ Nhập vai hội thoại AI | F7, F8 | 9 | 8 | 5 | 6 | 6 | 8 | 9 | 7 | 8 | 2 | 6,9 | — | ✗ (cần máy chủ / chi phí, không offline, chấm khó kiểm) |
| 🎯 Bắt Âm + vòng **nói thử** cặp âm | F4 | 8 | 9 | 8 | 9 | 8 | 9 | 7 | 9 | 9 | 7 | **8,2** | F4 6,7 → **8,0** | ✓ |
| ✍️ **Xưởng câu tự gõ** (Bài Câu chế độ gõ, mức 4) | F9, F3 | 8 | 8 | 9 | 9 | 8 | 8 | 7 | 6 | 9 | 9 | **8,1** | F9 6,3 | ✓ game · F9 ✗ (chỉ ở mức câu) |
| ✉️ **Thư gửi cư dân phố** (cozy, nhân vật hồi âm) | F9 | 9 | 9 | 8* | 7 | 7 | 8 | 7 | 4 | 9 | 9 | **7,9** | F9 7,7 | ✓ |
| 🔠 Ô chữ (crossword) | F2 chính tả | 8 | 7 | 9 | 8 | 8 | 7 | 7 | 7 | 9 | 9 | **7,9** | F2 6,3 | ✓ game · F2 ✗ |
| 🃏 Lật thẻ ghép đôi (trí nhớ vị trí) | F2 | 6 | 7 | 6 | 7 | 7 | 6 | 7 | 6 | 9 | 9 | 6,9 | — | ✗ (nhớ vị trí ≠ tiếng Anh) |
| 💎 Ghép 3 (match-3, doanh thu số 1) | F2 | 3 | 5 | 4 | 6 | 6 | 4 | 9 | 4 | 7 | 9 | 5,5 | — | ✗ (G1, G3: xếp màu không phải tiếng Anh) |
| ⚓ Chợ ghép đồ (merge, tăng nhanh nhất) | F7, F2 | 7 | 7 | 8* | 8 | 8 | 7 | 9 | 5 | 8 | 9 | **7,7** | F7 7,0 | ✓ (*chỉ câu đọc đơn hàng vào năng lực) |
| 🗺️ **Thám hiểm sương mù** (bản đồ khám phá) | F1 | 6 | 9 | 9 | 9 | 9 | 5 | 6 | 8 | 9 | 9 | **7,8** | F1 8,3 | ✗ (G1 6 < 7) → sửa: mở ô theo **loại câu**, không theo đúng / sai |
| ⚔️ **Đấu trường đề** (roguelike đánh bài) | F12 | 7 | 9 | 8 | 8 | 7 | 8 | 8 | 7 | 8 | 9 | **7,9** | F12 8,0 | ✓ nhưng cần bật lại mục tiêu thi |
| 📒 Sổ sưu tập + giải đấu tuần (lớp meta) | F13 | — | — | — | — | — | — | — | — | — | — | — | F13 8,7 | lớp phủ mọi game, không phải game riêng |

\* G3 chỉ đạt 8 khi **chỉ phần chấm khách quan** vào năng lực:
- nói: khớp từ của nhận diện giọng là phản hồi, hoặc chỉ đếm từ khớp, như quy định hiện tại;
- viết: chỉ tính từ khoá / cấu trúc bắt buộc;
- `perfEst` chỉ là ước tính, không vào năng lực.

**Nhận xét gốc rễ:**
- **F8 / F4 nói:** điểm trần là **G10 = 6**, vì nhận diện giọng cần trình duyệt hỗ trợ và cần mạng.
  - Firefox không có; máy không có thì phải ẩn game và báo rõ.
- **Match-3 / lật thẻ** phổ biến nhất nhưng **không học được**: hành động chơi không phải tiếng Anh. Không nên làm dù thịnh hành.
- **Merge** là cơ hội tốt cho F7 nếu đơn hàng đến bằng hội thoại.
- **Nhập vai AI** bị loại vì app là PWA offline, miễn phí, không máy chủ.

### 6.3 Đề xuất thứ tự (dễ trước, theo chức năng)

| Đợt | Game | Chức năng | Vì sao trước |
|---|---|---|---|
| 1 | 🎯 Bắt Âm thêm vòng nói thử (`asrWord`) | F4 | Sửa nhỏ, nâng F4 lên ≥ 7 |
| 1 | 🎤 Karaoke nói nhại (`asrMatch` + câu thoại `DIALOGUES`) | F8 | Dùng lại ASR + 525 câu thoại có sẵn |
| 2 | 🤖 Ra lệnh cho robot | F8 | Hấp dẫn nhất cho nói; cần làm mê cung |
| 2 | ✍️ Xưởng câu tự gõ | F9, F3 | Nâng cấp Bài Câu, gần như miễn phí |
| 3 | ✉️ Thư gửi cư dân phố | F9 | Cần soạn đề thư + luật chấm khách quan |
| 3 | 🗺️ Thám hiểm sương mù | F1 | Đặt lại câu dò của chẩn đoán vào bản đồ |
| 4 | Chuyển Tốc độ 60 giây / Ghép cặp sang engine | F10, F2 | G4 2 → 9 |
| sau | ⚔️ Đấu trường đề · ⚓ Chợ ghép đồ · 📒 Sổ sưu tập | F12, F7, F13 | Chờ bật mục tiêu thi / công sức lớn |

### 6.4 Đã làm đợt 3 (v80–v82): chấm theo bản thật

| Tiêu chí | 🎯 Bắt Âm + nói thử | 🎤 Karaoke hội thoại | 🛠️ Xưởng sửa câu |
|---|---|---|---|
| G1 Học là luật chơi (×2) | 8 | 8 | 8 |
| G2 Đúng mục đích (×2) | 9 | 8 | 9 |
| G3 Bằng chứng sạch (×2) | 8 | 8 | 9 |
| G4 Engine chọn nội dung | 9 | 7 | 9 |
| G5 Độ khó tách đôi | 8 | 7 | 8 |
| G6 Phản hồi học tập | 9 | 7 | 9 |
| G7 Hấp dẫn thật (×2) | 7 | 7 | 6 |
| G8 Mật độ học | 9 | 7 | 6 |
| G9 Động lực trung thực | 9 | 9 | 9 |
| G10 Phát hành được | 7 | 7 | 9 |
| **Điểm có trọng số (÷ 14)** | **8,2** | **7,6** | **8,1** |

| Game | Chức năng | Tiêu chí riêng | Điểm |
|---|---|---|---|
| 🎯 Bắt Âm + nói thử | F4 phát âm | F4a 9 · F4b 8 · F4c 7 | **8,0** ✓ (trước 6,7) |
| 🎤 Karaoke hội thoại | F8 nói | F8a 9 · F8b 7 · F8c 9 | **8,3** ✓ |
| 🛠️ Xưởng sửa câu | F3 ngữ pháp | F3a 9 · F3b 9 · F3c 9 | **9,0** ✓ |
| 🛠️ Xưởng sửa câu | F9 viết | F9a 8 · F9b 3 · F9c 7 | 6,0 (phụ: mới ở mức câu) |

**🎯 Bắt Âm + nói thử** (`bubbleview.ts`, `host.asr`)
- Sau mỗi từ, nút "Nói thử" dùng chung máy nghe giọng của app (`asrBox`). Máy nghe ra đúng từ, hay nghe thành từ kia của cặp âm.
- Đúng thì +5 điểm. Đây là telemetry, không vào năng lực, đúng quy định chung của app với nhận diện giọng (G3).
- Máy không nghe được giọng thì không hiện phần nói (G10 = 7).

**🎤 Karaoke hội thoại** (`karaoke.ts`, `karaview.ts`)
- Engine chọn một hội thoại ở cấp người học đang học: chưa đóng vai trước, ưu tiên hội thoại có chức năng giao tiếp đang học.
- Người học nói vai B, máy đọc vai A. Mỗi câu: nghe mẫu / nghe chậm, nói, máy tô xanh từ nghe ra.
- Máy không nghe được giọng thì tự chấm (Dễ / Được / Khó), như màn Đóng vai. Nhờ vậy game vẫn chơi được trên mọi trình duyệt (G10 = 7).
- Kết quả lưu như màn Đóng vai (`st.dlg[].rp`), tính vào Can-Do nói. Không ghi bằng chứng vào nút (e2e `speak.spec.ts`).

**🛠️ Xưởng sửa câu** (`workshop.ts`, `app.js eFixes`)
- Mỗi đơn là một câu sai hay gặp của điểm ngữ pháp engine chọn (154 / 154 điểm có câu sai). Ô nhập điền sẵn câu hỏng để sửa đúng chỗ.
- Đúng = bằng chứng mức 4, `g = 0`.
- Sai thì tô xanh từ cần sửa + "vì sao" (G6).
- 6 đơn mỗi ca, mỗi câu mất khoảng 20–30 giây (G8 = 6).

**Còn lại sau đợt 3:**
- F9 viết đoạn: ✉️ Thư gửi cư dân phố.
- F1: 🗺️ Thám hiểm sương mù, phải sửa G1 trước.
- F12: ⚔️ Đấu trường đề, chờ bật mục tiêu thi.
- 🤖 Ra lệnh cho robot (F8, game thứ hai cho nói).
- Chuyển Tốc độ 60 giây / Ghép cặp sang engine.

### 6.5 Đã làm đợt 4 (v83–v85): chấm theo bản thật

| Tiêu chí | ✉️ Thư gửi cư dân phố | 🤖 Ra lệnh cho robot | ⏱️ Tốc độ 60 giây (v85) | 🔗 Ghép cặp (v85) |
|---|---|---|---|---|
| G1 Học là luật chơi (×2) | 9 | 9 | 4 | 6 |
| G2 Đúng mục đích (×2) | 9 | 8 | 6 | 6 |
| G3 Bằng chứng sạch (×2) | 8 | 8 | 7 | 7 |
| G4 Engine chọn nội dung | 6 | 8 | 7 | 7 |
| G5 Độ khó tách đôi | 7 | 7 | 3 | 3 |
| G6 Phản hồi học tập | 8 | 7 | 4 | 7 |
| G7 Hấp dẫn thật (×2) | 7 | 8 | 6 | 6 |
| G8 Mật độ học | 4 | 6 | 9 | 7 |
| G9 Động lực trung thực | 9 | 9 | 8 | 9 |
| G10 Phát hành được | 9 | 8 | 8 | 8 |
| **Điểm có trọng số (÷ 14)** | **7,8** | **7,9** | 6,1 (trước 5,6) | 6,5 (trước 5,9) |

| Game | Chức năng | Tiêu chí riêng | Điểm |
|---|---|---|---|
| ✉️ Thư gửi cư dân phố | F9 viết | F9a 9 · F9b 7 · F9c 7 | **7,7** ✓ (trước 6,0) |
| 🤖 Ra lệnh cho robot | F8 nói | F8a 7 · F8b 7 · F8c 9 | **7,7** ✓ |

**✉️ Thư gửi cư dân phố** (`letters.ts`, `app.js` host `wtasks` / `wcheck` / `wsave`)
- Cư dân nhờ viết thư theo 48 đề viết của app, đúng cấp đang học. Đề chưa viết được chọn trước.
- Máy kiểm thư là `writeChecks` của màn Viết theo đề (độ dài, đoạn, từ nối, cụm của đề, lặp từ, câu, viết hoa / dấu câu) cộng lỗi hay gặp `grammarHints`.
- Cư dân hồi âm:
  - đạt đúng điều kiện của màn Viết theo đề → cảm ơn + quà trang trí phố;
  - thiếu → hỏi lại đúng mục thiếu.
- Sửa, gửi lại không mất gì. Tự chấm 4 tiêu chí rồi lưu như màn Viết theo đề, nên Can-Do viết tăng (e2e `play4.spec.ts`).
- G4 = 6: chọn đề theo cấp và trạng thái, chưa theo từng nút.
- G8 = 4: một thư mất 5–10 phút.

**🤖 Ra lệnh cho robot** (`robot.ts`)
- Đồ vật trên lưới là hình của từ thuộc cụm do engine chọn.
- Lệnh tiếng Anh nói (máy nghe tự do) hoặc gõ, cùng bộ phân tích: đi, số bước, nhặt, về Nhà, nối bằng "then".
- Robot chỉ nhặt khi gọi đúng tên tiếng Anh. Gọi sai thì gợi chữ cái đầu.
- Lệnh không vào mức thuộc (G3).
- Máy không nghe được giọng thì gõ lệnh (G10 = 8), nhưng khi đó không còn là nói (F8a = 7).

**⏱️ Tốc độ 60 giây / 🔗 Ghép cặp (v85)**
- Nguồn từ (`gamePool`) đổi sang: từ đến hạn ôn trước, rồi từ mới học. Ghép nhầm có giải thích nghĩa cả hai từ.
- Vẫn dưới ngưỡng phát hành, vì G1 / G5 thấp do luật chơi cũ. Giữ như trò phụ; chưa nên quảng bá.

### 6.6 Đợt 5 (v86–v87): chỉ tập trung CEFR

**Quyết định (10/2026):** app chỉ tập trung CEFR. F12 Luyện thi (IELTS / VSTEP, ⚔️ Đấu trường đề) **bỏ khỏi kế hoạch game**. Đợt này lấp hai chức năng CEFR cuối cùng chưa có game đạt chuẩn: F1 và F2.

| Tiêu chí | 🗺️ Thám hiểm sương mù | 🌱 Vườn từ |
|---|---|---|
| G1 Học là luật chơi (×2) | 7 | 7 |
| G2 Đúng mục đích (×2) | 9 | 9 |
| G3 Bằng chứng sạch (×2) | 9 | 9 |
| G4 Engine chọn nội dung | 9 | 8 |
| G5 Độ khó tách đôi | 9 | 8 |
| G6 Phản hồi học tập | 5 | 9 |
| G7 Hấp dẫn thật (×2) | 6 | 7 |
| G8 Mật độ học | 8 | 7 |
| G9 Động lực trung thực | 9 | 9 |
| G10 Phát hành được | 9 | 9 |
| **Điểm có trọng số (÷ 14)** | **7,9** | **8,1** |

| Game | Chức năng | Tiêu chí riêng | Điểm |
|---|---|---|---|
| 🗺️ Thám hiểm sương mù | F1 xếp lớp & chẩn đoán | F1a 8 · F1b 9 · F1c 7 | **8,0** ✓ |
| 🌱 Vườn từ | F2 học từ mới | F2a 9 · F2b 9 · F2c 8 | **8,7** ✓ (trước 6,7) |

**🗺️ Thám hiểm sương mù** (`diagview.ts` `viewFogPick` / `fogMap`, `main.ts` `fgstart` / `fgpick`)
- Bọc **đúng bài chẩn đoán** (cầu thang theo cấp, trừ đoán mò, tiên nghiệm, tự đặt mục tiêu).
- Người chơi chọn đường 🌲 Từ vựng / ⛰️ Ngữ pháp; engine chọn điểm dò có ích nhất của đường đó.
- Một đường đủ nửa bản đồ thì khoá, để đo cân đối (F1c).
- Ô sương **mở dù đúng hay sai**, cảnh theo seed: không có phần thưởng cho câu đúng nên không có lý do đoán bừa (F1b, G3).
- Tối đa 7 ngày một lần, vì cấp không đổi nhanh hơn thế (tránh làm bài xếp lớp thay cho học).
- **Xếp lớp lại chỉ dò phần chưa có bằng chứng thật.** Bot L01 cho thấy: dò cả phần vừa luyện thì người học trả lời đúng ở đó, cầu thang lên cấp, và tiên nghiệm coi cả phần chưa học cùng cấp là "đã biết". Lần thám hiểm thứ hai làm 17 nút bị tạm Đạt sai; sau khi sửa còn tối đa 2, ngang các bản trước.
- G6 = 5 là cố ý: bài xếp lớp không dạy, không chữa giữa chừng.
- F1c = 7: chỉ từ vựng + ngữ pháp; nghe / đọc lấy từ bài kiểm tra Nghe + Đọc.

**🌱 Vườn từ** (`garden.ts`, `gardenview.ts`, host `wordsOf`)
- Từ mới của cụm engine chọn trên lộ trình.
- Mỗi từ là một cây: 🌰 thẻ dạy trước (hình, IPA, 🔊, câu ví dụ) → 🌱 nhận ra (mức 1) → 🌿 nhớ ngược (mức 2) → 🌸 tự gõ (mức 3, `g = 0`).
- Đúng lên một bậc, sai giữ bậc + xem lại thẻ.
- **Tối đa một bậc / ngày** (giãn cách). Cây đang lớn được tưới trước, còn chỗ mới gieo từ mới.
- Bằng chứng cùng mã câu với câu dò của tháp (e2e `play5.spec.ts`).

**Kết quả sau đợt 5:** mọi chức năng CEFR (F1–F11, F13) đều có ít nhất một game đạt ngưỡng phát hành. Còn yếu:
- F13 thói quen: Bàn Cờ Phố 7,1. Hướng tiếp: sổ sưu tập / giải đấu tuần làm lớp phủ.
- Hai game cũ Tốc độ 60 giây / Ghép cặp: giữ làm trò phụ.

Nguồn xu hướng:
- [PocketGamer.biz: H1 2026 genre analysis](https://www.pocketgamer.biz/h1-2026-genre-analysis-strategy-stumbles-rpgs-fall-and-puzzle-revenue-ramps-up/)
- [Top mobile puzzle games 2026](https://respawn.outlookindia.com/gaming/gaming-news/top-mobile-puzzle-games-ruling-the-global-grossing-charts-in-2026)
- [Biggest mobile games of August 2026](https://www.globalgamesforum.com/news-media/the-biggest-mobile-games-of-august-2026)
- [Voice Filter: Speak Challenge](https://apps.apple.com/us/app/-/id6739994048) (ví dụ thể loại điều khiển bằng giọng)

## 7. Bộ não chọn game (v88)

**Vấn đề.** Đã có 15 game, nhưng sảnh chỉ liệt kê, người học phải tự chọn và hay phân vân. Gốc rễ: *nội dung* câu hỏi trong mọi game đã do engine chọn (`floorBase` / NBA). Phần còn bỏ trống là chọn *dạng game* hợp với nhu cầu học lúc này. Chọn sai dạng (ví dụ chơi Bài Câu, vốn chỉ hỏi ngữ pháp, trong khi nhu cầu là ôn từ sắp quên) thì câu trả lời không trúng chỗ cần học.

**Cách làm** (`src/engine/director.ts`, thuần hàm, test `engine-director.test.ts`):

| Nhu cầu (điểm gốc) | Game |
|---|---|
| Chưa xếp lớp (100) | 🗺️ Thám hiểm |
| Cây đến ngày tưới (92) | 🌱 Vườn từ |
| ≥ 5 phần sắp quên / NBA = ôn (88 / 84) | 🧱 Xếp Khối / 📅 Câu đố ngày |
| NBA học nút `u:` (78) | 🌱 Vườn từ |
| NBA học nút `g:` (80) | 🃏 Bài Câu, hoặc 🛠️ Xưởng sửa câu khi đang sai / có hiểu sai |
| NBA học nút `fn:` (80) | ☕ Quán, hoặc 🎤 Karaoke khi đã luyện và có máy nghe |
| Nút `ph:` / điểm nghẽn âm (80 / 76) | 🎯 Bắt Âm |
| Kiểm tra / xác minh / transfer (74) | 🏰 Leo tháp |
| Can-Do đọc / nghe / viết / nói còn thiếu (50–65) | 🔍 Thám tử / 📻 Đài / ✉️ Thư / 🎤 Karaoke (🤖 Robot khi không có máy nghe) |
| Nhiều phần "tạm Đạt" + hết hạn chờ 7 ngày (62) | 🗺️ Thám hiểm lại |
| Chơi thêm (20–40) | 🏰 Tháp / 🎲 Bàn Cờ / 🤖 Robot |

- **Điểm nghẽn** được ưu tiên ngay sau ôn / tưới, trên bước học mới (86 / 84 / 82).
- **Mảng nền ít luyện:** mảng nền còn trên lộ trình mà 7 ngày qua chiếm dưới 10% số câu được cộng 22 điểm.
- **Ngưỡng ôn:** cần ≥ 8 phần sắp quên, hoặc ≥ 12 khi tỉ lệ đúng gần đây ≥ 85%.
- **Đổi dạng (interleaving):** game vừa chơi bị trừ 45 điểm, game đã chơi xong hôm nay bị trừ 25.
- **Lộ trình hôm nay:** 3 chặng chốt một lần mỗi ngày. Mỗi chặng phục vụ một nhu cầu khác nhau, tối đa một chặng kỹ năng, thứ tự ôn / tưới trước rồi học mới. Lý do: người mới thiếu mọi Can-Do, nên nếu không giới hạn thì kỹ năng chiếm hết lộ trình trong khi từ và ngữ pháp nền mới là thứ mở đường.
- **"▶ Chơi tiếp"** là chặng đầu tiên chưa xong. Hết lộ trình thì app vẫn chọn game đầu bảng.
- **Màn kết của mọi game** có nút "▶ Tiếp" đi thẳng sang game kế, không quay về danh sách.
- **Lý do luôn nói nhu cầu** (ví dụ "4 từ đến ngày tưới…", "Ngữ pháp đang học: …"), không nói điểm game (P13).
- **Mỗi lựa chọn có snapshot `dir`** (Vì sao? / replay).
- **Người học vẫn tự chọn được** trong "Tất cả trò chơi (tự chọn)".

## 8. Trục T: tiêu chí trải nghiệm người chơi (v89)

### 8.0 Vì sao thêm một trục riêng

Bộ G1–G10 đo **học có thật không**. Nó chưa đo **game có đủ hấp dẫn để người ta muốn chơi không**:
- độ hấp dẫn chỉ có một dòng (G7 ×2), tức 2/14 ≈ 14% tổng điểm. Một game nhàm vẫn đạt 7,5 để phát hành;
- G7 quá thô: gần như mọi game đều 6–7, nên không biết game nhàm vì lý do gì và không lập được việc sửa;
- cổng bắt buộc chỉ có G3 và G9, không có cổng nào về trải nghiệm;
- mọi điểm đều tự chấm. Bot L01–L03 đo việc học, không đo được "vui";
- gộp học và chơi thành một trung bình thì điểm học cao che được điểm chơi thấp.

Vì vậy tách thành **hai trục độc lập**: G (học) và T (trải nghiệm). **Không lấy trung bình hai trục.** G7 giữ lại làm điểm tóm tắt; chi tiết nằm ở T.

**Vị trí của trục T trong spec v2.4** (xem §9.0):
- T là phần "Motivation / Game Progression" (thành phần 24) và tiêu chí C341 *Fun ≠ Learning*. T **phục vụ** North Star ("tiến bộ đã xác minh trên mỗi đơn vị công sức"), không phải mục tiêu riêng.
- Spec cấm tối ưu thời gian trong app, số ván, XP, streak (§I, §XXIII). Vì vậy trục T không có chỉ tiêu "chơi lâu hơn". Nó chỉ đo: người học có bỏ dở không, có đi tiếp không, và mỗi phút chơi đem lại bao nhiêu câu học.
- Sửa T không bao giờ được làm giảm G (nhất là G3, G8) hay tăng công sức trên mỗi phần đã xác minh.

### 8.1 Mười tiêu chí chung T1–T10 (mốc 0 / 5 / 10)

| # | Tiêu chí | 0 điểm | 5 điểm | 10 điểm |
|---|---|---|---|---|
| T1 (×2) | **Vòng lặp lõi rõ** | Không hiểu phải làm gì | Hiểu sau khi đọc hướng dẫn | Hiểu trong ≤ 10 giây, không cần đọc; mỗi lượt đi đủ mục tiêu → hành động → phản hồi → phần thưởng |
| T2 (×2) | **Quyết định có ý nghĩa, trùng đường học** | Chỉ chọn đáp án đúng / sai, không có hậu quả | Có lựa chọn nhưng luôn có một cách tối ưu hiển nhiên | Quyết định **là hành động tiếng Anh** (dựng câu, ra lệnh, chọn câu đáp hợp văn phong, tìm chỗ sai) có hậu quả thấy được trong game; hoặc quyết định meta ngoài vòng chơi (tiêu xu kiếm được theo giá trị học). Không bao giờ là chọn nội dung / độ khó (C69: engine quyết), không là thao tác rỗng giữa các câu (HG24), không thưởng chiến thuật trái đường học (C345) |
| T3 | **Cảm giác tay (juice)** | Tĩnh, chỉ đổi màu nút | Có âm và hiệu ứng đơn | Phản hồi ≤ 100 ms; hình, tiếng, chuyển động phân tầng: nhỏ cho mỗi lượt, lớn cho combo / hoàn thành |
| T4 | **Đường cong thử thách** | Phẳng hoặc gãy | Màn sau khó hơn màn trước | Độ khó *game* tăng trong ván, có nhịp căng – nghỉ; tỉ lệ đúng phần ngôn ngữ giữ 70–85% (P14) |
| T5 (×2) | **Tiến trình nhiều tầng** | Không có gì giữ lại | Có điểm / kỷ lục | Ngắn (trong ván) + trung (tuần: sưu tập, nâng cấp) + dài (một thế giới lớn dần, thấy được) |
| T6 | **Đa dạng & bất ngờ** | Ván thứ 5 giống ván 1 | Có biến thể ngẫu nhiên | Có sự kiện, trùm, luật xoay vòng; vẫn thấy mới sau 10 ván |
| T7 | **Bản sắc & cảm xúc** | Chỉ emoji / biểu mẫu | Có chủ đề | Nhân vật, thế giới, giọng văn nhất quán; người chơi quan tâm điều gì xảy ra tiếp |
| T8 | **Nhịp phiên & điểm dừng** | Ván lê thê hoặc dừng đột ngột | Ván có kết thúc | Ván ≤ 8 phút, kết thúc có tổng kết và điểm dừng tự nhiên, móc quay lại không dựa vào sợ mất (G9, HG20) |
| T9 | **Rào cản vào thấp** | Cần hướng dẫn dài, dễ kẹt | Có hướng dẫn | Làm quen ≤ 1 màn, thua nhẹ nhàng, chơi được một tay, khi tắt tiếng, với trình đọc màn hình |
| T10 (×2) | **Giữ được người học (đo thật)** | Số liệu cho thấy hay bỏ dở / xong là thôi | Chưa đo (mặc định 5) | Đạt ngưỡng ở §8.3 (Persistence C336, không phải thời gian trong app) |

Điểm T = trung bình có trọng số (÷ 14).

**Bổ sung v110 (bắt buộc cho mọi game, không chấm điểm riêng):** màn kết phải có dòng 🎯 nối ván với mục tiêu học, dùng chung `endExtras` (SPEC.md, mục "Hợp đồng hiển thị tiến độ"). Game có lớp phủ toàn màn hình hiện dòng này trong hộp kết. Thiếu dòng này thì T5 (meta) và T7 (bản sắc) không được quá 6, vì phần thưởng game không có ý nghĩa nếu người học không thấy mình tiến tới đâu.

### 8.2 Tiêu chí riêng theo thể loại

| Thể loại | Game trong app | Tiêu chí riêng |
|---|---|---|
| Arcade / phản xạ | ⏱️ Tốc độ 60 giây, 🎯 Bắt Âm | Nhịp tăng dần; combo / chuỗi; tốc độ chỉ là lớp vui, không vào năng lực (P15) |
| Xếp hình / đố | 🧱 Xếp Khối Chữ, 📅 Câu đố ngày, 🔗 Ghép cặp | Có khoảnh khắc "à ra thế"; không có lời giải mơ hồ; câu đố ngày giống nhau cho mọi người để so / chia sẻ |
| Xây bộ bài | 🃏 Bài Câu | Tổ hợp bùa đa dạng; rủi ro – phần thưởng mỗi bàn; bộ sưu tập giữ lại giữa các ván |
| Quản lý / phục vụ | ☕ Quán Cà Phê, 🛠️ Xưởng sửa câu | Phải ưu tiên giữa nhiều việc; nâng cấp cửa hàng thấy được; khách có cá tính |
| Truyện / điều tra | 🔍 Thám tử, 📻 Đài phát thanh | Bí ẩn có cú lật; manh mối nối với nhau; lựa chọn của người chơi đổi kết cục |
| Nuôi trồng nhẹ nhàng | 🌱 Vườn từ, ✉️ Thư gửi cư dân phố | Chăm sóc không bị phạt; thế giới đẹp dần; quan hệ với nhân vật |
| Bàn cờ / leo tháp | 🎲 Bàn Cờ Phố, 🏰 Leo tháp | Rủi ro có kiểm soát; mốc rõ; lượt không có câu không kéo dài (G8) |
| Ra lệnh / lập trình | 🤖 Ra lệnh cho robot | Có nhiều lời giải; lời giải gọn được thưởng; màn sau dùng lại khái niệm màn trước |
| Trình diễn | 🎤 Karaoke hội thoại | Theo nhịp; có khoảnh khắc "biểu diễn" (tổng kết, nghe lại giọng mình) |
| Khám phá | 🗺️ Thám hiểm sương mù | Tò mò về ô chưa mở; thưởng khám phá không gắn với đúng / sai (F1b) |

### 8.3 Đo bằng số liệu thay vì tự chấm

Mỗi game đếm trên máy (`src/engine/play.ts`, `st.e.pm`). Đây là tier 0 telemetry: tách khỏi sổ bằng chứng (P28), có giới hạn (20 lần gần nhất mỗi game, tránh lưu vô nghĩa, Ultimate Test câu 16), không gửi đi đâu (§XX local-first).

| Chỉ số | Cách tính | Ngưỡng đạt | Kiểm cho | Thước đo của spec |
|---|---|---|---|---|
| Bỏ giữa ván | Ván bắt đầu mà không tới màn kết (mở game khác / về sảnh / đóng app) | < 20% | T8, T9, T10 | Persistence (C336) |
| Chơi tiếp sau ván | Xong ván rồi mở ván mới (game nào cũng được) trong 10 phút | ≥ 50% số ván xong | T8, T10 | Persistence (C336) |
| Câu bằng chứng / phút | Số câu vào sổ bằng chứng trong ván ÷ phút (game kỹ năng lưu vào Can-Do thì không đếm) | ≥ 2 | G8, so với T | Evidence / Learner Effort (§72, C341, C360) |
| Thời gian tới thao tác đầu | Từ lúc mở game tới thao tác đầu | ≤ 10 giây | T1, T9 | Learner Effort |
| Thời lượng ván | Trung vị | ≤ 8 phút (không có cận dưới: ngắn mà đủ là tốt) | T8 | Effort là ràng buộc hạng nhất |

**Không dùng làm ngưỡng:** số ván tự chọn / chơi lại (chỉ để xem). Bộ não chọn game là lối chính; đặt chỉ tiêu "tự chọn nhiều" là trái C190 (UX không bắt tự chọn curriculum).

Bot không đo được cảm xúc. Bổ sung **playtest 5 người mỗi game**: quan sát chỗ kẹt, cuối ván hỏi "Bạn có muốn chơi thêm một ván không?".

### 8.4 Luật phát hành mới

- Giữ nguyên, là cổng cứng: G ≥ 7,5, G3 ≥ 8, G9 ≥ 8.
- T là cổng để **quảng bá / đưa lên bộ não chọn game**: T ≥ 7 và không tiêu chí T nào dưới 5.
- Game là lối duy nhất cho một chức năng học (vd. 🗺️ Thám hiểm cho xếp lớp, 🎤 Karaoke cho nói) thì T thấp nghĩa là **sửa trải nghiệm**, không ẩn: ẩn đi thì mất cơ chế bằng chứng của chức năng đó (HG18 phủ nội dung, HG24).
- Một bản sửa T chỉ được giữ khi số câu bằng chứng / phút của game đó không giảm (đo bằng bot `tools/learners` hoặc §8.3).
- Xếp mỗi game vào ma trận hai trục:

| | T ≥ 7 (vui) | T < 7 (nhàm) |
|---|---|---|
| **G ≥ 7,5 (học tốt)** | Quảng bá, đưa lên đầu | Sửa trải nghiệm |
| **G < 7,5 (học kém)** | Sửa luật chơi | Ẩn khỏi sảnh hoặc làm lại |

### 8.5 Chấm T cho 17 game hiện có (v88)

**Giới hạn của lần chấm này:**
- Chấm theo mã nguồn và mô tả, **chưa có số liệu và chưa playtest**.
- T10 để mặc định 5 cho mọi game ("chưa đo").
- Các điểm này là giả thuyết để kiểm lại bằng §8.3, không phải kết luận.

| Game | T1 ×2 | T2 ×2 | T3 | T4 | T5 ×2 | T6 | T7 | T8 | T9 | T10 ×2 | **T** | G (§4–§6) | Ô ma trận |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 📅 Câu đố ngày | 8 | 7 | 6 | 6 | 6 | 7 | 4 | 9 | 8 | 5 | **6,6** | 7,9 | Học tốt + nhàm |
| 🧱 Xếp Khối Chữ | 8 | 8 | 7 | 6 | 5 | 5 | 4 | 8 | 8 | 5 | **6,4** | 7,6 | Học tốt + nhàm |
| 🤖 Ra lệnh cho robot | 7 | 9 | 6 | 6 | 5 | 6 | 6 | 7 | 6 | 5 | **6,4** | 7,9 | Học tốt + nhàm |
| 🌱 Vườn từ | 8 | 3 | 6 | 6 | 8 | 4 | 7 | 9 | 9 | 5 | **6,4** | 8,1 | Học tốt + nhàm |
| ☕ Quán Cà Phê | 8 | 4 | 6 | 5 | 7 | 5 | 7 | 8 | 8 | 5 | **6,2** | 8,0 | Học tốt + nhàm |
| 🎲 Bàn Cờ Phố | 7 | 5 | 6 | 4 | 8 | 6 | 6 | 6 | 7 | 5 | **6,1** | 7,1 | Cả hai thấp |
| 🃏 Bài Câu | 6 | 8 | 6 | 7 | 5 | 6 | 4 | 7 | 6 | 5 | **6,0** | 8,3 | Học tốt + nhàm |
| ✉️ Thư gửi cư dân phố | 7 | 6 | 4 | 6 | 6 | 6 | 7 | 5 | 6 | 5 | **5,9** | 7,8 | Học tốt + nhàm |
| 🗺️ Thám hiểm sương mù | 8 | 6 | 6 | 5 | 5 | 5 | 6 | 5 | 8 | 5 | **5,9** | 7,9 | Học tốt + nhàm |
| 🎯 Bắt Âm | 9 | 3 | 7 | 6 | 5 | 4 | 4 | 8 | 7 | 5 | **5,7** | 8,2 | Học tốt + nhàm |
| 🔍 Thám tử | 7 | 4 | 5 | 5 | 5 | 6 | 6 | 7 | 8 | 5 | **5,6** | 7,8 | Học tốt + nhàm |
| 🛠️ Xưởng sửa câu | 8 | 3 | 6 | 5 | 5 | 5 | 5 | 8 | 8 | 5 | **5,6** | 8,1 | Học tốt + nhàm |
| 🏰 Leo tháp | 7 | 3 | 4 | 6 | 5 | 6 | 5 | 8 | 8 | 5 | **5,5** | 7,1 | Cả hai thấp |
| 🔗 Ghép cặp | 9 | 4 | 5 | 3 | 4 | 3 | 3 | 8 | 9 | 5 | **5,4** | 6,5 | Cả hai thấp |
| ⏱️ Tốc độ 60 giây | 9 | 2 | 5 | 4 | 4 | 3 | 3 | 9 | 9 | 5 | **5,2** | 6,1 | Cả hai thấp |
| 📻 Đài phát thanh | 7 | 3 | 4 | 5 | 5 | 6 | 5 | 7 | 6 | 5 | **5,2** | 7,6 | Học tốt + nhàm |
| 🎤 Karaoke hội thoại | 7 | 3 | 5 | 5 | 4 | 6 | 5 | 7 | 6 | 5 | **5,1** | 7,6 | Học tốt + nhàm |

Căn cứ chính:
- **T2:** 10/17 game có hành động chính chỉ là chọn một đáp án. Riêng Xếp Khối (đặt khối), Bài Câu (6 bùa trong `cards.ts`), Robot (tự lên đường đi), Câu đố ngày (suy luận nhóm) có quyết định ngoài đáp án.
- **T3:** chỉ có 6 âm tổng hợp (`sfx.ts`: ok / bad / place / clear / boom / end). Leo tháp không phát âm nào, trừ khi chạy ở chế độ Xếp Khối (`main.ts` dòng `if (qrun.mode === 'blocks') sfx(...)`). Hiệu ứng lớn khi hoàn thành chỉ có ở Xếp Khối (`bkboom`).
- **T5:** mỗi game giữ kỷ lục riêng. Ví (`qsave().coins`) dùng chung nhưng chỉ tiêu được ở Bàn Cờ Phố. Quà của Thư (`GIFTS`, 8 món) chỉ hiện ở đầu màn Thư; đồ trang trí Quán (`DECOR`, 7 món) chỉ hiện trong Quán. Vườn từ có tiến trình nhiều ngày thật (cây lớn theo bậc).
- **T7:** hầu hết dùng emoji. Chưa có nhân vật đi xuyên các game (mascot Tí có ở phần học trong `app.js`, chưa xuất hiện trong màn game nào của `src/engine/`).

**Đối chiếu với G7 cũ:** nhóm thấp nhất (Karaoke, Đài, Tốc độ, Leo tháp) khớp với các game có G7 4–6. T không mâu thuẫn với G7, chỉ chỉ rõ thấp vì đâu.

### 8.6 Nhận xét gốc rễ

**Kết luận thẳng:** theo luật §8.4, **chưa game nào đạt trục T** (cao nhất 6,6). Có 13/17 game nằm ở ô "Học tốt + nhàm". Phần học đã vững sau v73–v88; **điểm nghẽn bây giờ là độ hấp dẫn**. Bốn nguyên nhân chung cho cả app:

1. **Câu hỏi khoác áo game (T2).** Ở 10 game, người chơi chỉ chọn đáp án; phần "game" là hình minh hoạ. Đây là gốc rễ của G1 thấp đã nêu ở §4, chỉ được sửa ở một số game.
2. **Tiến trình rời rạc (T5).** 17 kho điểm riêng, không có một thế giới chung lớn dần. App đã có sẵn chủ đề "Phố" (Bàn Cờ Phố, Thư gửi cư dân phố) nhưng quà và trang trí không về chung một chỗ.
3. **Thiếu bản sắc (T7).** Không có nhân vật hay câu chuyện nối các game, nên người chơi không có lý do cảm xúc để quay lại.
4. **Không đo (T10).** Không biết game nào thật sự được chơi lại. Mọi điểm T hiện tại đều là ước đoán.

**Không nên làm game thứ 18.** 17 game với chiều sâu mỏng là dàn trải. Nên làm sâu các game đã có và gộp / ẩn game yếu.

### 8.7 Việc sửa ưu tiên (lợi ích ÷ công sức)

| Thứ tự | Việc | Game hưởng lợi | Tiêu chí nâng | Công sức |
|---|---|---|---|---|
| 1 | **Đo §8.3** (4 bộ đếm cục bộ + bảng xem trong Cài đặt → Nâng cao) | Tất cả | T10, kiểm lại T1 / T8 | Nhỏ |
| 2 | **Phố chung làm lớp meta:** quà Thư, đồ trang trí Quán, hoa Vườn, nhà Bàn Cờ cùng hiện trên một bản đồ phố; ván nào cũng góp một thứ thấy được | ~10 game | T5 +2, T7 +1 | Vừa |
| 3 | ~~Thêm lớp quyết định không chạm bằng chứng (chọn khách, chọn thứ tự manh mối, chọn đơn)~~ → thay bằng §9.3 sau khi đối chiếu spec: thao tác không phải tiếng Anh trong vòng chơi trái HG24 | Quán, Thám tử, Đài, Xưởng | T2 | Vừa |
| 4 | **Juice chung:** âm cho Leo tháp; một màn kết "tổng kết lớn" dùng chung (hiệu ứng + đồ mới cho phố); thêm 3–4 âm (combo, lên cấp, mở khoá) | Tất cả | T3 +1–2 | Nhỏ |
| 5 | **Một nhân vật dẫn đường** (Tí) xuất hiện ở sảnh, màn kết và lời nhờ của cư dân | Tất cả | T7 +1–2 | Nhỏ – vừa |
| 6 | **Bài Câu: sưu tập bùa giữ qua các ván**, mở bùa mới theo tiến độ | Bài Câu | T5, T6 | Nhỏ |
| 7 | **Ẩn Tốc độ 60 giây và Ghép cặp** khỏi sảnh (ô "cả hai thấp") hoặc gộp thành chế độ phụ của Câu đố ngày | — | Bớt dàn trải | Nhỏ |

Sau mỗi đợt sửa: chấm lại T, rồi đối chiếu với số liệu §8.3 sau ít nhất 2 tuần.

## 9. Kế hoạch nâng trục T (v89–)

### 9.0 Đối chiếu với spec v2.4 (sau đợt 1)

Đọc lại `docs/SPEC-v2.4.md`, `docs/SPEC.md`, bộ chấm C1–C400. Có 5 chỗ kế hoạch ban đầu lệch spec; đã sửa:

| # | Chỗ lệch | Spec nói | Đã sửa |
|---|---|---|---|
| 1 | Chỉ tiêu "chơi lại tự nguyện ≥ 25%", "ván 3–8 phút" | North Star = tiến bộ đã xác minh / công sức; **không** tối ưu thời gian trong app, số ván (§I, §XXIII); UX không bắt tự chọn (C190) | Bỏ chỉ tiêu tự chọn; thời lượng chỉ chặn trên; thêm **chơi tiếp sau ván** (Persistence C336) và **câu bằng chứng / phút** (C341, C360, §72) |
| 2 | T2 = "quyết định ngoài đáp án" (chọn khách, chọn lối tháp, chọn đơn) | Quyết định của người sáng lập + HG24: mọi hành động trong game là thử thách ngôn ngữ do engine chọn; §IX Game Skill Bias (chiến thuật); C69 game không quyết curriculum; C345 chiến thuật game phải trùng đường học | T2 định nghĩa lại (§8.1): quyết định **là hành động tiếng Anh** có hậu quả, hoặc quyết định meta ngoài vòng chơi. Bỏ "chọn lối tháp" (chọn nội dung = chọn curriculum) và "bùa nghe chậm" (trợ giúp làm đổi bằng chứng) |
| 3 | Phố dùng chữ "lên cấp" | P13, C342: điểm game không được giống năng lực; app dùng "⬆ Lên cấp" cho phần đã vững | Phố dùng ★ ("★ thứ 2"), ghi rõ "★ của phố không phải cấp tiếng Anh" |
| 4 | Cổng T có thể ẩn game | HG18 (phủ nội dung), HG24: chức năng nào cũng cần cơ chế bằng chứng | Game duy nhất của một chức năng chỉ được sửa, không ẩn (§8.4) |
| 5 | Mục tiêu "T2 ≥ 6 mọi game" | Ở game tiếp nhận (đọc, nghe, phân biệt âm), hành động tiếng Anh chính là hiểu → chọn; thêm thao tác khác là trái HG24 | Sàn T2 cho các game này là 5; bù bằng hậu quả, câu chuyện (T7) và meta (T5) |

Những phần đợt 1 đã khớp spec, giữ nguyên:
- Phố là progression / milestones / collectibles (§IX), suy ra từ telemetry, không vào bằng chứng (C187–C189).
- Số liệu chơi là tier 0, tách sổ bằng chứng (P28), giới hạn kích thước, chỉ ở máy (§XX).
- Ăn mừng chỉ khi có công trình mới, tôn trọng chế độ tập trung và giảm chuyển động.
- Tí không nói điểm game (P13).
- Thu gọn Tốc độ 60 giây / Ghép cặp đúng kết luận §6.5 ("giữ như trò phụ; chưa nên quảng bá"). Không xoá: người sáng lập quyết có bỏ hẳn hay không (SPEC.md: AI không đổi hướng sản phẩm khi chưa hỏi).

### 9.1 Phản biện mục tiêu "điểm tối đa"

10/10 ở mọi tiêu chí T **không phải mục tiêu đúng**, vì ba lý do:
- **T10 không làm ra được bằng mã.** Nó là kết quả do người chơi tạo ra. Việc làm được chỉ là đo đúng (§8.3) rồi sửa theo số liệu.
- **Một số tiêu chí kéo ngược nhau.**
  - T2 (thêm quyết định) làm giảm G8 (số câu / phút).
  - Căng thẳng ở T4 nếu dùng đồng hồ sẽ phạm P15. Vì vậy căng thẳng phải đến từ giới hạn lượt, rủi ro combo, khách đang chờ, **không đến từ đếm giờ**.
- **Thêm quyết định không được làm bẩn bằng chứng (G3).** Mọi lựa chọn mới chỉ đổi *thứ tự / phần thưởng game*, không đổi câu hỏi hay cách tính năng lực.

**Mục tiêu đặt lại:**
- mọi game đang hiện T ≥ 7,5; không tiêu chí T nào dưới 6, trừ T2 của game tiếp nhận (sàn 5, §9.0 mục 5);
- G không tụt (G3, G9 ≥ 8 giữ bằng test hiện có), câu bằng chứng / phút không giảm;
- T10 có số liệu thật sau 2 tuần.

### 9.2 Gốc rễ → đòn bẩy (sửa một chỗ, nâng nhiều game)

| Gốc rễ (§8.6) | Đòn bẩy | Game hưởng | Tiêu chí |
|---|---|---|---|
| Không đo | `play.ts`: bỏ giữa, chơi tiếp sau ván, câu bằng chứng / phút, thời gian tới thao tác đầu, thời lượng; bảng xem ở sảnh | 15 game engine | T10, kiểm T1 / T8, G8 |
| Tiến trình rời rạc | `town.ts`: **Phố chung** suy ra từ bản lưu sẵn có của mọi game (không thêm dữ liệu, đồng bộ an toàn). Mỗi game là một công trình có 4 ★; màn kết báo "Phố mới" | 15 | T5, T7 |
| Juice mỏng | Màn kết chung: pháo giấy + nhạc mừng (dùng lại `confetti()` / `sfx('win')` của app qua host), âm cho Leo tháp | 15 | T3 |
| Thiếu bản sắc | Tí (mascot có sẵn ở `app.js`) dẫn đường trong hộp "Chơi tiếp" và màn kết | 15 | T7 |
| Dàn trải | Thu Tốc độ 60 giây / Ghép cặp vào mục "Trò nhanh (cũ)" thu gọn | 2 | bớt game yếu |
| Câu hỏi khoác áo game | Lớp quyết định riêng từng game (đợt 2, bảng §9.3) | 10 | T2 |
| Ván sau giống ván trước | Sự kiện ngày, khách / hồ sơ đặc biệt, sưu tập bùa (đợt 3) | 8 | T4, T6 |

### 9.3 Đợt 2: quyết định là hành động tiếng Anh (theo §9.0)

Mỗi dòng phải qua 4 câu hỏi:
- quyết định có phải tiếng Anh không (HG24)?
- có đổi nội dung / độ khó do engine chọn không (C69, P14)?
- chiến thuật tốt nhất có trùng đường học không (C345)?
- có làm giảm câu / phút không (G8, §72)?

| Game | Quyết định | Tiếng Anh? | Bằng chứng / nội dung |
|---|---|---|---|
| ☕ Quán | 4 câu đáp đều hiểu được nhưng khác **độ hợp văn phong** (lịch sự / suồng sã / cộc); khách phản ứng khác nhau (vui, ngạc nhiên, phật ý) và tiền boa theo độ hợp | Có: ngữ dụng (Universal Core 7, F7c) | Câu và đáp án do engine chọn như cũ; phản ứng chỉ là trình bày |
| 🛠️ Xưởng | Trước khi gõ, **chạm từ sai** trong câu hỏng; chạm đúng thì ô nhập chọn sẵn từ đó, chạm sai được gợi ý | Có: nhận ra lỗi (F3b) | Bằng chứng vẫn là câu gõ lại (mức 4); lượt chạm là quan sát, không vào mastery |
| 🏰 Leo tháp | Ở trại: **tiêu xu** hồi tim hay giữ xu cho phố | Meta, ngoài vòng câu | Xu tỉ lệ giá trị học (C345/C346), tim là độ khó game (P14); câu không đổi |
| 🏙️ Phố (mọi game) | **Tiêu xu chung** để thêm đồ trang trí cho công trình mình chọn | Meta, ngoài vòng câu | Xu kiếm theo giá trị học nên muốn phố đẹp thì phải học đúng đường |
| 🔍 Thám tử / 📻 Đài | Hồ sơ có **bảng manh mối**: mỗi câu đúng ghim một mảnh; câu ý chính là kết luận, ghép từ các mảnh đã ghim | Có: hiểu là hành động | Câu như cũ; sàn T2 = 5 (§9.0 mục 5), nâng T7 bằng câu chuyện |
| 🌱 Vườn | Chọn **ô gieo** cho hạt mới (bố cục vườn) | Meta, một chạm, không chặn vòng câu | Thứ tự bậc giữ nguyên |
| ~~🎯 Bắt Âm bùa nghe chậm~~ | Bỏ: trợ giúp làm đổi bằng chứng | | |
| ~~🏰 chọn lối nhiều rương / nhiều quái~~ | Bỏ: người chơi chọn nội dung = chọn curriculum (C69) | | |
| ~~☕ chọn khách phục vụ trước~~ | Bỏ: thao tác không phải tiếng Anh giữa các câu (HG24) | | |

### 9.4 Thứ tự làm và cách kiểm

1. **Đợt 1 (v89):** đo + Phố chung + màn kết chung + Tí + âm Leo tháp + thu gọn trò cũ. Kiểm bằng test đơn vị (`play.ts`, `town.ts` thuần hàm) và e2e (sảnh hiện Phố, màn kết hiện "Phố mới"). Chấm lại T.
2. **Đợt 2 (v90–v92):** quyết định theo §9.3, mỗi bản 2–3 game. Mỗi bản kèm:
   - test "quyết định không đổi câu hỏi / bằng chứng";
   - bot `tools/learners` chạy lại để chứng minh câu bằng chứng / phút và tiến độ Đạt không giảm.
3. **Đợt 3 (v93):** đa dạng (sự kiện ngày, sưu tập bùa Bài Câu, khách đặc biệt).
4. **Sau 2 tuần số liệu:** chấm T10 thật. Game nào bỏ giữa ≥ 20% hoặc chơi tiếp sau ván < 50% thì sửa theo số liệu, không theo cảm tính. Game có câu / phút < 2 thì sửa phần học trước phần vui.

### 9.5 Đã làm đợt 1 (v89): chấm lại theo bản thật

| Việc | Tệp | Kiểm |
|---|---|---|
| Đo số liệu chơi: bỏ giữa, chơi tiếp sau ván, câu bằng chứng / phút, giây tới thao tác đầu, thời lượng (20 lần gần nhất; tự chọn / chơi lại chỉ để xem); bảng "📊 Số liệu chơi trên máy này" ở sảnh, ✓ / ✗ theo ngưỡng §8.3 khi đủ 5 ván | `play.ts`, `main.ts` (bọc mọi hành động, không đổi hành vi), `st.e.pm` | `engine-play-town.test.ts`, e2e `town.spec.ts` |
| Phố chung: 15 công trình suy ra từ bản lưu từng game (không thêm dữ liệu, đồng bộ hai máy tự đúng), mỗi công trình 4 ★ (không dùng chữ "cấp" để khỏi lẫn với cấp tiếng Anh); chạm công trình để chơi | `town.ts`, `townview.ts` | như trên + WCAG AA sáng / tối, 390 px |
| Màn kết chung: "🏗️ Phố mới!" khi công trình lên cấp (pháo giấy + nhạc mừng của app, một lần mỗi ván); luôn có mốc gần nhất ("Còn 1 hoa nữa để Vườn hoa có ★ thứ 1") | `endExtras()` trong `main.ts`, host `cheer` | e2e `town.spec.ts` |
| Tí dẫn đường ở hộp "Chơi tiếp" và thanh "▶ Tiếp" (câu theo tiến độ lộ trình, không nói điểm game) | `gameview.ts` `tiSay`, host `mascot` | e2e |
| Leo tháp có âm đúng / sai như các game khác | `main.ts` | — |
| Tốc độ 60 giây / Ghép cặp thu vào mục "Trò nhanh (cũ)" | `app.js` `viewGames` | e2e `play4.spec.ts` vẫn qua |

Ước lượng T sau đợt 1 (vẫn là chấm theo mã, T10 vẫn 5 vì chưa có số liệu): T3 +1 (Leo tháp +2), T5 +2 (game đã có tiến trình dài +1), T7 +1.

| Game | T trước | T sau đợt 1 | T2 hiện tại |
|---|---|---|---|
| 📅 Câu đố ngày | 6,6 | 7,0 | 7 |
| 🧱 Xếp Khối Chữ | 6,4 | 6,9 | 8 |
| 🤖 Robot | 6,4 | 6,8 | 9 |
| 🌱 Vườn từ | 6,4 | 6,6 | 3 |
| ☕ Quán Cà Phê | 6,2 | 6,5 | 4 |
| 🎲 Bàn Cờ Phố | 6,1 | 6,4 | 5 |
| 🃏 Bài Câu | 6,0 | 6,4 | 8 |
| 🗺️ Thám hiểm | 5,9 | 6,4 | 6 |
| ✉️ Thư | 5,9 | 6,3 | 6 |
| 🎯 Bắt Âm | 5,7 | 6,1 | 3 |
| 🔍 Thám tử | 5,6 | 6,1 | 4 |
| 🛠️ Xưởng | 5,6 | 6,1 | 3 |
| 🏰 Leo tháp | 5,5 | 6,0 | 3 |
| 📻 Đài phát thanh | 5,2 | 5,6 | 3 |
| 🎤 Karaoke | 5,1 | 5,6 | 3 |
| (Tốc độ 60 giây, Ghép cặp: đã thu gọn, không chấm tiếp) | | | |

**Đọc kết quả:** đợt 1 nâng mọi game khoảng +0,4 nhưng **chưa game nào qua cổng §8.4**, vì hai chỗ đợt 1 không chạm tới:
- **T2 ≤ 4 ở 9 game:** đúng điểm nghẽn mà đợt 2 (§9.3) nhắm tới;
- **T10 = 5 cho mọi game:** chỉ lên được khi có số liệu thật, ít nhất 2 tuần sau khi phát hành v89.

### 9.6 Đã làm v90–v91 (đợt 2, phần 1): chấm lại theo bản thật

| Bản | Việc | Hành động tiếng Anh / meta | Bằng chứng | Kiểm |
|---|---|---|---|---|
| v90 | ☕ **Quán: khách phản ứng theo loại câu đáp.** 😊 đúng việc + đúng văn phong (tiền boa +2); 😮 đúng việc cần nói nhưng lệch văn phong (+1); 😕 sai việc; 🙂 "Không biết" | Ngữ dụng: chọn câu hợp văn phong (Universal Core 7, F7c) | Đúng / sai vẫn chỉ theo đáp án (`app.js eFn` thêm `react`, `regs` để trình bày) | `engine-v90.test.ts`, e2e `v90.spec.ts` (+ WCAG AA) |
| v90 | 🛠️ **Xưởng: tìm chỗ hỏng.** Trước khi gõ, chạm từ sai (tuỳ chọn). Đúng chỗ +1 xu. Sai chỗ thì app tô chỗ hỏng và câu gõ sau đó là **câu có gợi ý** | Nhận ra lỗi (F3b) | Chạm đúng: bằng chứng như cũ; chạm sai: `hint` → trọng số thấp hơn (G3). Chỗ hỏng tính bằng dãy con chung dài nhất; 463/463 câu sai của app đều có chỗ chạm | như trên |
| v91 | 🏙️ **Trang trí phố bằng xu chung.** Mỗi công trình 4 món, ★ thứ k mở món thứ k, giá 30 / 60 / 90 / 120 xu | Meta ngoài vòng câu: chọn công trình nào đẹp trước | Xu tỉ lệ giá trị học (C345); ví = xu kiếm − xu Bàn Cờ − xu Phố | `engine-v91.test.ts`, e2e `v91.spec.ts` |
| v91 | 🏰 **Leo tháp: hết tim thì hồi 1 tim bằng 25 xu** (một lần mỗi tầng) để leo tiếp | Meta: tiêu xu để học tiếp hay giữ cho phố | Tim là độ khó game (P14); câu vẫn do engine chọn | như trên |
| v91 | Màu chữ báo sai `--bad` #C0392B → #B83426 | — | — | Test trợ năng mới phát hiện lỗi có sẵn: chữ đậm báo sai trên nền hồng chỉ đạt 4,44:1 (< 4,5). Nay 4,82:1 |

**Bot người học L01, 8 ngày, seed 1, `--games director`, v89 so với v90:**

| | v89 | v90 |
|---|---|---|
| Câu trả lời | 218 | 234 |
| Đúng | 122 (56%) | 129 (55%) |
| Ô mastery Đạt cuối kỳ | 712 / 2.039 | 710 / 2.040 |

- Hai lần chạy chọn game hơi khác nhau, vì hạt ngẫu nhiên của ván game lấy theo thời gian. Mức chênh vì vậy nằm trong nhiễu.
- Không thấy giảm số câu bằng chứng hay tiến độ Đạt.
- Bot không chạm chỗ hỏng và không chọn câu lệch văn phong một cách có chủ đích, nên đây chỉ là kiểm "không hỏng". Nó không chứng minh hiệu quả.

**Ước lượng T sau v90–v91** (vẫn chấm theo mã, T10 = 5): Phố có chỗ tiêu xu nên T5 +1 cho mọi game (tối đa 9).

| Game | Sau đợt 1 | Sau v91 | T2 | Ghi chú |
|---|---|---|---|---|
| 📅 Câu đố ngày | 7,0 | 7,1 | 7 | |
| 🧱 Xếp Khối Chữ | 6,9 | 7,0 | 8 | |
| ☕ Quán Cà Phê | 6,5 | **7,0** | 4 → 6 | phản ứng + tiền boa (T6 +1) |
| 🤖 Robot | 6,8 | 6,9 | 9 | |
| 🛠️ Xưởng | 6,1 | **6,6** | 3 → 6 | tìm chỗ hỏng: rủi ro (lộ gợi ý) đổi lấy thưởng |
| 🌱 Vườn từ | 6,6 | 6,6 | 3 | |
| 🃏 Bài Câu | 6,4 | 6,6 | 8 | |
| 🗺️ Thám hiểm | 6,4 | 6,5 | 6 | |
| 🏰 Leo tháp | 6,0 | **6,5** | 3 → 5 | hồi tim (T4 +1) |
| ✉️ Thư | 6,3 | 6,4 | 6 | |
| 🎲 Bàn Cờ Phố | 6,4 | 6,4 | 5 | |
| 🎯 Bắt Âm | 6,1 | 6,3 | 3 | |
| 🔍 Thám tử | 6,1 | 6,2 | 4 | |
| 📻 Đài phát thanh | 5,6 | 5,8 | 3 | |
| 🎤 Karaoke | 5,6 | 5,7 | 3 | |

**Gốc rễ còn lại:**
- Bốn game thấp nhất (Karaoke, Đài, Thám tử, Bắt Âm) đều là game **tiếp nhận / trình diễn**, T2 = 3–4. Theo §9.0 mục 5, các game này nâng bằng **câu chuyện, khoảnh khắc trình diễn, nhịp chuỗi**, không thêm thao tác.
- Việc kế tiếp:
  - 🔍 / 📻 bảng manh mối (mỗi câu đúng ghim một mảnh, kết luận ghép từ các mảnh);
  - 🎤 màn tổng kết "biểu diễn" (điểm khớp từng câu, câu hay nhất);
  - 🎯 chuỗi nghe đúng mở bong bóng màu mới.
- T10 vẫn khoá ở 5 cho tới khi có số liệu thật. Vì vậy không game nào vượt khoảng 7,5 chỉ bằng sửa mã: phần còn lại phải đo.

### 9.7 Đã làm v92: game tiếp nhận / trình diễn nâng bằng trình bày (§9.0 mục 5)

| Game | Việc | Vì sao không thêm thao tác |
|---|---|---|
| 🔍 Thám tử / 📻 Đài | **Bảng manh mối:** mỗi câu hiểu đúng ghim một mảnh (chính đáp án tiếng Anh) lên bảng. Câu kết luận cuối là "ghép các manh mối đã ghim". Màn kết có **biên bản vụ án / ghi chép bản tin**: từng câu hỏi, đáp án, ✓ / ✗ lần đầu | Chỉ trình bày lại câu trả lời đúng (đọc lại đáp án = gặp lại ngôn ngữ). Không thêm câu, không đổi điểm bài (HG24, G3) |
| 🎤 Karaoke | **Màn biểu diễn:** từng câu của bạn với mức máy nghe ra (thanh %), 🌟 câu hay nhất, 🔁 câu nên luyện lại, nút nghe mẫu / nghe chậm | Chỉ trình bày kết quả đã có (`r.ps`), không chấm thêm, không vào mức thuộc |
| (chung) | Lộ trình hôm nay: chặng đã xong bỏ `opacity:.7` (chữ nhỏ dưới 4,5:1), thay bằng nền khác màu | Test trợ năng mới quét màn kết (v92) phát hiện lỗi có sẵn từ v88 |

**Kiểm:** e2e `v92.spec.ts` gồm:
- manh mối ghim đúng chữ đáp án; câu "Không biết" không ghim;
- biên bản đủ câu; màn biểu diễn đủ câu của vai;
- số bằng chứng trong sổ không đổi;
- WCAG AA.

**Ước lượng T:**

| Game | Sau v91 | Sau v92 |
|---|---|---|
| 🔍 Thám tử | 6,2 | 6,4 (T5 +1, T7 +1) |
| 📻 Đài phát thanh | 5,8 | 6,0 (T5 +1, T7 +1) |
| 🎤 Karaoke | 5,7 | 5,9 (T7 +1, T8 +1) |

**Đánh giá thẳng sau đợt 2:**
- Trong khuôn spec (HG24, C69, P13–P15), sửa bằng mã đã đưa 3 game lên khoảng 7 (Câu đố ngày 7,1 · Xếp Khối 7,0 · Quán 7,0). 12 game còn lại ở khoảng 5,9–6,9.
- Phần chênh còn lại tới 7,5 nằm ở hai chỗ:
  1. **T10 = 5 (chưa đo)**, chiếm 2/14 trọng số. Chỉ số liệu thật mới mở được.
  2. **T2 của game tiếp nhận**, bị spec chặn có chủ đích.
- Theo §9.4 bước 4, bước đúng tiếp theo là **phát hành v89–v92 và thu 2 tuần số liệu** (bảng 📊 ở sảnh). Sau đó sửa game theo số liệu, không tiếp tục thêm tính năng theo cảm tính.

## 10. Đối sánh thị trường (M1–M10): chấm lại sau playtest của người sáng lập

### 10.0 Vì sao có mục này

Người sáng lập chơi thử và kết luận: **các game hiện tại quá tệ, không hấp dẫn để chơi.** Đây là bằng chứng playtest thật đầu tiên, và nó bác bỏ điểm trục T ở §8–§9 (5,7–7,1).

Gốc rễ của việc chấm sai: thang T neo vào **có hay không có** tính năng trong chính app (có âm, có phố, có lựa chọn), không neo vào **chất lượng so với game người chơi đang dùng hằng ngày**. Vì vậy cứ thêm tính năng là điểm tăng, dù cảm giác chơi vẫn như làm bài tập.

Từ nay trục T chỉ dùng để kiểm "đủ thành phần". **Độ hấp dẫn chấm bằng M1–M10 dưới đây, neo vào game dẫn đầu cùng thể loại.**

Tài liệu chỉ nêu thể loại (quy ước đầu tệp và test `ip-names`).

Bối cảnh thị trường 2026:
- giải đố chiếm 44% doanh thu game casual;
- game xếp khối 8×8 dẫn lượt tải trên cả hai kho;
- ghép 3 dẫn doanh thu;
- merge tăng nhanh nhất.

Theo các bài phân tích thiết kế: lõi phải tự vui và đọc hiểu được trong vài giây, phản hồi phải tức thì, người chơi quyết định có quay lại hay không ngay trong vài phút đầu.

### 10.1 Mười tiêu chí (10 = ngang game dẫn đầu cùng thể loại)

| # | Tiêu chí | 0–2 | 5 | 10 |
|---|---|---|---|---|
| M1 ×2 | **Lõi tự hấp dẫn** | Trắc nghiệm có trang trí | Lõi game có thật nhưng bị câu hỏi chen ngang | Bỏ phần tiếng Anh đi người ta vẫn muốn chơi, hoặc tiếng Anh **chính là** cơ chế (chữ là quân cờ) |
| M2 ×2 | **Cảm giác điều khiển** | Bấm nút dạng biểu mẫu, cả màn vẽ lại | Chạm vật thể, có hiệu ứng | Kéo / vuốt trực tiếp, phản hồi < 100 ms, chuyển động 60 fps liên tục, hạt, rung |
| M3 | **Nhịp liền mạch** | Mỗi lượt phải bấm "Tiếp ▸" | Ít lần ngắt | ≥ 80% thời gian đang chơi, không màn chờ giữa lượt |
| M4 | **Mỹ thuật và âm thanh** | Emoji thay hình, tiếng bíp | Có chủ đề màu | Phong cách hình riêng, nhân vật, nhạc nền, âm theo hành động |
| M5 | **Màn chơi nhập vai** | Thấy thanh tab, chữ hướng dẫn dài | Khung gọn | Toàn màn hình, luật hiểu qua hình |
| M6 | **Chiều sâu, giỏi lên được** | Chỉ đúng / sai | Có combo | Kỹ năng chơi tiến bộ rõ: chiến thuật, tính trước |
| M7 | **Thiết kế màn và độ khó** | Ngẫu nhiên, phẳng | Tăng theo số màn | Màn thiết kế sẵn, nhịp căng – nghỉ, bất ngờ |
| M8 | **Meta và phần thưởng** | Điểm / kỷ lục | Có sưu tập | Mở khoá, sự kiện, sưu tập có giá trị thấy được |
| M9 | **Vào chơi ngay** | Phải đọc luật | Hiểu sau 1 lượt | Chơi được trong ≤ 10 giây, không cần chữ |
| M10 | **Lý do quay lại** | Không có | Có chuỗi ngày | Thử thách ngày giống nhau cho mọi người, chia sẻ kết quả |

Điểm = trung bình có trọng số (÷ 12).

### 10.2 Chấm 17 game

Căn cứ: ảnh e2e của từng game và mã nguồn. Người chấm vẫn là tôi, nhưng mỗi điểm so với một game cụ thể đang dẫn thể loại, không so với chính app.

| Game | Đối chiếu (thể loại dẫn đầu) | M1 | M2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 📅 Câu đố ngày | đố nhóm 16 từ hằng ngày | 6 | 4 | 6 | 3 | 3 | 5 | 4 | 2 | 7 | 5 | **4,6** |
| ⏱️ Tốc độ 60 giây | đố nhanh tính giờ | 4 | 3 | 8 | 2 | 3 | 3 | 2 | 1 | 8 | 2 | **3,6** |
| 🔗 Ghép cặp | ghép thẻ | 4 | 4 | 8 | 2 | 3 | 2 | 2 | 1 | 8 | 1 | **3,6** |
| 🤖 Robot | lập trình ra lệnh theo màn | 5 | 3 | 6 | 2 | 3 | 5 | 2 | 2 | 4 | 1 | **3,4** |
| 🧱 Xếp Khối | xếp khối 8×8 | 5 | 2 | 2 | 2 | 2 | 4 | 2 | 3 | 5 | 3 | **3,1** |
| 🎲 Bàn Cờ Phố | bàn cờ xúc xắc + xây phố | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 4 | 6 | 2 | **3,1** |
| 🌱 Vườn từ | nông trại chăm cây | 2 | 2 | 4 | 3 | 3 | 1 | 2 | 4 | 6 | 5 | **3,0** |
| 🎯 Bắt Âm | bắn bong bóng | 3 | 2 | 5 | 3 | 3 | 2 | 2 | 2 | 7 | 1 | **2,9** |
| ✉️ Thư | thư từ trong game nhẹ nhàng | 3 | 2 | 5 | 2 | 3 | 3 | 2 | 3 | 4 | 2 | **2,8** |
| 🃏 Bài Câu | xây bộ bài roguelike | 3 | 3 | 4 | 2 | 3 | 2 | 2 | 2 | 4 | 1 | **2,7** |
| 🎤 Karaoke | hát karaoke có nhạc | 3 | 2 | 4 | 2 | 3 | 2 | 2 | 2 | 5 | 1 | **2,6** |
| ☕ Quán | phục vụ / nấu ăn quản lý thời gian | 2 | 1 | 4 | 3 | 3 | 1 | 2 | 3 | 7 | 1 | **2,5** |
| 🛠️ Xưởng | sửa hàng / dây chuyền | 2 | 2 | 4 | 2 | 3 | 2 | 2 | 2 | 6 | 1 | **2,5** |
| 🏰 Leo tháp | leo tháp roguelike | 2 | 1 | 3 | 2 | 3 | 2 | 3 | 3 | 6 | 1 | **2,4** |
| 🔍 Thám tử | điều tra / phá án | 2 | 1 | 4 | 2 | 2 | 2 | 2 | 2 | 6 | 1 | **2,3** |
| 🗺️ Thám hiểm | khám phá bản đồ sương mù | 2 | 2 | 3 | 3 | 3 | 1 | 2 | 1 | 5 | 1 | **2,3** |
| 📻 Đài | phiêu lưu bằng âm thanh | 2 | 1 | 4 | 2 | 2 | 2 | 2 | 2 | 5 | 1 | **2,2** |

**Kết luận:** cả 17 game ở mức **2,2–4,6 / 10** so với thị trường, khớp với nhận xét của người chơi.
- Cao nhất là các game mà **chữ / nghĩa chính là cơ chế** (Câu đố ngày) hoặc nhịp liền (Tốc độ 60 giây, Ghép cặp). Hai game sau trước đây bị đánh giá thấp vì phần học yếu, không phải vì chơi chán.
- Thấp nhất là các game "trắc nghiệm có trang trí" (Đài, Thám tử, Leo tháp, Quán).

### 10.3 Gốc rễ

| # | Gốc rễ | Bằng chứng | Kéo thấp |
|---|---|---|---|
| 1 | **Kiến trúc hiển thị:** mỗi thao tác thay toàn bộ HTML của màn | `app.js` `render()` gán `innerHTML`; game engine không dùng `canvas` / `requestAnimationFrame`. Không thể có chuyển động liên tục, kéo thả, hạt nổ | M2, M4: trần khoảng 3 dù thêm bao nhiêu tính năng |
| 2 | **Câu hỏi gác cổng:** tiếng Anh là trạm kiểm soát chặn giữa các lượt chơi | Xếp Khối: trả lời → "Nhận khối ▸" → chạm ô đặt khối. Bàn Cờ: tung xúc xắc → câu hỏi. Quán, Thám tử: trắc nghiệm | M1, M3 |
| 3 | **Khung app và giọng biểu mẫu** | Thanh tab, chuỗi ngày, năng lượng luôn hiện; chữ hướng dẫn dài; nút "Không biết" kiểu bài kiểm tra | M5, M9 |
| 4 | **Không có mỹ thuật / âm nhạc** | Hình là emoji; 6 tiếng tổng hợp; không nhạc nền | M4 |
| 5 | **Dàn trải** | 17 game, mỗi game vài trăm dòng; không game nào có màn thiết kế sẵn | M6, M7 |

Gốc rễ 2 là chỗ thiết kế và spec gặp nhau. HG24 đòi "mọi hành động là thử thách ngôn ngữ". Các game chữ thành công trên thị trường làm được điều đó bằng cách để **chữ là quân cờ** (vuốt chữ thành từ, xếp chữ vào ô, ghép từ thành nhóm), không phải chèn câu hỏi trắc nghiệm vào giữa một game khác.

### 10.4 Hướng đi đề xuất (chưa làm, chờ người sáng lập chọn)

1. **Dừng** thêm tính năng cho 17 game hiện có. Mỗi tính năng thêm vào chỉ nâng "đủ thành phần" (trục T), không nâng M1–M5.
2. **Chọn 2–3 game chủ lực**, làm lại theo chuẩn thị trường:
   - toàn màn hình;
   - vẽ bằng canvas, chuyển động 60 fps, kéo / vuốt;
   - chữ tiếng Anh là cơ chế;
   - một phong cách mỹ thuật và âm thanh thống nhất;
   - màn thiết kế sẵn có độ khó tăng dần;
   - bộ chọn nội dung của engine (NBA, FSRS) giữ nguyên bên dưới.
3. Các game còn lại chuyển vào mục "Luyện tập" (không xoá: chúng vẫn là cơ chế bằng chứng của từng chức năng).
4. Thước đo nghiệm thu: playtest của người sáng lập + chỉ số §8.3. Mục tiêu M ≥ 7 cho game chủ lực trước khi làm game thứ hai.

### 10.5 Đã làm v93: game chủ lực 🎡 Vòng Chữ

**Thể loại:** vuốt chữ thành từ (đứng đầu nhóm game chữ). Chọn vì đây là thể loại mà **chữ tiếng Anh chính là cơ chế**: mọi thao tác là đánh vần một từ (M1, HG24).

| Phần | Làm gì | Tệp |
|---|---|---|
| Lõi | Màn dựng từ cụm từ (u:) bộ chọn chung đưa ra (ôn → đang học → lộ trình). Từ gốc là từ của cụm; các ô là từ ghép được từ bộ chữ (kho 6.343 từ đơn của app, không quá cấp người học + 1). Mỗi ô có nghĩa tiếng Việt làm gợi ý. Có từ thưởng, gợi ý một chữ (10 xu), sao theo số gợi ý | `wordwheel.ts` |
| Độ khó | Đường cong theo số màn: 5 → 6 → 7 chữ cái, 3 → 7 ô. Cứ 5 màn có một màn nghỉ. 6 chương, mỗi chương một bảng màu | `curve()`, `CHAPTERS` |
| Màn chơi | Lớp phủ toàn màn hình ngoài `#app` (không bị vẽ lại), canvas 60 khung hình / giây. Gồm: vuốt (chuột / ngón tay); bàn phím; ô gõ cho trình đọc màn hình. Hiệu ứng: đường vuốt phát sáng, bong bóng chữ, rung khi sai, chữ bay vào ô, ô nảy lần lượt, hạt nổ, sao rơi khi thắng. Âm: nốt ngũ cung đi lên theo từng chữ, hợp âm khi tìm ra từ, nhạc nền nhẹ tắt được. Lần đầu có bàn tay hướng dẫn. Tôn trọng giảm chuyển động | `wheelview.ts` |
| Bằng chứng | Chỉ ô thuộc cụm engine chọn, mức 2 (nhớ dạng từ từ nghĩa với bộ chữ cho sẵn, g = 0,1):<br>• không gợi ý → đúng tự lực;<br>• có gợi ý → đúng có trợ giúp;<br>• lộ ≥ nửa số chữ → sai.<br>Từ kho ngoài cụm và thử thách ngày không ghi bằng chứng (nội dung không do engine chọn) | `evidenceOf()` |
| Thử thách ngày | Cùng một màn cho mọi người trong ngày; chia sẻ kết quả bằng ô màu, không lộ đáp án (M10) | `dailyLevel()`, `shareText()` |
| Nối app | Bộ não chọn game: ôn từ → Vòng Chữ (88), từ cần học (72), chơi thêm (45). Thẻ lớn ở sảnh ngay dưới "Chơi tiếp". Phố: 🎡 Vòng đu quay. Số liệu chơi, bot người học (`playWheel`) | `director.ts`, `wheelhome.ts`, `town.ts`, `tools/learners/core.ts` |

**Kiểm:**
- Đơn vị `engine-wheel.test.ts`:
  - dựng màn trên kho thật;
  - 30 ngày liền đều có màn thử thách ngày;
  - chấm từ, gợi ý, bằng chứng.
- e2e `wheel.spec.ts`:
  - **vuốt chuột thật** qua tâm chữ trên canvas → ô mở, bằng chứng mức 2;
  - gõ cũng được;
  - thắng màn → "Màn tiếp" ngay trong lớp phủ;
  - gợi ý trừ xu, hết xu thì nút tắt;
  - thử thách ngày không ghi bằng chứng;
  - WCAG AA sáng / tối ở 390 px, nút ≥ 44 px.

**Chấm M1–M10 (so với game vuốt chữ dẫn đầu):**

| M1 ×2 | M2 ×2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 7 | 8 | 5 | 8 | 5 | 6 | 5 | 8 | 6 | **6,6** |

So với game tốt nhất cũ (Câu đố ngày 4,6) là +2,0. **Chưa tới 7**, còn thiếu:
- **M4 mỹ thuật:** nền là dải màu vẽ bằng mã, nghĩa vẫn kèm emoji; chưa có tranh minh hoạ cho từng chương, chưa có nhân vật đi cùng màn chơi;
- **M6 chiều sâu:** chưa có ô đặc biệt (chữ vàng, ô thưởng), chưa có chuỗi combo;
- **M8 sưu tập:** chưa có "sổ từ" gom các từ đã tìm theo chương;
- **M7:** màn được dựng theo luật từ nội dung engine chọn, chưa có màn thiết kế tay.

Điểm 6,6 vẫn do tôi chấm. **Thước đo nghiệm thu thật là người sáng lập chơi thử** và các chỉ số §8.3.

**Bot người học L01, 8 ngày, `--games director`, v93:**
- Bộ não chọn Vòng Chữ 3 lần; bot thắng cả 3 màn; không kẹt, 0 lỗi trang.
- Ô mastery Đạt cuối kỳ: 709 (v90: 710), trong nhiễu.
- Tỉ lệ đúng thấp hơn (49% so với 55%) vì cơ cấu game khác nhau giữa hai lần chạy. Câu Vòng Chữ là tự gõ nên khó đoán hơn câu chọn.

### 10.6 Đã làm v94: chiều sâu, sưu tập, phong cảnh, chuỗi ngày cho Vòng Chữ

| Tiêu chí | Việc | Vì sao vẫn đúng spec |
|---|---|---|
| M6 chiều sâu | **Combo:** tìm từ liền không gửi sai thì xu nhân hai từ từ thứ 3, nhân ba từ từ thứ 5. **Ô vàng:** mỗi màn một ô, ưu tiên ô thuộc cụm engine chọn, tìm ra +5 xu. **Hũ từ thưởng:** mỗi từ thưởng +1, đủ 6 thì đổi 1 gợi ý miễn phí (dùng trước gợi ý trả xu) | Chỉ đổi xu và gợi ý, không đổi câu hay cách tính năng lực (P13, P14). Ô vàng nằm ở từ cần học nên chiến thuật kiếm xu trùng đường học (C345). Gợi ý miễn phí vẫn tính là có gợi ý trong bằng chứng |
| M8 sưu tập | **Sổ từ** ở thẻ sảnh: mọi từ đã tìm ra, xếp theo chương, chạm để nghe; từ gặp từ 3 lần có ⭐. Từ mới vào sổ có thông báo ngay trong màn | Sổ là telemetry (`st.e.gh.book`), giới hạn 3.000 từ, không vào năng lực |
| M4 mỹ thuật | **Phong cảnh động cho 6 chương**, vẽ bằng canvas:<br>• mặt trời có tia xoay;<br>• sóng biển và thuyền;<br>• rừng trúc đung đưa;<br>• phố đêm cửa sổ nhấp nháy;<br>• đồi cát và xương rồng;<br>• núi tuyết và tuyết rơi.<br>Giảm chuyển động thì đứng yên | — |
| M10 quay lại | **Chuỗi ngày** của thử thách ngày (🔥 N ngày ở thẻ sảnh) | Không phạt khi đứt chuỗi, chỉ bắt đầu lại từ 1 (HG20) |

**Kiểm:**
- Đơn vị `engine-wheel.test.ts`:
  - combo; ô vàng luôn ở ô của cụm khi có;
  - hũ đầy đổi gợi ý; chuỗi ngày;
  - sổ từ: giới hạn, chỉ từ 3–8 chữ.
- e2e `wheel.spec.ts`:
  - hũ đầy → gợi ý miễn phí không trừ xu;
  - từ vào sổ, sổ hiện đúng số từ ở sảnh.

**Chấm lại M1–M10 (vẫn là tự chấm, chờ người sáng lập chơi thử):**

| M1 ×2 | M2 ×2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 7 | 8 | 6 | 8 | 7 | 6 | 7 | 8 | 7 | **7,1** |

**Còn thiếu để lên 8:**
- **M4:** tranh minh hoạ thật thay cho emoji ở gợi ý nghĩa (cần họa sĩ hoặc bộ hình tự vẽ);
- **M7:** màn thiết kế tay cho các mốc chương;
- **M2:** rung tay trên iOS (Safari không hỗ trợ rung); tinh chỉnh độ nhạy khi vuốt nhanh qua chữ.

### 10.7 Đã làm v95: game chủ lực thứ hai ⛏️ Mỏ Chữ

**Vì sao chọn thể loại này** (thay cho ý ban đầu "xếp khối có chữ"):
- Trong game xếp khối, việc đặt khối là bài toán hình học, chữ khó thành cơ chế thật.
- Mỏ Chữ thuộc nhóm **ghép 3 + săn chữ** (nhóm giải đố dẫn doanh thu). Ở đây mỗi lượt là tạo một từ (M1, HG24); ô vỡ, chữ rơi, chữ mới lấp vào như game ghép 3.

| Phần | Làm gì | Tệp |
|---|---|---|
| Lõi | Lưới 6 × 7, chữ lấp theo tần suất tiếng Anh. Vuốt qua ô kề nhau (cả chéo), không lặp ô. **Nhiệm vụ** = từ của cụm u: bộ chọn chung đưa ra (3–5 từ, 3–6 chữ), được gieo thành đường kề và **luôn có đường**: bị phá thì gieo lại. Từ hợp lệ khác (kho 6.343 từ) ăn điểm. Từ sai / ngắn / trùng **không tốn lượt** | `wordhunt.ts` |
| Căng thẳng không đồng hồ | Giới hạn lượt vuốt (2 lượt / nhiệm vụ + dư 8 → 4 theo màn). Hết lượt thì "Chơi lại màn"; không phạt ngoài việc chơi lại (P15, HG20) | `huntCurve()` |
| Chiều sâu | Từ ≥ 5 chữ để lại **ô đá quý 💎**, dùng thì vỡ cả hàng. **Ô vàng** nhân đôi điểm, +3 xu. Chuỗi từ liền nhân đôi điểm. Từ dài nhân điểm. Gợi ý = ô chữ đầu của một nhiệm vụ nhấp nháy (10 xu) | `applyWord()`, `points()` |
| Màn chơi | Canvas toàn màn hình. Hang có tinh thể phát sáng và bụi bay (3 chủ đề: pha lê, mỏ vàng, hang băng). Ô chữ dạng đá có bóng; đường vuốt phát sáng; ô vỡ có hạt; chữ rơi chậm dần; ô đặc biệt phát sáng. Âm thanh và nhạc dùng chung Vòng Chữ. Có ô gõ cho trình đọc màn hình | `huntview.ts` |
| Bằng chứng | Từ nhiệm vụ của cụm engine chọn tìm ra → mức 2, g = 0,05; có gợi ý → có trợ giúp. Từ kho và mỏ hôm nay: không ghi | `nWord()` trong `main.ts` |
| Quay lại | **Mỏ hôm nay** giống nhau cho mọi người, có chuỗi ngày, chia sẻ bằng ô màu không lộ đáp án | `dailyHunt()` |
| Nối app | Bộ não chọn game: từ cần học (73), chơi thêm (44). Thẻ lớn ở sảnh. Phố: ⛏️ Mỏ chữ. Số liệu chơi. Bot `playHunt` | |

**Kiểm:**
- Đơn vị `engine-hunt.test.ts`:
  - ô kề nhau (không nối mép trái – phải);
  - mọi nhiệm vụ có đường trên 40 seed;
  - vỡ – rơi – lấp đủ lưới, id không trùng;
  - đá quý vỡ cả hàng;
  - nhiệm vụ còn đường sau 15 lần phá;
  - mỏ hôm nay giống nhau.
- e2e `hunt.spec.ts`:
  - **vuốt chuột thật** trên lưới canvas → bằng chứng mức 2, tốn 1 lượt; từ sai không tốn lượt;
  - thắng → "Màn tiếp";
  - gợi ý trừ xu và đánh dấu có trợ giúp;
  - WCAG AA ở 390 px, ô lưới ≥ 44 px.

**Chấm M1–M10** (so với game săn chữ / ghép 3 dẫn đầu, tự chấm):

| M1 ×2 | M2 ×2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 7 | 8 | 6 | 8 | 7 | 5 | 5 | 7 | 6 | **6,7** |

**Thấp hơn Vòng Chữ ở:**
- **M7:** màn dựng theo luật; chưa có mục tiêu khác ngoài tìm từ (ví dụ phá băng, đưa vật xuống đáy như game ghép 3);
- **M8:** chưa có sổ riêng; từ đã tìm chưa vào sổ từ chung;
- **M9:** luật "kề nhau cả chéo" cần một lượt chơi mới hiểu, chưa có bàn tay hướng dẫn.

**Bot người học L01, 8 ngày, v95:**
- Bộ não chọn Vòng Chữ 3 lần (thắng cả 3). **Chưa lần nào chọn Mỏ Chữ**: bước học đầu lộ trình của bot là ngữ pháp, còn Mỏ Chữ chỉ được chọn cho từ cần học (73) và chơi thêm (44). Vì vậy Mỏ Chữ mới được kiểm bằng e2e, chưa bằng bot.
- Ô mastery Đạt: 709 (v93: 709). 0 lỗi trang, không kẹt.
- Thêm hướng dẫn bàn tay ở màn 1 (M9: 7 → 8). Điểm M của Mỏ Chữ thành 6,8.

### 10.8 Đã làm v96: mục tiêu kiểu ghép 3, màn mốc, sổ từ chung, xen kẽ hai game chủ lực

**Gốc rễ của lần sửa này** (từ §10.7):
- M7 thấp vì màn nào cũng chỉ có một mục tiêu là tìm từ. Game ghép 3 dẫn đầu giữ người chơi hàng nghìn màn nhờ **thay đổi mục tiêu**, không nhờ đổi luật.
- M8 thấp vì từ tìm ở Mỏ Chữ không đi đâu cả.
- Bot không bao giờ gặp Mỏ Chữ vì bộ não chỉ chọn nó cho "từ cần học".

| Phần | Làm gì | Tệp |
|---|---|---|
| Mục tiêu theo màn | Màn 1–3: chỉ tìm từ (làm quen). Từ màn 4 xoay vòng: tìm từ → **phá băng** → **đưa rương xuống đáy** | `goalOf()` |
| 🧊 Phá băng | Ô có băng vỡ khi được dùng trong từ, hoặc khi nằm trên hàng bị đá quý phá. Màn thường: băng đối xứng trái – phải, nhiều dần theo màn. Thêm lượt bằng 1/3 số ô băng | `iceMask()`, `breakIce()` |
| 🧰 Đưa rương | Rương nằm ở hàng trên, không chọn được. Phá ô bên dưới thì rương rơi xuống; tới đáy thì thu (+5 xu). Rương không đè lên đường của từ nhiệm vụ. Đá quý phá hàng chừa rương | `placeChests()`, `collectChests()` |
| Màn mốc (10, 20, …) | Băng theo **hình vẽ tay**: tim, vòng, chéo, kim cương, cầu. Tiêu đề "màn mốc" | `ICE_SHAPES` |
| Thắng | Đủ từ nhiệm vụ **và** xong mục tiêu. Tìm đủ từ mà chưa xong mục tiêu thì gợi ý chuyển sang một từ ngắn có sẵn trên lưới, nên không bị kẹt | `goalWord()` |
| Sổ từ chung (M8) | Từ nhiệm vụ tìm ở Mỏ Chữ vào sổ từ của Vòng Chữ, chương "⛏️ Mỏ Chữ" | `addBook(…, 90)` |
| Trợ năng | Mục tiêu (còn bao nhiêu băng, rương mấy / mấy) hiện cả ở phụ đề DOM, không chỉ trên canvas, để trình đọc màn hình đọc được | `huntview.ts` |
| Bộ não xen kẽ | Hai game chủ lực cùng phục vụ ôn tập, ôn nhẹ, chơi thêm (Mỏ Chữ cũng phục vụ từ cần học). Game **chưa** chơi gần nhất (`flag`, tính qua nhiều ngày) đứng trên game kia: 88 / 86, 55 / 54, 45 / 44 | `director.ts`, `dirIn()` |

**Gốc rễ việc bot chưa bao giờ gặp Mỏ Chữ** (tìm ra khi chạy bot sau bước đầu của v96):
- Bước đầu chỉ nâng điểm ôn tập của Mỏ Chữ lên 86, nhưng bot vẫn chọn Mỏ Chữ 0 lần.
- Lý do: `planDay()` xếp lộ trình với `played` / `last` rỗng, nên phạt xen kẽ (−45 / −25) không chạm tới lộ trình. Mỗi nhu cầu chỉ lấy một game, nên Vòng Chữ (88) luôn giữ chặng ôn.
- Sửa bằng `flag`: game chủ lực chơi gần nhất, lấy từ game bắt đầu gần nhất, nếu không có thì từ sổ bằng chứng.

**Bot người học L01, 8 ngày, cùng seed:**

| | Trước khi sửa `flag` | Sau |
|---|---|---|
| Chặng ôn ngày 3–8 | Vòng Chữ 4 lần, Mỏ Chữ 0 | Vòng Chữ 3, Mỏ Chữ 3, thay nhau từng ngày |
| Số câu trả lời | 199 | 219 |
| Ô (nút × mức) có a / (a + b) ≥ 0,8 và n ≥ 3 | 9 | 21 |
| Lỗi trang / kẹt | 0 / 0 | 0 / 0 |

- **Đính chính (v97):** hàng "ô đạt" là nhiễu, không phải tiến bộ. App lấy seed màn chơi từ `Date.now()`, nên hai lần chạy cùng seed bot vẫn đi khác nhau. Lần chạy lại ở v97 cho 9 ô. Điều chắc chắn từ bảng chỉ là Mỏ Chữ đã được chọn.
- Vườn từ không còn vào lộ trình vì lộ trình sau đó nghiêng sang ngữ pháp (Bài Câu). Đây là do NBA quyết định, không phải do bộ não game.

**Đúng spec:**
- Băng / rương chỉ là cách chơi (P13, P14). Không ghi bằng chứng cho băng, rương hay từ của `goalWord()`; bằng chứng vẫn chỉ ở từ nhiệm vụ của cụm engine chọn.
- Không thêm đồng hồ (P15).
- Chưa xong mục tiêu thì chỉ phải "chơi lại màn", không phạt (HG20).

**Kiểm:**
- Đơn vị:
  - mục tiêu theo màn;
  - hình băng màn mốc đúng mẫu;
  - băng vỡ khi dùng;
  - rương không đè đường nhiệm vụ, rơi và được thu ở đáy;
  - đá quý không phá rương;
  - `goalWord()` luôn trả từ có trên lưới;
  - bộ não xen kẽ hai game ở ôn tập, cả trong lộ trình ngày (`flag`) và ôn nhẹ.
- e2e:
  - màn 10 hiện băng hình tim, phụ đề "Phá băng: còn N ô" khớp lưới, số băng không tăng sau khi vuốt;
  - màn 5 có rương, phụ đề "0/1";
  - từ nhiệm vụ vào sổ từ chung và hiện chương "⛏️ Mỏ Chữ" ở sảnh.
- Toàn bộ: 271 đơn vị, 198 e2e (Android + máy tính) qua.

**Chấm lại M1–M10 của Mỏ Chữ** (tự chấm, chưa có người chơi thử):

| M1 ×2 | M2 ×2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | 7 | 8 | 6 | 8 | 8 | 7 | 6 | 8 | 6 | **7,1** |

- M6 lên 8: phải tính đường vuốt để kéo rương xuống và dùng ô băng, không chỉ tìm từ.
- M7 lên 7, chưa cao hơn: mục tiêu và hình băng có thật, nhưng màn vẫn dựng theo luật, chưa có hàng trăm màn được cân chỉnh tay như game dẫn đầu.
- M8 lên 6: có sổ chung, nhưng chưa có bộ sưu tập riêng của mỏ (đá quý, rương hiếm).

**Còn thiếu để lên 8+:**
- M4: nhạc và hình vẫn vẽ bằng mã, chưa có họa sĩ.
- M10: chưa có sự kiện theo tuần.
- Thước đo thật: số liệu chơi (`pm`) của người chơi thật, theo ngưỡng §9.

### 10.9 Đã làm v97: game chủ lực thứ ba 🃏 Bài Câu bản toàn màn hình (ngữ pháp)

**Gốc rễ:** hai game chủ lực chỉ phục vụ từ vựng. Khi lộ trình cần ngữ pháp (bước đầu của A1), bộ não buộc phải đưa người chơi vào Bài Câu kiểu cũ: vẽ lại HTML, chạm nút, bấm "Lượt tiếp" sau mỗi câu. Cách sửa đúng spec (C69, C345) là làm game ngữ pháp đạt chuẩn chủ lực, không phải ép bộ não chọn game từ vựng.

| Phần | Làm gì | Tệp |
|---|---|---|
| Màn chơi | Lớp phủ toàn màn hình ngoài `#app`: bàn nỉ xanh, đèn rọi, hoa văn bài mờ; vùng câu viền vàng; khay "tay bài" | `cardsfx.ts` |
| Lá bài | Nút DOM thật đặt trên canvas, di chuyển bằng transform mỗi khung hình (không vẽ lại `#app`). Lá rời tay để lại chỗ trống như bài thật. Kéo thả bằng chuột / ngón tay: chèn đúng chỗ con trỏ, các lá khác dạt ra chừa chỗ; kéo lá ra khỏi vùng câu thì bỏ ra. Chạm / Enter vẫn thêm / bỏ lá | `flow()`, `insertAt()` |
| Nhịp (M3) | Câu đúng: lá sáng xanh và nhấc lên, hạt, chữ "+điểm" bay, **tự chuyển lượt sau 1,3 giây** (không bấm "Tiếp"). Câu sai: lá sai rung và sáng đỏ, hiện câu đúng + giải thích, dừng chờ người chơi đọc | `cPlay()` trong `main.ts` |
| Hết bàn / hết ván | Hộp giữa bàn: thắng / chưa đủ điểm, chọn lá bùa (nút dạng lá), kết quả ván | `cardsfx.ts` |
| Âm thanh | Nốt theo vị trí lá, hợp âm khi đúng, nhạc nền; dùng chung Vòng Chữ | `wheelview.ts` |
| Sảnh | Thẻ lớn "🃏 Bài Câu" cạnh hai game chủ lực kia | `viewCardsHero()` |

**Giữ nguyên:** luật và điểm (`cards.ts`), bộ chọn câu, bằng chứng mức 3 `qt:'order'` cho đúng nút ngữ pháp engine chọn, telemetry.

**Lỗi thật tìm ra khi rà mã:** sau khi kéo bằng ngón tay, trình duyệt không phát click, nên một cờ chặn click kiểu "dính" sẽ nuốt mất lần chạm kế tiếp. Đã đổi sang cửa sổ thời gian 350 ms.

**Kiểm:**
- e2e `cards.spec.ts`:
  - ván đủ 3 bàn × 3 lượt; lượt đúng tự chuyển, không có nút "Lượt tiếp"; bằng chứng 9 câu đúng nút `g:`;
  - **kéo chuột thật**: chèn trước lá đã có, kéo ra để bỏ, kéo đủ câu → đúng thứ tự → ra bài, bằng chứng `order`, tự sang lượt 2;
  - WCAG AA sáng / tối ở 390 px; lá ≥ 44 px, không tràn màn; bấm lá bằng bàn phím.
- Toàn bộ: 271 đơn vị, 204 e2e qua.
- Bot L01, 8 ngày: chơi trọn 4 ván Bài Câu bản mới (36 câu), không kẹt, 0 lỗi trang.
- **Tỉ lệ lượt chơi ở game chủ lực** (Bài Câu + Vòng Chữ + Mỏ Chữ, trên các lượt trong game): 59 / 127 = **46 %**. Trước v97, nếu không tính Bài Câu cũ là chủ lực, tỉ lệ này là 18 %.

**Chấm M1–M10 của Bài Câu** (tự chấm, so với game xếp bài tính điểm dẫn đầu):

| M1 ×2 | M2 ×2 | M3 | M4 | M5 | M6 | M7 | M8 | M9 | M10 | **Điểm** |
|---|---|---|---|---|---|---|---|---|---|---|
| 6 | 7 | 7 | 5 | 8 | 6 | 4 | 3 | 8 | 2 | **5,8** (bản cũ 2,7) |

**Còn thiếu:**
- M7: chưa có màn / bàn thiết kế sẵn;
- M8: bùa chưa sưu tập qua các ván;
- M10: chưa có thử thách ngày.

### 10.10 Đã làm v98: cân độ khó bằng mô phỏng (M7) + sự kiện tuần (M10)

**Mô phỏng** (`tools/sim/levels.ts`): người chơi giả "điển hình" chơi Mỏ Chữ bằng **đúng các hàm của game**, 60 seed mỗi màn. Mô hình người chơi:
- nhận ra ngay 60 % từ nhiệm vụ, mỗi lượt sau nhận thêm 30 %;
- khi chưa thấy từ nhiệm vụ: 60 % nhắm vào mục tiêu, còn lại vuốt từ bất kỳ.

Vòng Chữ không có trạng thái thua nên không đo tỉ lệ thắng.

**Mô phỏng tìm ra lỗi thiết kế mà e2e không thấy** (đường cong trước khi sửa):

| Loại màn | Tỉ lệ thắng |
|---|---|
| Tìm từ | 95–100 % |
| Băng | 35–70 % |
| Rương | 3–35 % (màn 26: 3 %) |

Đường cong là "răng lược" chứ không phải răng cưa. Gốc rễ, tìm bằng cách lần vết hàng của rương qua từng lượt:
1. **Rương kẹt ở hàng sát đáy.** Muốn rơi, nó cần một từ đi qua đúng ô bên dưới, nhưng ô đó mang chữ ngẫu nhiên, nên không có từ nào đi qua được. Màn trở thành không giải được, lỗi mà game ghép 3 thật luôn chặn.
2. **Gợi ý `goalWord()` lấy từ đầu tiên chạm mục tiêu**, không phải từ tốt nhất.

**Sửa:**
- `findPathVia()`: đường bắt buộc qua một ô.
- `goalCells()`: ô then chốt, gồm ô ngay dưới rương và ô băng khi chỉ còn ≤ 3.
- `keepGoalReachable()`: ô then chốt nào không có từ 3 chữ đi qua thì gieo một từ 3 chữ qua ô đó, tránh ô của nhiệm vụ. Chạy sau mỗi lượt.
- `goalWord()` chọn từ phá được **nhiều** ô mục tiêu nhất, ưu tiên ô then chốt. Gợi ý trong game dùng hàm này nên cũng tốt lên.
- `sawtooth()`: nhịp răng cưa mỗi chương 10 màn. Đầu chương +2 lượt, giữa +1, cuối 0, mốc −1, băng mốc −3; rương thêm 2 lượt.

**Sau khi sửa** (60 seed, màn 1–60):

| Loại màn | Tỉ lệ thắng |
|---|---|
| Màn 1–3 và màn tìm từ (màn thở) | 93–100 % |
| Băng | 72–92 % |
| Rương | 50–87 % |
| Màn mốc | 55–85 % (mốc 10, 20 nhẹ để dạy luật; từ mốc 30 siết còn 55–75 %) |

- `engine-balance.test.ts` khoá các dải này để lần sửa sau không làm vỡ nhịp.
- **Giới hạn:** mô hình người chơi là giả định. Số liệu thật (`pm`: bỏ dở, chơi lại) của người chơi thật mới là thước đo cuối.

**Sự kiện tuần** (`weekly.ts`):
- Tuần bắt đầu thứ Hai. Bốn chủ đề xoay vòng:
  - ⛏️ thợ mỏ chữ: tìm 60 từ ở Vòng Chữ + Mỏ Chữ;
  - 🃏 câu chuẩn: 24 câu đúng ở Bài Câu;
  - ⭐ ngôi sao: 30 sao / bàn thắng;
  - 🎪 hội chợ: xong 9 màn / ván, mốc cuối cần đủ ba game.
- 3 mốc thưởng 15 / 30 / 60 xu. Mốc cuối thêm huy hiệu tuần vào kệ huy hiệu trên thẻ sảnh (sưu tập, M8).
- Không ghi bằng chứng, không đổi câu hỏi hay lộ trình (P13, P14, C69). Lưu ở `st.e.wk`, gộp hai máy giữ mọi huy hiệu.

**Kiểm:**
- Đơn vị: `engine-balance`, `engine-weekly`.
- e2e: tuần "thợ mỏ chữ", tìm từ ở Mỏ Chữ → đủ mốc cuối → +60 xu, huy hiệu hiện ở sảnh.
- Toàn bộ: 278 đơn vị, 206 e2e qua.

**Chấm lại (tự chấm):**

| Game | Thay đổi | Điểm |
|---|---|---|
| Mỏ Chữ | M7 7 → 8 (đường cong đo được, có nhịp, không còn màn không giải được), M10 6 → 7 | 7,1 → **7,3** |
| Vòng Chữ | M10 7 → 8 | 7,1 → **7,2** |
| Bài Câu | M10 2 → 4 | 5,8 → **5,9** |

### 10.11 Đã làm v99: sảnh tập trung vào game chủ lực

Làm đúng §10.4: game cũ không xoá, chỉ lùi vào mục thu gọn. Chúng vẫn là cơ chế bằng chứng cho nghe / nói / đọc / viết, và bộ não vẫn đưa người chơi vào đó khi lộ trình cần.

Sảnh từ trên xuống:
1. Lộ trình hôm nay (bộ não).
2. **⭐ Game chủ lực:** Vòng Chữ, Mỏ Chữ, Bài Câu.
3. Sự kiện tuần.
4. **📚 Luyện tập theo kỹ năng** (thu gọn): 13 game cũ. Bài Câu kiểu cũ bỏ khỏi danh sách vì đã thành game chủ lực.
5. Phố.
6. **🏰 Leo tháp** (thu gọn).
7. Số liệu chơi.

**Kiểm:** test mở mục thu gọn trước khi tìm nút Leo tháp (`openAll`). Toàn bộ 278 đơn vị, 206 e2e qua.

Khi rà, test kéo thả Bài Câu hỏng một lần lúc chạy song song nặng. Gốc rễ là test chờ cứng 300 ms trong khi lá đang trượt; đã đổi sang chờ tới khi vị trí lá đứng yên. Chạy song song 4 luồng: 8/8 qua.

### 10.12 Đã làm v100: gói chơi thử nghiệm thu + sửa lỗi CI / hồi quy

**Gói chơi thử** (`docs/PLAYTEST.md`):
- kịch bản 15 phút;
- phiếu chấm M1–M10 đặt điểm tôi tự chấm cạnh ô trống cho người sáng lập;
- cách đọc số liệu chơi.

Chế độ `?playtest=1` thêm nút nhảy tới màn rương 5, màn mốc 10, màn băng 13, màn khó 29 ở thẻ Mỏ Chữ. Chế độ này chỉ đổi màn chơi, không ghi bằng chứng.

**Lỗi thật tìm ra khi đưa CI về xanh** (CI đỏ từ v96 đến v99; máy soạn không chạy được Safari):

| Lỗi | Gốc rễ | Sửa |
|---|---|---|
| Bài Câu trên Safari: bấm "Lượt tiếp" xong vẫn còn nút cũ | Lớp phủ chỉ cập nhật DOM ở khung hình sau. WebKit vẽ khung chậm nên có nút "ma" | `refresh()` đồng bộ DOM ngay sau mỗi thao tác. Test kiểm nút vừa bấm phải ẩn ngay |
| Kéo lá nhanh thì lá rơi sai chỗ (đầu câu, hoặc ngoài câu) | Vị trí thả lấy từ `pointermove` cuối. Máy chậm / vuốt nhanh thì trình duyệt gộp các sự kiện di chuyển | Lấy vị trí từ chính `pointerup` |
| Mục thu gọn đóng sập khi app vẽ lại | `render()` thay `innerHTML` | Giữ trạng thái mở theo màn + tiêu đề |
| **Hồi quy v99**: mất lối vào "Lộ trình hôm nay / Bước tiếp theo" ở sảnh | Thu gọn cả `viewQuestHome`, trong khi khối này chứa cả lối vào việc học. Bot báo `today-missing`, ngày nào cũng rơi vào Xưởng, tỉ lệ game chủ lực tụt còn 14 % | Chỉ thu gọn phần tháp |
| Tháp biến mất hẳn sau lần sửa trên | Phép thay chuỗi để lại `+ + viewQuestHome(…)`: dấu `+` thứ hai biến HTML thành `NaN`, TypeScript không bắt | Sửa; e2e Leo tháp bắt được lỗi |

**Bot L01, 8 ngày, bản cuối:**
- **72 %** lượt chơi trong game là game chủ lực (110 / 152). Trước v97 là 18 %.
- Mỗi ngày có Kiểm tra nhanh. Vòng Chữ và Mỏ Chữ thay nhau ở chặng ôn; Bài Câu ở chặng ngữ pháp mỗi ngày.
- 0 lỗi trang, 0 lần kẹt.

**Bài học quy trình:**
- Kiểm cả CI, không chỉ máy soạn. Thông báo CI đỏ đã không về, và ba lần đẩy đỏ mà tôi không biết.
- Chạy bot sau **mỗi** thay đổi giao diện sảnh: hồi quy v99 chỉ bot mới thấy, e2e không thấy.

### 10.13 Đã làm v101: cốt truyện "Phố Chữ mất tiếng" nối ba game chủ lực

**Yêu cầu của người sáng lập:** các game phải liên kết với nhau bằng cốt truyện.

**Gốc rễ của cảm giác rời rạc:** ba game chia chung xu và Phố, nhưng người chơi không có lý do để đi từ game này sang game kia: không mục tiêu chung, không nhân vật, không "chuyện gì xảy ra tiếp". Game ghép 3 có cốt truyện (làm vườn, sửa nhà) giải quyết đúng chỗ này: mỗi màn chơi đẩy câu chuyện; câu chuyện cho lý do quay lại và lý do đổi game.

**Tiền đề (người sáng lập chọn):** Sương Câm phủ Phố Chữ, chữ biến khỏi biển hiệu và lời nói của cư dân. Bạn cùng Tí trả lại lời cho từng khu.

| Phần | Làm gì | Tệp |
|---|---|---|
| Nội dung | Mở đầu + 3 khu (Chợ Sáng, Bến Cảng, Rừng Trúc) × 4 chương + "còn tiếp" (Phố Đêm). 9 nhân vật: Tí, Bà Lan, Chú Tư, Bé Bin, Ông Ba, Cô Ngân, Ông Hải, Thầy Minh, Cô Chi. Mọi câu thoại là tiếng Anh A1 ngắn (≤ 14 từ, có test), kèm dịch | `story.ts` |
| Nhiệm vụ nối 3 game | Mỗi chương: ⛏️ đào chữ (từ tìm ở Mỏ Chữ), 🎡 thắp đèn (thắng màn Vòng Chữ), 🃏 trả câu nói (câu đúng ở Bài Câu). Nhiệm vụ hiện ở thẻ truyện (bấm là vào đúng game) **và ngay trong phụ đề game**, ví dụ "📖 Đào chữ cho Bà Lan: 3/5", cập nhật theo từng từ | `storyAdd()`, `storyNote()` |
| Gắn học thật (người sáng lập chọn) | Chương cuối mỗi khu cần thêm **2 / 5 / 9 kỹ năng vững** trên bản đồ năng lực (`skillsOf().solid`). Thiếu thì thẻ truyện khoá và chỉ đường sang "Lộ trình hôm nay": truyện thưởng cho việc học thật (North Star), không chặn chơi | `solid`, `ready()` |
| Cảnh truyện | Lớp phủ toàn màn hình theo màu khu; từng khung: nhân vật (Tí dùng linh vật), câu tiếng Anh gõ dần (giảm chuyển động thì hiện ngay), dịch, 🔊 nghe giọng máy, Tiếp / Bỏ qua. Xong chương +20 xu, xong khu +50 xu và "khu đã hồi sinh" | `storyfx.ts` |
| Lưu | `st.e.sy`; gộp hai máy giữ chương xa hơn | `state.ts` |

**Đúng spec:**
- Truyện không ghi bằng chứng (e2e kiểm sổ bằng chứng không tăng thêm).
- Không đổi câu hỏi hay lộ trình. Bộ não chọn game vẫn theo nhu cầu học (C69, C345).
- Nhiệm vụ truyện trải đều ba game nên không kéo người học lệch khỏi lộ trình.

**Sửa thêm trong đợt này:** kéo thả Bài Câu nghe `pointermove` / `pointerup` trên `window` trong lúc kéo, thay vì dựa vào pointer capture của từng lá. CI Safari iOS cho thấy lần kéo thứ hai mất sự kiện.

**Kiểm:**
- Đơn vị `engine-story` (3):
  - nội dung đủ khu / chương, mỗi chương dùng cả ba game;
  - mốc kỹ năng tăng dần;
  - tiến độ chặn ở mức cần;
  - chương cuối khoá khi thiếu kỹ năng vững;
  - xu, khu hồi sinh, lưu / gộp.
- e2e `story.spec` (2):
  - mở đầu → chương 1;
  - tìm từ ở Mỏ Chữ → phụ đề game và thẻ truyện cùng tăng;
  - đủ nhiệm vụ → cảnh → chương 2, +20 xu;
  - chương cuối khoá khi thiếu kỹ năng vững;
  - WCAG AA thẻ truyện và cảnh truyện ở 390 px.
- Toàn bộ: 281 đơn vị, 212 e2e qua.

**Nhịp:** bot L01 xong chương 1 sau 6 ngày, trong khi game có cốt truyện cho xong chương đầu ngay buổi đầu (móc quay lại). Đã hạ nhiệm vụ đào của chương 1 từ 5 xuống 3; vẫn phải qua cả ba game. Chơi trước khi xem cảnh mở đầu vẫn được tính cho chương 1.

**Ảnh hưởng điểm (tự chấm):** M8 (meta, phần thưởng) và M10 (lý do quay lại) của cả ba game +1.
- Vòng Chữ 7,2 → 7,3
- Mỏ Chữ 7,3 → 7,4
- Bài Câu 5,9 → 6,1

Cảnh truyện vẫn là chữ + emoji, chưa có tranh (M4).

### 10.14 Đã làm v102: "sân khấu" dùng chung cho 14 game kỹ năng

**Yêu cầu:** "Làm tiếp những game còn lại" (13 game cũ + Leo tháp, chấm 2,2–4,6 / 10).

**Phản biện:**
- Làm lại cả 14 game bằng canvas riêng thì tốn khoảng 14 đợt, lại dàn trải đúng lỗi §10.3.
- Gốc rễ chung là: nằm trong khung app (M5), không hình / tiếng (M4), phản hồi nhạt (M2). Cả ba sửa được **một lần cho mọi game**.
- Riêng 3 game được chơi nhiều nhất (Bắt Âm, Vườn từ, Quán) sẽ làm lại ở v104–v106.

| Phần | Làm gì | Tệp |
|---|---|---|
| Bật / tắt | Engine nhớ route vừa vẽ. Khi đang ở route game và có game kỹ năng chạy (`activeGame()`, cả Thám hiểm), `body.stage` bật. Rời tab Chơi hoặc về sảnh thì tắt. Ba game chủ lực có lớp phủ riêng nên không tính | `EM.stage()` trong `main.ts`, `app.js` `render()` |
| Toàn màn | Ẩn thanh trên / thanh tab của app. Thanh sân khấu gồm ✕ (`stexit`, tách khỏi "Về sảnh" của từng game) và tên game trên nền tối riêng | `stagefx.ts`, `index.html` |
| Cảnh động | Canvas phía sau, mỗi game một cảnh: bong bóng (Bắt Âm), hơi cà phê (Quán), lá (Vườn, Thư), bánh răng (Xưởng), sóng (Đài), nốt nhạc (Karaoke), sương (Thám tử, Thám hiểm), sao (Leo tháp, Bàn Cờ, Câu đố), tia sáng (Robot, Xếp Khối). Giảm chuyển động thì cảnh đứng yên | `STAGES`, `ambient()` |
| Nội dung | Vẫn trên thẻ nền đặc ở giữa, nên tương phản chữ giữ nguyên (WCAG AA) | CSS `body.stage #app` |
| Phản hồi | Phản hồi đúng / sai mới: hạt nổ (đúng thì nhiều màu, sai thì đỏ cam), âm (dùng chung của Vòng Chữ), khung phản hồi nảy / rung | `stageSync()` |

Không đổi luật, câu hỏi hay bằng chứng của game nào. e2e kiểm sổ bằng chứng tăng đúng 1 cho một câu.

**Lỗi tìm ra khi kiểm:**
1. Màn game là `ui.view === 'goal'` (route `quest`), không phải `'play'`. Lần chạy e2e đầu "qua hết" chỉ vì sân khấu chưa hề bật. Đã sửa bằng cách cho engine tự nhớ route.
2. Nút ✕ dùng chung `data-e="qhome"` làm 10 test bắt trúng 2 nút. Đã đổi sang `stexit`.
3. Chữ tên game trắng đặt thẳng lên canvas: trình kiểm WCAG, và máy chậm khi canvas chưa vẽ, chỉ thấy nền sáng. Đã thêm khối nền tối riêng và nền `body` tối dự phòng.

**Kiểm:**
- e2e `stage.spec` (4):
  - 11 game kỹ năng mở ra toàn màn, ✕ về sảnh có lại khung app;
  - Quán đúng → khung nảy, Bắt Âm sai → rung, bằng chứng +1;
  - WCAG AA sáng / tối ở 390 px (Quán, Xưởng), không cuộn ngang.
- Toàn bộ: 281 đơn vị, 220 e2e.
- Bot L01, 8 ngày: không hồi quy (72 % lượt chơi ở game chủ lực, kiểm tra nhanh mỗi ngày, 0 kẹt).

**Chấm lại (tự chấm, ước lượng chung cho 14 game):**
- M4 +1 (cảnh động, âm);
- M5 +3 (toàn màn, không còn khung app);
- M2 +1 (phản hồi có hạt / nảy).

Điểm 14 game tăng khoảng **+0,6** (ví dụ Quán 2,5 → 3,1; Bắt Âm 2,9 → 3,5). Vẫn thấp vì lõi chơi còn là chọn đáp án trong HTML; v104–v106 sẽ làm lại 3 game chơi nhiều nhất.

### 10.15 Đã làm v103: nối truyện vào game kỹ năng (nhân vật, việc phụ)

**Gốc rễ:** cốt truyện v101 chỉ chạm ba game chủ lực, nên game kỹ năng vẫn là "thế giới khác". Cách nối rẻ nhất mà không làm lệch lộ trình: **cư dân của chương xuất hiện trong game kỹ năng**, kèm việc phụ không bắt buộc.

| Phần | Làm gì | Tệp |
|---|---|---|
| Cư dân của chương | Chương đang nhận tiến độ (đang ở mở đầu thì là chương 1); chương của Tí / "mọi người" không có cư dân | `resident()` trong `story.ts` |
| Thư | Người nhờ viết là cư dân của chương (ví dụ Bà Lan), thay cho người ngẫu nhiên | `lStart()` |
| Quán | Khách đầu ca là cư dân của chương, có dòng "📖 Bà Lan ghé quán" | `CafeRun.vip`, `cafeview.ts` |
| Việc phụ | Thẻ truyện có "✉️ Viết thư cho Bà Lan" và "☕ Mời Bà Lan ở Quán", bấm là vào game. Gửi thư đạt / xong một ca thì +10 xu, mỗi chương một lần. Không tính vào nhiệm vụ chương, không ghi bằng chứng | `sideTasks()`, `sideDone()` |

**Đúng spec:** việc phụ chỉ gợi ý, không đổi lộ trình hay câu hỏi (C69). Bộ não vẫn chọn game theo nhu cầu học.

**Kiểm:**
- Đơn vị: cư dân đúng chương; thưởng một lần mỗi chương; sang chương mới làm lại được; chương của Tí không có việc phụ; lưu dữ liệu `side`.
- e2e: thẻ truyện có việc phụ; Quán có Bà Lan; xong ca thì +10 xu đúng một lần, ngoài xu của ca; Thư có Bà Lan nhờ viết.
- Toàn bộ: 282 đơn vị, 222 e2e. Bot không hồi quy.

**Chấm (tự chấm):** Thư, Quán M8 +1, M10 +1 (khoảng +0,2).

### 10.16 Đã làm v104: 🎯 Bắt Âm bản toàn màn hình

Bắt Âm là game kỹ năng được bộ não chọn nhiều nhất (bot: 30 câu / 8 ngày). Làm lại theo mẫu Bài Câu: lớp phủ ngoài `#app`, `refresh()` ngay sau thao tác, nút DOM thật.

| Phần | Làm gì |
|---|---|
| Cảnh | Dưới nước: tia sáng mặt nước, bong bóng nhỏ bay lên |
| Bong bóng chữ | Nút thật (giữ `data-e="bbans"` nên bằng chứng / bot / test không đổi), màu theo làn, to dần theo chuỗi đúng. **Vùng chạm đứng yên, chỉ hình bên trong nhấp nhô bằng CSS**: chạm dễ trúng, và test / bot bấm được (nút chạy liên tục thì Playwright không bao giờ thấy "đứng yên") |
| Nghe | Nút "🔊 Nghe lại" lớn và "🐢 Chậm" ở trên |
| Đúng | Bong bóng nổ ra hạt, **tự sang từ kế sau 1,2 giây**. Máy có micro thì dừng cho phần "nói thử" |
| Sai | Bong bóng xẹp, bong bóng đúng sáng xanh, nghe lại hai từ của cặp + mẹo, dừng chờ |
| Hết màn | Hộp kết quả trong lớp phủ: màn mới / về sảnh |

**Kiểm:**
- e2e Bắt Âm:
  - 10 từ, bằng chứng ở nút `ph:` với g = 1/3 như cũ;
  - bản 390 px: bong bóng ≥ 44 px trong màn, **chạm chuột thật** → đúng → sang từ 2;
  - WCAG AA; ✕ về sảnh.
- Nói thử (micro) vẫn +5 điểm, không thêm bằng chứng.
- Toàn bộ: 282 đơn vị, 224 e2e. Bot chơi trọn 3 màn, 0 kẹt.

**Chấm (tự chấm):** Bắt Âm 3,5 → **5,6** (M2 6, M3 7, M4 5, M5 8).

### 10.17 Đã làm v105–v106: cảnh sống cho 🌱 Vườn từ và ☕ Quán

**Phản biện:**
- Vườn từ và Quán có luồng HTML phức tạp: thẻ dạy từ, câu chọn / câu tự gõ, nút nghe, phản ứng văn phong. Viết lại thành lớp phủ như Bắt Âm sẽ tốn và dễ vỡ bằng chứng.
- Chọn bố cục quen thuộc của game di động: **cảnh sống ở 1/3 trên, điều khiển ở dưới**. Thẻ câu hỏi giữ nguyên, nên luật và bằng chứng không đổi.

| Game | Cảnh (canvas sân khấu, đọc trạng thái mỗi khung hình) |
|---|---|
| 🌱 Vườn từ | Trời xanh, nắng, luống đất. Mỗi từ của buổi là một chậu, cây vẽ theo bậc nhớ (🌰 → 🌱 → 🌿 → 🌸). Chậu đang hỏi có mũi tên nhấp nhô. Trả lời đúng: **bình tưới nghiêng, giọt nước rơi, cây nảy lớn**. Sai: cây lắc nhẹ |
| ☕ Quán | Tường ấm, kệ cốc, quầy gỗ, cốc bốc hơi. **Khách bước vào từ bên phải** khi tới lượt, có bong bóng 💬 rồi nét mặt theo câu trả lời (😊 / 😮 / 😕 / 🤔). Cư dân của truyện có khuôn mặt riêng (Bà Lan 👵, Chú Tư 👨‍🍳…), cầm biểu tượng của mình, kèm bảng tên. Có bộ đếm "Khách k / 6" |

Hàng chậu / quầy cũ trong thẻ được ẩn, vì cảnh đã vẽ lại chúng.

**Lỗi có sẵn tìm ra khi quét WCAG:** chữ "đúng" màu `--good` (#16805A) trên nền xanh nhạt chỉ đạt 4,2 : 1, dưới ngưỡng 4,5 : 1. Lỗi này có từ trước, chưa test nào quét khung phản hồi đúng của Vườn từ. Đã đổi `--good` (giao diện sáng) thành #127050: đạt 5,2 : 1 trên nền xanh nhạt, 6,1 : 1 trên nền trắng.

**Kiểm:**
- e2e cảnh sống (390 px):
  - Quán có cảnh, thẻ lùi xuống dưới, hàng quầy cũ ẩn;
  - Vườn trả lời đúng → phản hồi đúng;
  - WCAG AA toàn trang.
- Toàn bộ: 282 đơn vị, 226 e2e. Bot 8 ngày không hồi quy (0 kẹt, kiểm tra nhanh mỗi ngày).

**Chưa tìm ra gốc rễ:** test Thư trên Android hỏng 1 lần trong 1 lượt chạy toàn bộ (nút "Gửi thư" bị đè bởi các phần tử thay đổi qua từng lần thử). Đây đúng là dấu hiệu từng thấy trên CI v96. Chạy lại 10 lần (cả song song 4 luồng) đều qua. Nếu gặp lại sẽ bật ghi trace để bắt.

**Chấm (tự chấm):**
- Vườn từ 3,0 → **4,4** (M4 +2, M5 +3, M8 +1);
- Quán 3,1 → **4,6** (M4 +2, M5 +3, M8 +1 nhờ cư dân truyện).

Vẫn thấp hơn game chủ lực, vì lõi chơi còn là chọn đáp án.

### 10.18 Đã làm v107: cảnh sống cho 7 game kỹ năng còn lại

**Yêu cầu:** "Tiếp tục làm những game kế tiếp cho đến khi xong hết game".

**Phản biện:**
- Mẫu v105–v106 (cảnh 1/3 trên, thẻ HTML giữ nguyên bên dưới) đã chứng minh: thêm hình / chuyển động mà không đụng luật và bằng chứng. Viết lại từng game thành lớp phủ riêng như Bắt Âm thì tốn gấp nhiều lần và dễ vỡ bằng chứng.
- Vì vậy dùng **một bộ vẽ cảnh chung** (`src/engine/scenefx.ts`). Mỗi game một cảnh, đọc trạng thái lượt chơi.
- Bốn game đã có bàn chơi hình ảnh riêng (🗺️ bản đồ sương mù, 📅 lưới 16 ô, 🧱 bàn 8 × 8, 🎲 bàn cờ) **không thêm cảnh**. Thêm vào chỉ đẩy bàn xuống dưới màn hình. Bốn game này để đợt sau, làm phản hồi ngay trên bàn của chúng.

| Game | Cảnh (đúng / sai) |
|---|---|
| 🛠️ Xưởng | Băng chuyền chạy, hộp chờ, hộp đang sửa nhấp nhô. Đúng: hộp đóng dấu ✅, trôi đi. Sai: rung, cờ lê 🔧 |
| ✉️ Thư | Bàn viết bên cửa sổ, cư dân (khuôn mặt truyện) đứng chờ. Đang viết: bút chạy. Thiếu ý: ❓. Đủ: thư 💌 bay tới, 😊 |
| 🔍 Thám tử | Bảng gỗ ghim thẻ manh mối, đèn pin quét. Đúng: thẻ lật 🔍, nảy. Sai: ❌ |
| 📻 Đài | Máy thu có màn sóng: tiếng rè giảm dần theo số câu đúng, vạch sóng sáng lên. Đúng: 📶. Sai: ⚡ |
| 🎤 Karaoke | Sân khấu, đèn rọi sáng khi tới câu của bạn, máy đọc vai kia; nốt nhạc theo combo; chấm tiến độ từng câu |
| 🤖 Robot | Robot lớn, pin = số món đã lấy. Lệnh chạy được: ✨. Lệnh hỏng: ❓ |
| 🏰 Leo tháp | Tháp có bậc; người leo bước lên theo câu đúng, trượt khi sai; tim ❤️ / 🤍 |

- Hình trang trí trùng lặp trong thẻ (băng chuyền của Xưởng, hàng thẻ manh mối của Thám tử, đều `aria-hidden`) ẩn khi có cảnh.
- Thông tin có nhãn cho trình đọc màn hình (sóng của Đài, bàn robot) giữ nguyên.

**Lỗi có sẵn tìm ra khi quét WCAG:** dòng lời kế tiếp của Karaoke mờ 55 % nên chữ dưới 4,5 : 1. Đổi sang chữ nhỏ nghiêng, không làm mờ.

**Kiểm:**
- e2e 6 game ở 390 px, sáng và tối: có cảnh, thẻ lùi xuống dưới cảnh, WCAG AA, không tràn ngang.
- Đài cần giọng đọc của máy nên không chạy được trong máy test; cảnh dùng chung đường vẽ với Thám tử.
- Toàn bộ: 282 đơn vị, 233 e2e. Bot 8 ngày: 0 kẹt, có kiểm tra nhanh mỗi ngày.

**Chấm (tự chấm, so với §10.2 + v102):** M4 +2 (có cảnh vẽ riêng), M8 +1 (Thư: cư dân truyện).

| Game | Điểm mới |
|---|---|
| Xưởng | ≈ 3,6 |
| Thư | ≈ 4,0 |
| Thám tử | ≈ 3,4 |
| Đài | ≈ 3,3 |
| Karaoke | ≈ 3,7 |
| Robot | ≈ 4,4 |
| Leo tháp | ≈ 3,5 |

Lõi chơi vẫn là chọn / gõ đáp án, nên chưa lên mức game chủ lực.

### 10.19 Đã làm v108: hiệu ứng trên bàn chơi có sẵn + sửa lớp hạt nổ bị che

**Phản biện:** Thám hiểm, Câu đố ngày, Xếp Khối, Bàn Cờ đã có bàn chơi bằng hình (bản đồ 4 × 4, lưới 16 ô, bàn 8 × 8, bàn cờ). Thêm cảnh 1/3 trên chỉ đẩy bàn xuống dưới màn hình. Thứ chúng thiếu là **khoảnh khắc lớn có hiệu ứng** (M2): nổ hàng, giải nhóm, mở ô, đổ xúc xắc.

**Gốc rễ tìm ra khi làm:**
- Từ v102, hạt nổ của "phản hồi đúng / sai" được vẽ trên canvas nền.
- Canvas này nằm **sau** thẻ câu hỏi, mà thẻ có nền đặc (để giữ tương phản WCAG). Kết quả: hạt nổ gần như không ai thấy.
- **Sửa:** thêm lớp canvas trong suốt `#stagepop` phía trên thẻ, không nhận chạm (`pointer-events: none`). Lớp này chỉ xoá khi khung trước có hạt.

**Việc làm:** `stageBurst(selector)` nổ hạt + âm + lớp CSS ngay tại phần tử. Engine so số đếm của lượt chơi với lần vẽ trước; đổi lượt thì chỉ ghi nhận, không nổ.

| Game | Khoảnh khắc | Hiệu ứng |
|---|---|---|
| 🧱 Xếp Khối | nổ hàng / cột | hạt ở từng ô vừa nổ, ô nảy |
| 📅 Câu đố ngày | giải xong một nhóm | hạt lớn ở dải nhóm vừa giải, dải nảy |
| 🗺️ Thám hiểm | mở thêm ô bản đồ | hạt lớn ở đúng ô vừa mở |
| 🎲 Bàn Cờ | đổ xúc xắc; xây nhà | xúc xắc xoay vào (tới lô đất thì ô vừa tới nảy); xây nhà: hạt lớn ở lô |

Bật giảm chuyển động thì không có hạt, không xoay / nảy.

**Kiểm:**
- e2e:
  - `#stagepop` ở trên (z 40), `aria-hidden`, không chặn chạm (điểm giữa nút vẫn là nút);
  - Bàn Cờ đổ xúc xắc thì có hiệu ứng, chạy 4 lần đều qua;
  - rời game thì lớp này bị gỡ.
- Toàn bộ: 282 đơn vị, 235 e2e. Bot 8 ngày: 0 kẹt.

**Chấm (tự chấm):**
- M2 +1 cho bốn game này;
- M2 +1 cho mọi game sân khấu (hạt nổ giờ mới thật sự thấy được).

Ước lượng: Câu đố ngày ≈ 5,4 · Xếp Khối ≈ 3,9 · Bàn Cờ ≈ 3,9 · Thám hiểm ≈ 3,1.

### 10.20 Đã làm v109: trò nhanh cũ lên sân khấu + bảng chấm lại toàn bộ

**Việc làm:**
- Ba trò nhanh cũ của `app.js` cũng lên sân khấu chung: ⚡ Tốc độ 60 giây, 🧠 Ghép cặp, 🤝 Thách đấu (mục "Trò nhanh (cũ)").
  - Ẩn khung app, có nền động; ✕ trên thanh sân khấu thay nút "← Thử thách". Đang giữa lượt thì vẫn hỏi xác nhận như cũ.
  - Điểm tăng thì ô điểm nảy, có hạt nổ.
  - Dùng `EM.stageApp(kind, n)`. Engine chưa nạp xong thì trò vẫn chạy như cũ, không có sân khấu.
- Đến đây **mọi game trong app** đều đã qua ít nhất một đợt nâng: sân khấu, cảnh sống hoặc hiệu ứng trên bàn, và nối truyện ở những game hợp.

**Bảng chấm lại (tự chấm, cùng thang §10.2 so với game dẫn đầu thể loại):**

| Game | §10.2 | Hiện tại | Đã làm |
|---|---|---|---|
| ⛏️ Mỏ Chữ | — | **7,3** | game chủ lực canvas (v95–v96) |
| 🎡 Vòng Chữ | — | **7,2** | game chủ lực canvas (v93–v94) |
| 🃏 Bài Câu | 2,7 | **5,9** | canvas kéo thả (v97) |
| 🎯 Bắt Âm | 2,9 | **5,6** | lớp phủ dưới nước (v104) |
| 📅 Câu đố ngày | 4,6 | ≈ 5,4 | sân khấu + nhóm giải nổ (v102, v108) |
| ☕ Quán | 2,5 | 4,6 | cảnh quán, cư dân truyện (v105–v106) |
| 🌱 Vườn từ | 3,0 | 4,4 | cảnh vườn (v105) |
| 🤖 Robot | 3,4 | ≈ 4,4 | cảnh robot (v107) |
| ⚡ Tốc độ 60 giây / 🧠 Ghép cặp | 3,6 | ≈ 4,2 | sân khấu (v109) |
| ✉️ Thư | 2,8 | ≈ 4,0 | cảnh bàn viết, cư dân truyện (v103, v107) |
| 🧱 Xếp Khối / 🎲 Bàn Cờ | 3,1 | ≈ 3,9 | sân khấu + nổ hàng / xúc xắc (v102, v108) |
| 🎤 Karaoke | 2,6 | ≈ 3,7 | cảnh sân khấu (v107) |
| 🛠️ Xưởng | 2,5 | ≈ 3,6 | cảnh băng chuyền (v107) |
| 🏰 Leo tháp | 2,4 | ≈ 3,5 | cảnh tháp (v107) |
| 🔍 Thám tử | 2,3 | ≈ 3,4 | cảnh bảng manh mối (v107) |
| 📻 Đài | 2,2 | ≈ 3,3 | cảnh máy thu (v107) |
| 🗺️ Thám hiểm | 2,3 | ≈ 3,1 | sân khấu + mở ô nổ (v108) |

**Phản biện, nói thẳng:**
- Ba đợt v107–v109 nâng phần **trình bày** (M2, M4, M5): có hình, có chuyển động, toàn màn hình, phản hồi thấy được.
- Phần **cơ chế** (M1 chiều sâu, M3 lặp lại, M6 tiến triển) của các game kỹ năng vẫn là "chọn / gõ đáp án". Vì vậy chúng dừng quanh 3–5, thấp hơn hẳn 3 game chủ lực (6–7).
- Muốn lên 6+, một game phải có **chữ chính là cách chơi**, như Vòng Chữ / Mỏ Chữ, không phải câu hỏi được trang trí.
- Không nên làm việc đó cho cả 17 game: §10.3 đã chỉ ra dàn trải là gốc rễ. Hướng đúng là chọn theo số liệu chơi thật (bảng số liệu v89 ở sảnh). Game kỹ năng nào được bộ não chọn nhiều mà người chơi bỏ giữa chừng nhiều thì làm lại cơ chế trước.
- Cần người sáng lập chơi thật và xem bảng số liệu trước khi chọn.

**Kiểm:** e2e Tốc độ 60 giây và Ghép cặp lên sân khấu, ✕ thoát (có xác nhận khi đang chơi), đúng → điểm nảy, WCAG AA 390px. Bộ đầy đủ (đơn vị, e2e, bot 8 ngày) ghi ở phần kết của đợt.

## 11. Hướng v121+: định vị game-first

Quyết định của người sáng lập (11/10/2026, `docs/SPEC.md` dòng "Định vị game-first"): không làm thêm "một app học tiếng Anh" để rồi bị so với các app học lớn. Thay vào đó làm **game chữ tiếng Anh cho người Việt**.

### 11.1 Phản biện trước khi làm

- **Game không tự xoá điểm yếu về nguồn lực, chỉ đổi đối thủ.** Mỹ thuật, âm nhạc, thiết kế màn và cân độ khó còn tốn hơn soạn bài. §10.2 cho thấy cả 17 game chỉ được 2,2–4,6 khi so với game dẫn đầu cùng thể loại. Đổi đối thủ thì sẽ gặp thị trường casual, nơi cạnh tranh còn gắt hơn.
- **Điểm yếu thật sự đổi thành lợi thế ở chỗ hạ trần lời hứa.** Lời hứa "bạn đạt B2" cần chuyên môn và dữ liệu kiểm chứng. Lời hứa "chơi vui và nhớ được từ thật" thì đo được ngay bằng FSRS.
- **Lợi thế mà app lớn khó làm:** giao diện thuần Việt, không tài khoản, không quảng cáo, chạy khi mất mạng, thử thách ngày giống nhau cho mọi người để chia sẻ.
- **Gốc rễ là dàn trải** (§10.3 gốc rễ 5), không phải "app hay game". Game chỉ đúng hướng khi đi kèm thu hẹp số game.

### 11.2 Luật làm việc từ v121

1. **Lõi gồm hai game chữ và một game nói** (sửa ở §13): 🎡 Vòng Chữ, ⛏️ Mỏ Chữ, và Quán Phố Chữ bằng giọng (v123). 🃏 Bài Câu chỉ được làm tiếp khi lõi đạt ngưỡng.
2. **Ngưng mở rộng riêng lẻ** các game kỹ năng còn lại; chúng vẫn ở "Luyện tập" làm cơ chế bằng chứng, chỉ sửa lỗi. Ngoại lệ: cơ chế của ☕ Quán, 🎤 Karaoke, 🤖 Robot, 🔍 Thám tử được **gộp vào** các game lõi theo §13, không làm thêm game mới cùng loại.
3. **Làm theo thứ tự cấp:** game chủ lực phải chạy tốt ở Pre-A1–B1 trước. Muốn mở C1–C2 thì dùng chính cơ chế đó với nội dung khó hơn, không làm game riêng cho cấp cao.
4. **HG24 hiểu là "chữ là quân cờ":** không chèn câu hỏi gác cổng giữa các lượt của một game khác (§10.3 gốc rễ 2).
5. **Nghiệm thu bằng người chơi, không tự chấm:**
   - Người sáng lập playtest theo `docs/PLAYTEST.md` Phần 2.
   - Điểm M thật < 6 thì sửa lõi hai game chủ lực trước mọi việc khác.
   - Sau đó theo dõi người chơi quay lại D1/D7 và số từ còn nhớ sau 7/30 ngày.
6. **Thước đo hai tầng, game trước:** mặt tiền đo bằng quay lại chơi và từ còn nhớ. Xác nhận đạt cấp CEFR là tuỳ chọn ở hồ sơ.
7. **Thành công = vừa quay lại, vừa dùng được (§12):** game chủ lực đạt M ≥ 7, **và** cả app đạt H ≥ 7. Chỉ đạt M thì sẽ lặp lại lỗi của các app học game hoá: người học quay lại đều mà vẫn không dùng được tiếng Anh.

### 11.3 Còn mở (chờ người sáng lập)

- Kiếm tiền "kiểu app học" và cổng lên store "bằng điểm thi thật" (`docs/SPEC.md`) chưa đổi. Hai điểm này cần xem lại cho hợp định vị game.
- Tên sản phẩm "English Ladder" vẫn mang nghĩa app học.

## 12. Trục H: hiệu quả học thật ("học xong có dùng được không")

### 12.0 Vì sao có trục này

Người sáng lập học hết một app học game hoá phổ biến mà vẫn thấy chưa giỏi. Gốc rễ: các app đó đo **hoàn thành** (chuỗi ngày, XP, số bài), không đo **dùng được**. Người học ít tự nói và tự viết, lượng nghe đọc thật quá ít, và không được kiểm tra ở tình huống mới.

Ba trục hiện có không đo điều này:
- G (§2) đo bằng chứng sạch và luật chơi;
- T (§8) đo đủ thành phần;
- M (§10) đo độ hấp dẫn.

Trục H đi cặp với M theo "thước đo hai tầng" (§11.2 luật 7).

**Nguyên tắc chấm, rút từ sai lầm của trục T (§10.0):**
- **Neo vào kết quả đo trên người học, không neo vào "có tính năng".** Mốc 10 của mỗi tiêu chí là một con số đo được.
- **Chấm ở cấp cả app (danh mục game), không ép từng game.** Game chữ không luyện nói được; ép nó làm thế sẽ sinh ra câu hỏi gác cổng (§10.3 gốc rễ 2). Mỗi game chỉ khai mình phục vụ tiêu chí H nào.
- **Chưa có số liệu thì điểm tối đa là 6** và ghi "ước tính". Muốn vượt 6 phải có số đo.

### 12.1 Mười tiêu chí H1–H10

Điểm = trung bình có trọng số (÷ 12).

| # | Tiêu chí | 0–2 | 5 | 10 (phải đo được) |
|---|---|---|---|---|
| H1 ×2 | **Tự tạo ra tiếng Anh** (nói, viết) | Chỉ chạm, chọn, ghép thẻ | Gõ từ, điền chỗ trống, nhại lại | ≥ 30% lượt là tự nói/viết cả câu có nghĩa, có phản hồi về nội dung |
| H2 ×2 | **Dùng được ở tình huống mới** (transfer) | Không kiểm, hoặc kiểm lại đúng câu đã học | Câu mới nhưng cùng dạng bài | ≥ 70% đúng trên nhiệm vụ chưa gặp, ngữ cảnh khác, dạng khác |
| H3 | **Lượng nghe/đọc hiểu được** | Câu rời, < 10 phút/tuần | Đoạn ngắn có ngữ cảnh | ≥ 60 phút/tuần nội dung liền mạch, người học biết ~95% từ |
| H4 | **Nghe tiếng thật** | Một giọng máy, đọc chậm | Giọng tự nhiên, một tốc độ | Tốc độ tự nhiên, ≥ 2 giọng, có nối âm và tiếng ồn; đúng ≥ 70% |
| H5 | **Phản xạ** (tự động hoá) | Không giới hạn thời gian | Có đếm giờ | Độ trễ đáp giảm dần, đo được, tới mức hội thoại (≤ 3 giây) |
| H6 | **Nhớ lâu** | Không ôn lại | Có ôn cách quãng | Đo bằng kiểm tra trễ: nhớ ≥ 80% sau 30 ngày |
| H7 | **Sửa lỗi riêng người Việt** | Bài chung cho mọi người | Có bài âm cuối, trọng âm | Hồ sơ lỗi riêng từng người, lỗi giảm đo được |
| H8 | **Hội thoại có tương tác** | Không có | Chọn câu theo kịch bản | Nhiều lượt, tự tạo câu, phải hiểu để đáp, hoàn thành nhiệm vụ giao tiếp |
| H9 | **Đo tiến bộ trung thực** | XP, chuỗi ngày, % hoàn thành | Bài kiểm tra trong app | Đề chưa từng thấy, đối chiếu thi thật |
| H10 | **Dẫn ra đời thật** | Giữ người học trong app | Gợi ý nội dung ngoài | Nhiệm vụ ngoài đời mỗi tuần, có ghi âm hoặc tự báo cáo |

**Luật:**
- App được coi là "giúp giỏi thật" khi **H ≥ 7**, và không tiêu chí ×2 nào dưới 5.
- Game chủ lực cần **M ≥ 7**, và phải khai mình phục vụ ít nhất 2 tiêu chí H.
- Sản phẩm thành công khi **cả hai** đạt.

### 12.2 Đo bằng gì (dữ liệu app đã có hoặc cần thêm)

| Tiêu chí | Cách đo |
|---|---|
| H1 | Tỉ lệ lượt có câu tự nói (máy nghe giọng) hoặc tự gõ ≥ 4 từ trên tổng lượt, ghi theo tuần |
| H2 | Tỉ lệ đúng ở lượt transfer (F11) và trận cổng dùng đề chưa thấy |
| H3 | Số phút nghe/đọc bài liền mạch mỗi tuần; tỉ lệ từ đã vững trong bài |
| H4 | Tỉ lệ đúng ở bài nghe tốc độ thật, nhiều giọng, có tiếng ồn |
| H5 | Trung vị độ trễ trả lời ở phản xạ hội thoại, theo tuần |
| H6 | Kiểm tra trễ 7/30 ngày trên mẫu từ đã vững (FSRS ghi được kết quả) |
| H7 | Hồ sơ âm hay nhầm (26 cặp) và lỗi ngữ pháp lặp, so trước/sau |
| H8 | Số hội thoại nhiều lượt hoàn thành, có câu tự đặt khớp ý chính |
| H9 | Khoảng cách giữa cấp app ước tính và kết quả đề chưa thấy / thi thật |
| H10 | Số nhiệm vụ ngoài đời người học báo cáo đã làm (cần làm mới) |

### 12.3 Chấm thử ban đầu (ước tính, tối đa 6 vì chưa có số liệu)

| | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | **H** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| App học game hoá phổ biến (thể loại) | 3 | 3 | 3 | 4 | 2 | 5 | 1 | 4 | 3 | 1 | **≈ 2,9** |
| English Ladder, cả app (gồm tab học cũ) | 6 | 6 | 5 | 6 | 4 | 5 | 6 | 4 | 6 | 1 | **≈ 5,1** |
| Riêng 🎡 Vòng Chữ + ⛏️ Mỏ Chữ | 2 | 2 | 1 | 1 | 3 | 5 | 1 | 0 | 3 | 0 | **≈ 1,8** |

Căn cứ dòng English Ladder (theo README):
- luyện nói với máy nghe giọng, nói nhại, đóng vai tự đặt câu, chuyển ý Việt → Anh;
- bài nghe dài B1–C2, nghe nhiều giọng có tiếng ồn;
- 26 cặp âm, phản xạ hội thoại có đếm giờ;
- trận cổng dùng đề chưa thấy.

### 12.4 Phản biện, nói thẳng

- Phần giúp "giỏi thật" của app đang nằm ở **tab học kiểu cũ**, không nằm ở game chủ lực.
- Nếu đi game-first mà chỉ còn Vòng Chữ / Mỏ Chữ, H rơi xuống ≈ 1,8. Mức này còn thấp hơn app học game hoá phổ biến, tức là lặp lại đúng điều đã làm người sáng lập thất vọng.
- Hướng đúng:
  - Game chủ lực lo việc kéo người chơi quay lại (M).
  - Ngay sau hai game chủ lực, phải có ít nhất một game mà **cơ chế chính là nói hoặc hội thoại**. Game này nâng H1, H5, H8, dùng lại engine và 5.753 tệp âm thu sẵn.
  - Các chức năng luyện nói, nghe, viết ở tab cũ không được bỏ khi đổi sang game-first.
- H10 gần 0 ở mọi dòng. Không app nào thay được việc dùng tiếng Anh với người thật; app tốt chỉ dẫn người học tới đó.

## 13. Chiến lược game hoá để nâng trục H (v122–v127)

### 13.0 Sửa nhận định ở §12.4

Người sáng lập phản biện: kết luận "phần giúp giỏi thật nằm ở tab học cũ" sai ở gốc. Nó đánh đồng "game" với "game chữ". Mọi tiêu chí H đều làm được thành **cơ chế chơi**, miễn là động từ chính của game là một hành động ngôn ngữ thật: muốn thắng phải nói, phải hỏi, phải nghe ra.

Gốc rễ thật không phải thiếu công nghệ. App đã có:
- máy nghe giọng `asrStart` / `asrMatch` / `asrWord`, nghe tự do `asrHear`;
- bộ dò ý `ideaCheck` / `medCheck`;
- 24 hội thoại nhánh `CONV` có đo độ trễ nói (`CV_RT`, `cvMed`);
- 5.753 tệp âm, tiếng ồn `noiseOn`, `ACCENTS`;
- transfer `novel`, trận cổng, FSRS, hồ sơ 26 cặp âm.

Các phần này nằm rải ở tab học và ở game nhỏ, chưa phần nào là **lõi game** của Phố Chữ. Mà tiền đề của Phố Chữ lại đúng là "**cư dân mất tiếng nói**": nói để trả lại tiếng là cơ chế hợp với truyện nhất.

### 13.1 Nguyên tắc

1. **Động từ chơi là hành động ngôn ngữ.** Thắng nhờ nói đúng, hỏi đúng, nghe ra; không thắng nhờ chọn A/B/C.
2. **Một lớp nhập "Lời nói" dùng chung,** có bậc lùi mic → gõ → chọn (khi không có mic hoặc đang ở nơi công cộng). Bằng chứng ghi theo bậc: lượt chọn không tính vào H1.
3. **Hệ quả trong game là phản hồi.** Nói sai âm cuối thì nhân vật hiểu sai và làm sai việc, không hiện bảng "sai rồi".
4. **Đo trước rồi mới làm:** bảng đo H (v122) đi trước mọi game mới.

### 13.2 Bản đồ tiêu chí → cơ chế

| Tiêu chí | Cơ chế | Dùng lại |
|---|---|---|
| H1, H5, H8 | **Quán Phố Chữ bằng giọng** (phục vụ theo thời gian): khách kèm nhu cầu, người chơi nói để hỏi và đáp; thanh kiên nhẫn theo độ trễ, nới theo cấp; đúng ý thì khách nói lại được, sương tan | `CONV`, `cvMatch`, `ideaCheck`, `CV_RT`, `asrHear`, cảnh Quán |
| H2, H8 | **Thám tử hỏi chuyện** (khoảng trống thông tin): manh mối chỉ có khi tự đặt câu hỏi đúng; từ và cấu trúc cũ trong vụ án, nhân vật, bối cảnh mới | `CONV` nút `@any`, `transfer.ts`, `grammarHints` |
| H2 | **Từ đào được phải đem dùng:** từ tìm ở Mỏ Chữ / Vòng Chữ thành món cần giao, phải dùng trong câu với cư dân | `director.ts`, `story.ts` |
| H3 | **Đài Phố Chữ:** truyện kỳ nghe/đọc 3–8 phút làm phần thưởng chương; lựa chọn trong truyện chỉ đúng khi đã hiểu | `DIALOGUES`, bài dài, `tools/clips-*` |
| H4 | **Âm cảnh từng khu:** chợ ồn, bến có gió và còi; mỗi cư dân một giọng; tốc độ tăng theo khu | `noiseOn`, `clipPlay`, `ACCENTS` |
| H6 | **Sương quay lại:** biển hiệu của từ sắp quên mờ dần (FSRS); thắp lại là nhớ trễ 7/30 ngày | `retain.ts`, `town.ts` |
| H7 | **Bến Cảng lệnh giọng:** cặp âm tối thiểu (back/bag, ten/tent); thiếu âm cuối thì tàu làm sai; màn sinh từ hồ sơ âm hay nhầm | `asrWord`, `SOUNDS`, `startPdx`, `robot.ts` |
| H9 | **Trùm cuối khu = trận cổng** đề chưa thấy, thêm phần nói / hội thoại chưa gặp | `gate.ts`, `vxEvidence` |
| H10 | **Phố thật hằng tuần:** một nhiệm vụ ngoài đời, ghi âm hoặc tự báo cáo, đổi lấy trang trí phố | `HAS_REC`, `weekly.ts` |

### 13.3 Thứ tự và điểm mục tiêu

Thứ tự làm (mỗi bản có playtest M và đo H):
1. v122 bảng đo H;
2. v123 Quán bằng giọng;
3. v124 Sương quay lại + âm cảnh;
4. v125 Thám tử hỏi chuyện + từ đào phải đem dùng;
5. v126 Bến Cảng lệnh giọng;
6. v127 Đài Phố Chữ + Phố thật.

Điểm H tự chấm; con số trên 6 chỉ hợp lệ khi bảng đo cho số thật:

| | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | H |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hiện tại (cả app) | 6 | 6 | 5 | 6 | 4 | 5 | 6 | 4 | 6 | 1 | 5,1 |
| Mục tiêu sau v127 | 8 | 7 | 7 | 8 | 8 | 8 | 8 | 8 | 8 | 5 | **7,5** |

### 13.4 Giới hạn

- **Không có AI lúc chạy:** nói tự do chỉ chấm bằng dò ý theo từ khoá. Hội thoại phải có "ý cần nói" rõ ràng.
- **Máy nghe giọng của trình duyệt** không có ở mọi máy, và có máy cần mạng. Bậc lùi gõ phím giữ cho game chạy được nhưng H1 thấp hơn. Phải đo tỉ lệ người chơi có mic.
- **Nói dưới áp lực giờ dễ làm người mới sợ.** Ở A1 gần như không ép giờ.
- **H10 khó vượt 5–6** vì app không kiểm chứng được việc ngoài đời.
- **H3 tốn nhiều nội dung nhất;** âm thu sẵn mới tới B1.

### 13.5 Đã làm v122–v127 (chấm lại theo bản thật)

**Việc làm** (chi tiết từng bản ở `docs/SPEC.md`, lộ trình v122–v127):
- **v122 Bảng đo H** (`src/engine/hmeter.ts`): nhật ký số đo theo ngày, chấm 10 tiêu chí theo mốc §12.1. Màn "📏 Bảng đo H" ở sảnh và ở màn kết của game nói.
- **v123 🗣️ Quán Phố Chữ bằng giọng:** khách là hội thoại nhánh của app. Bạn nói (hoặc gõ) để hỏi và đáp; chọn câu chỉ là bậc lùi sau khi khách hỏi lại. Có thanh kiên nhẫn, tip khi đáp kịp, món đặc biệt dùng từ vừa đào được.
- **v124 🌫️ Sương quay lại + âm cảnh:** biển hiệu của từ sắp quên; nhớ lại là một lần ôn FSRS thật. Âm nền theo khu (từ A2).
- **v125 🔎 Hỏi chuyện nhân chứng:** 9 vụ A1–B1, manh mối chỉ có khi tự đặt câu hỏi.
- **v126 ⚓ Bến Cảng lệnh giọng:** cặp âm yếu nhất trước; nói thiếu âm cuối thì cẩu nhấc nhầm thùng.
- **v127 📻 Đài Phố Chữ + 🌍 Phố thật:** ghi phút nghe / đọc và nghe có âm phố; mỗi tuần một nhiệm vụ ngoài đời.

**Chấm H** (tự chấm theo khả năng của bản; điểm trên 6 chỉ hợp lệ khi Bảng đo H của người học thật cho số):

| | H1 | H2 | H3 | H4 | H5 | H6 | H7 | H8 | H9 | H10 | H |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Trước v122 (cả app) | 6 | 6 | 5 | 6 | 4 | 5 | 6 | 4 | 6 | 1 | 5,1 |
| Sau v127, khả năng của bản (chưa đo) | 8 | 7 | 6 | 7 | 8 | 8 | 7 | 8 | 8 | 5 | **7,3** |
| Hiển thị trong app khi chưa có số liệu | 6 | 6 | 5 | 6 | 5 | 6 | 6 | 5 | 6 | 4 | 5,6 |

**Phản biện, nói thẳng:**
- Những con số trên vẫn là **tôi tự chấm**. Bài học §10.0 vẫn đúng: chỉ người học thật và Bảng đo H mới xác nhận được.
- Ba chỗ yếu còn lại:
  - **H3:** nội dung nghe dài vẫn là bài sẵn có, chưa có truyện kỳ mới viết riêng cho Phố Chữ.
  - **H4:** âm nền là tổng hợp, chưa có giọng người thật khác nhau. Âm thu sẵn mới có hai giọng.
  - **H10:** nhiệm vụ ngoài đời chỉ tự báo cáo, không kiểm chứng được.
- Việc tiếp theo: người sáng lập chơi thử 4 game nói theo phiếu M (§10.1), rồi xem Bảng đo H sau 2–4 tuần dùng thật.

**Kiểm:**
- Unit test `engine-voice.test.ts` (mốc chấm, lưu / gộp, nhận câu hỏi, bộ não, Phố).
- e2e `voice.spec.ts` (4 game tới màn kết bằng gõ và bằng kết quả máy nghe giả lập, số đo H được ghi, ôn FSRS thật, WCAG AA).

## 14. Trục S: tiêu chí cốt truyện (v128)

### 14.0 Gốc rễ

Truyện "Phố Chữ mất tiếng" (v101) mới là một **khung nhiệm vụ**, chưa thành **câu chuyện**. Sương Câm chỉ là thời tiết, không có ai đứng sau và không ai hỏi vì sao. Cả 12 chương lặp một công thức. Tí không có chuyện riêng. Người chơi không được chọn gì. Truyện kết bằng "Còn tiếp".

Vì vậy truyện thiếu một xung đột có nhân vật và có ý nghĩa.

### 14.1 Mười tiêu chí (thang 10)

Các tiêu chí rút từ những game có truyện được khen và cùng thể loại với app:
- Homescapes / Royal Match: truyện nhẹ đi kèm game ghép 3;
- Duolingo: nhân vật, Duolingo Stories;
- Professor Layton, Ace Attorney: giải đố gắn với truyện;
- Spiritfarer, A Short Hike, Stardew Valley: truyện ấm áp, giàu cảm xúc;
- Undertale: cách chơi chính là thông điệp.

| # | Tiêu chí | Trọng số | 10 điểm trông như thế nào |
|---|---|---|---|
| S1 | Móc mở đầu (60 giây đầu) | 1 | Tiền đề rõ, có một hình ảnh mạnh, người chơi xong được việc đầu ngay |
| S2 | Câu hỏi lớn / bí ẩn | 1,5 | Mỗi chương hé một mảnh; giữa truyện có cú lật; cú lật cuối giải thích lại mọi thứ |
| S3 | Nhân vật có mong muốn và thay đổi | 1,5 | Nhân vật chính và vài nhân vật phụ có mạch riêng trọn vẹn |
| S4 | Nhịp và độ đa dạng | 1 | Mỗi khu một kiểu; chương nào cũng có câu móc |
| S5 | Truyện khớp với cách chơi | 1,5 | Mỗi hành động chơi có lý do trong truyện |
| S6 | Người chơi được chọn, lựa chọn có hệ quả | 1 | Lựa chọn đổi cả kết cục |
| S7 | Chủ đề và cảm xúc | 1 | Chủ đề là chuyện của chính người chơi; có lúc chạm cảm xúc |
| S8 | Thế giới và bản sắc | 0,5 | Giọng văn và hình ảnh riêng, nhìn là nhận ra |
| S9 | Cao trào và kết | 1 | Có kết thúc, mọi manh mối được trả |
| S10 | Truyện phục vụ việc học | 1,5 | Tiếng Anh khó dần theo khu; phải nói hoặc hiểu mới đi tiếp |

### 14.2 Đã làm v128

| Phần | Làm gì | Tiêu chí |
|---|---|---|
| Bí ẩn | Sương Câm là **Mờ**, một bạn nhỏ từng nói "I love rice" mà nghe thành "lice" và bị cả lớp cười; Tí cười to nhất. Mờ thôi nói; im lặng lớn thành sương nuốt lời cả phố "để không ai bị cười nữa". Mỗi chương để lại **một kỷ vật** (17 món): câu xoá dở trên tường, trang vở gạch đỏ, vé một chiều ký "M", nhật ký của Mờ… | S2, S7 |
| Cú lật | Cuối khu Bến Cảng, Tí thú nhận Mờ là bạn cũ và mình đã cười Mờ | S2, S3 |
| Mạch nhân vật | **Tí:** từ né tránh, thú nhận, đến xin lỗi.<br>**Bé Bin:** từ "cháu sợ nói", đọc biển, rồi nói sai trước đám đông ("I goed") và không ai cười.<br>**Mờ:** từ "đừng cười tớ" đến "I… love… rice!" | S3 |
| Khu 4 Phố Đêm | Nơi ai cũng thì thầm vì sợ sai; thêm 2 cư dân (Chị Hằng, Anh Khoa) và hình SVG riêng (trăng, dây đèn lồng) | S4, S8 |
| Trận cuối | Không đánh nhau mà là một **cuộc nói chuyện**. Câu then chốt do người chơi tự nói: *"I make mistakes too. Everyone does. It's OK."* Cần 14 kỹ năng vững. Trận cổng của mục tiêu (v115, "khu cuối") giờ nằm ở chương cuối Phố Đêm; Rừng Trúc giữ điều kiện 9 kỹ năng vững. Người đã xong 3 khu (bản cũ "Còn tiếp") đi tiếp thẳng vào Phố Đêm | S7, S9 |
| Lựa chọn | 3 cờ: f1 kể sự thật hay giữ bí mật; f2 rung chuông to hay khẽ; f3 quà cho Mờ (vở / bài hát / hoa). Mỗi phương án có lời thoại riêng về sau và ở cảnh kết. Bấm "Bỏ qua" thì chọn sẵn phương án đầu | S6 |
| Câu bạn nói | Chương nào cũng có một khung "Đến lượt bạn": nói (máy nghe) hoặc gõ câu trả lời cho cư dân. Câu khớp khi đủ khoảng 75% từ (`sayOk`). Không bắt buộc (luôn có nút Bỏ qua). Câu khớp và dài từ 3 từ trở lên được ghi vào nhật ký H | S10, H1 |
| Tiếng Anh lớn dần | Trần số từ mỗi câu theo khu: 10 / 10 / 12 / 14 / 16 (test kiểm). Câu thoại ở Phố Đêm đã ở mức A2–B1 | S10 |
| Mỗi khu một game nói | Nhiệm vụ "trả câu nói" chỉ sang: Bài Câu (Chợ), Quán nói (Bến Cảng), Hỏi chuyện (Rừng Trúc), Quán nói (Phố Đêm) | S4, S5 |
| Kết có hậu và nối với game | Sương tan, chỉ còn "sương sớm" quay lại mỗi khi ta quên một từ. Như vậy 🌫️ Sương quay lại có lý do trong truyện. Câu cuối dẫn ra 🌍 Phố thật: *"Now go outside. Say hello to someone real!"* | S5, S9, H10 |

### 14.3 Chấm (tự chấm)

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | **S** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| v101–v127 | 5 | 2 | 3 | 3 | 6 | 1 | 4 | 5 | 2 | 5 | **3,6** |
| v128 | 7 | 8 | 7 | 7 | 8 | 5 | 8 | 6 | 8 | 8 | **7,3** |
| Mốc so sánh (ước lượng) | Homescapes ≈ 5 · Duolingo (phần truyện) ≈ 5,5 · Layton ≈ 8 · Undertale ≈ 9,5 | | | | | | | | | | |

**Phản biện, nói thẳng:**
- **S6 dừng ở 5:** lựa chọn mới đổi lời thoại và người đứng cạnh ở cảnh kết, chưa đổi kết cục. Muốn lên 8 cần các kết thật sự khác nhau, tức là gấp đôi nội dung.
- **S8 dừng ở 6:** nhân vật vẫn là emoji (M4). Muốn lên 8 cần tranh nhân vật và tranh cho từng chương.
- **S1:** móc mở đầu vẫn là chữ. Một cảnh động khi Sương nuốt biển hiệu sẽ mạnh hơn.
- Các số trên là tôi tự chấm. Chỉ đo được bằng người chơi thật: tỉ lệ quay lại sau chương 1, tỉ lệ xem hết cảnh và tỉ lệ người chơi tự nói ở khung "Đến lượt bạn".

**Kiểm:**
- Unit `engine-story` (10): 4 khu × 4 chương; trần số từ theo khu, kể cả các phương án chọn; chương nào cũng có kỷ vật và câu tự nói; đủ 3 lựa chọn; cảnh kết đổi theo lựa chọn; `choose`, `settle`, lưu / gộp cờ; `sayOk`; mỗi khu dẫn sang một game nói riêng.
- e2e `bag.spec` (truyện):
  - gõ câu ở khung "Đến lượt bạn" thì nhật ký H tăng;
  - chọn "giữ bí mật" thì cờ được lưu;
  - thẻ truyện hiện kỷ vật;
  - đạt WCAG AA.

## 15. Túi chữ · Xưởng của Tí · Chỉ số thật (v128)

### 15.0 Yêu cầu và phản biện

**Yêu cầu của người sáng lập:** hướng có kho đồ, thu thập, chế tạo, nâng chỉ số.

**Bẫy cần tránh:** mô hình Prodigy Math, tức "trả lời câu hỏi để được đánh quái". Khi đó câu hỏi chỉ là trạm thu phí, người chơi tìm cách vượt nhanh nhất. Cụ thể có bốn rủi ro:
- cày đồ ở màn dễ;
- chỉ số giả (mạnh lên nhờ đồ đeo);
- đồ trợ giúp làm sai bằng chứng;
- trả tiền để mạnh.

Gốc rễ chung của cả bốn: **phần thưởng không gắn với hành động ngôn ngữ thật.**

### 15.1 Bảy luật nền (`bag.ts`)

1. **Đồ là đơn vị ngôn ngữ:**
   - nguyên liệu: ✨ viên chữ, ✍️ mực, 🗣️ lời nói, 🧠 ký ức;
   - 💎 ngọc từ;
   - đồ làm ra: 🔩 từ ghép, 🔗 cụm từ, 💬 Lời, 🌟 Lời vàng.
2. **Chế tạo là hành động ngôn ngữ:**
   - **Ghép từ:** chọn đúng tiền tố / hậu tố, rồi tự gõ từ mới đúng chính tả;
   - **Ghép cụm:** chọn đúng động từ (make / do / take…);
   - **Đúc câu:** xếp lá chữ thành câu của cư dân;
   - **Thổi hồn:** nói câu đó, hoặc gõ lại không nhìn, để có 🌟 Lời vàng.
3. **Chỉ số nhân vật là năng lực thật.** Có 7 chỉ số:

   | Chỉ số | Lấy từ |
   |---|---|
   | 📚 Từ vựng | Số nút `u:` vững |
   | 🧩 Ngữ pháp | Số nút `g:` vững |
   | 🔤 Phát âm | Số nút `ph:` vững + H7 |
   | 🗣️ Nói | H1, H5, H8 |
   | 👂 Nghe | H3, H4 |
   | 🧠 Trí nhớ | H6 |
   | 🌍 Dùng thật | Số nút `fn:` vững + H2, H10 |

   Chỉ dùng dòng H **đã đủ số liệu**, không dùng ước tính. Không mua được, không đeo đồ mà tăng. Quên thì có thể tụt.
4. **Trang bị chỉ đổi game:** thêm lượt Mỏ Chữ, thanh kiên nhẫn ở Quán, xu. Trang bị không đổi cách chấm và không chạm bằng chứng. Thời gian nghĩ ghi vào H5 vẫn là thời gian thật. Trang bị **chỉ phát huy khi chỉ số thật đủ**, ví dụ Cuốc Bạc cần 📚 Lv 2.
5. **Nguyên liệu suy ra từ việc học đã có**, không lưu thêm số kiếm được:

   | Nguyên liệu | Lấy từ |
   |---|---|
   | ✨ Viên chữ | Từ tìm được ở Mỏ Chữ / Vòng Chữ, cộng 10 viên quà của Tí |
   | 🗣️ Lời nói / ✍️ Mực | Lượt tự nói / tự gõ cả câu (nhật ký H) |
   | 🧠 Ký ức | Lần nhớ lại sau ≥ 7 ngày + biển hiệu thắp lại |

   Đồ cao cấp cần 🗣️ / 🧠, nên muốn có đồ xịn thì phải nói và phải nhớ lâu.
6. **Không phạt:**
   - làm sai không mất nguyên liệu (chỉ trả khi làm đúng);
   - ngọc của từ sắp quên chỉ **mờ đi**, có lối thắp lại ở 🌫️ Sương quay lại.
7. **Không bán bằng tiền.**

### 15.2 Bốn phần

| Phần | Có gì | Tệp |
|---|---|---|
| 🎒 Túi | **Nguyên liệu và đồ đã làm.**<br>**Ngọc từ:** độ hiếm là độ nhớ thật: ⚪ đúng 1 ngày; 🟢 ≥ 2 ngày; 🔵 ≥ 3 ngày cách nhau ≥ 7 ngày; 🟣 ≥ 4 ngày cách nhau ≥ 30 ngày, hoặc hoa 🌸 trong Vườn từ đã ≥ 21 ngày.<br>**Trang bị:** hiện đang phát huy hay "cần ôn".<br>**Tặng Lời:** tặng cư dân của chương (việc phụ thứ ba của truyện, +10 xu) | `bag.ts` `gemsOf`, `bagview.ts` |
| 📖 Album, 📜 Kỷ vật | **Album:** mỗi cụm từ (unit) là một album, đủ 50% được ⭐ (+10 xu), đủ 100% được 🏆 (+40 xu), mỗi mốc nhận một lần. Album thực chất là bản đồ độ phủ từ vựng.<br>**Kỷ vật:** 17 mảnh bí ẩn của truyện | `albumsOf`, `cluesOf` |
| 🔨 Xưởng của Tí | **Nội dung:** 37 từ ghép, 32 cụm, 32 câu. Linh kiện mở dần theo khu truyện: Chợ có -er, -y, un-; Bến Cảng thêm -ful, -less, -ly; Rừng Trúc thêm re-, -ness, dis-; Phố Đêm thêm -ment, -ship, im-.<br>**Đúc câu** ưu tiên câu của cư dân đang cần giúp, và tính là "trả câu nói" của truyện.<br>**Rèn 5 trang bị:** ⛏️ Cuốc Bạc, 🫖 Ấm Trà Kiên Nhẫn, 🔔 Chuông Đồng, 🏮 Đèn Lồng Phố Đêm, 💎 Cuốc Kim Cương | `morphTask`, `colTask`, `sentTask`, `GEAR` |
| 📊 Chỉ số | 7 chỉ số Lv 0–10, mỗi chỉ số có nút "Nâng ở…" dẫn vào đúng game (Vườn từ, Bài Câu, Bến Cảng, Quán, Đài, Sương quay lại, Hỏi chuyện). Cấp Thợ Chữ = tổng chỉ số ÷ 3 + 1 | `statsOf`, `charLv` |

**Lưu:** `st.e.bg` lưu nguyên liệu đã tiêu, đồ, trang bị, album đã nhận và từ đã ghép. Gộp hai máy lấy giá trị lớn hơn và hợp các danh sách.

**Nối vào app (`bagctl.ts`, `main.ts`):**
- thẻ ở sảnh, ngay dưới thẻ truyện;
- hiệu ứng trang bị: số lượt Mỏ Chữ, `pm` của Quán, xu của game nói và xu thắng Vòng Chữ;
- mọi hành động ngoài Túi chữ đều đóng Túi chữ.

### 15.3 Chấm (tự chấm)

| Trục | Trước | Sau | Vì sao |
|---|---|---|---|
| M8 meta / phần thưởng (sảnh) | 5 | 8 | Kho đồ, sưu tập, chế tạo, trang bị; phần thưởng là tiếng Anh |
| M10 lý do quay lại | 6 | 7 | Ngọc mờ đi khi sắp quên, album còn trống, trang bị chờ đủ chỉ số |
| T5 thế giới chung lớn dần | 7 | 8 | Túi và Thợ Chữ đi xuyên mọi game |
| H1 tự nói / tự viết | 8 | 8,5 | Thêm lượt tự nói ở cảnh truyện và lúc thổi hồn ở Xưởng |
| H6 nhớ lâu | 8 | 8,5 | Ngọc mờ là lời nhắc nhìn thấy được; 🧠 Ký ức thành nguyên liệu quý |

**Phản biện, nói thẳng:**
- **Lạm phát ✨ khi cày màn dễ.** Viên chữ đến từ số từ tìm được, nên chơi lại màn dễ vẫn ra ✨. Giới hạn: ✨ chỉ đủ cho đồ thường; trang bị cần đồ làm ra cộng 🗣️ / 🧠, và chỉ phát huy khi chỉ số thật đủ. Cày ✨ không làm ai "mạnh" lên. Cần bot giả lập (`npm run sim`) đo tỉ lệ ✨ / phút theo màn để xác nhận.
- **Chỉ số có thể tụt:** nút đang vững mà bằng chứng mới mâu thuẫn thì chỉ số giảm. Đây là cố ý, nhưng có thể làm người chơi hụt hẫng. Đổi lại, chỉ số là thật.
- **Người không có micro** vẫn có 🌟 Lời vàng (gõ lại không nhìn), nhưng không có 🗣️ nên không rèn được Ấm Trà / Chuông Đồng. Đây là đánh đổi có chủ ý (nói là mục tiêu H1).

**Kiểm:**
- Unit `engine-bag` (6): nội dung hợp lệ; nguyên liệu suy ra và trả; độ hiếm ngọc; album; chỉ số thật (dòng H chưa đo thì Lv 0); chế tạo; lưu / gộp.
- e2e `bag.spec`:
  - ghép từ → ghép cụm (chọn sai không mất gì) → đúc câu → 🌟 Lời vàng;
  - tặng Bà Lan +10 xu một lần;
  - rèn Cuốc Bạc;
  - 5 tab đạt WCAG AA ở 390 px;
  - không cuộn ngang.

## 16. Lò rèn năng lực và Bản đồ phủ cấp (v129)

### 16.0 Yêu cầu và phản biện

**Ý của người sáng lập:** muốn đạt một cấp thì cần nhiều bằng chứng. Vậy dùng cách chế tạo bằng chứng từ nhỏ tới lớn, để app biết người học đã phủ kiến thức tới đâu.

**Engine đã có thang đó.** Mỗi kỹ năng (761 nút) được đo ở 5 mức: Nhận ra → Hiểu → Nhớ ra → Dùng có kiểm soát → Dùng tự do. Luật "đạt" đã chặt:
- trừ phần đoán mò;
- câu lặp trong 24 giờ chỉ tính nửa;
- bằng chứng mức cao tính cho mức thấp;
- m ≥ 0,8 và cận dưới ≥ 0,6;
- mức 4–5 phải đúng ở câu chưa gặp.

**Gốc rễ thật:**
1. Xưởng v128 không gắn vào nút nào của bản đồ, nên dù ghi bằng chứng cũng không biết tính cho kỹ năng nào.
2. Bộ đề cố định 101 món thì học thuộc được.
3. Người học không nhìn thấy độ phủ.

**Hai chỗ chỉnh lại ý ban đầu:**
- "Từ nhỏ tới lớn" đúng khi **học** kỹ năng mới. Khi **đo** người đã biết thì nên thử bậc cao trước.
- Thước đo là **độ đa dạng** (dạng câu, ngữ cảnh, câu mới, cách ngày), không phải số lượng bằng chứng.

Người sáng lập chọn phương án B: giữ ghép từ / ghép cụm / đúc câu của v128 làm "🔨 Luyện tay", ghi rõ là không tính bằng chứng.

### 16.1 Đã làm (`forge.ts`, `forgeview.ts`, `forgectl.ts`)

| Phần | Làm gì |
|---|---|
| Mỗi kỹ năng là một món 5 bậc | 🪨 Mảnh, 🔩 Phôi, ⚙️ Linh kiện, 🛠️ Đồ, 💎 Báu vật, ứng với mức 1–5. **Bậc = mức cao nhất đang Đạt trong engine** (`tierOf`), không có kho riêng. |
| Đề lấy từ nội dung của nút | Nguồn: câu dò `probe` (mức 1–3), câu xếp lá `order` (có lá thừa là lỗi hay gặp), câu sửa lỗi `fixes` (mức 4), câu chức năng `fn`, câu ở ngữ cảnh mới chưa gặp (`xferItems`, được ưu tiên ở mức cao). Không có bộ đề riêng nên không học thuộc được. |
| Bằng chứng thật | Đi qua `ingest` với `ctx: 'forge'`, `src: 'game'`, giữ nguyên đoán mò `g` và mã câu. Luật lặp lại, câu mới, xác minh mức 4–5, lan xuống của engine **giữ nguyên**. Nhãn `ctx` chỉ góp vào độ tin cậy "cao" (≥ 3 ngữ cảnh), không vào quyết định Đạt; mỗi game vốn có nhãn riêng. |
| 🔨 Rèn từ dưới | Bắt đầu ở bậc hiện tại + 1; đúng 2 câu liền thì lên mức. Món mới tinh thì có bí kíp 1 phút trước (`micro`). |
| ⚡ Rèn vượt bậc | Bắt đầu ở mức mục tiêu cần; đúng thì giữ / lên (bậc dưới được tính theo luật lan xuống); sai thì lùi một mức, không mất gì. |
| Chọn món | Danh sách kỹ năng đang mở của mục tiêu theo thứ tự ưu tiên của engine (`computePath().open`), bỏ món đã Đạt. Người chơi không cày được món mình đã giỏi. |
| Chặn cày | Mỗi kỹ năng tối đa **5 lượt có tính mỗi ngày**, bằng mức trần của Leo tháp cho người đang đúng nhiều. Mỗi lần rèn 5 câu. |
| 🗺️ Bản đồ phủ cấp | Đọc thẳng `computePath().all` (mọi kỹ năng mục tiêu cần, đã đóng tiền đề), nhóm theo Từ vựng / Ngữ pháp / Chức năng / Âm / Can-Do. Mỗi ô có bậc hiện tại, mức cần và nút ⚡ rèn. Dòng tổng: "Đã phủ x/y", và "Chưa đạt A2 vì còn thiếu: …" (spec §61). |
| Thưởng | +2 xu mỗi câu đúng, +10 xu mỗi lần lên bậc. Xu không vào năng lực. |
| Sảnh | Thẻ Túi chữ: nút chính là 🔥 Lò rèn năng lực, kèm 🗺️ "Đã phủ x/y". |

### 16.2 Kiểm

- **Unit `engine-forge` (5):**
  - chuẩn hoá đề giữ mức và đoán mò;
  - chấm chọn / gõ / xếp lá / sửa câu;
  - bậc = mức cao nhất Đạt;
  - chọn câu (đúng mức, mức dưới, tránh câu vừa gặp, ưu tiên câu lạ ở mức cao);
  - hai cách rèn;
  - bản đồ phủ.
- **e2e `bag.spec` (v129):**
  - rèn vượt bậc trên mục tiêu A1 đến hết lượt; mỗi câu đúng ghi đúng một sự kiện `ctx: 'forge'`, `src: 'game'`;
  - Bản đồ phủ hiện "Đã phủ x/y";
  - Luyện tay không thêm sự kiện nào vào sổ;
  - WCAG AA ở 390 px, không cuộn ngang.

### 16.3 Phản biện, nói thẳng

- **💎 Báu vật (mức 5) hầu như không rèn được ở Lò**, vì kho câu chỉ tới mức 4. Mức 5 đến từ việc dùng tự do (nói ở Quán, viết Thư, trận cổng). Đây là đúng bản chất mức 5, không phải lỗi.
- **Kỹ năng Can-Do / đọc / nghe / viết / nói** (khoảng 1/3 yêu cầu của một cấp) hiện trên bản đồ nhưng không rèn ở Lò: chúng đo bằng bài làm thật.
- Lò rèn là **một đường mới đưa bằng chứng vào sổ**. Cần theo dõi chỉ số H9 (cấp app ước tính so với trận cổng / thi thật) sau 2–4 tuần. Nếu người chỉ rèn ở Lò mà qua cổng kém hơn người chơi đủ các game, thì phải hạ trọng số hoặc giới hạn của Lò.

## 17. Bản đồ Phố Chữ toàn cảnh (v130)

### 17.0 Yêu cầu và phản biện

**Yêu cầu:** "Game trên app phức tạp, muốn thiết kế dạng bản đồ toàn cảnh liên kết."

**Phản biện, tìm gốc rễ:**
- Gốc rễ không phải ở chỗ thiếu bản đồ. Gốc rễ là mỗi bản lại xếp thêm một hệ thống vào cùng một sảnh dọc (dàn trải, §10.3 / §11.1):
  - Cùng một game mở được từ khoảng 8 lối vào: Chơi tiếp, 3 đèn lồng, thẻ truyện, thẻ hero, 13 thẻ kỹ năng, 21 công trình phố, Thư viện → Tất cả trò chơi, tab Thử thách.
  - Có khoảng 10 thước đo song song: xu, sao phố, cấp Vòng / Mỏ, chương truyện, đèn lồng, kỹ năng vững, Túi, Lò rèn, XP.
  - Có 3 "bản đồ" rời nhau: sương mù, bản đồ phủ, bản đồ CEFR.
- Nếu chỉ **thêm** một bản đồ thì nó thành lối vào thứ 9 và còn rối hơn. Bản đồ chỉ giải được gốc rễ khi nó **thay** sảnh, mục "Tự chọn", thẻ phố, thẻ truyện và tab Thử thách, đồng thời gom tiến độ về một thứ thấy được.
- Bài học theo chủ đề, Kỹ năng và Sổ từ là bài học chứ không phải game, nên vẫn ở Thư viện.
- Logic học không đổi: bộ não `planDay` / `nextGame`, bằng chứng và mức thuộc giữ nguyên. Bản đồ chỉ là lớp trình bày và điều hướng.

Người sáng lập đã chốt: bản đồ thay **mọi** lối vào game, kiểu **2D kéo / thu phóng**, hiện **đủ 21 game**.

### 17.1 Đã làm (`worldmap.ts`, `worldview.ts`, `mappan.ts`)

**Thế giới 5 khu** theo `ACTS` của truyện: Quảng trường → Chợ Sáng → Bến Cảng → Rừng Trúc → Phố Đêm, nối nhau bằng đường truyện. Mỗi game ở đúng một khu:

| Khu | Công trình |
|---|---|
| Quảng trường | 🎡 Vòng đu quay, ⛏️ Mỏ chữ, 🗺️ Cổng bản đồ, 🏰 Tháp canh, 🕰️ Tháp đồng hồ, 🏟️ Đấu trường, 🎒 Xưởng của Tí, 📋 Bảng tin phố |
| Chợ Sáng | 🌷 Vườn hoa, ☕ Quán cà phê, 🍜 Quán Phố Chữ, 🏮 Dãy biển hiệu, 🏤 Bưu điện |
| Bến Cảng | ⚓ Cần cẩu, 🏭 Xưởng, 🏗️ Công trường, 📡 Đài |
| Rừng Trúc | 🫧 Hồ bong bóng, 🔎 Đồn hỏi chuyện, 🕵️ Thám tử, 🤖 Trạm robot |
| Phố Đêm | 🎪 Sân khấu, 🃏 Câu lạc bộ bài, 🏘️ Khu nhà |

**Trên bản đồ:**
- **Sương** phủ các khu truyện chưa tới. Sương chỉ để trang trí và **không khoá** game nào (P13, P14): bấm công trình trong sương vẫn chơi được.
- **📍 Bạn ở đây** là công trình "Truyện Phố Chữ", đặt ở khu của chương đang mở.
- **Lộ trình hôm nay:** 3 chặng của bộ não được nối bằng vạch vàng. Mỗi chặng có số đèn trên công trình, game chơi tiếp thì nhấp nháy.
- **Một thước đo phố:** "Phố hồi sinh N/5 khu · ★ sao phố". Các thước đo riêng (cấp Vòng, xu, Túi…) chỉ hiện trong bảng của công trình đó.
- **Chạm công trình** mở bảng dưới bản đồ: tên, ★ và mốc kế, mô tả một dòng, chặng lộ trình, ▶ Chơi, rồi phần riêng của công trình:
  - Vòng / Mỏ / Bài Câu: thẻ hero.
  - Quán Phố Chữ: Bảng đo H.
  - Tháp canh: Leo tháp.
  - Xưởng của Tí: Túi chữ, Lò rèn.
  - Bảng tin: sự kiện tuần, trang trí, số liệu chơi.
  - Truyện: thẻ chương.
  - Đấu trường: mở màn thử thách cũ của app.

**Đầu màn** dùng lại khung cảnh v118: nơi đang ở, Tí, **một** nút "▶ Chơi tiếp", liên kết xem cảnh truyện, thước đo phố, 3 đèn lồng, thẻ 🎯 mục tiêu. Luật màn đầu "một việc chính" (v117) giữ nguyên, và test clarity vẫn chạy như cũ.

**Kéo / thu phóng:**
- Viết bằng vanilla pointer events, không thêm thư viện: một ngón kéo, hai ngón chụm, con lăn, nút ＋ / － / ⌂.
- Kẹp biên và giới hạn độ phóng 0,35–2,5.
- Kéo quá 6 px thì không tính là chạm.
- Camera nhớ ở `localStorage['el-map-cam']`, chỉ là tiện ích của máy này, không vào `st.e`.

**Truy cập:**
- Công trình là `<button>` thật, xếp theo thứ tự khu.
- Tab tới công trình nằm ngoài khung thì camera kéo tới đó; phím mũi tên kéo bản đồ khi đang ở khung.
- Chế độ **☰ Danh sách** mở sẵn bảng của mọi công trình theo khu, dành cho trình đọc màn hình hoặc khi không muốn kéo.
- Tôn trọng `prefers-reduced-motion`.

**Thư viện và điều hướng:**
- Thư viện bỏ "Tất cả trò chơi" và "Thử thách", thay bằng một dòng "Bản đồ Phố Chữ".
- Đấu trường (`games`) thuộc tab Hôm nay.
- Bấm tab Hôm nay luôn về bản đồ: đóng bảng, thôi chế độ danh sách.
- Mọi nút "Về sảnh" đổi thành "Về bản đồ".

### 17.2 Kiểm

- **Unit** `engine-worldmap.test.ts`:
  - Mỗi game đúng một công trình; khu không chồng nhau; công trình nằm trong khu và không đè chữ (ở cả 5 vị trí ghim truyện).
  - Sương không khoá game; ★ khớp `town()`; lộ trình 3 chặng; hàm thuần, không đổi bản lưu.
  - Kẹp camera.
- **E2E** `worldmap.spec.ts`:
  - Kéo / phóng đổi camera; chạm ngay sau khi kéo không mở bảng; camera giữ qua lần vẽ lại.
  - Tab đưa camera theo, Enter mở bảng, ▶ Chơi vào đúng game.
  - Đấu trường đi và về bản đồ.
  - WCAG AA sáng / tối ở 390 px cho cả bản đồ, bảng và danh sách.
- Các spec cũ chuyển bộ chọn từ sảnh / phố sang bản đồ hoặc danh sách: `town`, `clarity`, `director`, `goalbar`, `v91`, `fixtures.toLobby`. Ý định kiểm giữ nguyên.

### 17.3 Phản biện, nói thẳng

- **Trên điện thoại, màn đầu vẫn là khung "Chơi tiếp", bản đồ nằm ngay dưới** (lộ ra khoảng 1/5 ở khung nhìn đầu). Đây là cố ý: luật v117 "một việc chính" và giới hạn chiều cao màn đầu được giữ. Nếu số liệu cho thấy người học không cuộn xuống bản đồ, hướng sửa là thu gọn đèn lồng thành một dòng, không phải bỏ nút Chơi tiếp.
- **2D kéo / thu phóng khó dùng một tay hơn danh sách.** Chế độ danh sách là lối thay thế đầy đủ. Cần đo §8.3: nếu phần lớn lượt vào game vẫn đi từ "Chơi tiếp" chứ không từ bản đồ, thì bản đồ đang làm đúng vai "thế giới để nhìn thấy tiến độ", không phải menu.
- **21 game vẫn là 21 game.** Bản đồ gom lối vào, không giảm số game. Luật §11.2 (làm sâu 3 game chủ lực, chọn game yếu theo số liệu để gộp / ẩn) vẫn đúng và vẫn cần làm.


## 18. Trục G: đối chiếu Gunny (v131)

### 18.0 Yêu cầu và phản biện

**Yêu cầu:** "Dựa vào game Gunny, đưa ra các tiêu chí đánh giá trên thang điểm 10 với app về các phần có liên quan."

Gunny là game bắn súng theo lượt: ngắm góc, chọn lực, tính gió, địa hình bị phá, đấu 1v1–4v4, phó bản, cường hoá trang bị, hội, kết hôn.

**Phản biện trước khi chấm:**
- **Mốc 10 = Gunny làm tốt nhất ở từng hệ thống, không phải "app phải thành Gunny".** Đây là app học tiếng Anh.
  - Kỹ năng của Gunny là vật lý (góc, lực, gió).
  - Kỹ năng của app phải là tiếng Anh. Luật HG24 đã ghi: thao tác không phải tiếng Anh trong vòng chơi là sai.
  - Vì vậy không chép cơ chế ngắm bắn. Chỉ chép những gì làm Gunny giữ chân người chơi: đánh với người thật, đồng đội, nhịp trận ngắn, tiến triển thấy được.
- **Không chép phần độc hại của Gunny:**
  - Nạp tiền mạnh mới thắng (VIP, lực chiến mua bằng tiền).
  - Quay thưởng (gacha).
  - Cường hoá thất bại thì mất đồ.
  - Ba thứ này trái P13 (điểm game không vào năng lực), trái lời hứa "không quảng cáo, không ép", và gây hại cho người học.
- **Điểm dưới đây là tự chấm khi đọc code, chưa đo trên người dùng.** Cần đối chiếu với số liệu chơi (§8.3) sau 2–4 tuần.

### 18.1 Mười tiêu chí và điểm (tự chấm v131)

| # | Tiêu chí (hệ thống của Gunny) | Gunny làm gì (mốc 10) | App hiện có | Điểm |
|---|---|---|---|---|
| G1 | **Vòng chơi lõi có kỹ năng** | Mỗi lượt: góc + lực + gió, thấy quỹ đạo, trượt hay trúng đều do tay mình; người giỏi thắng rõ. | Vòng Chữ, Mỏ Chữ, Bài Câu, Quán nói: hành động chính là tiếng Anh (vuốt từ, xếp câu, nói). Phần lớn game kỹ năng vẫn là "chọn đáp án", ít biến số mỗi lượt (không có thứ như "gió"). | **5** |
| G2 | **Đấu với người thật theo lượt** | Phòng 1v1–4v4, ghép trận theo trình độ, trận 3–5 phút. | Không có đấu trực tiếp. "Thách đấu bạn bè" là gửi mã 10 câu để so điểm, không đánh qua lại. Giải đấu tuần chỉ đua XP. | **2** |
| G3 | **Đồng đội và xã hội** | Hội, bạn bè, chat, kết hôn, nhiệm vụ hội; chơi vì bạn bè. | Chỉ có "Công cụ lớp học" cho giáo viên (gộp file thủ công). Không có bạn bè, nhóm hay hội trong app. | **1,5** |
| G4 | **Phó bản và boss** | Phó bản theo cấp, boss có cơ chế riêng, khó dần, phần thưởng theo ải. | Leo tháp có boss và hồi tim; Mỏ Chữ có màn băng, màn rương; truyện 4 khu, mỗi khu kết bằng trận cổng; bản đồ 5 khu (v130). Boss chủ yếu là "câu khó hơn", chưa có cơ chế riêng. | **6** |
| G5 | **Tiến triển nhân vật** (trang bị, cường hoá, khảm ngọc, lực chiến) | Đồ có cấp, ngọc, chỉ số; thấy rõ mình mạnh lên. | Túi chữ, Lò rèn, 7 chỉ số thật Lv 1–10 gắn với kỹ năng thật (hay hơn Gunny vì không mua được). Nhưng chỉ có 5 món trang bị, hiệu ứng nhỏ, và nhân vật người chơi không hiện hình. | **6** |
| G6 | **Nhịp trận và phản hồi tức thì** | Quỹ đạo, nổ, đất vỡ, số sát thương bay, rung màn; trận ngắn. | Sân khấu toàn màn, nổ hạt, nảy, rung (v102–v109); ván 3–5 phút; âm thanh. Thiếu "số bay" và cảm giác có đối thủ trên màn. | **6,5** |
| G7 | **Nhiệm vụ ngày, quà đăng nhập, sự kiện** | Nhiệm vụ ngày, điểm danh, sự kiện theo mùa. | Lộ trình 3 đèn, sự kiện tuần, Kho báu ẩn, chuỗi ngày, nhắc học. Cố ý không dùng "sợ mất" (đúng). | **7,5** |
| G8 | **Bản sắc và nhân vật** | Nhân vật chibi, vũ khí riêng, trượt cũng vui, cộng đồng nhận ra ngay. | Tí, cốt truyện Phố Chữ (Mờ, cú lật, 3 lựa chọn), bản đồ phố. Người chơi chưa có nhân vật của mình. | **6** |
| G9 | **Xếp hạng và danh vọng** | Hạng theo kỹ năng thắng thua, lực chiến, danh hiệu. | Giải đấu 5 hạng Đồng → Kim cương, nhóm 30 người, nhưng xếp theo XP (chăm chỉ), không theo thắng thua. Chưa có danh hiệu. | **5** |
| G10 | **Cá nhân hoá và kinh tế** | Thời trang, thú cưng, tiền trong game có nhiều chỗ tiêu. | Tủ đồ của Tí, trang trí phố bằng xu, không nạp tiền (đúng). Người chơi không có hình đại diện riêng, xu ít chỗ tiêu. | **4,5** |

**Trung bình: 5,0 / 10.**
- Mạnh: G7 (nhịp ngày), G6 (phản hồi), G4 và G5 (tiến triển, phó bản). Đây là các phần app đã đầu tư từ v88 đến v130.
- Yếu: G2 (đấu người thật) và G3 (đồng đội). Đây là **gốc rễ giữ chân của Gunny**: người ta quay lại Gunny vì bạn bè và đối thủ thật, không phải vì đồ.

### 18.2 Gốc rễ chênh lệch
App được thiết kế "một người + máy" để không cần tài khoản, chạy khi mất mạng, giữ riêng tư. Thiết kế đó đúng cho việc học, nhưng làm cho G2, G3 và G9 gần như bằng 0. Supabase đã có sẵn (giải đấu, đồng bộ, nhắc học), nên có thể thêm phần xã hội **mà vẫn không cần tài khoản**, chỉ dùng biệt danh và mã như giải đấu đang làm.

### 18.3 Việc ưu tiên (chưa làm)
1. **Đấu theo lượt với "bóng" của người thật** (G2: 2 → 5–6)
   - Hai người cùng mã trận: cùng hạt giống câu, cùng bàn Vòng Chữ hoặc Bài Câu.
   - Lượt của đối thủ được phát lại như bóng ma; thắng thua tính bằng câu tiếng Anh đúng và nhanh.
   - Không cần máy chủ thời gian thực: mở rộng mã "Thách đấu" hiện có.
2. **Tổ học 3–5 người** (G3: 1,5 → 5)
   - Chung một mục tiêu tuần (tổng số đèn thắp được).
   - Nhìn thấy nhau trên bản đồ Phố Chữ.
   - Lưu trên Supabase theo mã tổ, giống giải đấu.
3. **Hạng theo trận** (G9: 5 → 7)
   - Elo từ các trận ở mục 1, tách khỏi XP.
   - Thêm danh hiệu theo kỹ năng thật (chỉ số Lv của Túi chữ).
4. **Nhân vật của người chơi trên bản đồ** (G8, G10)
   - Hình đại diện chibi đi trên bản đồ v130, mặc đồ từ trang bị đã rèn.
   - Không bán bằng tiền thật.
5. **Không làm:** nạp tiền để mạnh hơn, quay thưởng, cường hoá thất bại mất đồ, ngắm bắn bằng góc / lực không qua tiếng Anh.

### 18.4 Phần ngoài trận: 12 tiêu chí theo phòng chờ / sảnh Gunny (v131)

**Yêu cầu:** chấm riêng giao diện ngoài trận ("phòng chờ", trừ lúc đang chơi game), rồi "bất chấp làm cho điểm cao lên".

**Phản biện, gốc rễ:**
- Trước v131 chỉ màn Hôm nay và bản đồ trông như game. Tôi, Đấu trường, Túi chữ, Tủ đồ vẫn là trang tài liệu nhiều chữ.
- Người chơi không có nhân vật, nên sảnh, túi đồ và tủ đồ không có gì để xoay quanh.
- App đã có sẵn nhân vật: Tí (`mascot()` + phụ kiện `ACC` khớp toạ độ). Cách rẻ và nhất quán nhất là cho Tí làm nhân vật của người chơi.

**"Bất chấp" vẫn giữ 5 giới hạn**, vì vượt qua thì điểm cao lên mà app tệ đi:
- Không nạp tiền, không quay thưởng, không chat.
- Chấm đỏ tối đa 3, chỉ khi có việc làm được ngay.
- Không đổi logic học.
- Không nới test cũ.
- Không game hoá màn bài học.

| # | Tiêu chí ngoài trận | Trước | Đã làm v131 | Sau |
|---|---|---|---|---|
| P1 | Sảnh có nhân vật đứng giữa | 5 | Ghim "Bạn ở đây" là Tí mặc phụ kiện đang đeo, thở và vẫy đuôi; bảng "Bạn & Tí" có lối vào Tủ đồ; màn Tôi có Tí | 8 |
| P2 | Thanh tài nguyên | 4 | Đầu bản đồ có 🪙 xu, 🏮 đèn x/3, ⭐ Lv Thợ Chữ, 🌅 khu, ★ sao phố; chạm thì mở nơi tiêu / kiếm; thanh đầu trang có 🪙 trên màn rộng | 7,5 |
| P3 | Chấm đỏ báo việc | 4 | `dots.ts`: từ sắp quên > cảnh truyện > rèn được đồ > câu đố ngày > mua được trang trí; tối đa 3; có unit test | 8 |
| P4 | Ngôn ngữ hình ảnh đồng nhất | 3,5 | Khung game `.gx` cho Tôi, Đấu trường, Giải đấu, Tủ đồ, Tiến độ, CEFR, Túi chữ; bài học giữ kiểu yên tĩnh | 6,5 |
| P5 | Màn nhân vật và trang bị | 3 | Túi chữ có tab "Nhân vật": Tí, 5 ô trang bị, 7 chỉ số thật có tên; 8 tab gom thành 3 nhóm | 7 |
| P6 | Ít chữ | 3 | Luật của Lò rèn, Tủ đồ, Đấu trường, Nguyên liệu, Chỉ số gom vào "❓"; mỗi màn còn một câu mở đầu | 5,5 |
| P7 | Phòng chờ trước ván | 5 | Bảng công trình xem trước ván (⏱ thời lượng, 🎯 mốc ★, 🏮 chặng, 🪙) và một nút chơi lớn; "Chơi tiếp" vẫn một chạm | 6,5 |
| P8 | Trung tâm nhiệm vụ | 6 | Sổ nhiệm vụ (chạm 🏮): 3 chặng, việc cư dân, mốc ★ gần nhất, sự kiện tuần; chế độ danh sách mở đầu bằng Sổ | 8 |
| P9 | Xã hội ở sảnh | 1 | Chưa làm (cần máy chủ và quyết định về riêng tư) | 1 |
| P10 | Tủ đồ / cửa hàng | 3 | Thử đồ: mỗi phụ kiện hiện Tí đang đeo món đó, kể cả món chưa mở | 6 |
| P11 | Điều hướng | 7 | Ô tài nguyên là lối tắt; Túi chữ mở vào màn Nhân vật | 7,5 |
| P12 | Sảnh sống | 5 | Tí thở / vẫy đuôi, chấm đỏ nhấp nháy; tôn trọng giảm chuyển động | 6,5 |

**Trung bình 4,1 → 6,5** (tự chấm, chưa đo trên người dùng).

### 18.5 Phản biện, nói thẳng

- **Mức trần ~8,2 chưa tới vì:**
  - P9 (xã hội) chưa làm.
  - P6: còn nhiều màn nhiều chữ (Giải đấu, Thư viện, các trang bài học).
  - P7 chưa có chọn nhịp / độ khó.
  - P10 chưa xem trước trang trí ngay trên bản đồ.
  - Tí chưa đi giữa các khu và chưa "mặc" trang bị đã rèn.
- **Thanh tài nguyên và chấm đỏ là chỗ dễ trượt sang ép người chơi nhất.** Phải đo §8.3 sau 2 tuần: nếu số lần mở app tăng mà câu bằng chứng / phút không tăng, thì giảm chấm (ví dụ bỏ chấm câu đố ngày và trang trí).
- **Khung `.gx` mới là lớp vỏ CSS**, chưa phải mỹ thuật vẽ tay. Lên trên 8 ở P4 cần hoạ sĩ.


## 19. Sảnh và Nhân vật / Trang bị kiểu Gunny (v132)

### 19.0 Yêu cầu và phản biện

**Yêu cầu:** "Phần 2 (màn hình chính) và phần 3 (nhân vật, trang bị) của Gunny: thiết kế app tương tự, gồm vẽ và âm thanh. Đưa ra tiêu chí đánh giá thang 10."

Người sáng lập đã chốt:
- Làm trong English Ladder.
- Vẽ bằng SVG từ code.
- Âm thanh tổng hợp bằng Web Audio.

**Gốc rễ (đọc code v131):**
1. **Người chơi chưa có nhân vật.** Tí (linh vật) đang đứng tạm vào chỗ đó. "5 ô trang bị" chỉ là 5 món `GEAR`, đồ không có cấp, không có lớp hình.
2. **Sảnh là một khung chữ** đặt trên bản đồ.
3. **Hai công tắc âm thanh không thông nhau.** Cài đặt (`st.set.sfx`) không tắt được âm của engine, vì engine đọc riêng `localStorage el-sfx-off` mà không chỗ nào ghi khoá đó. Chưa có nhạc sảnh.
4. **`EHOST.mascot` bỏ tham số `wear`**, nên engine không vẽ được Tí đang thử đồ.

**Quyết định:**
- Người chơi có **chibi riêng ghép lớp**. **Tí thành thú cưng**, giống hệ thống thú cưng của Gunny.
- **Cường hoá = học thật:**
  - Cấp của mỗi món = Lv của một chỉ số thật (`statsOf`).
  - Không mua được, không thất bại, không mất đồ (§18.0).
- **Thời trang chỉ đổi hình**, mua bằng xu kiếm trong game.
- Giữ 5 giới hạn của §18.4.

### 19.1 Đã làm

**Nhân vật** (`avatar.ts`, hàm thuần):
- SVG 14 lớp: hào quang, cánh, tóc sau, chân, áo, tay, khăn, mặt, tóc, mũ, tai nghe, kính, bút, hiệu ứng. Không dùng `id`.
- Ngoại hình: 6 kiểu tóc × 8 màu tóc × 5 màu da × 4 kiểu mắt × 3 kiểu miệng.
- **7 ô, mỗi ô gắn một chỉ số thật:**

  | Ô | Chỉ số |
  |---|---|
  | Bút | Dùng thật |
  | Mũ | Trí nhớ |
  | Kính | Từ vựng |
  | Tai nghe | Nghe |
  | Áo | Ngữ pháp |
  | Khăn | Nói |
  | Cánh | Phát âm |

- **Bậc của món theo Lv:** 1–2 gỗ, 3–4 đồng, 5–6 bạc, 7–8 vàng (hào quang), 9–10 kim cương (lấp lánh).
- **⚔️ Lực chữ** = Σ(Lv × 100 + Lv² × 10). Số suy ra, không lưu.
- **12 món thời trang:** nón lá, mũ lưỡi trai, vương miện giấy, áo dài, hoodie, vest, áo mưa, cánh thiên thần, cánh bướm, kính râm, hoa rơi, nốt nhạc bay.
- **Bản lưu `st.e.av`:** gồm sanitize và gộp hai máy. Ví xu chung trừ thêm `av.spent`.

**Màn Trang bị** (`heroview.ts`, `heroctl.ts`, tab ⚔️ của Túi chữ):
- Nhân vật 190 px ở giữa, Tí ngồi cạnh. 4 ô trái, 3 ô phải, có `+N` và màu theo bậc.
- Chạm ô mở thẻ món:
  - Bậc gỗ → kim cương.
  - Chỉ số đang nuôi món đó, mốc kế.
  - Nút **⚒️ Luyện ngay** tới đúng game của chỉ số.
- Ô vừa lên bậc: viền sáng và tiếng fanfare, chỉ một lần. Đã xem lưu ở `av.seen`.
- Bên dưới giữ nguyên hàng **🧪 Đạo cụ** (5 món rèn ở Xưởng, như thanh đạo cụ chiến đấu của Gunny) và 7 chỉ số thật.

**Thời trang:**
- Thử miễn phí, xem ngay trên người.
- Mua bằng xu: đủ xu thì tự mặc; thiếu xu thì báo còn thiếu bao nhiêu và phát tiếng `nope`.
- Mặc / tháo được; công tắc "Ẩn thời trang" để thấy lại trang bị.

**Tạo nhân vật:**
- Chọn kiểu, không chọn giới tính. Có 🎲 Ngẫu nhiên.
- Không bắt buộc: chưa tạo thì có ngoại hình mặc định ổn định, kèm nhãn "🎨 Tạo" trên nhân vật ở sảnh.

**Sảnh** (`worldview.ts`, `lobbyscene.ts`):
- Thanh trên một dòng, vuốt ngang được: ⚔️ Lực chữ, 🪙, 🏮, ⭐, 🔊 / 🔇, 🌅 khu, ★ sao.
- **Sân khấu** là phố vẽ SVG theo giờ trên máy:
  - 4 thời điểm: sáng sớm, ngày, chiều, đêm. Đêm có sao, trăng và cửa sổ sáng đèn.
  - Mây trôi, đèn lồng đung đưa.
  - Nhân vật của bạn đứng cạnh Tí đang nói.
- **Dòng tin hệ thống** (thay khung chat): đồ vừa lên bậc, cảnh truyện mới, sự kiện tuần còn mấy ngày, đủ xu mua thời trang.
- **Hàng 5 lối tắt:** Trang bị, Thời trang, Lò rèn, Nhiệm vụ, Sự kiện.
- **Ghim "Bạn ở đây"** trên bản đồ: nhân vật + Tí.
- "▶ Chơi tiếp" vẫn là nút chính duy nhất. Màn đầu cao 1283 px, dưới giới hạn 1300 px (v117).

**Âm thanh** (`sfx.ts`, `bgm.ts`):
- **Một công tắc:** engine hỏi app qua `EHost.sound()` (`st.set.sfx`, `st.set.music` mới).
  - Cài đặt có thêm dòng "Nhạc nền".
  - 4 nút nhạc trong game và nút 🔊 ở sảnh cùng ghi vào một chỗ.
  - Khoá `el-music-off` cũ được chuyển sang một lần.
  - Chế độ tập trung thì không có nhạc.
- **9 âm giao diện mới:** `tap`, `open`, `close`, `equip`, `unequip`, `tierup`, `coin`, `buy`, `nope`.
- **Nhạc sảnh:** 16 ô nhịp, 84 BPM, gam ngũ cung, 3 bè (bass, hợp âm rải I–vi–IV–V, giai điệu), sinh từ hạt giống cố định.
  - Chỉ phát sau lần chạm đầu.
  - Tự dừng khi rời sảnh.
  - Không tạo AudioContext khi đã tắt.

### 19.2 Tiêu chí và điểm (chấm lại trên bản v132 thật, chưa đo trên người dùng)

Mốc 10 = Gunny làm tốt nhất ở phần đó (đã trừ những gì §18 cấm: nạp tiền, quay thưởng, cường hoá mất đồ, chat). "Trước" là điểm đọc code v131. Cột "Cách kiểm" chỉ ra chỗ có thể chấm lại.

**Phần 2: Màn hình chính**

| # | Tiêu chí | Mốc 10 | Trước | v132 | Cách kiểm | Vì sao chưa 10 |
|---|---|---|---|---|---|---|
| M1 | Cảnh sảnh vẽ, nhân vật người chơi ở giữa | Cảnh có chiều sâu, nhân vật lớn ở trung tâm | 5 | **7,5** | hero.spec M1 | Nhân vật chỉ 100 px vì giới hạn chiều cao màn đầu; cảnh vẽ bằng code |
| M2 | Thanh trên: cấp, lực chiến, tiền, chạm tới nơi tiêu | Đủ thông tin, mỗi ô là lối tắt | 7 | **8** | hero.spec, lobby.spec P2 | Không có avatar nhỏ + tên ở thanh trên (nhân vật nằm ở sân khấu) |
| M3 | Icon sự kiện + chấm đỏ | Icon cố định, chấm khi làm được ngay | 6 | **7** | engine-dots, lobby.spec P3 | Chấm đỏ vẫn nằm trên bản đồ, chưa hiện trên hàng lối tắt |
| M4 | Điều hướng nhanh | 4–6 lối chính, một chạm | 5 | **8** | hero.spec | Thanh dưới của app (#bnav) + hàng 5 lối tắt; chưa có ngăn kéo "thêm" như Gunny |
| M5 | Kênh tin (thay chat) | Gunny có chat thế giới; mức trần tự đặt 6 | 1 | **5** | hero.spec M5 | Một dòng cắt bằng "…", chưa chạy chữ hoặc mở xem hết |
| M6 | Đồ hoạ đồng nhất, sáng / tối đạt AA | Một phong cách, WCAG AA cả hai chế độ | 6,5 | **7,5** | hero.spec M6 (axe sáng / tối) | SVG từ code, trần ~8 nếu không có hoạ sĩ |
| M7 | Âm thanh sảnh | Nhạc nền + âm UI, một công tắc | 3 | **7,5** | engine-avatar M7, engine-bgm, hero.spec M7 | Nhạc tổng hợp đơn giản; chưa nghe thử trên nhiều loa / tai thật |
| M8 | Sảnh sống | Thở, mây, ngày / đêm; giảm chuyển động thì đứng yên | 6,5 | **8** | engine-bgm (giờ), CSS reduced-motion | Nhân vật chưa đi giữa các khu trên bản đồ |
| M9 | Vẫn một việc chính, gọn | Một nút chính; ≤ 1300 px; không cuộn ngang | 7,5 | **8** | clarity.spec L1, hero.spec | Chỉ còn ~17 px dư so với giới hạn 1300 px; chưa chạy Lighthouse |

**Trung bình Phần 2: 5,3 → 7,4.**

**Phần 3: Nhân vật và trang bị**

| # | Tiêu chí | Mốc 10 | Trước | v132 | Cách kiểm | Vì sao chưa 10 |
|---|---|---|---|---|---|---|
| C1 | Tạo nhân vật | Chọn ngoại hình khi vào game, đổi lại được | 0 | **7,5** | hero.spec C1 | Không bắt buộc ở lần đầu (chỉ có nhãn "🎨 Tạo"); chưa đặt tên |
| C2 | Nhân vật ghép lớp | ≥ 8 lớp đúng chỗ, đổi là thấy ngay | 2 | **8** | engine-avatar C2 | Một tư thế, chưa có hoạt ảnh vũ khí |
| C3 | Ô trang bị quanh nhân vật | 7 ô, có `+N`, màu theo bậc | 3 | **8,5** | hero.spec C3, engine-avatar C3 | Chưa kéo-thả (chạm thì có) |
| C4 | Chỉ số + lực chiến | Rõ ràng, một số tổng, so trước / sau | 6 | **7** | hero.spec C4 | Chưa có "so trước / sau" khi một chỉ số lên |
| C5 | Cường hoá thấy được | Bậc → hình đổi; +7 phát sáng | 2 | **7,5** | engine-avatar C5 | Người mới mọi ô Lv 0 nên phải học một thời gian mới thấy món đầu (cố ý: không cho đồ miễn phí) |
| C6 | Túi đồ nhiều tab | Trang bị / Thời trang / Đạo cụ / Nguyên liệu | 5 | **7** | bag.spec, lobby.spec | Đạo cụ và nguyên liệu vẫn chung tab "🎒 Túi đồ" (giữ nguyên test v128) |
| C7 | Thời trang đè lớp trang bị | Thử trước, mua bằng xu kiếm được, bật / tắt | 3 | **8** | hero.spec C7, engine-avatar C7 | 12 món, chưa có bộ theo mùa / sự kiện |
| C8 | Thú cưng | Pet theo người chơi, có đồ riêng, có kỹ năng | 4 | **6,5** | hero.spec (svg.ti cạnh nhân vật) | Tí chưa có kỹ năng / cấp riêng |
| C9 | Âm thanh và hiệu ứng thao tác | Mặc / tháo / lên bậc có âm và chuyển động | 2 | **7** | engine-avatar M7 | Có âm riêng; chuyển động khi mặc đồ chưa làm (chỉ có viền sáng khi lên bậc) |
| C10 | Từ món đồ tới cách mạnh lên | Mỗi ô chỉ đúng việc học để nâng | 5 | **8,5** | hero.spec C3 (nút Luyện ngay) | Chưa ước lượng "còn mấy phút học nữa lên bậc" |

**Trung bình Phần 3: 3,2 → 7,6.**

### 19.3 Phản biện, nói thẳng

- **Kế hoạch dự kiến ~8,1 cho cả hai phần; bản thật đạt 7,4 và 7,6.** Phần hụt nằm ở:
  - Giới hạn chiều cao màn đầu (M1, M9): giữ luật v117 quan trọng hơn nhân vật to.
  - Không có chat (M5).
  - Không có hoạ sĩ (M6, C2).
  - Hai việc đã hứa trong kế hoạch mà chưa làm: chuyển động khi mặc đồ (C9) và nhân vật đi theo đường trên bản đồ (M8).
- **Mọi ô Lv 0 với người mới là cố ý**, nhưng là rủi ro: tuần đầu người chơi thấy 7 ổ khoá. Nếu số liệu §8.3 cho thấy người mới không quay lại màn Trang bị, hướng sửa là cho bậc gỗ ở Lv 1 tới sớm hơn (bậc đầu đo theo số kỹ năng đã học, không phải đã vững). Không sửa bằng cách cho đồ miễn phí.
- **Nhạc nền mặc định bật** (nhỏ, chỉ ở sảnh, sau lần chạm đầu). Nếu đo thấy nhiều người tắt ngay, đổi mặc định sang tắt.
- **Thời trang là chỗ tiêu xu mới.** Phải theo dõi để xu không lấn át bằng chứng học: nếu số ván "cày xu" tăng mà câu bằng chứng / phút không tăng, giảm giá hoặc bớt tin "đủ xu mua thời trang".
