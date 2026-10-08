// Màn hình engine (M1): mục tiêu của bạn, chọn mục tiêu theo loại, xem Target Model cần đạt gì.

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import { GOAL_MAX } from './state.ts';
import { META, GOALS, loaded, goalOn, type GoalMeta } from './data.ts';
import { closure, defaultLevel } from './graph.ts';
import { statusOf, type NodeState } from './mastery.ts';
import { readinessOf, readyChip, viewReady } from './readyview.ts';
import { LEVEL_VI, type Area, type GoalKind, type Node, type Req } from './types.ts';

export interface ECtx { host: EHost; e: EState; route: string; future?: boolean; hidden?: number }   // e.goals chỉ gồm mục tiêu đang mở; hidden = số mục tiêu tạm ẩn

export const KIND_VI: Record<GoalKind, [string, string]> = {
  cefr: ['Tiếng Anh tổng quát (CEFR)', 'Từ A1 đến C2: đủ từ vựng, ngữ pháp, phát âm và bốn kỹ năng của một cấp.'],
  vstep: ['VSTEP', 'Chứng chỉ trong nước bậc 3–5 (B1–C1), định dạng theo Quyết định 729/QĐ-BGDĐT.'],
  'ielts-ac': ['IELTS Academic', 'Du học, xét tuyển, chuẩn đầu ra. Band 4.0–9.0.'],
  'ielts-gt': ['IELTS General Training', 'Định cư, làm việc ở nước ngoài. Band 4.0–9.0.'],
  comm: ['Giao tiếp', 'Hằng ngày, du lịch, nơi làm việc, học tập: đủ năng lực dùng thật, không gắn kỳ thi.'],
};
const KINDS = Object.keys(KIND_VI) as GoalKind[];
const AREA_VI: Record<Area, string> = { voc: 'Từ vựng', gra: 'Ngữ pháp', pro: 'Phát âm', lis: 'Nghe', rd: 'Đọc', wr: 'Viết', spk: 'Nói', task: 'Dạng bài thi' };
const AREA_ORDER: Area[] = ['voc', 'gra', 'pro', 'lis', 'rd', 'wr', 'spk', 'task'];
export interface NStat { pass: boolean; pct: number; conf: 'low' | 'mid' | 'high'; none: boolean; state?: NodeState }
// Trạng thái một nút ở mức cần: Can-Do lấy từ app (bằng chứng hoạt động), nút khác lấy từ kho mastery của engine.
export function nodeStat(host: EHost, e: EState, node: string, level: Req['level']): NStat {
  if (node.startsWith('cd:')) {
    const c = host.cando(node.slice(3));
    if (!c || !c.k) return { pass: false, pct: 0, conf: 'low', none: true };
    return { pass: c.p >= 1, pct: c.p, conf: c.k >= 3 && c.lb >= 0.6 ? 'high' : c.k >= 2 ? 'mid' : 'low', none: false };
  }
  const s = statusOf(e.m, node, level), cell = e.m[node]?.[level];
  if (!cell) return { pass: false, pct: 0, conf: 'low', none: true };
  return { pass: s.pass, pct: s.pass ? 1 : Math.min(0.79, s.m), conf: s.conf, none: false, state: s.state };
}
const CONF_VI = { low: 'tin cậy thấp', mid: 'tin cậy vừa', high: 'tin cậy cao' } as const;
const STATE_CHIP: Partial<Record<NodeState, string>> = {
  inferred: 'suy ra từ chẩn đoán, đang xác nhận', verify: 'cần xác minh ở câu mới', reopened: 'mở lại: bằng chứng mới mâu thuẫn',
};
export const statChip = (st: NStat): string => st.none ? '<span class="pill">chưa có bằng chứng</span>'
  : st.state && STATE_CHIP[st.state] && !(st.state === 'inferred' && st.pass) ? `<span class="pill warn">${STATE_CHIP[st.state]} · ${Math.round(st.pct * 100)}%</span>`
  : st.state === 'inferred' ? `<span class="pill">≈ Đạt (${STATE_CHIP.inferred})</span>`
  : st.pass ? `<span class="pill" style="color:var(--good)">✓ Đạt · ${CONF_VI[st.conf]}</span>` : `<span class="pill">${Math.round(st.pct * 100)}% · ${CONF_VI[st.conf]}</span>`;
const back = (r = 'goals', t = 'Mục tiêu của bạn') => `<div class="row"><button class="btn ghost" data-e="go" data-r="${r}">← ${t}</button></div>`;
const hours = (min: number): string => (min < 90 ? `${Math.max(1, Math.round(min))} phút` : `≈ ${Math.round(min / 60)} giờ`);

export function viewGoals(c: ECtx): string {
  const { host, e } = c, esc = host.esc;
  const mine = e.goals.map(s => ({ s, m: GOALS.get(s.id) })).filter((x): x is { s: EState['goals'][number]; m: GoalMeta } => !!x.m);
  const head = `<section class="stack"><span class="eyebrow">Mục tiêu</span><h1>Mục tiêu của bạn</h1>
    <p class="muted">App chỉ cho bạn học những gì mục tiêu thật sự cần và bạn chưa thành thạo. Mỗi mục tiêu là một danh sách năng lực cần đạt (Target Model), có phiên bản.</p></section>`;
  const kinds = `<div class="units">${KINDS.filter(k => META.goals.some(g => g.kind === k && goalOn(g.id, !!c.future))).map(k => `<button class="unit morei" data-e="go" data-r="pick/${k}"><span class="no">${host.ico(k === 'comm' ? 'mic' : k === 'cefr' ? 'map' : 'exam')}</span><span class="t"><strong>${esc(KIND_VI[k][0])}</strong><span class="muted">${esc(KIND_VI[k][1])}</span></span></button>`).join('')}</div>`;
  const diag = e.diag ? `<section class="panel spread"><span>Chẩn đoán gần nhất: từ vựng ≈ ${esc(cefrName(e.diag.u))}, ngữ pháp ≈ ${esc(cefrName(e.diag.g))}</span><button class="btn small" data-e="go" data-r="diag-result">Xem</button></section>`
    : `<section class="panel stack"><h3>Bạn đang ở đâu?</h3><p class="muted">Bài dò 10–20 phút để app bỏ qua những gì bạn đã biết.</p><div class="row"><button class="btn primary small" data-e="go" data-r="diag">Làm bài chẩn đoán</button></div></section>`;
  const hid = c.hidden ? `<p class="hint">${c.hidden} mục tiêu kỳ thi/giao tiếp đã chọn trước đây đang tạm ẩn: bản này tập trung vào CEFR (Pre-A1 → C2). Bằng chứng đã có vẫn được giữ.</p>` : '';
  if (!mine.length) return `${head}${diag}${hid}<section class="stack"><h2>Bạn muốn đạt gì?</h2></section>${kinds}`;
  const cards = mine.map(({ s, m }) => `<section class="panel stack" aria-label="${esc(m.vi)}">
      <div class="spread"><h3>${esc(m.vi)}</h3><span class="pill">Target Model ${esc(s.version)}</span></div>
      <p class="muted">${m.n} năng lực ghi trực tiếp${s.date !== null ? ` · hạn ${esc(isoOf(s.date))}` : ''}</p>
      ${(() => { const g = loaded()?.goal.get(m.id); return g ? `<div class="row" style="gap:6px">${readyChip(readinessOf(host, e, g))}</div>` : ''; })()}
      <div class="row"><button class="btn primary small" data-e="go" data-r="goal/${esc(m.id)}">Xem cần đạt gì</button><button class="btn ghost small" data-e="rm" data-g="${esc(m.id)}" aria-label="Bỏ mục tiêu ${esc(m.vi)}">Bỏ</button></div></section>`).join('');
  return `${head}${diag}${hid}${cards}${mine.length < GOAL_MAX ? `<section class="stack"><h2>Thêm mục tiêu</h2><p class="muted">Có nhiều mục tiêu thì app gộp lại: năng lực chung chỉ học một lần, lấy mức cao nhất.</p></section>${kinds}` : `<p class="hint">Tối đa ${GOAL_MAX} mục tiêu cùng lúc.</p>`}`;
}

export function viewPick(c: ECtx): string {
  const { host, e } = c, esc = host.esc, k = c.route.split('/')[1] as GoalKind;
  if (!KIND_VI[k]) return viewGoals(c);
  const have = new Set(e.goals.map(g => g.id)), list = META.goals.filter(g => g.kind === k && goalOn(g.id, !!c.future));
  const btn = (g: GoalMeta, label: string) => have.has(g.id)
    ? `<button class="btn small" disabled aria-label="${esc(g.vi)} (đã chọn)">✓ ${esc(label)}</button>`
    : `<button class="btn small" data-e="add" data-g="${esc(g.id)}" aria-label="Chọn ${esc(g.vi)}">${esc(label)}</button>`;
  const body = k === 'ielts-ac' || k === 'ielts-gt'
    ? `<section class="panel stack"><h3>Chọn band mục tiêu</h3><div class="row" style="gap:6px">${list.map(g => btn(g, g.target)).join('')}</div>
       <p class="hint">Band 5.5–6.5 ứng với B2, 7.0–8.0 với C1 (bảng quy đổi có nguồn ở trang Ôn thi → Cách tính điểm). Band cao hơn trong cùng cấp đòi mức làm bài cao hơn.</p></section>`
    : `<div class="units">${list.map(g => `<div class="unit morei"><span class="t"><strong>${esc(g.vi)}</strong><span class="muted">${g.n} năng lực ghi trực tiếp · Target Model ${esc(g.version)}</span></span>${btn(g, have.has(g.id) ? 'Đã chọn' : 'Chọn')}</div>`).join('')}</div>`;
  return `<section class="stack"><span class="eyebrow">Mục tiêu · ${esc(KIND_VI[k][0])}</span><h1>${esc(KIND_VI[k][0])}</h1><p class="muted">${esc(KIND_VI[k][1])}</p></section>${body}${back()}`;
}

export function viewGoal(c: ECtx, loadErr: string): string {
  const { host, e } = c, esc = host.esc, id = c.route.split('/')[1] ?? '', m = GOALS.get(id);
  if (!m) return viewGoals(c);
  const ix = loaded();
  const head = `<section class="stack"><span class="eyebrow">Mục tiêu · Target Model ${esc(m.version)}</span><h1>${esc(m.vi)}</h1></section>`;
  if (!ix) return `${head}${loadErr ? `<p class="warnt" role="alert">${esc(loadErr)}</p><div class="row"><button class="btn primary" data-e="retry">Thử lại</button></div>` : '<p class="muted" role="status">Đang tải bản đồ năng lực…</p>'}${back()}`;
  const g = ix.goal.get(id)!, all = closure(ix, g.req, defaultLevel), node = (r: Req) => ix.node.get(r.node)!;
  const direct = new Set(g.req.map(r => r.node)), pre = all.filter(r => !direct.has(r.node));
  const minutes = all.reduce((s, r) => s + node(r).minutes, 0);
  const sel = e.goals.find(s => s.id === id);
  const count = (pred: (n: Node) => boolean) => pre.filter(r => pred(node(r))).length;
  const groups = AREA_ORDER.map(a => [a, g.req.filter(r => node(r).area === a)] as const).filter(([, rs]) => rs.length);
  const stats = new Map(g.req.map(r => [r.node, nodeStat(host, e, r.node, r.level)]));
  const passed = g.req.filter(r => stats.get(r.node)!.pass).length;
  const row = (r: Req) => { const n = node(r), act = n.acts[0];
    return `<li style="display:flex;gap:8px;align-items:center;justify-content:space-between"><span style="flex:1;min-width:0">${esc(n.vi)} <span class="hint">· cần mức ${r.level}: ${esc(LEVEL_VI[r.level])}</span><br>${statChip(stats.get(r.node)!)} <button class="linkbtn" data-e="go" data-r="why/${esc(r.node)}" aria-label="Vì sao: ${esc(n.vi)}">Vì sao?</button></span>${act ? `<button class="btn small ghost" style="flex:none" ${act.at} aria-label="Học: ${esc(n.vi)}">Học</button>` : '<span class="pill" style="flex:none" title="Nội dung sẽ được bổ sung">chưa có bài</span>'}</li>`; };
  return `${head}
    <section class="panel stack"><div class="me-stats me3">
      <div class="stat"><b>${passed}/${g.req.length}</b><span class="muted">tiến độ học: năng lực đã đạt</span></div>
      <div class="stat"><b>${all.length}</b><span class="muted">kể cả tiền đề</span></div>
      <div class="stat"><b>${esc(hours(minutes))}</b><span class="muted">học từ đầu (ước tính thô)</span></div></div>
      <p class="hint">Tiền đề gồm ${count(n => n.kind === 'vocab')} cụm từ vựng, ${count(n => n.kind === 'grammar')} điểm ngữ pháp và ${count(n => n.kind === 'cando')} năng lực cấp dưới. Thứ bạn đã thành thạo sẽ được bỏ khỏi lộ trình sau bài chẩn đoán, nên con số thật thường nhỏ hơn.</p></section>
    ${viewReady(host, g, readinessOf(host, e, g), e)}
    ${sel ? `<form class="panel stack" data-eform="date" data-g="${esc(id)}"><label class="stack" style="gap:4px"><b>Ngày thi hoặc hạn muốn đạt</b><input class="field" type="date" name="date" value="${sel.date !== null ? isoOf(sel.date) : ''}" min="${isoOf(host.today())}"></label><div class="row"><button class="btn small">Lưu</button></div></form>`
      : `<div class="row"><button class="btn primary" data-e="add" data-g="${esc(id)}">Chọn mục tiêu này</button></div>`}
    ${groups.map(([a, rs]) => `<section class="stack"><h2>${esc(AREA_VI[a])} <span class="hint">(${rs.length})</span></h2><ul class="stack" style="list-style:none;padding:0;margin:0;gap:6px">${rs.map(row).join('')}</ul></section>`).join('')}
    ${back()}`;
}

const cefrName = (x: number): string => { const C = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']; return C[Math.floor(x)]! + (x % 1 ? '–' + C[Math.ceil(x)]! : ''); };
export const isoOf = (d: number): string => new Date(d * 86400000).toISOString().slice(0, 10);
export const dayOf = (iso: string): number | null => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? Math.floor(Date.parse(iso + 'T00:00:00Z') / 86400000) : null);
