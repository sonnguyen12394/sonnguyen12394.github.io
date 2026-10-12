// v101 Cảnh truyện (GAME-CRITERIA §10.13): lớp phủ toàn màn hình ngoài #app, từng khung thoại: nhân vật, câu tiếng Anh (gõ dần, có nút
// nghe), dịch tiếng Việt. Bàn phím: Enter / Space sang khung sau. Giảm chuyển động: hiện cả câu ngay. Bỏ qua = xem xong.
// v128 (§14): khung LỰA CHỌN (đổi lời thoại về sau và cảnh kết) và khung "BẠN NÓI": người chơi tự nói (máy nghe) hoặc gõ câu trả lời
// cho cư dân; khớp thì cư dân hiểu. Không bắt buộc: luôn có nút Tiếp, nên không chặn truyện.

import { ACTS, ACT_BG, sayOk, type Chapter, type Line, type StoryFlag } from './story.ts';
import { STILL } from './wheelview.ts';
import { sfx } from './sfx.ts';

const esc = (t: string) => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface SceneX {
  flags(): Partial<Record<StoryFlag, string>>;
  pick?(f: StoryFlag, v: string): void;
  mic?: { has(): boolean; hear(key: string): void; heard(key: string): { heard: string; alts: string[] } | null; busy(key: string): boolean | string };
  spoke?(via: 'mic' | 'type', ok: boolean, text: string): void;
}

export function openScene(c: Chapter, num: number, onDone: () => void, say?: (t: string) => void, mascot?: (m: 'happy' | 'party', n: number) => string, x?: SceneX): { close(): void } {
  document.getElementById('stfx')?.remove();
  const root = document.createElement('div'), [a, b] = ACT_BG[c.act]!, still = STILL();
  root.id = 'stfx'; root.className = 'stfx'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', `Cảnh truyện: ${c.title}`);
  root.style.background = `linear-gradient(160deg,${a},${b})`;
  document.body.appendChild(root); document.documentElement.classList.add('whopen');
  const flags = () => x?.flags() ?? {};
  // Lựa chọn chỉ hiện khi chưa chọn (xem lại cảnh cũ: theo lựa chọn đã có); câu phụ thuộc cờ tính lại sau mỗi lựa chọn.
  const showPick = new Set(c.scene.filter(l => l.pick && !flags()[l.pick.f]));
  const vis = (): Line[] => c.scene.filter(l => (l.pick ? showPick.has(l) : !l.if || flags()[l.if[0]] === l.if[1]));
  let i = 0, timer: ReturnType<typeof setInterval> | null = null, poll: ReturnType<typeof setInterval> | null = null, alive = true, said: { ok: boolean; text: string; miss: string[] } | null = null, micN = 0;
  const stopPoll = () => { if (poll) { clearInterval(poll); poll = null; } };
  const close = () => { if (!alive) return; alive = false; if (timer) clearInterval(timer); stopPoll(); root.remove(); document.documentElement.classList.remove('whopen'); };
  const finish = () => { close(); onDone(); };
  const key = () => `st:${num}:${i}:${micN}`;
  const answer = (text: string, via: 'mic' | 'type') => {
    const L = vis()[i]!, r = sayOk(L.en, text);
    said = { ok: r.ok, text, miss: r.miss }; x?.spoke?.(via, r.ok, text);
    sfx(r.ok ? 'clear' : 'place'); show();
  };
  const show = () => {
    const ls = vis(), L = ls[i]!, last = i === ls.length - 1, [ico, ...nm] = L.who.split(' ');
    const mic = x?.mic?.has() ? x.mic : null, busy = mic ? mic.busy(key()) : false;
    const body = L.pick
      ? `<p class="sten" lang="en"></p><p class="stvi" lang="vi">${esc(L.vi)}</p><div class="stpick" role="group" aria-label="Bạn chọn">${L.pick.opts.map(([en, vi, v]) => `<button class="stopt" data-st="pick" data-v="${esc(v)}"><b lang="en">${esc(en)}</b><span lang="vi">${esc(vi)}</span></button>`).join('')}</div>
         <p class="stsmall">Lựa chọn này đổi lời thoại về sau và cảnh kết.</p>`
      : L.me
        ? `<p class="stsay">Đến lượt bạn: nói (hoặc gõ) câu này cho mọi người hiểu</p><p class="sten" lang="en"></p><p class="stvi" lang="vi">${esc(L.vi)}</p>
           ${said ? `<p class="${said.ok ? 'stok' : 'stno'}" role="status">${said.ok ? '✓ Mọi người hiểu bạn rồi!' : `Gần được rồi. Còn thiếu: <b lang="en">${esc(said.miss.slice(0, 4).join(', '))}</b>. Thử lại nhé (nói sai cũng không sao).`}</p>` : ''}
           ${said?.ok ? '' : `<div class="whrow">${mic ? `<button class="whb wide" data-st="mic" ${busy === true ? 'aria-busy="true"' : ''}>${busy === true ? '👂 Đang nghe…' : '🎙 Nói'}</button>` : ''}<form class="stform" data-st="form"><label class="sr-only" for="stin">Gõ câu tiếng Anh</label><input id="stin" name="t" lang="en" autocomplete="off" placeholder="Gõ câu tiếng Anh…"><button class="whb" type="submit">Gửi</button></form></div>`}`
        : `<p class="sten" lang="en" aria-live="polite"></p><p class="stvi" lang="vi">${esc(L.vi)}</p>`;
    root.innerHTML = `<div class="sttop"><span class="steyebrow">📖 ${esc(ACTS[c.act]!)}${num ? ` · chương ${num}` : ''} · ${esc(c.title)}</span><button class="whb" data-st="skip" aria-label="Bỏ qua cảnh truyện">Bỏ qua ⏭</button></div>
      <div class="stpanel${L.me ? ' stme' : ''}">
        <div class="stwho"><span class="stico" aria-hidden="true">${ico === '🐯' && mascot ? mascot(last ? 'party' : 'happy', 84) : ico}</span><b>${esc(nm.join(' ') || L.who)}</b></div>
        ${body}
        <div class="whrow">${say ? '<button class="whb wide" data-st="say" aria-label="Nghe câu tiếng Anh">🔊 Nghe</button>' : ''}${L.pick ? '' : `<button class="whbig" data-st="next">${last ? (c.act === 0 ? '✨ Bắt đầu!' : '✓ Xong chương') : L.me && !said?.ok ? 'Bỏ qua ▸' : 'Tiếp ▸'}</button>`}</div>
        <div class="stdots" aria-hidden="true">${ls.map((_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('')}</div>
      </div>`;
    const en = root.querySelector<HTMLElement>('.sten')!;
    if (timer) clearInterval(timer);
    if (still || L.me) en.textContent = L.en;
    else { let k = 0; en.textContent = ''; timer = setInterval(() => { k += 2; en.textContent = L.en.slice(0, k); if (k >= L.en.length && timer) { clearInterval(timer); timer = null; } }, 30); }
    setTimeout(() => root.querySelector<HTMLElement>(L.pick ? '[data-st="pick"]' : '[data-st="next"]')?.focus(), 30);
  };
  const go = () => { stopPoll(); said = null; micN++; const n = vis().length; if (i < n - 1) { i++; show(); } else finish(); };
  root.addEventListener('submit', e => {
    const f = (e.target as HTMLElement).closest<HTMLFormElement>('[data-st="form"]'); if (!f) return;
    e.preventDefault(); e.stopPropagation();
    const v = String(new FormData(f).get('t') ?? '').trim(); if (v) answer(v, 'type');
  });
  root.addEventListener('click', e => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-st]'); if (!t || t.tagName === 'FORM') return;
    e.stopPropagation();
    const k = t.dataset.st, L = vis()[i]!;
    if (k === 'say') say?.(L.en);
    else if (k === 'skip') finish();
    else if (k === 'pick' && L.pick) { x?.pick?.(L.pick.f, t.dataset.v ?? ''); sfx('ok'); go(); }
    else if (k === 'mic' && x?.mic) {
      const m = x.mic; micN++; const kk = key(); m.hear(kk); show();
      stopPoll(); poll = setInterval(() => { if (!alive) return stopPoll(); const h = m.heard(kk); const bz = m.busy(kk);
        if (h) { stopPoll(); answer([h.heard, ...h.alts].find(s => sayOk(L.en, s).ok) ?? h.heard, 'mic'); } else if (bz !== true) { stopPoll(); show(); } }, 400);
    }
    else if (k === 'next') {
      const en = root.querySelector<HTMLElement>('.sten')!;
      if (timer) { clearInterval(timer); timer = null; en.textContent = L.en; return; }   // đang gõ: chạm lần đầu hiện cả câu
      go();
    }
  });
  show();
  return { close };
}
