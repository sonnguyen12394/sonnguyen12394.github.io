# L02: Người học yếu / nhiều lỗ hổng

**Bot:** `Learner_02_Weak_Learner`. Mã: `tools/learners/l02.ts`; lõi chung `core.ts`; phân tích `analyze-l02.ts`.

**Cách chạy:**
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- 23 phiên trong 44 ngày mô phỏng.
- Mỗi bản app chạy 4 lần: 3 seed và `fast` (seed 1, học sau giải thích nhanh gấp 2).

**Dữ liệu:**
- `v69/`: bản trước khi sửa.
- `v70/`: bản sau khi sửa (nhánh `claude/l02-bot`).
- Mỗi lần chạy có `rows.json` (từng câu, kèm kỹ năng ẩn, nguyên nhân thật, cờ kịch bản ép), `events.json` và `metrics-l02.json`.

**Bot không tự chọn bài học.** Sau bài dò, bot vào "Mục tiêu" và chọn CEFR B1. Từ đó bot chỉ làm theo màn hình. Để biết đáp án đúng, bot dùng `EM.peek()`, chỉ đọc. Bot trả lời đúng hay sai theo hồ sơ ẩn.

> **Giới hạn trung thực.** Hồ sơ học/quên do bot đặt ra, nên nhóm I/N chỉ cho biết app có tạo điều kiện để học hay không, không chứng minh hiệu quả trên người thật.
>
> **Sửa lỗi đo so với báo cáo trước.** Báo cáo v69 viết "kỹ năng nền ngữ pháp không tăng ở 3/4 lần chạy". Kết luận này sai do lỗi đo: kỹ năng "ban đầu" bị lấy ở cuối phiên đầu tiên, tức đã gồm phần học trong phiên đó. Lấy đúng mốc là kỹ năng ẩn trước mọi lượt học thì ở v69 ngữ pháp A1–A2 có tăng: 0,48 → 0,56; 0,48 → 0,73; 0,52 → 0,59. Các điểm I/N của v69 dưới đây đã chấm lại theo số đúng.

## Kết quả

```
========================================
LEARNER 02 — WEAK LEARNER         v69 → v70   (thang 10; đạt = ≥ 8)
========================================
TARGET            CEFR B1 (bot tự chọn ở Mục tiêu)
GROUND TRUTH      Từ vựng A1 0,85 / A2 0,6 · Ngữ pháp A1 0,5 / A2 0,3 · Nghe 0,2
                  Nhớ lại thấp · dùng có kiểm soát thấp · transfer thấp (lên dần khi nhớ bền) · nhớ lâu thấp
                  Hiểu sai: g-a1-01, g-a1-04 (sai cùng chữ); g-a1-08 (sai cùng mẫu)
                  Nút thắt: nền ngữ pháp; phụ: nghe
----------------------------------------
DIAGNOSTIC
  Weakness Detection        7,1 → 7,8   khớp 3 lớp 67–76%, ngược chiều 0–7%, tương quan 0,55–0,80
  Root Cause Detection      5,9 → 6,5   nhãn lỗ hổng khớp 17–24% → 17–31%; transfer thật khớp 26–66% → 45–64%
  Misconception Detection   3,7 → 6,0   loại "đang hiểu sai" riêng + mẫu lỗi qua nhiều câu; bí kíp nhắm đúng: 0 → 1–2 lần/lần chạy
ADAPTATION
  Intervention              7,4 → 7,8   bí kíp sửa được / chưa: 9–21 / 21–29 → 19–28 / 15–24
  Learning Path             6,6 → 7,0   dò 114–170 → 116–128 lượt; điểm nghẽn hiện trên tháp
  Mastery                   7,7 → 7,7   Đạt sai: 0 ở cả 8 lần chạy
  Evidence                  7,8 → 7,8
  Error Recovery            6,2 → 7,2   can thiệp chưa hiệu quả → lùi một bậc + "cách khác"; sai lặp lại → giải thích lại
LEARNING (mô phỏng)
  Learning Gain             5,1 → 5,4   câu mới: 34–44% → 45–59% (v70); ngữ pháp A1–A2: +0,05 … +0,23
  Retention                 6,8 → 7,2   ôn cả phần đang học sắp quên (rương 1 → 46–50 lượt)
  Transfer                  6,4 → 6,4
  End-to-end                4,0 → 4,0
EFFICIENCY
  Câu lặp lại               28–41% → 24–36%
  Luyện phần đã dùng được   11–33% → 4–27%
  Dò                        ≈ 30% → ≈ 23% số câu; bớt dò khi người học sai nhiều
LISTENING                   0 → 32–33 lượt nghe phân biệt âm trong tháp (3/4 lần chạy)
----------------------------------------
HARD GATES                12/12 → 12/12 PASS
TRUNG BÌNH 100 TIÊU CHÍ   6,5 → 7,0   · đạt ≥ 8: 36 → 41
OVERALL                   ❌ NOT READY → 🟠 GẦN ĐẠT về cơ chế; chưa đạt về kết quả học của người yếu
----------------------------------------
CÒN LẠI
1. Phần lớn nhãn lỗ hổng vẫn rơi vào nút mà bot đã làm được ở mức đó với câu quen (45–48% số nhãn): app thiếu
   bằng chứng câu mới, nên gắn nhãn thận trọng. Cần câu dò phân biệt giả thuyết (nhận ra / tự nhớ / câu mới).
2. Hiểu sai "cùng mẫu" (bỏ -s, thêm -ed…) có cơ chế và test, nhưng bot chưa lần nào kích hoạt được. Lỗi của
   bot không nhất quán, và câu đúng xen kẽ làm giả thuyết yếu nhanh.
3. Học thật vẫn chậm với hồ sơ này: sau khoảng 530 câu chỉ 1–3 nút dùng được ở câu mới. Hồ sơ quên nhanh
   (S = 1,5 ngày) và rải hơn 80 nút của mục tiêu B1.
4. Bài dò chưa có phần nghe (nghe chỉ được đo trong tháp). Game chưa có câu ở nhiều ngữ cảnh / dùng tự do.
5. Lần chạy s2 không có câu nghe nào, vì lộ trình lần đó không mở tới nút âm. Mình chưa tìm nguyên nhân.
```

## Đã sửa (v70), mỗi mục có test

1. **Lỗ hổng từ bằng chứng** (`gap.ts`):
   - `misconception`: cùng chuỗi trả lời sai, hoặc cùng mẫu lỗi lặp ≥ 2.
   - `transfer`: câu quen đúng ≥ 80% nhưng câu mới < 50%.
   - `unproven`: chưa có câu trả lời nào, tức "chưa chứng minh", khác "chưa biết" → hỏi thử trước, chưa dạy.
   - Test: `engine-nba.test`.
2. **Mẫu lỗi** (`ev/store.ts` `errPattern`):
   - Nhận các lỗi có hình thái: đuôi từ (works → work), thay từ chức năng (are → is), thừa/thiếu từ ngắn.
   - Gộp được qua nhiều câu khác nhau; lỗi gõ bừa không thành mẫu.
   - Giới hạn: "did + quá khứ bất quy tắc" (went, ate) chưa gộp được vì cần từ điển dạng quá khứ.
3. **Can thiệp nhắm đúng:**
   - Trại ưu tiên phần đang hiểu sai.
   - Bí kíp hiện "Bạn hay trả lời …" kèm giải thích đối chiếu.
   - Lỗ hổng hiểu sai → câu đối chiếu (nhận ra) trước.
4. **Leo thang khi can thiệp chưa hiệu quả:**
   - Câu thử sau bí kíp sai → lần sau lùi một bậc (câu chọn, mức nhận ra).
   - Trại dùng "Cách khác": ví dụ trước, rồi khái niệm, rồi câu thử dễ hơn.
5. **Giải thích lại khi sai lặp lại** (≥ 2 trong 3 lượt cuối), tối đa một lần/ngày/nút. Câu ngay sau thẻ tính là có trợ giúp, để không thành kẹt xác minh như L01.
6. **Ôn phần đang học sắp quên:** khả năng nhớ ước tính từ các câu trả lời đã ghi < 0,7 thì đưa vào rương, không chỉ phần đã Đạt.
7. **Bớt dò khi người học sai nhiều:** < 60% ở 24 lượt gần nhất thì trinh sát chỉ xác nhận phần app đoán là đã biết, không dò khám phá. Test: `engine-quest.test`.
8. **Điểm nghẽn trên tháp:** "🚧 Điểm nghẽn: X (77% · nhớ nhưng chưa dùng được): đang chặn 95 năng lực của mục tiêu".
9. **Nghe trong tháp:** nút âm (ph:) có 3 câu nghe phân biệt cặp âm, đọc bằng giọng của máy. Máy không đọc được thì không hỏi.

Hồi quy L01 (seed 1): 0 nút kẹt, 0 lỗi trang, Đạt thật 3 nút với 1 nút bot chưa thật biết (L01 v69 seed 1: 6 nút, 0 sai). Tháp có 47 lượt rương; giải thích lại 103 lần.

## 10 kịch bản (v70)

| Kịch bản | Kết quả | Đánh giá |
|---|---|---|
| S01 sai một lần | Trạng thái giữ nguyên, m dao động nhẹ | ✓ |
| S02 sai 3 lần liên tiếp | m giảm mạnh; lần sau được giải thích lại (sai lặp lại) và hạ mức | ✓ (chưa có câu dò giả thuyết) |
| S03 câu chọn đúng / câu gõ sai | Mức 2 Đạt, mức 3 chưa; luyện "tự nhớ ra" | ✓ |
| S04 câu quen đúng / câu mới sai | Lỗ hổng "chưa dùng được ở câu mới" khi đủ ≥ 3 câu quen và ≥ 2 câu mới | ✓ một phần (cần đủ lượt) |
| S05 đúng sau bí kíp → ≥ 3 ngày sau | Đúng 50–87% (10–18 trường hợp/lần chạy) | ✓ một phần |
| S06 đã Đạt rồi sai khi ôn | Mở lại, ôn ở rương / trùm, không học lại từ đầu | ✓ |
| S07 đoán trúng | 20–51 lần đoán trúng/lần chạy; 0 nút Đạt nhờ đoán | ✓ |
| S08 / S09 gợi ý / làm lại | Không có trong tháp; engine có trọng số riêng | — |
| S10 trước / sau can thiệp | Câu mới của nút: 0,26 → 0,52; 0,32 → 0,37; 0,56 → 0,68; 0,20 → 0,20 | ✓ một phần |

## 100 tiêu chí (0–10)

Mỗi dòng ghi điểm v69 → v70. ✓ là đạt (≥ 8), ✗ là chưa. Dòng không ghi thay đổi là giữ nguyên điểm.

### A. Phát hiện điểm yếu: 7,1 → 7,8
- **L02-01** 8 ✓
- **L02-02** 8 ✓
- **L02-03** 4 → 6 ✗: Nghe được đo trong tháp (32–33 lượt); bài dò vẫn chưa có nghe.
- **L02-04** 7 → 8 ✓: Nghe có bằng chứng riêng; không lấy từ vựng suy ra nghe.
- **L02-05** 6 → 8 ✓: Dòng "Điểm nghẽn … đang chặn N năng lực" trên tháp.
- **L02-06** 8 ✓
- **L02-07** 5 → 7 ✗: Thêm loại "chưa có bằng chứng" → hỏi thử trước khi dạy; nhãn thận trọng vẫn còn nhiều.
- **L02-08** 8 ✓
- **L02-09** 9 ✓
- **L02-10** 8 ✓

### B. Nguyên nhân gốc: 5,9 → 6,5
- **L02-11** 5 → 7 ✗: Giả thuyết từ bằng chứng: hiểu sai, câu quen / câu mới.
- **L02-12** 7 ✗
- **L02-13** 5 ✗: Chưa có câu dò sau lỗi để phân biệt giả thuyết.
- **L02-14** 5 ✗
- **L02-15** 8 → 9 ✓: "Biết lơ mơ" → nhãn "chưa biết" đúng 90–97%.
- **L02-16** 7 ✗
- **L02-17** 5 ✗
- **L02-18** 4 → 7 ✗: Transfer thật khớp 45–64%.
- **L02-19** 6 ✗
- **L02-20** 7 ✗

### C. Hiểu sai: 3,7 → 6,0
- **L02-21** 4 → 5 ✗: Sai cùng chữ: 2/4 lần chạy. Sai cùng mẫu: có cơ chế, chưa kích hoạt ở bot.
- **L02-22** 3 → 7 ✗: Loại lỗ hổng riêng → cách sửa "đối chiếu".
- **L02-23** 3 → 6 ✗: Gộp mẫu qua nhiều câu (unit test); "did + quá khứ bất quy tắc" chưa gộp được.
- **L02-24** 2 → 6 ✗: Bí kíp "Bạn hay trả lời…" trong tháp: 1–2 lần/lần chạy.
- **L02-25** 3 → 5 ✗: Câu thử sau bí kíp; giả thuyết yếu dần khi trả lời đúng.
- **L02-26** 7 ✗

### D. Can thiệp: 7,4 → 7,8
- **L02-27** 7 → 8 ✓: Trại ưu tiên phần đang hiểu sai.
- **L02-28** 5 → 7 ✗
- **L02-29** 9 ✓
- **L02-30** 8 → 9 ✓: Giải thích lại khi sai lặp lại.
- **L02-31** 8 ✓
- **L02-32** 5 ✗
- **L02-33** 7 ✗
- **L02-34** 9 ✓
- **L02-35** 8 ✓
- **L02-36** 8 ✓

### E. Lộ trình: 6,6 → 7,0
- **L02-37** 6 ✗
- **L02-38** 6 → 7 ✗: Hiện điểm nghẽn; ngữ pháp 34–58% số lượt.
- **L02-39** 8 ✓
- **L02-40** 6 → 7 ✗: Bớt dò khi sai nhiều; khoảng 88–92 nút được chạm (trước 105–129).
- **L02-41** 5 → 6 ✗: Luyện phần đã dùng được: 4–27%.
- **L02-42** 8 ✓
- **L02-43** 6 ✗
- **L02-44** 8 ✓

### F. Mastery: 7,7 (giữ nguyên)
- **L02-45** 9 ✓
- **L02-46** 7 ✗
- **L02-47** 9 ✓
- **L02-48** 8 ✓
- **L02-49** 6 ✗
- **L02-50** 6 ✗
- **L02-51** 7 ✗
- **L02-52** 8 ✓
- **L02-53** 8 ✓
- **L02-54** 9 ✓

### G. Bằng chứng: 7,8 (giữ nguyên)
- **L02-55** 9 ✓
- **L02-56** 9 ✓
- **L02-57** 8 ✓
- **L02-58** 8 ✓
- **L02-59** 5 ✗: Câu trong tháp chưa có độ khó.
- **L02-60** 8 ✓
- **L02-61** 6 ✗
- **L02-62** 9 ✓
- **L02-63** 8 ✓
- **L02-64** 8 ✓

### H. Phục hồi sau lỗi: 6,2 → 7,2
- **L02-65** 8 ✓
- **L02-66** 6 → 7 ✗: Sai lặp lại → giải thích lại.
- **L02-67** 5 → 6 ✗: Mẫu lỗi qua nhiều câu.
- **L02-68** 3 → 7 ✗: Can thiệp chưa hiệu quả → lùi một bậc + "cách khác". Sửa được nhiều hơn chưa được ở 2/4 lần chạy, hoà 1, kém 1.
- **L02-69** 8 ✓
- **L02-70** 7 ✗

### I. Tiến bộ học (mô phỏng; v69 đã sửa lỗi đo): 5,1 → 5,4
- **L02-71** 7 → 6 ✗: S10 kém đều hơn trên nhiều nút hơn.
- **L02-72** 5 → 6 ✗: S05: 50–87% trên 10–18 trường hợp.
- **L02-73** 6 ✗
- **L02-74** 6 → 7 ✗: Lỗi theo nút 0,5 → 0,04–0,25.
- **L02-75** 5 ✗: Ngữ pháp A1–A2 +0,05 … +0,23 (v69 cũng có, đã sửa lỗi đo).
- **L02-76** 4 ✗
- **L02-77** 3 → 4 ✗

### J. Nhớ lâu: 6,8 → 7,2
- **L02-78** 7 → 8 ✓: Ôn phần đang học sắp quên.
- **L02-79** 6 → 7 ✗
- **L02-80** 9 ✓
- **L02-81** 5 ✗
- **L02-82** 7 ✗

### K. Transfer: 6,4 (giữ nguyên)
- **L02-83** 8 ✓
- **L02-84** 5 ✗
- **L02-85** 7 ✗
- **L02-86** 5 ✗
- **L02-87** 7 ✗

### L. Động lực: 6,5 → 7,2
- **L02-88** 6 → 7 ✗: Thua 8–24 tầng (trước 16–24).
- **L02-89** 7 → 8 ✓: Dòng vì sao + điểm nghẽn.
- **L02-90** 5 → 7 ✗
- **L02-91** 5 ✗
- **L02-92** 7 ✗
- **L02-93** 9 ✓

### M. Hiệu quả: 6,4 → 7,0
- **L02-94** 5 → 6 ✗: Hỏi thử trước khi dạy.
- **L02-95** 9 ✓
- **L02-96** 4 → 6 ✗: Dò khoảng 23% số câu, giảm khi người học sai nhiều.
- **L02-97** 7 ✗
- **L02-98** 7 ✗

### N. Kết quả cuối: 4,0 → 4,0
- **L02-99** 5 ✗: v69 đã sửa lỗi đo; ngữ pháp tăng ở cả hai bản.
- **L02-100** 3 ✗

### Hard gate: 12/12 PASS (như v69)
- Một lỗi không thành kết luận chắc chắn.
- Điểm game hay hoàn thành bài không thành mastery.
- Phân biệt "chưa biết" với "nhớ ra".
- Bắt được lỗi lặp lại.
- Lộ trình đổi theo bằng chứng.
- Bí kíp có kiểm tra.
- Mastery giảm được.
- Không Đạt bằng câu lặp.
- Có kiểm tra transfer.
- Không bắt học lại phần đã vững.
- Không dò lại phần đã vững.
