# Bảng chấm app theo spec v111 (thang 10)

Chấm ngày 11/10/2026, trên nhánh `claude/v110-goal-progress` (gồm v110 + spec v111). Căn cứ: code, test, báo cáo bot người học (`reports/learners/`), `docs/GAME-CRITERIA.md`. Chưa có số liệu người học thật, nên mọi điểm về hiệu quả và độ vui là **ước tính**.

## Cách chấm

- **Thước đo gốc** (SPEC.md, quyết định của người sáng lập ngày 11/10/2026):
  1. Đạt = đậu câu lạ ở đúng cấp, không học tủ.
  2. Mọi chức năng học và đo đều có vỏ game; người học chỉ thấy mình chơi.
- **Thang điểm:** mỗi tiêu chí có mô tả mốc 10. 0 = chưa có gì; 5 = có nhưng còn lệch hoặc thiếu nhiều; 10 = đạt đủ mốc.
- **Điểm nhóm** = trung bình các tiêu chí trong nhóm.
- **Điểm chung** = trung bình có trọng số của các nhóm. Trọng số cao cho phần spec v111 vừa chốt: game hoá (20), kết luận đạt (15).
- **Không chấm theo số dòng code.** Một tính năng có mà đi sai hướng spec vẫn bị điểm thấp.

## Tổng quan

| Nhóm | Trọng số | Số tiêu chí | Điểm |
| --- | --- | --- | --- |
| A · Game hoá mọi chức năng | 20 | 16 | **5,3** |
| B · Đầu vào và mục tiêu | 10 | 6 | **4,7** |
| C · Bản đồ và lộ trình | 10 | 6 | **6,3** |
| D · Kết luận đạt và chống học tủ | 15 | 6 | **1,7** |
| E · Độ phủ đề tham chiếu (A2 Key) | 10 | 6 | **4,0** |
| F · Hiển thị tiến độ | 6 | 5 | **6,8** |
| G · Bằng chứng và dữ liệu | 8 | 7 | **7,6** |
| H · Trải nghiệm game | 9 | 6 | **5,2** |
| I · Minh bạch và đạo đức | 3 | 3 | **8,0** |
| J · Kỹ thuật | 4 | 5 | **6,6** |
| K · Kiểm chứng hiệu quả | 5 | 3 | **3,3** |
| **Chung** | 100 | 69 | **4,9** (4,95) |

### Đọc nhanh: gốc rễ của điểm

1. **Nền móng mạnh, phần nổi chưa theo spec mới.**
   - Phần nền đang tốt: kiến trúc bằng chứng (G 7,6), lộ trình (C 6,3), minh bạch (I 8,0).
   - Phần quyết định "đậu được chưa" gần như chưa có (D 1,7), vì spec v111 vừa chốt hôm nay.
2. **Game hoá mới làm được nửa đường (A 5,3).**
   - Đã có vỏ game: học từ, ôn, ngữ pháp, chẩn đoán.
   - Ba chỗ người học còn bị hỏi thẳng như đi thi:
     - đầu vào: bài dò;
     - kết luận đạt: chưa có trận cổng;
     - đo hiệu quả: màn đo riêng.
   - Đây đúng là những chỗ quan trọng nhất để app biết người học ở đâu và đã tới chưa.
3. **Game chủ lực luyện phần ít quyết định đậu / rớt nhất.**
   - 72% lượt chơi rơi vào game chủ lực; hai trong ba game đó chủ yếu luyện nhận mặt chữ.
   - Đọc, Nghe, Viết, Nói (phần đề tham chiếu chấm) nằm trong mục đang đóng (C4 = 3, E = 4,0).
4. **Có dấu hiệu học tủ ngay trong mô phỏng.** Bot L01 đúng ở ngoài game thấp hơn trong game, nhưng app chưa có đèn báo (D3 = 2). Dữ liệu để làm đèn báo thì đã có sẵn.
5. **Chưa kiểm bằng người thật (H6 = 2, K2 = 2).** Mọi điểm về độ vui và hiệu quả là tự chấm.

## A · Game hoá mọi chức năng: 5,3 / 10 (trọng số 20)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| A1 | Người mới vào thẳng game, không gặp màn kiểm tra | Lần đầu mở app là vào chơi ngay; không có màn hỏi bài | **3** | Người mới gặp màn "Bạn đang ở đâu? … app hỏi vài câu từ vựng và ngữ pháp" + nút "Bắt đầu dò" (`diagview.ts`) trước khi vào sảnh | Chương mở đầu của truyện làm xếp lớp (v112) |
| A2 | Xếp lớp bằng game | Cấp xếp được hoàn toàn qua game, không lộ cảm giác thi | **5** | Thám hiểm sương mù là game xếp lớp thật (v86), nhưng chỉ là xếp lớp lại, 10–15 phút; xếp lớp đầu tiên vẫn là bài dò; còn nút "Làm kiểm tra Nghe + Đọc trước" | Gộp vào chương mở đầu; Thám hiểm giữ cho xếp lớp lại |
| A3 | Chọn mục tiêu trong game | Người học chọn đích bằng một lựa chọn trong truyện, có mặc định | **3** | App tự đặt "cấp CEFR kế tiếp" (`diag.ts`, autoGoal); đổi ở trang Mục tiêu dạng danh sách biểu mẫu | Lựa chọn của Tí trong chương mở đầu (v112) |
| A4 | Học từ mới bằng game | Từ mới đi đủ các mức chỉ qua game | **8** | Vườn từ: hạt → mầm → cây → hoa = mức 1–3, một bậc mỗi ngày (v87) | Cảnh sống đã có; còn thiếu mức 4 (dùng trong câu) |
| A5 | Ôn cách quãng bằng game | Mọi lượt ôn đến hạn có thể làm trong game | **8** | Vòng Chữ, Mỏ Chữ, Câu đố ngày, Xếp Khối lấy phần sắp quên trước; bộ não chọn game ưu tiên ôn | Ôn ngữ pháp / giao tiếp trong game chủ lực |
| A6 | Ngữ pháp bằng game | Ngữ pháp luyện tới mức dùng được (mức 4) trong game | **7** | Bài Câu (xếp câu, mức 3), Xưởng sửa câu (gõ lại câu đúng, mức 4) | Bài Câu tự chấm M = 5,9/10, cần làm hay hơn |
| A7 | Đọc hiểu bằng game | Đủ dạng bài đọc của đề tham chiếu, trong vỏ game | **6** | Thám tử (bảng manh mối, biên bản vụ án); câu hỏi vẫn lộ dạng trắc nghiệm | Thêm dạng bài theo đặc tả A2 Key |
| A8 | Nghe hiểu bằng game | Như trên cho Nghe | **6** | Đài phát thanh (cả bài, hai giọng), Quán Cà Phê (nghe khách + đáp đúng văn phong); cần máy có giọng đọc | Âm thanh soạn sẵn thay giọng máy để không phụ thuộc thiết bị |
| A9 | Viết bằng game | Viết đoạn được chấm đủ tin cậy, trong vỏ game | **5** | Thư gửi cư dân phố (v83): máy kiểm luật + tự chấm; chưa có AI nên độ tin cậy chỉ ở mức Vừa | Bài mẫu theo band để tự chấm sát hơn; AI chấm ở giai đoạn sau |
| A10 | Nói bằng game | Nói có phản hồi đáng tin, trong vỏ game | **4** | Karaoke, Robot phụ thuộc máy nghe giọng của trình duyệt; không có thì tự chấm | Dạng hỏi đáp kiểu phần thi Nói; giảm phụ thuộc trình duyệt |
| A11 | Phát âm bằng game | Phân biệt và nói đúng âm khó | **6** | Bắt Âm: nghe phân biệt cặp âm, vòng nói thử | Thêm trọng âm, nối âm |
| A12 | Kết luận đạt cấp bằng game | Trận cổng cuối khu dùng câu lạ để kết luận | **1** | Chưa có. Chương cuối khu chỉ đếm 2 / 5 / 9 kỹ năng vững (`story.ts`), không theo cấp, không dùng câu lạ | Trận cổng (v113) |
| A13 | Đo hiệu quả học bằng game | Bộ câu giữ riêng nằm trong game | **2** | Bộ đo 12 câu là màn riêng "Đo đầu vào / Đo sau khi học" (`measureview.ts`) | Kho báu ẩn (v114) |
| A14 | Chẩn đoán liên tục trong game | Dò phần chưa chắc ngay trong lượt chơi | **8** | Lượt "❓ Thử sức", câu dò trong game; ngân sách dò mỗi ngày | — |
| A15 | Màn chơi không dùng chữ thi / đề / kiểm tra | Không còn chữ nào như vậy trên đường chính | **4** | Còn "Bắt đầu dò", "Kiểm tra để bỏ qua" (`today.ts`), "Bài kiểm tra cấp" (tab Học); tab "Ôn thi" đã ẩn | Đổi lời theo truyện; ghi lại quy ước vào AUTHORING |
| A16 | Luật game không làm bẩn phép đo | Độ khó game tách khỏi câu hỏi; lượt đo không ép giờ | **8** | Tim, xúc xắc, hình khối độc lập với câu (P14), trừ đoán mò; trò cũ "Tốc độ 60 giây" vẫn ép giờ | Trò ép giờ không ghi bằng chứng mức cao |

## B · Đầu vào và mục tiêu: 4,7 / 10 (trọng số 10)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| B1 | Biết cấp hiện tại theo từng kỹ năng | Nghe, Đọc, Viết, Nói, từ vựng, ngữ pháp mỗi thứ một cấp ± sai số | **4** | Bài dò chỉ có từ vựng + ngữ pháp; Nghe / Đọc thích ứng IRT có nhưng nằm ở phần ôn thi đang ẩn | Đoạn nghe + đoạn đọc trong chương mở đầu |
| B2 | Đầu vào ngắn | ≤ 15 phút, dừng khi đủ chắc | **8** | Bài dò 3–5 phút, tối đa 8 phần, dừng khi hội tụ | Giữ ≤ 15 phút khi thêm Nghe / Đọc |
| B3 | Mục tiêu do người học chọn (P1) | Người học chọn đích; app chỉ gợi ý | **4** | App tự đặt; chọn tay được nhưng phải vào trang Mục tiêu | Lựa chọn trong truyện |
| B4 | Kịp hạn hay không | Có hạn thì báo số giờ cần và có kịp không | **3** | `plan.ts` (giờ cần theo cấp, cảnh báo không kịp) chỉ dùng cho mục tiêu thi đang ẩn | Dùng cho CEFR khi người học đặt hạn ở hồ sơ |
| B5 | Phần đoán từ xếp lớp không thành Đạt giả | Phần suy ra tách khỏi Đạt thật, kiểm dần | **7** | Claim tách khỏi Đạt; bot L01: Claim sai giảm 66 → 14 sau 44 ngày | Xác nhận Claim nhanh hơn |
| B6 | Câu xếp lớp không làm hỏng câu đo sau | Câu dùng ở đầu vào không trùng câu trận cổng | **2** | Chưa có cơ chế chia kho; chỉ 12 câu của bộ đo được giữ riêng | Chia kho khi soạn trận cổng |

## C · Bản đồ và lộ trình: 6,3 / 10 (trọng số 10)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| C1 | Chỉ học phần còn thiếu | Đường đi tối thiểu theo đồ thị, bỏ qua phần đã biết | **8** | NBA theo đồ thị tiền đề, kiểm tra để bỏ qua, tiên nghiệm từ chẩn đoán | — |
| C2 | Truy gốc rễ lỗi | Sai lặp lại → tìm tiền đề hỏng, hiểu sai | **7** | Giả thuyết tiền đề (`hyp`), mẫu lỗi lặp (`mis`), bí kíp nhắm đúng hiểu sai | Báo gốc rễ rõ hơn cho người học |
| C3 | Ôn cách quãng | Ôn đúng lúc sắp quên, không ôn thừa | **8** | FSRS-5 theo mục; ngưỡng ôn đổi theo tỉ lệ đúng | — |
| C4 | Thời gian chơi chia theo phần đề còn hụt | Phút chơi tỉ lệ với phần làm rớt / đậu đề | **3** | Bot L01: 72% lượt chơi ở game chủ lực (110/152), mà 2/3 game chủ lực chủ yếu luyện nhận mặt chữ (mức 2); game Đọc, Nghe, Viết, Nói nằm trong mục đang đóng | Bộ não chọn game cân theo hụt của đề tham chiếu |
| C5 | Dùng được ở câu mới (transfer) | Đúng ở câu lạ ngang câu đã gặp | **5** | Đạt CEFR đòi transfer (v65), nhưng bot L01: "ngoài game vẫn thấp hơn trong game" (L01-59 = 5) | Đèn báo học tủ; thêm câu transfer |
| C6 | Bộ não chọn game | Một nút Chơi tiếp, lý do đúng nhu cầu | **7** | `director.ts`: 3 chặng / ngày, lý do theo nhu cầu, đổi dạng | Thêm nhu cầu "hụt theo đề" |

## D · Kết luận đạt và chống học tủ: 1,7 / 10 (trọng số 15)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| D1 | Đạt = đậu câu lạ | Kết luận đạt chỉ từ trận cổng câu lạ | **1** | Mới có trong spec (v111); code vẫn kết luận bằng nút Đạt + Can-Do | v113 |
| D2 | Kho câu lạ đủ lớn, cách ly | Mỗi cấp ≥ 2 đề song song, không lọt vào luyện tập | **2** | Chỉ 12 câu giữ riêng (`measure.ts`, `today.ts`) | Soạn đề A2 trước |
| D3 | Đèn báo học tủ | So đúng câu đã gặp với câu lạ, báo khi chênh | **2** | Dữ liệu đã có (bộ đếm `nov`, `novOk` ở L2) nhưng chưa có đèn | Một phép tính trên số đã có |
| D4 | Xác suất đậu kèm sai số | P(đậu) theo IRT ± sai số, ngưỡng 80% | **1** | Chỉ có cho IELTS / VSTEP đang ẩn (`readiness.ts`) | Dùng lại cho trận cổng |
| D5 | Chốt dự đoán và đối chiếu | Ghi dự đoán trước, so với điểm thật | **3** | Có chỗ ghi điểm thi thật và cặp điểm (`el_pair`) cho mục tiêu thi; chưa cho CEFR | Ở tuỳ chọn hồ sơ |
| D6 | Xác nhận ngoài là tuỳ chọn ở hồ sơ | Ai cần chứng chỉ mới thấy | **1** | Chưa có | v113 |

## E · Độ phủ đề tham chiếu (A2 Key): 4,0 / 10 (trọng số 10)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| E1 | Đọc | Đủ dạng bài đọc A2 Key, đúng độ khó | **5** | Văn bản đời thường A1–A2 (biển báo, thực đơn, tin nhắn…), bài của unit; chưa đối chiếu từng dạng bài với đặc tả | Bảng phủ theo dạng bài |
| E2 | Viết | Đủ dạng bài viết A2 Key (tin nhắn ngắn, kể chuyện theo tranh) | **4** | Đề viết `WTASKS` theo cấp, máy kiểm luật; chưa có dạng kể chuyện theo tranh | Thêm dạng bài + bài mẫu |
| E3 | Nghe | Đủ dạng bài nghe A2 Key | **5** | 525 câu thoại, nghe đoạn hai giọng, nhiều giọng, tiếng ồn; chưa đối chiếu dạng bài | Bảng phủ theo dạng bài |
| E4 | Nói | Hỏi đáp và thảo luận cặp như phần thi Nói | **3** | Đóng vai, Karaoke, nói đáp từ ý tiếng Việt; không có dạng thảo luận cặp | Dạng bài hỏi đáp theo đặc tả |
| E5 | Từ vựng và ngữ pháp | Đủ danh sách từ và ngữ pháp của cấp | **7** | 9.345 từ gắn cấp CEFR; ngữ pháp A1–C2; 28.114 câu gắn nút, 0 mồ côi (v67) | Đối chiếu với danh sách từ chính thức của bài tham chiếu |
| E6 | Số đề song song mỗi cấp | ≥ 2 đề lạ mỗi cấp | **0** | Chưa có | v113 |

## F · Hiển thị tiến độ: 6,8 / 10 (trọng số 6)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| F1 | Mục tiêu đầu sảnh | Sảnh mở đầu bằng mục tiêu + tiến độ thật | **8** | Thẻ 🎯 Mục tiêu (v110). **Đang ở nhánh, chưa gộp vào bản chạy thật**; bản chạy thật = 2 | Gộp PR v110 |
| F2 | Màn kết nối ván với mục tiêu | Mọi màn kết có dòng 🎯 nói thật | **8** | Dòng 🎯 ở mọi màn kết + lớp phủ 3 game chủ lực (v110, chưa gộp); Vườn còn chữ "Lên cấp" ở mức thấp | Đổi chữ "Lên cấp" cho thống nhất |
| F3 | Bản đồ khác kết luận | Màn hình phân biệt rõ "đang học" với "đủ trình độ" | **3** | Chưa có trận cổng nên chưa có dòng kết luận | v113 |
| F4 | Không báo readiness bằng phần trăm | Báo bằng phần còn thiếu | **9** | Chip Sẵn sàng CEFR bỏ % (v110) | — |
| F5 | Thưởng game không lấn tiến độ thật | Xu, ★ không nổi hơn tiến bộ thật | **6** | v110 đưa tiến độ lên trên; bot L01: "xu vẫn lớn hơn nhiều so với tiến bộ thật" (L01-63) | Gắn mở khu với trận cổng |

## G · Bằng chứng và dữ liệu: 7,6 / 10 (trọng số 8)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| G1 | Kiến trúc bằng chứng tính lại được | Quan sát → bằng chứng → thống kê → mức thành thạo, tính lại được | **9** | 5 lớp L0–L4, Beta tính lại từ L2 (spec v2.4 §X–XII) | — |
| G2 | Gọn | Dữ liệu giữ theo giá trị, không phình theo thời gian | **8** | L0 7 ngày / 300; sổ 2.000 sự kiện dọn theo giá trị; 400 ảnh chụp; câu đã gặp băm 6 ký tự; ước tính < 1 MB (chưa đo thật) | Đo dung lượng thật trên máy người dùng |
| G3 | Giữ bằng chứng quan trọng | Bằng chứng quyết định không bị dọn | **8** | Tier 0–3, bảo vệ bằng chứng mà ảnh chụp quyết định tham chiếu | Kết quả trận cổng lưu tier cao nhất |
| G4 | Nhiều máy không mất, không đếm trùng | Gộp hai máy cho kết quả đúng | **8** | Bộ đếm chỉ tăng theo thiết bị (G-counter), có test gộp | — |
| G5 | Không mất dữ liệu | Có sao lưu mặc định hoặc nhắc rõ | **4** | Lưu trên trình duyệt; mã đồng bộ ELK chỉ bật khi người học tự chọn | Nhắc sao lưu sau ván đầu tiên / khi qua cổng |
| G6 | Giải thích được quyết định | Mọi kết luận quan trọng có "Vì sao?" | **8** | Ảnh chụp quyết định + màn "Vì sao?" (v54) | — |
| G7 | Quyền riêng tư | Không thu dữ liệu không cần | **8** | Không tài khoản, dữ liệu ở máy, chia sẻ ẩn danh tự chọn có kiểm tuổi | — |

## H · Trải nghiệm game: 5,2 / 10 (trọng số 9)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| H1 | Lõi game tự hấp dẫn | Bỏ tiếng Anh đi vẫn muốn chơi | **6** | Tự chấm M1: Vòng Chữ 7, Mỏ Chữ 7, Bài Câu 6 (GAME-CRITERIA §10); **chưa có người chơi thật chấm** | Buổi chơi thử theo PLAYTEST.md |
| H2 | Cảm giác điều khiển | Vuốt, kéo thả mượt, chính xác | **7** | Canvas 60 fps, kéo thả có test trên 3 thiết bị | Kiểm bằng ngón tay thật |
| H3 | Mỹ thuật và âm thanh | Ngang game cùng thể loại | **5** | Cảnh sống, âm tự tạo; tự chấm M4 = 5–6 | — |
| H4 | Lý do quay lại | Truyện, chuỗi ngày, sự kiện kéo người học về | **6** | Truyện 12 chương, sự kiện tuần, thử thách ngày, Phố | Gắn khu truyện với cấp CEFR |
| H5 | Dàn trải hay tập trung | Ít game, mỗi game sâu | **5** | 17 game; 13 game kỹ năng đã thu gọn | Gộp bớt theo số liệu chơi thật |
| H6 | Số liệu chơi thật | Có số liệu bỏ dở / chơi tiếp từ người thật | **2** | Chỉ đo trên máy; chưa có số liệu người thật trong repo | Sau buổi chơi thử |

## I · Minh bạch và đạo đức: 8,0 / 10 (trọng số 3)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| I1 | Không dark pattern | Không trừ khi sai, không ép bằng nỗi sợ mất | **8** | Năng lượng trừ theo lượt chứ không theo lỗi; lượt đo không tốn năng lượng | — |
| I2 | Học ẩn nhưng xem được | Muốn xem thì thấy hết app ghi gì | **7** | Trang tiến độ, "Vì sao?", sao lưu / mã đồng bộ | Ghi rõ lượt nào là lượt đo |
| I3 | Nói thật giới hạn | Không hứa quá khả năng | **9** | Giới hạn thực tế ghi thẳng trong spec và trên màn hình (Viết / Nói chỉ tin cậy Vừa) | — |

## J · Kỹ thuật: 6,6 / 10 (trọng số 4)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| J1 | Test tự động | Mọi luật quan trọng có test | **9** | 285 test đơn vị, 244 test giao diện × 3 thiết bị (Android, iOS, máy tính), bot người học | — |
| J2 | Tốc độ mở app | Mở nhanh trên điện thoại rẻ | **4** | `app.js` 3,2 MB + engine 402 KB + đồ thị 986 KB | Tách và tải theo phần |
| J3 | Chạy khi mất mạng | Học được không cần mạng | **8** | Service worker, bài học tải theo phần | — |
| J4 | Trợ năng | WCAG AA | **8** | Kiểm axe trên nhiều màn, 390 px | — |
| J5 | Dễ sửa | Mô-đun nhỏ, rõ ranh giới | **4** | `main.ts` 166 KB, `app.js` một khối lớn | Tách main.ts theo game |

## K · Kiểm chứng hiệu quả: 3,3 / 10 (trọng số 5)

| # | Tiêu chí | Mốc 10 | Điểm | Căn cứ hiện tại | Để lên điểm |
| --- | --- | --- | --- | --- | --- |
| K1 | Mô phỏng người học | Bot nhiều kiểu người học chạy qua giao diện | **7** | Bot L01–L03, 44 ngày mô phỏng; L01 sau 44 ngày: 0/36 năng lực Can-Do A1 | Bot "học vẹt" để thử đèn báo học tủ |
| K2 | Đo hiệu quả trên người thật | Có số đo trước / sau / trễ của người thật | **2** | Bộ đo có sẵn nhưng chưa có kết quả người thật trong repo | Người sáng lập học hằng ngày + kho báu ẩn |
| K3 | Hiệu chỉnh bằng dữ liệu | Ngưỡng, độ khó câu chỉnh theo dữ liệu thật | **1** | Mọi tham số là giả định của người soạn (spec ghi rõ) | Cần nhiều người dùng |

## Thứ tự nên làm (lợi ích ÷ công sức)

| Việc | Tiêu chí nâng | Công sức | Ghi chú |
| --- | --- | --- | --- |
| Gộp PR v110 | F1, F2 (bản chạy thật 2 → 8) | rất nhỏ | Đã xong code, test xanh |
| Đèn báo học tủ | D3 (2 → 7), C5 | nhỏ | Chỉ tính trên bộ đếm câu mới / cũ đã có |
| Bỏ chữ thi / đề / kiểm tra khỏi đường chính | A15 (4 → 8) | nhỏ | Đổi lời, thêm quy ước vào AUTHORING |
| v112 Chương mở đầu + chọn mục tiêu trong truyện | A1, A2, A3, B1, B3 | vừa | Dùng lại bài dò + IRT Nghe / Đọc sẵn có |
| Bộ não chọn game cân theo hụt của đề | C4 (3 → 7) | vừa | Thêm nhu cầu "hụt theo đề" vào `director.ts` |
| v113 Trận cổng A2 (2 đề lạ) | A12, D1, D2, D4, D6, E6, F3 | lớn (nội dung) | Nút cổ chai là soạn câu mới qua phép thử đoán mò |
| Buổi chơi thử thật | H1, H6, K2 | nhỏ với app, cần thời gian người sáng lập | Theo `docs/PLAYTEST.md` |
| v114 Kho báu ẩn | A13 | vừa | Dời bộ đo 12 câu vào game |
| Tách `app.js` / `main.ts` | J2, J5 | lớn | Không gấp với 1 người dùng |

Ước tính (tính lại từ bảng, giả định mỗi việc đạt mức điểm ghi trong cột "Để lên điểm"): làm xong đèn báo học tủ, bỏ chữ thi, v112 và bộ não cân theo đề thì điểm chung lên khoảng 5,5; thêm trận cổng A2 thì khoảng 6,5. Gộp PR v110 không đổi điểm của bảng này (bảng đã chấm trên nhánh), nhưng nâng bản chạy thật. Phần còn lại phụ thuộc nội dung và số liệu người thật.

## Giới hạn của bảng chấm

- Người chấm cũng là người viết phần lớn code (AI), nên dễ chấm lệch về phía có lợi. Các điểm H và K cần người chơi thật xác nhận.
- Trọng số do AI đề xuất theo spec v111. Người sáng lập đổi trọng số thì điểm chung đổi theo; điểm từng tiêu chí giữ nguyên.
- Phần E chưa đối chiếu từng dạng bài với đặc tả chính thức của A2 Key. Cần soát khi soạn trận cổng.
