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
