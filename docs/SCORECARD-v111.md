# Bảng chấm app theo spec v111 (thang 10)

Đây là **bộ tiêu chí chính thức** của chương "Mô hình học v111" trong `docs/SPEC.md` (mục 7). Mỗi nhóm ghi rõ nó kiểm mục nào của spec. Chấm lại sau mỗi bản phát hành; không đổi mốc 10 khi chưa hỏi người sáng lập.

- **Lần 1:** 11/10/2026, sau v111.
- **Lần 2:** sau v111b–v114, trên nhánh `claude/v110-goal-progress`.

Căn cứ: code, test, báo cáo bot người học, `docs/GAME-CRITERIA.md`. Chưa có số liệu người học thật, nên mọi điểm về hiệu quả và độ vui là **ước tính**.

## Cách chấm

- **Thước đo gốc** (SPEC.md, quyết định của người sáng lập ngày 11/10/2026):
  1. Đạt = đậu câu lạ ở đúng cấp, không học tủ.
  2. Mọi chức năng học và đo đều có vỏ game; người học chỉ thấy mình chơi.
- **Thang điểm:** mỗi tiêu chí có mô tả mốc 10. 0 = chưa có gì; 5 = có nhưng còn lệch hoặc thiếu nhiều; 10 = đạt đủ mốc.
- **Điểm nhóm** = trung bình các tiêu chí trong nhóm. **Điểm chung** = trung bình có trọng số của các nhóm.
- **Không chấm theo số dòng code.** Một tính năng có mà đi sai hướng spec vẫn bị điểm thấp.
- Cột **Trần** ghi tiêu chí không nâng được bằng code trong giai đoạn này, kèm lý do.

## Tổng quan

| Nhóm | Kiểm mục spec | Trọng số | Số tiêu chí | Lần 1 | Lần 2 |
| --- | --- | --- | --- | --- | --- |
| A · Game hoá mọi chức năng | Mô hình học §5; mục "Game hoá mọi chức năng" | 20 | 16 | 5,3 | **6,9** |
| B · Đầu vào và mục tiêu | Mô hình học §1, §2 | 10 | 7 | 4,3 | **7,3** |
| C · Bản đồ và lộ trình | Mô hình học §3; Quyết định kỹ thuật §6 | 10 | 6 | 6,3 | **7,0** |
| D · Kết luận đạt và chống học tủ | Mô hình học §3 (chống học tủ), §4; mục "Đề sát hạch" | 15 | 7 | 1,6 | **7,0** |
| E · Độ phủ đề tham chiếu (A2 Key) | Mục "Đề sát hạch" (đặc tả bài tham chiếu) | 10 | 6 | 4,0 | **4,7** |
| F · Hiển thị tiến độ | Mục "Hợp đồng hiển thị tiến độ" | 6 | 5 | 6,8 | **8,2** |
| G · Bằng chứng và dữ liệu | Mô hình học §6 | 8 | 7 | 7,6 | **8,0** |
| H · Trải nghiệm game | GAME-CRITERIA §10 | 9 | 6 | 5,2 | **5,2** |
| I · Minh bạch và đạo đức | Tầm nhìn; luật 3 của "Game hoá" | 3 | 3 | 8,0 | **8,3** |
| J · Kỹ thuật | Rủi ro đã ghi nhận | 4 | 5 | 6,6 | **6,6** |
| K · Kiểm chứng hiệu quả | Giới hạn thực tế; v2.4 §XXIII | 5 | 3 | 3,3 | **3,7** |
| **Chung** | | 100 | 71 | 4,9 | **6,6** |

### Đọc nhanh lần 2

1. **Phần quyết định "đậu được chưa" đã có (D 1,6 → 7,0).** Trận cổng A1 / A2 dùng câu lạ, xác suất qua kèm sai số, đề đã mở không dùng lại, Đạt trong app = qua cổng. Điểm D còn bị giữ vì câu cổng do AI soạn, **chưa qua vòng soát của người** (D2 = 5).
2. **Đầu vào và mục tiêu đã thành game (B 4,3 → 7,3).** Chương mở đầu "Sương Câm", đèn Nghe + Đọc, Tí hỏi đích.
3. **Game hoá lên 6,9.** Còn thấp ở Viết / Nói (cần AI chấm) và ở các tab học kiểu cũ (lối phụ, vẫn có chữ "bài kiểm tra").
4. **Đèn báo học tủ hoạt động.** Mô phỏng 200 lần: bắt 98,5% bot học vẹt, báo nhầm 2% bot học thật.
5. **Phần trần.** Nhóm H (độ vui), K (hiệu quả thật), J (kích thước code), E (phủ đủ dạng bài) không đổi: cần người chơi thật, nội dung lớn hoặc tái cấu trúc.

## A · Game hoá mọi chức năng: 5,3 → 6,9 / 10 (trọng số 20)

Kiểm: Mô hình học §5; mục "Game hoá mọi chức năng".

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A1 | Người mới vào thẳng game, không gặp màn kiểm tra | Lần đầu mở app là vào chơi ngay; không có màn hỏi bài | 3 | **7** | v112: "Bắt đầu" mở chương mở đầu "Sương Câm" (Tí dẫn, thắp đèn); không còn màn "Bắt đầu dò". Vẫn là hỏi–đáp, chỉ khoác vỏ truyện | Chương mở đầu của truyện làm xếp lớp (v112) |  |
| A2 | Xếp lớp bằng game | Cấp xếp được hoàn toàn qua game, không lộ cảm giác thi | 5 | **7** | v112: xếp lớp đầu vào nằm trong chương mở đầu + đèn Nghe / Đọc thích ứng (`lrview.ts`); Thám hiểm sương mù để xếp lớp lại | Gộp vào chương mở đầu; Thám hiểm giữ cho xếp lớp lại |  |
| A3 | Chọn mục tiêu trong game | Người học chọn đích bằng một lựa chọn trong truyện, có mặc định | 3 | **8** | v112: Tí hỏi "Bạn muốn đi xa tới đâu?": giữ đích gợi ý (mặc định) / xa hơn một cấp / tự chọn; snapshot `goal:STORY` | Lựa chọn của Tí trong chương mở đầu (v112) |  |
| A4 | Học từ mới bằng game | Từ mới đi đủ các mức chỉ qua game | 8 | **8** | Vườn từ: hạt → mầm → cây → hoa = mức 1–3, một bậc mỗi ngày (v87) | Cảnh sống đã có; còn thiếu mức 4 (dùng trong câu) |  |
| A5 | Ôn cách quãng bằng game | Mọi lượt ôn đến hạn có thể làm trong game | 8 | **8** | Vòng Chữ, Mỏ Chữ, Câu đố ngày, Xếp Khối lấy phần sắp quên trước; bộ não chọn game ưu tiên ôn | Ôn ngữ pháp / giao tiếp trong game chủ lực |  |
| A6 | Ngữ pháp bằng game | Ngữ pháp luyện tới mức dùng được (mức 4) trong game | 7 | **7** | Bài Câu (xếp câu, mức 3), Xưởng sửa câu (gõ lại câu đúng, mức 4) | Bài Câu tự chấm M = 5,9/10, cần làm hay hơn |  |
| A7 | Đọc hiểu bằng game | Đủ dạng bài đọc của đề tham chiếu, trong vỏ game | 6 | **6** | Thám tử (bảng manh mối, biên bản vụ án); câu hỏi vẫn lộ dạng trắc nghiệm | Thêm dạng bài theo đặc tả A2 Key |  |
| A8 | Nghe hiểu bằng game | Như trên cho Nghe | 6 | **6** | Đài phát thanh (cả bài, hai giọng), Quán Cà Phê (nghe khách + đáp đúng văn phong); cần máy có giọng đọc | Âm thanh soạn sẵn thay giọng máy để không phụ thuộc thiết bị |  |
| A9 | Viết bằng game | Viết đoạn được chấm đủ tin cậy, trong vỏ game | 5 | **5** | Thư gửi cư dân phố (v83): máy kiểm luật + tự chấm; chưa có AI nên độ tin cậy chỉ ở mức Vừa | Bài mẫu theo band để tự chấm sát hơn; AI chấm ở giai đoạn sau | cần AI chấm |
| A10 | Nói bằng game | Nói có phản hồi đáng tin, trong vỏ game | 4 | **4** | Karaoke, Robot phụ thuộc máy nghe giọng của trình duyệt; không có thì tự chấm | Dạng hỏi đáp kiểu phần thi Nói; giảm phụ thuộc trình duyệt | cần AI chấm |
| A11 | Phát âm bằng game | Phân biệt và nói đúng âm khó | 6 | **6** | Bắt Âm: nghe phân biệt cặp âm, vòng nói thử | Thêm trọng âm, nối âm |  |
| A12 | Kết luận đạt cấp bằng game | Trận cổng cuối khu dùng câu lạ để kết luận | 1 | **7** | v113: trận cổng A1, A2 (`gate.ts`, `gateview.ts`): câu lạ, chơi một lần, không đáp án trong trận, chữa bài sau. Chưa gắn vào chương truyện; B1+ chưa có cổng | Trận cổng (v113) |  |
| A13 | Đo hiệu quả học bằng game | Bộ câu giữ riêng nằm trong game | 2 | **7** | v114: bộ đo 12 câu thành "🎁 Kho báu ẩn" ở sảnh (`treasureview.ts`); xu theo số rương mở, không theo đúng sai | Kho báu ẩn (v114) |  |
| A14 | Chẩn đoán liên tục trong game | Dò phần chưa chắc ngay trong lượt chơi | 8 | **8** | Lượt "❓ Thử sức", câu dò trong game; ngân sách dò mỗi ngày | — |  |
| A15 | Màn chơi không dùng chữ thi / đề / kiểm tra | Không còn chữ nào như vậy trên đường chính | 4 | **8** | v112: thay chữ trên đường chính; `test/unit/engine-wording.test.ts` chặn từ cấm trong `src/engine`. Tab Học / Kỹ năng kiểu cũ (lối phụ) vẫn còn "Bài kiểm tra cấp" | Đổi lời theo truyện; ghi lại quy ước vào AUTHORING |  |
| A16 | Luật game không làm bẩn phép đo | Độ khó game tách khỏi câu hỏi; lượt đo không ép giờ | 8 | **8** | Tim, xúc xắc, hình khối độc lập với câu (P14), trừ đoán mò; trò cũ "Tốc độ 60 giây" vẫn ép giờ | Trò ép giờ không ghi bằng chứng mức cao |  |

## B · Đầu vào và mục tiêu: 4,3 → 7,3 / 10 (trọng số 10)

Kiểm: Mô hình học §1, §2.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Biết cấp hiện tại theo từng kỹ năng | Nghe, Đọc, Viết, Nói, từ vựng, ngữ pháp mỗi thứ một cấp ± sai số | 4 | **7** | v112: kết quả đầu vào hiện cấp từ vựng, ngữ pháp, và nghe / đọc khi thắp đèn Nghe + Đọc (tuỳ chọn, mặc định được mời) | Đoạn nghe + đoạn đọc trong chương mở đầu |  |
| B2 | Đầu vào ngắn | ≤ 15 phút, dừng khi đủ chắc | 8 | **8** | Bài dò 3–5 phút, tối đa 8 phần, dừng khi hội tụ | Giữ ≤ 15 phút khi thêm Nghe / Đọc |  |
| B3 | Mục tiêu do người học chọn (P1) | Người học chọn đích; app chỉ gợi ý | 4 | **8** | v112: chọn đích trong truyện, có mặc định | Lựa chọn trong truyện |  |
| B4 | Kịp hạn hay không | Có hạn thì báo số giờ cần và có kịp không | 3 | **7** | v111: đặt hạn ở trang mục tiêu → thẻ 🎯 báo "cần khoảng N phút mỗi ngày", cảnh báo khi quá 60 phút | Dùng cho CEFR khi người học đặt hạn ở hồ sơ |  |
| B5 | Phần đoán từ xếp lớp không thành Đạt giả | Phần suy ra tách khỏi Đạt thật, kiểm dần | 7 | **7** | Claim tách khỏi Đạt; bot L01: Claim sai giảm 66 → 14 sau 44 ngày | Xác nhận Claim nhanh hơn |  |
| B6 | Câu xếp lớp không làm hỏng câu đo sau | Câu dùng ở đầu vào không trùng câu trận cổng | 2 | **8** | v113: câu cổng soạn mới, đóng gói riêng (`mode: gate`, gói `gate`); test khẳng định không trùng id với kho luyện / xếp lớp | Chia kho khi soạn trận cổng |  |
| B7 | Đích chia thành chặng theo khu | Mỗi cấp là một khu có cổng; người học thấy mình đang ở khu nào, còn mấy khu | 2 | **6** | v113: thẻ 🎯 có thang khu (📍 khu đang ở, ✓ khu đã qua cổng). Các khu truyện (Chợ Sáng, Bến Cảng, Rừng Trúc) chưa gắn với cấp | Khu = cấp (v113) |  |

## C · Bản đồ và lộ trình: 6,3 → 7,0 / 10 (trọng số 10)

Kiểm: Mô hình học §3; Quyết định kỹ thuật §6.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Chỉ học phần còn thiếu | Đường đi tối thiểu theo đồ thị, bỏ qua phần đã biết | 8 | **8** | NBA theo đồ thị tiền đề, kiểm tra để bỏ qua, tiên nghiệm từ chẩn đoán | — |  |
| C2 | Truy gốc rễ lỗi | Sai lặp lại → tìm tiền đề hỏng, hiểu sai | 7 | **7** | Giả thuyết tiền đề (`hyp`), mẫu lỗi lặp (`mis`), bí kíp nhắm đúng hiểu sai | Báo gốc rễ rõ hơn cho người học |  |
| C3 | Ôn cách quãng | Ôn đúng lúc sắp quên, không ôn thừa | 8 | **8** | FSRS-5 theo mục; ngưỡng ôn đổi theo tỉ lệ đúng | — |  |
| C4 | Thời gian chơi chia theo phần đề còn hụt | Phút chơi tỉ lệ với phần làm rớt / đậu đề | 3 | **6** | v111: nhu cầu kỹ năng 56+20·hụt; từ A2 lộ trình ngày có 2/3 chặng là kỹ năng (A1 giữ 1/3 để xây nền), có unit test. Chưa đo bằng lượt chơi thật: bot hiện không đi theo bộ não chọn game | Bộ não chọn game cân theo hụt của đề tham chiếu |  |
| C5 | Dùng được ở câu mới (transfer) | Đúng ở câu lạ ngang câu đã gặp | 5 | **6** | v111: phần học tủ được đưa lên đầu lượt trùm của tháp (câu mới) | Đèn báo học tủ; thêm câu transfer |  |
| C6 | Bộ não chọn game | Một nút Chơi tiếp, lý do đúng nhu cầu | 7 | **7** | `director.ts`: 3 chặng / ngày, lý do theo nhu cầu, đổi dạng | Thêm nhu cầu "hụt theo đề" |  |

## D · Kết luận đạt và chống học tủ: 1,6 → 7,0 / 10 (trọng số 15)

Kiểm: Mô hình học §3 (chống học tủ), §4; mục "Đề sát hạch".

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Đạt = đậu câu lạ | Kết luận đạt chỉ từ trận cổng câu lạ | 1 | **7** | v113: với khu có cổng, Đạt trong app = qua trận cổng (`readinessOf`); bản đồ ghi rõ "chưa phải kết luận" | v113 |  |
| D2 | Kho câu lạ đủ lớn, cách ly | Mỗi cấp ≥ 2 đề song song, không lọt vào luyện tập | 2 | **5** | v113: mỗi cấp A1, A2 có 2 đề song song (21–22 câu, Đọc + Nghe), câu do AI soạn, qua `npm run content` nhưng **chưa qua vòng soát của người** và phép thử không có bài | Soạn đề A2 trước | cần người soát câu |
| D3 | Đèn báo học tủ | So đúng câu đã gặp với câu lạ, báo khi chênh | 2 | **8** | v111: `rote.ts` so câu đã gặp / câu lạ trên bộ đếm sẵn có, chỉ bật khi chênh ≥ 25 điểm và ≥ 2 lần sai số; mô phỏng 200 lần: bắt 98,5% bot vẹt, báo nhầm 2% bot học thật | Một phép tính trên số đã có |  |
| D4 | Xác suất đậu kèm sai số | P(đậu) theo IRT ± sai số, ngưỡng 80% | 1 | **7** | v113: P(qua) = Φ((θ − ngưỡng) / SE) từ IRT 3PL, có khoảng 80%; độ khó câu là ước tính của người soạn (chưa hiệu chỉnh) | Dùng lại cho trận cổng |  |
| D5 | Chốt dự đoán và đối chiếu | Ghi dự đoán trước, so với điểm thật | 3 | **7** | v113: ghi điểm đề mẫu / thi thật ở trang mục tiêu kèm P(qua) app có trước đó; hiện "app đoán đúng / sai" | Ở tuỳ chọn hồ sơ |  |
| D6 | Xác nhận ngoài là tuỳ chọn ở hồ sơ | Ai cần chứng chỉ mới thấy | 1 | **8** | v113: phần "🎓 Chứng chỉ" chỉ hiện khi người học bật | v113 |  |
| D7 | Trận cổng mở đúng lúc | Chỉ mở khi bản đồ báo gần đủ; không phí đề lạ | 1 | **7** | v113: cổng mở khi ≥ 70% kỹ năng của khu đã vững thật; đề đã mở tính là đã dùng | Luật mở cổng theo tham số cấu hình (v113) |  |

## E · Độ phủ đề tham chiếu (A2 Key): 4,0 → 4,7 / 10 (trọng số 10)

Kiểm: Mục "Đề sát hạch" (đặc tả bài tham chiếu).

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| E1 | Đọc | Đủ dạng bài đọc A2 Key, đúng độ khó | 5 | **5** | Văn bản đời thường A1–A2 (biển báo, thực đơn, tin nhắn…), bài của unit; chưa đối chiếu từng dạng bài với đặc tả | Bảng phủ theo dạng bài | cần soạn thêm nội dung |
| E2 | Viết | Đủ dạng bài viết A2 Key (tin nhắn ngắn, kể chuyện theo tranh) | 4 | **4** | Đề viết `WTASKS` theo cấp, máy kiểm luật; chưa có dạng kể chuyện theo tranh | Thêm dạng bài + bài mẫu | cần soạn thêm nội dung |
| E3 | Nghe | Đủ dạng bài nghe A2 Key | 5 | **5** | 525 câu thoại, nghe đoạn hai giọng, nhiều giọng, tiếng ồn; chưa đối chiếu dạng bài | Bảng phủ theo dạng bài | cần soạn thêm nội dung |
| E4 | Nói | Hỏi đáp và thảo luận cặp như phần thi Nói | 3 | **3** | Đóng vai, Karaoke, nói đáp từ ý tiếng Việt; không có dạng thảo luận cặp | Dạng bài hỏi đáp theo đặc tả | cần soạn thêm nội dung |
| E5 | Từ vựng và ngữ pháp | Đủ danh sách từ và ngữ pháp của cấp | 7 | **7** | 9.345 từ gắn cấp CEFR; ngữ pháp A1–C2; 28.114 câu gắn nút, 0 mồ côi (v67) | Đối chiếu với danh sách từ chính thức của bài tham chiếu |  |
| E6 | Số đề song song mỗi cấp | ≥ 2 đề lạ mỗi cấp | 0 | **4** | v113: A1 và A2 mỗi cấp 2 đề rút gọn (chưa đủ 5 phần Đọc, 5 phần Nghe như bài gốc; chưa có Viết, Nói trong cổng) | v113 | cần soạn thêm nội dung |

## F · Hiển thị tiến độ: 6,8 → 8,2 / 10 (trọng số 6)

Kiểm: Mục "Hợp đồng hiển thị tiến độ".

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | Mục tiêu đầu sảnh | Sảnh mở đầu bằng mục tiêu + tiến độ thật | 8 | **8** | Thẻ 🎯 Mục tiêu (v110). **Đang ở nhánh, chưa gộp vào bản chạy thật**; bản chạy thật = 2 | Gộp PR v110 |  |
| F2 | Màn kết nối ván với mục tiêu | Mọi màn kết có dòng 🎯 nói thật | 8 | **9** | v111: "⬆ Lên cấp" ở màn kết chỉ tính phần đạt đúng mức mục tiêu cần; mức thấp hơn báo "↗ Tiến một bậc" | Đổi chữ "Lên cấp" cho thống nhất |  |
| F3 | Bản đồ khác kết luận | Màn hình phân biệt rõ "đang học" với "đủ trình độ" | 3 | **8** | v113: thẻ 🎯 và trang mục tiêu ghi "bản đồ, chưa phải kết luận"; kết luận ở trận cổng | v113 |  |
| F4 | Không báo readiness bằng phần trăm | Báo bằng phần còn thiếu | 9 | **9** | Chip Sẵn sàng CEFR bỏ % (v110) | — |  |
| F5 | Thưởng game không lấn tiến độ thật | Xu, ★ không nổi hơn tiến bộ thật | 6 | **7** | v110–v113: mục tiêu, thang khu, cổng ở đầu sảnh; xu / Phố vẫn hiện ngay dưới | Gắn mở khu với trận cổng |  |

## G · Bằng chứng và dữ liệu: 7,6 → 8,0 / 10 (trọng số 8)

Kiểm: Mô hình học §6.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Kiến trúc bằng chứng tính lại được | Quan sát → bằng chứng → thống kê → mức thành thạo, tính lại được | 9 | **9** | 5 lớp L0–L4, Beta tính lại từ L2 (spec v2.4 §X–XII) | — |  |
| G2 | Gọn | Dữ liệu giữ theo giá trị, không phình theo thời gian | 8 | **8** | L0 7 ngày / 300; sổ 2.000 sự kiện dọn theo giá trị; 400 ảnh chụp; câu đã gặp băm 6 ký tự; ước tính < 1 MB (chưa đo thật) | Đo dung lượng thật trên máy người dùng |  |
| G3 | Giữ bằng chứng quan trọng | Bằng chứng quyết định không bị dọn | 8 | **9** | v113: kết quả cổng lưu riêng (`st.e.gg`), không bị dọn như sổ L1; gộp nhiều máy giữ lần làm sớm hơn | Kết quả trận cổng lưu tier cao nhất |  |
| G4 | Nhiều máy không mất, không đếm trùng | Gộp hai máy cho kết quả đúng | 8 | **8** | Bộ đếm chỉ tăng theo thiết bị (G-counter), có test gộp | — |  |
| G5 | Không mất dữ liệu | Có sao lưu mặc định hoặc nhắc rõ | 4 | **6** | v111: nhắc sao lưu ở màn kết ngay sau ván đầu tiên; bỏ nhắc khi đã bật đồng bộ. Đồng bộ vẫn là tuỳ chọn | Nhắc sao lưu sau ván đầu tiên / khi qua cổng |  |
| G6 | Giải thích được quyết định | Mọi kết luận quan trọng có "Vì sao?" | 8 | **8** | Ảnh chụp quyết định + màn "Vì sao?" (v54) | — |  |
| G7 | Quyền riêng tư | Không thu dữ liệu không cần | 8 | **8** | Không tài khoản, dữ liệu ở máy, chia sẻ ẩn danh tự chọn có kiểm tuổi | — |  |

## H · Trải nghiệm game: 5,2 → 5,2 / 10 (trọng số 9)

Kiểm: GAME-CRITERIA §10.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | Lõi game tự hấp dẫn | Bỏ tiếng Anh đi vẫn muốn chơi | 6 | **6** | Tự chấm M1: Vòng Chữ 7, Mỏ Chữ 7, Bài Câu 6 (GAME-CRITERIA §10); **chưa có người chơi thật chấm** | Buổi chơi thử theo PLAYTEST.md | cần người chơi thật |
| H2 | Cảm giác điều khiển | Vuốt, kéo thả mượt, chính xác | 7 | **7** | Canvas 60 fps, kéo thả có test trên 3 thiết bị | Kiểm bằng ngón tay thật |  |
| H3 | Mỹ thuật và âm thanh | Ngang game cùng thể loại | 5 | **5** | Cảnh sống, âm tự tạo; tự chấm M4 = 5–6 | — | cần người chơi thật |
| H4 | Lý do quay lại | Truyện, chuỗi ngày, sự kiện kéo người học về | 6 | **6** | Truyện 12 chương, sự kiện tuần, thử thách ngày, Phố | Gắn khu truyện với cấp CEFR |  |
| H5 | Dàn trải hay tập trung | Ít game, mỗi game sâu | 5 | **5** | 17 game; 13 game kỹ năng đã thu gọn | Gộp bớt theo số liệu chơi thật |  |
| H6 | Số liệu chơi thật | Có số liệu bỏ dở / chơi tiếp từ người thật | 2 | **2** | Chỉ đo trên máy; chưa có số liệu người thật trong repo | Sau buổi chơi thử | cần người chơi thật |

## I · Minh bạch và đạo đức: 8,0 → 8,3 / 10 (trọng số 3)

Kiểm: Tầm nhìn; luật 3 của "Game hoá".

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| I1 | Không dark pattern | Không trừ khi sai, không ép bằng nỗi sợ mất | 8 | **8** | Năng lượng trừ theo lượt chứ không theo lỗi; lượt đo không tốn năng lượng | — |  |
| I2 | Học ẩn nhưng xem được | Muốn xem thì thấy hết app ghi gì | 7 | **8** | v113: snapshot `GATE:PASS/FAIL`, `EXT:*`, `goal:STORY`, `lr` cho "Vì sao?" | Ghi rõ lượt nào là lượt đo |  |
| I3 | Nói thật giới hạn | Không hứa quá khả năng | 9 | **9** | Giới hạn thực tế ghi thẳng trong spec và trên màn hình (Viết / Nói chỉ tin cậy Vừa) | — |  |

## J · Kỹ thuật: 6,6 → 6,6 / 10 (trọng số 4)

Kiểm: Rủi ro đã ghi nhận.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| J1 | Test tự động | Mọi luật quan trọng có test | 9 | **9** | 285 test đơn vị, 244 test giao diện × 3 thiết bị (Android, iOS, máy tính), bot người học | — |  |
| J2 | Tốc độ mở app | Mở nhanh trên điện thoại rẻ | 4 | **4** | `app.js` 3,2 MB + engine 402 KB + đồ thị 986 KB | Tách và tải theo phần | cần tách app.js (lớn) |
| J3 | Chạy khi mất mạng | Học được không cần mạng | 8 | **8** | Service worker, bài học tải theo phần | — |  |
| J4 | Trợ năng | WCAG AA | 8 | **8** | Kiểm axe trên nhiều màn, 390 px | — |  |
| J5 | Dễ sửa | Mô-đun nhỏ, rõ ranh giới | 4 | **4** | `main.ts` 166 KB, `app.js` một khối lớn | Tách main.ts theo game | cần tách main.ts / app.js (lớn) |

## K · Kiểm chứng hiệu quả: 3,3 → 3,7 / 10 (trọng số 5)

Kiểm: Giới hạn thực tế; v2.4 §XXIII.

| # | Tiêu chí | Mốc 10 | Lần 1 | Lần 2 | Căn cứ | Để lên điểm | Trần |
| --- | --- | --- | --- | --- | --- | --- | --- |
| K1 | Mô phỏng người học | Bot nhiều kiểu người học chạy qua giao diện | 7 | **8** | v111: thêm mô phỏng bot học vẹt qua đường ghi bằng chứng thật (test đơn vị) | Bot "học vẹt" để thử đèn báo học tủ |  |
| K2 | Đo hiệu quả trên người thật | Có số đo trước / sau / trễ của người thật | 2 | **2** | Bộ đo có sẵn nhưng chưa có kết quả người thật trong repo | Người sáng lập học hằng ngày + kho báu ẩn | cần người học thật |
| K3 | Hiệu chỉnh bằng dữ liệu | Ngưỡng, độ khó câu chỉnh theo dữ liệu thật | 1 | **1** | Mọi tham số là giả định của người soạn (spec ghi rõ) | Cần nhiều người dùng | cần nhiều người dùng |

## Việc tiếp theo (theo lợi ích ÷ công sức)

| Việc | Nâng tiêu chí | Ai làm |
| --- | --- | --- |
| Soát 86 câu trận cổng (phép thử không có bài, `content/AUTHORING.md` mục 4) | D2, E | Người sáng lập + AI |
| Buổi chơi thử thật theo `docs/PLAYTEST.md` (thêm chương mở đầu, trận cổng, kho báu) | H1, H3, H6 | Người sáng lập |
| Học hằng ngày 2 tuần rồi mở kho báu lần 2 | K2 | Người sáng lập |
| Sửa bot người học để bấm "▶ Chơi tiếp" theo bộ não, đo C4 bằng lượt chơi thật | C4 | AI |
| Gắn khu truyện với cấp (chương cuối khu = trận cổng) | B7, A12 | AI |
| Trận cổng B1 + phần Viết trong cổng | E6, A12 | AI soạn, người soát |
| Tách `app.js` / `main.ts` | J2, J5 | AI, khi cần |

## Giới hạn của bảng chấm

- **Người chấm cũng là người viết phần lớn code (AI),** nên dễ chấm lệch về phía có lợi. Mọi điểm Lần 2 có căn cứ trong code / test, nhưng các nhóm H và K cần người thật xác nhận.
- **Trọng số do AI đề xuất,** người sáng lập duyệt.
- **Bot người học hiện đi lần lượt qua mọi game theo kịch bản,** không theo bộ não chọn game. Vì vậy tỉ lệ lượt chơi của bot (game chủ lực 9,7%, game kỹ năng 35,5% ở L01, 14 ngày) **không** đo được C4. C4 chỉ chấm theo lộ trình ngày mà bộ não xếp (unit test).
