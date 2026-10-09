// Màn "Đo tiến bộ" (v63): trạng thái các lần đo và báo cáo hiệu quả học trên chính máy người học.

import type { ECtx } from './views.ts';
import { PHASE_VI, MEASURE, type MeasureSave, type Phase, type Report } from './measure.ts';

const pc = (x: number | null): string => (x === null ? '—' : `${Math.round(x * 100)}%`);
const iso = (d: number): string => new Date(d * 86400000).toISOString().slice(0, 10);

export function viewMeasure(c: ECtx, ms: MeasureSave | undefined, nx: { phase: Phase; due: boolean; at: number } | null, r: Report): string {
  const rows = (['pre', 'post', 'd7', 'd30'] as Phase[]).map(ph => {
    const ck = ms?.checks.find(x => x.phase === ph);
    return `<tr><td>${PHASE_VI[ph]}</td><td class="num">${ck ? `${ck.got}/${ck.of}` : '—'}</td><td>${ck ? iso(ck.day) : nx?.phase === ph ? (nx.due ? 'đến hạn' : `từ ${iso(nx.at)}`) : ''}</td></tr>`;
  }).join('');
  const gain = r.gain === null ? '' : `<p><b>Mức tăng:</b> ${r.gain >= 0 ? '+' : ''}${Math.round(r.gain * 100)} điểm phần trăm${r.perHour !== null ? ` (≈ ${Math.round(r.perHour * 100)} điểm mỗi giờ học, thời gian học ước tính)` : ''}.</p>`;
  const keep = r.keep7 !== null || r.keep30 !== null ? `<p><b>Giữ lại:</b> sau 7 ngày ${pc(r.keep7)}, sau 30 ngày ${pc(r.keep30)} so với lần đo sau khi học.</p>` : '';
  return `<section class="stack"><span class="eyebrow">Đo tiến bộ</span><h1>Bạn tiến bộ thật bao nhiêu?</h1>
    <p class="muted">${MEASURE.size} câu ngữ cảnh mới chọn đều trên mục tiêu, giữ riêng: không xuất hiện khi luyện hay chơi, nên đo được bạn dùng được thật chứ không phải nhớ câu. Đo lúc bắt đầu, sau ${MEASURE.postAfter} ngày học, rồi sau 7 và 30 ngày để xem có nhớ lâu. Khi đo, app không hiện đáp án; các lần đo sau dùng câu khác cùng phần (dạng song song) để bạn không quen câu.</p></section>
    <div class="tablewrap" tabindex="0" role="region" aria-label="Các lần đo"><table class="tbl"><thead><tr><th>Lần đo</th><th>Đúng</th><th>Ngày</th></tr></thead><tbody>${rows}</tbody></table></div>
    ${gain}${keep}
    <p class="hint">Đây là số đo trên chính bạn, không phải nghiên cứu có nhóm đối chứng. Câu đo hiện chỉ gồm từ vựng; ngữ pháp cần kho câu riêng chưa có.</p>
    <div class="row">${nx ? `<button class="btn primary" data-e="mstart" ${nx.due ? '' : 'disabled'}>${nx.due ? `${PHASE_VI[nx.phase]} (${MEASURE.size} câu)` : `${PHASE_VI[nx.phase]}: từ ${iso(nx.at)}`}</button>` : '<span class="pill good">Đã đo đủ 4 lần</span>'}<button class="btn ghost" data-e="go" data-r="today">Lộ trình hôm nay</button></div>`;
}
