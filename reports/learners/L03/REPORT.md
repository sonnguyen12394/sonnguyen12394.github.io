# L03: Người học trung bình (Intermediate)

**Bot:** `Learner_03_Intermediate`. Mã: `tools/learners/l03.ts`; lõi chung `core.ts`; phân tích `analyze-l03.ts`.

**Cách chạy:**
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- **v70** (nhánh `claude/l02-bot`): lần đánh giá đầu, không sửa app.
- **v71** (nhánh `claude/l03-bot`): sửa theo dữ liệu bot, chạy lại đủ 7 lần, cùng hồ sơ ẩn và cùng seed.

**v71: 7 lần chạy × 44 ngày (23 phiên), tổng 3.546 câu, 0 lỗi trang, 0 lần kẹt:**

| Lần chạy | Hồ sơ | Mục tiêu bot chọn | Kịch bản |
|---|---|---|---|
| `b1s1`, `b1s2`, `b1s3` | A2+ | CEFR B1 | — |
| `b2s1` | B1 | CEFR B2 | — |
| `fast` | A2+, học nhanh gấp 2 | B1 | S01 |
| `slow` | A2+, học chậm còn một nửa | B1 | S02 |
| `short` | A2+, mỗi ngày 1 tầng (5–6 phút) | B1 | S15 |

**Dữ liệu:** `v70/<lần chạy>/…` và `v71/<lần chạy>/rows.json`, `events.json`, `screens.json`, `metrics-l03.json`.

**Bot không tự chọn bài học.** Sau bài dò, bot vào "Mục tiêu" và chọn CEFR B1 (hoặc B2); từ đó chỉ làm theo màn hình. Để biết đáp án đúng, bot dùng `EM.peek()` (chỉ đọc) và trả lời đúng hay sai theo hồ sơ ẩn.

> **Giới hạn trung thực.** Hồ sơ học/quên do bot đặt ra, nên nhóm L (kết quả) chỉ cho biết app có tạo điều kiện để học hay không, không chứng minh hiệu quả trên người thật.
> - **Nói / Viết** không có trong tháp, nên phần "speaking yếu" của hồ sơ app không thể thấy.
> - **S09 / S10** không tạo được: game không có kỹ năng thao tác (không tính giờ, không phản xạ); điểm game chỉ sinh từ câu trả lời.
> - Bot không lặp lại bit-by-bit (app dùng thời gian thật), nên mỗi chỉ số ghi **khoảng** qua 7 lần chạy, không phải một con số.

## Đính chính báo cáo v70

- **"Nghe 0% là Điểm nghẽn" là sai do lỗi đo.** Tên phần nghe có ngoặc ("Phân biệt âm /ɪ/ – /iː/ (i ngắn – i dài)"), bộ phân tích cắt ở "(" nên không khớp. Đo lại trên màn hình đã lưu: v70 là **0–37%** (b1s1 20/54, b1s3 11/50, fast 6/49, slow 9/51, ba lần còn lại 0). Đã sửa `analyze-l03.ts`.
- **S12 ("đúng ≥ 2 câu mới nhưng không Đạt") đánh giá app quá khắt khe.** Nhiều nút qua S12 có năng lực thật ở mức cần chỉ 0,3–0,6 (đúng 2 câu mới là chuyện bình thường với người biết lơ mơ). So sánh công bằng hơn là **"dùng được thật (năng lực ≥ 0,75 ở mức cần) so với Đạt"**, ghi ở mục GOAL PROGRESS.

## Ground truth → App inference → Difference (v71)

```
========================================
LEARNER 03 — INTERMEDIATE           (thang 10; đạt = ≥ 8)
========================================
TARGET            CEFR B1 (hồ sơ A2+) · CEFR B2 (hồ sơ B1)
GROUND TRUTH      Mạnh: từ vựng (A1 0,9 / A2 0,75 / B1 0,5) · Vừa: ngữ pháp (A1 0,8 / A2 0,6)
                  Yếu: nghe (0,35, nút thắt) · chức năng giao tiếp (0,4) · Nhớ lâu vừa · Transfer thấp–vừa
APP INFERENCE     Bài dò: từ vựng A2 (5/7) · A1–A2 (1/7) · ngữ pháp A1–A2 / A2 / A2–B1
                  Hồ sơ B1: tự nhớ ra từ vựng A2, NHẬN RA tới B1 (trần nhận ra), ngữ pháp A2–B1
DIFFERENCE        Mức tự nhớ ra vẫn thấp hơn thật khoảng ½ bậc; mức nhận ra giờ khớp
                  Mục tiêu bạn chọn (B1/B2) là mục tiêu chính; A2 app tự đặt giữ làm bậc đệm
                  Nghe 17–29% số lượt (v70: 5–15%); là "Điểm nghẽn" 0–22% số lần hiện (v70 đo lại: 0–37%)
----------------------------------------
LEARNER MODEL                      v70            →  v71
  Khớp 3 lớp (yếu/giữa/vững)       36–47%            53–66%
  Ngược chiều ở hai đầu            0–6%              4,5–12,5%   (xấu hơn, xem Vấn đề 4)
  Tương quan app ↔ thật            0,48–0,82         0,70–0,85
  Luyện lại từ vựng A1–A2 đã vững  10–46%            4,5–14% (B1) · 37% (B2)
  Lượt nghe                        5–15%             17–29%
ADAPTATION
  Lên mức sau 3 lượt đúng          8–56%             20–55%
  Hạ mức sau MỘT lỗi               6–47%             0–19%
  Độ trễ thích ứng (trung bình)    0–3,1 lượt        0,7–3,7 lượt; trung vị 0
  "Bước tiếp theo" đổi             3–9 lần           4–9 lần
  Phiên trong vùng 60–85% đúng     39–74%            39–78%
LEARNING (mô phỏng)
  S07 câu mới trước → sau bí kíp   0,49–0,59 → 0,69–0,92   0,23–0,52 → 0,47–0,79
  Câu mới đúng                     63–81%            51–79%
EFFICIENCY
  Luyện ở phần đã dùng được        20–52%            17–31% (B1) · 42% (B2)
  Ôn ở phần nhớ tốt                5–51%             0–17%
  Dò                               22–30% số câu     22–27%
  Câu hỏi lặp lại                  14–28%            28–36%   (xấu hơn, xem Vấn đề 3)
GOAL PROGRESS
  Đạt thật cuối kỳ                 1–7 nút, 0 sai    1–9 nút, 1 sai (1 lần / 7)
  Dùng được thật cuối kỳ           23–36 nút         7–21 nút (luyện phần khó hơn, ít luyện lại phần dễ)
  Tiến độ hiển thị                 theo A2 tự đặt    theo B1/B2 bạn chọn: 0/39 Can-do, kỹ năng vững 1–9/391
----------------------------------------
HARD GATES                14 / 15 PASSED   (HF03-05 vẫn FAIL ở hồ sơ B2; B1 đã đạt)
TRUNG BÌNH 110 TIÊU CHÍ   6,9 → 7,1 / 10 · 56 → 57 / 110 đạt ≥ 8
OVERALL                   ❌ NOT READY cho người học trung bình (tiến gần hơn)
----------------------------------------
MAIN PROBLEMS CÒN LẠI
1. Hồ sơ B2: 42% lượt ở phần đã dùng được, 37% luyện lại từ vựng A1–A2.
   Gốc: mục tiêu đệm A2 gồm nhiều từ vựng A1–A2; mỗi phần cần ~4 câu đúng tự lực ở mức 3 mới Đạt
   (chống Đạt nhờ đoán). Người học B1 vẫn phải "chứng minh" từng phần dễ.
2. Đạt vẫn chậm: 44 ngày × ~12 câu/ngày chỉ đủ Đạt 1–9 nút. Readiness B1 0/39 (B1 cần nhiều tháng là hợp lý,
   nhưng chưa có cách "kiểm tra để bỏ qua" cả cụm cho người học khá).
3. Câu lặp lại tăng 14–28% → 28–36%: hết câu mới ở mức cần thì app hỏi lại câu cũ cùng mức (cách quãng)
   thay vì lùi về câu dễ hơn đã Đạt. Đúng về bằng chứng, nhưng cần thêm câu mới ở mức 3–4.
4. Một nút nghe "Đạt" sai (ph:s-01, câu 2 lựa chọn, bot đoán trúng 10/10). Ngược chiều ở hai đầu tăng lên 4,5–12,5%.
   Câu 2 lựa chọn quá dễ đoán để làm bằng chứng Đạt.
5. Không có độ khó từng câu, không có Nói / Viết / dùng tự do trong game.
----------------------------------------
RECOMMENDED CHANGES (v72)
1. "Kiểm tra để bỏ qua" theo cụm (một bài 5–6 câu tự gõ ở mức cần) cho người học đúng ≥ 85%.
2. Câu nghe 2 lựa chọn: Đạt cần thêm ≥ 1 câu tự gõ / ≥ 3 lựa chọn.
3. Thêm câu mới mức 3–4 cho từ vựng A1–A2 (giảm lặp câu).
4. Độ khó từng câu (từ thống kê đúng / sai), câu ngữ cảnh mới, nhiệm vụ dùng tự do.
```

## Đã sửa (v71), mỗi mục có test

| # | Vấn đề (gốc rễ) | Sửa | Test |
|---|---|---|---|
| 1 | Mục tiêu bạn chọn không là chính | Chọn cấp CEFR cao hơn → đứng đầu (tiến độ, kỹ năng vững, Readiness theo nó). Mục tiêu tự đặt **giữ làm bậc đệm**: mục tiêu CEFR chỉ gồm Can-do đúng cấp (B1 = 49 Can-do B1), bỏ nó thì phần nền mất ưu tiên (bot L02: ngữ pháp A1–A2 tụt 34–58% → 9%, đã kiểm và sửa) | e2e `play.spec.ts` |
| 2 | Bài dò ngắn (8 phần, bước ½ cấp, bắt đầu A1) không chạm được B1 | Câu chọn đúng mà câu tự gõ sai → phần kế dò cao hơn 1 cấp (trần nhận ra); trượt ở cấp trên không kéo ước tính xuống; còn đang lên thì dò tiếp tới 16 phần. Người mới vẫn ≤ 8 phần; mô phỏng giữ nguyên | `engine-diag.test.ts` (3 test) |
| 3 | Bài dò chấm theo "tự nhớ ra" → phần nhận ra tốt bị học lại | Cấp nhận ra riêng → tiên nghiệm "đã biết" chỉ ở mức 1–2 | `engine-diag.test.ts` |
| 4 | Claim ngữ pháp (mức 4) không bao giờ xác nhận được | Trinh sát kiểm Claim ở đúng mức đã suy ra (trước luôn mức 3); Claim đã có bằng chứng kiểm tiếp trước; không quá giới hạn lượt / ngày | `engine-quest.test.ts` |
| 5 | 25/26 phần nghe không được thử suốt 44 ngày | Khám phá được thưởng theo độ phủ vùng kỹ năng (phủ 0% → +0,6; ≥ 50% → 0) | `engine-probe.test.ts` |
| 6 | Điểm nghẽn = số phần bị chặn, không theo độ yếu | Điểm nghẽn = (1 − m) × (1 + ln(1 + phụ thuộc)); là quái đầu tiên của tầng | `engine-quest.test.ts` |
| 7 | Người học đúng nhiều vẫn đi từng bậc | Đúng ≥ 85% ở 24 lượt gần nhất → hỏi thẳng mức cần (câu tự gõ), 5 lượt/nút/ngày | test sẵn + bot |
| 8 | Hết câu mới ở mức cần → lùi về câu chọn mức thấp đã Đạt (không thêm bằng chứng; B2: 29 lượt) | Câu thấp hơn mức cần phạt nặng hơn câu đã gặp | `engine-remedy.test.ts` |
| 9 | Không biết vì sao được lên | Cuối tầng: "⬆ Lên cấp: … đã vững (từ câu trả lời của bạn, không phải từ xu)"; kết quả bài dò nêu điểm mạnh nhận ra | bot / màn hình |

**Hồi quy:**
- `npm test` 199/199, e2e 118/118, `npm run fresh` sạch.
- Mô phỏng: FP 0%, FN 22,9%, số lượt thích ứng / cố định không đổi.
- Bot L01 (seed 1): tương đương v70. Ước lượng sai tối đa 1 (như v70); biết thật 0 → 3 (v70 2 → 1); kỹ năng vững 2 (v70 3).
- Bot L02 (seed 1): ngữ pháp A1–A2 57,6% số lượt (v70 34–58%); luyện phần đã biết 10,9% (v70 4–26%); 0 Đạt sai.

## 15 kịch bản (v71)

| Kịch bản | v70 | v71 | Đánh giá |
|---|---|---|---|
| S01 tiến bộ nhanh (`fast`) | Đạt 5; lên mức 19% | Đạt 7, 0 sai; luyện lại từ vựng đã vững 4,6%; hỏi thẳng mức cần khi đúng ≥ 85% | ✓ một phần |
| S02 tiến bộ chậm (`slow`) | ✓ | 3/3 lần đứng yên app đổi cách; S07 0,23 → 0,79 | ✓ |
| S03 mạnh một phần (từ vựng) | 10–46% luyện lại | 4,5–14% (B1) · 37% (B2) | ✓ B1 / ✗ B2 |
| S04 yếu một phần (nghe) | 5–15% lượt | 17–29% lượt; app ghi nghe là phần yếu (m 0,16–0,5); Điểm nghẽn 0–22% | ✓ một phần |
| S05 một lỗi giữa chuỗi đúng | Claim rơi sau một lỗi | Phần đã Đạt không bị đặt lại; hạ mức sau một lỗi 0–19% | ✓ |
| S06 sai 4 lần liên tiếp | ✓ | m giảm dần (vd 0,49 → 0,27), nhãn "đang hiểu sai" / "chưa biết", hỏi mức thấp hơn | ✓ |
| S07 trước / sau can thiệp | ✓ | 0,23–0,52 → 0,47–0,79 | ✓ |
| S08 đứng yên | ✓ | 13/14 lần đứng yên app đổi mức / nhãn / bí kíp | ✓ |
| S09 / S10 | Không tạo được | Như v70 | — theo thiết kế |
| S11 luyện tốt, transfer kém | ✓ | Không Đạt; lượt sau trùm câu mới / nhãn "transfer" | ✓ |
| S12 luyện tốt, transfer tốt | 39–46 nút / 4–7 Đạt | 14–29 nút / 1–8 Đạt; xem đính chính (nhiều nút S12 thật ra chưa dùng được) | ✗ một phần |
| S13 quên | ✓ | FAIL → rương ôn → bí kíp | ✓ |
| S14 nhớ tốt | 0,06–0,36 | Rương sau ở cùng nút 0,04–0,32 lần; ôn ở phần nhớ tốt 0–17% | ✓ |
| S15 phiên ngắn (`short`) | 329 câu, Đạt 1 | 331 câu, dùng được 7, Đạt 1; nghe 27% | ✓ một phần |

## 110 tiêu chí (0–10)

✓ là đạt (≥ 8), ✗ là chưa. "v70 → v71" chỉ ghi khi điểm đổi.

### A. Starting state: 6,3 → 6,8
- **L03-01** 6 → 7 ✗: Từ vựng A2 ở 5/7 lần (v70 A1–A2); hồ sơ B1 nhận ra tới B1. Tự nhớ ra vẫn thấp ½ bậc.
- **L03-02** 5 ✗: Bài dò chưa có nghe / nói / viết (nghe được khám phá trong tháp).
- **L03-03** 4 → 6 ✗: Luyện lại từ vựng đã vững 4,5–14% (B1), 37% (B2).
- **L03-04** 7 ✗
- **L03-05** 8 ✓
- **L03-06** 6 ✗: Dò lại nút đã vững 7–26 lượt.
- **L03-07** 8 → 7 ✗: Ngược chiều 4,5–12,5%.
- **L03-08** 5 → 8 ✓: Mục tiêu chọn đứng đầu; tiến độ theo B1/B2.
- **L03-09** 7 ✗: 8–16 phần.
- **L03-10** 7 ✗

### B. Learning path: 6,4 → 6,9
- **L03-11** 8 ✓
- **L03-12** 6 → 7 ✗
- **L03-13** 5 → 6 ✗: 17–31% (B1), 42% (B2) ở phần đã dùng được.
- **L03-14** 8 ✓
- **L03-15** 4 → 6 ✗: Nghe 17–29% số lượt; điểm nghẽn chỉ 0–22% là nghe.
- **L03-16** 6 ✗
- **L03-17** 8 ✓
- **L03-18** 7 ✗
- **L03-19** 8 ✓
- **L03-20** 4 → 5 ✗: Đạt 1–9.

### C. Next Best Action: 7,6 → 7,8
- **L03-21** 9 ✓ · **L03-22** 8 ✓
- **L03-23** 7 → 8 ✓: Ưu tiên theo mục tiêu đã chọn.
- **L03-24** 8 ✓ · **L03-25** 9 ✓ · **L03-26** 8 ✓ · **L03-27** 8 ✓
- **L03-28** 7 ✗ · **L03-29** 8 ✓
- **L03-30** 4 → 5 ✗: Hỏi thẳng mức cần khi đúng ≥ 85%; chưa có "advance" / bỏ qua cả cụm.

### D. Adaptive difficulty: 6,7 → 7,0
- **L03-31** 5 ✗: Phiên trong vùng 39–78%.
- **L03-32** 8 ✓
- **L03-33** 4 → 5 ✗: Lên mức 20–55% sau 3 lượt đúng.
- **L03-34** 6 ✗
- **L03-35** 5 → 7 ✗: Hạ mức sau một lỗi 0–19% (v70 6–47%).
- **L03-36** 9 ✓ · **L03-37** 9 ✓ · **L03-38** 9 ✓
- **L03-39** 4 ✗: Không có độ khó từng câu.
- **L03-40** 8 ✓

### E. Gameplay: 7,7 → 7,6
- **L03-41** 8 ✓ · **L03-42** 8 ✓
- **L03-43** 7 → 6 ✗: Lặp câu 28–36% (v70 14–28%).
- **L03-44** 6 ✗
- **L03-45** 9 ✓ · **L03-46** 8 ✓ · **L03-47** 8 ✓ · **L03-48** 8 ✓
- **L03-49** 7 ✗ · **L03-50** 8 ✓

### F. Knowledge acquisition: 7,6
- **L03-51** 8 ✓ · **L03-52** 8 ✓ · **L03-53** 9 ✓ · **L03-54** 8 ✓
- **L03-55** 6 ✗ · **L03-56** 8 ✓ · **L03-57** 7 ✗ · **L03-58** 8 ✓ · **L03-59** 8 ✓
- **L03-60** 6 ✗: Chưa có dùng tự do.

### G. Mastery: 7,5 → 7,4
- **L03-61** 9 → 8 ✓: 1 Đạt sai / 7 lần (câu nghe 2 lựa chọn).
- **L03-62** 8 ✓ · **L03-63** 9 ✓ · **L03-64** 8 ✓
- **L03-65** 4 ✗: Mức 5 có trong mô hình, game không đo.
- **L03-66** 8 ✓ · **L03-67** 6 ✗ · **L03-68** 6 ✗ · **L03-69** 8 ✓ · **L03-70** 9 ✓

### H. Evidence quality: 7,6
- **L03-71** 7 ✗ · **L03-72** 8 ✓ · **L03-73** 9 ✓ · **L03-74** 5 ✗ · **L03-75** 8 ✓
- **L03-76** 8 ✓ · **L03-77** 6 ✗ · **L03-78** 8 ✓ · **L03-79** 9 ✓ · **L03-80** 8 ✓

### I. Diagnostic: 6,6 → 6,9
- **L03-81** 8 ✓ · **L03-82** 6 ✗
- **L03-83** 5 → 6 ✗: Bài dò tìm trần nhận ra.
- **L03-84** 7 ✗ · **L03-85** 6 ✗ · **L03-86** 9 ✓ · **L03-87** 8 ✓
- **L03-88** 4 → 5 ✗: Nghe được khám phá và ghi là yếu, nhưng chưa thành điểm nghẽn ổn định.
- **L03-89** 4 → 5 ✗: Nhãn nguyên nhân khớp thật 14–24% (v70 10–19%).
- **L03-90** 9 ✓

### J. Transfer: 6,5 → 6,6
- **L03-91** 9 ✓ · **L03-92** 5 ✗ · **L03-93** 7 ✗ · **L03-94** 6 ✗ · **L03-95** 7 ✗ · **L03-96** 7 ✗
- **L03-97** 8 ✓ · **L03-98** 5 ✗ · **L03-99** 8 ✓
- **L03-100** 3 → 4 ✗: S12 (xem đính chính).

### K. Retention: 7,4
- **L03-101** 8 ✓ · **L03-102** 7 ✗ · **L03-103** 9 ✓ · **L03-104** 8 ✓ · **L03-105** 5 ✗

### L. Progress & outcome: 4,2 → 4,8
- **L03-106** 5 ✗: Nghe +0,15…+0,3 trên 4–6 nút; ngữ pháp +0,03…+0,09.
- **L03-107** 4 ✗ · **L03-108** 4 ✗
- **L03-109** 3 → 4 ✗: Readiness 0/39 nhưng giờ là của B1 bạn chọn; kỹ năng vững 1–9/391.
- **L03-110** 5 → 7 ✗: NOT_READY có lý do, theo mục tiêu đã chọn.

### Hard gate: 14/15
| Gate | KQ | Chứng cứ (v71) |
|---|---|---|
| HF03-01 Lộ trình cố định | PASS | Mỗi lần chạy một lộ trình khác |
| HF03-02 Điểm game → mastery | PASS | Đạt chỉ từ câu trả lời; xu không vào mastery |
| HF03-03 Một lỗi → hạ mạnh | PASS | Hạ mức sau một lỗi 0–19%; phần đã Đạt không bị đặt lại |
| HF03-04 Không tăng độ khó khi đã vượt mức | PASS | Hỏi thẳng mức cần khi đúng ≥ 85%; lên mức 20–55% |
| **HF03-05 Giữ ở mức quá dễ dù đúng liên tục** | **FAIL (B2)** | B1: 17–31% lượt ở phần đã dùng được, luyện lại từ vựng 4,5–14% → đạt. B2: 42% và 37% → chưa |
| HF03-06 Quá khó liên tục | PASS | Trại / dạy lại ngay sau lỗi lặp lại (trung vị 0 lượt) |
| HF03-07 Luyện tốt = transfer | PASS | S11 |
| HF03-08 Không mở lại được | PASS | REOPEN / FAIL |
| HF03-09 Không kiểm lại sau một thời gian | PASS | Nhớ lại cách quãng, rương |
| HF03-10 NBA không đổi | PASS | 4–9 lần đổi |
| HF03-11 Luyện lại phần có bằng chứng mạnh | PASS | Sau khi Đạt 0,6–1,7 lượt |
| HF03-12 Tiến độ = XP | PASS | Tiến độ từ bằng chứng |
| HF03-13 Tiến độ không có bằng chứng | PASS | |
| HF03-14 Không biết vì sao được tiến | PASS | "⬆ Lên cấp …" cuối tầng, màn Vì sao?, snapshot |
| HF03-15 Không biết vì sao chưa được tiến | PASS | "Chưa đạt vì còn thiếu…" |
