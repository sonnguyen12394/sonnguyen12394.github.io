# Trận cổng (đề sát hạch cấp)

Mỗi cấp có 2 đề song song (Đọc + Nghe, 21–22 câu), dùng một lần cho mỗi người học. Đặc tả: `docs/SPEC.md`, mục "Đề sát hạch". Đề do AI soạn, **chưa qua vòng soát của người**: người sáng lập cần đọc lại cả 86 câu trước khi coi kết quả trận cổng là kết luận đạt cấp.

| Đề | Cấp | Câu |
| --- | --- | --- |
| `a1-1.json`, `a1-2.json` | A1 | 21 + 21 |
| `a2-1.json`, `a2-2.json` | A2 | 22 + 22 |

## Phép thử "không có bài"

Một agent độc lập (không đọc repo) chỉ thấy câu hỏi và phương án, không thấy bài đọc hay lời thoại, rồi đoán. Câu đoán trúng nhiều là câu lộ đáp án. Ngưỡng nghiệm thu với 3 phương án: ≤ 55% (ngẫu nhiên 33%).

Cách chạy: `node tools/blind-export.mjs --gate > out.txt`, đưa cho agent, lưu JSON `{id: "A/H"}`, rồi `node tools/blind-score.mjs phien1.json phien2.json`.

| Vòng | Đọc (pl-r) | Nghe (pl-l) | Đã sửa sau vòng này |
| --- | --- | --- | --- |
| 1 (1 phiên) | 37/54 = 69% | 22/32 = 69% | Đáp án xoay vòng A→B→C bị đoán ra → xếp vị trí ngẫu nhiên cân bằng. Câu trả lời được bằng lẽ thường → viết lại để đáp án phụ thuộc bài. |
| 2 (2 phiên) | 53/108 = 49% | 35/64 = 55% | Phương án đúng "trùng ý với hai phương án kia", phương án "không ai nhắc" lộ → viết lại 15 câu nghe để cả 3 phương án đều được nhắc trong lời thoại (như đề Cambridge). |
| 3 (2 phiên, chỉ Nghe) | (không đổi: 49%) | 9/64 = 14% | — |

Vòng 3 thấp hơn mức ngẫu nhiên: lẽ thường giờ dẫn tới phương án nhiễu. Người chưa nghe hiểu sẽ không đoán trúng, nhưng người hiểu được một phần có thể dễ sa bẫy hơn ở đề thật. Người soát nên xem các câu nghe có quá "bẫy" không.

Các phiên đoán đều do cùng một loại mô hình AI, nên kết quả giữa các phiên có tương quan. Phép thử này chỉ bắt được câu lộ đáp án, không thay được vòng soát của người.
