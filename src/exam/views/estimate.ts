// Khối "Band ước tính" trên trang Ôn thi: từng kỹ năng, khoảng sai số, CEFR, quy đổi VSTEP; điểm tổng khi đủ 4 kỹ năng.

import type { Ctx } from '../main.ts';
import { profile, MIN_N, type SkillEst } from '../estimate.ts';
import { bandToVstep } from '../scales.ts';
import { hiddenItems } from '../net.ts';
import { itemParams } from '../packs.ts';
import { fmt, SKILL_VI } from './ui.ts';

function cell(s: SkillEst, vstep: boolean): string {
  if (s.band === null) {
    const need = s.skill === 'L' || s.skill === 'R' ? `làm thêm ${Math.max(1, MIN_N - s.n)} câu` : 'làm bài thi thử';
    return `<div class="stat"><span class="muted">${SKILL_VI[s.skill]}</span><b>—</b><span class="hint">Chưa đủ dữ liệu: ${need}</span></div>`;
  }
  const lo = Math.max(0, s.band - s.pm!), hi = Math.min(9, s.band + s.pm!);
  const main = vstep ? `${fmt(s.vstep!)}/10` : fmt(s.band);
  const range = vstep ? `${fmt(bandToVstep(lo))}–${fmt(bandToVstep(hi))}` : `${fmt(lo)}–${fmt(hi)}`;
  return `<div class="stat"><span class="muted">${SKILL_VI[s.skill]}</span><b class="num">${main}</b>
    <span class="hint">khoảng ${range} · ${s.cefr}${vstep ? ` · band ≈ ${fmt(s.band)}` : ` · VSTEP ≈ ${fmt(s.vstep!)}`}</span></div>`;
}

export function estimatePanel(c: Ctx): string {
  const vstep = c.x.exam === 'vstep';
  const p = profile(c.x, c.host.today(), hiddenItems(), itemParams);
  const total = p.overall === null ? '' : vstep
    ? `<p>Trung bình 4 kỹ năng: <b>${fmt(p.vstep!.mean)}</b> → <b>${p.vstep!.level}</b> (ước tính).</p>`
    : `<p>Điểm tổng ước tính: <b>${fmt(p.overall)}</b>.</p>`;
  return `<section class="panel stack" aria-labelledby="xest"><div class="spread"><h3 id="xest">${vstep ? 'Điểm VSTEP ước tính' : 'Band IELTS ước tính'}</h3>
      <button class="btn ghost small" data-x="route" data-r="scales">Cách tính</button></div>
    <div class="me-stats">${(['L', 'R', 'W', 'S'] as const).map(k => cell(p[k], vstep)).join('')}</div>
    ${total}
    <p class="hint">Ước tính của app, không phải điểm thi chính thức. Khoảng là độ tin cậy 80%: làm càng nhiều câu, khoảng càng hẹp. Nghe, Đọc tính từ các câu bạn làm trong 90 ngày gần nhất.</p></section>`;
}
