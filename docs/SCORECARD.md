# Chấm điểm app theo Master Spec v2

## v44 — 03/10/2026: 5,1/10 (lõi engine 4,0/10)

Chấm 64 tiêu chí rút từ `docs/SPEC.md`, bằng chứng lấy từ code. Thang: 10 = đạt đúng spec, 5 = có một phần hoặc làm theo cách khác, 0 = chưa có. Chấm lại sau mỗi mốc M1–M8, thêm một mục mới lên đầu tệp.

| Nhóm | Số tiêu chí | Điểm |
| --- | --- | --- |
| L. Quyền riêng tư | 4 | 9,0 |
| K. Kỹ thuật và vận hành | 7 | 7,6 |
| I. Nội dung | 9 | 6,7 |
| E. Ôn duy trì | 3 | 6,0 |
| F. Sẵn sàng và đạt mục tiêu | 5 | 5,8 |
| G. Kỳ thi | 6 | 5,2 |
| C. Chẩn đoán | 4 | 5,0 |
| D. Gap và Learning Path | 6 | 4,2 |
| B. Trạng thái và mastery | 6 | 3,7 |
| H. Viết/Nói không AI | 4 | 3,0 |
| J. Động lực và kiếm tiền | 3 | 2,7 |
| A. Mục tiêu và đồ thị năng lực | 6 | 1,8 |
| M. Bằng chứng thực tế | 1 | 1,0 |
| **Tổng** | **64** | **5,1** |
| **Lõi engine (A–D, F)** | 27 | **4,0** |

Ba chỗ app đi ngược spec, khi xây phải thay chứ không chỉ thêm: tiến độ Can-Do tính theo số hoạt động đã làm (#12); học theo unit tuần tự (#18, #19); hai hệ ôn tập khác nhau, kiểu SM-2 ở học nền và FSRS ở ôn thi (#24). Khoảng trống nội dung lớn nhất: IELTS Viết/Nói (#33).

| # | Nhóm | Tiêu chí | Điểm | Bằng chứng |
| --- | --- | --- | --- | --- |
| 1 | A | Chọn mục tiêu (CEFR, IELTS, VSTEP, giao tiếp) | 5 | Chọn kỳ thi + band ở Ôn thi; CEFR ngầm theo cấp; chưa có mục tiêu giao tiếp |
| 2 | A | Target Model có phiên bản | 0 | Chưa có |
| 3 | A | Đồ thị năng lực, tiền đề cứng/mềm | 2 | 236 Can-Do là danh sách phẳng cấp × nhóm; unit nối tiếp |
| 4 | A | Nút dùng chung giữa các mục tiêu | 2 | Học nền (`st`) và ôn thi (`st.x`) tách rời |
| 5 | A | CI kiểm vòng lặp phụ thuộc | 0 | Chưa có đồ thị |
| 6 | A | Mục tiêu giao tiếp theo bối cảnh | 2 | Có nội dung rời (24 hội thoại mở, đóng vai, chuyển ý), chưa thành mục tiêu |
| 7 | B | 5 mức mastery | 4 | Từ vựng có nhận ra / nhớ ra / chính tả / ngữ cảnh / kết hợp; ngữ pháp, kỹ năng chưa |
| 8 | B | Nhiều bằng chứng, nhiều dạng câu | 4 | Từ vựng hỏi nhiều kiểu; unit qua bằng một bài thử thách ≥ 80% |
| 9 | B | Confidence riêng | 4 | Band ôn thi có sai số; học nền chưa |
| 10 | B | Mastery theo mục tiêu | 1 | Chưa có |
| 11 | B | Biết kiến thức ≠ làm được việc | 6 | Cấp theo kỹ năng cần bài kiểm tra cấp + bằng chứng Viết/Nói (`SK_EV`) |
| 12 | B | Không lấy "hoàn thành bài" làm tiến độ | 3 | Tiến độ Can-Do = tỉ lệ hoạt động đã làm (`cdRef`) |
| 13 | C | Chẩn đoán nhanh, ít chạm | 7 | Kiểm tra đầu vào IRT ≤ 15 phút, ≤ 3 chạm (Nghe/Đọc) |
| 14 | C | Hồ sơ theo kỹ năng | 7 | Band 4 kỹ năng riêng; bản đồ CEFR 4 kỹ năng |
| 15 | C | Truy gốc rễ qua tiền đề | 1 | Chưa có |
| 16 | C | Chẩn đoán từ vựng, ngữ pháp | 5 | Thi vượt cấp 30 câu, ngữ pháp 24 câu; chỉ mức cả cấp |
| 17 | D | Tính khoảng thiếu so với mục tiêu | 5 | Ôn thi có `gaps` theo kỹ năng; học nền chưa |
| 18 | D | Lộ trình động theo trạng thái | 4 | `mainAction`: làm dở → ôn → unit kế tiếp cố định |
| 19 | D | Đường đi tối thiểu | 3 | Chỉ bỏ qua được cả cấp |
| 20 | D | Kiểm tra để bỏ qua từng nút | 4 | Có ở mức cấp |
| 21 | D | Một "bước tiếp theo" rõ ràng | 8 | Một nút chính + kế hoạch hôm nay |
| 22 | D | Gộp nhiều mục tiêu | 1 | Chưa có |
| 23 | E | Tách học mới khỏi ôn duy trì | 7 | Hàng từ đến hạn, sổ lỗi sai riêng |
| 24 | E | Mô hình quên có cơ sở | 7 | FSRS-5 ở ôn thi; kiểu SM-2 tự hiệu chỉnh 87% ở học nền (hai hệ) |
| 25 | E | Ôn trượt quay lại lộ trình | 4 | Từ quên được ôn lại; unit đã qua không mở lại |
| 26 | F | Tách tiến độ khỏi sẵn sàng | 6 | Band ước tính tách khỏi tiến độ ở ôn thi |
| 27 | F | Ước tính có khoảng tin cậy | 6 | Nghe/Đọc khoảng 80%; Viết/Nói ±1 band |
| 28 | F | Điểm tổng đúng cách kỳ thi | 6 | `ieltsOverall`, `vstepLevel` |
| 29 | F | Đạt mục tiêu bằng điểm thật | 7 | Màn ghi điểm thật, gửi cặp ước tính – điểm thật |
| 30 | F | Kiểm chứng độ chính xác | 4 | Trang độ chính xác có, 0 cặp dữ liệu |
| 31 | G | IELTS Nghe/Đọc | 7 | 22 dạng, 4 đề, bảng quy đổi có nguồn |
| 32 | G | VSTEP Nghe/Đọc | 6 | 4 dạng, 3 đề, Quyết định 729 |
| 33 | G | IELTS Viết/Nói | 1 | Chưa có đề Task 1/2, Speaking Part 1–3 |
| 34 | G | VSTEP Viết/Nói | 5 | Thi thử, tự chấm 1–4 + máy kiểm tra hình thức |
| 35 | G | Số đề thi thử | 4 | 7/15 |
| 36 | G | Kế hoạch tới ngày thi, cảnh báo | 8 | `plan.ts` |
| 37 | H | Máy chấm luật | 6 | `perfEst` đúng cấp 75% với bài viết mẫu; dò lỗi, từ nối, tốc độ nói |
| 38 | H | Tự chấm theo bài mẫu chú thích band | 4 | Có bài mẫu, chưa chú thích theo band |
| 39 | H | Theo dõi độ lệch tự chấm | 0 | Chưa có |
| 40 | H | Giao diện người chấm chung | 2 | Chỉ nút chép sang AI ở v45 (nhánh riêng) |
| 41 | I | Kho từ vựng có cấp | 7 | 9.345 từ gắn cấp; ~5.150 từ có bài học, IPA, họ từ |
| 42 | I | Ngữ pháp theo cấp | 7 | ~154 điểm ngữ pháp A1–C2 |
| 43 | I | Nghe có âm thanh thật | 5 | 223 tệp mp3 ôn thi; học nền dùng giọng máy |
| 44 | I | Đọc | 7 | Văn bản đời thường A1–A2, bài dài B1–C2 |
| 45 | I | Phát âm | 6 | 26 cặp âm, máy nghe giọng, nói nhại |
| 46 | I | Chất lượng câu, chống đoán mò | 9 | `content/AUTHORING.md`, phép thử "không có bài" |
| 47 | I | Giải thích tiếng Việt từng phương án | 9 | Mọi câu ôn thi |
| 48 | I | Nội dung là dữ liệu | 5 | Ôn thi JSON + schema; học nền trong `app.js` |
| 49 | I | Bảng phủ nội dung | 5 | `coverage.md` cho ôn thi |
| 50 | J | Chuỗi ngày, XP, giải đấu, linh vật | 8 | Đủ |
| 51 | J | Năng lượng theo lượt | 0 | Gỡ ở v35 |
| 52 | J | Super, quảng cáo giả lập | 0 | Gỡ ở v35 |
| 53 | K | Mô-đun TypeScript có test | 5 | Ôn thi đạt; `app.js` một khối 3,8 MB |
| 54 | K | CI đầy đủ | 9 | Unit, e2e 3 trình duyệt, nội dung, tệp build khớp nguồn |
| 55 | K | Migrate dữ liệu có phiên bản | 9 | v1 → v18 không mất tiến độ |
| 56 | K | App shell ≤ 1 MB, máy yếu | 5 | Lighthouse 97 nhưng `app.js` 3,8 MB |
| 57 | K | Offline (PWA) | 9 | Có test |
| 58 | K | Trợ năng WCAG AA | 8 | Test axe |
| 59 | K | Màn hình 390px | 8 | Test không cuộn ngang |
| 60 | L | Lưu trên máy, không tài khoản (demo) | 10 | Đã làm |
| 61 | L | Đồng ý + kiểm tuổi (NĐ 13/2023) | 9 | Đã làm |
| 62 | L | Nói rõ máy nghe giọng | 9 | `privacy.html` |
| 63 | L | Sao lưu, đồng bộ bằng mã | 8 | Mã `ELK-…` |
| 64 | M | Có người dùng, dữ liệu thật | 1 | Supabase: 0 lượt trả lời, 0 cặp điểm thật, 6 bản đồng bộ |
