// Màn Karaoke hội thoại (v81). Chỉ trình bày: hội thoại do engine chọn (main.ts), điểm / kết quả ở karaoke.ts.
// Nút "🎙 Nói" và kết quả máy nghe là của app (host.asr): một chỗ nhận diện giọng cho cả app.

import type { ECtx } from './views.ts';
import type { Dialog } from './host.ts';
import { ROLE, karaStars } from './karaoke.ts';

export interface KaraRun {
  floor: number; seed: number; t0: number; d: Dialog; i: number; asr: boolean;
  ps: Array<number | null>;   // điểm từng câu của vai (null: câu của vai kia)
  score: number; combo: number; done: boolean; k: 'easy' | 'ok' | 'hard' | null;
}
export const karaKey = (r: KaraRun): string => `kr:${r.floor}:${r.i}`;

export function viewKara(c: ECtx, r: KaraRun): string {
  const esc = c.host.esc, d = r.d, n = d.lines.length, l = d.lines[r.i]!, mine = l.s === ROLE, who = (s: string) => esc(s === 'A' ? d.names.A : d.names.B);
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🎤 Karaoke · ${esc(d.vi)} · câu ${r.i + 1}/${n}</span><span>🎵 <b>${r.score}</b>${r.combo > 1 ? ` · 🔥 x${r.combo}` : ''}</span></div>
    <p class="hint">Bạn đóng vai <b>${who(ROLE)}</b>${d.place ? ` · ${esc(d.place)}` : ''}. Máy đọc vai ${who('A')}.</p></section>`;
  const lyric = d.lines.map((x, k) => {
    if (k > r.i + 1) return '';
    const cls = k === r.i ? ' cur' : k < r.i ? ' past' : ' next', p = r.ps[k];
    const mark = k < r.i && x.s === ROLE ? ` <span class="pill${p !== null && p !== undefined && p >= 0.8 ? ' good' : ''}">${p === null || p === undefined ? '–' : Math.round(p * 100) + '%'}</span>` : '';
    return `<p class="krline${cls}${x.s === ROLE ? ' me' : ''}"><small>${who(x.s)}</small> <span lang="en">${esc(x.t)}</span>${mark}</p>`;
  }).join('');
  const say = `<button class="btn${mine ? '' : ' primary'}" data-say="${esc(l.t)}">▶ ${mine ? 'Nghe mẫu' : 'Nghe lại'}</button>${mine ? `<button class="btn ghost" data-say="${esc(l.t)}" data-slow="1">🐢 Chậm</button>` : ''}`;
  let act = '';
  if (!mine) act = `<div class="row">${say}<button class="btn primary" data-e="krnext" id="qnextbtn">Tiếp ▸</button></div>`;
  else if (r.asr && c.host.asr) act = `<p class="hint">${esc(l.vi)}</p><div class="row">${say}</div>${c.host.asr(karaKey(r), l.t, '', 'Nói câu này')}
      <div class="row"><button class="btn primary" data-e="krnext" id="qnextbtn">Chấm & tiếp ▸</button><button class="btn ghost" data-e="krskip">Bỏ qua câu này</button></div>`;
  else act = `<p class="hint">${esc(l.vi)}</p><div class="row">${say}</div><p class="hint">Máy này không nghe được giọng: nói to câu trên rồi tự chấm.</p>
      <div class="row"><button class="btn" data-e="krself" data-v="1">😀 Nói trôi</button><button class="btn" data-e="krself" data-v="0.7">🙂 Được</button><button class="btn" data-e="krself" data-v="0.4">😅 Khó</button></div>`;
  return `${head}<div class="krlyric">${lyric}</div>${act}`;
}

export function viewKaraEnd(c: ECtx, r: KaraRun): string {
  const esc = c.host.esc, mine = r.ps.filter((p): p is number => p !== null), k = r.k ?? 'hard', s = karaStars(k);
  const vi = { easy: 'Nói trôi chảy', ok: 'Nói được', hard: 'Cần luyện thêm' }[k];
  return `<section class="stack"><span class="eyebrow">🎤 Karaoke</span><h1>🎤 Hết bài!</h1>
    <p style="font-size:22px">${'⭐'.repeat(s)} · ${vi} · 🎵 ${r.score} điểm</p>
    <p>${esc(r.d.title)} · ${mine.length} câu của bạn · trung bình ${Math.round((mine.reduce((a, b) => a + b, 0) / Math.max(1, mine.length)) * 100)}% ${r.asr ? 'từ máy nghe ra' : '(tự chấm)'}.</p>
    ${stage(c, r)}
    <p class="hint">Kết quả lưu như màn Đóng vai (tính vào Can-Do nói). ${r.asr ? 'Máy nghe ra chưa chắc là phát âm chuẩn: đây là phép thử “người nghe có hiểu bạn không”.' : ''} Điểm và combo chỉ để vui, không đổi mức thuộc của từ / ngữ pháp.</p></section>
    <div class="row"><button class="btn primary" data-e="krstart">🎤 Bài khác</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}

// v92 Màn biểu diễn (GAME-CRITERIA §8.2 "trình diễn", T7 / T8): từng câu của bạn với mức máy nghe ra; câu hay nhất và câu nên luyện lại
// có nút nghe câu mẫu. Chỉ trình bày lại kết quả đã có (r.ps), không chấm thêm, không vào mức thuộc.
function stage(c: ECtx, r: KaraRun): string {
  const esc = c.host.esc, rows = r.d.lines.map((l, i) => ({ l, i, p: r.ps[i] })).filter((x): x is { l: typeof x.l; i: number; p: number } => x.p !== null && x.p !== undefined);
  if (!rows.length) return '';
  const best = rows.reduce((a, b) => (b.p > a.p ? b : a)), worst = rows.reduce((a, b) => (b.p < a.p ? b : a));
  const li = rows.map(x => {
    const pc = Math.round(x.p * 100), tag = x === best ? ' 🌟' : x === worst && worst.p < best.p ? ' 🔁' : '';
    return `<li class="krline"><span><span lang="en">${esc(x.l.t)}</span>${tag}</span><span class="krbar" role="img" aria-label="${pc}%"><i style="width:${pc}%"></i></span></li>`;
  }).join('');
  const again = worst.p < best.p ? `<button class="btn ghost small" data-say="${esc(worst.l.t)}" data-slow="1">🔁 Nghe chậm câu nên luyện lại</button>` : '';
  return `<section class="stack krstage"><b>🎭 Màn biểu diễn của bạn</b><ol class="stack" style="gap:6px">${li}</ol>
    <div class="row"><button class="btn ghost small" data-say="${esc(best.l.t)}">🌟 Nghe mẫu câu hay nhất</button>${again}</div></section>`;
}
