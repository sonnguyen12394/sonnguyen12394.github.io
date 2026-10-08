# L01 — Người mới hoàn toàn (Cold-Start Beginner)

**Bot:** `Learner_01_Absolute_Beginner`, chạy bằng `tools/learners/l01.ts`.
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- Lịch: 23 phiên trong 44 ngày mô phỏng.
- Phân tích bằng `tools/learners/analyze.ts`.

**Dữ liệu:**
- `v68/`: lần chạy đầu, trước khi sửa.
- `v69/`: sau khi sửa. Gồm `s1`, `s2`, `s3` (3 seed) và `fast` (seed 1, người học tiếp thu nhanh gấp 3).

**Cách bot "là người học":**
- Mỗi nút năng lực có một kỹ năng ẩn s:
  - từ vựng A1 khoảng 0,6;
  - ngữ pháp A1 khoảng 0,35;
  - gần như không biết B1.
- Xác suất đúng:
  - câu chọn đáp án: s + phần đoán mò;
  - câu tự gõ: s^1,4.
- Câu đã gặp được cộng điểm "quen mặt" +0,15.
- Bot học khi thấy đáp án hoặc đọc bí kíp, và quên theo e^(−Δngày/S). S tăng gấp đôi sau mỗi lần nhớ đúng vào một ngày khác.
- "Thật sự biết" một nút = s ≥ 0,8.
- Bot làm đúng những gì màn hình bảo. Để biết đáp án đúng, nó dùng `EM.peek()`. Hàm này chỉ đọc, không đổi hành vi app. Bot trả lời đúng hay sai theo kỹ năng ẩn của nó.

> **Giới hạn trung thực.** Mô hình học và quên do bot đặt ra, và khá bi quan (quên nhanh, mỗi câu chỉ học thêm 4–10%). Vì vậy nhóm I (kết quả học) chỉ cho biết app có tạo điều kiện để học hay không; nó không chứng minh hiệu quả trên người thật. Cảm nhận (bối rối, động lực) cũng chỉ suy ra từ chữ trên màn hình. Điều bot đo chắc nhất: app đoán trình độ đúng tới đâu, có công nhận nhầm, có từ chối nhầm, có kẹt không, có hỏi đúng chỗ thiếu không.

## Kết luận

```
L01 ABSOLUTE BEGINNER          v68 → v69   (thang 10, đạt = ≥ 8 ≈ ≥ 3/4)
A ONBOARDING                   7,0 → 8,1
B CHẨN ĐOÁN                    6,4 → 7,8
C GAMEPLAY                     7,0 → 8,0
D XỬ LÝ LỖI                    7,7 → 8,5
E MICRO-LEARNING               6,3 → 8,0
F MASTERY                      6,2 → 8,2
G THÍCH ỨNG                    5,0 → 7,7
H BẰNG CHỨNG                   8,1 → 8,3
I KẾT QUẢ HỌC (mô phỏng)       4,7 → 5,7
J ĐỘNG LỰC (suy ra)            5,3 → 7,0
K LỘ TRÌNH                     5,8 → 7,5
L VÒNG KHÉP KÍN                5,0 → 7,5
HARD GATES                     9/9 → 9/9 PASS
CORE LEARNING đạt ≥ 8          18/50 → 34/50 (bỏ nhóm I: 34/44 = 77%)
TRUNG BÌNH 80 TIÊU CHÍ         6,5 → 7,9
OVERALL                        ❌ NOT READY → 🟠 GẦN ĐẠT
                               Cơ chế đúng và không còn kẹt. Chưa đạt ngưỡng 90% ở Core vì nhóm I cần người học thật,
                               và vài điểm UX/lộ trình (xem "Còn lại").
NÚT THẮT CÒN LẠI               Hiệu quả học thật (cần cohort người thật với bộ đo v63); xác nhận Claim của chẩn đoán còn chậm
```

### Số liệu trước / sau

v68 là lần chạy đầu (seed 1). Cột v69 ghi seed 1; trong ngoặc là seed 2 / seed 3 / người học nhanh.

| Chỉ số | v68 | v69 |
|---|---|---|
| Nút **kẹt** (≥ 15 lượt, đúng ≥ 85%, vẫn chưa Đạt) | **4** (g-a1-07/08/09/22) | **0** (0 / 0 / 0) |
| "Bước tiếp theo" đổi bao nhiêu lần trong 44 ngày | 1 (đứng yên 40 ngày) | 4 (3 / 6 / 6) |
| Tiến độ kỹ năng trên tháp | không có; chỉ "4 → 1/36 năng lực" (giảm) | 📈 0 → 6 kỹ năng đã vững (7 / 8 / 8), có "+N trong 7 ngày" |
| "Đạt" thật mà bot chưa biết (kỹ năng ẩn < 0,7) | 3–5 | **0** (1 / 0 / 0) |
| "Đạt" chỉ do suy ra từ chẩn đoán mà bot chưa biết | 60 (đếm như Đạt, xác nhận khoảng 1 nút/ngày) | 0 (14 / 19 / 22) ở ngày 44, giảm dần từ 66 / 58 / 63. Hiện là "≈ Đạt (suy ra, đang xác nhận)", không đếm là kỹ năng vững |
| Âm tính giả (biết ≥ 0,9, có ≥ 4 lượt, chưa Đạt) cuối kỳ | 0 (nhưng 4 nút kẹt) | 0 (1 / 0 / 2) |
| Chẩn đoán từ vựng (thật: A1 chưa vững) | A2 (cao một cấp) | A1 (A1–A2 / A1–A2 / A1–A2) |
| Rương ôn (phần sắp quên) | 0 lượt | 4 (39 / 41 / 44) |
| Câu thử ngay sau bí kíp ở trại | 0 | 47: sửa được 37, chưa được 10 (33/13, 43/10, 50/3) |
| Phản hồi khi sai có "vì sao" | không | có (💡 ý chính của bí kíp) |
| Nút khác nhau được hỏi | 42 (3 nút hỏi khoảng 49 lần mỗi nút) | 83; tối đa 3 lượt/nút/ngày và 6 phần học dở |
| Nút bot thật sự biết (cuối / đầu, trong các nút đã luyện) | 0 → 4 / 34 | 3 → 6 / 70 (0→6, 1→4, nhanh 4→11) |
| Trùm (câu mới chưa gặp) đúng | 63% | 66% (75% / 74% / 75%) |
| Đo giữ riêng (12 câu): trước → sau → 7 ngày → 30 ngày | 6 → 7 → 7 → 9 (cùng 12 câu, quen câu) | 5 → 7 → 4 → 7 (dạng song song, nhiễu lớn vì chỉ 12 câu) |
| Lỗi trang / kẹt giao diện | 0 / 0 | 0 / 0 |

### Đã sửa gì (gốc rễ → cách sửa, đều có test)

1. **Kẹt "cần xác minh" khi hết câu mới** (luật m3.3, `ev/store.ts`). Câu đã gặp mà trả lời đúng tự lực sau ≥ 1 ngày không gặp (nhớ lại cách quãng) được tính như câu mới khi xác minh, nhưng vẫn cần ≥ 2 câu **khác nhau**, nên một câu lặp qua nhiều ngày vẫn không Đạt (C180). Test dựng đúng kịch bản bot nằm trong `engine-evq.test`. Mô phỏng `npm run sim` không đổi: FP 0%, FN 22,9%.
2. **Claim của chẩn đoán bị tính như Đạt** (m3.3). Claim vẫn được coi như biết để người học không phải học lại (P10), nhưng chỉ thành Đạt thật khi **riêng bằng chứng thật** đủ Đạt. Trong lúc đó trạng thái hiện "suy ra, đang xác nhận" (`engine-evidence.test`).
3. **Chẩn đoán bị đoán mò thổi lên.** Tỉ lệ đúng được trừ phần đoán mò trước khi lên/xuống cấp: r′ = (r − ḡ)/(1 − ḡ) (`engine-diag.test`).
4. **Không có ôn cho người chỉ chơi tháp.** Khả năng nhớ được dựng từ sổ bằng chứng bằng một thẻ FSRS ảo (`retain.ts`); từ đó rương và NBA "ôn trong tháp" xuất hiện (`engine-retain.test`).
5. **Tháp hỏi lặp một nút cả ngày, rồi rải sang 100 nút.**
   - Mỗi nút tối đa 3 lượt/ngày.
   - Tối đa 6 phần học dở; phần ưu tiên số 1 (cũng là "Bước tiếp theo") luôn được vào.
   - Trinh sát và rương rảnh dùng để xác nhận Claim bằng câu tự gõ.
   - Test ở `engine-quest.test`.
6. **Dạy rồi kiểm tra trong game:**
   - Phần chưa từng gặp được dạy trước bằng thẻ mới (chỉ một lần; câu trả lời ngay sau thẻ tính là có trợ giúp).
   - Trại có "Thử ngay 1 câu" ở đúng phần vừa đọc, ghi snapshot hiệu quả can thiệp.
   - Sai có một dòng "vì sao".
   - Test ở `quest.spec`.
   - Trong lúc làm, bot bắt được một lỗi do chính bản sửa đầu tiên: thẻ dạy hiện lại ở mọi lượt, nên mọi câu đúng thành "có trợ giúp" và lại kẹt. Lỗi đã được sửa.
7. **Giao diện người mới:**
   - Màn chào nói rõ là học qua game.
   - Kết quả bài dò ghi rõ là ước lượng (có thể lệch nửa cấp, sẽ kiểm tra lại khi chơi) và bỏ bảng giờ học IELTS/VSTEP ở bản chỉ có CEFR.
   - Tháp có thanh "kỹ năng đã vững" và nút cho "Bước tiếp theo".
   - Test ở `play.spec`.
8. **Đo bị hiệu ứng quen câu:** các lần đo sau dùng dạng song song (cùng nút, câu khác chưa gặp).

## 80 tiêu chí (0–10, v68 → v69)

Mỗi dòng ghi điểm v68 → v69 và kết quả: ✓ là đạt (≥ 8), ✗ là chưa.

### A. Onboarding & trải nghiệm đầu: 7,0 → 8,1
- **L01-01** · 7 → **8** ✓: Màn chào giờ nói "Chơi game leo tháp: mỗi đòn đánh là một câu tiếng Anh".
- **L01-02** · 9 → **9** ✓: Một nút "BẮT ĐẦU".
- **L01-03** · 8 → **8** ✓: Màn chào khoảng 85 từ.
- **L01-04** · 5 → **7** ✗: Kết quả dò bỏ "band" và bảng thi. Lộ trình hôm nay vẫn còn "mức 4: Dùng có kiểm soát", "Sẵn sàng %".
- **L01-05** · 6 → **8** ✓: Kết quả dò còn 2 ô cấp, một đoạn giải thích, mục tiêu tự đặt.
- **L01-06** · 8 → **8** ✓: Bài dò vừa xác định cấp vừa đặt mục tiêu.
- **L01-07** · 9 → **9** ✓: Mục tiêu tự đặt, game tự chọn câu.
- **L01-08** · 4 → **8** ✓: 0 lần kẹt; "Bước tiếp theo" có nút và đổi theo bằng chứng.

### B. Chẩn đoán lúc bắt đầu: 6,4 → 7,8
- **L01-09** · 9 → **9** ✓: Không giả định A1.
- **L01-10** · 8 → **8** ✓: Mỗi phần quyết định lên hay xuống cấp.
- **L01-11** · 7 → **8** ✓: 28 câu; màn giới thiệu ghi đúng "8 phần (mỗi phần 2–4 câu)".
- **L01-12** · 8 → **8** ✓: Bậc thang lên/xuống, có trừ đoán mò.
- **L01-13** · 5 → **7** ✗: Seed 1 đúng (A1). Seed 2/3 ra A1–A2, vẫn cao nửa cấp so với kỹ năng ẩn 0,6.
- **L01-14** · 4 → **8** ✓: "Có thể lệch khoảng nửa cấp… sẽ kiểm tra dần trong lúc chơi".
- **L01-15** · 4 → **8** ✓: Claim tách khỏi Đạt thật và được xác nhận trong game (66 → 14 Claim sai sau 44 ngày). Chưa 9 vì còn chậm.
- **L01-16** · 6 → **6** ✗: Tách từ vựng/ngữ pháp; bài dò chưa có nghe.

### C. Gameplay: 7,0 → 8,0
- **L01-17** · 8 → **8** ✓: Luật một dòng mỗi lượt.
- **L01-18** · 8 → **8** ✓: Tên kỹ năng trên mỗi lượt; có thẻ mới.
- **L01-19** · 5 → **7** ✗: Quái đúng 76–82%. Thắng 42–51 tầng, thua 4–11. Hợp lý hơn (trước 46/49 thắng), nhưng vẫn hơi dễ.
- **L01-20** · 9 → **9** ✓: Độ khó game chỉ đổi tim.
- **L01-21** · 4 → **8** ✓: Không còn 3 nút hỏi khoảng 49 lần; ưu tiên số 1 + phần học dở + xác nhận Claim.
- **L01-22** · 9 → **9** ✓: Mọi lượt thành bằng chứng.
- **L01-23** · 6 → **7** ✗: Thêm thẻ mới, câu thử ở trại, rương. Bot không đo được "vui".

### D. Xử lý lỗi: 7,7 → 8,5
- **L01-24** · 9 → **9** ✓: Câu thử ở trại sai thì không mất tim.
- **L01-25** · 9 → **9** ✓
- **L01-26** · 8 → **8** ✓: 0 giả thuyết từ lỗi lẻ.
- **L01-27** · 4 → **8** ✓: "💡 Đại từ (I, he, she…) đứng trước động từ…".
- **L01-28** · 9 → **9** ✓: Ba dòng.
- **L01-29** · 7 → **8** ✓: Trại dạy và cho thử đúng phần vừa sai.

### E. Micro-learning: 6,3 → 8,0
- **L01-30** · 7 → **8** ✓: Bí kíp nhắm đúng nút vừa sai.
- **L01-31** · 9 → **9** ✓
- **L01-32** · 7 → **7** ✗: Bí kíp từ vựng còn nghèo ("cook (verb): nấu ăn").
- **L01-33** · 8 → **8** ✓
- **L01-34** · 4 → **8** ✓: "Thử ngay 1 câu" sau bí kíp; thẻ mới trước câu đầu.
- **L01-35** · 3 → **8** ✓: Snapshot `micro:fixed/not-yet` kèm mastery trước/sau (37/10).

### F. Mastery: 6,2 → 8,2
- **L01-36** · 5 → **8** ✓: Đạt thật sai 0–1 nút/seed; Claim hiện là "suy ra".
- **L01-37** · 1 → **8** ✓: 0 nút kẹt ở cả 4 lần chạy; âm tính giả cuối kỳ 0–2.
- **L01-38** · 9 → **9** ✓
- **L01-39** · 8 → **8** ✓: Claim có độ tin cậy "thấp".
- **L01-40** · 8 → **8** ✓: Claim bị phủ định 54–58 lần (seed 2/3).

### G. Thích ứng: 5,0 → 7,7
- **L01-41** · 5 → **8** ✓
- **L01-42** · 7 → **7** ✗: Một bot không đủ để so; L02 sẽ so.
- **L01-43** · 2 → **8** ✓: Bước tiếp theo đổi 4–6 lần theo bằng chứng.
- **L01-44** · 5 → **7** ✗: Bỏ qua bằng Claim + "Tôi biết rồi"; xác nhận vẫn chậm.
- **L01-45** · 3 → **8** ✓: Rương 39–44 lượt (seed 2/3). Seed 1 chỉ 4 lượt vì ít nút Đạt.
- **L01-46** · 8 → **8** ✓: Trinh sát 48–71 lượt.

### H. Bằng chứng: 8,1 → 8,3
- **L01-47** · 9 → **9** ✓
- **L01-48** · 9 → **9** ✓
- **L01-49** · 8 → **8** ✓: Thêm ngữ cảnh micro cho câu thử ở trại.
- **L01-50** · 8 → **8** ✓
- **L01-51** · 7 → **8** ✓: Lặp trong ngày ×0,5; chỉ nhớ lại cách quãng mới tính xác minh.
- **L01-52** · 8 → **8** ✓: Câu sau thẻ dạy hoặc bí kíp tính là có trợ giúp.
- **L01-53** · 8 → **8** ✓: Đoán mò được trừ cả ở chẩn đoán.

### I. Kết quả học (mô phỏng): 4,7 → 5,7
- **L01-54** · 6 → **7** ✗: Câu thử sau bí kíp đúng khoảng 80%.
- **L01-55** · 5 → **5** ✗: Đo 7 ngày nhiễu (12 câu).
- **L01-56** · 3 → **5** ✗: Trùm câu mới 66–75%; nút thật sự biết 3 → 6.
- **L01-57** · 3 → **6** ✗: Rương ôn chạy được; hiệu quả cần người thật.
- **L01-58** · 6 → **6** ✗
- **L01-59** · 5 → **5** ✗: Ngoài game vẫn thấp hơn trong game.

### J. Động lực (suy ra): 5,3 → 7,0
- **L01-60** · 3 → **6** ✗: Thanh kỹ năng tăng dần. Số năng lực Can-do A1 vẫn 0/36 sau 44 ngày (người học mô phỏng tiến chậm).
- **L01-61** · 8 → **8** ✓
- **L01-62** · 8 → **8** ✓
- **L01-63** · 2 → **6** ✗: Có "+N kỹ năng trong 7 ngày"; xu vẫn lớn hơn nhiều so với tiến bộ thật.

### K. Lộ trình: 5,8 → 7,5
- **L01-64** · 7 → **7** ✗
- **L01-65** · 8 → **8** ✓
- **L01-66** · 5 → **8** ✓: Giãn cách + giới hạn phần học dở.
- **L01-67** · 3 → **7** ✗: Lộ trình đổi theo bằng chứng, nhưng Claim sai còn nằm ngoài lộ trình tới khi được xác nhận.

### L. Vòng khép kín: 5,0 → 7,5
- **L01-68** · 9 → **9** ✓
- **L01-69** · 8 → **8** ✓
- **L01-70** · 5 → **8** ✓
- **L01-71** · 6 → **8** ✓
- **L01-72** · 3 → **8** ✓
- **L01-73** · 5 → **6** ✗: Trùm transfer chưa ưu tiên nút vừa Đạt.
- **L01-74** · 2 → **6** ✗: Ôn từ sổ chạy được, nhưng mới vài chục lượt.
- **L01-75** · 2 → **7** ✗: Rương quyết định lượt chơi.

### M. Hard gate: 10 / 10 / 10 / 10 / 10, giữ nguyên
- Điểm game ≠ mastery.
- Hoàn thành ≠ mastery.
- Một lỗi ≠ thiếu kiến thức.
- Không tự quyết lộ trình.
- Không cần AI lúc chạy.

## Còn lại (theo thứ tự đáng làm)
1. **Cần người học thật (nhóm I):** mở cohort nhỏ dùng bộ đo v63, với các lần đo trước, sau, 7 ngày và 30 ngày. Bot không chứng minh được hiệu quả học.
2. **Xác nhận Claim nhanh hơn:** khoảng 1/3 Claim sai còn lại sau 44 ngày. Có thể thêm một lượt trinh sát mỗi tầng khi còn nhiều Claim.
3. **Trùm transfer** ưu tiên nút vừa Đạt (VERIFY → TRANSFER).
4. **Bài dò có phần nghe**, để thấy hồ sơ không đồng đều (L01-16).
5. **Lộ trình hôm nay** bỏ thuật ngữ còn lại; bí kíp từ vựng giàu hơn.
