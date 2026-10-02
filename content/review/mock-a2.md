# Biên bản soát đề thi thử: IELTS Academic Đề 2 (a2)

Ngày: 2026-10-02 · Phạm vi: Nghe 40 điểm, Đọc 40 câu. Quy trình theo `content/AUTHORING.md`.

## 1. Phép thử "không có bài" (8.5)

Câu hỏi và phương án được dán thẳng vào lời nhắc của phiên AI mới, cấm dùng công cụ. Mỗi vòng có hai phiên độc lập trên hai mô hình khác nhau. Câu điền từ không áp dụng.

| Dạng | Vòng 1 (bản nháp) | Bản phát hành | Ngẫu nhiên | Ngưỡng |
|---|---|---|---|---|
| Nghe – điền nhãn bản đồ | 0% | 0% | 13% | ≤ 45% |
| Nghe – trắc nghiệm 3 phương án | 40% | 40% | 33% | ≤ 55% |
| Đọc – tìm đoạn chứa thông tin | 20% | 20% | 14% | ≤ 45% |
| Đọc – nối nửa câu | 50% | 0% | 17% | ≤ 45% |
| Đọc – trắc nghiệm 4 phương án | 88% | 13% | 25% | ≤ 45% |
| Đọc – YES/NO/NOT GIVEN | 90% | 20% | 33% | ≤ 55% |
| Đọc – nối người với ý kiến | 20% (vòng 2: 80%) | 0% | 25% | ≤ 45% |
| Nghe – chọn hai đáp án (tính theo điểm) | 38% | 38% | 40% | ≤ 60% |
| Đọc – chọn hai đáp án (tính theo điểm) | 63% | 38% | 40% | ≤ 60% |
| **Tổng** | **45%** (36/82 điểm) | **18%** (15/82 điểm) | | |

- Nghe và Đọc bài 1 lấy số liệu vòng 1, vì không sửa.
- Nối nửa câu lấy số liệu vòng 2. Đọc bài 3 lấy số liệu vòng 3.
- Dạng chọn hai đáp án lấy số liệu vòng cuối. Trước vòng này, `blind-export` chưa xuất dạng này; nay đã bổ sung. Mỗi chữ đúng tính một điểm, như đề thật; ngưỡng bằng mức ngẫu nhiên cộng 20 điểm %.

## 2. Gốc rễ và cách sửa

1. **Bài nghị luận (bài 3): đáp án khớp mạch chủ đề.** Bài nói về những quy định "hoá thạch" mà không ai nhớ lý do. Người đoán chỉ cần chọn phương án hợp chủ đề là đúng: "kiểm toán viên từng hỏi thêm bản", "hãng bay quên lý do", "Vance khuyên kể chuyện".
   - Sửa: đổi chính chi tiết trong bài sang điều không mặc định. In ba bản vì khách hay làm mất bản của mình; kiểm toán viên chỉ ghi nhận việc đó về sau. Bệnh viện bỏ danh mục thì sai sót tăng ở ca đêm, còn điều dưỡng *không* tự ghi danh sách. Người phát hiện lỗ hổng là học viên.
   - Phương án "hiển nhiên" ở lại trong bài, trong vai bẫy.
2. **Sửa một dạng làm lộ dạng khác.** Sau vòng 2, câu nối người với ý kiến từ 20% lên 80%. Lý do: các câu mới cho biết ai bàn chuyện gì ("Vance nói gì về kèm cặp", "ước tính của Mori").
   - Sửa: mỗi người nói một ý mà người đoán sẽ gán cho người khác. Ý "hoá thạch có ở khắp nơi" là của Leclerc, không phải của Mori, người đi đếm quy định. Ý "câu chuyện nhớ lâu hơn chỉ dẫn" là của Rossi, không phải của Vance.
   - Bài học đã ghi vào `AUTHORING.md`: luôn thử cả bộ câu của một bài cùng lúc.
3. **Chọn hai đáp án về tường cũ và rãnh thoát nước (bài 2): kiến thức kỹ thuật có thật.**
   - Ở bản đầu, phương án đúng chính là hiểu biết phổ thông: tường thẳng đứng phản sóng làm trôi cát. Bản sửa thứ nhất vẫn để lộ: cửa xả tự đóng khi triều lên, có ba cửa xả.
   - Sửa: hỏi về rãnh thoát nước và đổi chính chi tiết trong bài. Chỉ có một cửa xả, đóng mở bằng tay vì cửa tự động dễ kẹt sỏi; bài nói rõ không có máy bơm.
   - Phương án đúng là những ý "khiêm tốn" (khuất tầm nhìn, đóng mở bằng tay). Phương án cụ thể, mang tính kỹ thuật (ba cửa xả, máy bơm) là bẫy.
4. **Nối nửa câu:** "dừng thi công vì giao hàng chậm" và "dùng đá vì có sẵn" là cặp hiển nhiên.
   - Sửa: đổi lý do thật. Dừng thi công vì sợ bão làm hỏng phần đang xây, còn sỏi thì đã tới sớm. Dùng đá vì điều kiện quy hoạch về dáng vẻ; tường cũ vốn bằng bê tông.
   - Mỗi nửa đầu hợp với ít nhất hai nửa sau.

## 3. Soát độc lập có bài (8.5)

Một phiên AI khác chỉ đọc tệp xuất (bài, lời thoại, câu hỏi; không có đáp án, không có giải thích) và tự làm.

**Kết quả: 75/76 câu khớp đáp án** (`tools/review-compare.mjs`). Câu khác duy nhất là cách viết "a ball of string", nay đã nhận "ball of string" (3 từ, trong giới hạn từ).

Những điểm bên soát nêu và cách xử lý:

| Câu | Vấn đề | Xử lý |
|---|---|---|
| Đọc bài 1, câu 9 | Cụm trong bài ("patients recovering from heart operations") vượt giới hạn 3 từ; chỉ còn "patients", nên câu yếu | Đổi câu hỏi: "What kind of operation…" → heart operations |
| Đọc bài 1, câu 7 | "ball of string" cũng đúng | Thêm vào cách viết được chấp nhận |
| Nghe Phần 2, câu 18 | Phương án "only near the car park" diễn đạt lỏng: chó còn được đi đoạn đầu lối đi | Đổi thành "only near the car park and the first path" |
| Nghe câu 23, câu 38 | "floods/flood", "delivery" | Thêm vào cách viết được chấp nhận |
| Đọc bài 2, câu 14 | Nhãn sơ đồ: "bank" (bờ dốc) cũng hợp lý | Chấp nhận cả "shingle" và "bank" |
| Số viết bằng chữ hay chữ số, có hay không mạo từ, harbour/harbor | | Đã được nhận (soát lại bằng `review-compare`: chỉ 1 câu khác) |
| Đọc bài 1, câu 13 | "photos" | Không nhận: đề yêu cầu từ trong bài ("photographs") |

## 4. Kiểm tự động

`npm run content`: 0 lỗi. Luật đề thi thử:
- tổng điểm và điểm từng phần;
- độ dài: Nghe 458–482 từ, Đọc 661–813 từ;
- độ khó tăng dần;
- cân bằng với Đề 1: Nghe 6,10 so với 6,15; Đọc khoảng 6,6 so với 6,53 (lệch ≤ 0,25).

## 5. Giới hạn còn lại

- Mỗi số liệu ở bảng trên đến từ 2 phiên AI, dao động khoảng ±5–10 điểm %.
- Độ khó `b` là ước tính của người soạn, chờ hiệu chuẩn bằng dữ liệu thật (5.4, 5.5).
