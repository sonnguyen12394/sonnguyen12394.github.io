# Biên bản soát đề thi thử: IELTS Academic Đề 1 (a1) và VSTEP Đề 1 (v1)

Ngày: 2026-10-02 · Phạm vi: 155 câu (a1: Nghe 40 điểm, Đọc 40 câu; v1: Nghe 35 câu, Đọc 40 câu). Quy trình theo `content/AUTHORING.md`.

## 1. Phép thử "không có bài" (8.5)

Câu hỏi và phương án được dán thẳng vào lời nhắc của phiên AI mới, cấm dùng công cụ. Từ vòng 2, mỗi vòng có hai phiên độc lập, chạy trên hai mô hình khác nhau. Câu điền từ không áp dụng.

| Dạng | Bản nháp (1 phiên) | Bản phát hành (2 phiên) | Ngẫu nhiên | Ngưỡng |
|---|---|---|---|---|
| IELTS Nghe – trắc nghiệm 3 phương án | 67% | 20% | 33% | ≤ 55% |
| IELTS Nghe – nối thông tin | 50% | 40% | 14% | ≤ 45% |
| IELTS Đọc – TRUE/FALSE/NOT GIVEN | 86% | 21% | 33% | ≤ 55% |
| IELTS Đọc – chọn tiêu đề | 50% | 17% | 11% | ≤ 45% |
| IELTS Đọc – nối đặc điểm | 75% | 25% | 33% | ≤ 55% |
| IELTS Đọc – tóm tắt chọn từ khung | 100% | 17% | 10% | ≤ 45% |
| IELTS Đọc – trắc nghiệm 4 phương án | 100% | 40% | 25% | ≤ 45% |
| IELTS Đọc – YES/NO/NOT GIVEN | 100% | 40% | 33% | ≤ 55% |
| IELTS Đọc – nối nửa câu | 100% | thay bằng hoàn thành câu (điền từ) | | |
| VSTEP Nghe phần 1 | 50% | 31% | 25% | ≤ 45% |
| VSTEP Nghe phần 2 | 75% | 33% | 25% | ≤ 45% |
| VSTEP Nghe phần 3 | 87% | 37% | 25% | ≤ 45% |
| VSTEP Đọc | 93% | 34% | 25% | ≤ 45% |
| **Tổng** | **81%** (101/124) | **31%** (75/240 lượt) | | |

Số liệu Nghe lấy từ vòng 2, số liệu Đọc từ vòng 3, đều là bản phát hành. Riêng câu 16 IELTS Nghe được đổi đáp án sau vòng 2.

## 2. Gốc rễ (bài học mới so với v42)

1. **Chi tiết trong bài vẫn mặc định.** Bản nháp viết phương án nhiễu đúng quy tắc, nhưng bản thân bài lại chứa điều "thường đúng ngoài đời": khoan để treo kệ, phí 10 bảng mỗi năm, gia đình mượn lều, xe đạp sửa ở phòng có cửa lớn.
   - Chỉ sửa phương án mà giữ nguyên bài: VSTEP Đọc vẫn 18/20.
   - Đổi chính chi tiết trong bài sang điều không mặc định, phương án mặc định thành bẫy được nhắc trong bài: còn 4/20.
2. **Mạch truyện của cả bộ câu.** Mười câu của một bài, gộp lại, kể lại câu chuyện; đáp án đúng ăn khớp với nhau. Phương án nhiễu nay lấy từ chính bài, ở vai trò khác: người khác, thời điểm khác, điều đã thử rồi bỏ.
3. **Thứ tự danh sách lộ đáp án.**
   - Danh sách tiêu đề và danh sách nhà nghiên cứu xếp đúng thứ tự xuất hiện trong bài; đã xáo lại.
   - Tên phòng trong câu nối gợi công dụng ("Roof Garden" → ăn uống); đã đổi sang tên trung tính.
4. **Câu nối nửa câu ghép được theo nghĩa.** Mỗi nửa đầu chỉ hợp với một nửa sau, nên đoán đúng 100%. Đề 1 thay bằng hoàn thành câu (điền từ); các đề sau phải thiết kế để mỗi nửa đầu hợp ngữ pháp với nhiều nửa sau.
5. **Câu lập trường trong bài nghị luận** (tác giả nghĩ gì) đoán được từ mạch lập luận. Đã chuyển sang hỏi chi tiết, ví dụ, số liệu trong bài.
6. **Lỗi công cụ.** `blind-score` so đáp án số La Mã phân biệt hoa thường, nên chọn tiêu đề luôn bị chấm 0%. Đã sửa.

## 3. Soát độc lập có bài (8.5)

Một phiên AI khác chỉ đọc tệp xuất (bài, lời thoại, câu hỏi; không có đáp án, không có giải thích) và tự làm.

**Kết quả: 153/153 câu khớp đáp án** (`tools/review-compare.mjs`). 6 điểm bên soát nêu, đều đã sửa:

| Câu | Vấn đề | Sửa |
|---|---|---|
| a1 Đọc bài 2, đoạn A | Tiêu đề nhiễu iv gần nghĩa với đáp án iii | Đổi iv thành "Why boredom is more common than ever" |
| a1 Đọc bài 3, câu Có/Không về phiếu sửa chữa | Đó là ý của người phê bình, không phải của tác giả | Thay bằng mệnh đề tác giả nói rõ (việc giảm thuế không phải thất bại → NO) |
| a1 Nghe câu 17–18 | "Trong tháng đầu" chưa rõ với buổi hướng dẫn an toàn | Lời thoại nói rõ "During that month…"; tạo lại âm thanh |
| v1 Đọc bài 2, câu 4 | "for decades" lẫn với "twenty years" | Đổi thành "for a few years" |
| v1 Đọc bài 2, đoạn cuối | Câu về giá nhà không hợp lập luận | Viết lại: Linmouth ít công ty lớn khác |
| Câu điền | Cách viết khác: £28, labor, gray, maker's, experts | Thêm cách viết được chấp nhận hoặc giải thích vì sao sai |

## 4. Kiểm tự động

`npm run content`: 0 lỗi. Luật đề thi thử (`checkMock`):
- tổng điểm và điểm từng phần đúng định dạng;
- độ dài từng phần;
- độ khó tăng dần trong đề;
- id câu theo phần;
- phần nào cũng thuộc một đề.

Luật cân bằng giữa các đề (lệch ≤ 0,25 band so với trung bình) bắt đầu có tác dụng khi có đề thứ hai cùng kỳ thi.

## 5. Giới hạn còn lại

- Mỗi số liệu ở bảng trên đến từ 2 phiên AI, dao động khoảng ±5–10 điểm %. Với dạng có ít câu (tóm tắt 3 câu, nối đặc điểm 4 câu), một câu đổi kết quả là đổi khoảng 15–25 điểm %.
- Độ khó `b` là ước tính của người soạn, chờ hiệu chuẩn bằng dữ liệu thật (5.4, 5.5).
- Giọng đọc: Kokoro chỉ có giọng Anh và Mỹ; chưa có giọng Úc (6.6).
