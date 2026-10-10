// Vòng Chữ (v93): thẻ lớn ở sảnh (game chủ lực, chương hiện tại, thử thách ngày) và màn phía sau lớp phủ (khi đóng lớp phủ: tổng kết).

import type { ECtx } from './views.ts';
import { chapterOf, curve, type WheelSave } from './wordwheel.ts';
import type { WheelState } from './wheelview.ts';

export function viewWheelHero(c: ECtx, sv: WheelSave, today: number): string {
  const ch = chapterOf(sv.lv), w = curve(sv.lv), dailyDone = sv.daily.day === today && sv.daily.done;
  return `<section class="whhero" style="background:linear-gradient(135deg,${ch.a},${ch.b})">
    <h2>🎡 Vòng Chữ</h2>
    <p>Màn ${sv.lv} · chương ${Math.floor((sv.lv - 1) / 10) + 1} “${c.host.esc(ch.vi)}” · ${w.len} chữ cái, ${w.slots} từ · ⭐ ${sv.stars}</p>
    <div class="whrow" style="justify-content:flex-start"><button class="whbig" data-e="whstart">▶ Chơi màn ${sv.lv}</button>
      <button class="whb wide" data-e="whdaily"${dailyDone ? ' aria-disabled="true"' : ''}>📅 ${dailyDone ? 'Đã xong thử thách ngày' : 'Thử thách ngày'}</button></div>
  </section>`;
}

export function viewWheelBehind(c: ECtx, r: WheelState & { done: boolean; mode: string }, sv: WheelSave, open: boolean): string {
  const esc = c.host.esc;
  if (!r.done) return `<section class="stack"><span class="eyebrow">🎡 Vòng Chữ</span><h1>${esc(r.title)}</h1>${open ? '<p class="hint">Màn chơi đang mở toàn màn hình.</p>' : '<div class="row"><button class="btn primary" data-e="whopen">▶ Mở lại màn chơi</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>'}</section>`;
  const words = r.level.slots.map(s => `<li><b lang="en">${esc(s.en)}</b> · ${esc(s.vi)}</li>`).join('');
  return `<section class="stack"><span class="eyebrow">🎡 Vòng Chữ</span><h1>${r.daily ? '📅 Xong thử thách ngày!' : `🎡 Qua màn ${sv.lv - 1}!`}</h1>
    <p style="font-size:20px">${'⭐'.repeat(r.win?.stars ?? 1)} · +${r.gained} xu · ${r.found.size} từ${r.bonusFound.size ? ` + ${r.bonusFound.size} từ thưởng` : ''}</p>
    <details><summary>Các từ của màn</summary><ul>${words}</ul></details>
    <p class="hint">Mỗi từ của cụm đang học bạn tự tìm ra được ghi vào bản đồ năng lực (nhớ ra từ theo nghĩa). Sao, xu và màn chỉ để vui.</p></section>
    <div class="row">${r.daily ? '<button class="btn primary" data-e="whshare">📤 Chia sẻ</button>' : '<button class="btn primary" data-e="whstart">▶ Màn tiếp</button>'}<button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
