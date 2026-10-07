# English Ladder v2.4: 200-Point Spec Conformance

Bản chấm: v51 (commit `401c1ca`), 07/10/2026. Thang 0–4: 0 không có/sai · 1 sơ sài · 2 đúng một phần · 3 đúng và hoạt động · 4 đúng, có test, ổn định.
Bằng chứng lấy từ code (`src/engine/*`, `src/exam/*`, lời gọi `eEv` trong `app.js`, `content/engine/*`) và test (89/89 unit test đạt). Bộ này chính là định nghĩa của C1–C200 mà `docs/SCORECARD-v2.4.md` trước đó chỉ chấm được theo nhóm.

## Kết luận

| Chỉ số | Kết quả |
|---|---|
| Tổng | **420/800 (52%)**: 82 Pass · 45 Partial · 73 Fail |
| Critical (50) | 130/200 (65%), **13 tiêu chí Fail → Architecture FAIL** |
| Core (100) | 217/400 (54%) |
| Quality (50) | 73/200 (36%) |

13 Critical Fail chia theo gốc rễ:

| Gốc rễ | Tiêu chí | Tính chất |
|---|---|---|
| Evidence gộp ngay khi ghi, không có ledger/snapshot | C71, C92, C95, C99, C101, C105, C109, C110 | **Thiết kế sai hướng** so với v2.4 (đã có, nhưng lưu sai tầng) |
| Không có vòng tự sửa model | C120, C131, C150 | Chưa xây |
| Không có micro-learning | C161 | Chưa xây |
| Không có transfer | C175 | Chưa xây |

Nhóm mạnh nhất: Mastery Engine (88%), Product/Goal (85%), Readiness (80%), Data/Privacy (78%).
Nhóm yếu nhất: Provenance (18%), Micro Learning (28%), Observation (30%), Evidence Storage (32%).

## Ma trận tuân thủ theo nhóm

Pass = 3–4 · Partial = 2 · Fail = 0–1

| Nhóm | Điểm | % | Pass | Partial | Fail |
|---|---|---|---|---|---|
| 1. Product Vision & Goal | 34/40 | 85% | 8 | 2 | 0 |
| 2. Universal Language Core | 21/40 | 52% | 3 | 4 | 3 |
| 3. CEFR Competency Model | 23/40 | 58% | 5 | 2 | 3 |
| 4. Competency Graph | 17/40 | 42% | 4 | 0 | 6 |
| 5. Knowledge Model | 23/40 | 58% | 6 | 0 | 4 |
| 6. Content Architecture | 24/40 | 60% | 5 | 3 | 2 |
| 7. Game Design | 22/40 | 55% | 4 | 4 | 2 |
| 8. Observation | 12/40 | 30% | 0 | 3 | 7 |
| 9. Evidence Acquisition | 18/40 | 45% | 2 | 3 | 5 |
| 10. Evidence Storage | 13/40 | 32% | 3 | 1 | 6 |
| 11. Provenance & Audit | 7/40 | 18% | 0 | 1 | 9 |
| 12. Inference & Learner Model | 24/40 | 60% | 6 | 2 | 2 |
| 13. Mastery Engine | 35/40 | 88% | 8 | 2 | 0 |
| 14. Diagnostic Engine | 20/40 | 50% | 2 | 5 | 3 |
| 15. Gap & Root Cause | 15/40 | 38% | 2 | 4 | 4 |
| 16. Learning Path & NBA | 21/40 | 52% | 3 | 4 | 3 |
| 17. Micro Learning | 11/40 | 28% | 1 | 2 | 7 |
| 18. Retention & Transfer | 17/40 | 42% | 3 | 2 | 5 |
| 19. Readiness, Motivation & UX | 32/40 | 80% | 9 | 0 | 1 |
| 20. Data, Privacy, Extensibility | 31/40 | 78% | 8 | 1 | 1 |
| **Tổng** | **420/800** | **52%** | **82** | **45** | **73** |

## Theo 3 lớp

| Lớp | Điểm | % | Pass | Partial | Fail |
|---|---|---|---|---|---|
| Critical (50) | 130/200 | 65% | 30 | 7 | 13 |
| Core (100) | 217/400 | 54% | 42 | 27 | 31 |
| Quality (50) | 73/200 | 36% | 10 | 11 | 29 |

## Critical đang Fail (≤ 1 điểm)

| # | Tiêu chí | Điểm | Bằng chứng |
|---|---|---|---|
| C71 | Observation tồn tại riêng | 0 | Không có thực thể |
| C92 | Có Evidence Event | 0 | Không có ledger |
| C95 | Có Decision Snapshot | 0 | Không có |
| C99 | Information-preserving aggregation | 1 | Mất item, thời điểm, độ khó → không tính lại được (HF8) |
| C101 | Evidence biết source | 1 | `qt` |
| C105 | biết rule version | 0 |  |
| C109 | Critical evidence được bảo toàn | 0 | Không phân loại, không giữ |
| C110 | Decision có thể audit | 1 | Câu giải thích hiện tại, không lưu |
| C120 | Quay lại diagnostic | 0 | Không có trigger |
| C131 | Continuous diagnosis | 1 | Chẩn đoán một lần; không dò ngầm |
| C150 | Root cause được kiểm chứng | 0 |  |
| C161 | Micro-learning trigger khi cần | 1 | Không có trigger; chỉ giải thích sau mỗi câu |
| C175 | Transfer được đo | 0 |  |

## Chi tiết 200 tiêu chí

### 1. Product Vision & Goal: 34/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C1 | Goal-first architecture | Critical | 2 | Lộ trình theo mục tiêu có, nhưng chọn mục tiêu nằm ở Tôi → Mục tiêu; chưa chọn thì app dùng unit cũ (`nextStep` trả null) |
| C2 | Goal machine-readable | Quality | 4 | `goals/*.json` có schema, `validate()`, test |
| C3 | Target có requirement model | Critical | 4 | `req: {node, level, type}` |
| C4 | Goal-specific readiness | Core | 4 | Kỳ thi: mô phỏng P(đạt); CEFR/giao tiếp: theo năng lực; có test |
| C5 | Goal-independent engine | Critical | 3 | Graph/mastery/path dùng chung; `readiness.ts` còn rẽ nhánh theo loại kỳ thi |
| C6 | Progress không dựa completion | Critical | 4 | `cdProg` tính Beta từ điểm; có test |
| C7 | Goal có remaining gaps | Quality | 3 | "Còn x/y năng lực chưa đạt" + danh sách nút |
| C8 | Goal có evidence requirement | Quality | 2 | Chỉ có mức 1–5 + loại yêu cầu, chưa có loại evidence |
| C9 | Goal có readiness rule | Critical | 4 | READY_P = 0,8; Achieved theo điểm thật / 14 ngày |
| C10 | Đổi goal không phá learner model | Core | 4 | Kho mastery `st.e.m` dùng chung, `mergeGoals` |

### 2. Universal Language Core: 21/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C11 | Có Universal Language Core | Core | 2 | Đồ thị chung nhưng nút là Can-Do / unit / điểm ngữ pháp, chưa theo 8 năng lực của §14 |
| C12 | Lexical competence | Core | 2 | Chiều nhận ra / nhớ / chính tả / ngữ cảnh / kết hợp có trong app; nút là cả unit |
| C13 | Grammatical competence | Core | 3 | 154 điểm ngữ pháp, mức 1–5 |
| C14 | Phonological competence | Core | 2 | Nút Can-Do mảng `pro`, 26 cặp âm; không có nút âm vị |
| C15 | Reception | Core | 3 | Nút L/R, IRT |
| C16 | Production | Core | 2 | Nút W/S, chấm bằng luật + tự chấm |
| C17 | Interaction | Core | 1 | Chỉ qua Can-Do và 24 hội thoại |
| C18 | Pragmatics | Core | 1 | Không có nút riêng |
| C19 | Discourse | Core | 1 | Không có nút riêng |
| C20 | Competencies tái sử dụng | Core | 4 | 35 mục tiêu chung một đồ thị; có test |

### 3. CEFR Competency Model: 23/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C21 | CEFR Pre-A1 → C2 | Core | 2 | Có A1–C2; Pre-A1 chỉ là nội dung khởi động, chưa là Target |
| C22 | CEFR không phải scalar | Critical | 4 | Cấp riêng từng kỹ năng, từng nút |
| C23 | Competency có level requirement | Core | 4 | Mức cần 1–5 theo nút |
| C24 | Competency có evidence requirement | Core | 2 | Chỉ ngầm qua mức |
| C25 | Competency có prerequisite | Critical | 3 | Cạnh cứng sinh tự động |
| C26 | Transfer requirement | Core | 0 | Không có |
| C27 | Retention requirement | Core | 1 | Chỉ luật 14 ngày không quên cho Achieved |
| C28 | Performance requirement | Core | 3 | `type: performance`, bài làm thật mỗi tuần |
| C29 | CEFR profile đa chiều | Core | 3 | Từ vựng, ngữ pháp, Nghe, Đọc, Viết, Nói riêng |
| C30 | CEFR mapping có provenance | Quality | 1 | Có version; không có nguồn descriptor |

### 4. Competency Graph: 17/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C31 | Có competency graph | Critical | 4 | 998 nút, 2.607 cạnh; CI |
| C32 | Hard prerequisite | Critical | 4 | Có, dùng để mở nút; có test |
| C33 | Soft prerequisite | Quality | 3 | Có `soft` + w; chỉ dùng tính dep |
| C34 | Alternative prerequisite | Quality | 0 | Không có |
| C35 | Transfer relationship | Quality | 0 | Không có |
| C36 | Edge có rationale | Quality | 0 | Không có |
| C37 | Edge có version | Quality | 1 | Chỉ băm cả tệp đồ thị |
| C38 | Cycle detection | Critical | 4 | `topo` + `validate`, CI |
| C39 | Orphan detection | Quality | 0 | Không có |
| C40 | Unreachable detection | Quality | 1 | Chỉ test 'người mới mở được lộ trình' |

### 5. Knowledge Model: 23/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C41 | Node identity ổn định | Core | 3 | id chuẩn hoá, regex trong sanitize |
| C42 | Node có prerequisite | Core | 3 | Qua cạnh |
| C43 | Node có CEFR relevance | Core | 3 | Trường `cefr` |
| C44 | Node có mastery dimensions | Core | 4 | Ô Beta × 5 mức; có test |
| C45 | Node có evidence requirements | Core | 1 | Không có trên nút |
| C46 | Node có difficulty | Quality | 1 | Chỉ cấp CEFR |
| C47 | Node có distractor profile | Quality | 1 | Giải thích từng phương án ở câu, không ở nút |
| C48 | Node có content mapping | Core | 3 | `acts` mở đúng màn |
| C49 | Node có version | Quality | 0 | Không có |
| C50 | Node không phụ thuộc game | Core | 4 | Tách hoàn toàn |

### 6. Content Architecture: 24/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C51 | Content tách khỏi competency | Core | 3 | content/exam JSON; phần lớn bài học nền vẫn ở app.js / data/lv |
| C52 | Một competency nhiều content | Core | 3 | Nhiều acts / nhiều câu |
| C53 | Content có difficulty | Quality | 3 | Câu thi có `b`; bài học theo cấp |
| C54 | Content có context | Quality | 2 | Rải rác |
| C55 | Content có evidence mapping | Core | 2 | Ngầm trong code (`examEvidence`, `eEv`), không là dữ liệu |
| C56 | Content có version | Quality | 1 | Tệp băm, không có version từng câu |
| C57 | Distractor quality | Quality | 3 | Phép thử chống mẹo + soát độc lập |
| C58 | Content có prerequisite mapping | Core | 2 | Qua nút |
| C59 | Coverage tự động | Core | 4 | `coverage.md` + CI: 0 nút không đo được |
| C60 | Không content orphan | Quality | 1 | Không kiểm |

### 7. Game Design: 22/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C61 | Game là primary interface | Core | 1 | Quiz kiểu Duolingo + XP/streak/giải đấu; không có game |
| C62 | Game có learning objective | Core | 3 | Mỗi hoạt động gắn nút |
| C63 | Game có measurement objective | Core | 2 | Ngầm |
| C64 | Challenge có target competency | Core | 3 | Bằng chứng ghi `node` |
| C65 | Challenge có language difficulty | Core | 2 | `b` / mức |
| C66 | Challenge có gameplay difficulty | Core | 0 | Không có |
| C67 | Challenge có expected effort/time | Quality | 2 | Phút ở mức nút, không ở challenge |
| C68 | Challenge có evidence types | Core | 2 | Ánh xạ dạng câu → mức trong code |
| C69 | Game không quyết định curriculum | Critical | 4 | Lộ trình do engine quyết |
| C70 | Game skill không tăng mastery | Critical | 3 | XP / tốc độ không vào Beta |

### 8. Observation: 12/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C71 | Observation tồn tại riêng | Critical | 0 | Không có thực thể |
| C72 | Observation có timestamp | Quality | 1 | Chỉ ngày, chỉ lần cuối mỗi ô |
| C73 | Observation có challenge ref | Core | 1 | Chỉ Resp Nghe/Đọc |
| C74 | Observation có item ref | Core | 2 | Có lúc ghi, giữ 2 ngày cho luật 24h |
| C75 | Observation ghi correctness | Core | 2 | Gộp vào α/β, không giữ |
| C76 | Response time | Quality | 1 | Chỉ hội thoại phản xạ |
| C77 | Hint/retry | Core | 1 | Tự nhận đoán; bỏ lượt làm lại (ngữ pháp); gợi ý không ghi |
| C78 | Observation ghi context | Core | 1 | Danh sách ngữ cảnh ≤ 8 |
| C79 | Observation không trực tiếp cập nhật mastery | Critical | 2 | Có hàm đánh giá (g, s, w, mức) nhưng không có tầng riêng; xem HF1 |
| C80 | Raw observation có lifecycle | Quality | 1 | Chỉ trần cứng (Resp 800, r 2 ngày) |

### 9. Evidence Acquisition: 18/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C81 | Observation → Evidence | Critical | 2 | Đánh giá trong `record()`, không sinh đối tượng Evidence |
| C82 | Evidence có competency | Core | 4 | `node` |
| C83 | Evidence có mastery dimension | Core | 4 | `level`, `only` |
| C84 | Evidence có source | Core | 1 | Chỉ `qt` |
| C85 | Evidence có reliability | Core | 1 | Chỉ g / w |
| C86 | Evidence có difficulty | Quality | 1 | Không có (ngoài ánh xạ band → mức) |
| C87 | Evidence có novelty/context | Quality | 2 | `ctx`, không có novelty |
| C88 | Evidence có independence | Quality | 1 | Chỉ ×0,5 trong 24h |
| C89 | Evidence có strength | Core | 2 | w·(1−g) |
| C90 | Evidence có decision value | Quality | 0 | Không có |

### 10. Evidence Storage: 13/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C91 | Raw không phải tầng lưu duy nhất | Core | 2 | Có aggregate, nhưng thiếu các tầng giữa |
| C92 | Có Evidence Event | Critical | 0 | Không có ledger |
| C93 | Có Evidence Aggregate | Core | 3 | Ô Beta |
| C94 | Có Evidence State | Core | 3 | `st.e.m` |
| C95 | Có Decision Snapshot | Critical | 0 | Không có |
| C96 | Retention policy | Quality | 1 | Trần cứng |
| C97 | Evidence tier | Quality | 0 | Không có |
| C98 | Evidence sampling | Quality | 0 | Không có |
| C99 | Information-preserving aggregation | Critical | 1 | Mất item, thời điểm, độ khó → không tính lại được (HF8) |
| C100 | Storage growth kiểm soát | Quality | 3 | Có trần theo thiết kế; chưa test 100K |

### 11. Provenance & Audit: 7/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C101 | Evidence biết source | Critical | 1 | `qt` |
| C102 | biết activity | Core | 1 | `qt` |
| C103 | biết challenge | Core | 0 | — |
| C104 | biết evaluator | Quality | 1 | Viết/Nói có `by` (rule/self/ai) |
| C105 | biết rule version | Critical | 0 | — |
| C106 | biết content version | Quality | 0 | — |
| C107 | biết timestamp | Quality | 1 | Chỉ ngày gần nhất |
| C108 | biết context | Quality | 2 | Danh sách ngữ cảnh |
| C109 | Critical evidence được bảo toàn | Critical | 0 | Không phân loại, không giữ |
| C110 | Decision có thể audit | Critical | 1 | Câu giải thích hiện tại, không lưu |

### 12. Inference & Learner Model: 24/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C111 | Evidence không trực tiếp thành mastery | Critical | 3 | Đạt cần m ≥ 0,8 và LB ≥ 0,6 |
| C112 | Inference có probability | Core | 4 | m = α/(α+β); có test |
| C113 | Inference có confidence | Critical | 4 | Thấp/Vừa/Cao; có test |
| C114 | Inference có uncertainty | Critical | 3 | sd, LB (xấp xỉ chuẩn) |
| C115 | Misconception detection | Core | 0 | — |
| C116 | Xét lịch sử | Core | 3 | Cộng dồn |
| C117 | Xét context | Core | 2 | Chỉ vào confidence |
| C118 | Xét difficulty | Quality | 2 | IRT cho Nghe/Đọc; Beta thì không |
| C119 | Thay đổi khi có evidence mới | Critical | 3 | Có; chậm khi n lớn |
| C120 | Quay lại diagnostic | Critical | 0 | Không có trigger |

### 13. Mastery Engine: 35/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C121 | Có mastery dimensions | Core | 4 | — |
| C122 | Có Beta state | Critical | 4 | — |
| C123 | Correct update đúng rule | Critical | 4 | Có test |
| C124 | Incorrect update đúng rule | Core | 4 | Có test |
| C125 | Guessing parameter | Core | 4 | g = 1/số phương án; có test |
| C126 | Slip parameter | Core | 3 | Cố định 0,1 |
| C127 | Repetition weight | Core | 4 | Có test |
| C128 | Threshold configurable | Quality | 2 | Hằng số chung, chưa theo competency |
| C129 | Confidence threshold | Critical | 4 | LB ≥ 0,6 |
| C130 | Mastery giảm / reopen | Critical | 2 | Giảm qua bằng chứng sai; không có reopen tường minh |

### 14. Diagnostic Engine: 20/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C131 | Continuous diagnosis | Critical | 1 | Chẩn đoán một lần; không dò ngầm |
| C132 | Exploration mode | Core | 3 | Cầu thang |
| C133 | Confirmation mode | Core | 2 | Kiểm tra để bỏ qua |
| C134 | Root Cause mode | Core | 1 | Chỉ hạ cấp |
| C135 | Boundary detection | Core | 2 | Đổi chiều cầu thang |
| C136 | Verification mode | Core | 2 | Kiểm tra để bỏ qua, bài Can-Do |
| C137 | Dùng uncertainty | Core | 1 | Không chọn theo m ≈ 0,5 |
| C138 | Dùng information value | Quality | 2 | Chỉ IRT |
| C139 | Stopping rule | Critical | 4 | Có test |
| C140 | Tính learner effort | Quality | 2 | Trần 20 phút |

### 15. Gap & Root Cause: 15/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C141 | Gap so với target | Critical | 4 | `plan().unmet` |
| C142 | Knowledge gap | Core | 2 | Mức 1–2 chưa đạt (không gọi tên) |
| C143 | Recall gap | Core | 2 | Mức 3 |
| C144 | Skill gap | Core | 2 | Mức 4 |
| C145 | Automaticity gap | Core | 0 | — |
| C146 | Context gap | Core | 0 | — |
| C147 | Transfer gap | Core | 0 | — |
| C148 | Retention gap | Core | 2 | FSRS đến hạn, lapse |
| C149 | Prerequisite gap | Critical | 3 | Đóng tiền đề, chặn nút |
| C150 | Root cause được kiểm chứng | Critical | 0 | — |

### 16. Learning Path & NBA: 21/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C151 | Path dựa learner state | Critical | 4 | Có test |
| C152 | Path dựa graph | Critical | 4 | Có test |
| C153 | Path bỏ qua đã đạt | Core | 4 | Có test |
| C154 | Path xem retention | Core | 2 | Khối ôn ≤ 30% |
| C155 | Path xem transfer | Core | 0 | — |
| C156 | Nhiều route | Quality | 1 | — |
| C157 | NBA có candidate actions | Core | 2 | Học, ôn, bài làm thật, kiểm tra bỏ qua |
| C158 | NBA tính learning value | Core | 2 | Ngầm qua dep |
| C159 | NBA tính information value | Quality | 0 | — |
| C160 | NBA tính effort/interruption | Quality | 2 | Chỉ phút |

### 17. Micro Learning: 11/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C161 | Micro-learning trigger khi cần | Critical | 1 | Không có trigger; chỉ giải thích sau mỗi câu |
| C162 | Giải quyết root cause | Core | 0 | — |
| C163 | Minimum sufficient scope | Quality | 1 | — |
| C164 | Có practice | Core | 2 | Câu sai được đưa lại trong buổi |
| C165 | Có verification | Core | 1 | — |
| C166 | Quay lại gameplay | Core | 1 | — |
| C167 | Lỗi nhỏ không interrupt | Core | 3 | Không ngắt (vì chưa có can thiệp) |
| C168 | Lỗi lặp có thể interrupt | Core | 0 | — |
| C169 | Prerequisite gap trigger nhanh | Core | 0 | — |
| C170 | Không thành full course ẩn | Quality | 2 | Không có micro nên không phát sinh |

### 18. Retention & Transfer: 17/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C171 | Mastery tách retention | Critical | 4 | Beta và FSRS riêng |
| C172 | FSRS phù hợp | Core | 4 | FSRS-5, có test |
| C173 | Review theo learner state | Core | 3 | Theo từng item |
| C174 | Quên → quay lại path | Critical | 2 | Qua mastery giảm; chưa có luật 'trượt 2 lần' |
| C175 | Transfer được đo | Critical | 0 | — |
| C176 | Transfer context mới | Core | 0 | — |
| C177 | Transfer item mới | Core | 1 | Chỉ giảm trọng số câu lặp trong 24h |
| C178 | Surface variation | Quality | 1 | — |
| C179 | Transfer failure giảm confidence | Core | 0 | — |
| C180 | Không mastery bằng câu lặp giống hệt | Critical | 2 | Sau 24h câu lặp tính đủ trọng số; Đạt không đòi đa dạng |

### 19. Readiness, Motivation & UX: 32/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C181 | Readiness dựa competency | Critical | 4 | Có test |
| C182 | Readiness dựa confidence | Critical | 4 | Tin cậy ≥ Vừa; sàn Viết/Nói |
| C183 | Readiness xem retention | Core | 3 | 14 ngày không quên |
| C184 | Readiness xem transfer | Core | 0 | — |
| C185 | Readiness xem performance | Core | 3 | Bài làm thật |
| C186 | Giải thích remaining gaps | Quality | 3 | Thiếu kỹ năng nào, nút nào |
| C187 | XP không ảnh hưởng mastery | Critical | 4 | — |
| C188 | Streak không ảnh hưởng readiness | Core | 4 | — |
| C189 | Reward không thay evidence | Core | 4 | — |
| C190 | UX không bắt tự chọn curriculum | Quality | 3 | Nút "Bước tiếp theo" |

### 20. Data, Privacy, Extensibility: 31/40

| # | Tiêu chí | Lớp | Điểm | Bằng chứng |
|---|---|---|---|---|
| C191 | Local-first | Core | 4 | e2e offline |
| C192 | Export/import giữ state | Quality | 3 | Mã / tệp đồng bộ, sanitize |
| C193 | Export giữ evidence | Quality | 1 | Chỉ ô Beta |
| C194 | Privacy by design | Quality | 4 | Đồng ý, kiểm tuổi, ẩn danh |
| C195 | Không bắt buộc account | Core | 4 | — |
| C196 | Không cần runtime AI | Critical | 4 | — |
| C197 | Target mới không rewrite core | Critical | 3 | 35 mục tiêu đã chạy; readiness có rẽ nhánh |
| C198 | Evidence model dùng cho target mới | Critical | 3 | Nút x: của kỳ thi dùng cùng Beta |
| C199 | Automated validation suite | Core | 3 | Unit, e2e, kiểm nội dung, Lighthouse; chưa có scenario mô phỏng |
| C200 | Chứng minh toàn bộ learning loop | Critical | 2 | Đi được Unknown → Readiness; thiếu micro / transfer / verify |
## 10 Test Scenarios

| # | Scenario | Kết quả | Lý do |
|---|---|---|---|
| 1 | Complete Beginner | ⚠️ Partial | Chẩn đoán → lộ trình → học → Đạt chạy được (có test "người mới VSTEP B1"). Thiếu bước "Play → discover gaps" vì không có game |
| 2 | Strong Learner | ✅ Pass (thiết kế) | Tiên nghiệm sau chẩn đoán đánh dấu nút dưới cấp là Đạt; kiểm tra để bỏ qua ×4. Chưa có test end-to-end |
| 3 | Knowledge ≠ Performance | ⚠️ Partial | Mức 1–3 và mức 4 là các ô riêng, nên lộ trình đưa nút mức 4 vào; nhưng app không gọi tên "performance gap" |
| 4 | One Random Error | ✅ Pass | 20 đúng + 1 sai: m ≈ 0,91, vẫn Đạt; không ngắt |
| 5 | Repeated Failure | ❌ Fail | β tăng, nút ở lại lộ trình; không điều tra root cause, không can thiệp |
| 6 | Transfer Failure | ❌ Fail | Không có khái niệm context mới / model disagreement |
| 7 | Forgetting | ⚠️ Partial | FSRS tạo lịch ôn; ô Beta không giảm theo thời gian; chưa có luật R̄ nút < 0,85 |
| 8 | Goal Switch | ✅ Pass | Kho mastery dùng chung, đổi mục tiêu không reset |
| 9 | Evidence Explosion | ⚠️ Partial | Dung lượng có trần theo thiết kế, runtime O(1) theo lịch sử; chưa test 100K. Nhưng trần đạt được là vì *bỏ* dữ liệu, không phải nén có bảo toàn |
| 10 | Model Error | ❌ Fail | Bằng chứng mới chỉ làm m giảm dần; không phát hiện disagreement, không chẩn đoán lại |

3 Pass · 4 Partial · 3 Fail.

## 5 tầng đánh giá

| Tầng | Ước lượng | Căn cứ |
|---|---|---|
| L1 Specification Compliance | ≈ 52% | Tổng 200 tiêu chí |
| L2 Architecture Correctness | ≈ 40% | Ranh giới Observation/Evidence/Aggregate/Decision chưa có (Nhóm 8–11: 30%, 45%, 32%, 18%) |
| L3 Algorithm / Model Validity | ≈ 65% | Beta/FSRS/IRT/path đúng công thức, có test; chưa calibration, chưa phân vị Beta chính xác, Beta không có yếu tố thời gian |
| L4 Learning Effectiveness | Chưa đo | Không có pre/post/delayed/transfer test |
| L5 Real Learner Outcome | Chưa đo | Chưa có điểm thi thật; n = 1 |

## Phản biện bộ 200 tiêu chí

1. **Có tiêu chí trùng nhau, nên một lỗi bị phạt nhiều lần.** C5 ≈ C197, C79 ≈ C111, C70 ≈ C187, C22 ≈ C29, C84 ≈ C101, C175 ≈ C26. Riêng thiếu provenance đã kéo xuống khoảng 15 tiêu chí ở Nhóm 9 + 10 + 11. Nên gộp lại, hoặc ghi rõ "cùng một nguyên nhân" để ma trận không phóng đại.
2. **Phải tách "vi phạm" với "chưa xây".** Spec định nghĩa Critical là "vi phạm = FAIL", nhưng 5/13 Critical Fail ở đây là chưa xây (micro-learning, transfer, chẩn đoán liên tục), không phải xây sai. Đề xuất: *vi phạm chủ động* (ví dụ quan sát cập nhật thẳng mastery) → FAIL ngay; *chưa có* → chặn mốc phát hành (MVP chưa xong), không gọi là sai kiến trúc.
3. **50 Critical là quá nhiều cho một cổng nhị phân.** Bản 400 tiêu chí chỉ có 10 Hard Fail. Nên đồng bộ: giữ 10 HF làm cổng, còn 50 Critical làm điều kiện "MVP Done".
4. **Hướng sản phẩm vẫn chưa chốt.** C21 (Pre-A1 → C2 là target duy nhất) và C61 (game là giao diện chính) chấm theo v2.4, nhưng `docs/SPEC.md` (quyết định của người sáng lập trong repo) lại chọn ôn thi + 35 mục tiêu + kiếm tiền kiểu Duolingo. Hai tiêu chí này chỉ có nghĩa khi bạn đã chốt bản spec nào thắng.
5. **Thang 0–4 chưa có quy tắc cho "4 = được kiểm chứng".** Tôi dùng: 4 khi có test tự động khẳng định hành vi. Theo quy tắc này, các tiêu chí học tập (L4/L5) không thể lên 4 khi chưa có người dùng. Nên ghi quy tắc này vào framework để các lần chấm sau so sánh được.

## Kế hoạch: gỡ 13 Critical Fail theo thứ tự lợi nhất

| Bước | Việc | Gỡ Critical | Kéo theo (Core/Quality) |
|---|---|---|---|
| 1 | **Evidence Ledger + Observation**: lưu từng sự kiện `{ts, node, level, ok, item, challenge, qt, ctx, g, hint, retry, rt, session, contentHash, ruleVer}` có trần theo giá trị; ô Beta thành trạng thái dẫn xuất, tính lại được | C71, C92, C99, C101, C105, C109 | C72–C78, C80, C84–C88, C96–C98, C102–C108, C193 |
| 2 | **Decision Snapshot**: khi đổi Đạt, kiểm tra bỏ qua, Readiness đổi mức, NBA được chọn (kèm 3 phương án đầu) | C95, C110 | C157, C186 |
| 3 | **Vòng tự sửa model**: nút Đạt mà sai ≥ 2 lần ở câu/ngữ cảnh mới → disagreement → hạ tin cậy → đưa câu dò (chẩn đoán liên tục); dò theo cạnh tiền đề để kiểm chứng root cause | C120, C131, C150 | C130, C134, C137, C146 |
| 4 | **Transfer**: đánh dấu câu/ngữ cảnh chưa gặp; mức 4–5 cần ≥ 1 lần đúng ở câu mới | C175 | C26, C176–C179, C184 |
| 5 | **Micro-learning + interruption policy**: cùng nút sai lặp lại → giải thích ngắn + 3 câu + kiểm lại → về bài | C161 | C162–C169 |

Ước lượng: xong bước 1–3 thì Critical Fail còn 2 (C161, C175), tổng khoảng 540/800. Xong cả 5 bước thì Critical đạt 50/50, tổng khoảng 600/800 (75%), không cần thêm người dùng. Game layer (Nhóm 7) để sau khi bạn chốt hướng sản phẩm.

