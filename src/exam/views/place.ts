// Màn kiểm tra đầu vào: giới thiệu → làm bài (Đọc rồi Nghe, có giờ, âm thanh nghe một lần) → kết quả và xem lại từng câu.
// Yêu cầu 5.6, 6.6 (lời thoại hiện sau khi làm xong), 8.6 (báo lỗi ở mọi câu), 9.1, 10.4 (âm thanh lỗi thì báo rõ, có lối thay thế).

import type { Ctx } from '../main.ts';
import type { Group, Item } from '../content.ts';
import { itemOptions } from '../content.ts';
import { remainingMs, type PState, type PResult } from '../placement.ts';
import { bandToCefr, bandToVstep } from '../scales.ts';
import { fmt, back, SKILL_VI } from './ui.ts';

export interface PRun {
  st: PState;
  groups: Record<string, Group>;
  given: Record<string, string | undefined>;
  plays: number;             // số lần đã phát âm thanh của nhóm hiện tại
  audioErr: string;
  t0: number;
  res: PResult[] | null;
}

export const FLAG_REASONS = ['Đáp án sai', 'Có hơn một đáp án đúng', 'Âm thanh hoặc lời thoại có lỗi', 'Giải thích chưa đúng'];

const mmss = (ms: number): string => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export function viewPlaceIntro(c: Ctx, loading: boolean, err: string): string {
  const esc = c.host.esc;
  return `<section class="stack"><span class="eyebrow">Ôn thi · Kiểm tra đầu vào</span><h1>Bạn đang ở band nào?</h1>
    <p class="muted">Khoảng 15 phút: <b>Đọc</b> (tối đa 7,5 phút) rồi <b>Nghe</b> (tối đa 7,5 phút). Câu hỏi khó dần hoặc dễ dần theo câu trả lời của bạn, nên đừng lo khi gặp câu khó.</p></section>
  <section class="panel stack">
    <ul class="sklist"><li>Mỗi kỹ năng tối đa 12 câu trắc nghiệm, không quay lại câu trước.</li><li>Bài nghe chỉ phát <b>một lần</b>, như khi thi thật. Hãy đeo tai nghe.</li>
    <li>Không đoán bừa: câu bỏ trống tính là sai, nhưng đoán bừa làm kết quả kém chính xác.</li><li>Kết quả là band ước tính kèm khoảng sai số, quy đổi sang bậc VSTEP và CEFR. Viết và Nói đo sau (tuỳ chọn).</li></ul>
    ${err ? `<p class="warnt" role="alert">${esc(err)}</p>` : ''}
    <div class="row"><button class="btn primary" data-x="placestart"${loading ? ' disabled aria-busy="true"' : ''}>${loading ? 'Đang tải câu hỏi…' : 'Bắt đầu kiểm tra'}</button></div>
    <p class="hint">Không nghe được (ví dụ người khiếm thính)? Bạn có thể bỏ qua phần Nghe khi tới lượt; app chỉ ước tính phần Đọc.</p></section>
  ${back('Để sau')}`;
}

function optionsHtml(it: Item, g: Group, given: string | undefined, esc: (s: unknown) => string): string {
  return `<fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b lang="en">${esc(it.q)}</b></legend>
    ${itemOptions(it, g).map(o => `<label class="chip opt-row"><input type="radio" name="${esc(it.id)}" value="${esc(o.k)}"${given === o.k ? ' checked' : ''}> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span></label>`).join('')}</fieldset>`;
}

export function viewPlaceRun(c: Ctx, r: PRun): string {
  const esc = c.host.esc, g = r.st.cur ? r.groups[r.st.cur] : undefined;
  const sec = r.st.sections[r.st.i];
  if (!g || !sec) return `<p class="muted" role="status">Đang chấm…</p>`;
  const nAns = sec.answers.length, left = remainingMs(sec, Date.now());
  const head = `<section class="stack"><div class="spread"><span class="eyebrow">Kiểm tra đầu vào · ${SKILL_VI[sec.skill]} (${r.st.i + 1}/${r.st.order.length})</span>
      <span class="num" id="xtimer" aria-live="off" aria-label="Thời gian còn lại">Còn ${mmss(left)}</span></div>
    <div class="xpbar" role="progressbar" aria-label="Số câu đã làm" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${nAns}"><i style="width:${Math.round((100 * nAns) / 12)}%"></i></div></section>`;
  let body: string;
  if (g.kind === 'reading') {
    body = `<section class="panel stack"><h2 lang="en">${esc(g.title)}</h2><p class="muted">${esc(g.instr)}</p>${(g.paras ?? []).map(p => `<p lang="en" class="reading">${esc(p)}</p>`).join('')}</section>`;
  } else {
    const can = r.plays < 1;
    body = `<section class="panel stack"><h2 lang="en">${esc(g.title)}</h2><p class="muted">${esc(g.instr)}</p>
      <audio id="xaudio" preload="auto" src="${esc(g.audio?.file ?? '')}"></audio>
      <div class="row"><button class="btn${can ? ' primary' : ''}" data-x="placeplay"${can ? '' : ' disabled'}>${can ? '▶ Nghe (1 lần)' : 'Đã nghe'}</button>
        <span class="hint" id="xaudiost" aria-live="polite">${r.audioErr ? `<span class="warnt">${esc(r.audioErr)}</span>` : can ? 'Đọc câu hỏi trước rồi bấm nghe.' : ''}</span></div>
      ${r.audioErr ? '<div class="row"><button class="btn small" data-x="placeretry">Thử tải lại âm thanh</button><button class="btn small ghost" data-x="placeskipl">Bỏ qua phần Nghe</button></div>' : ''}
      <p class="hint"><button class="linkbtn" data-x="placeskipl">Không nghe được? Bỏ qua phần Nghe</button></p></section>`;
  }
  const qs = `<form class="panel stack" data-xform="placenext">${g.items.map(it => optionsHtml(it, g, r.given[it.id], esc)).join('')}
    <div class="row"><button class="btn primary">Câu tiếp</button></div></form>`;
  return head + body + qs;
}

function reviewItem(c: Ctx, g: Group, it: Item, given: string | undefined, correct: boolean): string {
  const esc = c.host.esc, opts = itemOptions(it, g);
  const src = g.kind === 'reading' ? (g.paras ?? []) : (g.script ?? []).map(l => `${l.sp}: ${l.t}`);
  const evLine = src[it.ev.p] ?? '';
  const hl = esc(evLine).replace(esc(it.ev.s), `<mark>${esc(it.ev.s)}</mark>`);
  return `<div class="stack" style="gap:6px;border-top:1px solid var(--line);padding-top:10px">
    <p><span class="pill ${correct ? 'good' : ''}">${correct ? '✓ Đúng' : '✕ Sai'}</span> <b lang="en">${esc(it.q)}</b></p>
    <ul class="sklist">${opts.map(o => `<li class="${o.k === it.ans ? 'ok' : ''}"><span>${o.k === it.ans ? '✓' : o.k === given ? '✕' : '·'}</span> <b>${esc(o.k)}</b> <span lang="en">${esc(o.t)}</span>${o.k === given && o.k !== it.ans ? ' <span class="hint">(bạn chọn)</span>' : ''}</li>`).join('')}</ul>
    <p><b>Vì sao đúng:</b> ${esc(it.why)}</p>
    ${given && given !== it.ans && it.wrong?.[given] ? `<p><b>Vì sao ${esc(given)} sai:</b> ${esc(it.wrong[given])}</p>` : ''}
    ${!given ? '<p class="hint">Bạn bỏ trống câu này.</p>' : ''}
    <details><summary>Xem giải thích mọi phương án và câu chứa đáp án</summary><div class="stack" style="margin-top:8px;gap:6px">
      ${opts.filter(o => o.k !== it.ans).map(o => `<p><b>${esc(o.k)}:</b> ${esc(it.wrong?.[o.k] ?? '')}</p>`).join('')}
      <p class="hint">Câu chứa đáp án (${g.kind === 'reading' ? 'trong bài' : 'trong lời thoại'}):</p><p lang="en" class="reading">${hl}</p></div></details>
    <div class="row" style="gap:6px"><span class="hint">Báo lỗi câu này:</span>${FLAG_REASONS.map((t, i) => `<button class="btn small ghost" data-x="placeflag" data-i="${esc(it.id)}" data-r="${i}">${esc(t)}</button>`).join('')}</div></div>`;
}

export function viewPlaceResult(c: Ctx, r: PRun | null): string {
  const { x, host } = c, esc = host.esc, vstep = x.exam === 'vstep';
  const res = r?.res ?? null;
  if (!res || !r) {
    const last = x.attempts.filter(a => a.kind === 'place').slice(-2);
    if (!last.length) return `<section class="stack"><h1>Chưa có kết quả</h1></section>${back()}`;
    return `<section class="stack"><span class="eyebrow">Ôn thi · Kết quả kiểm tra đầu vào</span><h1>Kết quả gần nhất</h1></section>
      <section class="panel stack">${last.map(a => `<p>${SKILL_VI[a.skill]}: band <b>${fmt(a.band)}</b> (${a.correct}/${a.total} câu đúng)</p>`).join('')}</section>${back()}`;
  }
  const cell = (p: PResult): string => {
    const lo = Math.max(0, p.band - p.pm), hi = Math.min(9, p.band + p.pm);
    return `<div class="stat"><span class="muted">${SKILL_VI[p.skill]}</span><b class="num">${vstep ? `${fmt(bandToVstep(p.band))}/10` : fmt(p.band)}</b>
      <span class="hint">khoảng ${vstep ? `${fmt(bandToVstep(lo))}–${fmt(bandToVstep(hi))}` : `${fmt(lo)}–${fmt(hi)}`} · ${bandToCefr(p.band)} · ${vstep ? `band ≈ ${fmt(p.band)}` : `VSTEP ≈ ${fmt(bandToVstep(p.band))}`}</span></div>`;
  };
  const review = r.st.sections.map(sec => {
    const byGroup = new Map<string, typeof sec.answers>();
    for (const a of sec.answers) { const l = byGroup.get(a.group) ?? []; l.push(a); byGroup.set(a.group, l); }
    return `<section class="panel stack"><h3>Xem lại phần ${SKILL_VI[sec.skill]} (${sec.answers.filter(a => a.correct).length}/${sec.answers.length} câu đúng)</h3>
      ${[...byGroup].map(([gid, as]) => { const g = r.groups[gid]!; return `<details class="stack"><summary><b lang="en">${esc(g.title)}</b> · ${as.filter(a => a.correct).length}/${as.length} đúng</summary>
        ${g.kind === 'listening' ? `<div class="stack" style="margin-top:8px"><p class="hint">Lời thoại (hiện sau khi làm xong):</p>${(g.script ?? []).map((l, i) => `<p lang="en"><b>${esc(l.sp)}:</b> ${esc(l.t)}${g.vi?.[i] ? `<br><span class="hint" lang="vi">${esc(g.vi[i])}</span>` : ''}</p>`).join('')}
          ${g.audio?.file ? `<audio controls preload="none" src="${esc(g.audio.file)}"></audio>` : ''}</div>` : `<div class="stack" style="margin-top:8px">${(g.paras ?? []).map((p, i) => `<p lang="en" class="reading">${esc(p)}</p>${g.vi?.[i] ? `<p class="hint" lang="vi">${esc(g.vi[i])}</p>` : ''}`).join('')}</div>`}
        ${as.map(a => { const it = g.items.find(i => i.id === a.id)!; return reviewItem(c, g, it, a.given, a.correct); }).join('')}</details>`; }).join('')}</section>`;
  }).join('');
  const skipped = r.st.order.filter(k => !res.some(p => p.skill === k));
  return `<section class="stack"><span class="eyebrow">Ôn thi · Kết quả kiểm tra đầu vào</span><h1>Kết quả của bạn</h1>
    <p class="muted">Ước tính của app, không phải điểm thi chính thức. Khoảng là độ tin cậy 80% (12 câu mỗi kỹ năng nên khoảng còn rộng; làm thêm bài luyện để khoảng hẹp lại).</p></section>
  <section class="panel stack"><div class="me-stats">${res.map(cell).join('')}</div>
    ${skipped.length ? `<p class="hint">Bỏ qua: ${skipped.map(k => SKILL_VI[k]).join(', ')}.</p>` : ''}
    <p class="hint">Viết và Nói: làm đề thi thử Viết, Nói để có ước tính (tuỳ chọn).</p>
    <div class="row"><button class="btn primary" data-x="route" data-r="settings">Đặt mục tiêu và ngày thi</button><button class="btn" data-x="route" data-r="hub">Về trang Ôn thi</button></div></section>
  ${review}`;
}
