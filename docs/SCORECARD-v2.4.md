# Chấm app theo Master Spec v2.4 + Evaluation Framework (400 tiêu chí)

Bản chấm: v51 (commit `401c1ca`), 07/10/2026. Bằng chứng lấy từ code: `src/engine/*`, `src/exam/*`, lời gọi `eEv` trong `app.js`, `content/engine/*`, test (89/89 unit test đạt, `tsc` sạch, kiểm nội dung 0 lỗi).
Thang: 10 = đúng spec và có test/dữ liệu chứng minh · 7–8 = có, còn thiếu nhỏ · 5 = có một phần hoặc làm cách khác · 2–3 = sơ khai · 0–1 = chưa có.

> Lưu ý: app được xây theo **Master Spec v2** (`docs/SPEC.md`), không phải v2.4. `docs/SCORECARD.md` cho 7,4/10 là chấm theo 64 tiêu chí của v2. Bộ v2.4 khắt khe hơn nhiều ở các phần evidence lifecycle, provenance, calibration và game, nên điểm thấp hơn. Phần lớn chênh lệch là **spec đã đổi hướng** chứ không phải lỗi code.

## Kết luận

| Lớp (Phần L) | Điểm | Ghi chú |
|---|---|---|
| L1: Đúng spec | ≈ 5/10 | Lõi mastery, đồ thị, lộ trình, readiness tốt; thiếu L0/L1/L4 của evidence, game layer, micro-learning, transfer |
| L2: Thuật toán đúng | ≈ 5,5/10 | Beta/FSRS/IRT đúng công thức và có test; chưa kiểm độ nhạy, khoảng tin cậy dùng xấp xỉ chuẩn |
| L3: Có tạo ra việc học | ≈ 1/10 | Chưa có pre/post/delayed/transfer test |
| L4: Kết quả thực tế | ≈ 0–1/10 | Chưa có điểm thi thật; n = 1 |
| **Hard Fail** | **FAIL (HF6, HF8)** | Theo Phần M: dù điểm cao vẫn FAIL |

Trung bình 200 tiêu chí C201–C400: **4,3/10**. 20 nhóm C1–C200: **5,0/10**. Gộp: **≈ 4,7/10**.
Theo Final Quality Equation (phép nhân), Learning Effectiveness ≈ 0,16 kéo tổng xuống gần 0. Với một MVP chưa có người dùng thì đó là điều dự kiến, xem phần Phản biện.

## 10 Hard Fail

| # | Điều kiện | Kết quả | Bằng chứng |
|---|---|---|---|
| HF1 | Observation → Mastery trực tiếp | ⚠️ Đạt (sát ranh giới) | Có bước đánh giá (g, slip, w, mức) nhưng không có thực thể Evidence: câu trả lời gộp thẳng vào ô Beta (`mastery.ts: record`). Đạt cần ngưỡng m/LB nên không phải "1 câu đúng = Đạt" |
| HF2 | Game score = năng lực | ✅ Đạt | XP tách khỏi Readiness |
| HF3 | Hoàn thành bài = mastery | ✅ Đạt | `cdProg` tính Beta từ điểm từng hoạt động |
| HF4 | CEFR là một con số | ✅ Đạt | Cấp riêng từng kỹ năng, từng nút |
| HF5 | Model không sửa được khi có bằng chứng trái chiều | ✅ Đạt | β tăng khi sai, bằng chứng thật đè tiên nghiệm (hồi phục chậm khi n lớn) |
| HF6 | Readiness không có provenance | ❌ **FAIL** | `Dist.src` chỉ ghi loại nguồn (irt/real/rule/self); không truy được câu nào, phiên nào, phiên bản luật/nội dung nào |
| HF7 | Engine hard-code CEFR | ✅ Đạt | 35 Target Model (CEFR, IELTS, VSTEP, giao tiếp) dùng chung engine |
| HF8 | Aggregation làm mất thông tin để giải thích/sửa model | ❌ **FAIL** | Từ vựng/ngữ pháp chỉ còn α, β, n, ≤6 dạng câu, ≤8 ngữ cảnh. Đổi g/slip/luật thì không tính lại được; không trả lời được "Đạt nhờ những câu nào" |
| HF9 | Lõi cần AI khi chạy | ✅ Đạt | Không gọi AI |
| HF10 | Không chứng minh được vì sao chọn NBA | ⚠️ Đạt một phần | Có dòng "Cần cho X · mở đường cho N năng lực" ở thời điểm hiện tại; không lưu lại, không tái tạo được quyết định trong quá khứ |

## 20 Meta-Test

| MT | Kết quả | Ghi chú |
|---|---|---|
| 1 Unknown learner | ✅ | Unit test "người mới VSTEP B1: lộ trình mở được ngay" + chẩn đoán |
| 2 Advanced learner | ⚠️ | Kiểm tra để bỏ qua + tiên nghiệm; chưa có test |
| 3 Uneven skill | ⚠️ | Mô hình hỗ trợ; chưa có test |
| 4 One error | ✅ (thiết kế) | Một lỗi không làm mất Đạt, không ngắt; chưa có test |
| 5 Repeated failure | ⚠️ | β tăng, nút quay lại lộ trình; không có micro-learning |
| 6 Misconception | ❌ | Không mô hình hóa |
| 7 Recognition/Recall split | ✅ | Mức 1/2/3 là các ô riêng |
| 8 Recall/Use split | ⚠️ | Mức 4/5 có; đo production yếu khi chưa có AI |
| 9 Training/Transfer split | ❌ | Không có transfer |
| 10 Forgetting | ⚠️ | FSRS item; chưa có luật R̄ nút < 0,85 và "trượt 2 lần liền" |
| 11 Model error | ⚠️ | Không có bộ phát hiện model disagreement |
| 12 Goal switch | ✅ | Gộp tối đa 4 mục tiêu, nút dùng chung |
| 13 Evidence explosion | ⚠️ | Có trần theo thiết kế (RESP_MAX 800…); chưa test 100K |
| 14 Offline | ✅ | `offline.spec.ts` |
| 15 Crash recovery | ⚠️ | Lưu sau mỗi câu; chưa test crash giữa lúc ghi |
| 16 Migration | ✅ | Test v1 → v3 |
| 17 Content version | ❌ | Không ghi phiên bản nội dung vào bằng chứng |
| 18 Rule version | ❌ | Không tính lại được khi đổi luật |
| 19 Bias | ❌ | Chưa có |
| 20 Full reproducibility | ❌ | Không có Decision Snapshot |

Tổng: 6 ✅, 8 ⚠️, 6 ❌.

## Tóm tắt theo phần

| Phần | Điểm |
|---|---|
| C1–C200 (20 nhóm) | 5.0 |
| A — Knowledge Model Validity (C201–C220) | 4.0 |
| B — CEFR Content & Level Validity (C221–C240) | 5.1 |
| C — Evidence Validity (C241–C260) | 4.0 |
| D — Statistical & Mastery Validation (C261–C280) | 4.0 |
| E — Diagnostic Science (C281–C300) | 3.7 |
| F — Next Best Action Validation (C301–C320) | 5.5 |
| G — Learning Effectiveness (C321–C340) | 1.6 |
| H — Game / Learning Validity (C341–C360) | 5.0 |
| I — Bias, Fairness & Robustness (C361–C380) | 3.6 |
| J — Data Engineering, Performance & Reliability (C381–C400) | 6.3 |
| **C201–C400 (200 tiêu chí)** | **4.29** |
| **Cộng 2 nửa (cùng trọng số)** | **4.67** |

## C1–C200: 20 nhóm (spec chỉ đặt tên nhóm, chưa định nghĩa từng tiêu chí → chấm theo nhóm)

| Nhóm | Điểm | Bằng chứng chính |
|---|---|---|
| 1. Product / Goal | 7 | 35 Target Model chọn được, có hạn thi; chưa đo North Star (tiến bộ / nỗ lực) |
| 2. Universal Language Core | 5 | Nút: Can-Do, cụm từ vựng, ngữ pháp, dạng bài thi; tương tác/ngữ dụng/diễn ngôn chỉ có qua Can-Do, chưa là nút riêng |
| 3. CEFR Competency | 6 | 292 Can-Do theo cấp × kỹ năng; cấp riêng từng kỹ năng |
| 4. Competency Graph | 7 | 998 nút, 2.607 cạnh cứng/mềm có w, kiểm vòng lặp trong CI; cạnh thiếu rationale/version, chưa có tiền đề thay thế, chưa kiểm orphan/unreachable |
| 5. Knowledge Model | 5 | u: là cả cụm từ vựng (không nguyên tử); nút không có difficulty, misconception, distractor |
| 6. Content | 7 | 1.350 câu thi có giải thích tiếng Việt, schema + CI, 0 nút chưa có gì để đo |
| 7. Game | 3 | Kiểu quiz Duolingo (XP, streak, giải đấu, năng lượng); không có Game Challenge Model, không tách gameplayDifficulty/languageDifficulty |
| 8. Observation | 2 | Không có thực thể Observation; chỉ Nghe/Đọc giữ Resp thô (800 câu) |
| 9. Evidence Acquisition | 6 | Bằng chứng có g, mức, item, dạng câu, ngữ cảnh; tự nhận đoán ×0,5; bỏ lượt làm lại (ngữ pháp) |
| 10. Evidence Storage | 2 | Chỉ có L2/L3 (ô Beta); không có L1 ledger, không có L4 Decision Snapshot |
| 11. Provenance / Audit | 1 | Bằng chứng không ghi session, phiên bản luật, phiên bản nội dung |
| 12. Inference | 6 | Beta theo nút × mức, tiên nghiệm, IRT 3PL cho Nghe/Đọc, gộp nghịch phương sai cho Viết/Nói |
| 13. Mastery | 7.5 | Đúng công thức spec, ngưỡng 0,8 / LB 0,6, có unit test |
| 14. Diagnostic | 5 | Cầu thang 2 nhánh + IRT; có luật dừng; chưa liên tục, chưa dùng information gain trên đồ thị |
| 15. Gap / Root Cause | 4 | Tập thiếu = đóng tiền đề − nút Đạt; không phân loại 8 loại gap; truy gốc chỉ bằng hạ cấp |
| 16. Learning Path / NBA | 5.5 | Lộ trình tốt (biên tô-pô, dep ÷ phút, trọng số ngày thi); NBA chưa là utility (thiếu info/retention/transfer value) |
| 17. Micro Learning | 2.5 | Có giải thích từng phương án; không có can thiệp kích hoạt theo gap, không có interruption policy |
| 18. Retention / Transfer | 5 | FSRS-5 ở mức item tốt; thiếu luật nút R̄ < 0,85, thiếu luật trượt 2 lần; transfer không có |
| 19. Readiness / Motivation | 7.5 | Mô phỏng 4.000 lượt, P(đạt) + khoảng 80%, Achieved chỉ bằng điểm thật; XP tách khỏi Readiness |
| 20. Data / Extensibility | 7 | 35 mục tiêu trên cùng engine; state có phiên bản; readiness còn hard-code loại kỳ thi |
| **Trung bình** | **5.0** | |

## Phần A — Knowledge Model Validity (C201–C220): 4.0/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C201 | Knowledge Atomicity | 5 | g: nguyên tử; u: là cả unit từ vựng; cd: rất rộng |
| C202 | Knowledge Completeness | 6 | Can-Do → cạnh cứng tới ngữ pháp/unit; coverage 0 nút trống |
| C203 | Knowledge Boundary | 3 | Chỉ có tên vi/en, không định nghĩa phạm vi |
| C204 | Semantic Identity | 3 | Không có định nghĩa ngữ nghĩa ngoài nhãn |
| C205 | Knowledge Versioning | 2 | Goal có version; nút không có |
| C206 | Dependency Validity | 3 | Cạnh sinh tự động w=1, không kiểm tính cần thiết |
| C207 | Alternative Route | 1 | Không hỗ trợ: tiền đề cứng là AND |
| C208 | Overlap Detection | 1 | Chỉ bắt trùng id |
| C209 | Gap Detectability | 6 | Mọi nút có acts; u:/g: có câu dò |
| C210 | Masterability | 8 | Beta cho mọi nút × mức |
| C211 | Transferability | 1 | Không có thuộc tính transfer |
| C212 | Retentionability | 2 | FSRS đồng nhất, không có mức quan trọng ghi nhớ theo nút |
| C213 | Difficulty Calibration | 3 | Nút chỉ có cấp CEFR; câu thi có b + empiricalB |
| C214 | Context Mapping | 5 | ctx đoán theo từ khoá, chỉnh tay được |
| C215 | Misconception Mapping | 3 | Giải thích từng phương án, tag sổ lỗi; chưa mô hình hóa trên nút |
| C216 | Contrast Mapping | 2 | Không có cạnh 'dễ nhầm'; chỉ 26 cặp âm |
| C217 | Knowledge Reuse | 9 | Một đồ thị cho 35 mục tiêu |
| C218 | Coverage Audit | 8 | coverage.md tự sinh, CI |
| C219 | Orphan Detection | 2 | Không kiểm |
| C220 | Model Integrity | 8 | validate(): trùng, cạnh lạc, tự trỏ, vòng lặp; CI |

## Phần B — CEFR Content & Level Validity (C221–C240): 5.1/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C221 | Level Coverage | 7 | A1–C2 mỗi cấp 47–50 nút; Pre-A1 chưa là mục tiêu |
| C222 | Progression Validity | 6 | Đóng tiền đề tăng 162 → 960; có test |
| C223 | Cross-Level Dependency | 4 | Không kiểm tiền đề ngược cấp |
| C224 | Descriptor Traceability | 4 | Can-Do có câu en, chưa gắn id descriptor CEFR CV |
| C225 | Boundary Testing | 1 | Không có |
| C226 | Misclassification Detection | 3 | Bằng chứng thật đè tiên nghiệm; không có bộ phát hiện |
| C227 | Uneven Profile | 7 | Cấp riêng từng kỹ năng, từng nút |
| C228 | Level-Specific Evidence | 5 | Mức cần theo loại nút; câu thi theo band |
| C229 | Level-Specific Transfer | 1 | Không có |
| C230 | Level-Specific Performance | 6 | Ngưỡng VSTEP/IELTS, perfEst theo cấp |
| C231 | Vocabulary Coverage | 8 | 9.345 từ gắn cấp, 515 nút |
| C232 | Grammar Coverage | 7 | 154 điểm ngữ pháp |
| C233 | Functional Coverage | 6 | Nhóm Can-Do chức năng |
| C234 | Interaction Coverage | 5 | 24 hội thoại mở, phản xạ |
| C235 | Pragmatic Coverage | 3 | Rời rạc, không có nút riêng |
| C236 | Discourse Coverage | 4 | Đọc/viết dài, từ nối trong vxWChecks |
| C237 | Reception Coverage | 8 | Nghe/Đọc phong phú |
| C238 | Production Coverage | 6 | Viết/Nói có, chấm bằng luật + tự chấm |
| C239 | Balance Audit | 3 | Không có kiểm tự động |
| C240 | CEFR Model Versioning | 8 | Goal 1.0, lưu phiên bản lúc chọn |

## Phần C — Evidence Validity (C241–C260): 4.0/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C241 | Independence | 3 | Chỉ giảm ×0,5 cùng câu trong 24h |
| C242 | Redundancy Detection | 3 | Như trên |
| C243 | Correlation | 1 | Không có |
| C244 | Diversity | 6 | Theo dõi ≤6 dạng câu, ≤8 ngữ cảnh; dùng trong confidence |
| C245 | Novelty | 1 | Không có |
| C246 | Difficulty Adjustment | 4 | IRT có b; Beta của engine không theo độ khó |
| C247 | Assistance Detection | 4 | Tự nhận đoán ×0,5; gợi ý không được đánh dấu |
| C248 | Retry Detection | 5 | Ngữ pháp bỏ lượt làm lại; từ vựng chưa rõ |
| C249 | Guessing Detection | 8 | g = 1/số phương án; phép thử 'không có bài' chống mẹo |
| C250 | Speed Interpretation | 6 | Không dùng tốc độ cho mastery (đúng), cũng chưa dùng làm tín hiệu phụ |
| C251 | Context Validity | 3 | 'ctx' thực chất là chiều bài tập (rec/rcl…), lẫn với ngữ cảnh |
| C252 | Task Validity | 5 | Ánh xạ dạng câu → mức có lý do |
| C253 | Construct Validity | 5 | Kiểm nội dung + soát độc lập bằng phiên AI khác |
| C254 | Contamination | 4 | Ít cơ chế game nên ít nhiễm, nhưng không đo |
| C255 | Reliability | 5 | Thống kê rpb, ẩn câu kém (cần dữ liệu máy chủ) |
| C256 | Confidence Calibration | 1 | Chưa có dữ liệu |
| C257 | Drift Detection | 1 | Không có |
| C258 | Source Comparison | 3 | Chỉ độ lệch tự chấm vs điểm thật |
| C259 | Conflict Resolution | 4 | Beta cộng dồn; bằng chứng thật đè tiên nghiệm |
| C260 | Evidence Sufficiency | 8 | Đạt cần LB ≥ 0,6; Readiness cần tin cậy ≥ Vừa |

## Phần D — Statistical & Mastery Validation (C261–C280): 4.0/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C261 | Mastery Calibration | 1 | Chưa có dữ liệu |
| C262 | Confidence Calibration | 1 | Chưa có dữ liệu |
| C263 | Beta Parameter Validation | 8 | Unit test công thức |
| C264 | Guessing Parameter | 2 | g lý thuyết; kế hoạch đổi sang IRT khi ≥200 lượt |
| C265 | Slip Parameter | 2 | Cố định 0,1 |
| C266 | Repetition Weight | 4 | Test cơ học, chưa kiểm thực nghiệm |
| C267 | Monotonicity | 7 | Đúng theo cấu trúc, có test |
| C268 | Contradictory Evidence | 6 | β tăng khi sai |
| C269 | Small-Sample Protection | 8 | 2 câu đúng chưa Đạt, có test |
| C270 | Large-Sample Stability | 6 | Ổn định, nhưng vì không quên nên n lớn thì cứng |
| C271 | Boundary Sensitivity | 5 | Một test 12/13 |
| C272 | Threshold Sensitivity | 3 | Là tham số, chưa test độ nhạy |
| C273 | Confidence Interval Validity | 5 | Xấp xỉ chuẩn cho Beta, lệch khi n nhỏ/lệch về 1 |
| C274 | Weight Sensitivity | 2 | Không có |
| C275 | Recovery | 5 | Hồi được nhưng chậm khi đã nhiều lỗi (không có trọng số gần đây) |
| C276 | Decay | 5 | Beta không phân rã; quên chỉ đi qua FSRS + bằng chứng sai khi ôn |
| C277 | Transfer Test | 1 | Không có |
| C278 | Cross-Context | 6 | Số ngữ cảnh vào confidence |
| C279 | False-Positive Rate | 1 | Không đo |
| C280 | False-Negative Rate | 1 | Không đo |

## Phần E — Diagnostic Science (C281–C300): 3.7/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C281 | Diagnostic Accuracy | 3 | Chỉ test hội tụ trên dữ liệu giả |
| C282 | Efficiency | 7 | ≤16 nút, ≤20 phút; IRT ≤12 câu/kỹ năng |
| C283 | Information Gain | 6 | IRT chọn theo information; dò đồ thị theo heuristic |
| C284 | Information Gain / Effort | 3 | Không mô hình nỗ lực |
| C285 | Hypothesis Tracking | 2 | Chỉ có ước lượng cầu thang |
| C286 | Hypothesis Updating | 4 | Cầu thang cập nhật |
| C287 | Stopping | 7 | Đổi chiều / hết giờ / hết lượt; IRT theo SE |
| C288 | Continuation | 3 | Không dò tiếp ngầm theo uncertainty |
| C289 | Probe Selection | 6 | Gần cấp ước tính + nhiều phụ thuộc |
| C290 | Root Cause Efficiency | 4 | Hạ nửa cấp, thô |
| C291 | Prerequisite Diagnosis | 4 | Hạ cấp chứ không đi theo cạnh tiền đề |
| C292 | Misconception Diagnosis | 2 | Không có |
| C293 | Guessing Diagnosis | 4 | Tự nhận đoán; tham số c của 3PL |
| C294 | Careless Error | 2 | Chỉ slip cố định |
| C295 | Fatigue Signal | 1 | Không có |
| C296 | Interaction Effect | 1 | Không có |
| C297 | Bias Detection | 1 | Không có |
| C298 | Repeatability | 5 | Tất định theo câu trả lời, lấy trung bình 4 điểm cuối |
| C299 | Recovery | 6 | Bằng chứng thật đè tiên nghiệm, làm lại chẩn đoán được |
| C300 | Auditability | 3 | Chỉ lưu kết quả cuối, không lưu lý do chọn nút dò |

## Phần F — Next Best Action Validation (C301–C320): 5.5/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C301 | Candidate Generation | 6 | Nút mở + ôn + bài làm thật + kiểm tra bỏ qua |
| C302 | Feasibility | 7 | Chỉ nút đủ tiền đề; có nút 'chưa có bài trong app' |
| C303 | Goal Relevance | 9 | Chỉ nút trong bao đóng mục tiêu |
| C304 | Prerequisite Relevance | 8 | dep có trọng số cạnh |
| C305 | Learning Value | 5 | Ngầm qua dep |
| C306 | Information Value | 2 | Không có trong điểm ưu tiên |
| C307 | Retention Value | 5 | Khối ôn cố định ≤30% |
| C308 | Transfer Value | 1 | Không có |
| C309 | Effort Cost | 7 | Chia cho phút ước tính |
| C310 | Interruption Cost | 1 | Không có |
| C311 | Expected Utility | 5 | dep ÷ phút rõ ràng nhưng chưa đủ thành phần §57 |
| C312 | Tie-Breaking | 8 | Theo id, tất định |
| C313 | Skip Capability | 8 | Kiểm tra để bỏ qua ×4, tiên nghiệm chẩn đoán |
| C314 | Advance Capability | 7 | Đạt thì ra khỏi lộ trình |
| C315 | Review Priority | 6 | Ôn trước nhưng bị trần 30% dù rủi ro quên cao |
| C316 | Diagnostic Priority | 4 | Chỉ nhắc làm chẩn đoán khi chưa có |
| C317 | Intervention Priority | 2 | Không có |
| C318 | NBA Stability | 6 | Tất định; chưa test độ nhảy |
| C319 | NBA Responsiveness | 8 | Tính lại sau mỗi câu |
| C320 | NBA Explainability | 6 | 'Cần cho X · mở đường cho N năng lực'; không lưu lại |

## Phần G — Learning Effectiveness (C321–C340): 1.6/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C321 | Pre/Post Gain | 2 | Có công cụ (kiểm tra đầu vào, thi thử), chưa đo |
| C322 | Delayed Gain | 1 | Chưa có dữ liệu / cơ chế |
| C323 | Transfer Gain | 0 | Chưa có dữ liệu / cơ chế |
| C324 | Retention Gain | 2 | Log FSRS có, chưa phân tích |
| C325 | Adaptive vs Fixed | 0 | Chưa có dữ liệu / cơ chế |
| C326 | Game vs Non-Game | 0 | Chưa có dữ liệu / cơ chế |
| C327 | Effort-Normalized Gain | 2 | Có ghi phút học |
| C328 | Time-Normalized Gain | 2 | Có ghi phút học |
| C329 | Evidence-Normalized Gain | 0 | Chưa có dữ liệu / cơ chế |
| C330 | Intervention Effectiveness | 0 | Chưa có can thiệp |
| C331 | Intervention Precision | 1 | Chưa có dữ liệu / cơ chế |
| C332 | Intervention Recall | 1 | Chưa có dữ liệu / cơ chế |
| C333 | Path Efficiency | 2 | Có ước tính giờ, chưa đo |
| C334 | Relearning Efficiency | 5 | Cơ chế: kiểm tra bỏ qua, tiên nghiệm |
| C335 | Bottleneck Resolution | 4 | Cơ chế: biên tiền đề |
| C336 | Learning Persistence | 2 | Streak có, chưa đo |
| C337 | Independent Performance | 4 | Giảm trọng số khi đoán |
| C338 | Spontaneous Use | 1 | Chưa có dữ liệu / cơ chế |
| C339 | Context Generalization | 1 | Chưa có dữ liệu / cơ chế |
| C340 | Outcome Validity | 3 | Thu cặp ước tính–điểm thật (el_pair), công bố khi đủ 100 |

## Phần H — Game / Learning Validity (C341–C360): 5.0/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C341 | Fun ≠ Learning | 1 | Chưa có dữ liệu / cơ chế |
| C342 | Learning ≠ Game Score | 8 | XP tách khỏi Readiness, nói rõ trên màn |
| C343 | Reaction Speed Confound | 6 | Tốc độ không vào mastery |
| C344 | Motor Skill Confound | 4 | Chạm đơn giản, chưa test |
| C345 | Game Strategy Confound | 4 | Gần như không có chiến thuật game |
| C346 | Layout Memorization | 6 | Xáo phương án |
| C347 | Pattern Memorization | 4 | Giảm trọng số 24h, FSRS |
| C348 | Challenge Novelty | 3 | Không đòi câu mới để Đạt |
| C349 | Game Difficulty Isolation | 1 | Không có gameplay difficulty |
| C350 | Language Difficulty Isolation | 1 | Chưa có dữ liệu / cơ chế |
| C351 | Challenge Fairness | 5 | Chưa có dữ liệu / cơ chế |
| C352 | Feedback Validity | 8 | Giải thích tiếng Việt từng phương án |
| C353 | Feedback Timing | 7 | Ngay khi luyện, sau khi làm bài kiểm tra |
| C354 | Challenge Variety | 8 | 26 dạng câu thi + nhiều dạng từ vựng/ngữ pháp |
| C355 | Game Flow | 5 | Không ngắt (vì chưa có can thiệp) |
| C356 | Difficulty Adaptation | 6 | Lên câu tự gõ; IRT |
| C357 | Objective Visibility | 7 | 'Bước tiếp theo… cần cho…' |
| C358 | Completion Integrity | 8 | cdProg tính từ điểm, không từ số bài |
| C359 | Reward Integrity | 6 | Năng lượng theo lượt không theo lỗi; rủi ro cày XP đã ghi nhận |
| C360 | Game Learning Attribution | 1 | Chưa có dữ liệu / cơ chế |

## Phần I — Bias, Fairness & Robustness (C361–C380): 3.6/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C361 | Demographic Bias | 0 | Chưa có dữ liệu / cơ chế |
| C362 | Language Background | 1 | Chỉ người Việt |
| C363 | Accent Robustness | 4 | Giọng Anh/Mỹ, nghe nhiều giọng; chưa test bias |
| C364 | World-Knowledge Bias | 6 | Phép thử 'không có bài' |
| C365 | Cultural Bias | 3 | Chưa có dữ liệu / cơ chế |
| C366 | Device Bias | 4 | e2e Android/iOS/desktop (chức năng) |
| C367 | Screen Size Bias | 5 | e2e mobile + desktop |
| C368 | Network Bias | 8 | Offline test, ghi bằng chứng tại máy |
| C369 | Accessibility Bias | 6 | axe WCAG AA, phím tắt |
| C370 | Hint Bias | 5 | Đoán ×0,5 |
| C371 | Fatigue Bias | 1 | Chưa có dữ liệu / cơ chế |
| C372 | Familiarity Bias | 3 | Chỉ 24h |
| C373 | Speed Bias | 8 | Chậm không bị phạt |
| C374 | Error Bias | 6 | Beta đối xứng |
| C375 | Content (Author) Bias | 1 | Chưa có dữ liệu / cơ chế |
| C376 | Game Preference Bias | 2 | Chưa có dữ liệu / cơ chế |
| C377 | Difficulty Feedback Loop | 2 | Chưa có dữ liệu / cơ chế |
| C378 | Cold Start Bias | 6 | Tiên nghiệm, tin cậy Thấp |
| C379 | Model Drift Bias | 0 | Chưa có dữ liệu / cơ chế |
| C380 | Bias Auditability | 1 | Chưa có dữ liệu / cơ chế |

## Phần J — Data Engineering, Performance & Reliability (C381–C400): 6.3/10

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C381 | Offline Learning Loop | 9 | Service worker, test offline |
| C382 | Offline Evidence Queue | 8 | Ghi localStorage ngay |
| C383 | Sync Conflict | 6 | Mỗi ô lấy bản nhiều n hơn: an toàn nhưng bỏ bằng chứng của máy kia |
| C384 | Atomic State Update | 7 | Một setItem JSON |
| C385 | Transaction Integrity | 6 | eEv nuốt lỗi im lặng (try/catch rỗng) |
| C386 | Crash Recovery | 7 | Lưu sau mỗi câu; đề thi dở được lưu |
| C387 | Data Migration | 9 | migrateE/X có phiên bản |
| C388 | Backward Compatibility | 8 | Test v1 → v3 |
| C389 | Evidence Schema Versioning | 5 | State có E_V; sự kiện bằng chứng không có |
| C390 | Rule Versioning | 1 | Không có |
| C391 | Content Versioning | 3 | Tệp băm, không ghi vào bằng chứng |
| C392 | Deterministic Reproduction | 4 | Hàm thuần, RNG có hạt; đầu vào lịch sử không lưu |
| C393 | Runtime Query Efficiency | 8 | Ô Beta O(1) |
| C394 | Storage Growth Test | 6 | Có trần theo thiết kế; chưa test 10×/100×/1000× |
| C395 | Memory Footprint | 8 | Giới hạn theo số nút |
| C396 | CPU Efficiency | 7 | 4.000 lượt mô phỏng mỗi lần tính |
| C397 | Battery Efficiency | 4 | Chưa đo |
| C398 | Export Integrity | 7 | Mã/file đồng bộ, sanitize, e2e |
| C399 | Corruption Detection | 7 | sanitize + LOAD_ISSUE chặn ghi đè |
| C400 | Full Loop Integrity | 7 | e2e engine.spec: trả lời → bằng chứng → lộ trình → bước tiếp |

## Gốc rễ: 4 nguyên nhân giải thích gần hết các điểm thấp

1. **Kiến trúc evidence "gộp ngay khi ghi" (fold-on-write).** Mỗi câu trả lời được cộng thẳng vào ô Beta rồi bỏ đi. App không có L0 (observation thô), L1 (sổ bằng chứng) và L4 (Decision Snapshot). Riêng nguyên nhân này kéo thấp khoảng 35–40 tiêu chí (Provenance, C241–C245, C256–C258, C264–C266, C272–C274, C279–C280, C300, C389–C392), gây ra HF6, HF8, MT17, MT18, MT20, và góp phần vào HF10. **Sửa một chỗ này lợi nhất.**
2. **Lệch spec: v2 → v2.4.** App theo v2: ưu tiên ôn thi, 35 mục tiêu ngay từ đầu, kiếm tiền kiểu Duolingo. v2.4 đặt trọng tâm vào game, coi CEFR là mục tiêu MVP duy nhất, và tách evidence lifecycle thành hệ riêng. Nhóm Game (3/10), H349–H350, Micro-learning (2,5/10) thấp chủ yếu vì lý do này.
3. **n = 1, chưa có cohort.** Nhóm G (1,6), I (3,6) và calibration (C256, C261–C262, C279–C280) cần dữ liệu nhiều người học. Đây là giới hạn cấu trúc mà `docs/SPEC.md` ("Giới hạn thực tế" #1–2) đã ghi rõ, không phải thiếu sót code. Tuy vậy, khi có người dùng mà nguyên nhân #1 chưa được sửa thì cũng **không calibrate ngược được**, nên #1 cần làm trước.
4. **Mô hình Beta không có yếu tố thời gian.** α, β chỉ tăng, không phân rã. Khi n lớn thì mastery "khóa cứng": hồi phục chậm (C275), không phản ứng với việc quên (C276), và mâu thuẫn với HG16 / MT11.

## Phản biện: những chỗ chính spec/framework cần sửa

1. **C1–C200 chưa được định nghĩa từng tiêu chí.** Phần K chỉ ghi tên 20 nhóm × 10, nên mới chấm được theo nhóm. Cần viết ra 200 tiêu chí đó, nếu không thì con số "400" chỉ là danh nghĩa.
2. **Cần phân biệt "0 điểm" với "chưa đo được".** Khoảng 45 tiêu chí (G, I, phần calibration) không thể đạt khi chưa có cohort. Nếu nhân vào Final Quality Equation thì mọi MVP đều ≈ 0, và thước đo mất tác dụng chỉ đường. Đề xuất thêm trạng thái **N/A-D (cần dữ liệu)** và gate theo độ trưởng thành như Phần O đã gợi ý.
3. **Công thức mastery §44 là heuristic, không phải Bayes chuẩn.** `α += w(1−g)`, `β += w(1−s)` không phải hậu nghiệm đúng khi có đoán mò/nhầm tay (mô hình đó không liên hợp với Beta). Do đó C261 ("m = 0,8 nghĩa là đúng 80% thật") không được bảo đảm về mặt lý thuyết. Có hai hướng: (a) giữ heuristic và calibrate bằng thực nghiệm, hoặc (b) chuyển sang BKT/IRT đúng nghĩa. Nên ghi rõ lựa chọn vào spec.
4. **§45 "cận dưới 80%" nên dùng phân vị Beta chính xác.** Code đang dùng xấp xỉ chuẩn (`m − 1,28·sd`), lệch khi n nhỏ hoặc m gần 1, đúng vùng quyết định Đạt. Tính phân vị Beta chính xác rất rẻ.
5. **v2.4 mâu thuẫn với quyết định của người sáng lập trong repo.** `docs/SPEC.md` ghi phạm vi engine đầu tiên gồm CEFR + IELTS + VSTEP + giao tiếp. v2.4 lại nói MVP chỉ có CEFR. Repo có luật "AI không đổi hướng sản phẩm khi chưa hỏi", nên **bạn cần chốt bản nào là nguồn sự thật** trước khi làm tiếp. Lưu ý: việc đã có 35 mục tiêu chạy trên cùng engine thực ra *đã chứng minh trước* M10 (Target Extensibility), nên không nên cắt bỏ.
6. **Tiên nghiệm sau chẩn đoán làm nút "Đạt" mà chưa có bằng chứng nào** (Beta(7; 1,5) → pass). Thiết kế này hợp lý cho P10 (bỏ qua thứ đã biết), và Readiness đã chặn được vì n = 0 → tin cậy Thấp. Nhưng v2.4 yêu cầu tách Claim khỏi Mastery (§82), nên cần trạng thái riêng kiểu `inferred`, để không lẫn với `mastered`.

## Kế hoạch đề xuất (xếp theo số tiêu chí nâng được ÷ công sức)

| Ưu tiên | Việc | Gỡ được | Ước lượng tác động |
|---|---|---|---|
| 1 | **Evidence Ledger L1**: sự kiện append-only `{t, node, level, ok, item, qt, ctx, g, hint, retry, rt, session, contentHash, ruleVer}`; ô Beta thành trạng thái dẫn xuất tính lại được; giữ theo giá trị (critical/boundary/disagreement giữ lâu, câu dễ lặp lại thì gộp) | HF8, HF6 (một phần), MT17, MT18, C389–C392, C241–C245 | +35–40 tiêu chí, ≈ +1,2 điểm |
| 2 | **Decision Snapshot L4** khi: nút đổi Đạt ↔ chưa Đạt, kiểm tra bỏ qua, Readiness đổi mức, NBA được chọn (kèm top-3 ứng viên và điểm) | HF6, HF10, MT20, C300, C320 | ≈ +0,4 |
| 3 | **Sửa mastery**: phân vị Beta chính xác; trọng số giảm dần theo thời gian (hoặc giới hạn n); bộ phát hiện model disagreement (nút Đạt mà sai ≥ 2 lần ở ngữ cảnh mới → mở lại chẩn đoán); trạng thái `inferred` cho tiên nghiệm | C273, C275–C276, MT11, HG16 | ≈ +0,3 |
| 4 | **Micro-learning + interruption policy** (§53): cùng nút sai lặp lại trong buổi → giải thích 30 giây + 3 câu + kiểm lại; lỗi lẻ thì chỉ ghi | Nhóm 17, C317, C330–C332, MT5 | ≈ +0,3 |
| 5 | **Transfer**: đánh dấu câu/ngữ cảnh chưa từng gặp; mức 4–5 cần ≥ 1 lần đúng ở câu mới | C211, C229, C277, C308, MT9 | ≈ +0,3 |
| 6 | Luật retention của spec: R̄ nút < 0,85 → ôn; trượt 2 lần liền → về lộ trình | MT10, nhóm 18 | nhỏ, dễ làm |
| Để sau | Game layer, calibration, bias, A/B adaptive vs fixed | Nhóm 7, G, I | Chờ chốt spec (#5 phản biện) và chờ có cohort; nhưng phải có #1 trước để dữ liệu dùng được |

Làm #1–#3 thì gỡ được cả hai Hard Fail và đưa điểm C201–C400 lên khoảng 6/10, mà không cần thêm người dùng.

