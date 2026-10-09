# Báo cáo mô phỏng learner

Sinh bởi `npm run sim` (tools/sim/run.ts → src/engine/sim/sim.ts), luật `ev1.0/m3.3`, 2026-10-09.

> Learner ở đây là learner **giả lập** có trạng thái thật biết trước (biết/chưa biết, hiểu sai, quên, đoán mò, nhầm tay; kỹ năng chơi game và tốc độ độc lập với năng lực ngôn ngữ), chạy qua chính engine của app. Báo cáo này kiểm chứng **thuật toán** (tầng L2–L3 của Evaluation Framework). Nó **không** chứng minh người thật học được (L4–L5): việc đó cần dữ liệu người học thật.

## 1. Dương tính giả / âm tính giả (C279, C280)

- Dương tính giả (app báo Đạt nhưng learner không biết): **0,0%** trên 265 lần Đạt.
- Âm tính giả (learner biết, đã có ≥ 15 lượt, app chưa báo Đạt): **22,9%** trên 231 trường hợp.
- Engine được thiết kế dè dặt: thà đòi thêm bằng chứng còn hơn tuyên bố Đạt sai (spec P4, P19).

## 2. Độ nhạy ngưỡng mastery (C272)

| Ngưỡng m | Dương tính giả | Âm tính giả |
|---|---|---|
| 0,70 | 0,0% | 8,1% |
| 0,75 | 0,0% | 9,5% |
| 0,80 (đang dùng) | 0,0% | 18,9% |
| 0,85 | 0,0% | 48,6% |
| 0,90 | 0,0% | 77,0% |

## 3. Calibration (C256, C261)

Sai số calibration kỳ vọng (ECE): **0,14**.

| m dự đoán | Số ô | m trung bình | Xác suất đúng thật |
|---|---|---|---|
| 0,00–0,10 | 22 | 0,07 | 0,22 |
| 0,10–0,20 | 33 | 0,15 | 0,13 |
| 0,20–0,30 | 28 | 0,25 | 0,44 |
| 0,30–0,40 | 35 | 0,35 | 0,51 |
| 0,40–0,50 | 15 | 0,44 | 0,92 |
| 0,50–0,60 | 37 | 0,55 | 0,92 |
| 0,60–0,70 | 71 | 0,65 | 0,92 |
| 0,70–0,80 | 122 | 0,76 | 0,92 |
| 0,80–0,90 | 168 | 0,85 | 0,92 |
| 0,90–1,00 | 69 | 0,92 | 0,92 |

**Nhận xét:** m của Beta là tỉ lệ đúng có trừ đoán mò, nhầm tay, *chưa* là xác suất đúng ở câu kế tiếp. Ở vùng 0,5–0,85, m thấp hơn xác suất thật (dè dặt), nên âm tính giả cao hơn dương tính giả. Hiệu chỉnh (isotonic) chỉ nên làm khi có dữ liệu người thật, vì hiệu chỉnh theo learner giả lập chỉ là khớp với giả định của chính bộ mô phỏng.

## 4. Chẩn đoán (C281, C282)

Learner có cấp thật 0–5, 30 lượt chạy: sai số tuyệt đối trung bình **0,59 cấp**, trung bình **12,97 nút dò** (mỗi nút 3 câu).

## 5. Lộ trình thích ứng so với giáo trình cố định (C325, C333, C334)

Trung bình 20 learner, mục tiêu cấp 3 trên đồ thị tổng hợp 6 cấp × 8 nút. Cố định = học mọi nút cấp 0–3 theo thứ tự tới khi Đạt. Thích ứng = chẩn đoán → bỏ qua thứ đã biết → chỉ mở nút đủ tiền đề.

| Learner đã biết tới cấp | Lượt (thích ứng) | Lượt (cố định) | Thích ứng / cố định | Cả hai xong |
|---|---|---|---|---|
| chưa biết gì | 498 | 573 | 86,9% | 100,0% |
| 0 | 472 | 477 | 98,9% | 100,0% |
| 1 | 288 | 401 | 71,7% | 100,0% |
| 2 | 199 | 294 | 67,5% | 90,0% |

**Nhận xét:** lợi ích lớn nhất ở learner đã biết nhiều (bỏ qua được nhiều). Learner chỉ biết cấp 0 thì gần như hoà, vì chi phí bài chẩn đoán bù cho phần bỏ qua được. v56 sửa một lỗi mô phỏng này lộ ra: chẩn đoán đã chứng minh learner biết cấp ngay dưới ranh giới nhưng vẫn bắt học lại cấp đó.

## 6. Kỹ năng chơi game và tốc độ không thành điểm ngôn ngữ (C343–C345, C373, HG12)

- Hai nhóm learner cùng năng lực, kỹ năng chơi 0,95 so với 0,2, chơi có ép thời gian. Chênh lệch mastery trung bình: **0,05** với Evidence Evaluator (hết giờ ×0,3), so với **0,12** nếu coi hết giờ là sai đủ trọng số.
- Hai nhóm cùng năng lực, tốc độ 0,95 so với 0,05: chênh lệch mastery **0,00** (tốc độ chỉ ghi lại, không vào trọng số).

## 7. Độ nhạy trọng số của luật (C274)

Đổi một tham số, giữ nguyên các tham số khác (300 learner). Kết luận Đạt ổn định khi dương tính giả giữ ở 0% trong cả dải.

| Tham số | Giá trị | Dương tính giả | Âm tính giả |
|---|---|---|---|
| slip | 0,05 | 0,0% | 20,6% |
| slip | 0,1 (đang dùng) | 0,0% | 18,6% |
| slip | 0,2 | 0,0% | 13,4% |
| repeat | 0,3 | 0,0% | 18,6% |
| repeat | 0,5 (đang dùng) | 0,0% | 18,6% |
| repeat | 0,7 | 0,0% | 18,6% |
| decay | 0,8 | 0,0% | 24,7% |
| decay | 0,9 (đang dùng) | 0,0% | 18,6% |
| decay | 1 | 0,0% | 15,5% |

## Giới hạn

- Learner giả lập đơn giản hơn người thật (học và quên theo xác suất cố định).
- Đồ thị tổng hợp nhỏ hơn đồ thị thật (1.005 nút).
- Các con số trên là bằng chứng cho tính đúng của thuật toán và để so sánh giữa các phiên bản luật, không phải dự báo hiệu quả học.
