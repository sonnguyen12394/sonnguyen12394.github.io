// Điểm vào của engine học theo mục tiêu (docs/SPEC.md). app.js nạp tệp này (import động) qua EHOST, cùng khuôn với phần ôn thi.
// Sự kiện bấm dùng thuộc tính data-e, biểu mẫu dùng data-eform, để không lẫn với app.js (data-act) và phần ôn thi (data-x).

import type { EHost } from './host.ts';
import { migrateE, sanitizeE, mergeE, E_V, GOAL_MAX, type EState } from './state.ts';
import { GOALS, loadGraph, loaded, goalOn } from './data.ts';
import { viewGoals, viewPick, viewGoal, dayOf, type ECtx } from './views.ts';
import { viewDiagIntro, viewDiagRun, viewDiagResult, viewLoading, lrBand, type DiagRun } from './diagview.ts';
import { startDiag, nextProbe, answer, finished, level, priorFor, cefrIdx, autoGoal, guessCorrected, recognitionLevel, QUICK_PROBES, type Cand } from './diag.ts';
import { ingest, setPrior } from './ev/store.ts';
import { dev } from './core.ts';
import { addSnap } from './ev/snapshot.ts';
import { RULE_ID } from './ev/evaluate.ts';
import { viewWhy } from './whyview.ts';
import { rootVerdict, MODE_VI, type Mode } from './probe.ts';
import { eig } from './probe.ts';
import { closure, defaultLevel, mergeGoals } from './graph.ts';
import { bandToCefr } from '../exam/scales.ts';
import { viewToday, viewTout, viewProbeDone, viewXferDone, viewMicroCard, viewMicroDone, nextStep, xferItems, type ToutRun } from './today.ts';
import { xferStatus } from './transfer.ts';
import { microVerdict, MICRO, MICRO_VER } from './micro.ts';
import { planFloor, picker, reward, hearts, freshQuest, QUEST_VER, QUEST, type Enc, type FloorIn, type Challenge } from './quest.ts';
import { roll, move, build, canBuild, freshBoardSave, TILES, ROLLS, price } from './board.ts';
import { freshBlocks, deal, place, anyFits, fits, trayEmpty, anchor, freshBlocksSave, bumpStreak } from './blocks.ts';
import { viewLobby, viewBlocks, viewBlocksEnd, viewBoard, viewBoardEnd } from './gameview.ts';
import { viewCards, viewCardsEnd, type CardsRun } from './cardsview.ts';
import { viewCafe, viewCafeEnd, type CafeRun } from './cafeview.ts';
import { GUESTS, stars as cafeStars, freshCafeSave } from './cafe.ts';
import { viewBubbles, viewBubblesEnd, type BubbleRun } from './bubbleview.ts';
import { WORDS, points as bubblePoints, freshBubblesSave } from './bubbles.ts';
import { TABLES, PLAYS, score as cardScore, offer as cardOffer, deal as cardDeal, check as cardCheck, target as cardTarget, freshCardsSave } from './cards.ts';
import { sfx } from './sfx.ts';
import { viewQuestHome, viewQuestRun, viewQuestEnd, type QuestRun, type QItem } from './questview.ts';
import { computePath, computeNba, recallOf } from './today.ts';
import { evRecall } from './retain.ts';
import { seenHas, misconceptions } from './ev/store.ts';
import { remedyFor, pickFor, REMEDY_VI } from './remedy.ts';
import { gaps, weakContext, GAP_VI } from './gap.ts';
import type { Level } from './types.ts';
import { readinessOf } from './readyview.ts';
import { pickNodes, nextPhase, report, armOf, MEASURE_VER, PHASE_VI, type Phase } from './measure.ts';
import { viewMeasure } from './measureview.ts';
import type { MicroCard } from './host.ts';
import { stat, statusOf } from './mastery.ts';
import { nodeStat } from './views.ts';

export const MODULE_VERSION = 1;

export interface EngineModule {
  version: number;
  render(route: string): string;
  after(route: string): void;
  next(): { h: string; p: string; btn: string } | null;   // nút chính trang chủ theo lộ trình; null = dùng cách cũ
  autoGoal(id: string, why: string): boolean;              // goal-first (v64): đặt mục tiêu khi người học chưa có mục tiêu nào
  sanitize(e: unknown): EState;
  merge(a: unknown, b: unknown): EState;
  peek(): Peek | null;   // câu đang hiện (chỉ đọc) cho bot mô phỏng người học (tools/learners): bot "biết" đáp án chỉ khi nó biết nút đó
}
export interface Peek { run: string; node: string; level: number; id: string; prompt: string; opts?: string[]; ans?: number; accept?: string[]; game?: string; gap?: string; tiles?: string[]; order?: number[] }

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
  const needGraph = (route: string) => route.startsWith('goal/') || route.startsWith('why') || route.startsWith('probe') || route.startsWith('diag') || route.startsWith('today') || route.startsWith('tout') || route.startsWith('xfer') || route.startsWith('micro') || route.startsWith('quest') || route.startsWith('measure');
  // Tải đồ thị một lần; đang tải thì không gọi lại; lỗi thì chờ người học bấm "Thử lại" (retry). Trước v64-fix: màn chính (tháp) vẽ lại
  // sau mỗi lần lỗi, mỗi lần vẽ lại gọi ensure() → tải lại → lỗi → vẽ lại… vòng lặp vô hạn khi mất mạng.
  let loading = false;
  const ensure = () => {
    if (loaded() || loading || loadErr) return;
    loading = true;
    loadGraph(host.fetchJson).then(() => { loading = false; loadErr = ''; host.render(); })
      .catch(() => { loading = false; loadErr = 'Chưa tải được bản đồ năng lực. Kiểm tra mạng rồi thử lại.'; host.render(); });
  };

  // ---------- Chẩn đoán (M3) ----------
  let drun: DiagRun | null = null, drec: Array<{ kind: 'u' | 'g'; lv: number; rc: number }> = [], dmcq = { got: 0, n: 0, gs: 0 };
  const lr = () => lrBand(host.state());
  const norm = (s: string) => s.trim().toLowerCase().replace(/[‘’]/g, "'").replace(/[.!?]+$/, '').replace(/\s+/g, ' ');
  // Thêm một mục tiêu (dùng chung cho chọn tay và tự đặt). Trả về false nếu không thêm được.
  function addGoal(id: string, why: 'pick' | 'auto'): boolean {
    const m = GOALS.get(id), e = E();
    if (!m || !goalOn(id, future()) || e.goals.some(g => g.id === id)) return false;
    if (e.goals.length >= GOAL_MAX) e.goals = e.goals.filter(g => goalOn(g.id, future()));   // nhường chỗ: bỏ mục tiêu đang ẩn trước
    if (e.goals.length >= GOAL_MAX) { host.toast(`Tối đa ${GOAL_MAX} mục tiêu cùng lúc. Bỏ bớt một mục tiêu trước.`); return false; }
    const g0 = { id, version: m.version, since: host.today(), date: null };
    // v71 (bot L03): cấp CEFR người học chọn cao hơn mọi mục tiêu CEFR đang có → đứng đầu (mục tiêu chính: tiến độ, kỹ năng vững,
    // Readiness đo theo nó). Mục tiêu app tự đặt thấp hơn được GIỮ làm bậc đệm: mục tiêu CEFR chỉ gồm Can-do đúng cấp (B1 = 49 Can-do B1),
    // nên bỏ nó thì phần nền A1–A2 chỉ còn được tính gián tiếp qua tiền đề (bot L02: ngữ pháp A1–A2 từ 34–58% xuống 9% số lượt).
    if (why === 'pick' && id.startsWith('cefr-') && e.goals.every(g => !g.id.startsWith('cefr-') || cefrRank(g.id) < cefrRank(id))) e.goals.unshift(g0); else e.goals.push(g0);
    if (why === 'auto') addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `goal:${id}`, dec: 'goal:AUTO', rule: `${RULE_ID}/goal-auto-1`,
      info: { goal: id, ...(e.diag ? { u: e.diag.u, g: e.diag.g } : {}) }, evs: [] }, false);
    return true;
  }
  const CEFR_ORDER = ['cefr-pre-a1', 'cefr-a1', 'cefr-a2', 'cefr-b1', 'cefr-b2', 'cefr-c1', 'cefr-c2'];
  const cefrRank = (id: string): number => CEFR_ORDER.indexOf(id);
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
    const rec = { u: recognitionLevel(drec, 'u'), g: recognitionLevel(drec, 'g') };
    for (const n of ix.node.values()) {
      if (n.kind !== 'vocab' && n.kind !== 'grammar') continue;
      const k = n.kind === 'vocab' ? 'u' : 'g', p = priorFor(cefrIdx(n.cefr), est[k]);
      if (p) setPrior(e.ev, e.m, n.id, defaultLevel(n), p[0], p[1], 'diag', host.today());
      // v71: nhận ra đã vững tới cấp rec → tiên nghiệm "đã biết" chỉ ở mức 1–2 (vẫn phải chứng minh tự nhớ ra / dùng được).
      const r = rec[k];
      if (r !== null && cefrIdx(n.cefr) <= r && !(p && p[0] > p[1])) setPrior(e.ev, e.m, n.id, Math.min(2, defaultLevel(n)) as Level, 6, 0.5, 'diag', host.today());
    }
    e.diag = { day: host.today(), u: est.u, g: est.g, n: d.probed.length };
    // Goal-first (v64): chưa có mục tiêu nào đang mở thì tự đặt mục tiêu CEFR kế tiếp (đổi được ở Mục tiêu).
    if (!V().goals.length) { const b = lr(); addGoal(autoGoal(est.u, est.g, [b.L, b.R].map(x => (x === null ? null : bandToCefr(x)))), 'auto'); }
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: 'diag', dec: `u=${est.u};g=${est.g}`, rule: `${RULE_ID}/diag-stair-1`,
      info: { u: est.u, g: est.g, ...(rec.u !== null ? { ru: rec.u } : {}), ...(rec.g !== null ? { rg: rec.g } : {}), probes: d.probed.length, start: d.stair.u.seen[0] ?? 0, rev: d.stair.u.rev + d.stair.g.rev },
      evs: e.ev.led.filter(x => x.src === 'diag').slice(-12).map(x => x.id) }, false);
    drun = null; host.save(); host.go('diag-result');
  }
  function diagAnswer(ok: boolean, q: DiagRun['qs'][number]): void {
    if (!drun) return;
    const e = E();
    ingest(e.ev, e.m, { node: drun.node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'diag', src: 'diag', ch: 'diag' }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) drun.got++;
    drun.gs = (drun.gs ?? 0) + (q.opts ? Math.max(q.g ?? 0, 1 / (q.opts.length + 1)) : 0);
    if (q.opts) { dmcq.n++; if (ok) dmcq.got++; dmcq.gs += Math.max(q.g ?? 0, 1 / (q.opts.length + 1)); }
    drun.i++;
    if (drun.i >= drun.qs.length) {
      const ix = loaded()!, n = ix.node.get(drun.node)!;
      // v69 (bot L01): trừ phần đoán mò trước khi lên/xuống cấp. Biết 60% mà đoán trúng phần còn lại → tỉ lệ đúng thô 70% → trước đây
      // lên cấp, coi cả cấp dưới là đã biết. Hiệu chỉnh cổ điển: r' = (r − ḡ) / (1 − ḡ).
      const rc = dmcq.n ? guessCorrected(dmcq.got, dmcq.n, dmcq.gs) : null;
      answer(drun.d, { id: n.id, kind: n.kind === 'vocab' ? 'u' : 'g', lv: cefrIdx(n.cefr), weight: 0 }, guessCorrected(drun.got, drun.total, drun.gs) * drun.total, drun.total, rc !== null && rc >= 2 / 3);
      if (rc !== null) drec.push({ kind: n.kind === 'vocab' ? 'u' : 'g', lv: cefrIdx(n.cefr), rc });
      dmcq = { got: 0, n: 0, gs: 0 };
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
    ingest(e.ev, e.m, { node: tout.node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'testout', w: 4, src: 'testout', ch: `tout/${tout.node}` }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
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
    ingest(e.ev, e.m, { node: prun.node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'probe', src: 'diag', ch: `probe/${prun.mode}` }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
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

  // ---------- Transfer: thử nút đã Đạt ở câu mới (v60, §59) ----------
  // Câu chưa gặp, ngữ cảnh mới, không gợi ý, trọng số 1. Sai ở câu mới khi đang Đạt → cơ chế mâu thuẫn (§69) mở lại nút.
  let xrun: ToutRun | null = null, xres: { node: string; got: number; of: number; state: string } | null = null, xlv = 3;
  function xferStart(node: string, lv: number): void {
    const qs = xferItems(host, E(), node);
    xrun = qs.length ? { node, qs, i: 0, got: 0, x: true } : null; xres = null; xlv = lv;
  }
  function xferAnswer(ok: boolean, given?: string): void {
    if (!xrun) return;
    const q = xrun.qs[xrun.i]!, e = E();
    ingest(e.ev, e.m, { node: xrun.node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'transfer', src: 'transfer', ch: `xfer/${xrun.node}`, ...(given ? { given, right: (q.opts ? q.opts[q.ans ?? 0] : q.accept?.[0]) ?? '' } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) xrun.got++;
    xrun.i++;
    if (xrun.i >= xrun.qs.length) {
      const st = stat(e.m[xrun.node]?.[xlv as 3]), xs = xferStatus(e.ev, xrun.node);
      addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: xrun.node, lv: xlv as 3, dec: `transfer:${xrun.got === xrun.qs.length ? 'ok' : xrun.got === 0 ? 'fail' : 'partial'}`, rule: `${RULE_ID}/transfer-1`,
        info: { got: xrun.got, of: xrun.qs.length, state: st.state, ok: xs.ok, fail: xs.fail },
        evs: e.ev.led.filter(x => x.node === xrun!.node && x.ctx === 'transfer').slice(-xrun.qs.length).map(x => x.id) }, false);
      xres = { node: xrun.node, got: xrun.got, of: xrun.qs.length, state: st.state }; xrun = null;
    }
    host.save(); host.render();
  }

  // ---------- Bí kíp 60 giây (v61, §51–53) ----------
  // Đọc bí kíp → vài câu kiểm tra → quay lại bài đang làm. Câu ngay sau khi vừa được dạy tính như có trợ giúp (trọng số nhỏ,
  // không tính là "đúng ở câu mới"): kết quả tức thì đánh giá cao việc học thật (§53). Hiệu quả đo bằng snapshot trước/sau.
  let mrun: { key: string; node: string; lv: number; from: string; why: string; card: MicroCard; qs: ToutRun['qs']; run: ToutRun | null; m0: number; res?: { got: number; of: number; verdict: string } } | null = null;
  function microStart(key: string, node: string, lv: number, from: string, why: string): void {
    const x = host.micro?.(node);
    mrun = x ? { key, node, lv, from, why, card: x.card, qs: x.qs.slice(0, MICRO.checkN), run: null, m0: stat(E().m[node]?.[lv as 3]).m } : null;
  }
  function microAnswer(ok: boolean, given?: string): void {
    const r = mrun?.run;
    if (!mrun || !r) return;
    const q = r.qs[r.i]!, e = E();
    ingest(e.ev, e.m, { node: mrun.node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'micro', src: 'micro', hint: true, ch: `micro/${mrun.node}`, ...(given ? { given, right: (q.opts ? q.opts[q.ans ?? 0] : q.accept?.[0]) ?? '' } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) r.got++;
    r.i++;
    if (r.i >= r.qs.length) {
      const verdict = microVerdict(r.got, r.qs.length), m1 = stat(e.m[mrun.node]?.[mrun.lv as 3]).m;
      addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: mrun.node, lv: mrun.lv as 3, dec: `micro:${verdict}`, rule: `${RULE_ID}/${MICRO_VER}`,
        info: { from: mrun.from, why: mrun.why, got: r.got, of: r.qs.length, m0: Math.round(mrun.m0 * 100) / 100, m1: Math.round(m1 * 100) / 100 },
        evs: e.ev.led.filter(x => x.node === mrun!.node && x.ctx === 'micro').slice(-r.qs.length).map(x => x.id) }, false);
      mrun.res = { got: r.got, of: r.qs.length, verdict }; mrun.run = null;
    }
    host.save(); host.render();
  }

  // ---------- Ladder Quest (v62): học ẩn trong game ----------
  // Mỗi lượt là một câu do engine chọn (quest.ts dựng tầng từ NBA). Câu trả lời → bằng chứng thật (src 'game', hoặc 'transfer'
  // với trùm câu mới); xu / tim / tầng chỉ là telemetry trong e.q, không bao giờ vào mastery (P14).
  let qrun: QuestRun | null = null;
  const qsave = () => { const e = E(); return (e.q ||= freshQuest()); };
  // Câu cho một lượt (v65): lỗ hổng của nút quyết định cách sửa (remedy.ts) — chưa biết thì hỏi nhận ra, nhận ra rồi thì bắt tự gõ,
  // nhớ rồi thì sửa lỗi / sản sinh, thiếu phần nền đã kiểm chứng thì đổi sang phần nền, cần transfer thì câu mới.
  let qcur: { node: string; gap: string } = { node: '', gap: '' };
  function qItem(ch: QuestRun['plan'][number]): { q: QItem | null; xfer: boolean } {
    const e = E(), ix = loaded()!;
    qcur = { node: ch.node, gap: '' };
    if (ch.gameType === 'camp') return { q: null, xfer: false };
    if (ch.gameType === 'boss') { const t = xferItems(host, e, ch.node); if (t[0]) { qcur.gap = 'transfer'; return { q: t[0], xfer: true }; } }
    if (ch.gameType === 'scout') {   // trinh sát giữ đúng mức của câu dò chẩn đoán
      const all = host.probe(ch.node), fit = all.filter(q => q.level <= Math.max(1, ch.level)), pool = fit.length ? fit : all;
      const fresh = pool.filter(q => !seenHas(e.ev, ch.node, q.id));   // v69: đúng mức cần dò trước (xác nhận Claim bằng câu tự gõ, khó đoán mò)
      return { q: fresh.find(q => q.level === ch.level) ?? fresh[0] ?? pool[0] ?? null, xfer: false };
    }
    let node = ch.node;
    const n = ix.node.get(node), need = (n ? defaultLevel(n) : 3) as Level;
    const blocked = (ix.pre.get(node) ?? []).some(x => x.type === 'hard' && !nodeStat(host, e, x.to, defaultLevel(ix.node.get(x.to)!)).pass);
    let r = remedyFor(gaps({ m: e.m, ev: e.ev, node, need, blocked, recall: recallOf(host, e, node) }), need, weakContext(e.ev, node, need));
    if (ch.gameType === 'chest' && r.act === 'practice') r = remedyFor(['retention'], need);
    if (r.act === 'root') {
      const cause = e.ev.hyp[node]?.cause ?? (ix.pre.get(node) ?? []).find(x => x.type === 'hard' && !nodeStat(host, e, x.to, defaultLevel(ix.node.get(x.to)!)).pass)?.to;
      if (cause && (cause.startsWith('u:') || cause.startsWith('g:'))) { node = cause; const cn = ix.node.get(cause); r = { ...remedyFor([], (cn ? defaultLevel(cn) : 3) as Level), gap: 'prerequisite', act: 'root' }; }
    }
    // v70 (bot L02): can thiệp vừa rồi ở nút này chưa hiệu quả (câu thử sau bí kíp sai, chưa có lần sửa được sau đó) → không lặp lại
    // y nguyên: lùi một bậc (hỏi nhận ra trước, câu chọn) và đổi cách dạy (bí kíp "cách khác" ở trại).
    // v71 (bot L03): người học đang đúng nhiều (≥ 85%) → phần chưa có bằng chứng / chưa từng sai không đi từng bậc mà hỏi thẳng ở mức cần
    // (câu đúng ở mức cao được tính cho các mức dưới); sai thì thang mức tự lùi lại.
    const ra = recentAcc();
    if (ra !== null && ra >= 0.85 && need >= 3 && (r.act === 'check' || (r.act === 'teach' && !e.ev.led.some(x => x.node === node && !x.ok)))) r = { ...r, act: 'check', lv: need, typed: true, vi: 'hỏi thẳng ở mức cần (bạn đang đúng nhiều)' };
    if (flopped(node) && r.lv > 1 && r.act !== 'transfer') r = { ...r, act: 'step', lv: Math.max(1, r.lv - 1) as Level, typed: false, vi: REMEDY_VI.step };
    qcur = { node, gap: r.gap ?? '' };
    if (r.act === 'transfer') { const t = xferItems(host, e, node); if (t[0]) return { q: t[0], xfer: true }; }
    return { q: pickFor(host.probe(node), r, id => seenHas(e.ev, node, id)), xfer: false };
  }
  // Tỉ lệ đúng tự lực ở 24 lượt tháp gần nhất (null khi chưa đủ 12 lượt).
  function recentAcc(): number | null {
    const xs = E().ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:`) && !x.asst).slice(-24);
    return xs.length < 12 ? null : xs.filter(x => x.ok).length / xs.length;
  }
  // Lần can thiệp gần nhất (trong 7 ngày) ở nút này chưa sửa được.
  function flopped(node: string): boolean {
    const today = host.today(), last = [...E().ev.snap].reverse().find(s => s.subj === node && s.dec.startsWith('micro:') && s.day >= today - 7);
    return !!last && last.dec === 'micro:not-yet';
  }
  let qx = false;
  function qLoad(): void {
    if (!qrun) return;
    const ch = qrun.plan[qrun.i];
    if (!ch) return;
    if (ch.gameType === 'camp') {
      // Trại: bí kíp cho phần vừa sai trong lượt này (ưu tiên phần ĐANG HIỂU SAI — v70), chưa sai thì cho quái kế tiếp (dạy trước khi gặp).
      const next = qrun.plan.slice(qrun.i + 1).find(p => p.gameType === 'monster')?.node;
      const target = [...qrun.wrong].reverse().find(n => misconceptions(E().ev, n).length) ?? qrun.wrong[qrun.wrong.length - 1] ?? next;
      const mc = target ? host.micro?.(target) ?? null : null, esc = !!target && flopped(target);
      // Bí kíp lần trước chưa hiệu quả → "cách khác": ví dụ trước, đối chiếu đúng / sai, rồi câu thử dễ hơn (nhận ra).
      qrun.card = mc ? (esc ? { ...mc.card, title: `Cách khác: ${mc.card.title}`, concept: [...mc.card.examples.slice(0, 2).map(([en, vi]) => `${en}${vi ? ' — ' + vi : ''}`), ...mc.card.concept.slice(0, 1)], examples: mc.card.examples.slice(2) } : mc.card) : null;
      qrun.q = null; qx = false;
      // v69: sau bí kíp có 1 câu thử ngay ở đúng phần vừa đọc (luyện ngay + kiểm tra sau can thiệp, §53); câu chưa gặp trước.
      const pool = mc ? (esc ? mc.qs.filter(q => q.level <= 2) : mc.qs) : [];
      qrun.chk = mc && target ? (pool.length ? pool : mc.qs).find(q => !seenHas(E().ev, target, q.id)) ?? (pool.length ? pool : mc.qs)[0] ?? null : null;
      qcur = { node: target ?? '', gap: '' };
      return;
    }
    const it = qItem(ch); qrun.q = it.q; qrun.card = null; qrun.teach = false; qx = it.xfer;
    // v69: phần CHƯA TỪNG GẶP → dạy trước rồi mới hỏi (remedy "teach": dạy + nhận ra). Câu trả lời ngay sau thẻ là bằng chứng có trợ
    // giúp (hint), không được tính như tự lực, nên chỉ dạy trước đúng một lần: dạy lại mỗi lượt thì mọi câu đúng đều "có trợ giúp" và
    // nút không bao giờ được xác minh (bot L01, người học nhanh: đúng 55/55 lần mà vẫn "cần xác minh").
    // v70 (bot L02): phần CHƯA CÓ BẰNG CHỨNG được hỏi thử trước (có thể người học đã biết — không dạy lại thứ đã biết); chỉ dạy trước
    // khi đã có bằng chứng là chưa biết (sai, chưa lần nào đúng tự lực ở mức nhận ra) hoặc đang hiểu sai. Mỗi nút tối đa một lần mỗi ngày,
    // vì câu ngay sau thẻ là bằng chứng có trợ giúp.
    const today = host.today(), led = E().ev.led.filter(x => x.node === qcur.node);
    // Hoặc sai lặp lại gần đây (≥ 2 trong 3 lượt cuối) ở nút đang học: giải thích rõ lại thay vì để người học đoán tiếp (W02-03).
    const last3 = led.slice(-3), repeated = last3.length >= 2 && last3.filter(x => !x.ok).length >= 2;
    const notKnown = (qcur.gap === 'knowledge' && led.some(x => !x.ok) && !led.some(x => x.ok && !x.asst && x.lv <= 2)) || repeated;
    if (it.q && (notKnown || qcur.gap === 'misconception') && !qrun.taught.includes(qcur.node) && !led.some(x => x.day === today && x.asst)) {
      const mc = host.micro?.(qcur.node);
      if (mc) { qrun.card = mc.card; qrun.teach = true; qrun.taught.push(qcur.node); }
    }
  }
  // v72 Xếp Khối: nhiều rương ôn hơn tầng tháp (mục đích: ôn hằng ngày + nhớ lại phần đang học), một trại bí kíp giữa ván.
  const BLOCK_ORDER: Enc[] = ['chest', 'monster', 'monster', 'scout', 'chest', 'monster', 'camp', 'monster', 'chest', 'monster', 'monster', 'boss'];
  let bdPick: ((k: Enc) => Challenge | null) | null = null;
  // Cấu hình bộ chọn nội dung chung cho mọi game (tháp, Xếp Khối, Bàn Cờ, Bài Câu…): ôn → đang học → lộ trình (NBA), giới hạn lượt / nút /
  // ngày, Claim, điểm nghẽn. Mỗi game chỉ đổi thứ tự cảnh / tiền tố / bộ lọc loại nút.
  function floorBase(): { fi: FloorIn; p: ReturnType<typeof computePath> } {
    const e = E(), v = V(), ix = loaded()!, p = computePath(host, v, ix), acts = computeNba(host, v, ix, p, true), sv = qsave();
    const review = (p.all ?? []).filter(r => nodeStat(host, v, r.node, r.level).pass).map(r => ({ n: r.node, r: recallOf(host, v, r.node) ?? 1 })).filter(x => x.r < 0.9).sort((a, b) => (1 - b.r) * (ix.node.get(b.n)?.imp?.re ?? 0.5) - (1 - a.r) * (ix.node.get(a.n)?.imp?.re ?? 0.5)).map(x => x.n);   // nguy cơ quên × độ quan trọng ghi nhớ (imp.re)
    // v69: giãn cách (mỗi nút tối đa QUEST.capDay lượt/ngày trong tháp) và xác nhận Claim của chẩn đoán ngay trong game.
    const today = host.today(), cnt = new Map<string, number>();
    for (const x of e.ev.led) if (x.day === today && x.ch?.startsWith(`${QUEST_VER}:`)) cnt.set(x.node, (cnt.get(x.node) ?? 0) + 1);
    // v71 (bot L03): Claim đã có bằng chứng thật được kiểm tiếp trước (xác nhận xong từng phần thay vì mỗi phần một câu rồi bỏ đó).
    const claimRows = (p.all ?? []).filter(r => nodeStat(host, v, r.node, r.level).state === 'inferred').map(r => ({ r, n: statusOf(v.m, r.node, r.level as Level).n })).sort((a, b) => b.n - a.n);
    const claims = claimRows.map(x => x.r.node), claimLv = new Map(claimRows.map(x => [x.r.node, x.r.level as Level]));
    // v70 (bot L02): ôn cả phần ĐANG HỌC sắp quên (khả năng nhớ từ sổ < 0,7), không chỉ phần đã Đạt: người học yếu quên trước khi kịp Đạt.
    const learning = (p.all ?? []).filter(r => { const s = nodeStat(host, v, r.node, r.level); return !s.pass && !s.none && s.state !== 'inferred'; })
      .map(r => ({ n: r.node, r: evRecall(e.ev, r.node, today) ?? 1 })).filter(x => x.r < 0.7).sort((a, b) => a.r - b.r).map(x => x.n);
    // Người học đang trả lời sai nhiều (< 60% ở 24 lượt tự lực gần nhất) → bớt dò khám phá, dùng lượt trinh sát để củng cố phần đang học.
    const acc = recentAcc(), explore = acc === null || acc >= 0.6, strong = acc !== null && acc >= 0.85;
    // v71 (bot L03): người học đang đúng nhiều → nới giới hạn lượt / nút / ngày (5 thay vì 3) để tiến nhanh hơn; tầng ưu tiên điểm nghẽn.
    const cap = strong ? 5 : QUEST.capDay, neck = neckOf(v)?.node;
    const fi: FloorIn = { acts, open: p.open, review: [...review, ...learning.filter(n => !review.includes(n))], can: n => /^(u|g|ph):/.test(n), started: n => Object.values(e.m[n] ?? {}).some(c => (c?.n ?? 0) > 0), floor: sv.floor, fresh: n => (cnt.get(n) ?? 0) < cap, claims, claimLv: n => claimLv.get(n) ?? 3, explore, ...(neck ? { neck } : {}) };
    return { fi, p };
  }
  function qStart(mode: 'tower' | 'blocks' | 'board' = 'tower'): void {
    if (!loaded()) { ensure(); return; }
    const e = E(), sv = qsave(), base = floorBase().fi;
    const fi: FloorIn = { ...base, floor: mode === 'blocks' ? (e.bk?.runs ?? 0) + 1 : mode === 'board' ? (e.bd?.runs ?? 0) + 1 : sv.floor, ...(mode === 'blocks' ? { order: BLOCK_ORDER, tag: 'b' } : mode === 'board' ? { tag: 'd' } : {}) };
    // v73 Bàn Cờ: không dựng sẵn cả tầng — mỗi lần dừng ở ô cảnh, bộ chọn trả lượt kế tiếp cho đúng loại cảnh đó (thứ tự NBA giữ nguyên).
    bdPick = mode === 'board' ? picker(fi) : null;
    const plan = mode === 'board' ? [] : planFloor(fi);
    if (mode !== 'board' && !plan.length) { host.toast('Chưa có gì để leo: chọn mục tiêu CEFR trước.'); return; }
    const max = mode === 'tower' ? hearts(sv.floor) : 99;   // Xếp Khối / Bàn Cờ không có tim: sai không khoá người chơi
    qrun = { plan, i: 0, hp: max, max, coins: 0, ok: 0, n: 0, floor: fi.floor, q: null, card: null, chk: null, teach: false, taught: [], t0: Date.now(), ans: null, done: null, wrong: [], gaps: [], mode };
    if (mode === 'blocks') qrun.bk = { ...freshBlocks((Date.now() ^ (e.ev.led.length * 2654435761)) >>> 0), phase: 'ask', sel: null, last: [], gain: 0, best: e.bk?.best ?? 0, saves: 0, rescue: false };
    if (mode === 'board') { qrun.bd = { phase: 'roll', rolls: ROLLS, seed: (Date.now() ^ (e.ev.led.length * 2654435761)) >>> 0, n: 0, move: null, msg: '', built: 0 }; host.render(); return; }
    qLoad(); host.render();
  }
  // ---------- Bài Câu (v74, F3 ngữ pháp) ----------
  // Lượt nào cũng là một câu của điểm ngữ pháp do engine chọn (bộ chọn chung, chỉ nút g: có câu để xếp); người chơi tự dựng câu = bằng
  // chứng mức 3 (g = 0, không đoán mò được). Bàn / bùa / điểm chỉ là telemetry (e.gc).
  let crun: CardsRun | null = null, cPick: ((k: Enc) => Challenge | null) | null = null;
  const CARD_KINDS: Enc[] = ['chest', 'monster', 'monster', 'monster', 'scout', 'monster', 'chest', 'monster', 'boss'];
  const csave = () => { const e = E(); return (e.gc ||= freshCardsSave()); };
  // Bộ chọn cho game chỉ dùng một loại nút (ngữ pháp / chức năng giao tiếp / âm): biên lộ trình có ít nút loại đó → thêm nút chưa Đạt của
  // mục tiêu (sau phần mở, ưu tiên thấp hơn) để game vẫn có nội dung đúng mục đích.
  function kindPicker(has: (n: string) => boolean, tag: string, floor: number): (k: Enc) => Challenge | null {
    const { fi, p } = floorBase();
    const open = fi.open.filter(o => has(o.node)), extra = open.length >= 3 ? [] : (p.all ?? []).filter(r => has(r.node) && !open.some(o => o.node === r.node) && !nodeStat(host, V(), r.node, r.level).pass).slice(0, 8).map(r => ({ node: r.node, level: r.level as Level, minutes: 10, score: 0, dep: 0, goals: [] as string[] }));
    return picker({ ...fi, open: [...fi.open, ...extra], can: has, tag, floor });
  }
  function cStart(): void {
    if (!loaded()) { ensure(); return; }
    const e = E();
    cPick = kindPicker(n => n.startsWith('g:') && (host.order?.(n)?.length ?? 0) > 0, 'c', (e.gc?.runs ?? 0) + 1);
    crun = { floor: (e.gc?.runs ?? 0) + 1, seed: (Date.now() ^ (e.ev.led.length * 2654435761)) >>> 0, t0: Date.now(), n: 0, ok: 0, coins: 0, wrong: [], done: false,
      table: 0, play: 0, tableScore: 0, total: 0, streak: 0, charms: [], won: 0, ch: null, node: '', item: null, novel: false, hand: [], built: [], ans: null, offer: null, tableEnd: null };
    cLoad(); host.render();
  }
  function cLoad(): void {
    if (!crun || !cPick) return;
    const e = E(), k = CARD_KINDS[crun.table * PLAYS + crun.play] ?? 'monster', ch = cPick(k) ?? cPick('monster');
    crun.ch = ch; crun.ans = null; crun.built = [];
    if (!ch) { crun.item = null; crun.node = ''; crun.hand = []; return; }
    const items = host.order?.(ch.node) ?? [], fresh = items.filter(x => !seenHas(e.ev, ch.node, x.id));
    const it = fresh[0] ?? items[crun.n % Math.max(1, items.length)] ?? null;
    crun.node = ch.node; crun.item = it; crun.novel = !!it && !seenHas(e.ev, ch.node, it.id);
    crun.hand = it ? cardDeal(crun.seed, crun.n, it.tokens, it.distract) : [];
  }
  function cPlay(skip: boolean): void {
    const r = crun;
    if (!r || !r.item || !r.ch || r.ans) return;
    const e = E(), it = r.item, given = r.built.map(i => r.hand[i]!), at = skip ? 0 : cardCheck(given, it.tokens), ok = !skip && at < 0, right = it.tokens.join(' ');
    ingest(e.ev, e.m, { node: r.node, level: it.level, ok, g: 0, item: it.id, text: it.prompt, qt: 'order', ctx: 'cards', src: 'game', ch: r.ch.id, gp: r.ch.gameplayDifficulty, ...(given.length ? { given: given.join(' '), right } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    const sc = cardScore({ ok, tiles: it.tokens.length, question: /\?$/.test(right), negative: /\b(not|never)\b|n't\b/i.test(right), first: r.play === 0 }, r.streak, r.charms);
    const coins = reward(r.ch, ok, r.novel);
    r.n++; r.coins += coins; r.tableScore += sc.total; r.total += sc.total;
    if (ok) { r.ok++; r.streak++; } else { r.streak = 0; r.wrong.push(r.node); }
    const sv = qsave(); sv.ans++; if (ok) sv.ok++; sv.coins += coins; sv.day = host.today();
    const why = ok ? undefined : (it.why || host.micro?.(r.node)?.card.concept[0]);
    r.ans = { ok, right, given: given.join(' '), at: skip ? -1 : at, chips: sc.chips, mult: sc.mult, total: sc.total, coins, ...(why ? { why } : {}) };
    sfx(ok ? 'clear' : 'bad'); host.save(); host.render();
  }
  function cNext(): void {
    const r = crun;
    if (!r) return;
    if (r.tableEnd) {   // sang bàn kế / kết thúc
      r.tableEnd = null; r.offer = null;
      if (r.table + 1 >= TABLES) { cEnd(); return; }
      r.table++; r.play = 0; r.tableScore = 0; cLoad(); host.save(); host.render(); return;
    }
    if (r.play + 1 >= PLAYS || !r.item) {
      const won = r.tableScore >= cardTarget(r.table); if (won) r.won++;
      r.tableEnd = { won, score: r.tableScore }; r.offer = r.table + 1 < TABLES ? cardOffer(r.seed, r.table, r.charms) : null;
      sfx(won ? 'end' : 'place'); host.save(); host.render(); return;
    }
    r.play++; cLoad(); host.save(); host.render();
  }
  function cEnd(): void {
    const r = crun;
    if (!r) return;
    const e = E(), s = csave(), ixq = loaded()!;
    r.done = true; r.passed = [...new Set(e.ev.snap.filter(x => x.kind === 'mastery' && x.dec === 'PASS' && x.ts >= r.t0).map(x => x.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    const best = s.best; s.runs++; s.best = Math.max(s.best, r.total); s.wins += r.won; s.day = host.today();
    (r as CardsRun & { prevBest?: number }).prevBest = best;
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `cards:${r.floor}`, dec: 'cards:end', rule: `${RULE_ID}/${QUEST_VER}`,
      info: { ok: r.ok, of: r.n, won: r.won, score: r.total, coins: r.coins, charms: r.charms.join(',') },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:c${r.floor}:`)).slice(-r.n).map(x => x.id) }, false);
    sfx('end'); host.save(); host.render();
  }

  // ---------- Quán Cà Phê (v75, F5 nghe + F7 giao tiếp) ----------
  // Mỗi khách là một câu của nút chức năng giao tiếp (fn:) do engine chọn: nghe hiểu (mức 2) hoặc chọn câu đáp đúng văn phong (mức 3),
  // luôn 4 lựa chọn. Sao / trang trí là telemetry (e.gq).
  let frun: CafeRun | null = null, fPick: ((k: Enc) => Challenge | null) | null = null;
  const CAFE_KINDS: Enc[] = ['chest', 'monster', 'monster', 'scout', 'monster', 'boss'];
  const fsave = () => { const e = E(); return (e.gq ||= freshCafeSave()); };
  function fStart(): void {
    if (!loaded()) { ensure(); return; }
    const e = E();
    fPick = kindPicker(n => n.startsWith('fn:') && (host.fn?.(n)?.length ?? 0) > 0, 'q', (e.gq?.runs ?? 0) + 1);
    frun = { floor: (e.gq?.runs ?? 0) + 1, seed: (Date.now() ^ (e.ev.led.length * 2654435761)) >>> 0, t0: Date.now(), k: 0, n: 0, ok: 0, coins: 0, stars: 0, streak: 0, wrong: [], done: false, ch: null, node: '', item: null, novel: false, ans: null };
    fLoad(); host.render();
  }
  function fLoad(): void {
    if (!frun || !fPick) return;
    const e = E(), ch = fPick(CAFE_KINDS[frun.k] ?? 'monster') ?? fPick('monster');
    frun.ch = ch; frun.ans = null;
    if (!ch) { frun.item = null; frun.node = ''; return; }
    // Xen kẽ nghe hiểu / chọn câu đáp; câu chưa gặp trước.
    const items = host.fn?.(ch.node) ?? [], want = frun.k % 2 ? 'reply' : 'hear', fresh = items.filter(x => !seenHas(e.ev, ch.node, x.id));
    const it = fresh.find(x => x.kind === want) ?? fresh[0] ?? items.find(x => x.kind === want) ?? items[0] ?? null;
    frun.node = ch.node; frun.item = it; frun.novel = !!it && !seenHas(e.ev, ch.node, it.id);
    if (it?.say) host.say?.(it.say);
  }
  function fAnswer(i: number): void {
    const r = frun;
    if (!r || !r.item || !r.ch || r.ans) return;
    const e = E(), it = r.item, ok = i >= 0 && i === it.ans;
    ingest(e.ev, e.m, { node: r.node, level: it.level, ok, g: it.g, item: it.id, text: it.prompt, qt: 'mcq', ctx: it.kind === 'hear' ? (it.say ? 'listen' : 'read') : 'function', src: 'game', ch: r.ch.id, gp: r.ch.gameplayDifficulty, ...(i >= 0 ? { given: it.opts[i] ?? '', right: it.opts[it.ans] ?? '' } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    r.streak = ok ? r.streak + 1 : 0;
    const st = cafeStars(ok, r.streak), coins = reward(r.ch, ok, r.novel);
    r.n++; r.coins += coins; r.stars += st; if (ok) r.ok++; else r.wrong.push(r.node);
    const sv = qsave(); sv.ans++; if (ok) sv.ok++; sv.coins += coins; sv.day = host.today();
    r.ans = { ok, i, stars: st, coins };
    sfx(ok ? 'ok' : 'bad'); host.save(); host.render();
  }
  function fNext(): void {
    const r = frun;
    if (!r) return;
    if (r.k + 1 >= GUESTS || !r.item) { fEnd(); return; }
    r.k++; fLoad(); host.save(); host.render();
  }
  function fEnd(): void {
    const r = frun;
    if (!r) return;
    const e = E(), s = fsave(), ixq = loaded()!;
    r.done = true; r.passed = [...new Set(e.ev.snap.filter(x => x.kind === 'mastery' && x.dec === 'PASS' && x.ts >= r.t0).map(x => x.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    s.runs++; s.stars += r.stars; s.best = Math.max(s.best, r.ok); s.day = host.today();
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `cafe:${r.floor}`, dec: 'cafe:end', rule: `${RULE_ID}/${QUEST_VER}`,
      info: { ok: r.ok, of: r.n, stars: r.stars, coins: r.coins },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:q${r.floor}:`)).slice(-r.n).map(x => x.id) }, false);
    sfx('end'); host.save(); host.render();
  }

  // ---------- Bắt Âm (v76, F4 phát âm) ----------
  // Mỗi từ là câu nghe phân biệt âm của nút ph: do engine chọn (3 lựa chọn: đoán mò 1/3). Không hết giờ. Điểm / màn là telemetry (e.gs).
  let brun: BubbleRun | null = null, bPick: ((k: Enc) => Challenge | null) | null = null;
  const BUBBLE_KINDS: Enc[] = ['chest', 'monster', 'monster', 'monster', 'scout', 'monster', 'chest', 'monster', 'monster', 'boss'];
  const gsave = () => { const e = E(); return (e.gs ||= freshBubblesSave()); };
  function bStart(): void {
    if (!loaded()) { ensure(); return; }
    const e = E(), sv = gsave();
    bPick = kindPicker(n => n.startsWith('ph:') && host.probe(n).length > 0, 's', sv.runs + 1);
    brun = { floor: sv.runs + 1, stage: sv.stage, seed: (Date.now() ^ (e.ev.led.length * 2654435761)) >>> 0, t0: Date.now(), k: 0, n: 0, ok: 0, coins: 0, score: 0, streak: 0, wrong: [], done: false, ch: null, node: '', item: null, novel: false, ans: null };
    bLoad(); host.render();
  }
  function bLoad(): void {
    if (!brun || !bPick) return;
    const e = E(), ch = bPick(BUBBLE_KINDS[brun.k] ?? 'monster') ?? bPick('monster');
    brun.ch = ch; brun.ans = null;
    if (!ch) { brun.item = null; brun.node = ''; return; }
    const items = host.probe(ch.node), fresh = items.filter(x => !seenHas(e.ev, ch.node, x.id)), it = fresh[0] ?? items[0] ?? null;
    brun.node = ch.node; brun.item = it; brun.novel = !!it && !seenHas(e.ev, ch.node, it.id);
    if (it?.say) host.say?.(it.say);
  }
  function bAnswer(i: number): void {
    const r = brun;
    if (!r || !r.item || !r.ch || r.ans) return;
    const e = E(), it = r.item, ok = i >= 0 && i === it.ans;
    ingest(e.ev, e.m, { node: r.node, level: it.level, ok, g: it.g, item: it.id, text: it.prompt, qt: 'mcq', ctx: 'listen', src: 'game', ch: r.ch.id, gp: r.ch.gameplayDifficulty, ...(i >= 0 ? { given: it.opts?.[i] ?? '', right: it.opts?.[it.ans ?? 0] ?? '' } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    r.streak = ok ? r.streak + 1 : 0;
    const pts = bubblePoints(ok, r.streak), coins = reward(r.ch, ok, r.novel);
    r.n++; r.coins += coins; r.score += pts; if (ok) r.ok++; else r.wrong.push(r.node);
    const sv = qsave(); sv.ans++; if (ok) sv.ok++; sv.coins += coins; sv.day = host.today();
    r.ans = { ok, i, pts, coins };
    sfx(ok ? 'clear' : 'bad'); host.save(); host.render();
  }
  function bNext(): void {
    const r = brun;
    if (!r) return;
    if (r.k + 1 >= WORDS || !r.item) { bEnd(); return; }
    r.k++; bLoad(); host.save(); host.render();
  }
  function bEnd(): void {
    const r = brun;
    if (!r) return;
    const e = E(), s = gsave(), ixq = loaded()!;
    r.done = true; r.passed = [...new Set(e.ev.snap.filter(x => x.kind === 'mastery' && x.dec === 'PASS' && x.ts >= r.t0).map(x => x.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    (r as BubbleRun & { prevBest?: number }).prevBest = s.best;
    s.runs++; s.best = Math.max(s.best, r.score); if (r.n && r.ok / r.n >= 0.7) s.stage++; s.day = host.today();
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `bubbles:${r.floor}`, dec: 'bubbles:end', rule: `${RULE_ID}/${QUEST_VER}`,
      info: { ok: r.ok, of: r.n, score: r.score, coins: r.coins, stage: r.stage },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:s${r.floor}:`)).slice(-r.n).map(x => x.id) }, false);
    sfx('end'); host.save(); host.render();
  }

  // ---------- Bàn Cờ Phố (v73) ----------
  const bsave = () => { const e = E(); return (e.bd ||= freshBoardSave()); };
  const wallet = () => Math.max(0, qsave().coins - bsave().spent);
  function bdRoll(): void {
    const bd = qrun?.bd;
    if (!qrun || !bd || bd.phase !== 'roll' || bd.rolls <= 0) return;
    const s = bsave(), die = roll(bd.seed, bd.n++), m = move(s, die), tile = TILES[m.to]!;
    bd.rolls--; bd.move = m; bd.msg = '';
    if (m.bonus) { qsave().coins += m.bonus; qrun.coins += m.bonus; bd.msg = `+${m.bonus} xu ${m.lap ? '(về Nhà' + (m.bonus > 10 ? ', đi qua nhà của bạn)' : ')') : '(đi qua nhà của bạn)'}`; }
    sfx('place');
    if (tile.t === 'enc') {
      const ch = bdPick?.(tile.k) ?? null;
      if (ch) { qrun.plan.push(ch); qrun.i = qrun.plan.length - 1; qrun.ans = null; bd.phase = 'ask'; qLoad(); host.save(); host.render(); return; }
    }
    if (tile.t === 'lot') { bd.phase = 'lot'; host.save(); host.render(); return; }
    bdAfter();
  }
  function bdAfter(): void {
    const bd = qrun?.bd;
    if (!qrun || !bd) return;
    if (bd.rolls <= 0) { bdEnd(); return; }
    bd.phase = 'roll'; host.save(); host.render();
  }
  function bdBuild(): void {
    const bd = qrun?.bd;
    if (!qrun || !bd || bd.phase !== 'lot') return;
    const s = bsave(), cost = build(s, s.pos, wallet());
    if (cost) { bd.built++; sfx('clear'); const t = TILES[s.pos]; bd.msg = `🏗 ${t && t.t === 'lot' ? t.name : 'Nhà'} lên cấp ${s.lots[s.pos]} (−${cost} xu)`; }
    bdAfter();
  }
  function bdEnd(): void {
    if (!qrun) return;
    const e = E(), s = bsave(), ixq = loaded()!, t0 = qrun.t0 ?? 0;
    qrun.done = 'win'; s.runs++;
    qrun.passed = [...new Set(e.ev.snap.filter(x => x.kind === 'mastery' && x.dec === 'PASS' && x.ts >= t0).map(x => x.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `board:${qrun.floor}`, dec: 'board:end', rule: `${RULE_ID}/${QUEST_VER}`,
      info: { ok: qrun.ok, of: qrun.n, coins: qrun.coins, built: qrun.bd?.built ?? 0, plan: qrun.plan.map(p => p.gameType[0]).join(''), gaps: qrun.gaps.join(',') },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:d${qrun!.floor}:`)).slice(-qrun.n).map(x => x.id) }, false);
    sfx('end'); host.save(); host.render();
  }
  function qAnswer(ok: boolean, given: string): void {
    if (!qrun || !qrun.q || qrun.ans) return;
    const ch = qrun.plan[qrun.i]!, q = qrun.q, e = E(), node = qcur.node || ch.node, novel = !seenHas(e.ev, node, q.id), camp = ch.gameType === 'camp';
    if (qcur.gap) qrun.gaps.push(qcur.gap);
    const m0 = camp ? stat(e.m[node]?.[q.level as 3]).m : 0, right = q.opts ? q.opts[q.ans ?? 0] ?? '' : q.accept?.[0] ?? '';
    // Câu thử ở trại: vừa đọc bí kíp → bằng chứng có trợ giúp (hint, trọng số 0,5), ngữ cảnh micro như bí kíp 60 giây.
    ingest(e.ev, e.m, { node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: camp ? 'micro' : qx ? 'transfer' : ch.context, src: camp ? 'micro' : qx ? 'transfer' : 'game', ch: camp ? `micro/${node}` : ch.id, gp: ch.gameplayDifficulty, ...(camp || qrun.teach ? { hint: true } : {}), ...(given ? { given, right } : {}) }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (camp) addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: node, lv: q.level as 3, dec: `micro:${microVerdict(ok ? 1 : 0, 1)}`, rule: `${RULE_ID}/${MICRO_VER}`,
      info: { from: 'quest-camp', why: 'bí kíp ở trại', got: ok ? 1 : 0, of: 1, m0: Math.round(m0 * 100) / 100, m1: Math.round(stat(e.m[node]?.[q.level as 3]).m * 100) / 100 }, evs: e.ev.led.slice(-1).map(x => x.id) }, false);
    const coins = camp ? 2 : reward(ch, ok, novel);
    // v69: sai thì kèm một dòng "vì sao" (ý chính của bí kíp phần đó), không chỉ đáp án.
    const why = ok ? undefined : host.micro?.(node)?.card.concept[0];
    qrun.ans = { ok, right, given, coins, novel, ...(why ? { why } : {}) }; qrun.coins += coins; qrun.n++;
    if (ok) qrun.ok++; else if (!camp) { qrun.hp--; qrun.wrong.push(node); }
    const sv = qsave(); sv.ans++; if (ok) sv.ok++; sv.coins += coins; sv.day = host.today();
    if (qrun.mode === 'blocks') sfx(ok ? 'ok' : 'bad');
    host.save(); host.render();
  }
  function qNext(): void {
    if (!qrun) return;
    const ch = qrun.plan[qrun.i];
    if (qrun.mode === 'board') { bdAfter(); return; }   // Bàn Cờ: xong cảnh → tung tiếp (hết lượt tung thì kết thúc)
    // Xếp Khối: sau câu trả lời (hoặc trại) → chia bộ khối; đúng thì thêm khối đặc biệt (thưởng game, không vào mastery).
    if (qrun.mode === 'blocks' && qrun.bk && qrun.bk.phase === 'ask') {
      const bk = qrun.bk, camp = ch?.gameType === 'camp';
      deal(bk, camp || qrun.ans?.ok ? (bk.n % 2 ? 'bolt' : 'bomb') : undefined);
      if (bk.rescue) { bk.tray.push({ s: 0, c: 0, sp: 'bomb' }, { s: 0, c: 0, sp: 'bolt' }); bk.rescue = false; }   // cứu bàn: luôn có bom + sét
      bk.phase = 'place'; bk.last = []; bk.gain = 0; bk.sel = bk.tray.findIndex(p => !!p && fits(bk.g, p));
      if (bk.sel < 0) { bk.sel = null; if (!bkRescue()) qEnd('lose'); return; }
      host.save(); host.render(); return;
    }
    if (ch?.gameType === 'camp') { qrun.hp = Math.min(qrun.max, qrun.hp + 1); const sv = qsave(); sv.coins += 5; qrun.coins += 5; }
    if (qrun.hp <= 0 || qrun.i + 1 >= qrun.plan.length) { qEnd(qrun.hp > 0 ? 'win' : 'lose'); return; }
    qrun.i++; qrun.ans = null; qLoad(); host.save(); host.render();
  }
  // Xếp Khối: đặt khối đang chọn tại (r, c); hết khay → câu kế tiếp; không còn khối nào đặt được → hết ván.
  function bkPut(r: number, c: number): void {
    const bk = qrun?.bk;
    if (!qrun || !bk || bk.phase !== 'place' || bk.sel === null) return;
    const p = bk.tray[bk.sel], [ar, ac] = p ? anchor(p) : [0, 0], res = place(bk, bk.sel, r - ar, c - ac);
    if (!res) return;
    bk.last = res.boom; bk.gain = res.gained;
    sfx(res.boom.length ? (res.cleared ? 'clear' : 'boom') : 'place');
    if (trayEmpty(bk)) {
      if (qrun.i + 1 >= qrun.plan.length) { qEnd('win'); return; }
      qrun.i++; qrun.ans = null; bk.phase = 'ask'; bk.sel = null; qLoad();
    } else if (!anyFits(bk)) { if (!bkRescue()) qEnd('lose'); return; }
    else bk.sel = bk.tray.findIndex(p => !!p && fits(bk.g, p));
    host.save(); host.render();
  }
  // Hết chỗ đặt mà ván còn câu: "cứu bàn" (tối đa 2 lần) — bỏ khay, trả lời câu kế tiếp để nhận bom + sét dọn bàn. Bàn đầy sớm không
  // được làm ván ngắn lại (ít câu hơn = học ít hơn); đúng hay sai đều được cứu (không khoá người chơi, không phạt).
  function bkRescue(): boolean {
    const bk = qrun?.bk;
    if (!qrun || !bk || bk.saves >= 2 || qrun.i + 1 >= qrun.plan.length) return false;
    bk.saves++; bk.rescue = true; bk.tray = []; bk.sel = null;
    qrun.i++; qrun.ans = null; bk.phase = 'ask'; qLoad(); sfx('bad');
    host.save(); host.render(); return true;
  }
  function qEnd(how: 'win' | 'lose'): void {
    if (!qrun) return;
    if (qrun.mode === 'blocks') { bkEnd(how); return; }
    const sv = qsave(), e = E();
    qrun.done = how; sv.runs++;
    const t0 = qrun.t0 ?? 0, ixq = loaded()!;
    qrun.passed = [...new Set(e.ev.snap.filter(s => s.kind === 'mastery' && s.dec === 'PASS' && s.ts >= t0).map(s => s.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    if (how === 'win') { sv.wins++; sv.best = Math.max(sv.best, sv.floor); sv.floor++; }
    addSnap(e.ev, { ts: Date.now(), day: host.today(), kind: 'diag', subj: `quest:${qrun.floor}`, dec: `quest:${how}`, rule: `${RULE_ID}/${QUEST_VER}`,
      info: { floor: qrun.floor, ok: qrun.ok, of: qrun.n, coins: qrun.coins, plan: qrun.plan.map(p => p.gameType[0]).join(''), gaps: qrun.gaps.join(',') },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:${qrun!.floor}:`)).slice(-qrun.n).map(x => x.id) }, false);
    host.save(); host.render();
  }

  function bkEnd(how: 'win' | 'lose'): void {
    if (!qrun?.bk) return;
    const e = E(), s = (e.bk ||= freshBlocksSave()), bk = qrun.bk, today = host.today(), ixq = loaded()!, t0 = qrun.t0 ?? 0;
    qrun.done = how;
    qrun.passed = [...new Set(e.ev.snap.filter(x => x.kind === 'mastery' && x.dec === 'PASS' && x.ts >= t0).map(x => x.subj))].map(n => ixq.node.get(n)?.vi ?? n);
    s.runs++; bumpStreak(s, today);
    const prevBest = s.best; s.best = Math.max(s.best, bk.score); bk.best = prevBest;
    addSnap(e.ev, { ts: Date.now(), day: today, kind: 'diag', subj: `blocks:${qrun.floor}`, dec: `blocks:${how}`, rule: `${RULE_ID}/${QUEST_VER}`,
      info: { score: bk.score, lines: bk.lines, ok: qrun.ok, of: qrun.n, coins: qrun.coins, plan: qrun.plan.map(p => p.gameType[0]).join(''), gaps: qrun.gaps.join(',') },
      evs: e.ev.led.filter(x => x.ch?.startsWith(`${QUEST_VER}:b${qrun!.floor}:`)).slice(-qrun.n).map(x => x.id) }, false);
    sfx('end');
    host.save(); host.render();
  }

  // Tiến độ kỹ năng của mục tiêu (v69, bot L01): năng lực Can-do chỉ Đạt khi đủ mọi kỹ năng con, nên nhiều tuần liền con số đó có thể
  // đứng yên dù người học tiến bộ thật. Đếm thêm kỹ năng con (từ vựng, ngữ pháp, âm, chức năng) đã vững bằng bằng chứng thật — không tính
  // phần chỉ suy ra từ chẩn đoán — và số kỹ năng mới vững trong 7 ngày.
  function skillsOf(v: EState, g: NonNullable<ReturnType<NonNullable<ReturnType<typeof loaded>>['goal']['get']>>): { solid: number; total: number; week: number; claimed: number } {
    const ix = loaded()!, today = host.today(), all = closure(ix, g.req.filter(r => r.type !== 'performance'), defaultLevel).filter(r => /^(u|g|ph|fn):/.test(r.node));
    let solid = 0, claimed = 0;
    const ids = new Set<string>();
    for (const r of all) { const s = nodeStat(host, v, r.node, r.level); if (s.pass && s.state === 'mastered') { solid++; ids.add(`${r.node}|${r.level}`); } else if (s.pass && s.state === 'inferred') claimed++; }
    const week = new Set(v.ev.snap.filter(s => s.kind === 'mastery' && s.dec === 'PASS' && s.day > today - 7 && ids.has(`${s.subj}|${s.lv}`)).map(s => s.subj)).size;
    return { solid, total: all.length, week, claimed };
  }

  // Điểm nghẽn (v70, bot L02): "bạn đang yếu ở X, và X đang chặn bạn" — trong các phần đã có bằng chứng mà chưa Đạt ở biên lộ trình, phần
  // mở đường cho nhiều năng lực nhất của mục tiêu; kèm loại lỗ hổng (đọc từ bằng chứng) để người học biết vì sao app cho luyện phần đó.
  // v71 (bot L03): điểm nghẽn = độ YẾU (1 − m, cần ≥ 2 lượt bằng chứng) × tầm quan trọng (1 + ln(1 + số năng lực bị chặn)). Trước đây chỉ
  // xếp theo số năng lực bị chặn, nên phần yếu nhất mà chặn ít (nghe phân biệt âm) không bao giờ được nêu.
  function neckOf(v: EState): { node: string; vi: string; dep: number; gap: string; pct: number } | null {
    const ix = loaded()!, p = computePath(host, v, ix);
    const cand = p.open.map(o => ({ o, s: nodeStat(host, v, o.node, o.level), c: statusOf(v.m, o.node, o.level as Level) }))
      .filter(x => !x.s.none && !x.s.pass && x.s.state !== 'inferred' && x.c.n >= 2 && /^(u|g|ph):/.test(x.o.node));
    const score = (x: typeof cand[number]) => (1 - x.c.m) * (1 + Math.log1p(Math.max(0, x.o.dep)));
    const top = cand.sort((a, b) => score(b) - score(a))[0];
    if (!top) return null;
    const n = ix.node.get(top.o.node)!, k = gaps({ m: v.m, ev: v.ev, node: n.id, need: top.o.level as Level, blocked: false, recall: recallOf(host, v, n.id) });
    return { node: n.id, vi: n.vi, dep: Math.round(top.o.dep), gap: k[0] ? GAP_VI[k[0]] : '', pct: Math.round(top.c.m * 100) };
  }

  // ---------- Đo hiệu quả học (v63) ----------
  // Bộ 12 câu giữ riêng cho mục tiêu đầu tiên đang mở; đo trước / sau / trễ 7 và 30 ngày; không hiện đáp án khi đo.
  // v69 (bot L01): lần đo sau dùng DẠNG SONG SONG — cùng nút, câu ngữ cảnh khác chưa gặp (nếu còn); hết câu mới mới dùng lại câu gốc.
  // Trước đây cùng 12 câu cho cả 4 lần đo: điểm lần sau bị thổi lên vì quen câu (hiệu ứng làm lại bài test).
  let mrunM: { phase: Phase; run: ToutRun; node: Map<string, string> } | null = null;
  const studyMins = (): number => Math.round((E().ev.seq * 12) / 60);   // ước tính: ≈ 12 giây mỗi câu đã trả lời
  function measureStart(): void {
    const e = E(), v = V(), ix = loaded()!, sg = v.goals[0], g = sg ? ix.goal.get(sg.id) : undefined;
    if (!g) { host.toast('Chọn một mục tiêu CEFR trước.'); return; }
    if (!e.ms || e.ms.goal !== g.id) {
      const need = closure(ix, g.req.filter(r => r.type !== 'performance'), defaultLevel);
      const nodes = pickNodes(need, n => n.startsWith('u:') && (host.transfer?.(n) ?? []).length > 0);
      const set = nodes.flatMap(n => { const q = (host.transfer?.(n) ?? []).find(x => !seenHasE(n, x.id)); return q ? [{ node: n, item: q.id }] : []; });
      e.ms = { goal: g.id, set, checks: [] };
    }
    const nx = nextPhase(e.ms, host.today());
    if (!nx) return;
    const node = new Map<string, string>(), qs = e.ms.set.flatMap(x => {
      const pool = host.transfer?.(x.node) ?? [], anchor = pool.find(q => q.id === x.item);
      const q = nx.phase === 'pre' ? anchor : pool.find(q => q.id !== x.item && !seenHasE(x.node, q.id)) ?? anchor;
      if (q) node.set(q.id, x.node);
      return q ? [q] : [];
    });
    mrunM = { phase: nx.phase, run: { node: e.ms.set[0]?.node ?? '', qs, i: 0, got: 0, x: true }, node };
    host.save(); host.render();
  }
  const seenHasE = (n: string, id: string) => seenHas(E().ev, n, id);
  function measureAnswer(ok: boolean): void {
    if (!mrunM) return;
    const r = mrunM.run, q = r.qs[r.i]!, e = E(), node = mrunM.node.get(q.id) ?? r.node;
    ingest(e.ev, e.m, { node, level: q.level, ok, g: q.g, item: q.id, text: q.prompt, qt: q.opts ? 'mcq' : 'typed', ctx: 'measure', src: 'diag', ch: `measure/${mrunM.phase}` }, { dev: dev(), ts: Date.now(), day: host.today(), recent: e.r });
    if (ok) r.got++;
    r.i++;
    if (r.i >= r.qs.length) {
      const day = host.today();
      e.ms!.checks.push({ phase: mrunM.phase, day, got: r.got, of: r.qs.length, mins: studyMins() });
      if (host.research?.() && !e.ms!.arm) e.ms!.arm = armOf(dev(), day);
      addSnap(e.ev, { ts: Date.now(), day, kind: 'diag', subj: `measure:${e.ms!.goal}`, dec: `measure:${mrunM.phase}`, rule: `${RULE_ID}/${MEASURE_VER}`,
        info: { got: r.got, of: r.qs.length, mins: studyMins(), ...Object.fromEntries(Object.entries(report(e.ms)).map(([k, x]) => [k, x === null ? '-' : x])) },
        evs: e.ev.led.filter(x => x.ctx === 'measure').slice(-r.qs.length).map(x => x.id) }, false);
      mrunM = null;
    }
    host.save(); host.render();
  }

  const routes: Record<string, (c: ECtx) => string> = {
    measure: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      if (mrunM) return viewTout(c, mrunM.run, null).replace('Thử ở câu mới', `${PHASE_VI[mrunM.phase]} · không hiện đáp án`);
      const ms = E().ms;
      return viewMeasure(c, ms, nextPhase(ms, host.today()), report(ms));
    },
    quest: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      if (brun) return brun.done ? viewBubblesEnd(c, brun, (brun as BubbleRun & { prevBest?: number }).prevBest ?? 0) : viewBubbles(c, brun, host.probe('ph:s-01').length > 0);
      if (frun) return frun.done ? viewCafeEnd(c, frun, fsave().stars) : viewCafe(c, frun, fsave().stars);
      if (crun) return crun.done ? viewCardsEnd(c, crun, (crun as CardsRun & { prevBest?: number }).prevBest ?? 0) : viewCards(c, crun);
      if (qrun?.mode === 'blocks') return qrun.done ? viewBlocksEnd(c, qrun) : viewBlocks(c, qrun);
      if (qrun?.mode === 'board') return qrun.done ? viewBoardEnd(c, qrun, bsave()) : viewBoard(c, qrun, bsave(), wallet());
      if (qrun?.done) return viewQuestEnd(c, qrun);
      if (qrun) return viewQuestRun(c, qrun);
      const g = c.e.goals.map(sg => loaded()!.goal.get(sg.id)).find(Boolean), r = g ? readinessOf(host, c.e, g) : null;
      return viewLobby(c, E().bk, E().bd, E().gc, E().gq, E().gs) + viewQuestHome(c, qsave(), g && r && r.kind === 'mastery' ? { done: r.done, total: r.total, vi: g.vi } : null, c.e.goals.length ? nextStep(host, c.e, loaded()!) : null, g ? skillsOf(c.e, g) : null, c.e.goals.length ? neckOf(c.e) : null);
    },
    micro: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      const [, node = '', lv = '3', from = node, ...rest] = c.route.split('/');   // micro/<nút>/<mức>/<nút đang sai>/<lý do>
      const why = decodeURIComponent(rest.join('/') || 'bạn sai phần này vài lần gần đây');
      if (!mrun || mrun.key !== c.route) microStart(c.route, node, Number(lv), from, why);
      if (!mrun) return `<p class="muted">Chưa có bí kíp cho phần này.</p><div class="row"><button class="btn" data-e="mback">Quay lại</button></div>`;
      if (mrun.res) return viewMicroDone(c, { node: mrun.node, ...mrun.res, back: !!host.back });
      if (mrun.run) return viewTout(c, mrun.run, null);
      return viewMicroCard(c, mrun.card, mrun.why, from !== node);
    },
    xfer: c => {
      if (!loaded()) { ensure(); return viewLoading(c, loadErr); }
      const [, node = '', lv = '3'] = c.route.split('/');   // xfer/<nút>/<mức>
      if (!xrun && (!xres || xres.node !== node)) xferStart(node, Number(lv));
      if (xres && xres.node === node) return viewXferDone(c, xres);
      return viewTout(c, xrun, null);
    },
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
    diag: c => { if (!loaded()) { if (!loadErr) ensure(); return viewLoading(c, loadErr); } return drun ? viewDiagRun(c, drun) : viewDiagIntro(c, lr(), c.route === 'diag/quick'); },
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
      const id = el.dataset.g || '';
      if (!addGoal(id, 'pick')) return;
      host.save(); host.toast(`Đã chọn: ${GOALS.get(id)!.vi}.`); host.go(`goal/${id}`);
    },
    rm(el) {
      const e = E(), id = el.dataset.g || '';
      e.goals = e.goals.filter(g => g.id !== id); host.save(); host.render();
    },
    retry() { loadErr = ''; ensure(); host.render(); },
    dstart(el) {
      if (!loaded()) { ensure(); return; }
      drec = []; dmcq = { got: 0, n: 0, gs: 0 };
      drun = loadNode(startDiag(startLevel(), Date.now(), el.dataset.q ? QUICK_PROBES : undefined));
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
    qstart() { crun = null; frun = null; brun = null; qStart(); },
    bkstart() { qrun = null; crun = null; frun = null; brun = null; qStart('blocks'); },
    bdstart() { qrun = null; crun = null; frun = null; brun = null; qStart('board'); },
    cdstart() { qrun = null; crun = null; frun = null; brun = null; cStart(); },
    cdtile(el) { const r = crun, i = Number(el.dataset.i); if (!r || r.ans || r.built.includes(i) || !(i >= 0 && i < r.hand.length)) return; r.built.push(i); sfx('place'); host.render(); },
    cdback(el) { const r = crun, k = Number(el.dataset.k); if (!r || r.ans) return; r.built.splice(k, 1); host.render(); },
    cdclear() { if (crun && !crun.ans) { crun.built = []; host.render(); } },
    cdplay() { cPlay(false); },
    cdskip() { cPlay(true); },
    cdnext() { cNext(); },
    cfstart() { qrun = null; crun = null; frun = null; brun = null; fStart(); },
    cfans(el) { fAnswer(Number(el.dataset.i)); },
    cfnext() { fNext(); },
    bbstart() { qrun = null; crun = null; frun = null; brun = null; bStart(); },
    bbans(el) { bAnswer(Number(el.dataset.i)); },
    bbnext() { bNext(); },
    cdcharm(el) { const r = crun, id = el.dataset.c || ''; if (!r?.offer?.some(o => o.id === id)) return; r.charms.push(id); r.offer = null; cNext(); },
    bdroll() { bdRoll(); },
    bdbuild() { bdBuild(); },
    bdskip() { if (qrun?.bd?.phase === 'lot') bdAfter(); },
    bksel(el) { const bk = qrun?.bk, i = Number(el.dataset.p); if (!bk || bk.phase !== 'place' || !bk.tray[i] || !fits(bk.g, bk.tray[i]!)) return; bk.sel = i; host.render(); },
    bkput(el) { bkPut(Number(el.dataset.r), Number(el.dataset.c)); },
    mstart() { measureStart(); },
    qhome() { qrun = null; crun = null; frun = null; brun = null; host.render(); },
    qnext() { qNext(); },
    qcheck() { if (!qrun || qrun.q || !qrun.chk) return; qrun.q = qrun.chk; host.render(); },
    qans(el) { if (!qrun?.q) return; const q = qrun.q, i = Number(el.dataset.i); qAnswer(i >= 0 && i === q.ans, i >= 0 ? q.opts?.[i] ?? '' : ''); },
    mgo() { if (!mrun) return; mrun.run = mrun.qs.length ? { node: mrun.node, qs: mrun.qs, i: 0, got: 0, micro: true } : null; if (!mrun.run) mrun.res = { got: 0, of: 0, verdict: 'not-yet' }; host.render(); },
    mskip() { mrun = null; if (host.back) host.back(); else host.go('today'); },
    mback() { mrun = null; if (host.back) host.back(); else host.go('today'); },
    mans(el) { const r = mrun?.run; if (!r) return; const q = r.qs[r.i]!, i = Number(el.dataset.i); microAnswer(i >= 0 && i === q.ans, i >= 0 ? q.opts?.[i] : undefined); },
    xans(el) { if (mrunM) { const q = mrunM.run.qs[mrunM.run.i]!, i = Number(el.dataset.i); measureAnswer(i >= 0 && i === q.ans); return; } if (!xrun) return; const q = xrun.qs[xrun.i]!, i = Number(el.dataset.i); xferAnswer(i >= 0 && i === q.ans, i >= 0 ? q.opts?.[i] : undefined); },
    tans(el) { if (!tout) return; const q = tout.qs[tout.i]!, i = Number(el.dataset.i); toutAnswer(i >= 0 && i === q.ans); },
  };
  const forms: Record<string, (f: HTMLFormElement) => void> = {
    ptyped(f) {
      if (!prun) return;
      const q = prun.qs[prun.i]!, a = norm(String(new FormData(f).get('a') || ''));
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      probeAnswer((q.accept ?? []).some(x => norm(x) === a));
    },
    qtyped(f) {
      if (!qrun?.q) return;
      const q = qrun.q, raw = String(new FormData(f).get('a') || ''), a = norm(raw);
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      qAnswer((q.accept ?? []).some(x => norm(x) === a), raw.trim());
    },
    mtyped(f) {
      const r = mrun?.run;
      if (!r) return;
      const q = r.qs[r.i]!, raw = String(new FormData(f).get('a') || ''), a = norm(raw);
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      microAnswer((q.accept ?? []).some(x => norm(x) === a), raw.trim());
    },
    xtyped(f) {
      if (mrunM) {
        const q = mrunM.run.qs[mrunM.run.i]!, a = norm(String(new FormData(f).get('a') || ''));
        if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
        measureAnswer((q.accept ?? []).some(x => norm(x) === a)); return;
      }
      if (!xrun) return;
      const q = xrun.qs[xrun.i]!, raw = String(new FormData(f).get('a') || ''), a = norm(raw);
      if (!a) { host.toast('Gõ câu trả lời, hoặc chọn "Không biết".'); return; }
      xferAnswer((q.accept ?? []).some(x => norm(x) === a), raw.trim());
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
    after(route) { if (needGraph(route) && !loaded()) ensure(); if (!route.startsWith('tout')) { tout = null; toutRes = null; } if (!route.startsWith('probe')) { prun = null; pres = null; } if (!route.startsWith('xfer')) { xrun = null; xres = null; } if (!route.startsWith('micro')) mrun = null; },
    autoGoal(id, why) {
      if (V().goals.length) return false;
      const ok = addGoal(id, why === 'pick' ? 'pick' : 'auto');
      if (ok) host.save();
      return ok;
    },
    next() {
      const e = V();
      if (!e.goals.length) return null;
      const ix = loaded();
      if (!ix) { ensure(); return null; }
      return nextStep(host, e, ix);
    },
    sanitize: sanitizeE,
    merge: mergeE,
    peek() {
      const of = (run: string, node: string, q: { level: number; id: string; prompt: string; opts?: string[]; ans?: number; accept?: string[] } | null | undefined, x: Partial<Peek> = {}): Peek | null =>
        q ? { run, node, level: q.level, id: q.id, prompt: q.prompt, ...(q.opts ? { opts: q.opts, ans: q.ans ?? 0 } : { accept: q.accept ?? [] }), ...x } : null;
      if (drun) return of('diag', drun.node, drun.qs[drun.i]);
      if (brun) return brun.done || brun.ans || !brun.item ? null : { run: 'bubbles', node: brun.node, level: brun.item.level, id: brun.item.id, prompt: brun.item.prompt, opts: brun.item.opts ?? [], ans: brun.item.ans ?? 0, game: 'bubbles' };
      if (frun) return frun.done || frun.ans || !frun.item ? null : { run: 'cafe', node: frun.node, level: frun.item.level, id: frun.item.id, prompt: frun.item.prompt, opts: frun.item.opts, ans: frun.item.ans, game: 'cafe' };
      if (crun) {   // Bài Câu: lá trong tay + thứ tự đúng (chỉ số lá) để bot xếp
        if (crun.done || crun.ans || crun.tableEnd || !crun.item) return null;
        const used = new Set<number>(), order = crun.item.tokens.map(t => { const i = crun!.hand.findIndex((h, j) => h === t && !used.has(j)); used.add(i); return i; });
        return { run: 'cards', node: crun.node, level: crun.item.level, id: crun.item.id, prompt: crun.item.prompt, accept: [crun.item.tokens.join(' ')], tiles: crun.hand, order, game: 'cards' };
      }
      if (qrun && ((qrun.bd && qrun.bd.phase !== 'ask') || qrun.bk?.phase === 'place')) return null;   // đang tung xúc xắc / xây nhà / đặt khối
      if (qrun && !qrun.done && !qrun.q && qrun.plan[qrun.i]?.gameType === 'camp') {   // trại: nút của bí kíp đang hiện
        const next = qrun.plan.slice(qrun.i + 1).find(p => p.gameType === 'monster')?.node;
        return { run: 'camp', node: qrun.wrong[qrun.wrong.length - 1] ?? next ?? '', level: 0, id: '', prompt: qrun.card?.title ?? '' };
      }
      if (qrun) return qrun.ans || qrun.done ? null : of('quest', qcur.node || qrun.plan[qrun.i]?.node || '', qrun.q, { game: qrun.plan[qrun.i]?.gameType ?? '', gap: qcur.gap });
      if (mrunM) { const q = mrunM.run.qs[mrunM.run.i]; return of('measure', (q && mrunM.node.get(q.id)) ?? mrunM.run.node, q); }
      if (mrun?.run) return of('micro', mrun.run.node, mrun.run.qs[mrun.run.i]);
      if (prun) return of('probe', prun.node, prun.qs[prun.i]);
      if (xrun) return of('xfer', xrun.node, xrun.qs[xrun.i]);
      if (tout) return of('tout', tout.node, tout.qs[tout.i]);
      return null;
    },
  };
}
