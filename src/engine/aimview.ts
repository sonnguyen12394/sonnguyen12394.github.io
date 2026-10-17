// v138 🎯 Mục tiêu (route 'aim'): phần thứ ba cạnh ⚔️ Chơi và 📘 Học. Mỗi cấp (A1, A2) nói rõ cần đạt gì: 7 kỹ năng = 7 ô đồ,
// phần đã vững nhờ game / nhờ app, nút học ở game hoặc ở app, và trận cổng của cấp. Chơi hay học đều đổ vào đây.
// Thuần chuỗi HTML; số liệu từ compare.ts (compareOf) và gate.ts (gateState). Không dùng chữ "thi / đề / kiểm tra".

import type { ECtx } from './views.ts';
import { cmpVerdict, type AimItem, type CmpOut } from './compare.ts';
import { LEVEL_VI, type Level } from './types.ts';
import { waitTxt } from './gateview.ts';
import { GATE } from './gate.ts';

export const AIM_LVS = [['A1', 'cefr-a1'], ['A2', 'cefr-a2']] as const;
export type AimLv = typeof AIM_LVS[number][0];
export const isAimLv = (v: unknown): v is AimLv => AIM_LVS.some(([l]) => l === v);

export interface AimIn {
  lv: AimLv;
  o: CmpOut;
  chosen: boolean;                          // cấp này đang là đích chính
  gate: { has: boolean; open: boolean; passed: boolean; ratio: number; wait?: { days: number; more: number } | null; parts?: { learn: number; mem: number; total: number } };
  forge: string;                            // lò Thợ rèn đang gợi ý (data-g của nút cblo)
  cert?: string;                            // ô chứng chỉ ngoài app (gateview viewCert), chỉ khi đã chọn
  cap?: number;                             // số kỹ năng vững mà vòng game còn đòi (cmpVerdict)
}

const pct = (n: number, t: number): number => (t ? Math.round((100 * n) / t) : 0);

// v144 nút 📝 Bài luyện theo cấp (app.js viewGP) ở dòng Phát âm / Nói / Đọc: [loại bài, cách luyện].
const GP_OF: Record<string, [string, string]> = { pro: ['read', 'say'], spk: ['talk', 'say'], rd: ['read', 'e2v'] };
export function viewAim(c: ECtx, x: AimIn | null): string {
  const esc = c.host.esc;
  const tabs = `<div class="row aimtabs" role="group" aria-label="Cấp">${AIM_LVS.map(([l]) => `<button class="btn small${x?.lv === l ? ' primary' : ''}" data-e="aimlv" data-lv="${l}" aria-pressed="${x?.lv === l}">${l}</button>`).join('')}</div>`;
  const head = `<section class="stack"><span class="eyebrow">Mục tiêu</span><h1>🎯 Cần đạt ở mỗi cấp</h1>
    <p class="hint">⚔️ Chơi và 📘 Học đều đổ vào đây. Một phần chỉ tính là vững khi bạn làm đúng nhiều lần, cách ngày.</p>${tabs}</section>`;
  if (!x) return `${head}<p class="muted" role="status">Đang tải bản đồ năng lực…</p>`;
  const o = x.o, p = pct(o.solid, o.total), id = AIM_LVS.find(([l]) => l === x.lv)![1];
  const rows = o.rows.filter(r => r.total).map(r => {
    const seg = (cls: string, n: number) => (n ? `<i class="${cls}" style="width:${pct(n, r.total)}%"></i>` : '');
    const game = r.pull ? `<button class="btn small" data-e="cblo" data-g="${esc(x.forge)}">⚔️ Rèn ở game</button>` : '<span class="hint aimlock">🔒 game chưa có lò</span>';
    // v139 bấm dòng kỹ năng → mở danh sách từng phần cần đạt (details/summary: bấm được, đọc được bằng trình đọc màn hình).
    const items = r.items ?? [], open = items.filter(i => !i.solid), done = items.filter(i => i.solid);
    const src = (i: AimItem) => { const k = [i.g ? '⚔️' : '', i.a ? '📘' : '', i.n ? '🔁' : ''].filter(Boolean); return k.length > 1 ? ' · ' + k.join('') : i.g ? ' · ⚔️ nhờ game' : i.a ? ' · 📘 nhờ Học bài' : i.n ? ' · 🔁 nhờ Ôn luyện' : ''; };
    const li = (i: AimItem) => `<li class="aimit${i.solid ? ' ok' : ''}"><span>${i.solid ? '✅' : i.pct > 0 ? '🟡' : '⬜'} ${esc(i.vi)}</span><span class="hint">${i.solid ? 'đã vững' : i.pct > 0 ? `đang học · ${Math.round(i.pct * 100)}%` : 'chưa bắt đầu'} · cần: ${esc(LEVEL_VI[i.level as Level] ?? '')}${src(i)}</span></li>`;
    const list = items.length ? `<div class="aimdet stack">${open.length ? `<p class="hint"><b>Còn ${open.length} phần chưa vững</b> (gần xong nhất ở trên)</p><ul class="aimits">${open.map(li).join('')}</ul>` : ''}${done.length ? `<p class="hint"><b>Đã vững ${done.length} phần</b></p><ul class="aimits">${done.map(li).join('')}</ul>` : ''}</div>` : '';
    return `<li class="cmprow stack"><details class="aimsk">
      <summary><b>${r.ico} ${esc(r.vi)} · ${r.solid}/${r.total} vững <span class="hint">· ô ${esc(r.slot)}${r.mid ? ' · tin cậy vừa' : ''}</span></b>
      <span class="cmpbar" role="img" aria-label="${esc(r.vi)}: ${r.game} nhờ game, ${r.app} nhờ Học bài, ${r.nd} nhờ Ôn luyện, ${r.both} từ hai nguồn, ${r.before} từ trước, ${r.total - r.solid} chưa vững">${seg('cg', r.game)}${seg('ca', r.app)}${seg('cn', r.nd)}${seg('cb2', r.both)}${seg('cp', r.before)}</span>
      <span class="hint aimmore">Bấm để xem ${r.total} phần cần đạt</span></summary>
      ${list}</details>
      <div class="row aimgo">${game}<button class="btn small" data-act="skgo" data-sk="${r.id}">${r.id === 'pro' ? '🔁 Ôn luyện' : '📘 Học bài'}</button><button class="btn small" data-e="trystart" data-sk="${r.id}" data-lv="${x.lv}">🎲 Thử sức</button>${GP_OF[r.id] ? `<button class="btn small" data-act="gp" data-lv="${x.lv}" data-kind="${GP_OF[r.id]![0]}" data-mode="${GP_OF[r.id]![1]}">📝 Bài luyện</button>` : ''}</div>
    </li>`;
  }).join('');
  const g = x.gate;
  const gate = !g.has ? '<p class="hint">Cấp này chưa có bài thi chuyển cấp.</p>'
    : g.passed ? `<p><b>✓ Đã qua thi chuyển cấp ${x.lv}.</b></p>`
    : g.wait && x.chosen ? `<p class="hint">Lần trước chưa qua. Mỗi lần là bài mới, nhưng cần học thêm rồi mới làm lại: ${esc(waitTxt(g.wait))}.</p>`
    : g.open && x.chosen ? `<p>Bạn đã gần xong mục tiêu. Bài gồm Đọc, Nghe, Viết, Nói, sinh mới mỗi lần theo tiêu chí của cấp; không gợi ý. Qua là tự lên cấp.</p><div class="row"><button class="btn primary" data-e="go" data-r="gate">🚪 Vào thi chuyển cấp ${x.lv}</button></div>`
    : g.parts ? `<p class="hint">Mở khi 📘 Học ≥ ${Math.round(GATE.learn * 100)}% và 🔁 Nhớ ≥ ${Math.round(GATE.mem * 100)}% (xem hai thanh ở trên). Mỗi lần làm là một bài mới sinh theo tiêu chí. Qua là tự lên cấp.</p>`
    : `<p class="hint">Mở khi đã vững ≥ 80% (hiện ${pct(g.ratio, 1)}%). Mỗi lần làm là một bài mới sinh theo tiêu chí. Qua là tự lên cấp.</p>`;
  // v154 hai thanh (người sáng lập 17/10/2026): 📘 Học (đã qua bài cuối) và 🔁 Nhớ (nhớ ra sau ≥ 3 ngày, chưa phai). Mở thi: Học ≥ 80% VÀ Nhớ ≥ 70%.
  const pt = g.parts, bar = (ic: string, t: string, n: number, need: number, sub: string) => { const q = pt && pt.total ? Math.round(100 * n / pt.total) : 0;
    return `<div class="stack" style="gap:4px"><p><b>${ic} ${t}</b> · ${n}/${pt!.total} phần (${q}%) <span class="hint">· cần ${Math.round(need * 100)}% ${q >= need * 100 ? '✓' : ''}</span></p><span class="lskbar" role="progressbar" aria-label="${t} ${x.lv}" aria-valuemin="0" aria-valuemax="${pt!.total}" aria-valuenow="${n}"><i style="width:${q}%"></i></span><p class="hint">${sub}</p></div>`; };
  const two = pt && pt.total ? `<section class="panel stack aimtwo" aria-label="Học và Nhớ"><h2>Mở thi chuyển cấp ${x.lv} khi</h2>${bar('📘', 'Học', pt.learn, GATE.learn, 'Đã qua bài cuối của bài học (unit, điểm ngữ pháp, cặp âm, chức năng giao tiếp).')}${bar('🔁', 'Nhớ', pt.mem, GATE.mem, 'Làm đúng lại sau ≥ 3 ngày kể từ lúc học và hiện chưa phai. Nhớ không bù cho Học.')}</section>` : '';
  const pick = x.chosen ? '' : `<div class="row"><button class="btn primary" data-e="aimpick" data-g="${id}">Chọn ${x.lv} làm đích</button></div>`;
  return `${head}
    <section class="panel stack cmp aim">
      <p><b>Cần đạt để qua ${x.lv}</b> · ${o.solid}/${o.total} phần đã vững (${p}%)</p>
      <span class="lskbar" role="progressbar" aria-label="Tiến độ ${x.lv}" aria-valuemin="0" aria-valuemax="${o.total}" aria-valuenow="${o.solid}"><i style="width:${p}%"></i></span>
      ${pick}
      <p class="hint cmpleg"><i class="cg"></i> nhờ game · <i class="ca"></i> nhờ Học bài · <i class="cn"></i> nhờ Ôn luyện · <i class="cb2"></i> từ hai nguồn · <i class="cp"></i> có từ trước</p>
      <ul class="cmplist">${rows}</ul>
    </section>
    ${two}
    <section class="panel stack"><h2>🚪 Thi chuyển cấp ${x.lv}</h2>${gate}</section>
    ${x.cert ?? ''}
    <p class="cmpv">${esc(cmpVerdict(o, x.cap))}</p>
    <div class="row"><button class="btn" data-e="go" data-r="goal/${id}">Xem từng năng lực của ${x.lv}</button></div>`;
}
