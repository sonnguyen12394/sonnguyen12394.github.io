# Biên bản soát đề thi thử: VSTEP Đề 3 (v3)

Ngày: 2026-10-02 · Phạm vi:
- **Nghe:** 35 câu = 8 thông báo + 3 hội thoại × 4 câu + 3 bài nói × 5 câu.
- **Đọc:** 40 câu, 4 bài × 10 câu, từ B1 lên C1.

## 1. Phép thử "không có bài" (8.5)

Mỗi vòng có 2 phiên AI. Mỗi phiên chỉ thấy câu hỏi và phương án, không thấy bài.

| Dạng | Vòng 1 | Vòng 2 | Bản phát hành | Ngẫu nhiên | Ngưỡng |
|---|---|---|---|---|---|
| Nghe phần 1 (thông báo) | 13% | 19% | 19% | 25% | ≤ 45% |
| Nghe phần 2 (hội thoại) | 50% | 33% | 33% | 25% | ≤ 45% |
| Nghe phần 3 (bài nói) | 63% | 17% | 17% | 25% | ≤ 45% |
| Đọc | 86% | 43% | 35% (bài 4 viết lại, thử vòng 3: 40%) | 25% | ≤ 45% |

**Gốc rễ của vòng 1.** Phần 1 đạt ngay vì được soạn đúng quy trình: câu hỏi và phương án trước, chọn đáp án không mặc định, rồi mới viết bài. Phần 2, phần 3 và Đọc trượt vì viết bài trước, rồi rút câu hỏi từ bài. Hệ quả:
- **Cả bộ câu thành bản tóm tắt luận điểm của bài.** Ví dụ, bài về người dịch: "khó nhất là chi tiết văn hoá", rồi "giữ chi tiết, để tranh giải thích". Đọc 10 câu là đoán ra luận điểm, từ đó suy ra từng đáp án.
- **Mẫu "người ta tưởng X, thật ra Y" lặp lại,** mà Y luôn là phương án "thông minh", hợp chủ đề.
- **Câu từ vựng dùng từ một nghĩa** (offer, reluctant, takes for granted), nên ai cũng đoán đúng.

**Vòng 2 viết lại từ bảng câu hỏi:**
- mỗi bài có 4–5 câu chi tiết trung tính (số, người, nơi, thứ tự);
- ít nhất 2 câu có đáp án đi ngược luận điểm chính;
- không để hai câu cùng kể một mạch;
- câu từ vựng dùng từ đa nghĩa (figure, straight, fair).

**Vòng 3.** Đọc bài 4 vẫn có 6/10 câu bị cả hai phiên đoán đúng, vì mạch "buổi tối, xe buýt" nối nhiều câu. Đã viết lại đoạn 1, 2 và 3 câu hỏi; bài 4 còn 40%.

Bài học này đã ghi vào `content/AUTHORING.md`.

## 2. Soát độc lập có bài (8.5)

**Kết quả: 75/75 câu khớp đáp án.** Bên soát không thấy câu nào có hai đáp án, không có đáp án, cần kiến thức ngoài bài, hay để lộ đáp án câu khác. Bên soát góp ý 4 chỗ nhỏ, đã sửa hết:

| Câu | Góp ý | Xử lý |
|---|---|---|
| Nghe 22 (đèn đường) | "Giảm nhẹ" gần với phương án "hầu như không đổi" | Bài nói: "a clear fall, of about ten per cent"; phương án đổi thành "fell/rose noticeably" |
| Nghe 30 (thời gian chờ) | Phương án "hai thay đổi cùng lúc" là điểm yếu thật của nghiên cứu, dù người nói không nêu | Đổi thành "The study lasted only one week." |
| Đọc 3, câu 10 | Phương án nhiễu ở thì hiện tại nghe như vẫn đúng | Đổi thành "Foreign publishers now pay all the printing costs." |
| Đọc 1, đoạn 2 | "His first figure…" chưa tự nhiên | "The first figure he got, from a quick survey…" |

## 3. Kiểm tự động

`npm run content`: 0 lỗi cho v3. Đã kiểm:
- tổng 35 + 40 điểm;
- độ dài từng phần đúng chuẩn;
- âm thanh đủ 14 phần;
- độ dài phương án không lộ đáp án;
- độ khó tăng dần, lệch so với Đề 1–2 trong ±0,25.

## 4. Giới hạn còn lại

- Mỗi số liệu đến từ 2 phiên AI, dao động khoảng ±5–10 điểm %.
- Câu từ vựng trong ngữ cảnh vẫn dễ đoán hơn các dạng khác (bài 1 và bài 2 mỗi bài có 1 câu).
- Độ khó `b` là ước tính của người soạn, chờ hiệu chuẩn bằng dữ liệu thật.
