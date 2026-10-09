// Màn Bài Câu (v74). Chỉ trình bày: câu và lá do engine chọn (main.ts), luật tính điểm ở cards.ts. Lá bài vẽ bằng CSS.

import type { ECtx } from './views.ts';
import { loaded } from './data.ts';
import type { Challenge } from './quest.ts';
import type { OrderItem } from './host.ts';
import { TABLES, PLAYS, target, CHARMS, type Charm } from './cards.ts';

export interface CardsRun {
  floor: number; seed: number; t0: number; n: number; ok: number; coins: number; wrong: string[]; passed?: string[]; done: boolean;
  table: number; play: number; tableScore: number; total: number; streak: number; charms: string[]; won: number;
  ch: Challenge | null; node: string; item: OrderItem | null; novel: boolean;
  hand: string[]; built: number[];                       // lá trong tay (đã trộn) · chỉ số các lá đã xếp theo thứ tự
  ans: { ok: boolean; right: string; given: string; at: number; why?: string; chips: number; mult: number; total: number; coins: number } | null;
  offer: Charm[] | null; tableEnd: { won: boolean; score: number } | null;
}

const charmName = (id: string) => CHARMS.find(c => c.id === id)?.name ?? id;

export function viewCards(c: ECtx, r: CardsRun): string {
  const esc = c.host.esc, ix = loaded()!;
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🃏 Bài Câu · bàn ${r.table + 1}/${TABLES} · lượt ${Math.min(r.play + 1, PLAYS)}/${PLAYS}</span><span>🎯 <b>${r.tableScore}</b>/${target(r.table)} · 🪙 ${r.coins}</span></div>
    <div class="bar" role="progressbar" aria-label="Điểm bàn" aria-valuemin="0" aria-valuemax="${target(r.table)}" aria-valuenow="${r.tableScore}"><i style="width:${Math.min(100, Math.round((r.tableScore / target(r.table)) * 100))}%"></i></div>
    ${r.charms.length ? `<div class="row" style="gap:6px">${r.charms.map(id => `<span class="pill">✨ ${esc(charmName(id))}</span>`).join('')}</div>` : ''}</section>`;
  if (r.tableEnd) {
    const t = r.tableEnd;
    return `${head}<section class="stack" style="text-align:center"><h2>${t.won ? '🏆 Thắng bàn!' : '🙂 Chưa đủ điểm bàn này'}</h2><p>${t.score} / ${target(r.table)} điểm</p>
      ${r.offer?.length ? `<p class="hint">Chọn một lá bùa cho các bàn sau (chỉ đổi cách tính điểm):</p><div class="cdoffer">${r.offer.map(o => `<button class="cdcharm" data-e="cdcharm" data-c="${o.id}"><b>✨ ${esc(o.name)}</b><span class="hint">${esc(o.desc)}</span></button>`).join('')}</div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn ${r.offer?.length ? 'ghost' : 'primary'}" data-e="cdnext">${r.table + 1 >= TABLES ? 'Xem kết quả' : r.offer?.length ? 'Bỏ qua bùa' : 'Bàn tiếp ▸'}</button></div></section>`;
  }
  const it = r.item;
  if (!it) return `${head}<p class="muted">Chưa có câu ngữ pháp nào để xếp cho mục tiêu này.</p><div class="row"><button class="btn primary" data-e="cdnext">Tiếp</button></div>`;
  const node = ix.node.get(r.node)?.vi ?? '';
  const built = r.built.map(i => r.hand[i]!), used = new Set(r.built);
  const row = `<div class="cdrow" aria-label="Câu đang xếp">${built.length ? built.map((t, k) => `<button class="cdcard on${r.ans && !r.ans.ok && k === r.ans.at ? ' bad' : ''}" data-e="cdback" data-k="${k}" ${r.ans ? 'disabled' : ''} lang="en">${esc(t)}</button>`).join('') : '<span class="hint">Chạm lá bên dưới để xếp câu.</span>'}</div>`;
  if (r.ans) {
    const a = r.ans;
    return `${head}<p class="hint">${esc(node)}</p>${row}
      <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? `Ra bài! ${a.chips} chip × ${a.mult} = ${a.total}` : 'Câu chưa đúng: lượt này 0 điểm'}</strong>${a.ok ? '' : `<span>Câu đúng: <b lang="en">${esc(a.right)}</b></span>${a.why ? `<span class="hint">💡 ${esc(a.why)}</span>` : ''}`}<span class="hint">+${a.coins} xu${r.novel ? ' · câu mới' : ''}</span></div>
      <div class="row"><button class="btn primary" data-e="cdnext" id="qnextbtn">${r.play + 1 >= PLAYS ? 'Kết thúc bàn' : 'Lượt tiếp ▸'}</button></div>`;
  }
  const hand = r.hand.map((t, i) => used.has(i) ? '<span class="cdcard ghost" aria-hidden="true"></span>' : `<button class="cdcard" data-e="cdtile" data-i="${i}" lang="en">${esc(t)}</button>`).join('');
  return `${head}<p class="hint">${esc(it.prompt)}</p>${row}<div class="cdhand" aria-label="Lá trong tay">${hand}</div>
    <div class="row"><button class="btn primary" data-e="cdplay" ${r.built.length ? '' : 'disabled'}>🂠 Ra bài</button><button class="btn ghost" data-e="cdclear" ${r.built.length ? '' : 'disabled'}>↺ Xếp lại</button><button class="btn ghost" data-e="cdskip">Không biết</button></div>
    <p class="hint">Có thể có lá thừa (lá bẫy). Câu phải đúng thứ tự từ và đúng ngữ pháp.</p>`;
}

export function viewCardsEnd(c: ECtx, r: CardsRun, best: number): string {
  const esc = c.host.esc, ix = loaded()!, rec = r.total > best;
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">🃏 Bài Câu</span><h1>🃏 Xong ván!</h1>
    <p style="font-size:22px">🏆 Thắng <b>${r.won}/${TABLES}</b> bàn · ⭐ ${r.total} điểm${rec ? ' · <b>Kỷ lục mới!</b>' : ` · kỷ lục ${best}`}</p>
    <p>${r.ok}/${r.n} câu đúng · +${r.coins} xu.</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu bạn tự xếp, không phải từ điểm game)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Ván sau app sẽ cho xếp lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Điểm, bàn thắng và bùa chỉ để vui, không đổi đánh giá năng lực. Mọi câu đã được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="cdstart">🃏 Ván mới</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
