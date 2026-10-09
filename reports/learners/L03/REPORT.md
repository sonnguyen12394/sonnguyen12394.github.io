# L03: Người học trung bình (Intermediate)

**Bot:** `Learner_03_Intermediate`. Mã: `tools/learners/l03.ts`; lõi chung `core.ts`; phân tích `analyze-l03.ts`.

**Cách chạy:**
- Bot chơi app qua giao diện thật: Chromium, màn hình Pixel 7, không mạng ngoài, không AI.
- Bản app: v70 (nhánh `claude/l02-bot`). Vòng này **không sửa app**.

**7 lần chạy × 44 ngày (23 phiên), tổng 3.595 câu, 0 lỗi trang, 0 lần kẹt:**

| Lần chạy | Hồ sơ | Mục tiêu bot chọn | Kịch bản |
|---|---|---|---|
| `b1s1`, `b1s2`, `b1s3` | A2+ | CEFR B1 | — |
| `b2s1` | B1 | CEFR B2 | — |
| `fast` | A2+, học nhanh gấp 2 | B1 | S01 |
| `slow` | A2+, học chậm còn một nửa | B1 | S02 |
| `short` | A2+, mỗi ngày 1 tầng (5–6 phút) | B1 | S15 |

**Dữ liệu:** `v70/<lần chạy>/rows.json`, `events.json`, `metrics-l03.json`.

**Bot không tự chọn bài học.** Sau bài dò, bot vào "Mục tiêu" và chọn CEFR B1 (hoặc B2); từ đó chỉ làm theo màn hình. Để biết đáp án đúng, bot dùng `EM.peek()` (chỉ đọc) và trả lời đúng hay sai theo hồ sơ ẩn.

> **Giới hạn trung thực.** Hồ sơ học/quên do bot đặt ra, nên nhóm L (kết quả) chỉ cho biết app có tạo điều kiện để học hay không, không chứng minh hiệu quả trên người thật.
> - **Nói / Viết** không có trong tháp, nên phần "speaking yếu" của hồ sơ app không thể thấy.
> - **S09 / S10** không tạo được: game không có kỹ năng thao tác (không tính giờ, không phản xạ); điểm game chỉ sinh từ câu trả lời.

## Ground truth → App inference → Difference

```
========================================
LEARNER 03 — INTERMEDIATE           (thang 10; đạt = ≥ 8)
========================================
TARGET            CEFR B1 (hồ sơ A2+) · CEFR B2 (hồ sơ B1)
GROUND TRUTH      Mạnh: từ vựng (A1 0,9 / A2 0,75 / B1 0,5) · Vừa: ngữ pháp (A1 0,8 / A2 0,6)
                  Yếu: nghe (0,35, nút thắt) · chức năng giao tiếp (0,4) · Nhớ lâu vừa · Transfer thấp–vừa
APP INFERENCE     Bài dò: từ vựng A1–A2, ngữ pháp A1–A2 (6/7 lần) · A2 / A2 (1/7)
                  Hồ sơ B1: từ vựng A1–A2, ngữ pháp A2
DIFFERENCE        Ước lượng thấp hơn thật ½–1 bậc (bài dò chấm ở mức "tự nhớ ra", người học mạnh ở nhận ra)
                  Mục tiêu bạn chọn (B1/B2) KHÔNG thành mục tiêu chính: tiến độ trên tháp vẫn tính theo A2 app tự đặt
                  Nghe không bao giờ được nêu là điểm nghẽn (0% số lần hiện "Điểm nghẽn")
----------------------------------------
LEARNER MODEL
  State Accuracy             khớp 3 lớp 36–47%, ngược chiều 0–6%, tương quan 0,48–0,82
  Gap Detection              lỗ hổng thật không bị bỏ sót (ngược chiều ≈ 0)
  Strength Detection         KÉM: 10–46% lượt luyện ở từ vựng A1–A2 mà người học đã dùng được
  Bottleneck Detection       KÉM: nghe chỉ 5–15% số lượt, không lần nào là "Điểm nghẽn"
ADAPTATION
  NBA                        luôn có; đổi 3–9 lần; loại: học / ôn / dò / xác minh (không có "advance")
  Difficulty Calibration     mức 1–2 đúng 83–100% (quá dễ), mức 3 đúng 65–80%, mức 4 đúng 55–77%;
                             phiên trong vùng 60–85%: 39–74%
  Difficulty Up              sau 3 lượt đúng liên tiếp chỉ lên mức 8–56% (trung bình ≈ 30%)
  Difficulty Down            sau 2 lượt sai liên tiếp hạ mức 0–75% (ít cơ hội)
  Adaptation Latency         trung vị 0 lượt (trại / dạy lại ngay sau), trung bình 0–3,1;
                             0–2 nút/lần chạy không đổi gì sau > 10 lượt
LEARNING (mô phỏng)
  Immediate Gain (S07)       câu mới của nút: 0,49–0,59 → 0,69–0,92 sau bí kíp
  Transfer                   câu mới đúng 63–81%; 39–46 nút đúng ≥ 2 câu mới ở mức ≥ 3
  Retention                  ôn ở rương 21–50 lượt; phần nhớ tốt bị ôn lại ít (0,06–0,36 lần sau)
EFFICIENCY
  Unnecessary Practice       20–52% số lượt ở phần đã dùng được (B1: 20–41%; B2: 52%)
  Unnecessary Review         5–51% số lượt ôn ở phần nhớ tốt
  Unnecessary Diagnostic     dò 22–30% số câu; dò lại nút đã vững 10–23 lượt
GOAL PROGRESS
  Initial A2+ → bot dùng được 23–36 nút ở mức mục tiêu; app công nhận Đạt thật 1–7 nút (0 sai)
  Readiness hiển thị: 0/37 (của mục tiêu A2 app tự đặt!) · kỹ năng vững 1–7/265 · NOT READY (có lý do ở màn Vì sao?)
----------------------------------------
HARD GATES                14 / 15 PASSED   (HF03-05 FAIL ở hồ sơ B2, sát ngưỡng ở B1)
TRUNG BÌNH 110 TIÊU CHÍ   6,9 / 10 · 56/110 đạt ≥ 8
OVERALL                   ❌ NOT READY cho người học trung bình
----------------------------------------
MAIN PROBLEMS
1. Công nhận / tiến lên quá chậm: người học đúng nhiều mà app vẫn hỏi lại.
   - Cần khoảng 4 câu đúng liên tiếp ở mỗi mức (cận dưới 0,6), giới hạn 3 lượt/nút/ngày, Claim cần riêng bằng chứng thật.
   - Kết quả: 39–46 nút đúng ≥ 2 câu mới nhưng chỉ 4–7 được Đạt.
   - Người học nhanh (S01) cũng chỉ được 5 nút; độ khó không tăng nhanh hơn.
2. Mục tiêu người học chọn không là mục tiêu chính: tiến độ và "kỹ năng vững" đo theo A2 (mục tiêu đầu tiên).
3. Bài dò chấm thấp người học mạnh ở nhận ra, nên điểm mạnh (từ vựng A1–A2) bị luyện lại.
4. Điểm nghẽn chọn theo số năng lực bị chặn (tiền đề), không theo độ yếu. Nghe yếu nhất nhưng chặn ít, nên
   không bao giờ được nêu; nghe chỉ 5–15% số lượt.
5. Không có độ khó từng câu, không có Nói / Viết / dùng tự do trong game; transfer ở ngữ cảnh thật còn ít.
----------------------------------------
RECOMMENDED CHANGES
1. Tăng tốc khi bằng chứng mạnh:
   - đúng ≥ 3 câu mới liên tiếp (cách quãng) → nhảy mức / cho trùm transfer ngay;
   - người học đúng ≥ 85% trong tuần → nới giới hạn lượt / ngày và mở phần mới;
   - "advance" thành một hành động NBA rõ ràng.
2. Mục tiêu người học chọn là mục tiêu chính (tiến độ, kỹ năng vững, Readiness); mục tiêu tự đặt thấp hơn thì gộp hoặc ẩn.
3. Bài dò hỏi cả mức nhận ra và mức tự nhớ; ước lượng theo từng mức, để không luyện lại phần đã mạnh.
4. Điểm nghẽn = (độ yếu × tầm quan trọng với mục tiêu) chứ không chỉ số phần bị chặn; đưa nghe vào bài dò.
5. Độ khó từng câu (từ thống kê đúng / sai), câu ngữ cảnh mới, nhiệm vụ dùng tự do.
```

## 15 kịch bản

| Kịch bản | Kết quả | Đánh giá |
|---|---|---|
| S01 tiến bộ nhanh (`fast`) | Đạt thật 5 nút (bình thường 4–6); lên mức sau 3 lượt đúng 19% | ✗ Không tăng tốc |
| S02 tiến bộ chậm (`slow`) | Hạ mức 33% sau 2 lượt sai; 3/3 lần đứng yên app đều đổi cách; Đạt 2 | ✓ |
| S03 mạnh một phần (từ vựng) | 10–46% số lượt luyện từ vựng đã dùng được | ✗ |
| S04 yếu một phần (nghe) | Nghe 5–15% số lượt, 0 lần là điểm nghẽn | ✗ |
| S05 một lỗi giữa chuỗi đúng | Phần đã Đạt thật không bị đặt lại. Phần chỉ "suy ra" từ bài dò rơi về "đang học" sau một câu mới sai (thiết kế: Claim yếu) | ✓ một phần |
| S06 sai 4 lần liên tiếp | m 0,42–0,53 → 0,23–0,30; app gắn "đang hiểu sai" / "chưa biết", hỏi nhận ra | ✓ |
| S07 trước / sau can thiệp | 0,49–0,59 → 0,69–0,92 | ✓ |
| S08 đứng yên | 7/7 lần đứng yên ≥ 3 phiên, app có đổi mức / nhãn / bí kíp | ✓ |
| S09 game giỏi, ngôn ngữ kém | Không tạo được (không có kỹ năng thao tác) | — theo thiết kế ✓ |
| S10 ngôn ngữ giỏi, thao tác kém | Như trên | — |
| S11 luyện tốt, transfer kém | Không Đạt; lượt sau là trùm câu mới / nhãn "transfer" | ✓ |
| S12 luyện tốt, transfer tốt | 39–46 nút đúng ≥ 2 câu mới, chỉ 4–7 Đạt | ✗ |
| S13 quên | "FAIL", ôn lại ở rương, bí kíp sửa được | ✓ |
| S14 nhớ tốt | Rương sau đó ở cùng nút: trung bình 0,06–0,36 lần | ✓ |
| S15 phiên ngắn (`short`) | 329 câu / 44 ngày; dùng được 8 nút; Đạt 1 | ✓ một phần |

## 110 tiêu chí (0–10)

✓ là đạt (≥ 8), ✗ là chưa. Chứng cứ lấy từ 7 lần chạy.

### A. Starting state: 6,3
- **L03-01** 6 ✗: Ước lượng thấp hơn thật ½–1 bậc.
- **L03-02** 5 ✗: Có từ vựng và ngữ pháp; bài dò không có nghe / nói / viết.
- **L03-03** 4 ✗: Điểm mạnh từ vựng không được nhận ra (luyện lại 10–46%).
- **L03-04** 7 ✗
- **L03-05** 8 ✓: "Lệch khoảng nửa cấp", trạng thái suy ra, độ tin cậy.
- **L03-06** 6 ✗: Dò lại nút đã vững 10–23 lượt.
- **L03-07** 8 ✓: Không bỏ sót lỗ hổng (ngược chiều ≈ 0).
- **L03-08** 5 ✗: Mục tiêu chọn (B1/B2) không là chính.
- **L03-09** 7 ✗: 28 câu.
- **L03-10** 7 ✗: Câu dò là bằng chứng và thành Claim.

### B. Learning path: 6,4
- **L03-11** 8 ✓
- **L03-12** 6 ✗
- **L03-13** 5 ✗: 20–52% luyện phần đã dùng được.
- **L03-14** 8 ✓
- **L03-15** 4 ✗: Không nhắm nút thắt nghe.
- **L03-16** 6 ✗: Sau khi Đạt chỉ còn 1–3 lượt, nhưng phần biết mà chưa Đạt vẫn bị luyện.
- **L03-17** 8 ✓
- **L03-18** 7 ✗
- **L03-19** 8 ✓
- **L03-20** 4 ✗: Dùng được 23–36 nút nhưng chỉ 1–7 Đạt.

### C. Next Best Action: 7,6
- **L03-21** 9 ✓
- **L03-22** 8 ✓
- **L03-23** 7 ✗: Ưu tiên theo mục tiêu đầu tiên.
- **L03-24** 8 ✓
- **L03-25** 9 ✓
- **L03-26** 8 ✓
- **L03-27** 8 ✓
- **L03-28** 7 ✗
- **L03-29** 8 ✓
- **L03-30** 4 ✗: Không có hành động "advance"; lên mức chậm.

### D. Adaptive difficulty: 6,7
- **L03-31** 5 ✗: Mức 1–2 đúng 83–100%; hồ sơ B2 chỉ 39% phiên trong vùng phù hợp.
- **L03-32** 8 ✓
- **L03-33** 4 ✗: Lên mức ≈ 30% sau 3 lượt đúng; người học nhanh không được tăng nhanh hơn.
- **L03-34** 6 ✗
- **L03-35** 5 ✗: Sau một lỗi, lượt kế hỏi mức thấp hơn 6–47% (theo thang mức chưa Đạt; phần đã Đạt thì không bị đặt lại).
- **L03-36** 9 ✓: Tốc độ không đổi độ khó.
- **L03-37** 9 ✓
- **L03-38** 9 ✓
- **L03-39** 4 ✗: Không có độ khó từng câu.
- **L03-40** 8 ✓: Theo từng nút.

### E. Gameplay: 7,7
- **L03-41** 8 ✓
- **L03-42** 8 ✓
- **L03-43** 7 ✗: Lặp câu 14–28%.
- **L03-44** 6 ✗: 5 loại cảnh; câu chọn / gõ / nghe.
- **L03-45** 9 ✓
- **L03-46** 8 ✓
- **L03-47** 8 ✓
- **L03-48** 8 ✓
- **L03-49** 7 ✗
- **L03-50** 8 ✓

### F. Knowledge acquisition: 7,6
- **L03-51** 8 ✓: Hỏi thử trước; dạy khi sai lặp lại / hiểu sai.
- **L03-52** 8 ✓
- **L03-53** 9 ✓
- **L03-54** 8 ✓
- **L03-55** 6 ✗
- **L03-56** 8 ✓
- **L03-57** 7 ✗
- **L03-58** 8 ✓
- **L03-59** 8 ✓: Bí kíp sửa được / chưa: 44/5 (b1s1).
- **L03-60** 6 ✗: Chưa có dùng tự do.

### G. Mastery: 7,5
- **L03-61** 9 ✓
- **L03-62** 8 ✓
- **L03-63** 9 ✓
- **L03-64** 8 ✓
- **L03-65** 4 ✗: Mức 5 có trong mô hình, game không đo.
- **L03-66** 8 ✓
- **L03-67** 6 ✗: Nhiều ngữ cảnh không bắt buộc.
- **L03-68** 6 ✗: Nhiều dạng câu không bắt buộc.
- **L03-69** 8 ✓
- **L03-70** 9 ✓

### H. Evidence quality: 7,6
- **L03-71** 7 ✗
- **L03-72** 8 ✓
- **L03-73** 9 ✓
- **L03-74** 5 ✗
- **L03-75** 8 ✓
- **L03-76** 8 ✓
- **L03-77** 6 ✗
- **L03-78** 8 ✓
- **L03-79** 9 ✓
- **L03-80** 8 ✓

### I. Diagnostic: 6,6
- **L03-81** 8 ✓: Dò liên tục trong game.
- **L03-82** 6 ✗: Dò lại nút đã vững.
- **L03-83** 5 ✗
- **L03-84** 7 ✗
- **L03-85** 6 ✗: Dò 22–30% số câu.
- **L03-86** 9 ✓
- **L03-87** 8 ✓
- **L03-88** 4 ✗: Không thấy nút thắt nghe.
- **L03-89** 4 ✗: Nhãn lỗ hổng phần lớn rơi vào phần bot đã làm được.
- **L03-90** 9 ✓

### J. Transfer: 6,5
- **L03-91** 9 ✓
- **L03-92** 5 ✗
- **L03-93** 7 ✗
- **L03-94** 6 ✗
- **L03-95** 7 ✗
- **L03-96** 7 ✗
- **L03-97** 8 ✓: Đo giữ riêng ngoài game 5–12/12.
- **L03-98** 5 ✗
- **L03-99** 8 ✓: S11.
- **L03-100** 3 ✗: S12, transfer tốt mà không tiến.

### K. Retention: 7,4
- **L03-101** 8 ✓
- **L03-102** 7 ✗
- **L03-103** 9 ✓
- **L03-104** 8 ✓
- **L03-105** 5 ✗: Readiness tính theo Can-do; khả năng nhớ không trực tiếp hạ Readiness.

### L. Progress & outcome: 4,2
- **L03-106** 5 ✗: Kỹ năng ẩn tăng nhỏ (+0,01…+0,04 từ vựng / ngữ pháp, nghe +0,3 trên 1–2 nút).
- **L03-107** 4 ✗
- **L03-108** 4 ✗
- **L03-109** 3 ✗: Readiness 0/37 (của A2), kỹ năng vững 1–7/265.
- **L03-110** 5 ✗: NOT_READY có lý do, nhưng không theo mục tiêu đã chọn.

### Hard gate: 14/15
| Gate | KQ | Chứng cứ |
|---|---|---|
| HF03-01 Lộ trình cố định | PASS | Mỗi lần chạy một lộ trình khác |
| HF03-02 Điểm game → mastery | PASS | Đạt chỉ từ câu trả lời |
| HF03-03 Một lỗi → hạ mạnh | PASS | Đạt thật không bị đặt lại (cần 2 lỗi liên tiếp mới mở lại). Lưu ý: Claim suy ra rơi sau một câu mới sai |
| HF03-04 Không tăng độ khó khi đã vượt mức | PASS (yếu) | Có lên mức và trùm transfer, nhưng chậm (≈ 30%) |
| **HF03-05 Giữ ở mức quá dễ dù đúng liên tục** | **FAIL** | Hồ sơ B2: 52% số lượt ở phần đã dùng được, 46% luyện lại từ vựng A1–A2, chỉ 39% phiên trong vùng phù hợp. B1: 20–41% |
| HF03-06 Quá khó liên tục | PASS | Trại / dạy lại ngay sau lỗi lặp lại (trung vị 0 lượt) |
| HF03-07 Luyện tốt = transfer | PASS | S11 |
| HF03-08 Không mở lại được | PASS | REOPEN / FAIL |
| HF03-09 Không kiểm lại sau một thời gian | PASS | Nhớ lại cách quãng, rương |
| HF03-10 NBA không đổi | PASS | 3–9 lần đổi |
| HF03-11 Luyện lại phần có bằng chứng mạnh | PASS | Sau khi Đạt chỉ 0,7–3 lượt |
| HF03-12 Tiến độ = XP | PASS | Tiến độ từ bằng chứng |
| HF03-13 Tiến độ không có bằng chứng | PASS | |
| HF03-14 Không biết vì sao được tiến | PASS | Màn Vì sao?, snapshot |
| HF03-15 Không biết vì sao chưa được tiến | PASS | "Chưa đạt vì còn thiếu…" |
