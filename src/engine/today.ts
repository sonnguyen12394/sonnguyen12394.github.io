// Lộ trình hôm nay (M4): buổi học từ Learning Path + ôn duy trì + bài làm thật mỗi tuần; "Bước tiếp theo" cho trang chủ;
// "Kiểm tra để bỏ qua" một nút (spec §6): trả lời đúng hết câu dò ở mức cần thì nút Đạt ngay.

import type { ECtx } from './views.ts';
import { nodeStat } from './views.ts';
import type { EHost, MicroCard } from './host.ts';
import type { EState } from './state.ts';
import { GOALS, loaded } from './data.ts';
import { plan, session, type PathOut, type Session, type PathItem } from './path.ts';
import { LEVEL_VI } from './types.ts';
import { readinessOf, readyChip } from './readyview.ts';
import type { Index } from './graph.ts';
import { addSnap } from './ev/snapshot.ts';
import { nextProbe as pickProbe, MODE_VI, type Mode, type ProbeCand } from './probe.ts';
import { RULE_ID } from './ev/evaluate.ts';
import { rank, NBA_VER, W as NBA_W, type Action, type Kind } from './nba.ts';
import { xferCandidates } from './transfer.ts';
import { seenHas } from './ev/store.ts';

// Transfer (v60, §59): câu ở ngữ cảnh mới mà người học CHƯA gặp ở nút này (sổ "đã gặp" của kho bằng chứng). Tối đa 3 câu.
export function xferItems(host: EHost, e: EState, node: string): ReturnType<EHost['probe']> {
  return (host.transfer?.(node) ?? []).filter(q => !seenHas(e.ev, node, q.id)).slice(0, 3);
}
// Ứng viên transfer cho NBA: chỉ nút còn câu mới (xét tối đa 3 nút quan trọng nhất để không tốn thời gian dựng câu).
export function xferFor(host: EHost, e: EState, ix: Index, p: PathOut): Array<{ node: string; level: number; imp: number }> {
  if (!p.all || !host.transfer) return [];
  return xferCandidates(ix, e.m, e.ev, p.all, host.today(), PROBEABLE).slice(0, 3).filter(c => xferItems(host, e, c.node).length >= 2);
}

// Chẩn đoán liên tục (v58): câu dò có giá trị thông tin cao nhất cho mục tiêu đang mở, trong ngân sách hôm nay.
const PROBEABLE = (id: string): boolean => id.startsWith('u:') || id.startsWith('g:');
export function probeFor(host: EHost, e: EState, ix: Index, p: PathOut): ProbeCand | null {
  if (!p.all) return null;
  const used = e.ev.pb.day === host.today() ? e.ev.pb.n : 0;
  return pickProbe({ ix, m: e.m, need: p.all, open: new Set(p.open.map(x => x.node)), probeable: PROBEABLE }, used);
}

// Next Best Action (v59, spec §56–57): xếp hạng học / ôn / kiểm tra nhanh / xác minh bằng utility có phân rã.
export function computeNba(host: EHost, e: EState, ix: Index, p: PathOut): Action[] {
  const day = host.dayInfo();
  const verify = (p.all ?? []).filter(r => { const st = nodeStat(host, e, r.node, r.level).state; return st === 'verify' || st === 'reopened'; }).map(r => ({ node: r.node, level: r.level }));
  const last = [...(e.ev?.snap ?? [])].reverse().find(x => x.kind === 'nba');
  const prev = last ? { kind: (last.info?.k ?? 'learn') as Kind, node: last.subj } : null;
  return rank({ open: p.open, probe: probeFor(host, e, ix, p), review: { items: day.reviewItems, mins: day.reviewMins, risk: Math.min(1, 0.4 + day.reviewItems / 30) }, verify, prev, transfer: xferFor(host, e, ix, p) });
}

// L4: bước tiếp theo được chọn → snapshot kèm 3 ứng viên đầu, utility và phân rã (HG30, HF10). Bỏ trùng khi lựa chọn không đổi.
export const NBA_RULE = NBA_VER;
const PART_VI: Record<string, string> = { learn: 'học', info: 'thông tin', goal: 'mục tiêu', prereq: 'tiền đề', retain: 'nguy cơ quên', transfer: 'transfer', effort: 'nỗ lực', interrupt: 'ngắt mạch' };
export const partsText = (a: Action): string => Object.entries(a.parts).filter(([, v]) => v).map(([k, v]) => `${PART_VI[k]} ${(Math.round(v * 100) / 100).toString().replace('.', ',')}×${String(NBA_W[k as keyof typeof NBA_W]).replace('.', ',')}${k === 'effort' || k === 'interrupt' ? ' (trừ)' : ''}`).join(' · ');
export function snapNba(host: EHost, e: EState, acts: Action[]): void {
  const top = acts[0];
  if (!top || !e.ev) return;
  addSnap(e.ev, {
    ts: Date.now(), day: host.today(), kind: 'nba', subj: top.node, lv: (top.level || 1) as 1, dec: 'CHOSEN', rule: `${RULE_ID}/${NBA_RULE}`,
    alt: acts.slice(0, 3).map(x => ({ node: x.node, score: x.u, dep: Math.round(x.parts.prereq * 100) / 100, min: Math.round(x.parts.effort * 20) })),
    info: { k: top.kind, why: top.why, parts: partsText(top), alts: acts.slice(0, 3).map(x => x.kind).join(',') },
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
  const p = computePath(host, e, ix), s = computeSession(host, e, ix, p, day), acts = computeNba(host, e, ix, p), top = acts[0];
  snapNba(host, e, acts);
  const NEXT = 'Bước tiếp theo';
  const head = `<section class="stack"><span class="eyebrow">Lộ trình hôm nay · ${day.mins} phút</span><h1>Hôm nay học gì</h1>
    <p class="muted">Còn ${p.unmet.length}/${p.total} năng lực chưa đạt (≈ ${Math.max(1, Math.round(p.minutes / 60))} giờ học). App chỉ đưa vào những gì mục tiêu cần và bạn chưa thành thạo.${e.diag ? '' : ' Chưa làm bài chẩn đoán: lộ trình có thể gồm cả thứ bạn đã biết.'}</p>
    <div class="row" style="gap:6px">${e.goals.map(sg => { const g = ix.goal.get(sg.id); return g ? `<button class="btn ghost small" data-e="go" data-r="goal/${esc(g.id)}">${esc(g.vi)}</button>${readyChip(readinessOf(host, e, g))}` : ''; }).join('')}</div>
    ${e.diag ? '' : '<div class="row"><button class="btn small" data-e="go" data-r="diag">Làm bài chẩn đoán</button></div>'}</section>`;
  const vf = acts.find(a => a.kind === 'verify'), pc = probeFor(host, e, ix, p) ?? (vf ? { node: vf.node, level: vf.level as 3, mode: 'verify' as Mode, eig: 0, effort: 1.5, score: 0 } : null);
  const probeTop = top && (top.kind === 'probe' || top.kind === 'verify');
  const probe = pc ? `<section class="panel stack"><span class="eyebrow">${probeTop ? `${NEXT} · ` : ''}Kiểm tra nhanh · 3 câu · không tốn năng lượng</span><div><b>${esc(ix.node.get(pc.node)?.vi ?? pc.node)}</b><br><span class="hint">${esc(MODE_VI[pc.mode])}${pc.for ? ` (vì ${esc(ix.node.get(pc.for)?.vi ?? pc.for)})` : ''}</span></div><div class="row"><button class="btn small" data-e="go" data-r="probe/${esc(pc.node)}/${pc.level}/${pc.mode}${pc.for ? '/' + esc(pc.for) : ''}">Làm ngay</button></div></section>` : '';
  const review = s.review > 0 ? `<section class="panel stack"><span class="eyebrow">${top?.kind === 'review' ? `${NEXT} · ` : ''}Ôn duy trì</span><div><b>${day.reviewItems} mục đến hạn ôn</b><br><span class="hint">Những gì đã đạt nhưng sắp quên · ≈ ${s.review} phút</span></div><div class="row"><button class="btn primary small" data-act="review">Ôn ngay</button></div></section>` : '';
  const xt = acts.find(a => a.kind === 'transfer'), xTop = top?.kind === 'transfer';
  const xfer = xt ? `<section class="panel stack"><span class="eyebrow">${xTop ? `${NEXT} · ` : ''}Thử ở câu mới · 3 câu · không tốn năng lượng</span><div><b>${esc(ix.node.get(xt.node)?.vi ?? xt.node)}</b><br><span class="hint">Bạn đã Đạt phần này khi luyện. Dùng được ở câu chưa gặp mới là biết thật.</span></div><div class="row"><button class="btn small" data-e="go" data-r="xfer/${esc(xt.node)}/${xt.level}">Thử ngay</button></div></section>` : '';
  const perf = s.perf ? itemHtml(host, ix, s.perf, 'Bài làm thật trong tuần') : '';
  const items = s.items.map((it, i) => itemHtml(host, ix, it, i === 0 && (!top || top.kind === 'learn') ? NEXT : '')).join('');
  const done = !p.unmet.length ? '<section class="panel stack"><h3>Đã đạt mọi năng lực của mục tiêu</h3><p class="muted">Tiếp tục ôn duy trì. Với kỳ thi, mục tiêu chỉ được xác nhận bằng điểm thi thật.</p></section>' : '';
  // Thứ tự khối theo Bước tiếp theo của NBA: hành động có utility cao nhất lên đầu.
  const blocks = top?.kind === 'review' ? [review, probe, xfer, perf, items] : probeTop ? [probe, review, xfer, perf, items] : xTop ? [xfer, review, probe, perf, items] : [review, probe, xfer, perf, items];
  return `${head}${blocks.join('')}${done}<div class="row"><button class="btn ghost" data-e="go" data-r="goals">Mục tiêu của bạn</button></div>`;
}

// Nút chính trang chủ (thay "unit kế tiếp" của khoá học cũ). null = chưa sẵn sàng / chưa có mục tiêu → app dùng cách cũ.
export function nextStep(host: EHost, e: EState, ix: Index): { h: string; p: string; btn: string } | null {
  if (!e.goals.length) return null;
  const p = computePath(host, e, ix), acts = computeNba(host, e, ix, p), top = acts[0];
  const esc = host.esc;
  snapNba(host, e, acts);
  if (top && top.kind === 'review') return { h: 'Bước tiếp theo: ôn phần sắp quên', p: `${esc(top.why)}. Ôn đúng lúc giữ những gì bạn đã đạt. Còn ${p.unmet.length}/${p.total} năng lực chưa đạt.`, btn: `<button class="btn primary big" data-act="review">▶ Ôn ngay</button><div class="row" style="justify-content:center;gap:6px"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button></div>` };
  if (top && (top.kind === 'probe' || top.kind === 'verify')) {
    const mode = top.kind === 'verify' ? 'verify' : top.probe!.mode, forN = top.probe?.for;
    return { h: `Bước tiếp theo: kiểm tra nhanh ${esc(ix.node.get(top.node)?.vi ?? top.node)}`, p: `${esc(MODE_VI[mode])}. 3 câu, không tốn năng lượng.`, btn: `<button class="btn primary big" data-e="go" data-r="probe/${esc(top.node)}/${top.level}/${mode}${forN ? '/' + esc(forN) : ''}">▶ Làm ngay</button><div class="row" style="justify-content:center;gap:6px"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost small" data-e="go" data-r="why/${esc(top.node)}">Vì sao?</button></div>` };
  }
  if (top && top.kind === 'transfer') return { h: `Bước tiếp theo: thử ${esc(ix.node.get(top.node)?.vi ?? top.node)} ở câu mới`, p: 'Bạn đã Đạt phần này khi luyện. 3 câu chưa gặp để chắc là dùng được thật. Không tốn năng lượng.', btn: `<button class="btn primary big" data-e="go" data-r="xfer/${esc(top.node)}/${top.level}">▶ Thử ngay</button><div class="row" style="justify-content:center;gap:6px"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost small" data-e="go" data-r="why/${esc(top.node)}">Vì sao?</button></div>` };
  const it = p.open.find(o => o.node === top?.node) ?? p.open[0];
  if (!it) return { h: 'Đã đạt mọi năng lực của mục tiêu', p: 'Ôn duy trì để giữ, hoặc thêm mục tiêu mới.', btn: '<button class="btn primary big" data-e="go" data-r="goals">Mục tiêu của bạn</button>' };
  const n = ix.node.get(it.node)!, act = n.acts[0];
  return {
    h: `Bước tiếp theo: ${esc(n.vi)}`,
    p: `${esc(why(ix, it))}. Khoảng ${Math.min(20, it.minutes)} phút. Còn ${p.unmet.length}/${p.total} năng lực chưa đạt.`,
    btn: `${act ? `<button class="btn primary big" ${act.at}>▶ Học ngay</button>` : `<button class="btn primary big" data-e="go" data-r="today">Xem lộ trình hôm nay</button>`}<div class="row" style="justify-content:center;gap:6px"><button class="btn ghost small" data-e="go" data-r="today">Lộ trình hôm nay</button><button class="btn ghost small" data-e="go" data-r="why/${esc(it.node)}">Vì sao?</button>${canTestOut(it.node) ? `<button class="btn ghost small" data-e="go" data-r="tout/${esc(it.node)}">Tôi biết rồi</button>` : ''}</div>`,
  };
}

export interface ToutRun { node: string; qs: ReturnType<EHost['probe']>; i: number; got: number; mode?: Mode; for?: string; eig?: number; x?: boolean; micro?: boolean }
export function viewTout(c: ECtx, run: ToutRun | null, result: { node: string; pass: boolean } | null): string {
  const { host } = c, esc = host.esc, ix = loaded()!;
  if (result) {
    const n = ix.node.get(result.node);
    return `<section class="stack"><span class="eyebrow">Kiểm tra để bỏ qua</span><h1>${result.pass ? 'Đạt: bỏ qua phần này' : 'Chưa đủ để bỏ qua'}</h1>
      <p class="muted">${esc(n?.vi ?? '')}: ${result.pass ? 'đã được tính là Đạt và ra khỏi lộ trình. Nếu sau này bạn quên, phần ôn sẽ đưa nó trở lại.' : 'học phần này một lượt sẽ nhanh hơn bạn nghĩ.'}</p></section>
      <div class="row"><button class="btn primary" data-e="go" data-r="today">Về lộ trình hôm nay</button></div>`;
  }
  if (!run) return `<p class="muted">Không có câu kiểm tra cho phần này.</p><div class="row"><button class="btn" data-e="go" data-r="today">Về lộ trình</button></div>`;
  const q = run.qs[run.i]!, n = ix.node.get(run.node)!, act = run.micro ? 'mans' : run.x ? 'xans' : run.mode ? 'pans' : 'tans', form = run.micro ? 'mtyped' : run.x ? 'xtyped' : run.mode ? 'ptyped' : 'ttyped';
  const body = q.opts
    ? `<div class="stack" style="gap:8px">${q.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="${act}" data-i="${i}">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="${act}" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="${form}"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="${act}" data-i="-1">Không biết</button></div></form>`;
  return `<section class="stack"><span class="eyebrow">${run.micro ? 'Kiểm tra sau bí kíp' : run.x ? 'Thử ở câu mới' : run.mode ? 'Kiểm tra nhanh' : 'Kiểm tra để bỏ qua'} · ${esc(n.vi)} · câu ${run.i + 1}/${run.qs.length}</span>${run.mode ? `<p class="hint">${esc(MODE_VI[run.mode])}</p>` : ''}<h2 style="font-size:20px">${esc(q.prompt)}</h2></section>${body}`;
}

// Bí kíp 60 giây (v61, §52): một khái niệm + một đối chiếu + 2–3 ví dụ, rồi vài câu kiểm tra, rồi quay lại bài đang làm.
export function viewMicroCard(c: ECtx, card: MicroCard, why: string, now: boolean): string {
  const esc = c.host.esc;
  return `<section class="stack"><span class="eyebrow">${now ? 'Học phần nền trước · 1 phút' : 'Bí kíp 60 giây'}</span><h1>${esc(card.title)}${card.en ? ` <span class="muted" style="font-weight:400" lang="en">· ${esc(card.en)}</span>` : ''}</h1>
    <p class="hint">Vì sao app dừng lại ở đây: ${esc(why)}.</p></section>
    <section class="panel stack">${card.concept.map((x, i) => `<p${i ? ' lang="en" class="gform"' : ''}>${esc(x)}</p>`).join('')}
      ${card.mis ? `<p class="warnt"><b>Bạn hay trả lời “<span lang="en">${esc(card.mis)}</span>”.</b>${card.contrast ? ` ${esc(card.contrast)}` : ''}</p>` : card.contrast ? `<p class="warnt">${esc(card.contrast)}</p>` : ''}
      <ul>${card.examples.slice(0, 3).map(([en, vi]) => `<li><span lang="en"><b>${esc(en)}</b></span>${vi ? ` <span class="hint">· ${esc(vi)}</span>` : ''}</li>`).join('')}</ul></section>
    <div class="row"><button class="btn primary" data-e="mgo">Đã hiểu: làm 3 câu kiểm tra</button><button class="btn ghost" data-e="mskip">Bỏ qua</button></div>`;
}
export function viewMicroDone(c: ECtx, r: { node: string; got: number; of: number; verdict: string; back: boolean }): string {
  const { host } = c, esc = host.esc, ix = loaded()!, vi = esc(ix.node.get(r.node)?.vi ?? r.node);
  const msg = r.verdict === 'fixed' ? `Đúng ${r.got}/${r.of}: bạn đã nắm <b>${vi}</b>. App sẽ kiểm lại sau vài ngày ở câu khác để chắc là nhớ lâu.`
    : r.verdict === 'partial' ? `Đúng ${r.got}/${r.of}. Phần <b>${vi}</b> sẽ xuất hiện thêm trong lúc học để bạn luyện tiếp.` : `Đúng ${r.got}/${r.of}. Không sao: <b>${vi}</b> được đưa lên trước trong lộ trình.`;
  return `<section class="stack"><span class="eyebrow">Bí kíp xong</span><h1>${r.verdict === 'fixed' ? 'Đã mở chiêu mới' : 'Đã ghi nhận'}</h1><p>${msg}</p></section>
    <div class="row">${r.back ? '<button class="btn primary" data-e="mback">Quay lại bài đang làm</button>' : '<button class="btn primary" data-e="go" data-r="today">Về lộ trình hôm nay</button>'}<button class="btn ghost" data-e="go" data-r="why/${esc(r.node)}">Vì sao?</button></div>`;
}

// Kết quả thử transfer (v60).
export function viewXferDone(c: ECtx, r: { node: string; got: number; of: number; state: string }): string {
  const { host } = c, esc = host.esc, ix = loaded()!, vi = esc(ix.node.get(r.node)?.vi ?? r.node);
  const msg = r.got === r.of ? `Bạn dùng được <b>${vi}</b> ở câu chưa gặp: đây là bằng chứng mạnh nhất rằng bạn biết thật.`
    : r.state === 'reopened' ? `<b>${vi}</b> chưa dùng được ở câu mới (${r.got}/${r.of}). App mở lại phần này trong lộ trình để luyện thêm ở nhiều ngữ cảnh.`
      : `Đúng ${r.got}/${r.of} câu mới. App ghi nhận và sẽ thử lại sau vài ngày ở câu khác.`;
  return `<section class="stack"><span class="eyebrow">Thử ở câu mới xong</span><h1>${r.got === r.of ? 'Dùng được thật' : 'Đã cập nhật bản đồ năng lực'}</h1><p>${msg}</p></section>
    <div class="row"><button class="btn primary" data-e="go" data-r="today">Về lộ trình hôm nay</button><button class="btn ghost" data-e="go" data-r="why/${esc(r.node)}">Vì sao?</button></div>`;
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
