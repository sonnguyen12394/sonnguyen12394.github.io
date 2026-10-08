# L02: Người học yếu / nhiều lỗ hổng

**Bot:** `Learner_02_Weak_Learner`. Mã ở `tools/learners/l02.ts`; lõi chung `core.ts`; phân tích `analyze-l02.ts`.

**Cách chạy:**
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- 23 phiên trong 44 ngày mô phỏng.
- Bản app: v69 (nhánh `claude/l01-bot`).

**Các lần chạy:**
- `s1`, `s2`, `s3`: 3 seed.
- `fast`: seed 1, học sau giải thích nhanh gấp 2 (độ nhạy).
- Tổng 2.063 câu trả lời, 0 lỗi trang, 0 lần kẹt giao diện.

**Bot không tự chọn bài học.** Sau bài dò, bot vào "Mục tiêu" và chọn CEFR B1 (việc người học được phép làm). Từ đó bot chỉ làm theo màn hình. Để biết đáp án đúng, bot dùng `EM.peek()`, chỉ đọc. Bot trả lời đúng hay sai theo hồ sơ ẩn bên dưới.

> **Giới hạn trung thực.** Hồ sơ học/quên do bot đặt ra, nên nhóm I/N (kết quả học) chỉ cho biết app có tạo điều kiện để học hay không, không chứng minh hiệu quả trên người thật. Phần bot đo chắc nhất:
> - app đoán điểm yếu đúng tới đâu;
> - app gắn đúng nguyên nhân không;
> - app có bị câu lặp đánh lừa không;
> - app phản ứng ra sao với 10 kịch bản.
>
> Trong lúc làm, bot có hai lỗi đo của chính nó; cả hai đã sửa trước lần chạy cuối:
> - Gõ "idk" lặp lại, khiến app tạo giả thuyết hiểu sai giả.
> - So "yếu" theo kiến thức chung thay vì theo đúng mức app đang đo.

## Ground truth → App inference → Difference

```
========================================
LEARNER 02 — WEAK LEARNER          (thang 10; đạt = ≥ 8)
========================================
TARGET:            CEFR B1 (bot tự chọn ở Mục tiêu; app giữ thêm A1 tự đặt)
GROUND TRUTH:      Từ vựng A1 0,85 / A2 0,6 · Ngữ pháp A1 0,5 / A2 0,3 · Nghe 0,2
                   Nhớ lại thấp (tự gõ s^2,2) · Dùng có kiểm soát thấp (s^2,8)
                   Transfer thấp (câu mới ×0,7, lên dần khi nhớ bền) · Nhớ lâu thấp (S = 1,5 ngày)
                   Hiểu sai: g-a1-01 (to be), g-a1-04 (số nhiều) — sai cùng chữ; g-a1-08 (hiện tại đơn) — sai cùng mẫu
                   Nút thắt chính: nền ngữ pháp · Nút thắt phụ: nghe
APP INFERENCE:     Bài dò: từ vựng A1 (3/4 lần; một lần A1–A2), ngữ pháp A1 · Nghe/Đọc: "chưa đo"
                   Điểm yếu theo nút (nút có ≥ 3 lượt): khớp 3 lớp 35–88%, ngược chiều 0–7%,
                     tương quan m của app với năng lực thật 0,55–0,83
DIFFERENCE:        Từ vựng thấp hơn thật một bậc (bỏ qua ít hơn đáng có)
                   Không hề đo nghe: nút thắt phụ vô hình với app
----------------------------------------
DIAGNOSTIC
----------------------------------------
Weakness Detection        7,1   (A)
Root Cause Detection      5,9   (B)  nhãn lỗ hổng khớp nguyên nhân thật 17–24% số lượt có nhãn
Misconception Detection   3,7   (C)  kiểu "sai cùng chữ" bắt được 2/4 lần; "sai cùng mẫu" 0/4;
                                     can thiệp nhắm đúng: 0 lần
----------------------------------------
ADAPTATION
----------------------------------------
Intervention Selection    7,4   (D)
Learning Path             6,6   (E)
Mastery                   7,7   (F)  Đạt sai: 0 ở cả 4 lần chạy
Evidence                  7,8   (G)
Error Recovery            6,2   (H)
----------------------------------------
LEARNING (mô phỏng)
----------------------------------------
Learning Gain             4,9   (I)  câu mới 25–37% → 45–57%; câu quen 86–98% → 97–100%
Retention                 6,8   (J)
Transfer                  6,4   (K)
End-to-end                3,0   (N)  kỹ năng nền ngữ pháp KHÔNG tăng ở 3/4 lần chạy
----------------------------------------
EFFICIENCY
----------------------------------------
Unnecessary Practice      11–33% lượt ở phần đã dùng được
Unnecessary Diagnostic    dò chiếm 134–170 lượt (≈ 30% số câu), rải 105–129 nút;
                          dò nút đã vững chỉ 1–5 lượt
Repeated items            28–41% lượt trong tháp là câu đã gặp
----------------------------------------
HARD GATES                12 / 12 PASSED
TRUNG BÌNH 100 TIÊU CHÍ   6,5 / 10 · 36/100 đạt ≥ 8
OVERALL                   ❌ NOT READY cho người học yếu
----------------------------------------
MAIN PROBLEMS
----------------------------------------
1. Nguyên nhân gốc chỉ suy theo bậc mức (nhận ra → nhớ ra → dùng). App không dùng chênh lệch câu quen / câu mới
   để nhận ra lỗi transfer, không có loại "hiểu sai" trong game, không có câu dò phân biệt giả thuyết.
2. Hiểu sai: chỉ bắt khi cùng một chuỗi trả lời lặp lại. Bắt được cũng không có bí kíp nhắm đúng trong tháp
   (thẻ "Bạn hay trả lời…" chỉ có ở bí kíp ngoài game).
3. Can thiệp thất bại không đổi cách: câu thử sau bí kíp sai 21–29 lần/lần chạy, app ghi "chưa được" nhưng lần
   sau vẫn dùng đúng loại can thiệp đó.
4. Không đo Nghe/Đọc trong luồng chính, nên hồ sơ không đều (nghe A1) không được phát hiện.
5. Học không bền với người học yếu: tỉ lệ đúng tăng (53 → 65%) chủ yếu nhờ câu quen. Kỹ năng nền ngữ pháp
   0,62 → 0,56; 0,64 → 0,73; 0,64 → 0,59; 0,70 → 0,56. App KHÔNG bị lừa (không công nhận Đạt sai),
   nhưng cũng không sửa được gốc.
6. Dò quá nhiều cho mục tiêu B1 lớn: ≈ 30% lượt là dò, rải hơn 100 nút; người yếu cần tập trung vào nền.
----------------------------------------
RECOMMENDED CHANGES
----------------------------------------
1. Phân loại lỗ hổng từ bằng chứng:
   - transfer = câu quen đúng ≥ 80% mà câu mới < 50%;
   - hiểu sai theo MẪU (quy tắc sai lặp lại, không chỉ cùng chuỗi);
   - câu dò chọn để phân biệt giả thuyết (nhận ra so với tự nhớ, câu quen so với câu mới).
2. Lỗ hổng "hiểu sai" → trại dùng bí kíp nhắm đúng ("Bạn hay trả lời X…", đối chiếu đúng/sai), rồi câu kiểm tra.
3. Leo thang can thiệp khi câu thử sai: đổi cách dạy (cặp đúng/sai, ví dụ khác), hạ mức (nhận ra trước),
   dạy lại ngắn; không lặp cùng can thiệp.
4. Ôn cả nút ĐANG HỌC theo khả năng nhớ từ sổ (không chỉ nút đã Đạt), để kiến thức người yếu kịp bền.
5. Ngân sách dò theo tỉ lệ đúng: người học yếu thì dò ít, tập trung nút nền của nút thắt.
6. Đưa câu nghe (nút âm, bài nghe) vào tháp và bài dò.
```

## 10 kịch bản bắt buộc

Mỗi kịch bản được ép lên **câu app đang hỏi**; bot không tự chọn bài.

| Kịch bản | Kết quả (s1 · s3) | Đánh giá |
|---|---|---|
| **S01** sai một lần giữa chuỗi đúng | m 0,34 → 0,48 · 0,67 → 0,66, trạng thái giữ nguyên "đang học"; lượt sau vẫn hỏi bình thường | ✓ Không phản ứng thái quá |
| **S02** sai 3 lần liên tiếp | m mức 3: 0,79 → 0,21; app hạ về câu nhận ra (lỗ hổng "chưa biết") | ✓ Có tăng nghi ngờ; ✗ không có câu dò nguyên nhân, không giả thuyết |
| **S03** câu chọn đúng, câu gõ sai | Mức 2 thành **Đạt**, mức 3 vẫn "đang học" (0,77 → 0,71); lượt sau là luyện "tự nhớ ra" | ✓ Phân biệt nhận ra và tự nhớ ra |
| **S04** câu quen đúng, câu mới sai | Trạng thái giữ "đang học"; lượt sau vẫn gắn nhãn "nhớ ra", không phải "transfer" | ✗ Không nhận ra lỗi transfer từ bằng chứng |
| **S05** đúng sau bí kíp, kiểm lại ≥ 3 ngày sau | 2–4 trường hợp/lần chạy, đúng 100% | ✓ (mẫu nhỏ) |
| **S06** đã Đạt, quên rồi sai khi ôn | Sai 1–2 lần ở rương → **mở lại**; lượt sau là rương ôn / trùm câu mới, không học lại từ đầu | ✓ Ôn, không học lại |
| **S07** đoán trúng | 9–16 lần đoán trúng/lần chạy; **0** nút được Đạt chủ yếu nhờ đoán | ✓ |
| **S08** gợi ý | Tháp không có nút gợi ý. Engine giảm trọng số câu có gợi ý ×0,5 (`evaluate.ts`, test `engine-evidence`) | — Không có trong luồng chính |
| **S09** làm lại | Tháp không cho làm lại. Engine có cờ retry ×0,3; lặp trong ngày ×0,5 | — Không có trong luồng chính |
| **S10** trước / sau can thiệp | Câu mới của nút: 0,48–0,56 → 0,75–1,0 (0–4 nút/lần chạy; s1 không có nút đủ dữ liệu) | ✓ Có tác dụng ngay; hiệu quả lâu dài xem nhóm I |

## 100 tiêu chí (0–10)

Mỗi dòng: điểm, kết quả (✓ đạt ≥ 8, ✗ chưa), rồi quan sát và chứng cứ.

### A. Phát hiện điểm yếu: 7,1
- **L02-01** · 8 ✓: Nút app cho là yếu khớp năng lực thật (s1: 11/11 "yếu–yếu"). Tương quan 0,55–0,83.
- **L02-02** · 8 ✓: Có m (%) và độ tin cậy thấp/vừa/cao trên chip; "suy ra / chưa có bằng chứng" khi thiếu dữ liệu.
- **L02-03** · 4 ✗: Tách từ vựng và ngữ pháp, nhưng từ vựng bị đánh giá thấp một bậc (3/4 lần). Nghe/Đọc không đo.
- **L02-04** · 7 ✗: Mỗi nút một ô riêng, không lấy từ vựng bù ngữ pháp. Nhưng nghe không có dữ liệu, nên app im lặng chứ không đánh giá.
- **L02-05** · 6 ✗: Ngữ pháp A1–A2 chiếm 33–57% lượt; "Bước tiếp theo" là điểm ngữ pháp. Chưa có khái niệm nút thắt nói rõ cho người học.
- **L02-06** · 8 ✓: Lộ trình từ bao đóng B1 kèm tiền đề.
- **L02-07** · 5 ✗: Có trạng thái suy ra / chưa có / đang học. Nhưng ở 56–76% lượt có nhãn, app gắn lỗ hổng cho phần bot thật ra đã làm được ở mức đó (chưa chứng minh bị coi như chưa biết).
- **L02-08** · 8 ✓: S01: một lỗi không đổi trạng thái.
- **L02-09** · 9 ✓: S07: 0 nút Đạt nhờ đoán; Đạt sai 0.
- **L02-10** · 8 ✓: Mọi kết luận có snapshot và bằng chứng (màn Vì sao?).

### B. Nguyên nhân gốc: 5,9
- **L02-11** · 5 ✗: Có nhãn lỗ hổng theo nút, nhưng suy theo bậc mức, không theo bằng chứng. Giả thuyết phần nền: 0.
- **L02-12** · 7 ✗: Giả thuyết hiểu sai / phần nền là trạng thái riêng, yếu dần khi đúng.
- **L02-13** · 5 ✗: 134–170 lượt dò, nhưng là dò khám phá / xác nhận, không phải dò nguyên nhân sau lỗi (S02).
- **L02-14** · 5 ✗: Dò chọn theo lượng thông tin, không theo giả thuyết cần phân biệt.
- **L02-15** · 8 ✓: Biết lơ mơ hoặc chưa biết → nhãn "chưa biết" đúng 88–100%.
- **L02-16** · 7 ✗: S03 phân biệt đúng; nhãn "nhớ ra" xuất hiện khi mức 3 chưa Đạt.
- **L02-17** · 5 ✗: Lỗ hổng "dùng" (mức 4) thật: app gắn nhãn khác ở hầu hết trường hợp.
- **L02-18** · 4 ✗: Lỗi transfer thật: app gắn đúng 26–66%. S04 không được nhận ra.
- **L02-19** · 6 ✗: S06 xử lý đúng (mở lại + ôn), nhưng nhãn "nhớ lâu" chỉ có cho nút đã Đạt.
- **L02-20** · 7 ✗: Tham số slip; một lỗi không kéo can thiệp lớn.

### C. Hiểu sai: 3,7
- **L02-21** · 4 ✗: Kiểu sai cùng chữ: bắt được 2/4 lần chạy (ngày 0). Kiểu sai cùng mẫu: 0/4.
- **L02-22** · 3 ✗: Trong game, nút hiểu sai bị gắn "chưa biết" như mọi nút.
- **L02-23** · 3 ✗: Chỉ đếm cùng một chuỗi trả lời, không gộp theo mẫu qua nhiều câu / ngữ cảnh.
- **L02-24** · 2 ✗: Bí kíp "Bạn hay trả lời…" có trong code nhưng hiện 0 lần (chỉ ở bí kíp ngoài game).
- **L02-25** · 3 ✗: Giả thuyết hiểu sai chỉ yếu dần khi trả lời đúng; không có câu kiểm tra riêng.
- **L02-26** · 7 ✗: Phản hồi hiện đáp án đúng và dòng vì sao, không lặp lại mẫu sai.

### D. Can thiệp: 7,4
- **L02-27** · 7 ✗: Trại nhắm nút vừa sai.
- **L02-28** · 5 ✗: Đúng loại theo bậc mức; không có cách sửa riêng cho hiểu sai hay transfer.
- **L02-29** · 9 ✓: Một thẻ và một câu.
- **L02-30** · 8 ✓: Thẻ dạy trước (một lần), bí kíp ở trại, dòng vì sao.
- **L02-31** · 8 ✓: Lỗ hổng nhớ ra → câu tự gõ; xác minh bằng nhớ lại cách quãng.
- **L02-32** · 5 ✗: Có cách sửa theo ngữ cảnh yếu, nhưng game chỉ có vài ngữ cảnh.
- **L02-33** · 7 ✗: Trùm câu mới 44–55 lượt/lần chạy.
- **L02-34** · 9 ✓
- **L02-35** · 8 ✓: Đáp án và dòng "💡 vì sao".
- **L02-36** · 8 ✓: Câu thử sau bí kíp + snapshot đã sửa / chưa (fixed 11–21, not-yet 21–29).

### E. Lộ trình thích ứng: 6,6
- **L02-37** · 6 ✗: Claim sai bị phủ định (tới 86 lần ở s2), nhưng "Bước tiếp theo" chỉ đổi 2–3 lần.
- **L02-38** · 6 ✗: Có ưu tiên tiền đề (mở đường cho nhiều năng lực), nhưng dò rải khắp B1.
- **L02-39** · 8 ✓: Tiền đề cứng chặn.
- **L02-40** · 6 ✗: Giới hạn 6 phần học dở giữ tập trung, nhưng dò chạm 105–129 nút.
- **L02-41** · 5 ✗: Từ vựng A1 (đã biết) bị chẩn đoán thấp; 11–33% lượt ở phần đã dùng được.
- **L02-42** · 8 ✓: S06: mở lại và ôn.
- **L02-43** · 6 ✗
- **L02-44** · 8 ✓: Mỗi seed một lộ trình khác (ngữ pháp 33–57%).

### F. Mastery: 7,7
- **L02-45** · 9 ✓: Đạt sai 0/4 lần chạy.
- **L02-46** · 7 ✗: Đạt 2–4 nút, khớp với 3–7 nút bot dùng được; không kẹt.
- **L02-47** · 9 ✓: S03.
- **L02-48** · 8 ✓: Mức 3 và mức 4 tách riêng.
- **L02-49** · 6 ✗: Mức 5 có trong mô hình nhưng game không đo dùng tự do.
- **L02-50** · 6 ✗: Đa dạng dạng câu / ngữ cảnh chỉ nâng độ tin cậy, không bắt buộc để Đạt.
- **L02-51** · 7 ✗: Ngữ cảnh có ghi; transfer bắt buộc ở Readiness.
- **L02-52** · 8 ✓: Câu sau thẻ / bí kíp tính là có trợ giúp.
- **L02-53** · 8 ✓
- **L02-54** · 9 ✓: S06, có snapshot REOPEN.

### G. Bằng chứng: 7,8
- **L02-55** · 9 ✓
- **L02-56** · 9 ✓
- **L02-57** · 8 ✓
- **L02-58** · 8 ✓
- **L02-59** · 5 ✗: Độ khó chỉ gửi ở câu thi; câu trong tháp không có độ khó.
- **L02-60** · 8 ✓
- **L02-61** · 6 ✗: Không có làm lại trong luồng chính; lặp trong ngày ×0,5.
- **L02-62** · 9 ✓: Câu mới / nhớ lại cách quãng (m3.3).
- **L02-63** · 8 ✓: Có độ tin cậy `rel`.
- **L02-64** · 8 ✓: Beta, mâu thuẫn → mở lại, bằng chứng cũ nhẹ dần.

### H. Phục hồi sau lỗi: 6,2
- **L02-65** · 8 ✓: S01.
- **L02-66** · 6 ✗: Hai lỗi liên tiếp ở nút đã Đạt → mở lại; ở nút đang học chỉ là m giảm.
- **L02-67** · 5 ✗: Không có logic lỗi lặp qua nhiều ngữ cảnh.
- **L02-68** · 3 ✗: Câu thử sau bí kíp sai 21–29 lần mà không đổi can thiệp.
- **L02-69** · 8 ✓: Sai ở mức cao chỉ tính cho đúng mức đó (m3.1).
- **L02-70** · 7 ✗: Mở lại + rương ôn.

### I. Tiến bộ học (mô phỏng): 4,9
- **L02-71** · 7 ✗: S10: 0,5 → 0,75–1,0.
- **L02-72** · 5 ✗: S05 đúng 100% nhưng mẫu nhỏ; đo giữ riêng đứng yên (1–5/12).
- **L02-73** · 6 ✗: Câu mới 25–37% → 45–57%.
- **L02-74** · 6 ✗: Lỗi theo nút 0,5 → 0–0,17, một phần nhờ câu quen.
- **L02-75** · 3 ✗: Kỹ năng nền ngữ pháp không tăng ở 3/4 lần chạy.
- **L02-76** · 4 ✗: Chưa đo được; độ bền trí nhớ chỉ tăng ở nút được ôn.
- **L02-77** · 3 ✗: Khoảng 500 câu → +3–7 nút dùng được; kỹ năng trung bình đứng yên.

### J. Nhớ lâu: 6,8
- **L02-78** · 7 ✗: Khả năng nhớ từ sổ, S06.
- **L02-79** · 6 ✗: Chỉ ôn nút đã Đạt; nút đang học quên mà không có lịch ôn.
- **L02-80** · 9 ✓: Ôn theo nút.
- **L02-81** · 5 ✗: Rương / luyện hay lấy lại câu đã gặp (28–41% lượt).
- **L02-82** · 7 ✗: Xác minh bằng nhớ lại cách quãng + rương.

### K. Transfer: 6,4
- **L02-83** · 8 ✓: Trùm câu mới.
- **L02-84** · 5 ✗: Ít ngữ cảnh trong game.
- **L02-85** · 7 ✗: Câu khác cùng nút.
- **L02-86** · 5 ✗: Cùng câu thì cùng phương án.
- **L02-87** · 7 ✗: Câu chọn (mức 1–2) → tự gõ (3) → sản sinh (4).

### L. Động lực: 6,5
- **L02-88** · 6 ✗: Lời lẽ nhẹ ("không sao: đây là lượt luyện"), nhưng thua 16–24 tầng/lần chạy (khoảng 35%).
- **L02-89** · 7 ✗: Dòng vì sao, "Lượt sau app sẽ đưa lại…".
- **L02-90** · 5 ✗: "Kỹ năng đã vững" chỉ 2–4 trên cả bao đóng B1.
- **L02-91** · 5 ✗: 28–41% câu lặp; tối đa 3–4 lượt/nút/ngày.
- **L02-92** · 7 ✗: Thang mức 1 → 4.
- **L02-93** · 9 ✓: Một tầng 8 câu, 4–6 phút.

### M. Hiệu quả: 6,4
- **L02-94** · 5 ✗: Từ vựng A1 bị coi là chưa biết.
- **L02-95** · 9 ✓: Can thiệp theo một nút, không cả chương.
- **L02-96** · 4 ✗: Dò khoảng 30% lượt, không giảm theo tình trạng người học.
- **L02-97** · 7 ✗: Giới hạn lượt/nút/ngày, giới hạn phần học dở.
- **L02-98** · 7 ✗: NBA có trọng số tiền đề / mục tiêu.

### N. Kết quả cuối: 3,0
- **L02-99** · 3 ✗: Kỹ năng nền ngữ pháp không giảm lỗ hổng ở 3/4 lần chạy.
- **L02-100** · 3 ✗: Đạt 2–4 nút của bao đóng B1 sau 44 ngày.

### Hard gate: 12/12 PASS
| Gate | Chứng cứ |
|---|---|
| HF01 Một lỗi → chắc chắn chưa biết | S01: không đổi trạng thái |
| HF02 Điểm game → mastery | 0 liên hệ; Đạt chỉ từ câu trả lời |
| HF03 Hoàn thành bài → mastery | Không dùng |
| HF04 Không phân biệt "chưa biết" và "chưa nhớ ra" | S03: mức 2 Đạt, mức 3 chưa; nhãn "chưa biết" và "nhớ ra" |
| HF05 Không phát hiện lỗi lặp | S02: m giảm mạnh; nút đã Đạt sai 2 lần → mở lại |
| HF06 Không đổi lộ trình | Claim bị phủ định → vào lộ trình; mở lại → ôn |
| HF07 Bí kíp không có kiểm tra | Câu thử sau trại + snapshot |
| HF08 Mastery không giảm | S06: mở lại |
| HF09 Chỉ lặp cùng câu để Đạt | Cần ≥ 2 câu khác nhau (m3.2/m3.3); câu quen không thành Đạt |
| HF10 Không kiểm transfer | Trùm câu mới; Readiness đòi transfer |
| HF11 Bắt học lại phần đã Đạt chắc | Không thấy; dò nút đã vững chỉ 1–5 lượt |
| HF12 Dò vô hạn dù đủ bằng chứng | Không dò lại nút đã vững. Nhưng tổng lượng dò cao (xem L02-96) |

## Ghi chú về "tiến bộ giả"

Tỉ lệ đúng trong tháp tăng từ 53% lên 65%. Phần lớn đến từ câu quen: câu đã gặp đúng 86–98% lúc đầu, 97–100% về sau, trong khi câu mới chỉ 25–37% → 45–57%. Kỹ năng nền ngữ pháp thật không tăng ở 3/4 lần chạy.

App **không bị lừa** bởi câu quen: không công nhận Đạt nhờ câu lặp, do luật ≥ 2 câu khác nhau và câu mới / nhớ lại cách quãng. Nhưng app **chưa sửa được gốc**: không nhận ra lỗi transfer, không gỡ được hiểu sai bằng can thiệp nhắm đúng, và không ôn nút đang học kịp trước khi quên. Đây là ba việc đáng làm nhất ở vòng sửa L02.
