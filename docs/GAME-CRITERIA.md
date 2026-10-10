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
