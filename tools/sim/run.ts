#!/usr/bin/env node
// Chạy bộ mô phỏng learner (src/engine/sim/sim.ts) và ghi docs/sim-report.md. Dùng: npm run sim
// Kết quả xác định (hạt giống cố định): chạy lại ra y hệt khi luật không đổi.
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../src/engine/sim/sim.ts';
import { RULE_ID, RULE } from '../../src/engine/ev/evaluate.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const pct = (x: number) => `${(x * 100).toFixed(1).replace('.', ',')}%`;
const n2 = (x: number) => x.toFixed(2).replace('.', ',');
const cal = S.calibration(600), ff = S.fpfn(800), dg = S.diagAccuracy(), gc = S.gameContamination(), sp = S.speedBias(), th = S.thresholdSensitivity();
const paths = [-1, 0, 1, 2].map(k => ({ k, ...S.pathEfficiencyAvg(20, k) }));
// v66 (C274): độ nhạy trọng số — đổi từng tham số của luật, giữ nguyên các tham số khác, đo lại dương tính / âm tính giả.
const sens = ([['slip', [0.05, 0.1, 0.2]], ['repeat', [0.3, 0.5, 0.7]], ['decay', [0.8, 0.9, 1]]] as const)
  .flatMap(([k, vs]) => vs.map(v => ({ k, v, ...S.fpfn(300, 11, { ...RULE, [k]: v }) })));
const L: string[] = [
  '# Báo cáo mô phỏng learner', '',
  `Sinh bởi \`npm run sim\` (tools/sim/run.ts → src/engine/sim/sim.ts), luật \`${RULE_ID}\`, ${new Date().toISOString().slice(0, 10)}.`, '',
  '> Learner ở đây là learner **giả lập** có trạng thái thật biết trước (biết/chưa biết, hiểu sai, quên, đoán mò, nhầm tay; kỹ năng chơi game và tốc độ độc lập với năng lực ngôn ngữ), chạy qua chính engine của app. Báo cáo này kiểm chứng **thuật toán** (tầng L2–L3 của Evaluation Framework). Nó **không** chứng minh người thật học được (L4–L5): việc đó cần dữ liệu người học thật.', '',
  '## 1. Dương tính giả / âm tính giả (C279, C280)', '',
  `- Dương tính giả (app báo Đạt nhưng learner không biết): **${pct(ff.fp)}** trên ${ff.passN} lần Đạt.`,
  `- Âm tính giả (learner biết, đã có ≥ 15 lượt, app chưa báo Đạt): **${pct(ff.fn)}** trên ${ff.knowN} trường hợp.`,
  '- Engine được thiết kế dè dặt: thà đòi thêm bằng chứng còn hơn tuyên bố Đạt sai (spec P4, P19).', '',
  '## 2. Độ nhạy ngưỡng mastery (C272)', '', '| Ngưỡng m | Dương tính giả | Âm tính giả |', '|---|---|---|',
  ...th.map(t => `| ${n2(t.thr)}${t.thr === 0.8 ? ' (đang dùng)' : ''} | ${pct(t.fp)} | ${pct(t.fn)} |`), '',
  '## 3. Calibration (C256, C261)', '', `Sai số calibration kỳ vọng (ECE): **${n2(cal.ece)}**.`, '', '| m dự đoán | Số ô | m trung bình | Xác suất đúng thật |', '|---|---|---|---|',
  ...cal.bins.map(b => `| ${n2(b.lo)}–${n2(b.hi)} | ${b.n} | ${n2(b.pred)} | ${n2(b.obs)} |`), '',
  '**Nhận xét:** m của Beta là tỉ lệ đúng có trừ đoán mò, nhầm tay, *chưa* là xác suất đúng ở câu kế tiếp. Ở vùng 0,5–0,85, m thấp hơn xác suất thật (dè dặt), nên âm tính giả cao hơn dương tính giả. Hiệu chỉnh (isotonic) chỉ nên làm khi có dữ liệu người thật, vì hiệu chỉnh theo learner giả lập chỉ là khớp với giả định của chính bộ mô phỏng.', '',
  '## 4. Chẩn đoán (C281, C282)', '', `Learner có cấp thật 0–5, ${dg.runs} lượt chạy: sai số tuyệt đối trung bình **${n2(dg.mae)} cấp**, trung bình **${n2(dg.probes)} nút dò** (mỗi nút 3 câu).`, '',
  '## 5. Lộ trình thích ứng so với giáo trình cố định (C325, C333, C334)', '', 'Trung bình 20 learner, mục tiêu cấp 3 trên đồ thị tổng hợp 6 cấp × 8 nút. Cố định = học mọi nút cấp 0–3 theo thứ tự tới khi Đạt. Thích ứng = chẩn đoán → bỏ qua thứ đã biết → chỉ mở nút đủ tiền đề.', '',
  '| Learner đã biết tới cấp | Lượt (thích ứng) | Lượt (cố định) | Thích ứng / cố định | Cả hai xong |', '|---|---|---|---|---|',
  ...paths.map(p => `| ${p.k < 0 ? 'chưa biết gì' : p.k} | ${p.adaptive.toFixed(0)} | ${p.fixed.toFixed(0)} | ${pct(p.ratio)} | ${pct(p.done)} |`), '',
  '**Nhận xét:** lợi ích lớn nhất ở learner đã biết nhiều (bỏ qua được nhiều). Learner chỉ biết cấp 0 thì gần như hoà, vì chi phí bài chẩn đoán bù cho phần bỏ qua được. v56 sửa một lỗi mô phỏng này lộ ra: chẩn đoán đã chứng minh learner biết cấp ngay dưới ranh giới nhưng vẫn bắt học lại cấp đó.', '',
  '## 6. Kỹ năng chơi game và tốc độ không thành điểm ngôn ngữ (C343–C345, C373, HG12)', '',
  `- Hai nhóm learner cùng năng lực, kỹ năng chơi 0,95 so với 0,2, chơi có ép thời gian. Chênh lệch mastery trung bình: **${n2(gc.withEvaluator)}** với Evidence Evaluator (hết giờ ×0,3), so với **${n2(gc.naive)}** nếu coi hết giờ là sai đủ trọng số.`,
  `- Hai nhóm cùng năng lực, tốc độ 0,95 so với 0,05: chênh lệch mastery **${n2(sp)}** (tốc độ chỉ ghi lại, không vào trọng số).`, '',
  '## 7. Độ nhạy trọng số của luật (C274)', '', 'Đổi một tham số, giữ nguyên các tham số khác (300 learner). Kết luận Đạt ổn định khi dương tính giả giữ ở 0% trong cả dải.', '',
  '| Tham số | Giá trị | Dương tính giả | Âm tính giả |', '|---|---|---|---|',
  ...sens.map(x => `| ${x.k} | ${String(x.v).replace('.', ',')}${(RULE as Record<string, unknown>)[x.k] === x.v ? ' (đang dùng)' : ''} | ${pct(x.fp)} | ${pct(x.fn)} |`), '',
  '## Giới hạn', '', '- Learner giả lập đơn giản hơn người thật (học và quên theo xác suất cố định).', '- Đồ thị tổng hợp nhỏ hơn đồ thị thật (1.005 nút).', '- Các con số trên là bằng chứng cho tính đúng của thuật toán và để so sánh giữa các phiên bản luật, không phải dự báo hiệu quả học.', '',
];
writeFileSync(join(ROOT, 'docs/sim-report.md'), L.join('\n'));
console.log(`sim: FP ${pct(ff.fp)}, FN ${pct(ff.fn)}, ECE ${n2(cal.ece)}, chẩn đoán MAE ${n2(dg.mae)}, thích ứng/cố định ${paths.map(p => pct(p.ratio)).join(' ')} → docs/sim-report.md`);
