// Màn Thám tử (v78, đọc) và Đài phát thanh (v79, nghe). Chỉ trình bày: bài do engine chọn (main.ts), luật ở detective.ts.

import type { ECtx } from './views.ts';
import type { ReadText, ReadQ } from './host.ts';
import { sentences, evidence, caseStars, solved } from './detective.ts';

export interface CaseRun {
  mode: 'read' | 'listen'; floor: number; seed: number; t0: number; node: string; text: ReadText; qs: ReadQ[]; opts: Array<{ opts: string[]; ans: number }>;
  i: number; first: Array<boolean | null>; flipped: boolean[]; retry: boolean; ans: { ok: boolean; i: number; coins: number; retry: boolean } | null;
  ok: number; coins: number; done: boolean; plays: number;
  gloss: Record<string, { vi: string; learned: boolean }>; look: string | null; looked: number;   // v78: chạm từ trong hồ sơ để xem nghĩa
}

const head = (c: ECtx, r: CaseRun): string => {
  const esc = c.host.esc, n = r.qs.length, f = r.flipped.filter(Boolean).length;
  const cards = r.qs.map((_, k) => `<span class="dtclue${r.flipped[k] ? ' on' : ''}${k === r.i && !r.done ? ' cur' : ''}" aria-hidden="true">${r.flipped[k] ? (r.mode === 'read' ? '🔍' : '📶') : k === n - 1 && r.qs[k]?.k === 'main' ? '⭐' : '🔒'}</span>`).join('');
  const t = r.text, top = r.mode === 'read'
    ? `<span class="eyebrow">🔍 Thám tử · hồ sơ #${r.floor} · manh mối ${Math.min(r.i + 1, n)}/${n}</span>`
    : `<span class="eyebrow">📻 Đài phát thanh · ${(88 + (r.floor % 50) * 0.4).toFixed(1)} MHz · câu ${Math.min(r.i + 1, n)}/${n}</span>`;
  const noise = r.mode === 'listen' ? `<div class="rdwave" role="img" aria-label="Tiếng rè còn ${Math.round((1 - f / Math.max(1, n)) * 100)}%">${Array.from({ length: 16 }, (_, k) => { const q = 1 - f / Math.max(1, n), wave = 0.5 + 0.45 * Math.sin(k * 0.8), hiss = ((k * 37) % 11) / 11; return `<i style="height:${Math.round(15 + 80 * ((1 - q) * wave + q * hiss))}%;opacity:${(0.45 + 0.55 * (1 - q)).toFixed(2)}"></i>`; }).join('')}</div>` : '';
  return `<section class="stack" style="gap:6px"><div class="spread">${top}<span>🪙 ${r.coins}</span></div>
    <p class="hint">${esc(t.kind)} · <b lang="en">${esc(t.title)}</b>${t.tvi ? ` · ${esc(t.tvi)}` : ''}</p><div class="row" style="gap:6px">${cards}</div>${noise}</section>`;
};

// Văn bản (đọc): luôn hiện để đọc lại; khi sai, tô sáng câu chứa đáp án.
function doc(c: ECtx, r: CaseRun, mark: number): string {
  const esc = c.host.esc, ss = sentences(r.text.paras);
  const words = (s: string) => s.split(/([A-Za-z][A-Za-z'-]{3,})/).map((p, k) => (k % 2 && r.gloss[p.toLowerCase()] ? `<button class="dtw${r.gloss[p.toLowerCase()]!.learned ? '' : ' new'}" data-e="dtgloss" data-w="${esc(p.toLowerCase())}">${esc(p)}</button>` : esc(p))).join('');
  const look = r.look && r.gloss[r.look] ? `<p class="dtlook" role="status"><b lang="en">${esc(r.look)}</b> = ${esc(r.gloss[r.look]!.vi)} <button class="btn ghost small" data-say="${esc(r.look)}">🔊</button></p>` : '';
  return `<article class="dtdoc" lang="en">${ss.map((s, k) => (k === mark ? `<mark>${words(s)}</mark>` : words(s))).join(' ')}</article>${look || '<p class="hint">Chạm một từ gạch chân để xem nghĩa (từ chưa học gạch đậm).</p>'}`;
}
const player = (c: ECtx, r: CaseRun, tts: boolean): string => tts
  ? `<div class="row"><button class="btn${r.plays ? '' : ' primary'}" data-e="rdplay">▶ ${r.plays ? 'Nghe lại' : 'Phát bản tin'}</button><button class="btn ghost" data-e="rdplay" data-slow="1">🐢 Nghe chậm</button></div>`
  : `<p class="muted">Máy này không có giọng đọc tiếng Anh nên chưa nghe được bản tin.</p>`;

export function viewCase(c: ECtx, r: CaseRun, tts: boolean): string {
  const esc = c.host.esc, q = r.qs[r.i]!, o = r.opts[r.i]!, a = r.ans, read = r.mode === 'read';
  const mark = a && !a.ok && read ? evidence(r.text.paras, q) : -1;
  const body = read ? doc(c, r, mark) : player(c, r, tts);
  const label = q.k === 'main' && r.i === r.qs.length - 1 ? (read ? '⭐ Kết luận vụ án' : '⭐ Ý chính của bản tin') : read ? `🔒 Manh mối ${r.i + 1}` : `📶 Câu ${r.i + 1}`;
  const opts = `<div class="stack" style="gap:8px">${o.opts.map((t, k) => {
    const cls = a ? (k === o.ans && a.ok ? ' right' : k === a.i && !a.ok ? ' wrong' : '') : '';
    return `<button class="btn${cls}" style="justify-content:flex-start" data-e="dtans" data-i="${k}" ${a ? 'disabled' : ''} lang="en">${esc(t)}</button>`;
  }).join('')}${a ? '' : '<button class="btn ghost" data-e="dtans" data-i="-1">Không biết</button>'}</div>`;
  let fb = '';
  if (a) {
    const ev = !read && !a.ok ? sentences(r.text.lines?.map(l => l.t) ?? r.text.paras)[evidence(r.text.lines?.map(l => l.t) ?? r.text.paras, q)] : '';
    fb = `<div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? (read ? 'Đúng manh mối!' : 'Nghe đúng!') : a.retry ? 'Chưa đúng' : read ? 'Manh mối chưa khớp' : 'Chưa nghe ra'}</strong>
      ${a.ok ? '' : `<span>Đáp án: <b lang="en">${esc(q.a)}</b></span>${read && mark >= 0 ? '<span class="hint">Câu chứa đáp án được tô sáng trong hồ sơ.</span>' : ''}${ev ? `<span>Đoạn có đáp án: <i lang="en">“${esc(ev)}”</i></span>` : ''}`}${!a.ok && q.why ? `<span class="hint">💡 ${esc(q.why)}</span>` : ''}${a.retry ? '<span class="hint">Lần thử lại chỉ để lật thẻ, không tính điểm.</span>' : `<span class="hint">+${a.coins} xu</span>`}</div>
      <div class="row">${!a.ok && !a.retry ? `<button class="btn" data-e="dtretry">↺ ${read ? 'Đọc lại và thử lại' : 'Nghe lại và thử lại'}</button>` : ''}<button class="btn primary" data-e="dtnext" id="qnextbtn">${r.i + 1 >= r.qs.length ? (read ? 'Đóng hồ sơ' : 'Tắt đài') : 'Tiếp ▸'}</button></div>`;
  }
  return `${head(c, r)}${body}<p class="hint">${label}${r.retry ? ' · thử lại' : ''}</p><p style="font-size:18px;font-weight:600" lang="en">${esc(q.q)}</p>${opts}${fb}`;
}

export function viewCaseEnd(c: ECtx, r: CaseRun, total: number): string {
  const esc = c.host.esc, n = r.qs.length, read = r.mode === 'read', win = solved(r.ok, n), s = caseStars(r.ok, n);
  const title = read ? (win ? '🔍 Phá án!' : '🔍 Hồ sơ còn bỏ ngỏ') : win ? '📻 Bắt được sóng!' : '📻 Sóng còn rè';
  const script = !read && r.text.lines ? `<details><summary>Lời bản tin</summary><div class="stack" lang="en" style="gap:4px">${r.text.lines.map(l => `<p>${esc(l.t)}</p>`).join('')}</div></details>` : '';
  return `<section class="stack"><span class="eyebrow">${read ? '🔍 Thám tử' : '📻 Đài phát thanh'}</span><h1>${title}</h1>
    <p style="font-size:22px">${'⭐'.repeat(s)} · đúng ${r.ok}/${n} ${read ? 'manh mối' : 'câu'} ngay lần đầu · +${r.coins} xu</p>
    <p>${read ? `Sổ thám tử: ${total} hồ sơ đã phá.` : `Kệ băng: ${total} bản tin đã bắt sóng.`}</p>${script}
    <p class="hint">Điểm ${read ? 'đọc' : 'nghe'} của bài được lưu như ở tab ${read ? 'Đọc' : 'Nghe'} (tính vào Can-Do ${read ? 'đọc' : 'nghe'}). Sao, xu và ${read ? 'sổ thám tử' : 'kệ băng'} chỉ để vui, không đổi đánh giá năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="${read ? 'dtstart' : 'rdstart'}">${read ? '🔍 Hồ sơ mới' : '📻 Bản tin mới'}</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
