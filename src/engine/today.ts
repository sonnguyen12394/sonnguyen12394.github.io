// Lộ trình hôm nay (M4): buổi học từ Learning Path + ôn duy trì + bài làm thật mỗi tuần; "Bước tiếp theo" cho trang chủ;
// "Kiểm tra để bỏ qua" một nút (spec §6): trả lời đúng hết câu dò ở mức cần thì nút Đạt ngay.

import type { ECtx } from './views.ts';
import { nodeStat } from './views.ts';
import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import { GOALS, loaded } from './data.ts';
import { plan, session, type PathOut, type Session, type PathItem } from './path.ts';
import { LEVEL_VI } from './types.ts';
import { readinessOf, readyChip } from './readyview.ts';
import type { Index } from './graph.ts';
import { addSnap } from './ev/snapshot.ts';
import { nextProbe as pickProbe, MODE_VI, type Mode, type ProbeCand } from './probe.ts';
import { RULE_ID } from './ev/evaluate.ts';

// Chẩn đoán liên tục (v58): câu dò có giá trị thông tin cao nhất cho mục tiêu đang mở, trong ngân sách hôm nay.
const PROBEABLE = (id: string): boolean => id.startsWith('u:') || id.startsWith('g:');
export function probeFor(host: EHost, e: EState, ix: Index, p: PathOut): ProbeCand | null {
  if (!p.all) return null;
  const used = e.ev.pb.day === host.today() ? e.ev.pb.n : 0;
  return pickProbe({ ix, m: e.m, need: p.all, open: new Set(p.open.map(x => x.node)), probeable: PROBEABLE }, used);
}

// L4: bước tiếp theo được chọn → snapshot kèm 3 ứng viên đầu và điểm ưu tiên (HG30, HF10). Bỏ trùng khi lựa chọn không đổi.
export const NBA_RULE = 'nba-path-1';
export function snapNba(host: EHost, e: EState, p: PathOut): void {
  const top = p.open[0];
  if (!top || !e.ev) return;
  addSnap(e.ev, {
    ts: Date.now(), day: host.today(), kind: 'nba', subj: top.node, lv: top.level, dec: 'CHOSEN', rule: `${RULE_ID}/${NBA_RULE}`,
    alt: p.open.slice(0, 3).map(x => ({ node: x.node, score: Math.round(x.score * 1e4) / 1e4, dep: Math.round(x.dep * 100) / 100, min: x.minutes })),
    info: { unmet: p.unmet.length, total: p.total, goals: e.goals.map(g => g.id).join(',') },
    evs: e.ev.led.filter(x => x.node === top.node).slice(-6).map(x => x.id),
  });
}

export interface DayInfo { reviewItems: number; reviewMins: number; mins: number; perfDue: boolean }

export function computePath(host: EHost, e: EState, ix: Index): PathOut {
  const goals = e.goals.map(s => ({ goal: ix.goal.get(s.id)!, date: s.date })).filter(g => !!g.goal);
  const boost = new Map(Object.values(e.ev?.hyp ?? {}).map(h => [h.cause, 3] as [string, number]));   // nguyên nhân gốc đã kiểm chứng: học trước
  return plan(ix, goals, host.today(), (node, level) => nodeStat(host, e, node, level).pass, boost);
}

export function computeSession(host: EHost, e: EState, ix: Index, p: PathOut, day: DayInfo): Session {
  const perfIds = new Set(e.goals.flatMap(s => ix.goal.get(s.id)?.req.filter(r => r.type === 'performance').map(r => r.node) ?? []));
  return session(p, day.mins, day.reviewMins, day.perfDue, id => perfIds.has(id) || ix.node.get(id)?.kind === 'task');
}

const canTestOut = (id: string): boolean => id.startsWith('u:') || id.startsWith('g:');
const why = (ix: Index, it: PathItem): string => {
  const names = it.goals.map(g => GOALS.get(g)?.vi).filter(Boolean);
  return `Cần cho ${names.length ? names.join(', ') : 'mục tiêu của bạn'}${it.dep >= 2 ? ` · mở đường cho ${Math.floor(it.dep)} năng lực` : ''}`;
};

function itemHtml(host: EHost, ix: Index, it: PathItem, tag = ''): string {
  const esc = host.esc, n = ix.node.get(it.node)!, act = n.acts[0];
  return `<section class="panel stack">${tag ? `<span class="eyebrow">${esc(tag)}</span>` : ''}
    <div><b>${esc(n.vi)}</b><br><span class="hint">${esc(why(ix, it))} · cần mức ${it.level}: ${esc(LEVEL_VI[it.level])} · ≈ ${Math.min(20, it.minutes)} phút</span></div>
    <div class="row">${act ? `<button class="btn primary small" ${act.at}>Học</button>` : '<span class="pill">chưa có bài trong app</span>'}${canTestOut(it.node) ? `<button class="btn ghost small" data-e="go" data-r="tout/${esc(it.node)}">Tôi biết rồi: kiểm tra để bỏ qua</button>` : ''}<button class="btn ghost small" data-e="go" data-r="why/${esc(it.node)}">Vì sao?</button></div></section>`;
}

export function viewToday(c: ECtx, day: DayInfo): string {
  const { host, e } = c, esc = host.esc, ix = loaded()!;
  if (!e.goals.length) return `<section class="stack"><span class="eyebrow">Lộ trình</span><h1>Chưa có mục tiêu</h1><p class="muted">Chọn một mục tiêu để app xếp lộ trình chỉ gồm những gì bạn còn thiếu.</p></section><div class="row"><button class="btn primary" data-e="go" data-r="goals">Chọn mục tiêu</button></div>`;
  const p = computePath(host, e, ix), s = computeSession(host, e, ix, p, day);
  snapNba(host, e, p);
  const head = `<section class="stack"><span class="eyebrow">Lộ trình hôm nay · ${day.mins} phút</span><h1>Hôm nay học gì</h1>
    <p class="muted">Còn ${p.unmet.length}/${p.total} năng lực chưa đạt (≈ ${Math.max(1, Math.round(p.minutes / 60))} giờ học). App chỉ đưa vào những gì mục tiêu cần và bạn chưa thành thạo.${e.diag ? '' : ' Chưa làm bài chẩn đoán: lộ trình có thể gồm cả thứ bạn đã biết.'}</p>
    <div class="row" style="gap:6px">${e.goals.map(sg => { const g = ix.goal.get(sg.id); return g ? `<button class="btn ghost small" data-e="go" data-r="goal/${esc(g.id)}">${esc(g.vi)}</button>${readyChip(readinessOf(host, e, g))}` : ''; }).join('')}</div>
    ${e.diag ? '' : '<div class="row"><button class="btn small" data-e="go" data-r="diag">Làm bài chẩn đoán</button></div>'}</section>`;
  const pc = probeFor(host, e, ix, p);
  const probe = pc ? `<section class="panel stack"><span class="eyebrow">Kiểm tra nhanh · 3 câu · không tốn năng lượng</span><div><b>${esc(ix.node.get(pc.node)?.vi ?? pc.node)}</b><br><span class="hint">${esc(MODE_VI[pc.mode])}${pc.for ? ` (vì ${esc(ix.node.get(pc.for)?.vi ?? pc.for)})` : ''}</span></div><div class="row"><button class="btn small" data-e="go" data-r="probe/${esc(pc.node)}/${pc.level}/${pc.mode}${pc.for ? '/' + esc(pc.for) : ''}">Làm ngay</button></div></section>` : '';
  const review = s.review > 0 ? `<section class="panel stack"><span class="eyebrow">Ôn duy trì</span><div><b>${day.reviewItems} mục đến hạn ôn</b><br><span class="hint">Những gì đã đạt nhưng sắp quên · ≈ ${s.review} phút</span></div><div class="row"><button class="btn primary small" data-act="review">Ôn ngay</button></div></section>` : '';
  const perf = s.perf ? itemHtml(host, ix, s.perf, 'Bài làm thật trong tuần') : '';
  const items = s.items.map((it, i) => itemHtml(host, ix, it, i === 0 ? 'Bước tiếp theo' : '')).join('');
  const done = !p.unmet.length ? '<section class="panel stack"><h3>Đã đạt mọi năng lực của mục tiêu</h3><p class="muted">Tiếp tục ôn duy trì. Với kỳ thi, mục tiêu chỉ được xác nhận bằng điểm thi thật.</p></section>' : '';
  return `${head}${probe}${review}${perf}${items}${done}<div class="row"><button class="btn ghost" data-e="go" data-r="goals">Mục tiêu của bạn</button></div>`;
}

// Nút chính trang chủ (thay "unit kế tiếp" của khoá học cũ). null = chưa sẵn sàng / chưa có mục tiêu → app dùng cách cũ.
export function nextStep(host: EHost, e: EState, ix: Index): { h: string; p: string; btn: string } | null {
  if (!e.goals.length) return null;
  const p = computePath(host, e, ix), it = p.open[0];
  const esc = host.esc;
  snapNba(host, e, p);
  if (!it) return { h: 'Đã đạt mọi năng lực của mục tiêu', p: 'Ôn duy trì để giữ, hoặc thêm mục tiêu mới.', btn: '<button class="btn primary big" data-e="go" data-r="goals">Mục tiêu của bạn</button>' };
  const n = ix.node.get(it.node)!, act = n.acts[0];
  return {
    h: `Bước tiếp theo: ${esc(n.vi)}`,
    p: `${esc(why(ix, it))}. Khoảng ${Math.min(20, it.minutes)} phút. Còn ${p.unmet.length}/${p.total} năng lực chưa đạt.`,
    btn: `${act ? `<button class="btn primary big" ${act.at}>▶ Học ngay</button>` : `<button class="btn primary big" data-e="go" data-r="today">Xem lộ trình hôm nay</button>`}<div class="row" style="justify-content:center;gap:6px"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost small" data-e="go" data-r="why/${esc(it.node)}">Vì sao?</button>${canTestOut(it.node) ? `<button class="btn ghost small" data-e="go" data-r="tout/${esc(it.node)}">Tôi biết rồi</button>` : ''}</div>`,
  };
}

export interface ToutRun { node: string; qs: ReturnType<EHost['probe']>; i: number; got: number; mode?: Mode; for?: string; eig?: number }
export function viewTout(c: ECtx, run: ToutRun | null, result: { node: string; pass: boolean } | null): string {
  const { host } = c, esc = host.esc, ix = loaded()!;
  if (result) {
    const n = ix.node.get(result.node);
    return `<section class="stack"><span class="eyebrow">Kiểm tra để bỏ qua</span><h1>${result.pass ? 'Đạt: bỏ qua phần này' : 'Chưa đủ để bỏ qua'}</h1>
      <p class="muted">${esc(n?.vi ?? '')}: ${result.pass ? 'đã được tính là Đạt và ra khỏi lộ trình. Nếu sau này bạn quên, phần ôn sẽ đưa nó trở lại.' : 'học phần này một lượt sẽ nhanh hơn bạn nghĩ.'}</p></section>
      <div class="row"><button class="btn primary" data-e="go" data-r="today">Về lộ trình hôm nay</button></div>`;
  }
  if (!run) return `<p class="muted">Không có câu kiểm tra cho phần này.</p><div class="row"><button class="btn" data-e="go" data-r="today">Về lộ trình</button></div>`;
  const q = run.qs[run.i]!, n = ix.node.get(run.node)!, act = run.mode ? 'pans' : 'tans', form = run.mode ? 'ptyped' : 'ttyped';
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="${act}" data-i="${i}">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="${act}" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="${form}"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="${act}" data-i="-1">Không biết</button></div></form>`;
  return `<section class="stack"><span class="eyebrow">${run.mode ? 'Kiểm tra nhanh' : 'Kiểm tra để bỏ qua'} · ${esc(n.vi)} · câu ${run.i + 1}/${run.qs.length}</span>${run.mode ? `<p class="hint">${esc(MODE_VI[run.mode])}</p>` : ''}<h2 style="font-size:20px">${esc(q.prompt)}</h2></section>${body}`;
}

// Kết quả kiểm tra nhanh (chẩn đoán liên tục).
export function viewProbeDone(c: ECtx, r: { node: string; verdict: string; mode: Mode; for?: string }): string {
  const { host } = c, esc = host.esc, ix = loaded()!, vi = (id: string) => esc(ix.node.get(id)?.vi ?? id);
  const msg = r.mode === 'root' && r.for
    ? r.verdict === 'gap' ? `Đã tìm ra nguyên nhân: phần nền <b>${vi(r.node)}</b> còn yếu, nên <b>${vi(r.for)}</b> mới hay sai. Lộ trình sẽ đưa phần nền lên trước.`
      : r.verdict === 'ok' ? `Phần nền <b>${vi(r.node)}</b> ổn: lỗi ở <b>${vi(r.for)}</b> không do thiếu nền. App sẽ dạy thẳng phần đó.` : 'Chưa rõ: app sẽ dò thêm trong lúc bạn học.'
    : r.verdict === 'ok' ? `Bạn làm tốt <b>${vi(r.node)}</b>: bằng chứng đã được ghi.` : r.verdict === 'gap' ? `<b>${vi(r.node)}</b> còn hổng: lộ trình sẽ đưa phần này vào.` : 'Đã ghi nhận; app sẽ kiểm lại sau.';
  return `<section class="stack"><span class="eyebrow">Kiểm tra nhanh xong</span><h1>Đã cập nhật bản đồ năng lực</h1><p>${msg}</p></section>
    <div class="row"><button class="btn primary" data-e="go" data-r="today">Về lộ trình hôm nay</button><button class="btn ghost" data-e="go" data-r="why/${esc(r.for ?? r.node)}">Vì sao?</button></div>`;
}
