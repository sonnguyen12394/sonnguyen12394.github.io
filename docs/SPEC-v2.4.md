# English Ladder — Master Specification v2.4

Play-Driven Adaptive CEFR Learning System. Nguồn sự thật cho Product, Knowledge Model, Adaptive Engine và Evidence Architecture từ 08/10/2026 (người sáng lập chốt, xem đầu `docs/SPEC.md`).
Tệp này ghi lại nội dung spec người sáng lập đưa ra, giữ nguyên cấu trúc và mọi nguyên tắc, cổng, công thức; phần giải thích dài được rút gọn. Bộ chấm đi kèm: `docs/CONFORMANCE-200-v2.4.md` (200 tiêu chí, thang 0–4) và `docs/SCORECARD-v2.4.md` (400 tiêu chí, 10 Hard Fail, 20 Meta-Test).

- **MVP target:** CEFR Pre-A1 → C2. **Future targets:** IELTS, VSTEP, Daily Communication, Work English, Academic English.
- **Runtime AI:** không bắt buộc. **Primary experience:** game. **Core philosophy:** evidence-driven adaptive learning.
- **Data philosophy:** information-preserving evidence collection với lưu trữ và giữ dữ liệu thích ứng.
- **Quyết định triển khai của người sáng lập (08/10/2026):** game là mục tiêu chính của người chơi, học tiếng Anh là mục tiêu phụ nằm ẩn trong luật chơi; mọi hành động trong game là thử thách ngôn ngữ do engine chọn để lên cấp nhanh nhất.

## I. Product

**Vision.** Không phải khoá học tuyến tính mà là Adaptive Language Learning Engine biến "tôi muốn đạt trình độ X" thành: năng lực cần có → trạng thái hiện tại → lỗ hổng quan trọng nhất → hoạt động nên làm ngay → bằng chứng tiến bộ → còn thiếu gì → bằng chứng đã đạt.

**Promise.** Know what to learn · Know what to do next · Keep moving until the goal (quan sát, chẩn đoán, điều chỉnh, dạy, luyện, xác minh, ôn, kiểm tra transfer, đánh giá readiness).

**North Star.** Verified progress toward the learner's stated goal per unit of learner effort. Không tối ưu số bài, số câu, XP, streak, thời gian trong app.

## II. Triết lý lõi

Vòng chơi: PLAY → OBSERVE → INFER → ADAPT → PLAY AGAIN. **Game là trải nghiệm, không phải bộ não**: Adaptive Learning Engine quyết định học/luyện gì; Game Engine quyết định trải nghiệm thế nào.

Chuỗi kiến trúc: CEFR Target → Competency Model → Competency Graph → Learner State → Gap/Uncertainty → Next Best Action → Game Challenge / Micro Learning → Observation → Evidence → Inference → Learner State Update → Re-plan.

### Nguyên tắc P1–P28

| # | Nguyên tắc |
|---|---|
| P1 | Goal First |
| P2 | Competency Before Content |
| P3 | Learner State First |
| P4 | Evidence Before Mastery |
| P5 | Knowledge ≠ Performance |
| P6 | Mastery ≠ Completion |
| P7 | One Error ≠ Knowledge Gap |
| P8 | Learn While Diagnosing |
| P9 | Continuous Diagnosis |
| P10 | Decision-Oriented Measurement: chỉ đo thêm khi thông tin mới có thể đổi quyết định |
| P11 | Minimum Sufficient Learning |
| P12 | Micro Learning Repairs Gaps |
| P13 | Gameplay không được giả làm năng lực ngôn ngữ |
| P14 | Game Difficulty ≠ Language Difficulty, kiểm soát riêng |
| P15 | Speed là tín hiệu phụ |
| P16 | Reuse Evidence |
| P17 | Learn Once → Reuse Many Times (giữa các Target Model) |
| P18 | No Runtime AI Dependency |
| P19 | Correctness Before Speed (của learner model) |
| P20 | Meaningful Progress |
| P21 | Information-Preserving Evidence |
| P22 | Evidence Lifecycle (retention, mức chi tiết theo giá trị) |
| P23 | Adaptive Evidence Granularity |
| P24 | Decision Sufficiency: đủ thông tin để giải thích quyết định quan trọng, không bắt buộc giữ mọi raw interaction |
| P25 | Provenance Preservation |
| P26 | Recomputable Derived State |
| P27 | Evidence Value Over Data Volume |
| P28 | Evidence Is Not Telemetry |

## III. Phạm vi MVP (§7–9)

Chỉ triển khai và kiểm chứng sâu CEFR Pre-A1 → C2. CEFR là validation target, không phải lõi: Universal Language Competencies + CEFR Target Requirements → CEFR Target Model. Thêm Target Model mới không được viết lại Learner State, Evidence, Mastery, Diagnostic, Learning Path, NBA, Retention Engine.

## IV. Kiến trúc (§10–11)

TARGET → REQUIREMENTS → COMPETENCY MODEL → GRAPH → LEARNER STATE → DIAGNOSIS/GAP → NBA → (GAME ENGINE | MICRO LEARNING) → OBSERVATION → EVIDENCE BUILDER → EVIDENCE STATE → INFERENCE → STATE UPDATE → VERIFY/TRANSFER → RE-PLAN.

24 thành phần:
1. Target Model
2. Universal Language Core
3. Competency Model
4. Competency Graph
5. Knowledge Model
6. Content Model
7. Game Challenge Model
8. Observation Model
9. Evidence Model
10. Evidence Storage/Lifecycle
11. Evidence Aggregation
12. Evidence Provenance
13. Learner State
14. Mastery Engine
15. Diagnostic Engine
16. Gap Analysis
17. Learning Path
18. NBA
19. Micro-Learning
20. Retention
21. Transfer
22. Goal Readiness
23. Progress
24. Motivation/Game Progression

## V. Target Model (§12–13)

Mô tả: target, competency cần có, level ↔ competency, mastery threshold, evidence / task / transfer / retention / readiness requirements. CEFR **đa chiều**: Vocabulary, Grammar, Phonology, Listening, Reading, Writing, Speaking, Interaction, Pragmatics, Discourse, Functional Language. Không suy "Overall B2 → mọi competency B2".

## VI. Universal Language Core (§14)

1. **Lexical:** meaning, form, collocation, phrase, phrasal verb, semantic relation, lexical choice.
2. **Grammatical:** morphology, syntax, tense/aspect, modality, clause, agreement, complex structures.
3. **Phonological:** sound recognition/production, stress, rhythm, intonation, connected speech.
4. **Reception:** listening, reading.
5. **Production:** speaking, writing.
6. **Interaction:** turn-taking, responding, clarification, negotiation, management.
7. **Pragmatic:** appropriateness, intention, register, politeness, contextual meaning.
8. **Discourse:** coherence, cohesion, organization, information flow.

## VII. Competency Graph (§15–16)

Quan hệ competency / knowledge / prerequisite / dependency / skill / task / performance. Hỗ trợ prerequisite, dependency, alternative prerequisite, soft, hard, transfer relationship.

- **Mỗi edge có:** source, target, relationType, strength, hard/soft, rationale, version.
- **Graph phải kiểm:** cycle, orphan, invalid prerequisite, unreachable node, coverage.

## VIII. Knowledge Model (§17–18)

Knowledge Node là đơn vị nhỏ nhất có thể dạy, luyện, đo, mastery, review. Thuộc tính: CEFR relevance, prerequisites, examples, distractors, difficulty, evidence requirements, content references.

Mastery dimensions: Recognition, Understanding, Recall, Controlled Use, Free Use. Target Model quyết định evidence requirement.

## IX. Game (§19–22, 62–64)

Game là giao diện học chính (tương tác, luyện, khám phá, feedback, tạo evidence, tiến bộ), không chỉ là lớp thưởng.

**Challenge** `{challengeId, gameType, targetCompetencies, evidenceTypes, difficulty, languageDifficulty, gameplayDifficulty, expectedTime, context, distractorProfile, scoringRule, version}`.

**Loại:** Recognition, Matching, Recall, Discrimination, Ordering, Cloze, Listening Choice, Context Choice, Speed (evidence phụ), Mixed.

Mỗi game phải trả lời "đang muốn quan sát điều gì về năng lực?" và có Learning Value + Measurement Value.

- **Progression:** XP, level, streak, missions, rewards, unlocks, milestones, collectibles. Gamification is not evidence: XP không tăng mastery, streak không tăng readiness.
- **Objective:** thắng / hoàn thành / mở khoá / đạt điểm / vượt thử thách, và phải tạo hành vi có language evidence.
- **Game Skill Bias:** kiểm soát reaction speed, nhớ bố cục, chiến thuật, kỹ năng bấm.

## X. Observation → Evidence (§23–27)

Observation là dữ liệu thô (correct, responseTime, attempt, retry, hintUsed, answerChanged, challengeDifficulty, context), **chưa phải evidence**. Bắt buộc: Observation → Evidence Evaluation → Evidence → Inference → Learner State. **Cấm** Observation → Mastery.

- **Loại evidence:** Knowledge, Skill, Task, Performance, Transfer.
- **Lifecycle:** RAW OBSERVATION → EVIDENCE EVENT → EVALUATION → LEDGER → AGGREGATION → EVIDENCE STATE → INFERENCE → LEARNER STATE (mỗi tầng có retention khác nhau).

## XI. Lưu trữ và giữ evidence (§28–31)

| Tầng | Nội dung | Giữ |
|---|---|---|
| L0 Raw Observation | chi tiết nhất; runtime, debug, chẩn đoán, phát hiện bất thường | ngắn hạn |
| L1 Evidence Event | đã diễn giải: competency, context, taskType, result, difficulty, reliability | dài hơn |
| L2 Evidence Aggregate | thống kê không mất chiều (attempts, weightedCorrect/Incorrect, contexts, taskTypes, difficultyRange, transferSuccess) | dài |
| L3 Learner State | mastery, confidence, uncertainty, retention, transfer, error patterns | runtime |
| L4 Decision Snapshot | quyết định quan trọng (mastery, confidence, contexts, taskTypes, ruleVersion, threshold, decision) | dài |

**Tier:**
- 0 Telemetry: game/UI, nén/xoá mạnh.
- 1 Learning Evidence: giữ lâu hơn.
- 2 Decision Evidence: đã ảnh hưởng mastery/diagnosis/path/NBA/readiness, giữ dài hạn.
- 3 Critical: transfer failure, model disagreement, CEFR boundary, readiness decision, thất bại bất ngờ; ưu tiên giữ dài hạn.

**Evidence value:** decision impact, novelty, uncertainty reduction, model correction, transfer, audit, diagnostic value. Ví dụ: lần recognition dễ thứ 100 có giá trị thấp, transfer failure / model disagreement rất cao.

Retention = Value + Recency + Novelty + Decision Relevance + Criticality, cấu hình được; không dùng luật "sau X ngày xoá".

## XII. Aggregation, sampling, provenance (§32–37)

- **Aggregation:** chỉ aggregate khi vẫn giữ đủ thông tin cho adaptive decisions, mastery, diagnosis, transfer, readiness, audit, recalibration. **Không gộp mất chiều** (Recognition / Recall / Controlled Use / Transfer không được gộp thành một "Overall"). Granularity theo competency (ngữ pháp đơn giản ít chiều; phát âm theo phoneme → connected speech; nói theo accuracy / fluency / interaction / appropriateness / discourse).
- **Representative evidence (§35):** strongest / weakest / hardest correct, meaningful / corrected error, transfer success / failure, latest verification, boundary, model disagreement.
- **Provenance (§36):** source, session, activity, challenge, item, evaluator, rule version, content version, timestamp, context.
- **Explainability (§37):** mỗi quyết định quan trọng trả lời được "vì sao", ví dụ: số quan sát liên quan, số context, số task type, transfer, mastery, cận dưới tin cậy, ngưỡng yêu cầu, rule.

## XIII. Evidence budget, inference (§38–41)

- **Evidence budget theo quyết định:** ưu tiên Expected Information Value / Learner Effort. Đủ thì **STOP**, chưa đủ thì thu thêm; không đo chỉ vì đo được.
- **Inference:** suy ra probability, mastery, confidence, uncertainty, misconception, root cause.
- **One Error Rule:** một lỗi không tự tạo Knowledge Gap; phải xét lịch sử, độ khó, context, thời gian, mastery trước, lặp lại, distractor, uncertainty.

## XIV. Learner State, Mastery (§42–45)

- **Learner State:** Knowledge, Mastery, Confidence, Uncertainty, Evidence State, Retention, Performance, Transfer, Difficulty Response, Error Pattern, History.
- **Không phải God Object:** Observation → Evaluator → Evidence State → State Update → Mastery → Diagnostic → Planner.
- **Mastery (MVP):** Beta(α, β).
  - Đúng: α += w·(1 − g). Sai: β += w·(1 − s).
  - w = 1, còn 0,5 nếu cùng câu lặp trong 24h; s = 0,1; g theo task.
  - m = α / (α + β).
  - **Đạt** khi m ≥ 0,80 và cận dưới 80% ≥ 0,60; ngưỡng thay đổi được theo competency / target / evidence / task / difficulty / transfer.

## XV. Diagnostic, Gap, Learning (§46–55)

- **Continuous diagnostic:** Observe → Update → Evaluate uncertainty → "thêm evidence có đổi NBA không?" → Continue / Stop.
- **Diagnostic modes:** Exploration, Confirmation, Root Cause, Boundary Detection, Verification.
- **Gap = Required − Current:** Knowledge, Recall, Skill, Automaticity, Context, Transfer, Retention, Prerequisite.
- **Root cause:** Task Failure → kiểm prerequisite → knowledge → recall → controlled use → transfer; không dạy lại task khi nguyên nhân ở prerequisite.
- **Minimum Sufficient Learning:** Gap → kiến thức thiếu tối thiểu → Micro Learning → Practice → Verification. Micro: 1 concept, contrast, 2–3 ví dụ, sửa misconception, luyện 2–5 câu, kiểm lại.
- **Interruption Policy (§53):**
  - lỗi lẻ nhỏ → ghi, tiếp tục
  - lỗi lặp có ý nghĩa → có thể micro
  - thiếu tiền đề nghiêm trọng → micro ngay
  - uncertainty cao → thu thêm evidence trước
- **Learning Path:** Target Requirements + Learner State + Graph. Chọn nút chưa đạt, retention không đủ, transfer chưa đạt, tiền đề cần. Hard prerequisite đạt trước; priority = Dependent Target Nodes × Edge Strength ÷ Estimated Minutes; nhiều route.

## XVI. Next Best Action (§56–57)

- **Ứng viên:** play challenge, micro concept, practice, review, diagnostic probe, verification, transfer task, skip, advance.
- **Utility** = Expected Learning Value + Expected Information Value + Goal Relevance + Prerequisite Importance + Retention Risk + Transfer Value − Learner Effort − Interruption Cost.

## XVII. Retention, Transfer, Readiness (§58–61)

- **Retention:** Mastery ≠ Retention. FSRS-5 ở mức item; nút ôn khi retrievability trung bình < 0,85; trượt hai lần liên tiếp → về Learning Path.
- **Transfer:** context mới, item mới, biến thể bề mặt, distractor, task.
- **CEFR Readiness:** không phải điểm trung bình. Dựa trên Required Competency Mastery + Evidence Confidence + Retention + Can-Do + Transfer + Performance. Phải nói được "chưa đạt B1 vì còn thiếu X, Y, Z", không phải "bạn đang 72%".

## XVIII. Content, Evidence Quality, Model Error, Personalization, Effort (§65–72)

- **Content ≠ Competency:** một competency có nhiều explanation, example, question, challenge, micro lesson, review, transfer task. Coverage: Competency → Knowledge → Content → Challenge → Evidence → Verification; không có competency quan trọng thiếu content hoặc cơ chế evidence.
- **Evidence quality:** relevance, reliability, specificity, difficulty, independence, novelty, context diversity, provenance; chất lượng + đa dạng + độc lập + giá trị quyết định hơn số lượng.
- **Model Error:** Performance Failure → Model Disagreement → Reduce Confidence → Re-open Diagnosis → Update; model không bị "khoá chết".
- **Personalization:** theo learner state, goal, mastery, uncertainty, pace, difficulty response, retention, error patterns, thời gian rảnh, lịch sử; không chỉ theo sở thích bề ngoài.
- **Effort là ràng buộc hạng nhất:** tối ưu Expected Value / Learner Effort; đủ thì dừng, không đo quá mức.

## XIX. Vòng lõi và ranh giới (§73–80)

- **Master Loop (14 bước):** Know Goal → Required Competencies → Learner State → Gap/Uncertainty → NBA → Play/Learn → Observe → Create Evidence → Update Evidence State → Update Learner State → Verify/Transfer → Update Retention → Re-plan → Repeat.
- **Người học thấy:** Play → Goal → Progress → Next Challenge; thiếu kiến thức thì Gap → Micro → Quick Practice → Continue. Engine thấy toàn bộ chuỗi evidence.
- **Ranh giới:**
  - Game Engine: challenge, interaction, scoring, progression, rewards, presentation; không quyết định curriculum.
  - Learning Engine: state, diagnosis, mastery, gap, path, next action, readiness.
  - Evidence Engine: evaluation, creation, quality, aggregation, retention, provenance, sampling, budget.
  - Content System.
  - Target Model: không chứa adaptive intelligence.

## XX. Data model, lifecycle, privacy (§81–89)

- **Entities:** Goal, TargetModel, Competency, CompetencyEdge, KnowledgeNode, ContentItem, GameChallenge, Observation, EvidenceEvent, EvidenceAggregate, EvidenceState, EvidenceProvenance, DecisionSnapshot, LearnerState, MasteryState, ConfidenceState, LearningPath, ActionCandidate, RetentionState, TransferEvidence, ReadinessState.
- **Ranh giới bắt buộc:** Observation ≠ Evidence ≠ Aggregate ≠ Claim ≠ Mastery ≠ Readiness.
- **Nén:** không được làm mất khả năng giải thích mastery, tìm root cause, phát hiện model error, đánh giá transfer, recalibrate, audit readiness.
- **Garbage collection:** theo retention policy; không xoá critical evidence chỉ vì cũ.
- **Privacy:** local-first, không bắt buộc tài khoản, export/import, privacy by design, không bán dữ liệu, analytics ẩn danh chỉ khi đồng ý.
  - Local data gồm: Runtime State, Evidence State, Evidence Ledger, Critical Evidence, Temporary Raw Observation.
  - Standard Export: Learner State + Evidence State + Important Evidence + Decision Snapshots.
  - Full Research Export: thêm raw observation + provenance.
- **Deterministic core (§89):** structured content, rule-based evaluation, deterministic scoring, Bayesian/Beta mastery, graph algorithms, FSRS, adaptive rules.

## XXI. Roadmap MVP (M1–M10 của v2.4)

1. **M1** Universal Learning Foundation
2. **M2** Learner State + Evidence
3. **M3** Evidence Lifecycle
4. **M4** Continuous Diagnostic
5. **M5** Play-Driven Adaptive Engine
6. **M6** Micro Learning
7. **M7** Retention + Transfer
8. **M8** CEFR Readiness
9. **M9** Founder Validation
10. **M10** Target Extensibility Test (thêm IELTS hoặc Daily Communication)

Ánh xạ sang bản phát hành: lộ trình v52 → v62 ở cuối `docs/SPEC.md`.

## XXII. Hard Gates HG1–HG34

| HG | Nội dung |
|---|---|
| HG1 | Target Integrity |
| HG2 | Graph Integrity |
| HG3 | Evidence Integrity |
| HG4 | Observation/Evidence Boundary |
| HG5 | Mastery Validity |
| HG6 | Diagnostic Validity |
| HG7 | Learning Path Validity |
| HG8 | NBA Validity |
| HG9 | Micro Learning Validity |
| HG10 | Transfer Validity |
| HG11 | Readiness Validity |
| HG12 | Game/Language Separation |
| HG13 | Evidence Efficiency |
| HG14 | Learner Effort |
| HG15 | Retention |
| HG16 | Model Correction |
| HG17 | No Runtime AI |
| HG18 | Content Coverage |
| HG19 | CEFR Multidimensionality |
| HG20 | Motivation Integrity |
| HG21 | Engine/Target Separation |
| HG22 | Target Extensibility |
| HG23 | Target Integrity (target mới) |
| HG24 | Play-Driven Learning |
| HG25 | Micro-Intervention |
| HG26 | Evidence Preservation |
| HG27 | Evidence Lifecycle |
| HG28 | Information-Preserving Aggregation |
| HG29 | Provenance |
| HG30 | Decision Explainability |
| HG31 | Evidence Reusability |
| HG32 | Data Efficiency |
| HG33 | Recalibration |
| HG34 | Privacy |

## XXIII. Success metrics, Ultimate Test, Definition of Done

**Metrics:**
- Learning Efficiency
- Evidence Efficiency
- Diagnostic Accuracy
- Mastery Validity
- Retention
- Transfer
- Path Efficiency
- Readiness Accuracy
- Persistence
- Evidence Storage Efficiency
- Decision Explainability
- Model Recoverability

Không đánh giá chủ yếu bằng DAU, session length, XP, streak, completion.

**Ultimate Product Test (16 câu):**
1. Target?
2. Cần gì?
3. Đang biết gì?
4. Chắc đến đâu?
5. Thiếu gì?
6. Vì sao thiếu?
7. Làm gì tiếp?
8. Thành gameplay được không?
9. Đã thật sự biết chưa?
10. Còn nhớ không?
11. Dùng được ở context mới không?
12. Đạt CEFR chưa?
13. Còn thiếu gì?
14. Vì sao kết luận vậy?
15. Sửa được quyết định cũ không?
16. Có lưu dữ liệu vô nghĩa không?

**MVP Definition of Done:** Unknown Learner → Observe Through Play → Initial Model → Detect Gaps → Minimum Path → Play → Micro-Learn → Practice → Verify → Retain → Transfer → CEFR Readiness → Evidence-Based Achievement. Hệ thống phải chứng minh bằng dữ liệu 13 điều:
1. Vì sao học điều đó.
2. Vì sao không học thứ khác.
3. Evidence nào dẫn tới quyết định.
4. Evidence được đánh giá và aggregate thế nào.
5. Mastery xác nhận bằng gì.
6. Confidence và uncertainty bao nhiêu.
7. Còn thiếu gì.
8. Truy nguyên quyết định ra sao.
9. Model sửa được khi bằng chứng mâu thuẫn.
10. Dữ liệu nào giữ lâu và vì sao.
11. Dữ liệu nào bị aggregate hoặc loại bỏ và vì sao.
12. Storage không tăng vô nghĩa.
13. Learner đạt target thật hay chỉ đạt game score.

**Nguyên tắc cuối:** Collect broadly. Infer carefully. Preserve meaningfully. Compress intelligently. Retain what matters. Forget what does not.

**Một câu:** "Let the learner play; let the system discover what they need; preserve the evidence that matters; teach only what is necessary; and let them play again until the evidence proves they have achieved the goal."
