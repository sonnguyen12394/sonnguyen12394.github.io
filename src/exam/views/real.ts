// Ghi điểm thi thật (yêu cầu 5.11): lưu trên máy; nếu đã đồng ý chia sẻ thì gửi cặp "ước tính – điểm thật" ẩn danh.

import type { Ctx } from '../main.ts';
import { fmt, dayVi, back, SKILL_VI } from './ui.ts';

export function viewReal(c: Ctx): string {
  const { x, host } = c, esc = host.esc, vstep = x.exam === 'vstep';
  const max = vstep ? 10 : 9;
  const rows = x.real.filter(r => r.exam === x.exam).slice().reverse();
  return `<section class="stack"><span class="eyebrow">Ôn thi · Điểm thật</span><h1>Ghi điểm thi thật</h1>
    <p class="muted">Ghi điểm từng kỹ năng trên phiếu điểm ${vstep ? '(thang 10)' : '(band 0–9)'}. App so với ước tính lúc này để bạn biết app lệch bao nhiêu${x.share ? ', và gửi ẩn danh cặp số này để đo độ chính xác chung' : ''}.</p></section>
  <form class="panel stack" data-xform="real">
    <div class="fields">${(['L', 'R', 'W', 'S'] as const).map(k => `<label><span>${SKILL_VI[k]}</span><input class="field" type="number" name="${k}" inputmode="decimal" min="0" max="${max}" step="0.5" placeholder="—"></label>`).join('')}</div>
    <div class="row"><button class="btn primary">Lưu điểm thật</button></div></form>
  ${rows.length ? `<section class="panel stack"><h3>Đã ghi</h3><div class="tablewrap" tabindex="0" role="region" aria-label="Điểm thật đã ghi"><table class="tbl"><thead><tr><th>Ngày ghi</th>${(['L', 'R', 'W', 'S'] as const).map(k => `<th>${SKILL_VI[k]}</th>`).join('')}</tr></thead><tbody>
    ${rows.map(r => `<tr><td>${esc(dayVi(r.day))}</td>${(['L', 'R', 'W', 'S'] as const).map(k => `<td class="num">${r[k] === null ? '—' : fmt(r[k]!)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : ''}
  ${back()}`;
}
