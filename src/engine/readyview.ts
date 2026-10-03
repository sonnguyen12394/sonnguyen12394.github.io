// Khối "Sẵn sàng" (Goal Readiness) và "Đạt mục tiêu" trên trang mục tiêu, tách khỏi tiến độ học (spec mục 19, §8).

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import type { Index } from './graph.ts';
import type { Goal } from './types.ts';
import { nodeStat } from './views.ts';
import { examOf, examReadiness, masteryReadiness, skillDists, type ExamReady, type MasteryReady, type SkillK } from './readiness.ts';
import { selfBias, type Conf, type RawGrade } from './grader.ts';
import { bandToVstep, roundHalf } from '../exam/scales.ts';

export type Ready = ExamReady | MasteryReady;

export function readinessOf(host: EHost, e: EState, g: Goal): Ready {
  if (examOf(g)) {
    const { resp, real } = host.exam();
    return examReadiness(g, skillDists(resp, host.grades() as RawGrade[], real, host.today()), real);
  }
  return masteryReadiness(g.req, r => nodeStat(host, e, r.node, r.level), host.lapse(), host.today());
}

const SK_VI: Record<SkillK, string> = { L: 'Nghe', R: 'Đọc', W: 'Viết', S: 'Nói' };
const CONF_VI: Record<Conf, string> = { low: 'tin cậy thấp', mid: 'tin cậy vừa', high: 'tin cậy cao' };
const SRC_VI: Record<string, string> = { irt: 'bài đã làm', real: 'điểm thi thật', rule: 'máy chấm luật', self: 'tự chấm', ai: 'AI chấm' };
const pct = (p: number): string => `${Math.round(p * 100)}%`;
const num = (x: number): string => String(x).replace('.', ',');

// Điểm trên thang kỳ thi (IELTS band, VSTEP thang 10) từ band liên tục.
const onScale = (r: ExamReady, band: number): string => num(r.exam === 'vstep' ? bandToVstep(band) : roundHalf(band));

export function readyChip(r: Ready): string {
  if (r.kind === 'exam') {
    if (r.achieved) return '<span class="pill" style="color:var(--good)">✓ Đã đạt bằng điểm thi thật</span>';
    return r.p === null ? `<span class="pill">Sẵn sàng: thiếu ${r.missing.map(k => SK_VI[k]).join(', ')}</span>` : `<span class="pill">Sẵn sàng: ${pct(r.p)}</span>`;
  }
  if (r.achieved) return '<span class="pill" style="color:var(--good)">✓ Đạt mục tiêu</span>';
  return `<span class="pill">Sẵn sàng: ${pct(r.p)}</span>`;
}

function missingActs(r: ExamReady): string {
  const b: string[] = [];
  if (r.missing.includes('L') || r.missing.includes('R')) b.push('<button class="btn small" data-xr="place">Kiểm tra Nghe + Đọc</button>');
  if (r.exam === 'vstep') {
    if (r.missing.includes('W')) b.push('<button class="btn small" data-act="vxnew" data-m="w">Thi thử Viết</button>');
    if (r.missing.includes('S')) b.push('<button class="btn small" data-act="vxnew" data-m="s">Thi thử Nói</button>');
  } else {
    if (r.missing.includes('W')) b.push(`<button class="btn small" data-act="vxnew" data-m="w" data-ex="${r.exam}">Thi thử Viết IELTS</button>`);
    if (r.missing.includes('S')) b.push(`<button class="btn small" data-act="vxnew" data-m="s" data-ex="${r.exam}">Thi thử Nói IELTS</button>`);
  }
  return b.length ? `<div class="row">${b.join('')}</div>` : '';
}

export function viewReady(host: EHost, g: Goal, r: Ready): string {
  const esc = host.esc;
  if (r.kind === 'mastery') {
    return `<section class="panel stack"><h3>Sẵn sàng · ${pct(r.p)}</h3>
      <p class="muted">${r.done}/${r.total} năng lực đã Đạt với độ tin cậy từ Vừa trở lên · ${r.perfDone}/${r.perfTotal} bài làm thật đã qua.</p>
      <p class="hint">${r.achieved ? '✓ Đạt mục tiêu: mọi năng lực và bài làm thật đã qua, không quên khi ôn trong 14 ngày.' : r.ready && r.lapse ? 'Đã đủ năng lực; còn chờ 14 ngày không quên khi ôn để xác nhận đạt.' : 'Mục tiêu này không có kỳ thi ngoài: đạt khi mọi năng lực Đạt, mọi bài làm thật qua và 14 ngày không quên khi ôn.'}</p></section>`;
  }
  const unit = r.exam === 'vstep' ? 'điểm VSTEP (trung bình 4 kỹ năng)' : 'band tổng';
  const rows = r.skills.map(s => {
    const d = s.dist;
    if (!d) return `<tr><td>${SK_VI[s.k]}</td><td colspan="3" class="hint">chưa có dữ liệu</td></tr>`;
    return `<tr><td>${SK_VI[s.k]}</td><td class="num">${onScale(r, d.mean)}</td><td class="num">${s.p === null ? '—' : pct(s.p)}</td><td class="hint">${esc(d.src.map(x => SRC_VI[x] ?? x).join(' + '))} · ${CONF_VI[d.conf]}</td></tr>`;
  }).join('');
  const { real } = host.exam(), grades = host.grades() as RawGrade[];
  const bias = (['W', 'S'] as const).map(k => ({ k, b: selfBias(grades, real, k) })).filter(x => x.b.n > 0);
  const head = r.achieved ? `<h3 style="color:var(--good)">✓ Đã đạt bằng điểm thi thật (${num(r.achieved.score)})</h3>`
    : r.p === null ? `<h3>Sẵn sàng: chưa đủ dữ liệu</h3><p class="muted">Cần ước tính đủ 4 kỹ năng mới tính được xác suất đạt ${esc(g.vi)}. Còn thiếu: ${r.missing.map(k => SK_VI[k]).join(', ')}.</p>`
    : `<h3>Sẵn sàng: ${pct(r.p)} khả năng đạt</h3><p class="muted">Nếu thi hôm nay: ${unit} khoảng ${num(r.lo!)}–${num(r.hi!)} (80% khả năng), giữa khoảng là ${num(r.mid!)}; cần ${num(r.need)}. ${r.ready ? 'Đã sẵn sàng (≥ 80%).' : 'Sẵn sàng khi khả năng đạt từ 80%.'}</p>`;
  return `<section class="panel stack">${head}
    <div class="tablewrap" tabindex="0" role="region" aria-label="Sẵn sàng từng kỹ năng"><table class="tbl"><thead><tr><th>Kỹ năng</th><th>Ước tính</th><th>Đạt mức cần</th><th>Nguồn</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="hint">Viết/Nói: tự chấm theo tiêu chí + máy chấm luật (độ dài, từ vựng, câu, lỗi chắc chắn sai). Chưa có AI chấm hoặc điểm thi thật để đối chiếu thì độ tin cậy tối đa là Vừa.${bias.length ? ' ' + bias.map(x => `${SK_VI[x.k]}: bạn tự chấm ${x.b.bias >= 0 ? 'cao' : 'thấp'} hơn điểm thật ${num(Math.abs(Math.round(x.b.bias * 10) / 10))} band (${x.b.n} lần đối chiếu), app đã trừ độ lệch này.`).join(' ') : ''}</p>
    ${missingActs(r)}
    <div class="row"><button class="btn ghost small" data-xr="real">Ghi điểm thi thật</button></div>
    <p class="hint">Mục tiêu kỳ thi chỉ được xác nhận đạt bằng điểm thi thật.</p></section>`;
}
