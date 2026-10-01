# Hướng dẫn soạn câu trắc nghiệm

Rút ra từ đợt soát v41–v42. Trước v42, một phiên AI chỉ thấy câu hỏi và phương án, không có bài, vẫn đúng 79% (ngẫu nhiên ≈ 25%). Mọi câu mới (kể cả đề thi thử) phải theo hướng dẫn này.

## 1. Gốc rễ của việc đoán mò

1. **Bài quá "điển hình".** Bài do máy viết thường chứa sự thật mặc định: trẻ em bơi cùng người lớn, mùa thi thư viện mở muộn, tình nguyện viên dạy tiếng Anh. Người đoán chỉ cần chọn điều "thường đúng ngoài đời".
2. **Phương án sai phi lý hoặc cực đoan** ("completely", "only", "all"). Đáp án thì là phương án ôn hoà, cụ thể nhất.
3. **Hội tụ.** Viết phương án sai bằng cách sửa một chi tiết của đáp án ("brother / sister", "15 / 25 chỗ"), nên đáp án là "tâm" của các phương án.
4. **Dài nhất, vị trí, chép nguyên văn.** Đáp án dài nhất, hay rơi vào một vị trí, hoặc lặp đúng chữ trong bài.

## 2. Quy tắc

- **Chi tiết trong bài không mặc định.** Điều bài nói phải hợp lý nhưng không phải điều ai cũng đoán được. Đáp án "điển hình" trở thành phương án nhiễu, tốt nhất được nhắc trong bài như một cái bẫy ("People assume I wanted to save my family's land, but…").
- **Mỗi phương án sai đều hợp lý khi chưa đọc bài,** và sai vì một chi tiết cụ thể trong bài. `wrong` nói rõ chi tiết đó bằng tiếng Việt.
- **Phương án đồng loại và cân bằng.** Cùng kiểu, cùng mức chi tiết, cùng giọng. Dùng thiết kế 2×2 (ví dụ: muộn/huỷ × thời tiết/tín hiệu), hoặc dãy số mà đáp án không luôn ở giữa. Không có phương án "tâm".
- **Bài có kiến thức thật** (khoa học, lịch sử): không bịa số liệu về thế giới thật. Hỏi chi tiết riêng của bài (ví dụ của người nói, khảo sát địa phương, trình tự lập luận), không hỏi điều sách giáo khoa nào cũng có.
- **Đáp án diễn đạt lại**, không chép nguyên cụm dài từ bài, nhất là ở B2 trở lên.
- **Câu hỏi bỏ lửng** (không có "?") thì phương án phải nối tiếp được câu đó.
- **Ghi cấp độ theo độ khó thật của câu**, không theo độ khó của bài. Câu C1 phải có suy luận, thái độ hoặc chức năng đoạn văn.

## 3. Kiểm tra tự động (`npm run content`, chặn CI)

| Luật | Bắt lỗi gì |
|---|---|
| `checkKeyBalance` | Vị trí đáp án dồn về một chỗ (mọi chế độ, kể cả bài đầu vào) |
| `checkLengthCue` | Đáp án là phương án dài nhất ở quá 1/n + 15 điểm % số câu |
| Câu bỏ lửng | Phương án viết hoa đầu câu, không nối tiếp được câu hỏi |
| Lược đồ | `wrong` cho mọi phương án sai, mỗi lời giải thích ≥ 10 ký tự |

Luật tĩnh chỉ bắt được tín hiệu đếm được. Thước đo nghiệm thu là phép thử không có bài ở mục 4.

## 4. Phép thử không có bài (nghiệm thu, chạy tay)

1. `node tools/blind-export.mjs --type <dạng>` → dán **nguyên văn vào lời nhắc** của một phiên AI mới. **Cấm dùng công cụ**, vì phiên đọc được kho sẽ thấy đáp án; lần đo đầu ở v41 đã bị loại vì lý do này. Yêu cầu trả lời dạng `"id": "C/H"` (H/M/L là độ tự tin).
2. `node tools/blind-score.mjs phien1.json [phien2.json]` → tỉ lệ đúng theo dạng. Ngưỡng: ≤ 45% với 4 phương án, ≤ 55% với 3 phương án.
3. Viết lại trước hết những câu bị đoán đúng với độ tự tin H.
4. Sau đó soát độc lập **có bài** (`tools/review-export.mjs` → `tools/review-compare.mjs`): mọi đáp án phải khớp, câu nào có hai đáp án thì sửa.
