// Vòng Chữ (v93): thẻ lớn ở sảnh (game chủ lực, chương hiện tại, thử thách ngày) và màn phía sau lớp phủ (khi đóng lớp phủ: tổng kết).

import type { ECtx } from './views.ts';
import { chapterOf, curve, CHAPTERS, type WheelSave } from './wordwheel.ts';
import type { WheelState } from './wheelview.ts';

export function viewWheelHero(c: ECtx, sv: WheelSave, today: number): string {
  const ch = chapterOf(sv.lv), w = curve(sv.lv), dailyDone = sv.daily.day === today && sv.daily.done;
  return `<section class="whhero" style="background:linear-gradient(135deg,${ch.a},${ch.b})">
    <h2>🎡 Vòng Chữ</h2>
    <p>Màn ${sv.lv} · chương ${Math.floor((sv.lv - 1) / 10) + 1} “${c.host.esc(ch.vi)}” · ${w.len} chữ cái, ${w.slots} từ · ⭐ ${sv.stars}</p>
    <div class="whrow" style="justify-content:flex-start"><button class="whbig" data-e="whstart">▶ Chơi màn ${sv.lv}</button>
      <button class="whb wide" data-e="whdaily"${dailyDone ? ' aria-disabled="true"' : ''}>📅 ${dailyDone ? 'Đã xong thử thách ngày' : 'Thử thách ngày'}${sv.daily.streak > 1 && sv.daily.day >= today - 1 ? ` · 🔥 ${sv.daily.streak} ngày` : ''}</button></div>
    ${viewBook(c, sv)}
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

// v94 Sổ từ (M8): mọi từ đã tìm ra, xếp theo chương; chạm để nghe. Từ gặp nhiều lần có dấu ⭐.
function viewBook(c: ECtx, sv: WheelSave): string {
  const esc = c.host.esc, xs = Object.entries(sv.book);
  if (!xs.length) return '<p>📖 Sổ từ trống: mỗi từ bạn tìm ra sẽ vào đây.</p>';
  const by = new Map<number, Array<[string, [string, number, number]]>>();
  for (const x of xs) { const k = x[1][1]; if (!by.has(k)) by.set(k, []); by.get(k)!.push(x); }
  const body = [...by.entries()].sort((a, b) => a[0] - b[0]).map(([k, ws]) => `<h3 style="margin:8px 0 4px;font-size:15px">${esc(CHAPTERS[k % CHAPTERS.length]!.vi)} · ${ws.length} từ</h3>
    <div class="whbook">${ws.sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([w, v]) => `<button class="whw" data-say="${esc(w)}" lang="en" aria-label="${esc(w)}: ${esc(v[0])}. Nghe"><b>${esc(w)}</b>${v[2] >= 3 ? ' ⭐' : ''}<small lang="vi">${esc(v[0])}</small></button>`).join('')}</div>`).join('');
  return `<details class="whbookbox"><summary>📖 Sổ từ · ${xs.length} từ</summary>${body}</details>`;
}

// v95 Mỏ Chữ: thẻ ở sảnh và màn phía sau lớp phủ.
import type { HuntSave } from './wordhunt.ts';
import type { HuntState } from './huntview.ts';
const HTH = [['#2a1052', '#0b0620', 'Hang pha lê'], ['#4a2a06', '#140a02', 'Mỏ vàng'], ['#073b4c', '#03141c', 'Hang băng']] as const;
export function viewHuntHero(c: ECtx, sv: HuntSave, today: number): string {
  const t = HTH[Math.floor((sv.lv - 1) / 10) % HTH.length]!, dailyDone = sv.daily.day === today && sv.daily.done;
  return `<section class="whhero" style="background:linear-gradient(135deg,${t[0]},${t[1]})">
    <h2>⛏️ Mỏ Chữ</h2>
    <p>Màn ${sv.lv} · “${c.host.esc(t[2])}” · vuốt ô kề nhau thành từ · ⭐ ${sv.stars} · kỷ lục ${sv.best} điểm</p>
    <div class="whrow" style="justify-content:flex-start"><button class="whbig" data-e="hnstart">▶ Khai thác màn ${sv.lv}</button>
      <button class="whb wide" data-e="hndaily"${dailyDone ? ' aria-disabled="true"' : ''}>📅 ${dailyDone ? 'Đã xong mỏ hôm nay' : 'Mỏ hôm nay'}${sv.daily.streak > 1 && sv.daily.day >= today - 1 ? ` · 🔥 ${sv.daily.streak} ngày` : ''}</button></div>
  </section>`;
}
export function viewHuntBehind(c: ECtx, r: HuntState & { over: boolean }, sv: HuntSave, open: boolean): string {
  const esc = c.host.esc;
  if (!r.over) return `<section class="stack"><span class="eyebrow">⛏️ Mỏ Chữ</span><h1>${esc(r.title)}</h1>${open ? '<p class="hint">Màn chơi đang mở toàn màn hình.</p>' : '<div class="row"><button class="btn primary" data-e="hnopen">▶ Mở lại màn chơi</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>'}</section>`;
  const ms = r.missions.map(m => `<li>${r.done.has(m.en) ? '✓' : '·'} <b lang="en">${esc(m.en)}</b> · ${esc(m.vi)}</li>`).join('');
  return `<section class="stack"><span class="eyebrow">⛏️ Mỏ Chữ</span><h1>${r.win ? (r.daily ? '📅 Xong mỏ hôm nay!' : `⛏️ Qua màn ${sv.lv - 1}!`) : '⛏️ Hết lượt vuốt'}</h1>
    <p style="font-size:20px">${r.win ? '⭐'.repeat(r.win.stars) + ' · ' : ''}${r.score} điểm · +${r.gained} xu · ${r.done.size}/${r.missions.length} từ nhiệm vụ</p>
    <details><summary>Từ nhiệm vụ của màn</summary><ul>${ms}</ul></details>
    <p class="hint">Mỗi từ nhiệm vụ của cụm đang học bạn tự tìm ra được ghi vào bản đồ năng lực. Điểm, xu và màn chỉ để vui.</p></section>
    <div class="row">${r.win ? (r.daily ? '<button class="btn primary" data-e="hnshare">📤 Chia sẻ</button>' : '<button class="btn primary" data-e="hnstart">▶ Màn tiếp</button>') : '<button class="btn primary" data-e="hnstart">↺ Chơi lại</button>'}<button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
