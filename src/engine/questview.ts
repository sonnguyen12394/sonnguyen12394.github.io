// Màn Ladder Quest (v62). Chỉ trình bày: nội dung từng lượt do engine chọn (quest.ts + NBA), game quyết định cảnh, tim, xu.

import type { ECtx } from './views.ts';
import type { EHost, MicroCard } from './host.ts';
import { loaded } from './data.ts';
import { ENC_VI, type Challenge, type QuestSave } from './quest.ts';
import type { BlockState } from './blocks.ts';
import type { Move } from './board.ts';

export interface BoardRun { phase: 'roll' | 'ask' | 'lot'; rolls: number; seed: number; n: number; move: Move | null; msg: string; built: number }

export interface BlockRun extends BlockState { phase: 'ask' | 'place'; sel: number | null; last: number[]; gain: number; best: number; saves: number; rescue: boolean }

export type QItem = ReturnType<EHost['probe']>[number];
export interface QuestRun {
  plan: Challenge[]; i: number; hp: number; max: number; coins: number; ok: number; n: number; floor: number;
  q: QItem | null; card: MicroCard | null; chk: QItem | null;   // chk: câu thử ngay sau bí kíp ở trại (v69)
  teach: boolean; taught: string[];                              // teach: lượt này dạy trước (thẻ mới) rồi mới hỏi (v69)
  t0?: number; passed?: string[];                                // v71: phần vừa vững trong lượt chơi này (lên cấp thật, từ bằng chứng)
  mode?: 'tower' | 'blocks' | 'board';                           // v72: game đang chơi (cùng chuỗi câu do engine chọn)
  bd?: BoardRun;                                                 // v73: Bàn Cờ Phố
  bk?: BlockRun;                                                 // v72: bàn Xếp Khối
  ans: { ok: boolean; right: string; given: string; coins: number; novel: boolean; why?: string } | null;
  revive?: number; revived?: boolean;   // v91: giá hồi tim bằng xu khi hết tim (0 / không có = không được), đã hồi trong tầng này chưa
  done: 'win' | 'lose' | null; wrong: string[]; gaps: string[];
}

const hearts = (hp: number, max: number): string => `<span aria-label="${hp}/${max} tim">${'❤️'.repeat(hp)}${'🤍'.repeat(Math.max(0, max - hp))}</span>`;

export function viewQuestHome(c: ECtx, q: QuestSave, ready: { done: number; total: number; vi: string } | null, next: { h: string; p: string; btn: string } | null = null, sk: { solid: number; total: number; week: number; claimed: number } | null = null, neck: { vi: string; dep: number; gap: string; pct: number } | null = null, fold = false): string {
  const esc = c.host.esc;
  if (!c.e.goals.length) return `<section class="stack"><span class="eyebrow">Ladder Quest</span><h1>Chọn cấp muốn leo</h1><p class="muted">Tháp được dựng từ mục tiêu CEFR của bạn: mỗi tầng là những gì bạn còn thiếu để lên cấp.</p></section><div class="row"><button class="btn primary" data-e="go" data-r="goals">Chọn mục tiêu</button></div>`;
  const tower = `<section class="stack"><span class="eyebrow">Leo nhanh · tầng ${q.floor}</span><h2>🏰 Leo tháp tiếng Anh</h2>
    <p class="muted">Mỗi đòn đánh, mỗi lần mở rương là một câu tiếng Anh app chọn để bạn lên cấp nhanh nhất. Câu càng giúp bạn tiến bộ (câu mới, phần sắp quên, trùm ở câu chưa gặp) thì càng nhiều xu.</p>
    <div class="row" style="gap:12px"><span class="pill">🪙 ${q.coins} xu</span><span class="pill">🏆 Tầng cao nhất ${q.best}</span><span class="pill">✓ ${q.ok}/${q.ans} câu đúng</span></div>
    ${sk ? `<div class="stack" style="gap:4px"><b>📈 ${sk.solid}/${sk.total} kỹ năng đã vững${sk.week ? ` · +${sk.week} trong 7 ngày qua` : ''}</b><div class="bar" role="progressbar" aria-label="Kỹ năng đã vững" aria-valuemin="0" aria-valuemax="${sk.total}" aria-valuenow="${sk.solid}"><i style="width:${sk.total ? Math.round((sk.solid / sk.total) * 100) : 0}%"></i></div>${sk.claimed ? `<span class="hint">${sk.claimed} kỹ năng app đoán là bạn đã biết, đang thử dần (🔭).</span>` : ''}</div>` : ''}
    ${neck ? `<p class="warnt">🚧 <b>Điểm nghẽn: ${esc(neck.vi)}</b> (${neck.pct}%${neck.gap ? ` · ${esc(neck.gap.toLowerCase())}` : ''}): đang chặn ${neck.dep} năng lực của mục tiêu. Tháp sẽ ưu tiên phần này.</p>` : ''}
    ${ready ? `<p class="hint">Tiến độ thật của bạn: ${ready.done}/${ready.total} năng lực ${esc(ready.vi)} đã Đạt. Thắng hay thua trong game không đổi đánh giá năng lực; chỉ câu trả lời mới được tính.</p>` : ''}</section>
    <div class="row"><button class="btn primary big" data-e="qstart">▶ Leo tầng ${q.floor} (≈ 8 câu, 4–6 phút)</button></div>`;
  const rest = `    ${next ? `<section class="panel stack"><span class="eyebrow">Ngoài tháp</span><b>${next.h}</b><p class="hint">${next.p}</p>${next.btn.replace(/btn primary big/g, 'btn small').replace(/<div class="row" style="justify-content:center;gap:6px">/g, '<div class="row" style="gap:6px">').replace(/<button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay<\/button>/g, '')}</section>` : ''}
    <div class="row"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost small" data-go="path">📚 Học bài</button><button class="btn ghost small" data-go="review">🔁 Ôn tập</button></div>`;
  // v99: ở sảnh, tháp (game cũ) thu gọn vào mục riêng; "Ngoài tháp · bước tiếp theo" và lối vào Lộ trình / Học / Ôn luôn hiện.
  return fold ? `<details class="gall gtower"><summary>🏰 Leo tháp tiếng Anh · tầng ${q.floor} (luyện tổng hợp kiểu cũ)</summary>${tower}</details>${rest}` : tower + rest;
}

export function viewQuestRun(c: ECtx, r: QuestRun): string {
  const { host } = c, esc = host.esc, ix = loaded()!, ch = r.plan[r.i]!, e = ENC_VI[ch.gameType];
  const top = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">Tầng ${r.floor} · ${r.i + 1}/${r.plan.length}</span><span>${hearts(r.hp, r.max)} · 🪙 ${r.coins}</span></div>
    <div class="row" style="gap:4px" aria-hidden="true">${r.plan.map((p, k) => `<span style="opacity:${k < r.i ? 0.35 : k === r.i ? 1 : 0.7}">${ENC_VI[p.gameType].ico}</span>`).join('')}</div>
    <h2 style="font-size:20px">${e.ico} ${esc(e.vi)}${ch.node ? ` · <span class="muted" style="font-weight:400">${esc(ix.node.get(ch.node)?.vi ?? '')}</span>` : ''}</h2><p class="hint">${esc(e.verb)}</p></section>`;
  return top + questInner(c, r);
}

// Phần câu hỏi / phản hồi / bí kíp của một lượt, dùng chung cho mọi game (v72). Lời thoại theo game đang chơi.
export function questInner(c: ECtx, r: QuestRun): string {
  const { host } = c, esc = host.esc, ch = r.plan[r.i]!, blk = r.mode === 'blocks', brd = r.mode === 'board', top = '';
  if (ch.gameType === 'camp' && !r.q) {
    const card = r.card;
    return `${top}<section class="panel stack">${card ? `<h3>Bí kíp: ${esc(card.title)}</h3>${card.concept.map(x => `<p>${esc(x)}</p>`).join('')}${card.mis ? `<p class="warnt"><b>Bạn hay trả lời “<span lang="en">${esc(card.mis)}</span>”.</b>${card.contrast ? ` ${esc(card.contrast)}` : ''}</p>` : card.contrast ? `<p class="warnt">${esc(card.contrast)}</p>` : ''}<ul>${card.examples.slice(0, 2).map(([en, vi]) => `<li><b lang="en">${esc(en)}</b>${vi ? ` <span class="hint">· ${esc(vi)}</span>` : ''}</li>`).join('')}</ul>` : '<p>Nghỉ chân bên đống lửa.</p>'}</section>
      <div class="row">${r.chk ? `<button class="btn primary" data-e="qcheck">Thử ngay 1 câu</button><button class="btn ghost" data-e="qnext">${blk ? 'Bỏ qua, nhận khối' : brd ? 'Bỏ qua, đi tiếp' : 'Bỏ qua, hồi tim'}</button>` : `<button class="btn primary" data-e="qnext">${blk ? 'Nhận khối thưởng' : brd ? 'Đi tiếp' : 'Hồi một tim và đi tiếp'}</button>`}</div>`;
  }
  const q = r.q;
  if (!q) return `${top}<p class="muted">Không dựng được câu cho lượt này.</p><div class="row"><button class="btn primary" data-e="qnext">Đi tiếp</button></div>`;
  if (r.ans) {
    const a = r.ans, camp = ch.gameType === 'camp';
    return `${top}<section class="stack"><p style="font-size:18px">${esc(q.prompt)}</p></section>
      <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${camp ? (a.ok ? 'Đúng rồi: bí kíp đã vào!' : 'Chưa đúng, không sao: đây là lượt luyện') : blk ? (a.ok ? 'Chính xác! Có thêm khối đặc biệt' : 'Chưa đúng, vẫn nhận khối') : brd ? (a.ok ? 'Chính xác! Đi tiếp nào' : 'Chưa đúng, không sao: đi tiếp') : a.ok ? (ch.gameType === 'boss' ? 'Trùm gục ngã!' : 'Trúng đòn!') : 'Hụt! Mất một tim'}</strong>${a.ok ? '' : `<span>Đáp án: <b lang="en">${esc(a.right)}</b></span>${a.given ? `<span>Bạn trả lời: <s lang="en">${esc(a.given)}</s></span>` : ''}${a.why ? `<span class="hint">💡 ${esc(a.why)}</span>` : ''}`}
        <span class="hint">+${a.coins} xu${a.novel ? ' · câu mới' : ''}</span></div>
      <div class="row"><button class="btn primary" data-e="qnext" id="qnextbtn">${blk ? 'Nhận khối ▸' : brd ? '🎲 Đi tiếp' : camp ? 'Hồi một tim và đi tiếp' : r.hp <= 0 ? 'Kết thúc lượt' : r.i + 1 < r.plan.length ? 'Đi tiếp' : 'Hoàn thành tầng'}</button>${r.hp <= 0 && !blk && !brd && r.revive ? `<button class="btn" data-e="qrevive">💖 Hồi 1 tim, leo tiếp (−${r.revive} xu)</button>` : ''}</div>`;
  }
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="qans" data-i="${i}">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="qans" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="qtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">${blk || brd ? 'Trả lời' : 'Tấn công'}</button><button class="btn ghost" type="button" data-e="qans" data-i="-1">Không biết</button></div></form>`;
  const card = r.teach && r.card ? `<details class="panel stack" open data-teach><summary><b>📜 Thẻ mới: ${esc(r.card.title)}</b> <span class="hint">(đọc rồi ${blk || brd ? 'trả lời' : 'đánh'})</span></summary>${r.card.concept.slice(0, 2).map(x => `<p>${esc(x)}</p>`).join('')}${r.card.mis ? `<p class="warnt"><b>Bạn hay trả lời “<span lang="en">${esc(r.card.mis)}</span>”.</b>${r.card.contrast ? ` ${esc(r.card.contrast)}` : ''}</p>` : ''}<ul>${r.card.examples.slice(0, 2).map(([en, vi]) => `<li><b lang="en">${esc(en)}</b>${vi ? ` <span class="hint">· ${esc(vi)}</span>` : ''}</li>`).join('')}</ul></details>` : '';
  const say = q.say ? `<div class="row"><button class="btn" data-say="${esc(q.say)}">🔊 Nghe</button><button class="btn ghost" data-say="${esc(q.say)}" data-slow="1">🐢 Nghe chậm</button></div>` : '';
  return `${top}${card}<section class="stack"><p style="font-size:20px;font-weight:600">${esc(q.prompt)}</p>${say}</section>${body}`;
}

export function viewQuestEnd(c: ECtx, r: QuestRun): string {
  const esc = c.host.esc, ix = loaded()!;
  const weak = [...new Set(r.wrong)].slice(0, 3).map(n => ix.node.get(n)?.vi ?? n);
  return `<section class="stack"><span class="eyebrow">Tầng ${r.floor}</span><h1>${r.done === 'win' ? '🏆 Qua tầng!' : '💤 Hết tim'}</h1>
    <p>${r.ok}/${r.n} câu đúng · +${r.coins} xu.${r.done === 'win' ? ` Tầng ${r.floor + 1} đã mở.` : ' Tầng này vẫn chờ bạn, không mất gì.'}</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu trả lời của bạn, không phải từ xu)</span></div>` : ''}
    ${weak.length ? `<p class="muted">Lượt sau app sẽ đưa lại: ${weak.map(esc).join(', ')}.</p>` : ''}
    <p class="hint">Mọi câu trả lời đã được ghi vào bản đồ năng lực. Nghỉ ở đây cũng tốt: bộ nhớ cần thời gian để củng cố.</p></section>
    <div class="row"><button class="btn primary" data-e="qhome">Về tháp</button><button class="btn ghost" data-e="go" data-r="today">Lộ trình hôm nay</button></div>`;
}
