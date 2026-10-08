# L01: Người mới hoàn toàn (Cold-Start Beginner)

**Bot:** `Learner_01_Absolute_Beginner`, chạy bằng `tools/learners/l01.ts`, seed 1.
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- **23 phiên trong 44 ngày mô phỏng:**
  - mỗi ngày từ ngày 0 đến ngày 15;
  - sau đó các ngày 17, 19, 21, 24, 28, 35, 44.
- **Tổng cộng 473 câu trả lời:**
  - 28 câu chẩn đoán;
  - 338 câu trong game;
  - 59 câu kiểm tra nhanh;
  - 48 câu đo.
- **Kết quả chạy:** 0 lỗi trang, 0 lần kẹt giao diện.
- **Dữ liệu thô:**
  - `rows.json`: từng câu, gồm xác suất đúng thật, bot có thật sự biết không, và trạng thái app kết luận;
  - `events.json`, `screens.json`: chữ trên từng màn;
  - `metrics.json`: số liệu tổng hợp, sinh bằng `tools/learners/analyze.ts`.

**Cách bot "là người học":**
- Mỗi nút năng lực có một kỹ năng ẩn s.
  - Từ vựng A1 khoảng 0,6, A2 khoảng 0,3.
  - Ngữ pháp A1 khoảng 0,35.
  - Gần như không biết B1.
- Câu chọn đáp án: xác suất đúng = s + đoán.
- Câu tự gõ: xác suất đúng = s^1,4.
- Câu đã gặp được cộng điểm "quen mặt" (+0,15). Câu mới thì không, nên đo được bot chỉ nhớ vẹt hay dùng được thật.
- Bot học khi thấy đáp án hoặc đọc bí kíp, và quên dần theo thời gian.
- "Thật sự biết" một nút = s ≥ 0,8.

Bot không đọc trạng thái bên trong app để quyết định học gì; nó làm đúng những gì màn hình bảo. Để biết đáp án đúng, bot dùng `EM.peek()`. Hàm này chỉ đọc, không đổi hành vi app. Bot trả lời đúng hay sai theo kỹ năng ẩn của nó.

> **Giới hạn trung thực.** Mô hình học và quên do bot đặt ra, nên nhóm I (kết quả học) chỉ cho biết app có tạo ĐIỀU KIỆN để học hay không. Nó không chứng minh hiệu quả trên người thật. Cảm nhận (bối rối, động lực) cũng chỉ suy ra từ chữ trên màn và tiến độ hiển thị. Điều bot đo chắc nhất là: app đoán trình độ ẩn đúng tới đâu, có công nhận nhầm hay từ chối nhầm, có hỏi đúng chỗ thiếu không.

## Kết luận

```
L01 ABSOLUTE BEGINNER                (thang 10, đạt = ≥ 8 ≈ ≥ 3/4)
A ONBOARDING              7,0   (4/8 đạt)
B CHẨN ĐOÁN               6,4   (3/8)
C GAMEPLAY                7,0   (4/7)
D XỬ LÝ LỖI               7,7   (4/6)
E MICRO-LEARNING          6,3   (2/6)
F MASTERY                 6,2   (3/5)
G THÍCH ỨNG               5,0   (1/6)
H BẰNG CHỨNG              8,1   (6/7)
I KẾT QUẢ HỌC (mô phỏng)  4,7   (0/6)
J ĐỘNG LỰC (suy ra)       5,3   (2/4)
K LỘ TRÌNH                5,8   (1/4)
L VÒNG KHÉP KÍN           5,0   (2/8)
HARD GATES (spec L01)     9/9 PASS (L01-76…80 đều 10/10)
CORE LEARNING (B,E–I,K,L) 18/50 đạt ≥ 8  → cần ≥ 90%
TRUNG BÌNH 80 TIÊU CHÍ    6,5/10
OVERALL                   ❌ NOT READY
NÚT THẮT CHÍNH            Kẹt "Cần xác minh": người học đã biết mà app không bao giờ công nhận → lộ trình đứng yên
NÚT THẮT PHỤ              Chẩn đoán suy ra quá tay (Claim tính như Đạt), xác nhận chậm; game không có ôn lại và không kiểm tra sau bí kíp
```

### Số liệu chính

| Chỉ số | Giá trị |
|---|---|
| **Tiến độ hiển thị (năng lực A1 đã Đạt)** | 4/36 (ngày 0) → 3 → 2 → **1/36 (ngày 44)** |
| **Bước tiếp theo hiển thị** | "There is / there are" suốt 40 ngày |
| Nút bot thật sự biết, trong 34 nút đã luyện | 0 → 4 (kỹ năng thật trung bình 0,57 → 0,64) |
| Câu cùng một nút ngữ pháp | g-a1-07/08/09 mỗi nút khoảng 49 lần, trong 23 phiên; chỉ có 3 câu mức 3 cho mỗi nút |
| Trạng thái app của g-a1-07 ("There is / there are") | mức 3: m = 0,86, n = 35, **"cần xác minh" vĩnh viễn**. Kỹ năng thật của bot 0,84 |
| Tầng game | thắng 46 / thua 3; tầng 47; 3.980 xu |
| Đúng ở câu mới / câu đã gặp (trong game) | 68% / 89% |
| Trùm (câu mới, transfer) | 46 lượt, đúng 63%; chỉ 11% hỏi vào nút bot thật sự biết |
| Rương (ôn phần sắp quên) | **0 lượt trong 44 ngày** |
| Kiểm tra nhanh xác nhận chẩn đoán | 19 lần, khoảng 1 lần/ngày, cho khoảng 60 nút "suy ra đã biết" |
| "Đạt" mà kỹ năng thật < 0,7 | 48–60 nút, gần hết là Claim từ chẩn đoán (n = 0). Nút có bằng chứng thật: 3–5 |
| Đo giữ riêng (12 câu, cùng bộ câu) | trước 6/12 → sau 7 → 7 ngày 7 → 30 ngày 9/12 (có hiệu ứng quen câu, xem bên dưới) |
| Giả thuyết nguyên nhân gốc | 0 (không có lỗi nào bị kết luận vội là thiếu phần nền) |

### Gốc rễ (đã kiểm trong code)

1. **Kẹt "cần xác minh" ở mức 1–3** (`src/engine/ev/store.ts:75`).
   - Luật m3.2 đòi ≥ 2 lượt **đúng ở câu mới** (`novOk`).
   - Câu "mới" chỉ tính ở lần gặp đầu tiên. Nút ngữ pháp chỉ có 3 câu mức 3. Bot sai lần đầu ở 2/3 câu (lúc đó chưa biết), nên `nv` dừng ở 1 và không bao giờ lên 2.
   - Hệ quả dây chuyền:
     - mức 3 không Đạt nên không lên mức 4;
     - nút không ra khỏi biên lộ trình nên game hỏi lại cùng 3 câu suốt 40 ngày;
     - "Bước tiếp theo" đứng yên;
     - tiến độ hiển thị giảm.
   - Luật Readiness đã có ngoại lệ "hết câu mới" (v65), nhưng luật xác minh mức 1–3 thì không.
2. **Claim từ chẩn đoán được tính là Đạt** (`pass` bỏ qua `n = 0`).
   - Bài dò ước lượng từ vựng A2, nên toàn bộ unit A1 thành "suy ra đã biết". Kỹ năng thật của bot ở các unit này chỉ khoảng 0,6.
   - Việc xác nhận nằm ở "Lộ trình hôm nay": một bài kiểm tra nhanh mỗi ngày, và chỉ khi người học tự mở màn đó. Màn chính là tháp, không đưa xác nhận vào game.
3. **Game không khép vòng nhớ lâu.**
   - Rương chỉ lấy nút đã Đạt mà sắp quên. Do (1), gần như không có nút Đạt nào. Claim từ chẩn đoán không bao giờ được ôn.
4. **Bí kíp trong game không có câu kiểm tra ngay sau**: trại chỉ hồi tim. Bí kíp 60 giây có câu kiểm tra thì chỉ có ở bài học, người chơi tháp không gặp.
5. **Phản hồi khi sai chỉ có đáp án**, không có một dòng "vì sao".

## 80 tiêu chí (0–10)

Đạt = ≥ 8. **Chứng cứ** ghi rõ nguồn: bot (log lần chạy), code, hoặc test.

### A. Onboarding & trải nghiệm đầu

| ID | Điểm | KQ | Quan sát → kỳ vọng |
|---|---|---|---|
| L01-01 Hiểu mục tiêu app | 7 | ✗ | Màn chào nói rõ "app tự tìm chỗ bạn còn thiếu…". Màn chào không nhắc game; tới màn tháp mới thấy học bằng game. |
| L01-02 Hiểu hành động đầu | 9 | ✓ | Một nút lớn "BẮT ĐẦU"; bot bấm ngay, không do dự. |
| L01-03 Không đọc dài | 8 | ✓ | Màn chào 74 từ, màn giới thiệu bài dò 72 từ. |
| L01-04 Không cần thuật ngữ | 5 | ✗ | Màn kết quả có "band", "CEFR", "năng lực", bảng giờ học IELTS/VSTEP. Lộ trình hôm nay có "mức 4: Dùng có kiểm soát", "Sẵn sàng 11%". |
| L01-05 Không choáng UI | 6 | ✗ | Màn kết quả dò có 2 bảng, trong đó một bảng là giờ học các kỳ thi, không liên quan bản chỉ có CEFR. Màn tháp gọn. |
| L01-06 Hành động đầu có ý nghĩa | 8 | ✓ | Bài dò đặt mục tiêu và loại bỏ phần đã biết. |
| L01-07 Không bắt chọn bài | 9 | ✓ | App tự đặt mục tiêu A1 (snapshot `goal:AUTO`) và vào tháp. |
| L01-08 Không bị kẹt | 4 | ✗ | Giao diện không kẹt lần nào. Nhưng về học thì kẹt: "Bước tiếp theo" cùng một mục 40 ngày. Dòng đó trên tháp lại **không có nút bấm**. |

### B. Chẩn đoán lúc bắt đầu

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-09 Không giả định trình độ | 9 | ✓ | Dò theo bậc thang lên/xuống. Không mặc định A1. |
| L01-10 Mỗi câu dò có mục đích | 8 | ✓ | Mỗi "phần" quyết định lên hay xuống cấp cho từ vựng hoặc ngữ pháp. |
| L01-11 Không quá dài | 7 | ✗ | 28 câu ("8 phần"), khoảng 3–5 phút. Chấp nhận được, nhưng gấp 3 lần con số "8" người học đọc thấy. |
| L01-12 Thích ứng | 8 | ✓ | Đúng thì lên cấp, sai thì xuống (bậc thang). |
| L01-13 Tìm được điểm xuất phát | 5 | ✗ | App: từ vựng A2, ngữ pháp A1. Thật: từ vựng A1 của bot chỉ khoảng 0,6, tức chưa nắm. Từ vựng bị ước lượng cao một bậc. |
| L01-14 Thể hiện độ không chắc | 4 | ✗ | Bên trong có trạng thái "suy ra" và câu xác nhận. Màn kết quả chỉ hiện một cấp, không có độ tin cậy; khoảng 60 nút suy ra được coi như đã biết. |
| L01-15 Chẩn đoán ≠ mastery | 4 | ✗ | Claim tách khỏi Đạt ở tầng dữ liệu, nhưng `pass` vẫn tính Claim. Xác nhận khoảng 1 nút/ngày; sau 44 ngày còn 48 Claim sai. |
| L01-16 Phát hiện hồ sơ không đều | 6 | ✗ | Tách được từ vựng và ngữ pháp. Nghe/Đọc "chưa đo"; bài dò không có nghe. |

### C. Gameplay

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-17 Hiểu luật chơi | 8 | ✓ | Mỗi lượt có một câu ngắn ("Trả lời đúng để tấn công"), tim, xu; bot không cần hướng dẫn. |
| L01-18 Không che mục tiêu học | 8 | ✓ | Tiêu đề lượt ghi tên năng lực ("👾 Quái · There is / there are"). |
| L01-19 Độ khó phù hợp | 5 | ✗ | Ngày 0 đúng 79% là hợp lý. Từ ngày 10, đúng 86–100% vì lặp câu cũ. Thắng 46/49 tầng. |
| L01-20 Tách độ khó game và ngôn ngữ | 9 | ✓ | Theo thiết kế, độ khó game chỉ đổi tim; xu/tầng không vào mastery (`engine-quest.test`). |
| L01-21 Game đúng mục tiêu học | 4 | ✗ | 3 nút ngữ pháp bị hỏi khoảng 49 lần mỗi nút sau khi bot đã biết. Unit từ vựng A1 bot chưa nắm thì gần như không vào game. |
| L01-22 Game tạo bằng chứng | 9 | ✓ | 338/338 câu trả lời trong game đều vào sổ, có nguồn gốc. |
| L01-23 Không thành bài thi khô | 6 | ✗ | Có cảnh, tim, xu. Thực chất là câu chọn hoặc tự gõ có biểu tượng, và lặp cùng 3 câu. Bot không đo được "vui". |

### D. Xử lý lỗi

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-24 Không phạt quá mức | 9 | ✓ | Mất 1 tim, vẫn có xu, "Tầng này vẫn chờ bạn, không mất gì". |
| L01-25 Nhận diện lỗi | 9 | ✓ | Mọi câu sai được ghi đúng. |
| L01-26 Không vội kết luận gốc rễ | 8 | ✓ | Một lỗi chỉ được ghi nhận; 0 giả thuyết thiếu phần nền trong 44 ngày. Mastery theo Beta, một lỗi không làm mất Đạt. |
| L01-27 Phản hồi dễ hiểu | 4 | ✗ | Chỉ "Đáp án: aren't / Bạn trả lời: …", không có vì sao. Giải thích chỉ đến sau đó ở trại. |
| L01-28 Phản hồi không dài | 9 | ✓ | Hai dòng. |
| L01-29 Lỗi dẫn tới hành động | 7 | ✗ | Cuối tầng có "Lượt sau app sẽ đưa lại: …", trại dạy phần vừa sai. Không có câu làm lại ngay. |

### E. Micro-learning

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-30 Đúng chỗ thiếu | 7 | ✗ | Trại chiếu bí kíp đúng nút vừa sai (48 lần). Nút từ vựng chỉ có tiêu đề "A1 · Unit 19". |
| L01-31 Đủ nhỏ | 9 | ✓ | Khoảng 5 dòng. |
| L01-32 Hợp trình độ | 7 | ✗ | Tiếng Việt, có đối chiếu với tiếng Việt (tốt cho ngữ pháp). Bí kíp từ vựng nghèo. |
| L01-33 Có ví dụ | 8 | ✓ | 2 ví dụ có dịch. |
| L01-34 Luyện ngay sau giải thích | 4 | ✗ | Trại → "Hồi một tim và đi tiếp"; lượt sau thường là nút khác. |
| L01-35 Kiểm tra sau bí kíp | 3 | ✗ | Bí kíp 60 giây có câu kiểm tra chỉ có ở bài học; người chơi tháp không gặp lần nào. |

### F. Mastery

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-36 Không công nhận quá sớm | 5 | ✗ | Nút có bằng chứng thật: chỉ 3–5 "Đạt" sai (tốt). Nhưng Claim từ chẩn đoán (n = 0) được tính Đạt: 48–60 nút sai. |
| L01-37 Không từ chối vô lý | **1** | ✗ | g-a1-07/08/22: bot thật sự biết (0,83–0,92), đúng hơn 35 lần qua 40 ngày, nhưng app vẫn "cần xác minh" vĩnh viễn vì hết câu mới. |
| L01-38 Mastery đa chiều | 9 | ✓ | 5 mức riêng (nhận ra → tự do), mỗi mức một ô. |
| L01-39 Có độ tin cậy | 8 | ✓ | Có cận dưới và độ tin cậy thấp/vừa/cao; không hiện cho người mới. |
| L01-40 Có thể sửa | 8 | ✓ | 13 lần chuyển từ Đạt về đang học hoặc mở lại; có quyết định REOPEN. |

### G. Thích ứng

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-41 Biết cần gì tiếp | 5 | ✗ | Luôn có bước tiếp theo, nhưng cùng một bước suốt 40 ngày. |
| L01-42 NBA theo trạng thái | 7 | ✗ | Đúng về cấu trúc (có unit test). Một bot không đủ để so hai người học; L02 sẽ so. |
| L01-43 NBA đổi khi bằng chứng đổi | **2** | ✗ | Kỹ năng thật ở "There is / there are" tăng 0,58 → 0,84, bước tiếp theo vẫn là nó. |
| L01-44 Có thể bỏ qua | 5 | ✗ | Chẩn đoán bỏ được cấp dưới; có "Tôi biết rồi". Nhưng nút đã biết không được bỏ qua (kẹt). |
| L01-45 Có thể ôn lại | 3 | ✗ | Rương: 0 lượt trong 44 ngày; NBA không đề xuất ôn lần nào. |
| L01-46 Dò thêm khi chưa chắc | 8 | ✓ | Trinh sát 49 lượt và kiểm tra nhanh 19 lần (xác nhận / ranh giới). |

### H. Bằng chứng

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-47 Câu trả lời không thành mastery trực tiếp | 9 | ✓ | Câu trả lời → sổ → tổng hợp → Beta (L0–L4), có test. |
| L01-48 Có nguồn gốc | 9 | ✓ | Mỗi câu có `ch` (vd. `quest-1:12:3:g:…`), phiên, máy, thời điểm. |
| L01-49 Biết ngữ cảnh | 8 | ✓ | quest-monster / transfer / probe / measure / diag. |
| L01-50 Biết dạng câu | 8 | ✓ | Câu chọn / tự gõ và mức 1–5. Game chưa có câu nghe. |
| L01-51 Nhận diện làm lại | 7 | ✗ | Có cờ retry và tính câu mới; câu lặp vẫn cộng Beta đầy đủ (m = 0,97 trên 3 câu lặp). |
| L01-52 Nhận diện gợi ý | 8 | ✓ | Câu có gợi ý tính trọng số 0,5; câu sau bí kíp có cờ `hint`. |
| L01-53 Xét khả năng đoán | 8 | ✓ | Độ tin cậy giảm theo số phương án; có ước lượng tỉ lệ đoán. |

### I. Kết quả học (mô phỏng, xem giới hạn)

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-54 Tăng ngay | 6 | ✗ | Sau khi sai và đọc bí kíp, câu đó lần sau thường đúng. Đó là vì app hỏi lại đúng câu cũ. |
| L01-55 Tăng sau một thời gian | 5 | ✗ | Đo 7 ngày bằng đo sau (7/12). |
| L01-56 Transfer | 3 | ✗ | Câu mới chỉ đúng 68% (câu đã gặp 89%); nút thật sự biết 0 → 4/34 sau 473 câu. |
| L01-57 Nhớ lâu | 3 | ✗ | Không có vòng ôn nào trong game. Đo 30 ngày 9/12, nhưng cùng 12 câu đo lần thứ 4, nên có hiệu ứng quen câu. |
| L01-58 Tự lực | 6 | ✗ | Game không có gợi ý; mức 3 bắt tự gõ. |
| L01-59 Năng lực ngoài game | 5 | ✗ | Ngoài game (đo/dò) đúng 60–66%, so với 80% trong game. |

### J. Động lực (suy ra từ màn hình)

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-60 Muốn chơi tiếp | 3 | ✗ | Tiến độ thật giảm 4 → 1/36 sau 44 ngày; người thật rất dễ bỏ. |
| L01-61 Phần thưởng không đánh lừa | 8 | ✓ | Tháp ghi "Thắng hay thua không đổi đánh giá năng lực" ngay cạnh tiến độ thật. |
| L01-62 Sai không làm bỏ cuộc | 8 | ✓ | Thua 3/49 tầng, không mất gì. |
| L01-63 Tiến độ có ý nghĩa | **2** | ✗ | Tầng 47, 3.980 xu, mà năng lực Đạt 1/36. Hai số đi ngược nhau. |

### K. Lộ trình

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-64 Cá nhân hoá | 7 | ✗ | Lộ trình dựng từ kết quả dò của bot (bỏ cấp dưới). Đúng ý, nhưng dựa trên ước lượng từ vựng cao. |
| L01-65 Theo tiền đề | 8 | ✓ | Tiền đề cứng chặn; nhóm tiền đề thay thế (v67). |
| L01-66 Không thừa | 5 | ✗ | Đúng phạm vi mục tiêu, nhưng lãng phí: khoảng 150 lượt cho 3 nút đã biết. |
| L01-67 Có thể thay đổi | **3** | ✗ | Về thiết kế thì đổi được; thực tế đứng yên 40 ngày. |

### L. Vòng khép kín

| ID | Điểm | KQ | Quan sát |
|---|---|---|---|
| L01-68 Chơi → Quan sát | 9 | ✓ | Mọi lượt thành bằng chứng. |
| L01-69 Quan sát → Suy luận | 8 | ✓ | Beta, độ tin cậy, xác minh, mở lại. |
| L01-70 Suy luận → Thích ứng | 5 | ✗ | Chọn câu theo loại lỗ hổng: có. Trạng thái "cần xác minh" kẹt thì không đổi được hành động. |
| L01-71 Thích ứng → Học | 6 | ✗ | Trại dạy phần vừa sai; không có luyện ngay sau đó. |
| L01-72 Học → Kiểm tra | 3 | ✗ | Cổng xác minh có nhưng kẹt; không có câu kiểm tra sau bí kíp trong game. |
| L01-73 Kiểm tra → Transfer | 5 | ✗ | Trùm câu mới 46 lượt, nhưng hỏi chủ yếu nút bot chưa biết, không phải nút vừa đạt. |
| L01-74 Transfer → Nhớ lâu | 2 | ✗ | Không có lượt ôn nào. |
| L01-75 Nhớ lâu → Chơi | 2 | ✗ | Rương có trong thiết kế, chưa xuất hiện lần nào. |

### M. Hard gate

| ID | Điểm | KQ | Chứng cứ |
|---|---|---|---|
| L01-76 Điểm game ≠ mastery | 10 | PASS | Xu/tầng chỉ nằm ở `e.q`; tầng 47 nhưng Đạt 1/36. Có test `engine-quest`. |
| L01-77 Hoàn thành bài ≠ mastery | 10 | PASS | Chỉ câu trả lời mới vào sổ. Tiến độ cũ trước v55 chỉ là Claim. |
| L01-78 Một lỗi ≠ thiếu kiến thức chắc chắn | 10 | PASS | 0 giả thuyết từ lỗi lẻ; luật bí kíp "log" cho lỗi lẻ. |
| L01-79 Người học không phải tự quyết lộ trình | 10 | PASS | Mục tiêu tự đặt, game tự chọn câu. |
| L01-80 Không phụ thuộc AI lúc chạy | 10 | PASS | Bot chạy hết 44 ngày không gọi API nào; app không có lời gọi AI; có `offline.spec`. |

Các cổng khác trong danh sách Hard Gate của spec (có kiểm tra lại, có transfer, có trạng thái người học, có bằng chứng, NBA theo trạng thái) đều **có cơ chế**, nên PASS. Chạy thật thì cơ chế kiểm tra lại bị kẹt, đó là lý do các nhóm F, G, L thấp.

## Đề xuất sửa (theo thứ tự gốc rễ)

1. **Gỡ kẹt "cần xác minh"** (`ev/store.ts` derive, luật m3.3; chạy lại mô phỏng):
   - Một câu đã gặp mà trả lời đúng sau ≥ 1 ngày không gặp (nhớ lại cách quãng) được tính như câu mới.
   - Hoặc miễn khi đã hết câu mới ở mức đó, giống ngoại lệ của Readiness.
   - Thêm test đúng kịch bản bot: 3 câu, sai lần đầu 2 câu, sau đó đúng nhiều ngày → phải Đạt.
2. **Chống hỏi lại quá mức trong game:**
   - Mỗi nút tối đa 2 lượt/tầng.
   - Nút đang chờ xác minh mà hết câu mới → chuyển sang mức kế tiếp hoặc trùm transfer, hoặc tạm rời biên lộ trình.
3. **Claim từ chẩn đoán không tính là Đạt:**
   - Tiến độ và Readiness tách "đã Đạt" khỏi "suy ra, chờ xác nhận".
   - Trinh sát trong game ưu tiên xác nhận Claim, nhiều nút mỗi tầng thay vì 1 nút/ngày ngoài game.
4. **Khép vòng nhớ lâu trong game:** rương lấy cả Claim đã xác nhận và nút Đạt sắp quên. Sau trại thêm 1 câu kiểm tra cùng nút.
5. **Phản hồi khi sai:** thêm một dòng "vì sao" lấy từ bí kíp của nút.
6. **Giao diện người mới:**
   - Ẩn bảng giờ học IELTS/VSTEP khi chỉ có CEFR.
   - Thêm nút cho "Bước tiếp theo" trên tháp.
   - Ghi đúng số câu dò.
7. **Đo:** dùng bộ câu song song cho các lần đo sau, tránh hiệu ứng quen câu.

Sau khi sửa: chạy lại bot cùng seed và vài seed khác, so bảng này.
