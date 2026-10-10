// v101 Cảnh truyện (GAME-CRITERIA §10.13): lớp phủ toàn màn hình ngoài #app, từng khung thoại: nhân vật, câu tiếng Anh (gõ dần, có nút
// nghe), dịch tiếng Việt. Bàn phím: Enter / Space sang khung sau. Giảm chuyển động: hiện cả câu ngay. Bỏ qua = xem xong.

import { ACTS, ACT_BG, type Chapter } from './story.ts';
import { STILL } from './wheelview.ts';

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function openScene(c: Chapter, num: number, onDone: () => void, say?: (t: string) => void, mascot?: (m: 'happy' | 'party', n: number) => string): { close(): void } {
  document.getElementById('stfx')?.remove();
  const root = document.createElement('div'), [a, b] = ACT_BG[c.act]!, still = STILL();
  root.id = 'stfx'; root.className = 'stfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', `Cảnh truyện: ${c.title}`);
  root.style.background = `linear-gradient(160deg,${a},${b})`;
  document.body.appendChild(root); document.documentElement.classList.add('whopen');
  let i = 0, timer: ReturnType<typeof setInterval> | null = null, alive = true;
  const close = () => { if (!alive) return; alive = false; if (timer) clearInterval(timer); root.remove(); document.documentElement.classList.remove('whopen'); };
  const finish = () => { close(); onDone(); };
  const show = () => {
    const L = c.scene[i]!, last = i === c.scene.length - 1, [ico, ...nm] = L.who.split(' ');
    root.innerHTML = `<div class="sttop"><span class="steyebrow">📖 ${esc(ACTS[c.act]!)}${num ? ` · chương ${num}` : ''} · ${esc(c.title)}</span><button class="whb" data-st="skip" aria-label="Bỏ qua cảnh truyện">Bỏ qua ⏭</button></div>
      <div class="stpanel">
        <div class="stwho"><span class="stico" aria-hidden="true">${ico === '🐯' && mascot ? mascot(last ? 'party' : 'happy', 84) : ico}</span><b>${esc(nm.join(' ') || L.who)}</b></div>
        <p class="sten" lang="en" aria-live="polite"></p>
        <p class="stvi" lang="vi">${esc(L.vi)}</p>
        <div class="whrow">${say ? '<button class="whb wide" data-st="say" aria-label="Nghe câu tiếng Anh">🔊 Nghe</button>' : ''}<button class="whbig" data-st="next">${last ? (c.act === 0 ? '✨ Bắt đầu!' : '✓ Xong chương') : 'Tiếp ▸'}</button></div>
        <div class="stdots" aria-hidden="true">${c.scene.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      </div>`;
    const en = root.querySelector<HTMLElement>('.sten')!;
    if (timer) clearInterval(timer);
    if (still) en.textContent = L.en;
    else { let k = 0; en.textContent = ''; timer = setInterval(() => { k += 2; en.textContent = L.en.slice(0, k); if (k >= L.en.length && timer) { clearInterval(timer); timer = null; } }, 30); }
    setTimeout(() => root.querySelector<HTMLElement>('[data-st="next"]')?.focus(), 30);
  };
  root.addEventListener('click', e => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-st]'); if (!t) return;
    e.stopPropagation();
    const k = t.dataset.st, L = c.scene[i]!;
    if (k === 'say') say?.(L.en);
    else if (k === 'skip') finish();
    else if (k === 'next') {
      const en = root.querySelector<HTMLElement>('.sten')!;
      if (timer) { clearInterval(timer); timer = null; en.textContent = L.en; return; }   // đang gõ: chạm lần đầu hiện cả câu
      if (i < c.scene.length - 1) { i++; show(); } else finish();
    }
  });
  show();
  return { close };
}
