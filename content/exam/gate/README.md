# Trận cổng (đề sát hạch cấp)

Cấp A1, A2 có 4 đề song song (từ v134), B1 có 2 đề; mỗi đề Đọc + Nghe, 21–24 câu, dùng một lần cho mỗi người học. Đặc tả: `docs/SPEC.md`, mục "Đề sát hạch". Đề do AI soạn, **chưa qua vòng soát của người**: người sáng lập cần đọc lại cả 134 câu (86 câu A1 / A2 + 48 câu B1) trước khi coi kết quả trận cổng là kết luận đạt cấp.

| Đề | Cấp | Câu |
| --- | --- | --- |
| `a1-1.json`, `a1-2.json` | A1 | 21 + 21 |
| `a2-1.json`, `a2-2.json` | A2 | 22 + 22 |
| `a1-3.json`, `a1-4.json` | A1 | 21 + 21 (v134) |
| `a2-3.json`, `a2-4.json` | A2 | 22 + 22 (v134) |
| `b1-1.json`, `b1-2.json` | B1 | 24 + 24 (v116, rút gọn theo B1 Preliminary) |

## Phép thử "không có bài"

Một agent độc lập (không đọc repo) chỉ thấy câu hỏi và phương án, không thấy bài đọc hay lời thoại, rồi đoán. Câu đoán trúng nhiều là câu lộ đáp án. Ngưỡng nghiệm thu với 3 phương án: ≤ 55% (ngẫu nhiên 33%).

Cách chạy: `node tools/blind-export.mjs --gate > out.txt`, đưa cho agent, lưu JSON `{id: "A/H"}`, rồi `node tools/blind-score.mjs phien1.json phien2.json`.

### A1 / A2

| Vòng | Đọc (pl-r) | Nghe (pl-l) | Đã sửa sau vòng này |
| --- | --- | --- | --- |
| 1 (1 phiên) | 37/54 = 69% | 22/32 = 69% | Đáp án xoay vòng A→B→C bị đoán ra → xếp vị trí ngẫu nhiên cân bằng. Câu trả lời được bằng lẽ thường → viết lại để đáp án phụ thuộc bài. |
| 2 (2 phiên) | 53/108 = 49% | 35/64 = 55% | Phương án đúng "trùng ý với hai phương án kia", phương án "không ai nhắc" lộ → viết lại 15 câu nghe để cả 3 phương án đều được nhắc trong lời thoại (như đề Cambridge). |
| 3 (2 phiên, chỉ Nghe) | (không đổi: 49%) | 9/64 = 14% | — |

Vòng 3 thấp hơn mức ngẫu nhiên: lẽ thường giờ dẫn tới phương án nhiễu. Người chưa nghe hiểu sẽ không đoán trúng, nhưng người hiểu được một phần có thể dễ sa bẫy hơn ở đề thật. Người soát nên xem các câu nghe có quá "bẫy" không.

### B1 (v116)

| Vòng | Đọc (pl-r) | Nghe (pl-l) | Đã sửa sau vòng này |
| --- | --- | --- | --- |
| 1 (2 phiên) | 49/60 = 82% | 28/36 = 78% | Đáp án thường là phương án "hợp lý nhất"; ô điền từ lộ qua cụm từ quen (made a decision, took part, miss the chance) → viết lại cả 48 câu: phương án nhiễu hợp lý ngang đáp án, ô điền từ để cả ba phương án đều là cụm có thật và nghĩa trong bài quyết định. |
| 2 (2 phiên) | 17/60 = 28% | 3/36 = 8% | Nghe thấp xa mức ngẫu nhiên cũng là mẹo: chọn phương án "kém hợp lý nhất" là trúng → đổi 4 câu nghe để đáp án trùng phương án hợp lý. |
| 2, chấm lại theo đáp án mới | 17/60 = 28% | 11/36 = 31% | — (chấm lại câu đoán của vòng 2 theo nội dung phương án, chưa chạy phiên mới) |

Bài học cho người soạn: đích nên là gần mức ngẫu nhiên (33%), không phải càng thấp càng tốt.

Các phiên đoán đều do cùng một loại mô hình AI, nên kết quả giữa các phiên có tương quan. Phép thử này chỉ bắt được câu lộ đáp án, không thay được vòng soát của người.

## v134 (15/10/2026): soát chéo cả 8 đề A1 / A2 + 4 đề mới

**Soát chéo có bài** (theo SPEC mục 20; người sáng lập không xem đề): một phiên AI độc lập chỉ thấy bài và câu hỏi, tự làm lại cả 172 câu A1 / A2 (`tools/review-export.mjs` → `review-compare.mjs`). Kết quả: **khớp 100% đáp án** ở cả 8 đề. Phiên soát nêu vài câu có thể bảo vệ hai đáp án hoặc lời gượng; đã sửa:
- a1-2: "Open every day from Thursday to Tuesday" → "Open from Thursday to Tuesday".
- Đề mới: 2 chỗ điền có hai từ hợp (so / but, and / but), 1 lời thoại tự mâu thuẫn, 1 câu thiếu người mua, ghi chú về "half price".

**Phép thử không có bài cho 4 đề mới** (2 phiên mỗi vòng, tỉ lệ đúng theo từng đề và kỹ năng):

| Đề | Vòng 1 Đọc / Nghe | Vòng 2 | Vòng 3 |
| --- | --- | --- | --- |
| a1-3 | 65% / 56% | 27% / 69% | 31% / 38% |
| a1-4 | 77% / 69% | 38% / 75% | 38% / 25% |
| a2-3 | 57% / 50% | 50% / 50% | 39% / 19% |
| a2-4 | 61% / 69% | 50% / 88% | 46% / 31% |
| Tổng | — | 52% | **35%** (ngẫu nhiên 33%) |

Đã sửa giữa các vòng:
- **Đọc:** nhiều câu đoán được bằng lẽ thường (cấm cho khỉ ăn, ngân hàng đóng Chủ nhật, quán có đồ nguội lúc 4 giờ). Đã đảo dữ kiện cho ngược lẽ thường: được cho khỉ ăn trái cây nhưng cấm chụp đèn flash; ngân hàng đóng thứ Hai. Đã bỏ chỗ câu này lộ câu kia, ví dụ câu "dạy Lan bơi" làm lộ "buổi sáng đi bơi".
- **Nghe:** từ "now / today" trong câu hỏi luôn báo đáp án là giá trị đã đổi; nay vài câu có đáp án là giá trị giữ nguyên. Các phương án số có quan hệ cộng trừ (20, 2 → 18; 6 + 9 = 15) nay đã bỏ. Bài lớp nhảy có chữ "free" lặp ở ba câu nên đã viết lại.

Cùng loại mô hình AI nên các phiên có tương quan; phép thử chỉ bắt câu lộ đáp án. **Độ khó câu (b) vẫn là ước đoán của người soạn**, chưa hiệu chỉnh bằng dữ liệu người học.
