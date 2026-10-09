// Màn Bắt Âm (v76). Chỉ trình bày: từ do engine chọn (main.ts, nút ph:), bố cục / điểm ở bubbles.ts.

import type { ECtx } from './views.ts';
import { loaded } from './data.ts';
import type { Challenge } from './quest.ts';
import type { EHost } from './host.ts';
import { WORDS, layout, size } from './bubbles.ts';

export type SoundItem = ReturnType<EHost['probe']>[number];
export interface BubbleRun {
  floor: number; stage: number; seed: number; t0: number; k: number; n: number; ok: number; coins: number; score: number; streak: number; wrong: string[]; passed?: string[]; done: boolean;
  ch: Challenge | null; node: string; item: SoundItem | null; novel: boolean;
  ans: { ok: boolean; i: number; pts: number; coins: number } | null;
}

export function viewBubbles(c: ECtx, r: BubbleRun, tts: boolean): string {
  const esc = c.host.esc, ix = loaded()!, it = r.item;
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🎯 Bắt Âm · màn ${r.stage} · từ ${Math.min(r.k + 1, WORDS)}/${WORDS}</span><span>✨ <b>${r.score}</b>${r.streak > 1 ? ` · 🔥 x${r.streak}` : ''} · 🪙 ${r.coins}</span></div></section>`;
  if (!it) return `${head}<p class="muted">${tts ? 'Chưa có cặp âm nào cho mục tiêu này.' : 'Máy này không có giọng đọc tiếng Anh nên chưa chơi được Bắt Âm (không hỏi thứ bạn không nghe được).'}</p><div class="row"><button class="btn primary" data-e="bbnext">Tiếp</button></div>`;
  const node = ix.node.get(r.node)?.vi ?? '', lay = layout(r.seed, r.n), sc = size(r.streak), opts = it.opts ?? [];
  const field = `<div class="bbfield">${opts.map((o, i) => {
    const l = lay[i] ?? { x: 10 + i * 30, hue: 200, delay: 0 }, st = r.ans ? (i === (it.ans ?? -1) ? ' right' : i === r.ans.i ? ' wrong' : ' dim') : '';
    return `<button class="bbub${st}" style="left:${l.x}%;--h:${l.hue};--d:${l.delay}ms;--s:${sc}" data-e="bbans" data-i="${i}" ${r.ans ? 'disabled' : ''} lang="en">${esc(o)}</button>`;
  }).join('')}</div>`;
  const say = it.say ? `<div class="row" style="justify-content:center"><button class="btn" data-say="${esc(it.say)}">🔊 Nghe lại</button><button class="btn ghost" data-say="${esc(it.say)}" data-slow="1">🐢 Nghe chậm</button></div>` : '';
  if (r.ans) {
    const a = r.ans, right = opts[it.ans ?? 0] ?? '';
    return `${head}<p class="hint">${esc(node)}</p>${field}
      <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? `Bắt trúng! +${a.pts}` : 'Trượt rồi, nghe lại hai từ nhé'}</strong>${a.ok ? '' : `<span>Từ vừa đọc: <b lang="en">${esc(right)}</b></span>`}
        ${!a.ok && it.pair ? `<span class="row" style="gap:6px">${it.pair.map(w => `<button class="btn small" data-say="${esc(w)}" lang="en">🔊 ${esc(w)}</button>`).join('')}</span>` : ''}${!a.ok && it.tip ? `<span class="hint">💡 ${esc(it.tip)}</span>` : ''}<span class="hint">+${a.coins} xu</span></div>
      <div class="row"><button class="btn primary" data-e="bbnext" id="qnextbtn">${r.k + 1 >= WORDS ? 'Xong màn' : 'Từ kế ▸'}</button></div>`;
  }
  return `${head}<p class="hint">🎧 Nghe rồi chạm bong bóng có từ vừa đọc · ${esc(node)}</p>${say}${field}
    <div class="row" style="justify-content:center"><button class="btn ghost" data-e="bbans" data-i="-1">Không biết</button></div>`;
}

export function viewBubblesEnd(c: ECtx, r: BubbleRun, best: number): string {
  const esc = c.host.esc, ix = loaded()!, rec = r.score > best;
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">🎯 Bắt Âm</span><h1>🎯 Xong màn ${r.stage}!</h1>
    <p style="font-size:22px">✨ <b>${r.score}</b> điểm${rec ? ' · <b>🏆 Kỷ lục mới!</b>' : ` · kỷ lục ${best}`}</p>
    <p>${r.ok}/${r.n} từ bắt trúng · +${r.coins} xu.</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu trả lời của bạn, không phải từ điểm game)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Màn sau sẽ nghe lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Điểm và màn chỉ để vui, không đổi đánh giá năng lực. Mọi câu trả lời đã được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="bbstart">🎯 Màn mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
