# Biên bản soát đề thi thử: VSTEP Đề 2 (v2)

Ngày: 2026-10-02 · Phạm vi:
- **Nghe:** 35 câu = 8 thông báo + 3 hội thoại × 4 câu + 3 bài nói × 5 câu.
- **Đọc:** 40 câu, 4 bài × 10 câu, từ B1 lên C1.

## 1. Phép thử "không có bài" (8.5)

Mỗi vòng có 2 phiên AI. Mỗi phiên chỉ thấy câu hỏi và phương án, không thấy bài.

| Dạng | Vòng 1 | Vòng 2 | Bản phát hành | Ngẫu nhiên | Ngưỡng |
|---|---|---|---|---|---|
| Nghe phần 1 (thông báo) | 44% | 25% | 25% | 25% | ≤ 45% |
| Nghe phần 2 (hội thoại) | 63% | 42% | 42% (hội thoại 3 thử lại vòng 3: 13%) | 25% | ≤ 45% |
| Nghe phần 3 (bài nói) | 73% | 53% | 37% | 25% | ≤ 45% |
| Đọc | 78% | 51% | 34% | 25% | ≤ 45% |

**Gốc rễ của vòng 1:** đáp án luôn là phương án cụ thể và "đáng kể chuyện" nhất. Ví dụ: người trẻ thừa kế đồng hồ, học qua video. Các phương án nhiễu thì nhạt. Người đoán chỉ cần chọn chi tiết thú vị nhất.

**Vòng 2:** đã đảo đáp án sang điều bất ngờ. Người đoán lại học được mẹo "chọn điều bất ngờ mà hợp lý", nên Đọc vẫn 51%.

**Vòng 3** sửa đúng gốc rễ:
- bốn phương án cụ thể ngang nhau;
- trong mỗi bài, trộn câu có đáp án bình thường (nói thẳng trong bài) với câu có đáp án bất ngờ;
- phương án còn lại xuất hiện trong bài ở vai trò bẫy.

Bài học này đã ghi vào `content/AUTHORING.md` (mục "Đáp án đáng kể chuyện").

## 2. Soát độc lập có bài (8.5)

**Kết quả: 75/75 câu khớp đáp án.** Bên soát nêu một số chỗ diễn đạt có thể hiểu hai cách hoặc chưa chặt; đã sửa hết:

| Câu | Lời sau khi sửa |
|---|---|
| Đọc 1, câu 8 | "…most difficult part of running the club" |
| Đọc 2, câu 7 | "In paragraph 4, who supervises the students who arrive early?" |
| Đọc 3, câu 2 | "Which group of customers provides the largest share…" |
| Đọc 3, đoạn về Josh | Viết gọn đoạn văn; câu hỏi "How did Josh come to join the workshop?" |
| Đọc 4, đoạn 5 | Mở đoạn bằng "One common objection does not apply…" |
| Nghe 7 | "Which tour can visitors still join today?" |
| Nghe 13 | Phương án A: "interviews with managers" |
| Nghe 14, câu 3 | "What was the most common way teenagers said they choose books?" |

## 3. Kiểm tự động

`npm run content`: 0 lỗi cho v2. Đã kiểm:
- tổng 35 + 40 điểm;
- độ dài từng phần đúng chuẩn (bài nói phần 3 ≥ 280 từ);
- âm thanh đủ 14 phần;
- độ khó tăng dần, lệch so với Đề 1 trong ±0,25.

**Đã cân lại độ dài phương án.** Bản đầu có 21/40 câu Đọc mà đáp án là phương án dài nhất.

## 4. Giới hạn còn lại

- Mỗi số liệu đến từ 2 phiên AI, dao động khoảng ±5–10 điểm %.
- Độ khó `b` là ước tính của người soạn, chờ hiệu chuẩn bằng dữ liệu thật.
