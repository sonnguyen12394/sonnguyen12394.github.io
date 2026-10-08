// Màn Ladder Quest (v62). Chỉ trình bày: nội dung từng lượt do engine chọn (quest.ts + NBA), game quyết định cảnh, tim, xu.

import type { ECtx } from './views.ts';
import type { EHost, MicroCard } from './host.ts';
import { loaded } from './data.ts';
import { ENC_VI, type Challenge, type QuestSave } from './quest.ts';

export type QItem = ReturnType<EHost['probe']>[number];
export interface QuestRun {
  plan: Challenge[]; i: number; hp: number; max: number; coins: number; ok: number; n: number; floor: number;
  q: QItem | null; card: MicroCard | null;
  ans: { ok: boolean; right: string; given: string; coins: number; novel: boolean } | null;
  done: 'win' | 'lose' | null; wrong: string[];
}

const hearts = (hp: number, max: number): string => `<span aria-label="${hp}/${max} tim">${'❤️'.repeat(hp)}${'🤍'.repeat(Math.max(0, max - hp))}</span>`;

export function viewQuestHome(c: ECtx, q: QuestSave, ready: { done: number; total: number; vi: string } | null): string {
  const esc = c.host.esc;
  if (!c.e.goals.length) return `<section class="stack"><span class="eyebrow">Ladder Quest</span><h1>Chọn cấp muốn leo</h1><p class="muted">Tháp được dựng từ mục tiêu CEFR của bạn: mỗi tầng là những gì bạn còn thiếu để lên cấp.</p></section><div class="row"><button class="btn primary" data-e="go" data-r="goals">Chọn mục tiêu</button></div>`;
  return `<section class="stack"><span class="eyebrow">Ladder Quest · tầng ${q.floor}</span><h1>🏰 Leo tháp tiếng Anh</h1>
    <p class="muted">Mỗi đòn đánh, mỗi lần mở rương là một câu tiếng Anh app chọn để bạn lên cấp nhanh nhất. Câu càng giúp bạn tiến bộ (câu mới, phần sắp quên, trùm ở câu chưa gặp) thì càng nhiều xu.</p>
    <div class="row" style="gap:12px"><span class="pill">🪙 ${q.coins} xu</span><span class="pill">🏆 Tầng cao nhất ${q.best}</span><span class="pill">✓ ${q.ok}/${q.ans} câu đúng</span></div>
    ${ready ? `<p class="hint">Tiến độ thật của bạn: ${ready.done}/${ready.total} năng lực ${esc(ready.vi)} đã Đạt. Thắng hay thua trong game không đổi đánh giá năng lực; chỉ câu trả lời mới được tính.</p>` : ''}</section>
    <div class="row"><button class="btn primary big" data-e="qstart">▶ Leo tầng ${q.floor} (≈ 8 câu, 4–6 phút)</button></div>
    <div class="row"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button></div>`;
}

export function viewQuestRun(c: ECtx, r: QuestRun): string {
  const { host } = c, esc = host.esc, ix = loaded()!, ch = r.plan[r.i]!, e = ENC_VI[ch.gameType];
  const top = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">Tầng ${r.floor} · ${r.i + 1}/${r.plan.length}</span><span>${hearts(r.hp, r.max)} · 🪙 ${r.coins}</span></div>
    <div class="row" style="gap:4px" aria-hidden="true">${r.plan.map((p, k) => `<span style="opacity:${k < r.i ? 0.35 : k === r.i ? 1 : 0.7}">${ENC_VI[p.gameType].ico}</span>`).join('')}</div>
    <h2 style="font-size:20px">${e.ico} ${esc(e.vi)}${ch.node ? ` · <span class="muted" style="font-weight:400">${esc(ix.node.get(ch.node)?.vi ?? '')}</span>` : ''}</h2><p class="hint">${esc(e.verb)}</p></section>`;
  if (ch.gameType === 'camp') {
    const card = r.card;
    return `${top}<section class="panel stack">${card ? `<h3>Bí kíp: ${esc(card.title)}</h3>${card.concept.map(x => `<p>${esc(x)}</p>`).join('')}${card.contrast ? `<p class="warnt">${esc(card.contrast)}</p>` : ''}<ul>${card.examples.slice(0, 2).map(([en, vi]) => `<li><b lang="en">${esc(en)}</b>${vi ? ` <span class="hint">· ${esc(vi)}</span>` : ''}</li>`).join('')}</ul>` : '<p>Nghỉ chân bên đống lửa.</p>'}</section>
      <div class="row"><button class="btn primary" data-e="qnext">Hồi một tim và đi tiếp</button></div>`;
  }
  const q = r.q;
  if (!q) return `${top}<p class="muted">Không dựng được câu cho lượt này.</p><div class="row"><button class="btn primary" data-e="qnext">Đi tiếp</button></div>`;
  if (r.ans) {
    const a = r.ans;
    return `${top}<section class="stack"><p style="font-size:18px">${esc(q.prompt)}</p></section>
      <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? (ch.gameType === 'boss' ? 'Trùm gục ngã!' : 'Trúng đòn!') : 'Hụt! Mất một tim'}</strong>${a.ok ? '' : `<span>Đáp án: <b lang="en">${esc(a.right)}</b></span>${a.given ? `<span>Bạn trả lời: <s lang="en">${esc(a.given)}</s></span>` : ''}`}
        <span class="hint">+${a.coins} xu${a.novel ? ' · câu mới' : ''}</span></div>
      <div class="row"><button class="btn primary" data-e="qnext" id="qnextbtn">${r.hp <= 0 ? 'Kết thúc lượt' : r.i + 1 < r.plan.length ? 'Đi tiếp' : 'Hoàn thành tầng'}</button></div>`;
  }
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="qans" data-i="${i}">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="qans" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="qtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Tấn công</button><button class="btn ghost" type="button" data-e="qans" data-i="-1">Không biết</button></div></form>`;
  return `${top}<section class="stack"><p style="font-size:20px;font-weight:600">${esc(q.prompt)}</p></section>${body}`;
}

export function viewQuestEnd(c: ECtx, r: QuestRun): string {
  const esc = c.host.esc, ix = loaded()!;
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">Tầng ${r.floor}</span><h1>${r.done === 'win' ? '🏆 Qua tầng!' : '💤 Hết tim'}</h1>
    <p>${r.ok}/${r.n} câu đúng · +${r.coins} xu.${r.done === 'win' ? ` Tầng ${r.floor + 1} đã mở.` : ' Tầng này vẫn chờ bạn, không mất gì.'}</p>
    ${weak.length ? `<p class="muted">Lượt sau app sẽ đưa lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Mọi câu trả lời đã được ghi vào bản đồ năng lực. Nghỉ ở đây cũng tốt: bộ nhớ cần thời gian để củng cố.</p></section>
    <div class="row"><button class="btn primary" data-e="qhome">Về tháp</button><button class="btn ghost" data-e="go" data-r="today">Lộ trình hôm nay</button></div>`;
}
