# Bảng chấm v67: 200 tiêu chí Conformance + 400 tiêu chí v2.4

Sinh tự động bởi `npm run score` từ `tools/score/conformance.json` và `tools/score/scorecard.json` (2026-10-08). Không sửa tay tệp này.
Quy tắc: Conformance 4 điểm và C201–C400 từ 9 điểm bắt buộc có test tự động chứng minh; công cụ kiểm từng tham chiếu test (230 tham chiếu) có tồn tại thật. So sánh với bản chấm v51 (`docs/CONFORMANCE-200-v2.4.md`, `docs/SCORECARD-v2.4.md`).

## Kết luận

| Chỉ số | v51 | v67 |
|---|---|---|
| Conformance 200 | 420/800 (53%) | **725/800 (91%)**: 191 Pass · 8 Partial · 1 Fail |
| Critical (50) | 130/200 | **198/200 (99%)** · 0 Fail |
| Core (100) | 217/400 | **360/400 (90%)** |
| Quality (50) | 73/200 | **167/200 (84%)** |
| C201–C400 (trung bình) | 4,3/10 | **6,3/10** |
| Hard Fail | 2 trượt | **0 trượt** |
| Meta-Test | 6/20 | **20/20** |

Không còn tiêu chí Critical nào Fail → Architecture không FAIL.

## Conformance theo nhóm

| Nhóm | v51 | v67 | Pass | Partial | Fail |
|---|---|---|---|---|---|
| 1. Product Vision & Goal | 34/40 | **39/40** | 10 | 0 | 0 |
| 2. Universal Language Core | 21/40 | **28/40** | 7 | 3 | 0 |
| 3. CEFR Competency Model | 23/40 | **33/40** | 9 | 0 | 1 |
| 4. Competency Graph | 17/40 | **36/40** | 10 | 0 | 0 |
| 5. Knowledge Model | 23/40 | **33/40** | 10 | 0 | 0 |
| 6. Content Architecture | 24/40 | **30/40** | 8 | 2 | 0 |
| 7. Game Design | 22/40 | **35/40** | 10 | 0 | 0 |
| 8. Observation | 12/40 | **37/40** | 10 | 0 | 0 |
| 9. Evidence Acquisition | 18/40 | **37/40** | 10 | 0 | 0 |
| 10. Evidence Storage | 13/40 | **38/40** | 9 | 1 | 0 |
| 11. Provenance & Audit | 7/40 | **39/40** | 10 | 0 | 0 |
| 12. Inference & Learner Model | 24/40 | **38/40** | 10 | 0 | 0 |
| 13. Mastery Engine | 35/40 | **37/40** | 9 | 1 | 0 |
| 14. Diagnostic Engine | 20/40 | **39/40** | 10 | 0 | 0 |
| 15. Gap & Root Cause | 15/40 | **40/40** | 10 | 0 | 0 |
| 16. Learning Path & NBA | 21/40 | **37/40** | 10 | 0 | 0 |
| 17. Micro Learning | 11/40 | **38/40** | 10 | 0 | 0 |
| 18. Retention & Transfer | 17/40 | **36/40** | 9 | 1 | 0 |
| 19. Readiness, Motivation & UX | 32/40 | **37/40** | 10 | 0 | 0 |
| 20. Data, Privacy, Extensibility | 31/40 | **38/40** | 10 | 0 | 0 |

## C201–C400 theo phần

| Phần | v51 | v67 |
|---|---|---|
| A. Knowledge Model Validity | 4,1 | **7,0** |
| B. CEFR Content & Level Validity | 5,1 | **6,5** |
| C. Evidence Validity | 4,0 | **5,9** |
| D. Statistical & Mastery Validation | 4,0 | **6,6** |
| E. Diagnostic Science | 3,7 | **6,2** |
| F. Next Best Action Validation | 5,6 | **8,2** |
| G. Learning Effectiveness | 1,7 | **3,1** |
| H. Game / Learning Validity | 5,0 | **7,2** |
| I. Bias, Fairness & Robustness | 3,6 | **4,4** |
| J. Data Engineering, Performance & Reliability | 6,4 | **8,1** |

## 10 Hard Fail

| # | Điều kiện | v51 | v67 | Bằng chứng |
|---|---|---|---|---|
| HF1 | Observation → Mastery trực tiếp | ✅ | ✅ | Mọi quan sát đi qua L0 → evaluate() → L1 sổ + L2 thống kê → ô Beta dẫn xuất (store.ts ingest); một câu đúng không thành Đạt |
| HF2 | Game score = năng lực | ✅ | ✅ | Xu, tầng, thắng thua của Quest là telemetry trong e.q, không vào mastery; chỉ câu trả lời thành bằng chứng |
| HF3 | Hoàn thành bài = mastery | ✅ | ✅ | cdProg tính Beta từ điểm từng hoạt động; làm đủ bài mà điểm thấp vẫn chưa đạt |
| HF4 | CEFR là một con số | ✅ | ✅ | Cấp riêng từng kỹ năng, từng nút; hồ sơ lệch cho hai cấp khác nhau |
| HF5 | Model không sửa được khi có bằng chứng trái chiều | ✅ | ✅ | Decay bằng chứng cũ ngược chiều, disagreement mở lại nút, Claim sai bị bằng chứng mới sửa |
| HF6 | Readiness không có provenance | ❌ | ✅ | Snapshot readiness ghi số liệu, ngưỡng, luật, id bằng chứng (readyview.ts) và replay được; Readiness kỳ thi (đang ẩn) chưa gắn id câu |
| HF7 | Engine hard-code CEFR | ✅ | ✅ | Mục tiêu khai readiness trong dữ liệu (READINESS_MODELS: mastery, exam-score); mục tiêu mới chỉ cần dữ liệu, chạy trên cùng engine |
| HF8 | Aggregation làm mất thông tin để giải thích/sửa model | ❌ | ✅ | L2 giữ chiều ngữ cảnh, dạng câu, câu mới, độ khó theo thiết bị; ô Beta tính lại khi đổi luật; snapshot giữ id bằng chứng |
| HF9 | Lõi cần AI khi chạy | ✅ | ✅ | Engine thuần hàm TypeScript, không gọi AI; mô phỏng và test chạy không mạng |
| HF10 | Không chứng minh được vì sao chọn NBA | ✅ | ✅ | Snapshot NBA lưu top ứng viên và phân rã utility, replay ra CHOSEN; Vì sao? hiển thị |

## 20 Meta-Test

| # | Tên | v51 | v67 | Bằng chứng |
|---|---|---|---|---|
| MT1 | Unknown learner | ✅ | ✅ | Learner mới: dò ngắn ≤ 8 phần, app tự đặt mục tiêu, đi tới đích bằng lộ trình thích ứng (mô phỏng + e2e goal-first) |
| MT2 | Advanced learner | — | ✅ | Learner biết phần lớn tốn < 80% công sức giáo trình cố định (mô phỏng) |
| MT3 | Uneven skill | — | ✅ | Từ vựng tốt, ngữ pháp yếu: chẩn đoán cho hai cấp cách ≥ 2 |
| MT4 | One error | ✅ | ✅ | 20 đúng 1 sai vẫn Đạt; một lỗi lẻ chỉ ghi nhận |
| MT5 | Repeated failure | — | ✅ | Sai lặp lại: chưa Đạt, micro mời bí kíp hoặc hỏi thêm |
| MT6 | Misconception | — | ✅ | Cùng câu trả lời sai lặp lại thành giả thuyết hiểu sai cụ thể |
| MT7 | Recognition/Recall split | ✅ | ✅ | Mức 1 Đạt, mức 3 chưa; sai mức cao không kéo mức thấp |
| MT8 | Recall/Use split | — | ✅ | Mức 3 Đạt, mức 4 chưa; đo production vẫn yếu khi chưa có AI |
| MT9 | Training/Transfer split | — | ✅ | Luyện tốt nhưng trượt câu mới: mở lại, hạ tin cậy; Readiness CEFR chưa Đạt khi chưa đúng ở câu mới (có miễn) |
| MT10 | Forgetting | — | ✅ | FSRS < 0,85 đến hạn ôn; nguy cơ quên NBA từ Σ(1 − R); Đạt mà sai 2 lần liên tiếp quay lại lộ trình |
| MT11 | Model error | — | ✅ | Claim sai từ chẩn đoán bị sửa; disagreement mở lại |
| MT12 | Goal switch | ✅ | ✅ | Đổi mục tiêu dùng lại năng lực đã có |
| MT13 | Evidence explosion | — | ✅ | 100.000 tương tác: kho có trần, ô khớp thống kê, < 20 giây |
| MT14 | Offline | ✅ | ✅ | e2e mở lại khi mất mạng |
| MT15 | Crash recovery | — | ✅ | Ô Beta lệch khi nạp được phát hiện và tính lại từ thống kê; chưa giả lập ngắt giữa setItem |
| MT16 | Migration | ✅ | ✅ | Bản lưu v3 lên v4 giữ α, β (unit + e2e) |
| MT17 | Content version | — | ✅ | cv theo từng câu: băm nội dung trong content-map.json, ghi vào từng sự kiện, e2e khớp |
| MT18 | Rule version | — | ✅ | Đổi slip tính lại từ L2; luật truyền vào ingest được dùng khi tính lại ô (sửa lỗi v66); sự kiện ghi phiên bản luật |
| MT19 | Bias | — | ✅ | Chỉ trên mô phỏng và chỉ thiên lệch kỹ năng game, tốc độ; chưa có thiên lệch nhân khẩu, chưa có dữ liệu thật |
| MT20 | Full reproducibility | — | ✅ | Mọi snapshot Đạt/mở lại trong phiên mô phỏng replay đúng kết luận |

## Chi tiết 200 tiêu chí Conformance

### 1. Product Vision & Goal: 39/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C1 | Goal-first architecture | Critical | 2 | **4** | v64: Bắt đầu → dò ngắn ≤ 8 phần → autoGoal (diag.ts) tự đặt mục tiêu CEFR, snapshot goal:AUTO; người cũ được đặt một lần (autoGoalOnce); màn chính là tháp · test: `play.spec.ts`, `engine-goalfirst.test.ts`, `play.spec.ts` |
| C2 | Goal machine-readable | Quality | 4 | **4** | goals/*.json có version, status active/future; graph.validate() kiểm phiên bản, trạng thái, nút lạ; có test · test: `engine-graph.test.ts`, `engine-graph.test.ts` |
| C3 | Target có requirement model | Critical | 4 | **4** | Goal.req {node, level, type}; closure() kéo tiền đề cứng giữ mức; có test · test: `engine-graph.test.ts`, `engine-graph.test.ts` |
| C4 | Goal-specific readiness | Core | 4 | **4** | masteryReadiness() cho CEFR, examReadiness() cho kỳ thi (đang ẩn ở MVP); có test · test: `engine-readiness.test.ts`, `engine-readiness.test.ts` |
| C5 | Goal-independent engine | Critical | 3 | **4** | v67: readinessFor() chọn mô hình theo goal.readiness (READINESS_MODELS); không còn rẽ nhánh examOf ở lớp gọi; mục tiêu mới chỉ cần dữ liệu, có test · test: `engine-content.test.ts` |
| C6 | Progress không dựa completion | Critical | 4 | **4** | Tiến độ = tỉ lệ nút Đạt theo Beta + tin cậy, không theo số bài; Can-Do theo chất lượng; có test · test: `engine-readiness.test.ts`, `mastery.spec.ts` |
| C7 | Goal có remaining gaps | Quality | 3 | **4** | readyview + whyview: "Chưa đạt A1 vì còn thiếu…" liệt kê năng lực còn thiếu; có e2e · test: `why.spec.ts` |
| C8 | Goal có evidence requirement | Quality | 2 | **3** | Mục tiêu dùng req mức + loại; yêu cầu bằng chứng nằm ở node.evReq và luật mức 4–5 cần câu mới (vf); Goal chưa tự khai loại bằng chứng |
| C9 | Goal có readiness rule | Critical | 4 | **4** | READY_P, Achieved = đủ nút Đạt tin cậy ≥ Vừa + không quên 14 ngày (masteryReadiness); snapshot readiness; có test · test: `engine-readiness.test.ts`, `engine-snapshot.test.ts` |
| C10 | Đổi goal không phá learner model | Core | 4 | **4** | Kho bằng chứng/mastery dùng chung mọi mục tiêu; đổi mục tiêu không học lại (mô phỏng); có test · test: `scenarios.test.ts`, `engine-graph.test.ts` |

### 2. Universal Language Core: 28/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C11 | Có Universal Language Core | Core | 2 | **3** | v57: mọi nút gắn dims thuộc 8 năng lực Universal Core (types.ts Dim), audit().balance; nút vẫn là Can-Do/unit/điểm ngữ pháp · test: `engine-graph.test.ts` |
| C12 | Lexical competence | Core | 2 | **2** | Nút từ vựng vẫn là cả unit; chiều rec/rcl/ctx/col chỉ là ctx của quan sát |
| C13 | Grammatical competence | Core | 3 | **3** | 154 nút điểm ngữ pháp, mức 1–5, mis (lỗi người Việt) trên một phần nút |
| C14 | Phonological competence | Core | 2 | **3** | v67: 26 nút âm vị ph: (dims phon), bằng chứng từ luyện cặp âm (mức 1, chọn); chưa đo phát âm sản sinh · test: `engine-content.test.ts` |
| C15 | Reception | Core | 3 | **3** | Nút L/R (dims rec), IRT cho đề thi |
| C16 | Production | Core | 2 | **2** | Nút W/S (dims prod), chấm luật + tự chấm |
| C17 | Interaction | Core | 1 | **3** | v67: 58 nút chức năng fn: (dims inter), bằng chứng từ quiz chức năng và hội thoại (eEv fn:); vẫn là câu chọn/gõ, chưa đo tương tác thật · test: `engine-content.test.ts` |
| C18 | Pragmatics | Core | 1 | **3** | v67: 58 nút fn: mang prag, có hoạt động và bằng chứng từ quiz chức năng/hội thoại; chưa chấm tính phù hợp ngữ dụng riêng · test: `engine-content.test.ts` |
| C19 | Discourse | Core | 1 | **2** | dims disc vẫn gắn theo regex (engine-gen.ts); nút fn: v67 không mang disc; chưa đo diễn ngôn riêng |
| C20 | Competencies tái sử dụng | Core | 4 | **4** | Một đồ thị, nhiều mục tiêu (CEFR + tương lai) dùng lại nút; mergeGoals; đổi mục tiêu dùng lại năng lực; có test · test: `engine-graph.test.ts`, `scenarios.test.ts` |

### 3. CEFR Competency Model: 33/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C21 | CEFR Pre-A1 → C2 | Core | 2 | **4** | v52: mục tiêu cefr-pre-a1 riêng, bài pa: là tiền đề cứng của A1, ghi bằng chứng nút pa:; có test · test: `engine-graph.test.ts`, `cefr.spec.ts` |
| C22 | CEFR không phải scalar | Critical | 4 | **4** | Cấp riêng từng nút/kỹ năng; chẩn đoán cho từ vựng và ngữ pháp hai cấp khác nhau; có test · test: `scenarios.test.ts`, `scenarios.test.ts` |
| C23 | Competency có level requirement | Core | 4 | **4** | Req.level 1–5 theo nút, closure giữ mức mục tiêu đã ghi; có test · test: `engine-graph.test.ts`, `engine-mastery.test.ts` |
| C24 | Competency có evidence requirement | Core | 2 | **3** | node.evReq {lv, types} cho mọi nút (v57); chỉ luật mức 4–5 cần câu mới được thực thi, types chỉ hiển thị (whyview) · test: `engine-graph.test.ts` |
| C25 | Competency có prerequisite | Critical | 3 | **4** | Cạnh cứng có why/ver, closure + blockedBy (alt/need), audit tiền đề ngược cấp = 0; có test · test: `engine-graph.test.ts`, `engine-path.test.ts`, `engine-graph.test.ts` |
| C26 | Transfer requirement | Core | 0 | **4** | imp.tr + transfer.ts; mức 4–5 cần câu mới; v65 Readiness CEFR đòi transfer (miễn khi hết câu mới), có test · test: `engine-mastery3.test.ts`, `engine-remedy.test.ts` |
| C27 | Retention requirement | Core | 1 | **3** | v65: imp.re nhân nguy cơ quên khi xếp câu rương (main.ts qStart); retention vẫn là luật 14 ngày + §58; chưa có test cho imp.re |
| C28 | Performance requirement | Core | 3 | **3** | type performance, bài làm thật ghi only, w 2 (app.js src perf) |
| C29 | CEFR profile đa chiều | Core | 3 | **3** | Hồ sơ theo nút và kỹ năng; balance theo 8 năng lực trong audit |
| C30 | CEFR mapping có provenance | Quality | 1 | **1** | Có version mục tiêu; Can-Do vẫn không ghi nguồn descriptor |

### 4. Competency Graph: 36/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C31 | Có competency graph | Critical | 4 | **4** | 1.005 nút, 2.614 cạnh, validate + audit sạch; có test · test: `engine-graph.test.ts`, `engine-graph.test.ts` |
| C32 | Hard prerequisite | Critical | 4 | **4** | Cạnh cứng mở nút (blockedBy); có test · test: `engine-path.test.ts` |
| C33 | Soft prerequisite | Quality | 3 | **3** | 377 cạnh soft có w, dùng trong dep của plan() |
| C34 | Alternative prerequisite | Quality | 0 | **4** | v67: đồ thị thật có 38 nhóm alt/need (681 cạnh) cho Can-Do vốn từ; blockedBy() mở khi đủ need; có test trên đồ thị thật · test: `engine-graph.test.ts`, `engine-content.test.ts` |
| C35 | Transfer relationship | Quality | 0 | **3** | node.uses (669 nút) khớp cạnh cứng, có test; dùng để hiển thị, transfer.ts dựa imp.tr chứ không đi theo uses · test: `engine-graph.test.ts` |
| C36 | Edge có rationale | Quality | 0 | **3** | Mọi cạnh có why (cando-act, level-ladder, gram-order, exam-base, pa-act); có test Hạ còn 3: lý do của cạnh là mã phân loại tự động, chưa phải giải thích riêng. · test: `engine-graph.test.ts` |
| C37 | Edge có version | Quality | 1 | **3** | Mọi cạnh có ver; hiện đều là 1.0, chưa có quy trình nâng phiên bản · test: `engine-graph.test.ts` |
| C38 | Cycle detection | Critical | 4 | **4** | topo() + validate(), CI; có test · test: `engine-graph.test.ts`, `engine-graph.test.ts` |
| C39 | Orphan detection | Quality | 0 | **4** | audit().orphan; đồ thị thật 0 mồ côi; có test · test: `engine-graph.test.ts` |
| C40 | Unreachable detection | Quality | 1 | **4** | audit().unreachable (nút không có hoạt động trong mục tiêu mở) = 0; có test · test: `engine-graph.test.ts`, `engine-path.test.ts` |

### 5. Knowledge Model: 33/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C41 | Node identity ổn định | Core | 3 | **3** | id chuẩn hoá, regex trong sanitizeE/sanitizeEv |
| C42 | Node có prerequisite | Core | 3 | **3** | Qua cạnh pre/post |
| C43 | Node có CEFR relevance | Core | 3 | **3** | Trường cefr |
| C44 | Node có mastery dimensions | Core | 4 | **4** | Ô Beta × 5 mức, sai chỉ tính đúng mức (m3.1); có test · test: `engine-mastery.test.ts`, `scenarios.test.ts` |
| C45 | Node có evidence requirements | Core | 1 | **3** | node.evReq trên mọi nút, hiển thị ở Vì sao?; chưa gate Đạt theo types · test: `engine-graph.test.ts` |
| C46 | Node có difficulty | Quality | 1 | **3** | node.diff 0–1 mọi nút, suy từ cấp + loại; engine chưa dùng · test: `engine-graph.test.ts` |
| C47 | Node có distractor profile | Quality | 1 | **3** | node.contrast (73 nút, đối xứng) + mis (28 nút); dùng trong bí kíp và Vì sao? · test: `engine-graph.test.ts` |
| C48 | Node có content mapping | Core | 3 | **4** | acts mở đúng màn; v67 content-map.json gắn mọi câu học nền vào nút; mọi nút từ vựng/ngữ pháp/âm có câu (content-check + test) · test: `engine-content.test.ts` |
| C49 | Node có version | Quality | 0 | **3** | node.ver mọi nút; hiện đều 1.0 · test: `engine-graph.test.ts` |
| C50 | Node không phụ thuộc game | Core | 4 | **4** | Nút không biết gì về game; game chỉ trình bày thử thách do engine chọn; có test · test: `engine-quest.test.ts`, `engine-quest.test.ts` |

### 6. Content Architecture: 30/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C51 | Content tách khỏi competency | Core | 3 | **3** | content/engine, content/exam JSON; bài học nền vẫn ở app.js / data/lv |
| C52 | Một competency nhiều content | Core | 3 | **3** | Nhiều acts, nhiều câu, câu transfer, bí kíp cho một nút |
| C53 | Content có difficulty | Quality | 3 | **3** | Câu thi có b; bài học theo cấp |
| C54 | Content có context | Quality | 2 | **2** | ctx rải rác (dim bài tập, transfer, quest-*) |
| C55 | Content có evidence mapping | Core | 2 | **3** | v67: content-map.json (engine-gen.ts) ánh xạ câu → nút + mức + băm; content-check.ts kiểm; câu thi vẫn ánh xạ trong code (examEvidence) Hạ còn 3 khi rà: câu thi vẫn ánh xạ trong code. · test: `engine-content.test.ts` |
| C56 | Content có version | Quality | 1 | **4** | v67: itemCv() ghi băm nội dung từng câu vào cv của sự kiện, khớp content-map; câu thi theo gói (contentVer) · test: `evidence.spec.ts`, `engine-content.test.ts` |
| C57 | Distractor quality | Quality | 3 | **3** | Phép thử chống mẹo + soát độc lập |
| C58 | Content có prerequisite mapping | Core | 2 | **2** | Qua nút |
| C59 | Coverage tự động | Core | 4 | **4** | coverage.md + audit unreachable = 0 trên mục tiêu mở; có test · test: `engine-graph.test.ts`, `engine.spec.ts` |
| C60 | Không content orphan | Quality | 1 | **3** | v67: content-check.ts báo nút không có trong đồ thị (mồ côi) và nút từ vựng/ngữ pháp không có câu; phạm vi là câu học nền Hạ còn 3 khi rà: kiểm mồ côi mới phủ câu học nền, chưa phủ câu thi. · test: `engine-content.test.ts` |

### 7. Game Design: 35/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C61 | Game là primary interface | Core | 1 | **3** | v64: ui.view mặc định play, tab Chơi, mở lại app vào tháp Ladder Quest; tháp chỉ phủ nút u:/g:, bài học thường vẫn còn Hạ còn 3 khi rà: tháp mới phủ nút từ vựng/ngữ pháp, chưa phủ mọi năng lực. · test: `play.spec.ts`, `quest.spec.ts` |
| C62 | Game có learning objective | Core | 3 | **4** | Mỗi lượt Quest là thử thách gắn nút do NBA chọn, không gameplay rỗng; có test · test: `engine-quest.test.ts` |
| C63 | Game có measurement objective | Core | 2 | **3** | Challenge có evidenceTypes, value; cảnh trinh sát = câu dò; bài học thường vẫn ngầm · test: `engine-quest.test.ts` |
| C64 | Challenge có target competency | Core | 3 | **4** | Challenge.targetCompetencies, bằng chứng ghi node; có test · test: `engine-quest.test.ts`, `quest.spec.ts` |
| C65 | Challenge có language difficulty | Core | 2 | **3** | languageDifficulty = mức mastery 1–5 do engine chọn; không phải độ khó câu · test: `engine-quest.test.ts` |
| C66 | Challenge có gameplay difficulty | Core | 0 | **4** | gameplayDifficulty theo tầng, chỉ đổi máu/tim, không đổi câu; có test · test: `engine-quest.test.ts` |
| C67 | Challenge có expected effort/time | Quality | 2 | **3** | Challenge.expectedTime (hằng số theo loại cảnh) |
| C68 | Challenge có evidence types | Core | 2 | **3** | Challenge.evidenceTypes theo loại cảnh (EVT); ngoài Quest vẫn trong code |
| C69 | Game không quyết định curriculum | Critical | 4 | **4** | planFloor() lấy nội dung từ NBA rank(); game không chọn curriculum; có test · test: `engine-quest.test.ts` |
| C70 | Game skill không tăng mastery | Critical | 3 | **4** | Kết quả game (xu, tầng) chỉ ở e.q, không vào mastery; hết giờ ×0,3; có test (kể cả mô phỏng MT19) · test: `engine-quest.test.ts`, `scenarios.test.ts`, `quest.spec.ts` |

### 8. Observation: 37/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C71 | Observation tồn tại riêng | Critical | 0 | **4** | v53: Observation L0 (ev/types.ts) lưu st.obs, đi qua evaluate(); có test · test: `engine-evidence.test.ts`, `evidence.spec.ts` |
| C72 | Observation có timestamp | Quality | 1 | **4** | ObsRec/EvEvent có ts (ms) + day; v66 có test khẳng định ts, day của sự kiện · test: `engine-evq.test.ts` |
| C73 | Observation có challenge ref | Core | 1 | **4** | Observation.ch (g:, u:, quest-1:…, micro/, xfer/); có test · test: `engine-evidence.test.ts`, `quest.spec.ts` |
| C74 | Observation có item ref | Core | 2 | **4** | item lưu trong L0/L1, seen hash cho độ mới; có test · test: `engine-evidence.test.ts`, `evidence.spec.ts` |
| C75 | Observation ghi correctness | Core | 2 | **4** | ok lưu trong L0/L1, thống kê L2; có test · test: `engine-evidence.test.ts`, `engine-evidence.test.ts` |
| C76 | Response time | Quality | 1 | **4** | rt ghi từ bài từ vựng/ngữ pháp, không vào trọng số (P15); có test · test: `engine-evidence.test.ts`, `engine-evidence.test.ts` |
| C77 | Hint/retry | Core | 1 | **3** | retry, hint, timeout, tự nhận đoán vào evaluate(); app chỉ truyền retry/đoán (hint chỉ ở bí kíp) · test: `engine-evidence.test.ts` |
| C78 | Observation ghi context | Core | 1 | **3** | ctx mỗi quan sát, khoá L2 theo ngữ cảnh; ngữ cảnh chủ yếu là chiều bài tập · test: `engine-nba.test.ts` |
| C79 | Observation không trực tiếp cập nhật mastery | Critical | 2 | **4** | Quan sát chỉ qua evaluate() → L1/L2, ô Beta dẫn xuất (derive); ghi hỏng được sửa theo thống kê; có test · test: `engine-evidence.test.ts`, `scenarios.test.ts` |
| C80 | Raw observation có lifecycle | Quality | 1 | **3** | L0 giữ 7 ngày / 300 bản ghi, không đồng bộ; chưa có test riêng |

### 9. Evidence Acquisition: 37/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C81 | Observation → Evidence | Critical | 2 | **4** | evaluate() biến Observation thành EvEvent có w, rel, tier, ev; có test · test: `engine-evidence.test.ts`, `engine-evidence.test.ts` |
| C82 | Evidence có competency | Core | 4 | **4** | node trong EvEvent; có test · test: `engine-evidence.test.ts` |
| C83 | Evidence có mastery dimension | Core | 4 | **4** | lv, only, lan xuống mức thấp; có test · test: `engine-mastery.test.ts` |
| C84 | Evidence có source | Core | 1 | **4** | src (vocab, gram, exam, game, micro, transfer…); có test · test: `engine-evidence.test.ts`, `evidence.spec.ts` |
| C85 | Evidence có reliability | Core | 1 | **4** | rel 0–1 theo g, trợ giúp, hết giờ, mệt (evaluate.ts, fatigue); có test khẳng định rel · test: `engine-evq.test.ts` |
| C86 | Evidence có difficulty | Quality | 1 | **3** | v66: diff −1..1 vào khoá L2 và trọng số (diffW); chỉ câu thi truyền diff (exam/evidence.ts), câu học nền chưa truyền · test: `engine-evq.test.ts` |
| C87 | Evidence có novelty/context | Quality | 2 | **4** | nov (câu mới) + ctx; mức 4–5 cần đúng câu mới; có test · test: `engine-mastery3.test.ts`, `engine-evidence.test.ts` |
| C88 | Evidence có independence | Quality | 1 | **4** | Lặp 24h ×0,5; v66 câu trùng nội dung (text) dưới id khác không tính là mới; mức 1–3 cần ≥ 2 câu khác nhau; có test · test: `engine-mastery.test.ts`, `engine-evq.test.ts` |
| C89 | Evidence có strength | Core | 2 | **3** | w hiệu dụng sau đánh giá × (1 − g), val; chưa có thang strength riêng |
| C90 | Evidence có decision value | Quality | 0 | **3** | val = tier + novelty + giảm sd (ingest); dùng khi dọn sổ · test: `engine-evidence.test.ts` |

### 10. Evidence Storage: 38/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C91 | Raw không phải tầng lưu duy nhất | Core | 2 | **4** | L0 obs, L1 led, L2 agg, L3 m, L4 snap; có test · test: `engine-evidence.test.ts`, `engine-snapshot.test.ts` |
| C92 | Có Evidence Event | Critical | 0 | **4** | Sổ L1 EvEvent có id thiết bị, provenance; có test · test: `engine-evidence.test.ts`, `evidence.spec.ts` |
| C93 | Có Evidence Aggregate | Core | 3 | **4** | Agg L2 theo thiết bị × ô × (ctx, qt, nov, diff), G-counter; có test · test: `engine-evidence.test.ts` |
| C94 | Có Evidence State | Core | 3 | **4** | Ô Beta dẫn xuất derive/recomputeAll; verify sửa lệch; có test · test: `engine-evidence.test.ts`, `engine-evidence.test.ts` |
| C95 | Có Decision Snapshot | Critical | 0 | **4** | v54 snapshot.ts: mastery, testout, readiness, nba, diag; replay; có test · test: `engine-snapshot.test.ts`, `engine-snapshot.test.ts` |
| C96 | Retention policy | Quality | 1 | **4** | prune() theo giá trị + đại diện, không theo tuổi; L0 7 ngày; có test · test: `engine-evidence.test.ts`, `engine-evidence.test.ts` |
| C97 | Evidence tier | Quality | 0 | **4** | tier 1–3 (flip, boundary, disagree, transfer); tier 0 = game ở e.q; có test · test: `engine-evidence.test.ts`, `engine-transfer.test.ts` |
| C98 | Evidence sampling | Quality | 0 | **2** | Không có lấy mẫu; chỉ giữ bằng chứng đại diện khi dọn sổ |
| C99 | Information-preserving aggregation | Critical | 1 | **4** | L2 giữ đủ chiều, đổi luật tính lại được không cần dữ liệu gốc; có test · test: `engine-evidence.test.ts`, `scenarios.test.ts` |
| C100 | Storage growth kiểm soát | Quality | 3 | **4** | Sổ có trần, dung lượng không tăng theo lượt ở 100K; có test · test: `engine-evidence.test.ts`, `scenarios.test.ts` |

### 11. Provenance & Audit: 39/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C101 | Evidence biết source | Critical | 1 | **4** | EvEvent.src + id thiết bị; có test · test: `engine-evidence.test.ts` |
| C102 | biết activity | Core | 1 | **4** | src (hoạt động) + sess; có test · test: `engine-evidence.test.ts` |
| C103 | biết challenge | Core | 0 | **4** | ch (thử thách); có test · test: `engine-evidence.test.ts`, `quest.spec.ts` |
| C104 | biết evaluator | Quality | 1 | **4** | ev = phiên bản evaluator/luật mastery (ev1.0/m3.1); có test · test: `engine-evidence.test.ts`, `scenarios.test.ts` |
| C105 | biết rule version | Critical | 0 | **4** | Mỗi sự kiện + snapshot ghi luật; có test · test: `engine-evidence.test.ts`, `engine-snapshot.test.ts` |
| C106 | biết content version | Quality | 0 | **4** | cv theo sự kiện; v67 câu học nền mang băm nội dung từng câu (itemCv), e2e kiểm khớp content-map · test: `scenarios.test.ts`, `evidence.spec.ts` |
| C107 | biết timestamp | Quality | 1 | **4** | ts ms + day mỗi sự kiện và snapshot; v66 có test khẳng định ts · test: `engine-evq.test.ts` |
| C108 | biết context | Quality | 2 | **3** | ctx mỗi sự kiện; ngữ cảnh chủ yếu là chiều bài tập |
| C109 | Critical evidence được bảo toàn | Critical | 0 | **4** | Tier 2–3 và bằng chứng snapshot tham chiếu được giữ khi dọn sổ; có test · test: `engine-snapshot.test.ts`, `engine-evidence.test.ts` |
| C110 | Decision có thể audit | Critical | 1 | **4** | Snapshot + replay() tái tạo quyết định; màn Vì sao?; có test · test: `scenarios.test.ts`, `engine-snapshot.test.ts`, `why.spec.ts` |

### 12. Inference & Learner Model: 38/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C111 | Evidence không trực tiếp thành mastery | Critical | 3 | **4** | Đạt cần m ≥ 0,8, LB ≥ 0,6, không ro/vf; Claim (inferred) tách Mastery; có test · test: `engine-mastery.test.ts`, `engine-mastery3.test.ts` |
| C112 | Inference có probability | Core | 4 | **4** | m = α/(α+β); có test · test: `engine-mastery.test.ts` |
| C113 | Inference có confidence | Critical | 4 | **4** | Thấp/Vừa/Cao, mở lại thì thấp; có test · test: `engine-mastery.test.ts`, `scenarios.test.ts` |
| C114 | Inference có uncertainty | Critical | 3 | **4** | v55: cận dưới là phân vị 10% Beta chính xác, sd; có test · test: `engine-mastery3.test.ts` |
| C115 | Misconception detection | Core | 0 | **4** | st.mis: cùng câu sai ≥ 2 lần thành giả thuyết, đúng làm yếu dần; có test · test: `engine-mastery3.test.ts`, `scenarios.test.ts` |
| C116 | Xét lịch sử | Core | 3 | **4** | Cộng dồn + giảm bằng chứng cũ ngược chiều; một lỗi không mất Đạt; có test · test: `scenarios.test.ts`, `engine-mastery3.test.ts` |
| C117 | Xét context | Core | 2 | **3** | Ngữ cảnh vào confidence, gap context, novelty; chưa vào Beta |
| C118 | Xét difficulty | Quality | 2 | **3** | v66: Beta hiệu chỉnh theo diff (diffW 0,2) khi tính ô; chỉ câu thi mang diff nên câu học nền vẫn như nhau · test: `engine-evq.test.ts` |
| C119 | Thay đổi khi có evidence mới | Critical | 3 | **4** | Thay đổi theo bằng chứng mới, decay giúp hồi phục; có test · test: `engine-mastery3.test.ts`, `scenarios.test.ts` |
| C120 | Quay lại diagnostic | Critical | 0 | **4** | Mâu thuẫn → mở lại (ro) → probe verify; Claim sai bị sửa; có test · test: `engine-mastery3.test.ts`, `scenarios.test.ts`, `why.spec.ts` |

### 13. Mastery Engine: 37/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C121 | Có mastery dimensions | Core | 4 | **4** | 5 mức; có test · test: `engine-mastery.test.ts` |
| C122 | Có Beta state | Critical | 4 | **4** | Beta(α, β) dẫn xuất từ L2; có test · test: `engine-evidence.test.ts` |
| C123 | Correct update đúng rule | Critical | 4 | **4** | α += w·(1−g) đúng công thức §44 (khi tắt decay); có test · test: `engine-mastery.test.ts`, `engine-evidence.test.ts` |
| C124 | Incorrect update đúng rule | Core | 4 | **4** | β += w·(1−s); có test · test: `engine-mastery.test.ts`, `engine-evidence.test.ts` |
| C125 | Guessing parameter | Core | 4 | **4** | g = 1/số phương án; có test · test: `engine-mastery.test.ts` |
| C126 | Slip parameter | Core | 3 | **3** | RULE.slip 0,1, đổi luật tính lại được; chưa theo task |
| C127 | Repetition weight | Core | 4 | **4** | Lặp 24h ×0,5; có test · test: `engine-mastery.test.ts` |
| C128 | Threshold configurable | Quality | 2 | **2** | PASS_M/PASS_LB hằng số chung; snapshot ghi ngưỡng; chưa theo competency |
| C129 | Confidence threshold | Critical | 4 | **4** | LB ≥ 0,6 (phân vị chính xác); có test · test: `engine-mastery.test.ts`, `engine-mastery3.test.ts` |
| C130 | Mastery giảm / reopen | Critical | 2 | **4** | v55: trạng thái reopened/verify, mở lại khi mâu thuẫn, xác nhận lại khi đúng câu mới; có test · test: `engine-mastery3.test.ts`, `engine-nba.test.ts` |

### 14. Diagnostic Engine: 39/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C131 | Continuous diagnosis | Critical | 1 | **4** | v58 probe.ts: mỗi lần tính lộ trình chọn câu dò có EIG/nỗ lực, ngân sách ngày; có test · test: `engine-probe.test.ts`, `engine-probe.test.ts`, `probe.spec.ts` |
| C132 | Exploration mode | Core | 3 | **4** | Chế độ explore + cầu thang chẩn đoán; có test · test: `engine-probe.test.ts` |
| C133 | Confirmation mode | Core | 2 | **4** | Chế độ confirm cho Claim từ chẩn đoán; có test · test: `engine-probe.test.ts` |
| C134 | Root Cause mode | Core | 1 | **4** | Chế độ root dò tiền đề cứng của nút sai lặp lại; có test · test: `engine-probe.test.ts`, `engine-probe.test.ts` |
| C135 | Boundary detection | Core | 2 | **4** | Chế độ boundary khi m sát 0,8; có test · test: `engine-probe.test.ts` |
| C136 | Verification mode | Core | 2 | **4** | candidates() dò nút reopened/verify ở chế độ verify; v66 có test riêng · test: `engine-evq.test.ts` |
| C137 | Dùng uncertainty | Core | 1 | **4** | eig() theo P(đổi kết luận) + giảm sd; có test · test: `engine-probe.test.ts` |
| C138 | Dùng information value | Quality | 2 | **4** | Giá trị thông tin vào điểm câu dò và NBA (p.info); có test · test: `engine-probe.test.ts`, `engine-nba.test.ts` |
| C139 | Stopping rule | Critical | 4 | **4** | Dừng khi giá trị < ngưỡng hoặc hết ngân sách; có test · test: `engine-probe.test.ts`, `engine-diag.test.ts` |
| C140 | Tính learner effort | Quality | 2 | **3** | Điểm = EIG ÷ nỗ lực, nhưng nỗ lực là hằng số 1,5 phút |

### 15. Gap & Root Cause: 40/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C141 | Gap so với target | Critical | 4 | **4** | plan().unmet; có test · test: `engine-path.test.ts` |
| C142 | Knowledge gap | Core | 2 | **4** | v65: knowledge → remedy teach (mức 1, chọn), qItem của Quest chọn câu theo remedy (pickFor); có test · test: `engine-remedy.test.ts`, `engine-remedy.test.ts` |
| C143 | Recall gap | Core | 2 | **4** | v65: recall → remedy tự gõ mức 3, Quest chọn câu gõ chưa gặp; có test · test: `engine-remedy.test.ts`, `engine-remedy.test.ts` |
| C144 | Skill gap | Core | 2 | **4** | v65: skill → remedy produce (mức ≥ 4, gõ) trong qItem; có test · test: `engine-remedy.test.ts` |
| C145 | Automaticity gap | Core | 0 | **4** | v65: automaticity so với tốc độ chính người học (gap.ts), remedy speed; có test người vốn chậm không bị gắn nhãn · test: `engine-remedy.test.ts`, `engine-remedy.test.ts` |
| C146 | Context gap | Core | 0 | **4** | v65: weakContext() chỉ ngữ cảnh yếu nhất, remedy context luyện đúng ngữ cảnh đó; có test · test: `engine-remedy.test.ts`, `engine-remedy.test.ts` |
| C147 | Transfer gap | Core | 0 | **4** | v65: transfer → remedy câu mới (xferItems) trong qItem, ưu tiên sau phần nền; có test · test: `engine-remedy.test.ts` |
| C148 | Retention gap | Core | 2 | **4** | v65: retention → remedy ôn (gõ, mức ≤ 3); rương dùng retention; có test · test: `engine-remedy.test.ts`, `engine-nba.test.ts` |
| C149 | Prerequisite gap | Critical | 3 | **4** | v65: prerequisite → remedy root, qItem đổi sang nút gốc (hyp.cause hoặc tiền đề cứng); có test · test: `engine-remedy.test.ts`, `engine-path.test.ts` |
| C150 | Root cause được kiểm chứng | Critical | 0 | **4** | Câu dò tiền đề trượt → hyp đã kiểm chứng → lộ trình boost tiền đề (trên mô phỏng); có test · test: `engine-probe.test.ts`, `engine-probe.test.ts` |

### 16. Learning Path & NBA: 37/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C151 | Path dựa learner state | Critical | 4 | **4** | plan() theo isPass; có test · test: `engine-path.test.ts` |
| C152 | Path dựa graph | Critical | 4 | **4** | Theo đồ thị, alt/need; có test · test: `engine-path.test.ts`, `engine-path.test.ts` |
| C153 | Path bỏ qua đã đạt | Core | 4 | **4** | Nút đã Đạt ra khỏi lộ trình; mô phỏng bỏ qua thứ đã biết; có test · test: `engine-path.test.ts`, `scenarios.test.ts` |
| C154 | Path xem retention | Core | 2 | **4** | Ôn thắng học mới khi nhiều mục sắp quên; §58 đưa nút về lộ trình; có test · test: `engine-nba.test.ts`, `engine-nba.test.ts` |
| C155 | Path xem transfer | Core | 0 | **3** | NBA có ứng viên transfer (tối đa 1); plan() tự nó không xét transfer · test: `engine-transfer.test.ts` |
| C156 | Nhiều route | Quality | 1 | **3** | v67: 38 nhóm tiền đề thay thế thật cho Can-Do vốn từ (cần ≥ 80% unit), plan() dùng blockedBy; ngữ pháp vẫn một route · test: `engine-content.test.ts` |
| C157 | NBA có candidate actions | Core | 2 | **4** | Ứng viên learn, review, probe, verify, transfer (nba.ts); có test · test: `engine-nba.test.ts`, `engine-nba.test.ts` |
| C158 | NBA tính learning value | Core | 2 | **4** | p.learn theo dep, utility phân rã, snapshot NBA; có test · test: `engine-nba.test.ts`, `why.spec.ts` |
| C159 | NBA tính information value | Quality | 0 | **4** | p.info từ EIG câu dò; có test · test: `engine-nba.test.ts` |
| C160 | NBA tính effort/interruption | Quality | 2 | **3** | Trừ nỗ lực theo phút, có test; v65 Quest gọi computeNba(..., true) nên ngắt mạch được trừ; hệ số ngắt chưa có test riêng · test: `engine-nba.test.ts` |

### 17. Micro Learning: 38/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C161 | Micro-learning trigger khi cần | Critical | 1 | **4** | v61 microDecide(): log/probe/offer/now sau câu sai; app gọi ELCORE.micro; có test · test: `engine-micro.test.ts`, `micro.spec.ts` |
| C162 | Giải quyết root cause | Core | 0 | **4** | Đích bí kíp là tiền đề đã kiểm chứng hoặc cách hiểu sai cụ thể; có test · test: `engine-micro.test.ts`, `engine-micro.test.ts` |
| C163 | Minimum sufficient scope | Quality | 1 | **3** | Một thẻ 60 giây: khái niệm, tương phản, 2 ví dụ, 3 câu; chưa đo "tối thiểu đủ" · test: `micro.spec.ts` |
| C164 | Có practice | Core | 2 | **4** | 3 câu luyện sau bí kíp, ghi bằng chứng có trợ giúp; có test · test: `micro.spec.ts`, `engine-micro.test.ts` |
| C165 | Có verification | Core | 1 | **4** | microVerdict + snapshot m trước/sau; có test · test: `engine-micro.test.ts`, `micro.spec.ts` |
| C166 | Quay lại gameplay | Core | 1 | **4** | Quay lại đúng bài đang làm; trong game hoãn tới cuối lượt; có test · test: `micro.spec.ts`, `engine-micro.test.ts` |
| C167 | Lỗi nhỏ không interrupt | Core | 3 | **4** | Lỗi lẻ chỉ ghi nhận; có test · test: `engine-micro.test.ts` |
| C168 | Lỗi lặp có thể interrupt | Core | 0 | **4** | Sai ≥ 2 trong 6 lượt hoặc hiểu sai lặp → mời bí kíp; có test · test: `engine-micro.test.ts`, `engine-micro.test.ts` |
| C169 | Prerequisite gap trigger nhanh | Core | 0 | **4** | Thiếu tiền đề đã kiểm chứng → học phần nền ngay (act now); có test · test: `engine-micro.test.ts` |
| C170 | Không thành full course ẩn | Quality | 2 | **3** | Tối đa 1 bí kíp/nút/ngày, thẻ ngắn; có test chống làm phiền · test: `engine-micro.test.ts` |

### 18. Retention & Transfer: 36/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C171 | Mastery tách retention | Critical | 4 | **4** | Beta và FSRS tách; có test · test: `fsrs-stats.test.ts`, `scenarios.test.ts` |
| C172 | FSRS phù hợp | Core | 4 | **4** | FSRS-5; có test · test: `fsrs-stats.test.ts` |
| C173 | Review theo learner state | Core | 3 | **3** | Theo từng item |
| C174 | Quên → quay lại path | Critical | 2 | **4** | §58: đang Đạt sai 2 lần liên tiếp → mở lại, về lộ trình; có test · test: `engine-nba.test.ts` |
| C175 | Transfer được đo | Critical | 0 | **4** | v60 transfer.ts: thử nút Đạt ở câu mới, đếm thành công/thất bại; có test · test: `engine-transfer.test.ts`, `engine-transfer.test.ts`, `transfer.spec.ts` |
| C176 | Transfer context mới | Core | 0 | **3** | Câu transfer lấy từ nội dung khác (bài đọc unit, câu ngữ pháp chưa gặp), ctx transfer; ngữ cảnh mới chưa được mô hình hoá · test: `engine-transfer.test.ts` |
| C177 | Transfer item mới | Core | 1 | **4** | Câu mới (seen hash) bắt buộc cho mức 4–5 và transfer; có test · test: `engine-mastery3.test.ts`, `engine-transfer.test.ts` |
| C178 | Surface variation | Quality | 1 | **2** | Ý định đổi dạng câu nêu trong transfer.ts, chưa kiểm biến thể bề mặt |
| C179 | Transfer failure giảm confidence | Core | 0 | **4** | Trượt câu mới → tier 3, 2 lần → mở lại, tin cậy thấp; có test · test: `engine-transfer.test.ts`, `scenarios.test.ts` |
| C180 | Không mastery bằng câu lặp giống hệt | Critical | 2 | **4** | Mức 4–5 cần đúng câu mới; v66 mức 1–3 cần ≥ 2 câu khác nhau, câu trùng nội dung không tính; có test · test: `engine-mastery3.test.ts`, `engine-evq.test.ts`, `engine-evq.test.ts` |

### 19. Readiness, Motivation & UX: 37/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C181 | Readiness dựa competency | Critical | 4 | **4** | Có test · test: `engine-readiness.test.ts` |
| C182 | Readiness dựa confidence | Critical | 4 | **4** | Tin cậy ≥ Vừa; có test · test: `engine-readiness.test.ts`, `engine-readiness.test.ts` |
| C183 | Readiness xem retention | Core | 3 | **3** | 14 ngày không quên |
| C184 | Readiness xem transfer | Core | 0 | **4** | v65: masteryReadiness đòi ok + exempt ≥ important (xferSummary, miễn khi hết câu mới), readyview hiện phần chờ; có test · test: `engine-remedy.test.ts` |
| C185 | Readiness xem performance | Core | 3 | **3** | Bài làm thật |
| C186 | Giải thích remaining gaps | Quality | 3 | **4** | "Chưa đạt A1 vì còn thiếu…" + danh sách; có e2e · test: `why.spec.ts` |
| C187 | XP không ảnh hưởng mastery | Critical | 4 | **4** | XP/xu không vào mastery; có test · test: `engine-quest.test.ts`, `scenarios.test.ts` |
| C188 | Streak không ảnh hưởng readiness | Core | 4 | **3** | Readiness chỉ từ trạng thái nút; có test Hạ còn 3: test chưa kiểm riêng chuỗi ngày học. · test: `engine-readiness.test.ts` |
| C189 | Reward không thay evidence | Core | 4 | **4** | Xu tỉ lệ giá trị học nhưng chỉ là telemetry; có test · test: `engine-quest.test.ts`, `engine-quest.test.ts` |
| C190 | UX không bắt tự chọn curriculum | Quality | 3 | **4** | Nút "Bước tiếp theo" theo NBA + Vì sao?; có e2e · test: `engine.spec.ts`, `why.spec.ts` |

### 20. Data, Privacy, Extensibility: 38/40

| # | Tiêu chí | Lớp | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|---|
| C191 | Local-first | Core | 4 | **4** | e2e offline · test: `offline.spec.ts` |
| C192 | Export/import giữ state | Quality | 3 | **4** | Mã/tệp sao lưu, sanitize, gộp hai máy không mất; có test · test: `data.spec.ts`, `engine-evidence.test.ts` |
| C193 | Export giữ evidence | Quality | 1 | **4** | Sao lưu chứa toàn bộ st.e; v66 e2e: mã sao lưu giữ nguyên sổ, thống kê, snapshot, khôi phục đúng mastery · test: `data.spec.ts`, `evidence.spec.ts` |
| C194 | Privacy by design | Quality | 4 | **4** | Đồng ý, kiểm tuổi, ẩn danh; nhãn A/B chỉ khi bật nghiên cứu (main.ts); có test · test: `estimate-net.test.ts` |
| C195 | Không bắt buộc account | Core | 4 | **4** | Không cần tài khoản; chạy offline · test: `offline.spec.ts` |
| C196 | Không cần runtime AI | Critical | 4 | **4** | Engine thuần hàm, không gọi AI; chạy offline · test: `offline.spec.ts` |
| C197 | Target mới không rewrite core | Critical | 3 | **4** | v67: mục tiêu khai readiness trong dữ liệu (READINESS_MODELS); test thêm mục tiêu mới chỉ bằng dữ liệu, plan và Readiness chạy không sửa core · test: `engine-content.test.ts` |
| C198 | Evidence model dùng cho target mới | Critical | 3 | **3** | Nút x:, fn:, ph: đi qua cùng ingest/Beta; test mục tiêu mới chỉ chạy plan/Readiness với mastery giả, chưa nạp bằng chứng thật |
| C199 | Automated validation suite | Core | 3 | **4** | Unit, e2e, kiểm nội dung, Lighthouse, mô phỏng learner (10 scenario, meta-test), audit đồ thị, đo held-out · test: `scenarios.test.ts`, `scenarios.test.ts`, `engine-measure.test.ts` |
| C200 | Chứng minh toàn bộ learning loop | Critical | 2 | **3** | Vòng Unknown → chẩn đoán → lộ trình → micro → verify → transfer → readiness chạy được trên mô phỏng; chưa chứng minh trên người thật · test: `scenarios.test.ts`, `engine-probe.test.ts`, `measure.spec.ts` |

## Chi tiết C201–C400

### A. Knowledge Model Validity: 7,0/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C201 | Knowledge Atomicity | 5 | **6** | Thêm nút nguyên tử mới: 26 nút âm vị ph: (một cặp âm) và 58 nút chức năng fn:; u: vẫn là cả unit từ vựng, cd: rộng · test: `engine-content.test.ts` |
| C202 | Knowledge Completeness | 6 | **8** | audit() 0 mồ côi/không học được; v67 bản đồ nội dung bảo đảm mọi nút từ vựng, ngữ pháp, âm vị có câu (content-check + test) · test: `engine-content.test.ts` |
| C203 | Knowledge Boundary | 3 | **6** | scope theo tên + v67 content-map.json định ranh giới vận hành: tập câu thuộc từng nút và mức; chưa có định nghĩa ranh giới ngữ nghĩa · test: `engine-content.test.ts` |
| C204 | Semantic Identity | 3 | **4** | scope + en + dims (Universal Core) cho mỗi nút; chưa có định nghĩa ngữ nghĩa riêng ngoài nhãn |
| C205 | Knowledge Versioning | 2 | **7** | Nút và cạnh có ver (types.ts), test bắt buộc có; mọi bản đều 1.0, chưa có lịch sử đổi phiên bản nút · test: `engine-graph.test.ts` |
| C206 | Dependency Validity | 3 | **5** | Mọi cạnh có why (cando-act, level-ladder...) và audit tiền đề ngược cấp; cạnh vẫn sinh tự động, chưa kiểm tính cần thiết bằng dữ liệu · test: `engine-graph.test.ts` |
| C207 | Alternative Route | 1 | **7** | Đồ thị thật có 681 cạnh alt trong 38 nhóm (Can-Do vốn từ mở khi Đạt ≥ 80% số unit), blockedBy có test trên đồ thị thật; chỉ áp cho vốn từ, need đặt theo luật · test: `engine-content.test.ts` |
| C208 | Overlap Detection | 1 | **6** | audit().dup bắt nút cùng loại, cùng cấp, tên gần trùng; chưa so ngữ nghĩa/nội dung · test: `engine-graph.test.ts` |
| C209 | Gap Detectability | 6 | **8** | Mọi nút có evReq, hoạt động; gap.ts phân loại lỗ hổng và remedy.ts đổi cách sửa; bản đồ nội dung bảo đảm nút nền có câu để đo · test: `engine-remedy.test.ts` |
| C210 | Masterability | 8 | **8** | Beta cho mọi nút × mức, có trạng thái nút (mastery.ts stat: unknown/inferred/learning/mastered/verify/reopened) · test: `engine-mastery3.test.ts` |
| C211 | Transferability | 1 | **7** | imp.tr và uses cho từng nút; transfer.ts chọn nút cần thử ở câu mới, có test; giá trị imp đặt theo luật · test: `engine-transfer.test.ts` |
| C212 | Retentionability | 2 | **7** | imp.re nay được dùng: ôn trong Quest xếp theo (1 − R) × imp.re; nguy cơ quên NBA từ FSRS Σ(1 − R); chưa có test riêng cho imp.re · test: `engine-nba.test.ts` |
| C213 | Difficulty Calibration | 3 | **5** | Luật m3.2 hiệu chỉnh trọng số theo độ khó câu so với cấp nút (diff −1/0/1), câu thi gửi diff; Node.diff vẫn suy theo cấp, chưa hiệu chỉnh thực nghiệm · test: `engine-evq.test.ts` |
| C214 | Context Mapping | 5 | **6** | Ngữ cảnh bằng chứng thêm function, dialogue, listen-pair; weakContext() chỉ ra ngữ cảnh yếu để luyện đúng chỗ; ctx của nút vẫn theo từ khoá · test: `engine-remedy.test.ts` |
| C215 | Misconception Mapping | 3 | **7** | Node.mis (28 điểm ngữ pháp) + phát hiện hiểu sai lúc chạy (store.ts misconceptions) dùng cho bí kíp · test: `engine-mastery3.test.ts` |
| C216 | Contrast Mapping | 2 | **7** | Node.contrast cho 73 nút, đối xứng, có test; hiện trong Vì sao và bí kíp; chưa dùng để chọn câu dò · test: `engine-graph.test.ts` |
| C217 | Knowledge Reuse | 9 | **9** | Một đồ thị cho mọi mục tiêu; đổi mục tiêu dùng lại năng lực đã có (S8/MT12); mục tiêu ngoài CEFR giữ trạng thái future · test: `scenarios.test.ts`, `engine-graph.test.ts` |
| C218 | Coverage Audit | 8 | **9** | coverage.md tự sinh + audit() (mồ côi, không học được, ngược cấp, trùng, cân bằng) chạy trong test · test: `engine-graph.test.ts` |
| C219 | Orphan Detection | 2 | **9** | audit().orphan và unreachable có test với đồ thị giả và đồ thị thật (0 lỗi) · test: `engine-graph.test.ts` |
| C220 | Model Integrity | 8 | **9** | validate(): trùng id, cạnh lạc, tự trỏ, vòng lặp, w ngoài (0,1], mục tiêu sai; chạy cả trên đồ thị thật · test: `engine-graph.test.ts`, `engine-graph.test.ts` |

### B. CEFR Content & Level Validity: 6,5/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C221 | Level Coverage | 7 | **8** | A1–C2 mỗi cấp 47–50 Can-Do + mục tiêu Pre-A1 riêng (v52) với bài pa: là tiền đề cứng của A1 · test: `engine-graph.test.ts` |
| C222 | Progression Validity | 6 | **7** | Đóng tiền đề tăng theo cấp, có test; audit chặn tiền đề ngược cấp · test: `engine-graph.test.ts` |
| C223 | Cross-Level Dependency | 4 | **8** | audit().inverse phát hiện tiền đề cứng ở cấp cao hơn nút cần nó; đồ thị thật 0 lỗi · test: `engine-graph.test.ts` |
| C224 | Descriptor Traceability | 4 | **4** | Can-Do có câu en, chưa gắn id descriptor CEFR Companion Volume |
| C225 | Boundary Testing | 1 | **3** | Chưa kiểm ranh giới giữa hai cấp CEFR; probe.ts chỉ có chế độ boundary quanh ngưỡng mastery 0,8 |
| C226 | Misclassification Detection | 3 | **6** | Claim từ chẩn đoán được xác nhận (probe confirm) và bị bằng chứng mới phủ định (S10/MT11, disagreement reopen) · test: `scenarios.test.ts` |
| C227 | Uneven Profile | 7 | **8** | Cấp riêng từng kỹ năng, từng nút; chẩn đoán cho hai cấp khác nhau khi hồ sơ lệch · test: `scenarios.test.ts` |
| C228 | Level-Specific Evidence | 5 | **7** | evReq theo nút; m3.2 bắt mức 1–3 cần đúng ở ≥ 2 câu khác nhau, mức 4–5 cần câu mới; loại bằng chứng vẫn chưa bắt buộc · test: `engine-evq.test.ts` |
| C229 | Level-Specific Transfer | 1 | **4** | transfer.ts có nhưng không phân theo cấp CEFR; ngưỡng transfer như nhau mọi cấp |
| C230 | Level-Specific Performance | 6 | **6** | Ngưỡng VSTEP/IELTS, perfEst theo cấp như v51; MVP chỉ CEFR |
| C231 | Vocabulary Coverage | 8 | **8** | 9.345 từ gắn cấp, 515 nút từ vựng |
| C232 | Grammar Coverage | 7 | **7** | 154 điểm ngữ pháp, có lỗi hay gặp cho 28 điểm |
| C233 | Functional Coverage | 6 | **8** | 58 nút chức năng giao tiếp fn: có hoạt động, bằng chứng từ quiz chức năng và hội thoại; mục tiêu A1 đòi fn:; chưa đối chiếu danh mục chức năng CEFR · test: `engine-content.test.ts` |
| C234 | Interaction Coverage | 5 | **7** | Nút fn: gắn dims inter, có bằng chứng từ quiz hội thoại (ctx dialogue); chưa chấm tương tác thật, chưa có nhiệm vụ tương tác trực tiếp · test: `engine-content.test.ts` |
| C235 | Pragmatic Coverage | 3 | **6** | Nút fn: gắn dims prag (58 nút) và đo bằng quiz chức năng; chưa có nút ngữ dụng riêng (lịch sự, sắc thái), chưa có test riêng ngữ dụng |
| C236 | Discourse Coverage | 4 | **4** | 72 nút gắn dims disc; vẫn chủ yếu qua đọc/viết dài |
| C237 | Reception Coverage | 8 | **8** | Nghe/Đọc phong phú |
| C238 | Production Coverage | 6 | **6** | Viết/Nói có, chấm bằng luật + tự chấm |
| C239 | Balance Audit | 3 | **6** | audit().balance đếm 8 năng lực Universal Core theo bao đóng mỗi mục tiêu mở; chưa có ngưỡng cảnh báo mất cân bằng |
| C240 | CEFR Model Versioning | 8 | **8** | Goal 1.0, lưu phiên bản lúc chọn |

### C. Evidence Validity: 5,9/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C241 | Independence | 3 | **5** | Giảm ×0,5 cùng câu trong 24h; m3.2 đòi ≥ 2 câu khác nhau ở mức 1–3, câu trùng đề không tính mới; chưa mô hình phụ thuộc giữa bằng chứng · test: `engine-evq.test.ts` |
| C242 | Redundancy Detection | 3 | **6** | Phát hiện câu trùng đề dưới id khác (chuẩn hoá chữ hoa, dấu, khoảng trắng) không tính là câu mới; chưa bắt câu gần trùng về nghĩa · test: `engine-evq.test.ts` |
| C243 | Correlation | 1 | **1** | Không có mô hình tương quan giữa bằng chứng |
| C244 | Diversity | 6 | **8** | L2 giữ khoá ngữ cảnh, dạng câu, mới/cũ, độ khó; m3.2 đòi đa dạng ≥ 2 câu ở mức 1–3; ngữ cảnh mới function/dialogue/listen-pair · test: `engine-evq.test.ts` |
| C245 | Novelty | 1 | **8** | Cờ nov và novOk theo ô; mức 4–5 cần đúng ở câu mới; transfer chỉ dùng câu chưa gặp · test: `engine-mastery3.test.ts` |
| C246 | Difficulty Adjustment | 4 | **5** | m3.2: diffW 0,2 theo độ khó câu so với cấp nút vào Beta, khoá diff trong L2; câu thi gửi diff; câu từ vựng/ngữ pháp app chưa gắn diff · test: `engine-evq.test.ts` |
| C247 | Assistance Detection | 4 | **7** | evaluate(): hint ×0,5, cờ asst, rel giảm; câu kiểm sau bí kíp tính như có trợ giúp; app từ vựng chưa có gợi ý gắn cờ · test: `engine-evidence.test.ts`, `engine-micro.test.ts` |
| C248 | Retry Detection | 5 | **8** | retry ×0,3 trong evaluate(), app từ vựng truyền retry; ngữ pháp bỏ lượt làm lại · test: `engine-evidence.test.ts` |
| C249 | Guessing Detection | 8 | **8** | g = 1/số phương án; tự nhận đoán ×0,5 · test: `engine-mastery.test.ts` |
| C250 | Speed Interpretation | 6 | **8** | rt được ghi vào sự kiện, không vào trọng số (P15); chỉ dùng cho gap automaticity · test: `engine-evidence.test.ts` |
| C251 | Context Validity | 3 | **5** | Thêm ngữ cảnh thật function, dialogue, listen-pair cùng transfer/probe/measure/quest; luyện tập vẫn dùng chiều bài tập (rec/rcl) |
| C252 | Task Validity | 5 | **5** | Ánh xạ dạng câu → mức có lý do như v51 |
| C253 | Construct Validity | 5 | **5** | Kiểm nội dung + soát độc lập như v51 |
| C254 | Contamination | 4 | **7** | Hết giờ khi bị ép ×0,3; Quest không tính giờ; trên mô phỏng chênh mastery do kỹ năng game 0,05 so với 0,12 · test: `scenarios.test.ts` |
| C255 | Reliability | 5 | **5** | Mỗi sự kiện có rel 0–1 theo luật; thống kê rpb câu như v51; chưa đo độ tin cậy thực nghiệm |
| C256 | Confidence Calibration | 1 | **3** | Chỉ có ECE 0,14 trên mô phỏng (sim-report §3); chưa có dữ liệu người thật, chưa có test |
| C257 | Drift Detection | 1 | **5** | audit.ts drift(): ô Đạt mà 14 ngày gần đây đúng thấp rõ so với m (z < −2,5) → báo, ghi snapshot, hiện trong Cài đặt; chỉ báo cáo, chưa tự xử lý · test: `engine-evq.test.ts` |
| C258 | Source Comparison | 3 | **3** | Sự kiện ghi src nhưng chưa so sánh độ khớp giữa các nguồn |
| C259 | Conflict Resolution | 4 | **7** | Bằng chứng ngược kết luận làm cũ nhẹ đi (decay 0,9); disagreement mở lại nút; Claim cộng dồn với bằng chứng thật · test: `engine-mastery3.test.ts`, `engine-evidence.test.ts` |
| C260 | Evidence Sufficiency | 8 | **9** | Đạt cần m ≥ 0,8 và phân vị 10% chính xác ≥ 0,6; câu dò dừng khi giá trị thông tin thấp · test: `engine-mastery.test.ts`, `engine-probe.test.ts` |

### D. Statistical & Mastery Validation: 6,6/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C261 | Mastery Calibration | 1 | **3** | Calibration chỉ đo trên mô phỏng: ECE 0,14, m dè dặt ở vùng 0,4–0,85; chưa có dữ liệu thật, chưa test |
| C262 | Confidence Calibration | 1 | **2** | Confidence chưa hiệu chỉnh; chỉ có số liệu mô phỏng, chưa có dữ liệu |
| C263 | Beta Parameter Validation | 8 | **9** | Công thức Beta và phân vị chính xác (betaQuantile) có test giá trị đã biết · test: `engine-mastery.test.ts`, `engine-mastery3.test.ts` |
| C264 | Guessing Parameter | 2 | **5** | estimate() ước lượng guess từ sổ (câu trắc nghiệm ở ô gần như chưa biết) so với 1/số phương án; chỉ báo cáo, luật vẫn dùng g lý thuyết; test chỉ kiểm slip · test: `engine-evq.test.ts` |
| C265 | Slip Parameter | 2 | **6** | slip 0,1 trong luật; estimate() ước lượng slip từ ô Đạt chắc (≥ 30 lượt), hiện trong Cài đặt và dữ liệu nghiên cứu; chưa tự cập nhật luật · test: `engine-evq.test.ts` |
| C266 | Repetition Weight | 4 | **5** | Trọng số lặp 0,5 có test cơ học; sim-report §7: repeat 0,3–0,7 không đổi FP/FN trên mô phỏng; chưa kiểm người thật · test: `engine-mastery.test.ts` |
| C267 | Monotonicity | 7 | **9** | Trả lời đúng không bao giờ làm mastery giảm (decay chỉ khi ngược chiều) · test: `engine-mastery3.test.ts` |
| C268 | Contradictory Evidence | 6 | **8** | Sai làm β tăng, decay bằng chứng cũ, đủ sai ở câu mới thì mở lại · test: `engine-mastery3.test.ts`, `scenarios.test.ts` |
| C269 | Small-Sample Protection | 8 | **9** | 2 câu đúng chưa Đạt; phân vị chính xác chặt hơn ở n nhỏ · test: `engine-mastery.test.ts` |
| C270 | Large-Sample Stability | 6 | **8** | Decay theo lượt ngược chiều tránh khóa cứng khi n lớn; 100.000 lượt ô vẫn khớp · test: `engine-mastery3.test.ts`, `scenarios.test.ts` |
| C271 | Boundary Sensitivity | 5 | **6** | Test 12/13; câu dò chế độ boundary quanh ngưỡng; chưa phân tích độ nhạy quanh ranh giới · test: `engine-mastery.test.ts` |
| C272 | Threshold Sensitivity | 3 | **8** | Trên mô phỏng: bảng FP/FN theo ngưỡng 0,70–0,90 (sim-report §2), test kiểm FN đổi đúng chiều · test: `scenarios.test.ts` |
| C273 | Confidence Interval Validity | 5 | **9** | Cận dưới là phân vị 10% chính xác của Beta, không còn xấp xỉ chuẩn · test: `engine-mastery3.test.ts` |
| C274 | Weight Sensitivity | 2 | **5** | sim-report §7: đổi slip, repeat, decay từng cái trên 300 learner giả, FP giữ 0%, FN 13–25%; chỉ mô phỏng, chưa có test tự động |
| C275 | Recovery | 5 | **9** | Hồi phục: giảm bằng chứng cũ ngược chiều giúp Đạt lại sau ≤ 50 lượt đúng · test: `engine-mastery3.test.ts` |
| C276 | Decay | 5 | **6** | Không phân rã theo thời gian; quên đi qua FSRS (gap retention) và decay khi sai; chưa có decay Beta theo ngày · test: `scenarios.test.ts` |
| C277 | Transfer Test | 1 | **8** | transfer.ts: thử nút đã Đạt ở câu mới; sai thành tier 3, sai 2 lần mở lại · test: `engine-transfer.test.ts`, `scenarios.test.ts` |
| C278 | Cross-Context | 6 | **6** | Số ngữ cảnh vào confidence; gap context khi một ngữ cảnh đúng < 50% |
| C279 | False-Positive Rate | 1 | **6** | Trên mô phỏng: dương tính giả 0,0% trên 265 lần Đạt, có test fp ≤ 2%; chưa có dữ liệu thật · test: `scenarios.test.ts` |
| C280 | False-Negative Rate | 1 | **5** | Trên mô phỏng: âm tính giả 22,9% (cao, dè dặt); chưa có dữ liệu thật |

### E. Diagnostic Science: 6,2/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C281 | Diagnostic Accuracy | 3 | **5** | Trên mô phỏng: sai số trung bình 0,59 cấp, 13 nút dò; test hội tụ trên dữ liệu giả; chưa đo người thật · test: `engine-diag.test.ts` |
| C282 | Efficiency | 7 | **8** | Bài dò ngắn tối đa 8 phần cho người mới (QUICK_PROBES), đầy đủ 16; ngân sách dò liên tục 6 lượt/ngày · test: `engine-goalfirst.test.ts` |
| C283 | Information Gain | 6 | **8** | probe.ts eig(): xác suất đổi kết luận + giảm sd; IRT theo information · test: `engine-probe.test.ts` |
| C284 | Information Gain / Effort | 3 | **6** | score = (eig + thưởng chế độ) / nỗ lực; nỗ lực là hằng số 1,5 phút cho mọi câu dò |
| C285 | Hypothesis Tracking | 2 | **6** | Theo dõi giả thuyết: Claim (inferred), hyp tiền đề, mis hiểu sai, trạng thái nút · test: `engine-probe.test.ts` |
| C286 | Hypothesis Updating | 4 | **6** | hyp đặt/xoá theo kết quả dò (rootVerdict); mis yếu dần khi đúng; chưa có phân phối xác suất trên giả thuyết · test: `engine-micro.test.ts` |
| C287 | Stopping | 7 | **8** | Dừng khi giá trị thông tin < 0,15 hoặc hết ngân sách ngày; chẩn đoán đầu theo đổi chiều/hết giờ · test: `engine-probe.test.ts` |
| C288 | Continuation | 3 | **8** | Chẩn đoán liên tục: explore/confirm/boundary/verify/root mỗi lần tính lộ trình · test: `engine-probe.test.ts` |
| C289 | Probe Selection | 6 | **8** | Chọn câu dò theo chế độ ưu tiên và giá trị/nỗ lực · test: `engine-probe.test.ts` |
| C290 | Root Cause Efficiency | 4 | **7** | Truy gốc theo cạnh tiền đề cứng khi nút sai ≥ 3 lần; kiểm chứng trên learner mô phỏng · test: `engine-probe.test.ts` |
| C291 | Prerequisite Diagnosis | 4 | **8** | Dò tiền đề cứng; trượt thành giả thuyết thiếu tiền đề, lộ trình đưa tiền đề lên trước · test: `engine-probe.test.ts` |
| C292 | Misconception Diagnosis | 2 | **7** | Cùng câu trả lời sai ≥ 2 lần thành giả thuyết hiểu sai; bí kíp nhắm đúng cách hiểu sai · test: `scenarios.test.ts`, `engine-micro.test.ts` |
| C293 | Guessing Diagnosis | 4 | **5** | Tự nhận đoán, g, c của 3PL; estimate() so tỉ lệ đúng trắc nghiệm ở ô chưa biết với 1/số phương án; chưa chẩn đoán đoán mò theo mẫu từng người |
| C294 | Careless Error | 2 | **5** | Một lỗi lẻ chỉ ghi nhận; sai lúc mệt nhẹ hơn 30%; slip ước lượng từ sổ nhưng luật vẫn cố định · test: `scenarios.test.ts` |
| C295 | Fatigue Signal | 1 | **5** | fatigue(): trong phiên đúng giảm rõ và chậm dần → sai nhẹ hơn ×0,7, rel thấp, micro đề nghị nghỉ (rest); ngưỡng đặt tay, chưa kiểm người thật · test: `engine-evq.test.ts` |
| C296 | Interaction Effect | 1 | **1** | Không có hiệu ứng tương tác |
| C297 | Bias Detection | 1 | **1** | Không có phát hiện thiên lệch trong chẩn đoán |
| C298 | Repeatability | 5 | **6** | Tất định theo câu trả lời; mô phỏng có hạt giống tái tạo được |
| C299 | Recovery | 6 | **7** | Bằng chứng thật đè/cộng dồn tiên nghiệm; Claim sai bị sửa; làm lại chẩn đoán được · test: `scenarios.test.ts` |
| C300 | Auditability | 3 | **8** | Snapshot diag cho chẩn đoán, câu dò (chế độ, eig, kết quả), transfer, bí kíp, kèm id bằng chứng · test: `engine-snapshot.test.ts`, `probe.spec.ts` |

### F. Next Best Action Validation: 8,2/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C301 | Candidate Generation | 6 | **8** | Ứng viên learn/review/probe/verify/transfer (nba.ts rank) · test: `engine-nba.test.ts` |
| C302 | Feasibility | 7 | **9** | Chỉ nút đủ tiền đề cứng; nhóm thay thế có thật trên đồ thị (38 nhóm), blockedBy có test trên dữ liệu thật; nút không có câu bị lọc · test: `engine-content.test.ts` |
| C303 | Goal Relevance | 9 | **9** | Chỉ nút trong bao đóng mục tiêu · test: `engine-graph.test.ts`, `engine-path.test.ts` |
| C304 | Prerequisite Relevance | 8 | **8** | dep có trọng số cạnh, thành phần prereq trong utility |
| C305 | Learning Value | 5 | **7** | Thành phần learn tường minh theo dep; chưa ước lượng mức tăng mastery kỳ vọng · test: `engine-nba.test.ts` |
| C306 | Information Value | 2 | **8** | Thành phần info từ eig câu dò · test: `engine-nba.test.ts` |
| C307 | Retention Value | 5 | **7** | Nguy cơ quên NBA = 1 − e^(−lost/2), lost = Σ(1 − R) FSRS trên thẻ đến hạn (today.ts, app dayInfo); không còn heuristic; chưa có test cho lost · test: `engine-nba.test.ts` |
| C308 | Transfer Value | 1 | **7** | Thành phần transfer theo imp.tr; chỉ một ứng viên transfer · test: `engine-transfer.test.ts` |
| C309 | Effort Cost | 7 | **8** | effort = phút ÷ 20 bị trừ · test: `engine-nba.test.ts` |
| C310 | Interruption Cost | 1 | **7** | Quest gọi computeNba(..., inGame = true) nên hành động ngắt mạch bị trừ; micro hoãn tới cuối lượt; chưa có test NBA với inGame · test: `engine-micro.test.ts` |
| C311 | Expected Utility | 5 | **8** | U có phân rã đủ 8 thành phần §57, có phiên bản nba-3; trọng số đặt tay · test: `engine-nba.test.ts` |
| C312 | Tie-Breaking | 8 | **9** | Hoà điểm theo loại rồi id, tất định · test: `engine-nba.test.ts` |
| C313 | Skip Capability | 8 | **9** | Kiểm tra để bỏ qua ×4, tiên nghiệm chẩn đoán; learner biết nhiều tốn ít công sức hơn · test: `engine-path.test.ts`, `scenarios.test.ts` |
| C314 | Advance Capability | 7 | **8** | Đạt thì ra khỏi lộ trình; Claim được xác nhận nhanh · test: `engine-path.test.ts` |
| C315 | Review Priority | 6 | **8** | Ôn thắng học mới khi nhiều mục sắp quên · test: `engine-nba.test.ts` |
| C316 | Diagnostic Priority | 4 | **8** | Câu dò cạnh tranh trong NBA; truy gốc thắng khi kẹt · test: `engine-nba.test.ts` |
| C317 | Intervention Priority | 2 | **8** | Lỗ hổng quyết định cách sửa theo thứ tự: nền, transfer, kiến thức, nhớ, dùng, ngữ cảnh, ôn, tốc độ (remedy.ts); Quest dùng; micro: nền ngay, bí kíp, nghỉ · test: `engine-remedy.test.ts` |
| C318 | NBA Stability | 6 | **9** | Trễ 10% giữ lựa chọn trước · test: `engine-nba.test.ts` |
| C319 | NBA Responsiveness | 8 | **9** | Tính lại sau mỗi câu; chênh lớn thì đổi lựa chọn · test: `engine-nba.test.ts` |
| C320 | NBA Explainability | 6 | **9** | Snapshot NBA lưu top ứng viên, phân rã lợi ích; Vì sao? giải thích; replay được · test: `engine-snapshot.test.ts`, `why.spec.ts` |

### G. Learning Effectiveness: 3,1/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C321 | Pre/Post Gain | 2 | **3** | Chỉ có công cụ đo, chưa có dữ liệu: measure.ts bộ 12 câu giữ riêng, đo trước/sau · test: `engine-measure.test.ts` |
| C322 | Delayed Gain | 1 | **3** | Chỉ có công cụ đo, chưa có dữ liệu: đo lại 7 và 30 ngày sau lần sau · test: `engine-measure.test.ts` |
| C323 | Transfer Gain | 0 | **2** | Chỉ có công cụ: trạng thái transfer theo nút; chưa đo mức tăng transfer, chưa có dữ liệu |
| C324 | Retention Gain | 2 | **3** | Chỉ có công cụ đo, chưa có dữ liệu: keep7/keep30 trong report() · test: `engine-measure.test.ts` |
| C325 | Adaptive vs Fixed | 0 | **4** | Trên mô phỏng: thích ứng tốn 67–99% số lượt của giáo trình cố định; nhãn A/B chỉ khi đồng ý, chưa có dữ liệu thật · test: `scenarios.test.ts` |
| C326 | Game vs Non-Game | 0 | **2** | Chỉ có nhãn A/B game/plain khi đồng ý, chưa có dữ liệu · test: `engine-measure.test.ts` |
| C327 | Effort-Normalized Gain | 2 | **3** | perHour = mức tăng / giờ học; giờ học ước tính 12 giây mỗi câu (main.ts studyMins), chưa có dữ liệu |
| C328 | Time-Normalized Gain | 2 | **3** | Như C327: chỉ có công cụ, thời gian là ước tính, chưa có dữ liệu |
| C329 | Evidence-Normalized Gain | 0 | **2** | Mô phỏng so số lượt bằng chứng giữa hai lộ trình; chưa có chỉ số mức tăng theo bằng chứng |
| C330 | Intervention Effectiveness | 0 | **3** | Snapshot bí kíp ghi m trước/sau và kết quả kiểm; chỉ có công cụ đo, chưa có dữ liệu · test: `micro.spec.ts` |
| C331 | Intervention Precision | 1 | **2** | Chính sách log/probe/offer/now có test; chưa đo độ chính xác can thiệp |
| C332 | Intervention Recall | 1 | **2** | Chưa đo độ phủ can thiệp, chưa có dữ liệu |
| C333 | Path Efficiency | 2 | **4** | Trên mô phỏng: lộ trình thích ứng hiệu quả hơn cố định (sim-report §5); chưa đo người thật · test: `scenarios.test.ts` |
| C334 | Relearning Efficiency | 5 | **5** | Kiểm tra bỏ qua, tiên nghiệm, Claim cộng dồn; mô phỏng cho thấy bỏ qua được phần đã biết |
| C335 | Bottleneck Resolution | 4 | **5** | Truy gốc đưa tiền đề lên trước; kiểm chứng trên mô phỏng, chưa có dữ liệu thật · test: `engine-probe.test.ts` |
| C336 | Learning Persistence | 2 | **3** | Đo theo game: bỏ giữa ván, chơi tiếp sau ván (v89 play.ts, bảng Số liệu chơi); chưa có dữ liệu người thật · test: `engine-play-town.test.ts` |
| C337 | Independent Performance | 4 | **5** | Tách đúng có trợ giúp khỏi đúng độc lập (novOk chỉ tính không trợ giúp); chưa có dữ liệu người thật |
| C338 | Spontaneous Use | 1 | **1** | Chưa có dữ liệu / cơ chế |
| C339 | Context Generalization | 1 | **3** | Có công cụ: câu ngữ cảnh mới (transfer), bộ đo giữ riêng; chưa có dữ liệu |
| C340 | Outcome Validity | 3 | **3** | Bộ đo giữ riêng khỏi transfer/game, el_pair ước tính–điểm thật; chưa có dữ liệu · test: `measure.spec.ts` |

### H. Game / Learning Validity: 7,2/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C341 | Fun ≠ Learning | 1 | **5** | Tách tín hiệu vui (bỏ giữa, chơi tiếp sau ván) khỏi tín hiệu học (câu bằng chứng / phút) theo từng game (v89); Quest là màn chính, câu chọn theo lỗ hổng; chưa có dữ liệu · test: `engine-play-town.test.ts` |
| C342 | Learning ≠ Game Score | 8 | **9** | Xu, tầng, thắng thua là telemetry, không vào mastery; XP tách Readiness · test: `engine-quest.test.ts`, `quest.spec.ts` |
| C343 | Reaction Speed Confound | 6 | **9** | Tốc độ không vào trọng số; Quest không tính giờ; trên mô phỏng tốc độ khác nhau chênh mastery 0,00 · test: `scenarios.test.ts`, `engine-quest.test.ts` |
| C344 | Motor Skill Confound | 4 | **6** | Hết giờ khi bị ép chỉ ×0,3; trên mô phỏng chênh 0,05 so với 0,12; chưa test thao tác chạm thật · test: `scenarios.test.ts` |
| C345 | Game Strategy Confound | 4 | **6** | Xu tỉ lệ giá trị học nên chiến thuật game trùng đường học; chưa có dữ liệu · test: `engine-quest.test.ts` |
| C346 | Layout Memorization | 6 | **6** | Xáo phương án như v51 |
| C347 | Pattern Memorization | 4 | **7** | Câu đã gặp ít xu; Đạt mức 1–3 cần ≥ 2 câu khác nhau, mức cao cần câu mới; câu trùng đề dưới id khác không tính mới · test: `engine-evq.test.ts` |
| C348 | Challenge Novelty | 3 | **8** | Trùm là câu mới chưa gặp; mức 4–5 cần đúng ở câu mới · test: `engine-quest.test.ts`, `engine-mastery3.test.ts` |
| C349 | Game Difficulty Isolation | 1 | **8** | gameplayDifficulty chỉ đổi theo tầng, không đổi câu; ảnh hưởng gameplay còn nhỏ (tim theo tầng) · test: `engine-quest.test.ts` |
| C350 | Language Difficulty Isolation | 1 | **7** | languageDifficulty = mức mastery do engine chọn, độc lập tầng; chưa hiệu chỉnh độ khó câu · test: `engine-quest.test.ts` |
| C351 | Challenge Fairness | 5 | **5** | Chưa có dữ liệu về công bằng thử thách |
| C352 | Feedback Validity | 8 | **8** | Giải thích tiếng Việt từng phương án; bí kíp có ví dụ, dễ nhầm |
| C353 | Feedback Timing | 7 | **7** | Ngay khi luyện; bí kíp trong game hoãn tới cuối lượt |
| C354 | Challenge Variety | 8 | **8** | 26 dạng câu thi + nhiều dạng từ vựng/ngữ pháp; 5 loại cảnh Quest |
| C355 | Game Flow | 5 | **8** | Lỗi lẻ không ngắt; bí kíp hoãn tới cuối lượt; NBA trong Quest trừ hành động ngắt (inGame); tầng có điểm dừng tự nhiên · test: `engine-micro.test.ts`, `engine-micro.test.ts` |
| C356 | Difficulty Adaptation | 6 | **8** | Câu Quest chọn theo cách sửa: đúng mức, dạng tự gõ/chọn, câu chưa gặp (pickFor); nút chưa có bằng chứng hỏi nhận ra trước; IRT · test: `engine-remedy.test.ts`, `engine-quest.test.ts` |
| C357 | Objective Visibility | 7 | **8** | Goal-first: dò ngắn → app tự đặt mục tiêu (snapshot goal:AUTO) → tháp là màn chính; bước tiếp và mục tiêu tầng hiển thị · test: `play.spec.ts` |
| C358 | Completion Integrity | 8 | **8** | cdProg tính từ điểm, không từ số bài |
| C359 | Reward Integrity | 6 | **8** | Xu ∝ giá trị học, câu sai không âm, không phạt khi nghỉ · test: `engine-quest.test.ts` |
| C360 | Game Learning Attribution | 1 | **4** | Câu trả lời trong game có src game và id thử thách, snapshot mỗi lượt; v89: câu bằng chứng / phút theo từng game; chưa có dữ liệu quy kết · test: `engine-play-town.test.ts` |

### I. Bias, Fairness & Robustness: 4,4/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C361 | Demographic Bias | 0 | **0** | Chưa có dữ liệu / cơ chế |
| C362 | Language Background | 1 | **1** | Chỉ người Việt |
| C363 | Accent Robustness | 4 | **4** | Giọng Anh/Mỹ, nghe nhiều giọng; chưa test bias |
| C364 | World-Knowledge Bias | 6 | **6** | Phép thử 'không có bài' |
| C365 | Cultural Bias | 3 | **3** | Chưa có dữ liệu / cơ chế |
| C366 | Device Bias | 4 | **4** | e2e Android/iOS/desktop (chức năng), chưa đo thiên lệch |
| C367 | Screen Size Bias | 5 | **5** | e2e mobile + desktop |
| C368 | Network Bias | 8 | **8** | Offline test, ghi bằng chứng tại máy · test: `offline.spec.ts` |
| C369 | Accessibility Bias | 6 | **6** | axe WCAG AA, phím tắt |
| C370 | Hint Bias | 5 | **6** | Gợi ý ×0,5, làm lại ×0,3, có test; chưa đo thiên lệch thật · test: `engine-evidence.test.ts` |
| C371 | Fatigue Bias | 1 | **4** | Cơ chế: sai lúc mệt (đúng giảm, chậm dần trong phiên) nhẹ hơn, rel thấp, đề nghị nghỉ; chưa có dữ liệu người thật để đo thiên lệch · test: `engine-evq.test.ts` |
| C372 | Familiarity Bias | 3 | **6** | Theo dõi câu mới/cũ, ≥ 2 câu khác nhau ở mức 1–3, câu trùng đề không tính mới; chưa đo trên người thật · test: `engine-evq.test.ts` |
| C373 | Speed Bias | 8 | **8** | Chậm không bị phạt; trên mô phỏng tốc độ không đổi mastery (MT19) · test: `scenarios.test.ts` |
| C374 | Error Bias | 6 | **6** | Sai chỉ tính ở đúng mức, decay đối xứng theo chiều kết luận |
| C375 | Content (Author) Bias | 1 | **1** | Chưa có dữ liệu / cơ chế |
| C376 | Game Preference Bias | 2 | **2** | Nhãn A/B game/plain khi đồng ý; chưa có dữ liệu |
| C377 | Difficulty Feedback Loop | 2 | **2** | Chưa có dữ liệu / cơ chế |
| C378 | Cold Start Bias | 6 | **7** | Claim tách khỏi Mastery (trạng thái inferred), câu dò confirm; tin cậy Thấp khi chưa có bằng chứng · test: `engine-mastery3.test.ts` |
| C379 | Model Drift Bias | 0 | **4** | drift() báo khi model quá lạc quan ở ô Đạt, ghi snapshot; chỉ báo cáo, chưa phân theo nhóm người học, chưa có dữ liệu thật · test: `engine-evq.test.ts` |
| C380 | Bias Auditability | 1 | **4** | Dữ liệu nghiên cứu kèm audit (drift, ước lượng slip/guess) và provenance; test thiên lệch chỉ trên mô phỏng; chưa có audit thiên lệch nhóm |

### J. Data Engineering, Performance & Reliability: 8,1/10

| # | Tiêu chí | v51 | Điểm | Bằng chứng |
|---|---|---|---|---|
| C381 | Offline Learning Loop | 9 | **9** | Service worker, test offline · test: `offline.spec.ts` |
| C382 | Offline Evidence Queue | 8 | **8** | Ghi localStorage ngay |
| C383 | Sync Conflict | 6 | **9** | Gộp hai máy kiểu G-counter theo thiết bị: không mất, không đếm trùng; sổ hợp theo id · test: `engine-evidence.test.ts` |
| C384 | Atomic State Update | 7 | **7** | Một setItem JSON |
| C385 | Transaction Integrity | 6 | **7** | Lỗi khi ghi bằng chứng được đếm và lưu (integ.err, core.ts ev), hiện trong Cài đặt; eEv vẫn nuốt lỗi |
| C386 | Crash Recovery | 7 | **8** | Ô Beta dẫn xuất tính lại từ thống kê khi nạp; ghi dở được sửa · test: `scenarios.test.ts` |
| C387 | Data Migration | 9 | **9** | migrateE có phiên bản; v3 → v4 giữ α, β · test: `engine-evidence.test.ts` |
| C388 | Backward Compatibility | 8 | **9** | Bản lưu cũ nâng cấp được, có e2e · test: `evidence.spec.ts` |
| C389 | Evidence Schema Versioning | 5 | **8** | EV_SCHEMA cho kho bằng chứng; mỗi sự kiện ghi ev = luật; sanitize lọc theo lược đồ · test: `engine-evidence.test.ts` |
| C390 | Rule Versioning | 1 | **9** | RULE_ID ghi vào từng sự kiện; đổi luật tính lại được từ L2 · test: `engine-evidence.test.ts`, `scenarios.test.ts` |
| C391 | Content Versioning | 3 | **9** | Mỗi câu có băm nội dung trong content-map.json; app ghi cv theo từng câu (itemCv), e2e khớp bản đồ; câu ngoài bản đồ dùng phiên bản app · test: `evidence.spec.ts` |
| C392 | Deterministic Reproduction | 4 | **9** | Decision Snapshot replay ra đúng kết luận; mô phỏng có hạt giống · test: `scenarios.test.ts` |
| C393 | Runtime Query Efficiency | 8 | **8** | derive() chỉ đọc đúng ô; O(số khoá con) |
| C394 | Storage Growth Test | 6 | **9** | 100.000 tương tác: sổ có trần, kho < 1,5 MB · test: `scenarios.test.ts`, `engine-evidence.test.ts` |
| C395 | Memory Footprint | 8 | **8** | Giới hạn LED_MAX, OBS_MAX, SNAP_MAX, SEEN_MAX |
| C396 | CPU Efficiency | 7 | **7** | 100.000 lượt mô phỏng < 20 giây trong test; chưa đo trên máy yếu |
| C397 | Battery Efficiency | 4 | **4** | Chưa đo |
| C398 | Export Integrity | 7 | **8** | Mã/file đồng bộ, sanitize; xuất dữ liệu nghiên cứu có e2e · test: `evidence.spec.ts` |
| C399 | Corruption Detection | 7 | **9** | verify() so ô lưu với ô tính lại, sửa và đếm; dữ liệu rác bị lọc · test: `engine-evidence.test.ts` |
| C400 | Full Loop Integrity | 7 | **8** | e2e: trả lời → sự kiện provenance → ô Beta khớp → Vì sao?; Quest trả lời thành bằng chứng · test: `evidence.spec.ts`, `quest.spec.ts` |
