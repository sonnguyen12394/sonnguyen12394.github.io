// Điểm vào của engine học theo mục tiêu (docs/SPEC.md). app.js nạp tệp này (import động) qua EHOST, cùng khuôn với phần ôn thi.
// Sự kiện bấm dùng thuộc tính data-e, biểu mẫu dùng data-eform, để không lẫn với app.js (data-act) và phần ôn thi (data-x).

import type { EHost } from './host.ts';
import { migrateE, sanitizeE, mergeE, E_V, GOAL_MAX, type EState } from './state.ts';
import { GOALS, loadGraph, loaded, goalOn } from './data.ts';
import { viewGoals, viewPick, viewGoal, dayOf, type ECtx } from './views.ts';
import { viewDiagIntro, viewDiagRun, viewDiagResult, viewLoading, lrBand, type DiagRun } from './diagview.ts';
import { startDiag, nextProbe, answer, finished, level, priorFor, cefrIdx, type Cand } from './diag.ts';
import { ingest, setPrior } from './ev/store.ts';
import { dev } from './core.ts';
import { addSnap } from './ev/snapshot.ts';
import { RULE_ID } from './ev/evaluate.ts';
import { viewWhy } from './whyview.ts';
import { rootVerdict, MODE_VI, type Mode } from './probe.ts';
import { eig } from './probe.ts';
import { closure, defaultLevel, mergeGoals } from './graph.ts';
import { bandToCefr } from '../exam/scales.ts';
import { viewToday, viewTout, viewProbeDone, nextStep, type ToutRun } from './today.ts';
import { nodeStat } from './views.ts';

export const MODULE_VERSION = 1;

export interface EngineModule {
  version: number;
  render(route: string): string;
  after(route: string): void;
  next(): { h: string; p: string; btn: string } | null;   // nút chính trang chủ theo lộ trình; null = dùng cách cũ
  sanitize(e: unknown): EState;
  merge(a: unknown, b: unknown): EState;
}

let bound = false;

export function init(host: EHost): EngineModule {
  const E = (): EState => {
    const root = host.state(), cur = root.e as EState | undefined;
    if (cur && typeof cur === 'object' && cur.v === E_V) return cur;
    const before = JSON.stringify(root.e ?? null), next = migrateE(root.e);
    root.e = next;
    if (JSON.stringify(next) !== before) host.save();
    return next;
  };
  E();
  // Mục tiêu đang mở (spec v2.4: MVP chỉ CEFR). Mục tiêu "tương lai" đã chọn trước đây vẫn nằm trong bản lưu nhưng
  // không vào lộ trình, chẩn đoán hay Readiness. V() là bản nhìn của E() chỉ gồm mục tiêu đang mở (dùng chung kho bằng chứng).
  const future = (): boolean => !!host.future?.();
  const V = (): EState => { const e = E(); return { ...e, goals: e.goals.filter(g => goalOn(g.id, future())) }; };
  let loadErr = '';
  const needGraph = (route: string) => route.startsWith('goal/') || route.startsWith('why') || route.startsWith('probe') || route.startsWith('diag') || route.startsWith('today') || route.startsWith('tout');
  const ensure = () => {
    if (loaded()) return;
    loadGraph(host.fetchJson).then(() => { loadErr = ''; host.render(); })
      .catch(() => { loadErr = 'Chưa tải được bản đồ năng lực. Kiểm tra mạng rồi thử lại.'; host.render(); });
  };

  // ---------- Chẩn đoán (M3) ----------
  let drun: DiagRun | null = null;
  const lr = () => lrBand(host.state());
  const norm = (s: string) => s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  function candidates(): Cand[] {
    const ix = loaded()!, e = V();
    const goals = e.goals.map(s => ix.goal.get(s.id)).filter((g): g is NonNullable<typeof g> => !!g);
    const ids = goals.length ? new Set(closure(ix, mergeGoals(goals), defaultLevel).map(r => r.node)) : null;
    const out: Cand[] = [];
    for (const n of ix.node.values()) {
      if ((n.kind !== 'vocab' && n.kind !== 'grammar') || (ids && !ids.has(n.id))) continue;
      out.push({ id: n.id, kind: n.kind === 'vocab' ? 'u' : 'g', lv: cefrIdx(n.cefr), weight: (ix.post.get(n.id) ?? []).filter(x => x.type === 'hard').length });
    }
    return out;
  }
  function startLevel(): number {
    const b = lr(), bs = [b.L, b.R].filter((x): x is number => x !== null);
    return bs.length ? cefrIdx(bandToCefr(Math.min(...bs))) : 0;
  }
  function loadNode(d: DiagRun['d']): DiagRun | null {
    const cands = candidates();
    for (;;) {
      if (finished(d, Date.now(), cands.length - d.probed.length)) return null;
      const c = nextProbe(d, cands);
      if (!c) return null;
      const qs = host.probe(c.id);
      if (qs.length) return { d, node: c.id, qs, i: 0, got: 0, total: qs.length };
      d.probed.push(c.id);   // nút không có câu dò: bỏ qua
    }
  }
  function finishDiag(): void {
    if (!drun) return;
    const ix = loaded()!, e = E(), d = drun.d, est = { u: level(d.stair.u), g: level(d.stair.g) };
    for (const n of ix.node.values()) {
      if (n.kind !== 'vocab' && n.kind !== 'grammar') continue;
      const p = priorFor(cefrIdx(n.cefr), n.kind === 'vocab' ? est.u : est.g);
      if (p) setPrior(e.ev, e.m, n.id, defaultLevel(n), p[0], p[1], 'diag', host.today());
    }
    e.diag = { day: host.today(), u: est.u, g: est.g, n: d.probed.length };
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: 'diag', dec: `u=${est.u};g=${est.g}`, rule: `${RULE_ID}/diag-stair-1`,
      info: { u: est.u, g: est.g, probes: d.probed.length, start: d.stair.u.seen[0] ?? 0, rev: d.stair.u.rev + d.stair.g.rev },
      evs: e.ev.led.filter(x => x.src === 'diag').slice(-12).map(x => x.id) }, false);
    drun = null; host.save(); host.go('diag-result');
  }
  function diagAnswer(ok: boolean, q: DiagRun['qs'][number]): void {
    if (!drun) return;
    const e = E();
    ingest(e.ev, e.m, { node: drun.node, level: q.level, ok, g: q.g, item: q.id, qt: q.opts ? 'mcq' : 'typed', ctx: 'diag', src: 'diag', ch: 'diag' }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) drun.got++;
    drun.i++;
    if (drun.i >= drun.qs.length) {
      const ix = loaded()!, n = ix.node.get(drun.node)!;
      answer(drun.d, { id: n.id, kind: n.kind === 'vocab' ? 'u' : 'g', lv: cefrIdx(n.cefr), weight: 0 }, drun.got, drun.total);
      const next = loadNode(drun.d);
      if (!next) { finishDiag(); return; }
      drun = next;
    }
    host.save(); host.render();
  }

  // ---------- Kiểm tra để bỏ qua (M4) ----------
  let tout: ToutRun | null = null, toutRes: { node: string; pass: boolean } | null = null;
  function toutStart(node: string): void {
    const qs = host.probe(node);
    tout = qs.length ? { node, qs, i: 0, got: 0 } : null; toutRes = null;
  }
  function toutAnswer(ok: boolean): void {
    if (!tout) return;
    const q = tout.qs[tout.i]!, e = E();
    // Bài kiểm tra có chủ đích ở mức cần: mỗi câu nặng gấp 4 câu luyện (đúng hết thì đủ bằng chứng để Đạt).
    ingest(e.ev, e.m, { node: tout.node, level: q.level, ok, g: q.g, item: q.id, qt: q.opts ? 'mcq' : 'typed', ctx: 'testout', w: 4, src: 'testout', ch: `tout/${tout.node}` }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) tout.got++;
    tout.i++;
    if (tout.i >= tout.qs.length) {
      const ix = loaded()!, n = ix.node.get(tout.node)!, lvl = Math.max(...tout.qs.map(x => x.level)) as 1 | 2 | 3 | 4;
      const need = n.kind === 'vocab' ? 3 : 4, pass = tout.got === tout.qs.length && nodeStat(host, e, tout.node, Math.min(need, lvl) as 3 | 4).pass;
      const st = nodeStat(host, e, tout.node, Math.min(need, lvl) as 3 | 4);
      addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'testout', subj: tout.node, lv: Math.min(need, lvl) as 3 | 4, dec: pass ? 'PASS' : 'FAIL', rule: `${RULE_ID}/testout-1`,
        info: { got: tout.got, of: tout.qs.length, pass: st.pass ? 'yes' : 'no', w: 4 }, evs: e.ev.led.filter(x => x.node === tout!.node && x.src === 'testout').slice(-tout.qs.length).map(x => x.id) }, false);
      toutRes = { node: tout.node, pass }; tout = null;
    }
    host.save(); host.render();
  }

  // ---------- Kiểm tra nhanh: chẩn đoán liên tục (v58) ----------
  // Bằng chứng thường (trọng số 1, khác kiểm tra bỏ qua ×4). Truy gốc: tiền đề trượt → giả thuyết "thiếu tiền đề" đã kiểm chứng.
  let prun: ToutRun | null = null, pres: { node: string; verdict: string; mode: Mode; for?: string } | null = null;
  function probeStart(node: string, lv: number, mode: Mode, forNode?: string): void {
    const qs = host.probe(node).filter(q => q.level <= Math.max(3, lv));
    prun = qs.length ? { node, qs, i: 0, got: 0, mode, ...(forNode ? { for: forNode } : {}), eig: eig(E().m[node]?.[lv as 3]) } : null; pres = null;
  }
  function probeAnswer(ok: boolean): void {
    if (!prun) return;
    const q = prun.qs[prun.i]!, e = E();
    ingest(e.ev, e.m, { node: prun.node, level: q.level, ok, g: q.g, item: q.id, qt: q.opts ? 'mcq' : 'typed', ctx: 'probe', src: 'diag', ch: `probe/${prun.mode}` }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) prun.got++;
    prun.i++;
    if (prun.i >= prun.qs.length) {
      const verdict = rootVerdict(prun.got, prun.qs.length), today = host.today();
      e.ev.pb = e.ev.pb.day === today ? { day: today, n: e.ev.pb.n + 1 } : { day: today, n: 1 };
      if (prun.mode === 'root' && prun.for) {
        if (verdict === 'gap') e.ev.hyp[prun.for] = { kind: 'prereq', cause: prun.node, day: today };
        else if (verdict === 'ok' && e.ev.hyp[prun.for]?.cause === prun.node) delete e.ev.hyp[prun.for];
      }
      addSnap(e.ev, { ts: Date.now(), day: today, kind: 'diag', subj: prun.node, dec: `probe:${prun.mode}:${verdict}`, rule: `${RULE_ID}/probe-1`,
        info: { mode: prun.mode ?? 'explore', got: prun.got, of: prun.qs.length, eig: prun.eig ?? 0, ...(prun.for ? { for: prun.for as string } : {}) },
        evs: e.ev.led.filter(x => x.node === prun!.node && x.ctx === 'probe').slice(-prun.qs.length).map(x => x.id) }, false);
      pres = { node: prun.node, verdict, mode: prun.mode!, ...(prun.for ? { for: prun.for } : {}) }; prun = null;
    }
    host.save(); host.render();
  }

  const routes: Record<string, (c: ECtx) => string> = {
    probe: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      const [, node = '', lv = '3', mode = 'explore', forNode] = c.route.split('/');   // probe/<nút>/<mức>/<chế độ>[/<nút cần nó>]
      if (!prun && (!pres || pres.node !== node)) probeStart(node, Number(lv), mode as Mode, forNode);
      if (pres && pres.node === node) return viewProbeDone(c, pres);
      return viewTout(c, prun, null);
    },
    today: c => (loaded() ? viewToday(c, host.dayInfo()) : (ensure(), viewLoading(c, loadErr))),
    tout: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      const node = c.route.slice('tout/'.length);
      if (!tout && (!toutRes || toutRes.node !== node)) toutStart(node);
      return viewTout(c, tout, toutRes && toutRes.node === node ? toutRes : null);
    },
    diag: c => { if (!loaded()) { if (!loadErr) ensure(); return viewLoading(c, loadErr); } return drun ? viewDiagRun(c, drun) : viewDiagIntro(c, lr()); },
    'diag-result': c => { if (!loaded()) { if (!loadErr) ensure(); return viewLoading(c, loadErr); } return viewDiagResult(c, lr()); },
    goals: viewGoals,
    why: c => { if (!loaded()) { if (!loadErr) ensure(); return viewLoading(c, loadErr); } return viewWhy(c); },
    pick: viewPick,
    goal: c => { if (!loaded() && !loadErr) ensure(); return viewGoal(c, loadErr); },
  };
  function render(route: string): string {
    const name = route.split('/')[0] || 'goals', v = V();
    return (routes[name] ?? viewGoals)({ host, e: v, route, future: future(), hidden: E().goals.length - v.goals.length });
  }

  const act: Record<string, (el: HTMLElement) => void> = {
    go(el) { host.go(el.dataset.r || 'goals'); },
    add(el) {
      const id = el.dataset.g || '', m = GOALS.get(id), e = E();
      if (!m || !goalOn(id, future()) || e.goals.some(g => g.id === id)) return;
      if (e.goals.length >= GOAL_MAX) e.goals = e.goals.filter(g => goalOn(g.id, future()));   // nhường chỗ: bỏ mục tiêu đang ẩn trước
      if (e.goals.length >= GOAL_MAX) { host.toast(`Tối đa ${GOAL_MAX} mục tiêu cùng lúc. Bỏ bớt một mục tiêu trước.`); return; }
      e.goals.push({ id, version: m.version, since: host.today(), date: null });
      host.save(); host.toast(`Đã chọn: ${m.vi}.`); host.go(`goal/${id}`);
    },
    rm(el) {
      const e = E(), id = el.dataset.g || '';
      e.goals = e.goals.filter(g => g.id !== id); host.save(); host.render();
    },
    retry() { loadErr = ''; ensure(); host.render(); },
    dstart() {
      if (!loaded()) { ensure(); return; }
      drun = loadNode(startDiag(startLevel(), Date.now()));
      if (!drun) { host.toast('Không có gì để dò cho mục tiêu này.'); return; }
      host.render();
    },
    dans(el) {
      if (!drun) return;
      const q = drun.qs[drun.i]!, i = Number(el.dataset.i);
      diagAnswer(i >= 0 && i === q.ans, q);
    },
    dstop() { finishDiag(); },
    pans(el) { if (!prun) return; const q = prun.qs[prun.i]!, i = Number(el.dataset.i); probeAnswer(i >= 0 && i === q.ans); },
    tans(el) { if (!tout) return; const q = tout.qs[tout.i]!, i = Number(el.dataset.i); toutAnswer(i >= 0 && i === q.ans); },
  };
  const forms: Record<string, (f: HTMLFormElement) => void> = {
    ptyped(f) {
      if (!prun) return;
      const q = prun.qs[prun.i]!, a = norm(String(new FormData(f).get('a') || ''));
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      probeAnswer((q.accept ?? []).some(x => norm(x) === a));
    },
    ttyped(f) {
      if (!tout) return;
      const q = tout.qs[tout.i]!, a = norm(String(new FormData(f).get('a') || ''));
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      toutAnswer((q.accept ?? []).some(x => norm(x) === a));
    },
    dtyped(f) {
      if (!drun) return;
      const q = drun.qs[drun.i]!, a = norm(String(new FormData(f).get('a') || ''));
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      diagAnswer((q.accept ?? []).some(x => norm(x) === a), q);
    },
    date(f) {
      const e = E(), g = e.goals.find(x => x.id === f.dataset.g), v = String(new FormData(f).get('date') || '');
      if (!g) return;
      g.date = v ? dayOf(v) : null; host.save(); host.toast('Đã lưu.'); host.render();
    },
  };
  if (!bound && typeof document !== 'undefined') {
    bound = true;
    document.addEventListener('click', ev => {
      const t = (ev.target as Element | null)?.closest?.('[data-e]') as HTMLElement | null;
      const f = t && act[t.dataset.e || ''];
      if (f) { ev.preventDefault(); f(t); }
    });
    document.addEventListener('submit', ev => {
      const f = ev.target as HTMLFormElement | null, k = f?.dataset?.eform;
      if (!f || !k || !forms[k]) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); forms[k](f);
    }, true);
  }

  return {
    version: MODULE_VERSION,
    render,
    after(route) { if (needGraph(route) && !loaded()) ensure(); if (!route.startsWith('tout')) { tout = null; toutRes = null; } if (!route.startsWith('probe')) { prun = null; pres = null; } },
    next() {
      const e = V();
      if (!e.goals.length) return null;
      const ix = loaded();
      if (!ix) { ensure(); return null; }
      return nextStep(host, e, ix);
    },
    sanitize: sanitizeE,
    merge: mergeE,
  };
}
