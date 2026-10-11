# Chơi thử nghiệm thu

## Phần 1: mục tiêu, đầu vào, trận cổng (v110–v116)

Mục đích: xem người học có biết **mình đang ở đâu, đang hướng tới đâu, khi nào thì "đạt"** hay không, và màn nào còn cảm giác "đi thi".

### Chuẩn bị (2 phút)
- Dùng **điện thoại**, bật tiếng.
- Mở **cửa sổ ẩn danh** (hoặc trình duyệt khác), vào `https://sonnguyen12394.github.io/?playtest=1`.
  - **Vì sao ẩn danh:** trận cổng là đề dùng một lần. Chơi thử vẫn ghi kết quả và đánh dấu đề đã dùng. Ẩn danh thì đóng cửa sổ là xoá sạch, bản lưu học thật của bạn không bị đụng.
  - `?playtest=1` mở trận cổng sớm (bình thường phải ≥ 70% kỹ năng vững) và thêm nút nhảy màn ở Mỏ Chữ.

### Kịch bản (khoảng 20 phút)

| # | Làm gì | Để ý điều gì |
|---|---|---|
| 1 | Bấm **Bắt đầu** → chương mở đầu **Sương Câm** → **Bắt đầu thử sức**, thắp đèn (trả lời thật, bấm "Không biết" khi không biết) | Có thấy giống "bài dò" không? Có quá dài không? |
| 2 | Ở màn kết quả, bấm **🔦 Thắp đèn Nghe + Đọc** (tuỳ chọn) | Phần nghe có nghe rõ không? Kết quả có chia theo từng kỹ năng không? |
| 3 | Tí hỏi "Bạn muốn đi xa tới đâu trong Phố Chữ?" → **▶ Giữ đích** hoặc chọn "Xa hơn" (thử B1) | Có hiểu mình vừa chọn cái gì không? |
| 4 | Sảnh: đọc thẻ **🎯** ở trên cùng (vững / cần, +7 ngày, mốc gần, sắp quên, thang khu), chạm vào thẻ | Nhìn 5 giây có biết mình đang ở đâu, còn bao xa không? |
| 5 | Chơi 1–2 game (▶ Chơi tiếp) rồi xem dòng 🎯 ở màn kết | Dòng đó có nói thật và dễ hiểu không? |
| 6 | Trên thẻ 🎯 bấm **🚪 Vào trận cổng khu …** → **▶ Vào trận cổng**, chơi hết một đề | Không có đáp án trong lúc chơi. Màn chữa bài, khả năng qua và gợi ý phần yếu có rõ không? |
| 7 | Nếu sảnh có thẻ **🎁 Kho báu ẩn**: **Mở kho báu** | Có thấy giống "đi thi" không? |
| 8 | Trang mục tiêu (chạm thẻ 🎯): mục **🎓 Chứng chỉ (tuỳ chọn)**; mở tab học kiểu cũ (Học / Kỹ năng) | Còn chỗ nào dùng chữ "thi / kiểm tra / bài dò" ở màn chơi không? |

### Gửi lại cho tôi
- Ảnh chụp màn nào khó hiểu, hoặc màn còn cảm giác "đi thi".
- Câu cổng sai, khó hiểu hoặc quá "bẫy": ghi **mã câu** (ví dụ `gt-b1-1-l2-c`, hiện ở màn chữa bài) và lý do.
- Một câu trả lời: sau 20 phút, bạn có biết mình cần làm gì để "đạt" mục tiêu không?

### Soát 134 câu cổng
- Đọc thẳng `content/exam/gate/*.json`: mỗi câu có bài, đáp án, lời giải thích, câu trích làm bằng chứng.
- Hoặc chơi từng đề trong cửa sổ ẩn danh (mỗi cửa sổ mới chơi được lại) rồi đọc màn chữa bài.
- Kết quả phép thử "không có bài" ở `content/exam/gate/README.md`.

## Phần 2: ba game chủ lực (v93–v100)

Tài liệu này dành cho người sáng lập, dùng cho buổi chơi thử thật đầu tiên sau đợt làm lại game (GAME-CRITERIA §10).

Mục đích: kiểm tra xem điểm tôi tự chấm (Vòng Chữ 7,2 · Mỏ Chữ 7,3 · Bài Câu 5,9 / 10) có đúng với cảm nhận của người chơi thật hay không. Nếu bạn chấm thấp hơn nhiều, điểm tự chấm sai, và chỗ chênh lệch chính là việc cần làm tiếp.

### Chuẩn bị (2 phút)
- Dùng **điện thoại**, vì game được làm cho chạm và vuốt. Bật tiếng để nghe âm và nhạc nền.
- Mở app với đuôi `?playtest=1`, ví dụ `https://sonnguyen12394.github.io/?playtest=1`, sau khi PR đã gộp và trang đã cập nhật.
  - Chế độ chơi thử thêm nút nhảy màn ở thẻ Mỏ Chữ (không ghi bằng chứng năng lực) và mở trận cổng sớm (trận cổng vẫn ghi kết quả, xem Phần 1).
  - Tắt bằng `?playtest=0`.
- Chọn tab **Chơi**.

### Kịch bản 15 phút

| # | Làm gì | Để ý điều gì |
|---|---|---|
| 0 | 📖 Bấm **Bắt đầu câu chuyện** ở thẻ truyện, xem cảnh mở đầu; làm 1–2 nhiệm vụ của chương 1 (Bà Lan) qua các game | Có muốn biết chuyện gì xảy ra tiếp không? Nhiệm vụ truyện có làm bạn muốn chuyển sang game khác không? |
| 1 | Nhìn sảnh: lộ trình, ba thẻ ⭐ game chủ lực, sự kiện tuần, mục 📚 Luyện tập (đang đóng) | Có muốn bấm vào game không? Có biết nên chơi gì trước không? |
| 2 | 🎡 **Vòng Chữ**: chơi màn 1 và màn 2. Vuốt qua các chữ trên vòng để ghép từ | Vuốt có mượt và "đã tay" không? Âm, hiệu ứng khi tìm ra từ có đã không? Gợi ý nghĩa tiếng Việt có giúp không? |
| 3 | ⛏️ **Mỏ Chữ**: chơi màn 1, sau đó bấm 🧪 **Màn 5 rương** và **Màn 10 mốc** | Luật "kề nhau cả chéo" có hiểu ngay không? Màn rương có quá khó không? Màn mốc hình trái tim có thấy "đặc biệt" không? |
| 4 | 🃏 **Bài Câu**: chơi một ván (3 bàn). Kéo lá từ vào vùng câu; thử kéo lá ra, chen lá vào giữa | Kéo thả có chính xác không? Câu đúng tự sang lượt có nhanh quá hay chậm quá không? Câu sai có đọc kịp câu đúng không? |
| 5 | Về sảnh: xem sự kiện tuần, sổ từ (📖 trong thẻ Vòng Chữ), Phố | Phần thưởng có làm bạn muốn quay lại ngày mai không? |
| 6 | Bấm **▶ Chơi tiếp** hai lần, để bộ não chọn game | Game được chọn có hợp lý không? Có bị đưa vào game cũ "chán" không? |

Nếu có thời gian, hôm sau mở lại app: thử thách ngày, chuỗi ngày, sự kiện tuần còn tiến độ.

### Phiếu chấm (thang 10, so với game cùng loại bạn hay chơi)

Định nghĩa từng tiêu chí ở GAME-CRITERIA §10.1. Điểm = (M1 × 2 + M2 × 2 + M3 + … + M10) ÷ 12.

| Tiêu chí | Vòng Chữ: tôi chấm | Vòng Chữ: bạn chấm | Mỏ Chữ: tôi chấm | Mỏ Chữ: bạn chấm | Bài Câu: tôi chấm | Bài Câu: bạn chấm |
|---|---|---|---|---|---|---|
| M1 Lõi tự hấp dẫn (×2) | 7 | | 7 | | 6 | |
| M2 Cảm giác điều khiển (×2) | 7 | | 7 | | 7 | |
| M3 Nhịp liền mạch | 8 | | 8 | | 7 | |
| M4 Mỹ thuật và âm thanh | 6 | | 6 | | 5 | |
| M5 Màn chơi nhập vai | 8 | | 8 | | 8 | |
| M6 Chiều sâu | 7 | | 8 | | 6 | |
| M7 Thiết kế màn và độ khó | 6 | | 8 | | 4 | |
| M8 Meta và phần thưởng | 7 | | 6 | | 3 | |
| M9 Vào chơi ngay | 8 | | 8 | | 8 | |
| M10 Lý do quay lại | 8 | | 7 | | 4 | |
| **Điểm** | **7,2** | | **7,3** | | **5,9** | |

**Câu hỏi quan trọng nhất:** nếu bỏ phần tiếng Anh đi, bạn có muốn chơi tiếp game này 10 phút nữa không? Đây là M1, tiêu chí nặng nhất.

### Số liệu máy tự ghi
- Ở cuối sảnh có mục **📊 Số liệu chơi trên máy này**: số ván, tỉ lệ bỏ dở, chơi lại, thời lượng của từng game.
- Ngưỡng cảnh báo ở GAME-CRITERIA §9:
  - bỏ dở > 20 %;
  - quá 10 giây mới có thao tác đầu;
  - tỉ lệ chơi tiếp < 50 %.
- Gửi tôi ảnh chụp bảng này sau buổi chơi thử là đủ.

### Những gì tôi đã kiểm, và những gì chưa kiểm được

**Đã kiểm:**
- 278 test đơn vị, 206+ test giao diện (Chrome Android, máy tính; Safari iOS chạy trên CI).
- Vuốt / kéo bằng chuột thật trên canvas; WCAG AA ở màn 390 px.
- Bot người học 8 ngày; mô phỏng độ khó Mỏ Chữ màn 1–60.

**Chưa kiểm được, chỉ người thật mới trả lời được:**
- game có **vui** không;
- âm thanh có dễ chịu không;
- kéo thả trên ngón tay thật có chính xác như trên chuột không;
- mô hình người chơi giả trong mô phỏng có giống người học thật không.
