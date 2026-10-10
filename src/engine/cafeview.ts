// Màn Quán Cà Phê (v75). Chỉ trình bày: câu do engine chọn (main.ts), sao / trang trí ở cafe.ts.

import type { ECtx } from './views.ts';
import { loaded } from './data.ts';
import type { Challenge } from './quest.ts';
import type { FnItem } from './host.ts';
import { GUESTS, decorOf, face, MOOD, type React } from './cafe.ts';
import { FACE } from './story.ts';

export interface CafeRun {
  floor: number; seed: number; t0: number; k: number; n: number; ok: number; coins: number; stars: number; streak: number; wrong: string[]; passed?: string[]; done: boolean;
  ch: Challenge | null; node: string; item: FnItem | null; novel: boolean;
  ans: { ok: boolean; i: number; stars: number; coins: number; react?: React; tip?: number } | null;
  vip?: [string, string];   // v103 cư dân của chương truyện (khách đầu ca)
}

export function viewCafe(c: ECtx, r: CafeRun, total: number): string {
  const esc = c.host.esc, ix = loaded()!, it = r.item, vip = r.k === 0 && r.vip ? r.vip : null, guest = vip ? (FACE[vip[1]] ?? vip[0]) : face(r.seed, r.k), decor = decorOf(total + r.stars);
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">☕ Quán Cà Phê · khách ${Math.min(r.k + 1, GUESTS)}/${GUESTS}</span><span>⭐ <b>${r.stars}</b> · 🪙 ${r.coins}</span></div></section>
    <div class="cfshop" aria-hidden="true"><span class="cfdecor">${decor.map(d => d.ico).join(' ') || '🪑'}</span><span class="cfguest${r.ans ? (r.ans.ok ? ' happy' : ' meh') : ''}">${guest}</span><span class="cfbub">${r.ans ? (r.ans.react ? MOOD[r.ans.react].ico : r.ans.ok ? '😊' : '🤔') : it?.kind === 'hear' ? '💬🔊' : '💬'}</span></div>${vip ? `<p class="cfvip">📖 ${esc(vip[1])} ghé quán: phục vụ thật tốt nhé!</p>` : ''}`;
  if (!it) return `${head}<p class="muted">Chưa có tình huống giao tiếp nào cho mục tiêu này.</p><div class="row"><button class="btn primary" data-e="cfnext">Tiếp</button></div>`;
  const fn = ix.node.get(r.node)?.vi ?? '';
  const say = it.say ? `<div class="row"><button class="btn" data-say="${esc(it.say)}">🔊 Nghe lại</button><button class="btn ghost" data-say="${esc(it.say)}" data-slow="1">🐢 Nghe chậm</button></div>` : !it.say && it.kind === 'hear' ? `<p class="prompt" lang="en" style="font-weight:500">“${esc(it.en)}”</p>` : '';
  if (r.ans) {
    const a = r.ans, right = it.opts[it.ans] ?? '';
    return `${head}<p class="hint">${it.kind === 'hear' ? '🎧 Nghe hiểu' : '💬 Chọn câu đáp'} · ${esc(fn)}</p>
      <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? `${MOOD.ok.ico} ${MOOD.ok.vi}! +${a.stars} ⭐` : `${MOOD[a.react ?? 'off'].ico} ${MOOD[a.react ?? 'off'].vi}`}</strong>
        ${a.react === 'reg' && a.i >= 0 ? `<span>Bạn nói: <b lang="en">${esc(it.opts[a.i] ?? '')}</b>${it.regs?.[a.i] ? ` (văn phong ${esc(it.regs[a.i]!.toLowerCase())})` : ''}: đúng việc cần nói, chỉ chưa hợp văn phong lúc này.</span>` : ''}
        ${a.react === 'off' && a.i >= 0 ? `<span>Bạn nói: <b${it.kind === 'reply' ? ' lang="en"' : ''}>${esc(it.opts[a.i] ?? '')}</b>: không phải điều khách muốn.</span>` : ''}
        <span>Khách nói: <b lang="en">${esc(it.en)}</b> · ${esc(it.vi)}</span>${a.ok ? '' : `<span>Đáp án: <b${it.kind === 'reply' ? ' lang="en"' : ''}>${esc(right)}</b></span>`}${!a.ok && it.why ? `<span class="hint">💡 ${esc(it.why)}</span>` : ''}${a.tip ? `<span class="hint">💰 Tiền boa +${a.tip} xu${a.react === 'reg' ? ' (đúng việc cần nói)' : ''}</span>` : ''}<span class="hint">+${a.coins} xu${r.novel ? ' · câu mới' : ''}</span></div>
      ${it.say ? `<div class="row"><button class="btn ghost small" data-say="${esc(it.say)}">🔊 Nghe lại câu của khách</button></div>` : ''}
      <div class="row"><button class="btn primary" data-e="cfnext" id="qnextbtn">${r.k + 1 >= GUESTS ? 'Đóng ca' : 'Khách kế ▸'}</button></div>`;
  }
  return `${head}<p class="hint">${it.kind === 'hear' ? '🎧 Nghe hiểu' : '💬 Chọn câu đáp'} · ${esc(fn)}</p><p style="font-size:18px;font-weight:600">${esc(it.prompt)}</p>${say}
    <div class="stack" style="gap:8px">${it.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="cfans" data-i="${i}"${it.kind === 'reply' ? ' lang="en"' : ''}>${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="cfans" data-i="-1">Không biết</button></div>`;
}

export function viewCafeEnd(c: ECtx, r: CafeRun, total: number): string {
  const esc = c.host.esc, ix = loaded()!, before = decorOf(total - r.stars).length, now = decorOf(total);
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">☕ Quán Cà Phê</span><h1>☕ Đóng ca!</h1>
    <p style="font-size:20px">⭐ +${r.stars} sao (tổng ${total}) · ${r.ok}/${r.n} khách hài lòng · +${r.coins} xu</p>
    ${now.length > before ? `<div class="fb good" role="status"><strong>Quán có đồ mới: ${now.slice(before).map(d => `${d.ico} ${esc(d.vi)}`).join(', ')}</strong></div>` : ''}
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu trả lời của bạn, không phải từ sao)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Ca sau sẽ gặp lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Sao và đồ trang trí chỉ để vui, không đổi đánh giá năng lực. Mọi câu trả lời đã được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="cfstart">☕ Ca mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
