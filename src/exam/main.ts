// Điểm vào của phần ôn thi IELTS/VSTEP. app.js nạp tệp này (import động) khi người học mở tab "Ôn thi".
// Mô-đun trả về hàm dựng HTML theo route; sự kiện bấm dùng thuộc tính data-x để không lẫn với app.js.

import type { Host } from './host.ts';
import { migrateX, sanitizeX, mergeX, X_V, type XState } from './state.ts';
import type { ExamId } from './scales.ts';
import { viewScales } from './views/scales.ts';
import { viewHub, EXAM_NAME } from './views/hub.ts';
import { viewSettings } from './views/settings.ts';
import { viewReal } from './views/real.ts';
import { viewAccuracy } from './views/accuracy.ts';
import { isoToDay } from './views/ui.ts';
import { profile } from './estimate.ts';
import { refresh, sendPairs, hiddenItems } from './net.ts';
import { vstepToBand } from './scales.ts';
import { itemParams, cleanCache, loadPack } from './packs.ts';
import { viewPlaceIntro, viewPlaceRun, viewPlaceResult, FLAG_REASONS, type PRun } from './views/place.ts';
import { newPlacement, advance, answerGroup, results, remainingMs, type PSkill } from './placement.ts';
import { sendAttempt } from './net.ts';
import type { Group } from './content.ts';
import { viewPlan } from './views/plan.ts';
import { viewNb, viewNbRun, type NbRun } from './views/nb.ts';
import { addWrong, reviewed, dueList } from './notebook.ts';
import { packOfItem } from './packs.ts';
import { markItem } from './score.ts';
import { viewPracticeList, viewType, viewSet, type PracticeRun, type TypeLesson } from './views/practice.ts';
import { readGiven } from './views/items.ts';
import { attachNoise, detachNoise, unlockAudio } from './noise.ts';
import { QT } from './content.ts';
import { ieltsBand } from './scales.ts';
import { mockController } from './mockrun.ts';

export const MODULE_VERSION = 1;

export interface ExamModule {
  version: number;
  render(route: string): string;
  after(route: string): void;
  sanitize(x: unknown): XState;
  merge(a: unknown, b: unknown): XState;
}

export interface Ctx {
  host: Host;
  x: XState;
  route: string;
}

export function init(host: Host): ExamModule {
  // Luôn đọc bản lưu hiện hành qua host.state(): app có thể thay cả đối tượng tiến độ (khôi phục, đồng bộ).
  const X = (): XState => {
    const root = host.state();
    const cur = root.x as XState | undefined;
    if (cur && typeof cur === 'object' && cur.v === X_V) return cur;
    const before = JSON.stringify(root.x ?? null), next = migrateX(root.x);
    root.x = next;
    if (JSON.stringify(next) !== before) host.save();   // ghi ngay bản đã nâng cấp
    return next;
  };
  X();
  void cleanCache();
  // Số liệu công khai (độ khó thật, câu tạm ẩn) chỉ tải khi người học đã đồng ý chia sẻ, hoặc tự bấm tải ở trang Độ chính xác:
  // app không liên lạc máy chủ khi chưa được phép (yêu cầu 3.3).
  if (X().share) void refresh(host);

  // ---------- Kiểm tra đầu vào ----------
  let run: PRun | null = null, placeLoading = false, placeErr = '', timer: ReturnType<typeof setInterval> | null = null;
  const stopTimer = (): void => { if (timer) { clearInterval(timer); timer = null; } };

  function placeFinish(): void {
    if (!run) return;
    stopTimer();
    run.res = results(run.st);
    const x = X(), day = host.today(), secs = Math.round((Date.now() - run.t0) / 1000), exam = x.exam || 'ielts-ac';
    const items: Record<string, 0 | 1> = {};
    for (const sec of run.st.sections) {
      for (const a of sec.answers) {
        x.resp.push({ i: a.id, c: a.correct ? 1 : 0, d: day, s: sec.skill, b: a.b, g: a.g }); items[a.id] = a.correct ? 1 : 0;
        if (!a.correct) addWrong(x, a.id, run.groups[a.group]?.qtype ?? '', day);
      }
      const r = run.res.find(q => q.skill === sec.skill);
      if (r) x.attempts.push({ id: `place-${sec.skill.toLowerCase()}`, kind: 'place', exam, day, skill: sec.skill, correct: sec.answers.filter(a => a.correct).length, total: sec.answers.length, band: r.band, se: r.se, secs, wrong: sec.answers.filter(a => !a.correct).map(a => a.id) });
    }
    host.addMinutes(secs / 60); host.markActive();
    host.save();
    void sendAttempt(host, x, exam, 'place', items);
    host.go('place-result');
  }

  function placeNext(given: Record<string, string | undefined>): void {
    if (!run) return;
    const g = run.st.cur ? run.groups[run.st.cur] : undefined;
    if (g) answerGroup(run.st, g, given, hiddenItems());
    const next = advance(run.st, pools(), hiddenItems(), Date.now());
    run.given = {}; run.plays = 0; run.audioErr = '';
    if (!next) return placeFinish();
    host.go('place-run');
  }

  let poolCache: Record<PSkill, Group[]> | null = null;
  const pools = (): Record<PSkill, Group[]> => poolCache!;

  async function placeStart(): Promise<void> {
    placeLoading = true; placeErr = ''; host.render();
    try {
      const gs = await loadPack('place'), exam = X().exam || 'ielts-ac';
      const mine = gs.filter(g => g.exams.includes(exam));
      poolCache = { R: mine.filter(g => g.kind === 'reading'), L: mine.filter(g => g.kind === 'listening') };
      const st = newPlacement(['R', 'L'], Date.now());
      run = { st, groups: Object.fromEntries(mine.map(g => [g.id, g])), given: {}, plays: 0, audioErr: '', t0: Date.now(), res: null };
      placeLoading = false;
      if (!advance(st, poolCache, hiddenItems(), Date.now())) { placeErr = 'Chưa có câu hỏi cho kỳ thi này.'; host.render(); return; }
      host.go('place-run');
    } catch {
      placeLoading = false; placeErr = 'Chưa tải được câu hỏi (cần mạng ở lần đầu). Kiểm tra mạng rồi thử lại.'; host.render();
    }
  }

  // ---------- Luyện theo dạng câu ----------
  let lessons: Record<string, TypeLesson> | null = null, lessonsP: Promise<void> | null = null, prun: PracticeRun | null = null, setErr = '';
  function loadLessons(): Promise<void> {
    return lessonsP ??= (loadPack('types') as unknown as Promise<TypeLesson[]>).then(ts => { lessons = Object.fromEntries(ts.map(t => [t.id, t])); host.render(); })
      .catch(() => { lessonsP = null; lessons = {}; setErr = 'Chưa tải được bài học (cần mạng ở lần đầu).'; host.render(); });
  }
  async function setStart(qid: string): Promise<void> {
    setErr = '';
    try {
      const gs = (await loadPack('p-' + qid)).filter(g => g.exams.includes(X().exam || 'ielts-ac'));
      if (!gs.length) { setErr = 'Chưa có bộ câu cho dạng này ở kỳ thi bạn chọn.'; host.render(); return; }
      const done = new Map<string, number>();
      for (const a of X().attempts) if (a.kind === 'set') done.set(a.id, a.day);
      const fresh = gs.filter(g => !done.has(g.id));
      const g = fresh[0] ?? gs.slice().sort((p, q) => (done.get(p.id) ?? 0) - (done.get(q.id) ?? 0))[0]!;
      prun = { qid, g, given: {}, marks: null, t0: Date.now(), ver: 'file' };
      host.go('set');
    } catch { setErr = 'Chưa tải được bộ câu (cần mạng ở lần đầu).'; host.render(); }
  }
  function setCheck(f: HTMLFormElement): void {
    if (!prun || prun.marks) return;
    const g = prun.g, x = X(), day = host.today(), skill = QT[g.qtype]?.skill ?? 'R';
    prun.given = readGiven(f, g.items, g);
    prun.marks = Object.fromEntries(g.items.map(it => [it.id, markItem(it, g, prun!.given[it.id])]));
    const items: Record<string, 0 | 1> = {};
    let got = 0, of = 0;
    for (const it of g.items) {
      const m = prun.marks[it.id]!, ok = m.got === m.of;
      got += m.got; of += m.of; items[it.id] = ok ? 1 : 0;
      x.resp.push({ i: it.id, c: ok ? 1 : 0, d: day, s: skill, b: it.b, g: QT[g.qtype]?.guess ?? 0 });
      if (!ok) addWrong(x, it.id, g.qtype, day, it.tag);
    }
    const secs = Math.round((Date.now() - prun.t0) / 1000), exam = x.exam || 'ielts-ac';
    x.attempts.push({ id: g.id, kind: 'set', exam, day, skill, correct: got, total: of, band: exam === 'vstep' ? 0 : ieltsBand(exam, skill, got, of).band, secs, wrong: g.items.filter(it => items[it.id] === 0).map(it => it.id) });
    host.addMinutes(secs / 60); host.markActive(); host.save();
    void sendAttempt(host, x, exam, 'set', items);
    host.render();
  }

  // ---------- Sổ lỗi sai ----------
  let nb: NbRun | null = null, nbLoading = false, nbErr = '', nbT0 = 0;
  async function nbStart(): Promise<void> {
    const x = X(), ids = dueList(x, host.today(), hiddenItems()).map(e => e.id).slice(0, 20);
    if (!ids.length) return;
    nbLoading = true; nbErr = ''; host.render();
    try {
      const packs = [...new Set(ids.map(packOfItem).filter((p): p is string => !!p))];
      const gs = (await Promise.all(packs.map(loadPack))).flat();
      const have = new Set(gs.flatMap(g => g.items.map(i => i.id)));
      nb = { queue: ids.filter(i => have.has(i)), i: 0, groups: Object.fromEntries(gs.map(g => [g.id, g])), answered: null, right: 0 };
      nbLoading = false; nbT0 = Date.now();
      if (!nb.queue.length) { nbErr = 'Các câu đến hạn không còn trong kho (đã sửa hoặc gỡ).'; host.render(); return; }
      host.go('nb-run');
    } catch { nbLoading = false; nbErr = 'Chưa tải được câu hỏi (cần mạng ở lần đầu).'; host.render(); }
  }
  function nbFinish(): void {
    if (!nb) return;
    host.addMinutes((Date.now() - nbT0) / 60000); host.markActive(); host.save();
    host.toast(`Xong: đúng ${nb.right}/${nb.queue.length} câu. Câu sai sẽ quay lại sớm.`);
    nb = null; host.go('nb');
  }

  // ---------- Đề thi thử ----------
  const mc = mockController(host, X);

  const routes: Record<string, (c: Ctx) => string> = {
    ...mc.routes,
    plan: viewPlan,
    nb: c => viewNb(c, nbLoading, nbErr),
    'nb-run': c => (nb ? viewNbRun(c, nb) : viewNb(c, nbLoading, nbErr)),
    practice: viewPracticeList,
    type: c => { const q = c.route.split('/')[1] ?? ''; if (!lessons && !lessonsP) void loadLessons(); return viewType(c, q, lessons?.[q], !lessons, setErr); },
    set: c => (prun ? viewSet(c, prun) : viewPracticeList(c)),
    place: c => viewPlaceIntro(c, placeLoading, placeErr),
    'place-run': c => (run && !run.st.finished ? viewPlaceRun(c, run) : viewPlaceIntro(c, placeLoading, placeErr)),
    'place-result': c => viewPlaceResult(c, run),
    hub: viewHub,
    scales: viewScales,
    settings: viewSettings,
    real: viewReal,
    accuracy: viewAccuracy,
  };

  function render(route: string): string {
    const name = route.split('/')[0] || 'hub';
    const v = routes[name] ?? viewHub;
    return v({ host, x: X(), route });
  }

  const act: Record<string, (el: HTMLElement) => void> = {
    ...mc.act,
    exam(el) {
      const v = el.dataset.v as ExamId;
      if (!EXAM_NAME[v]) return;
      const x = X(), first = !x.attempts.some(a => a.kind === 'place');
      x.exam = v; host.save(); host.toast(`Đã chọn ${EXAM_NAME[v]}.`); host.go(first ? 'place' : 'hub');
    },
    examreset() { X().exam = ''; host.save(); host.go('hub'); },
    route(el) { host.go(el.dataset.r || 'hub'); },
    placestart() { void placeStart(); },
    nbstart() { void nbStart(); },
    setstart(el) { void setStart(el.dataset.q || ''); },
    setver(el) {
      if (!prun) return;
      const f = document.querySelector('form[data-xform="setcheck"]') as HTMLFormElement | null;
      if (f && !prun.marks) prun.given = readGiven(f, prun.g.items, prun.g);
      prun.ver = (el.dataset.v as PracticeRun['ver']) || 'file';
      if (prun.ver === 'noise') unlockAudio();   // trong thao tác bấm: iOS mới cho Web Audio chạy
      host.render();
    },
    setflag(el) {
      if (!prun) return;
      const id = el.dataset.i || '', it = prun.g.items.find(i => i.id === id), reason = FLAG_REASONS[Number(el.dataset.r)] ?? FLAG_REASONS[0]!;
      if (!it) return;
      const gv = prun.given[id];
      host.flag({ kind: 'Ôn thi', ref: id, item: prun.g.title, prompt: it.q, answer: JSON.stringify(it.ans).slice(0, 200), given: Array.isArray(gv) ? gv.join(',') : gv ?? '', reason });
      host.toast('Đã ghi nhận. Gửi cho người soạn trong Cài đặt → Câu đã báo lỗi.');
    },
    nbnext() { if (!nb) return; nb.i++; nb.answered = null; if (nb.i >= nb.queue.length) nbFinish(); else host.go('nb-run'); },
    nbflag(el) {
      if (!nb) return;
      const id = el.dataset.i || '', reason = FLAG_REASONS[Number(el.dataset.r)] ?? FLAG_REASONS[0]!;
      const g = Object.values(nb.groups).find(q => q.items.some(i => i.id === id)), it = g?.items.find(i => i.id === id);
      if (!g || !it) return;
      const gv = nb.answered?.given;
      host.flag({ kind: 'Ôn thi', ref: id, item: g.title, prompt: it.q, answer: JSON.stringify(it.ans).slice(0, 200), given: Array.isArray(gv) ? gv.join(',') : gv ?? '', reason });
      host.toast('Đã ghi nhận. Gửi cho người soạn trong Cài đặt → Câu đã báo lỗi.');
    },
    placeplay() {
      const a = document.getElementById('xaudio') as HTMLAudioElement | null, st = document.getElementById('xaudiost');
      if (!a || !run || run.plays >= 1) return;
      a.onplaying = () => { if (run) run.plays = 1; const b = document.querySelector('[data-x="placeplay"]') as HTMLButtonElement | null; if (b) { b.disabled = true; b.textContent = 'Đang phát…'; b.classList.remove('primary'); } if (st) st.textContent = 'Đang phát. Bạn vẫn chọn đáp án được trong lúc nghe.'; };
      a.onended = () => { const b = document.querySelector('[data-x="placeplay"]') as HTMLButtonElement | null; if (b) b.textContent = 'Đã nghe'; if (st) st.textContent = 'Đã nghe xong. Chọn đáp án rồi bấm Câu tiếp.'; };
      a.onerror = () => { if (run && run.plays < 1) { run.audioErr = 'Không tải được âm thanh (mất mạng hoặc trình duyệt chặn).'; host.render(); } };
      a.play().catch(() => { if (run && run.plays < 1) { run.audioErr = 'Trình duyệt chưa phát được âm thanh. Bấm Thử tải lại, hoặc kiểm tra âm lượng.'; host.render(); } });
    },
    placeretry() { if (run) { run.audioErr = ''; host.render(); } },
    placeskipl() {
      if (!run) return;
      const sec = run.st.sections[run.st.i];
      if (sec && sec.skill === 'L') { sec.done = true; run.st.cur = null; }
      const next = advance(run.st, pools(), hiddenItems(), Date.now());
      if (!next) placeFinish(); else host.go('place-run');
    },
    placeflag(el) {
      if (!run) return;
      const id = el.dataset.i || '', reason = FLAG_REASONS[Number(el.dataset.r)] ?? FLAG_REASONS[0]!;
      const g = Object.values(run.groups).find(q => q.items.some(i => i.id === id)), it = g?.items.find(i => i.id === id);
      if (!g || !it) return;
      const given = run.st.sections.flatMap(s => s.answers).find(a => a.id === id)?.given ?? '';
      host.flag({ kind: 'Ôn thi', ref: id, item: g.title, prompt: it.q, answer: String(it.ans), given, reason });
      host.toast('Đã ghi nhận. Gửi cho người soạn trong Cài đặt → Câu đã báo lỗi.');
    },
    netrefresh() { void refresh(host, true).then(ok => { host.toast(ok ? 'Đã tải số liệu mới.' : 'Chưa tải được (mất mạng?).'); host.render(); }); },
  };

  const forms: Record<string, (f: HTMLFormElement, submitter: HTMLButtonElement | null) => void> = {
    ...mc.forms,
    setcheck(f) { setCheck(f); },
    nbanswer(f) {
      if (!nb || nb.answered) return;
      const id = nb.queue[nb.i]!, g = Object.values(nb.groups).find(q => q.items.some(i => i.id === id)), it = g?.items.find(i => i.id === id);
      if (!g || !it) return;
      const given = readGiven(f, [it], g)[id];
      if (given === undefined) { host.toast('Hãy trả lời trước khi kiểm tra.'); return; }
      const m = markItem(it, g, given), ok = m.got === m.of;
      nb.answered = { given, mark: m }; if (ok) nb.right++;
      reviewed(X(), id, ok, host.today()); host.save(); host.render();
    },
    placenext(f) {
      const d = new FormData(f), given: Record<string, string | undefined> = {};
      for (const [k, v] of d.entries()) given[k] = String(v);
      placeNext(given);
    },
    settings(f) {
      const d = new FormData(f), x = X();
      const ex = String(d.get('exam') || '') as ExamId;
      if (EXAM_NAME[ex]) x.exam = ex;
      const t = parseFloat(String(d.get('target') || ''));
      x.target = Number.isFinite(t) ? t : null;
      x.date = isoToDay(String(d.get('date') || ''));
      const m = parseInt(String(d.get('mins') || ''), 10);
      if (Number.isFinite(m)) x.mins = Math.min(600, Math.max(5, m));
      host.save(); host.toast('Đã lưu.'); host.go('hub');
    },
    consent(f, sub) {
      const d = new FormData(f), x = X(), today = host.today();
      if (sub?.value === 'off') { x.consent = { on: false, adult: !!x.consent?.adult, parent: !!x.consent?.parent, day: today }; x.share = false; host.save(); host.toast('Đã tắt chia sẻ. App không gửi gì nữa.'); host.render(); return; }
      const age = d.get('age'), parent = d.get('parent') === 'on';
      if (age !== 'adult' && age !== 'minor') { host.toast('Hãy chọn độ tuổi trước.'); return; }
      if (age === 'minor' && !parent) { host.toast('Dưới 16 tuổi cần cha mẹ hoặc người giám hộ đồng ý (đánh dấu ô bên dưới).'); return; }
      x.consent = { on: true, adult: age === 'adult', parent, day: today }; x.share = true;
      void refresh(host);
      host.save(); host.toast('Cảm ơn bạn! Đã bật chia sẻ thống kê ẩn danh.'); host.render();
    },
    real(f) {
      const d = new FormData(f), x = X(), max = x.exam === 'vstep' ? 10 : 9;
      if (!x.exam) return;
      const val = (k: string): number | null => { const v = parseFloat(String(d.get(k) || '').replace(',', '.')); return Number.isFinite(v) && v >= 0 && v <= max ? Math.round(v * 2) / 2 : null; };
      const r = { exam: x.exam, day: host.today(), L: val('L'), R: val('R'), W: val('W'), S: val('S') };
      if ([r.L, r.R, r.W, r.S].every(v => v === null)) { host.toast(`Nhập ít nhất một điểm (0–${max}).`); return; }
      x.real.push(r); x.real = x.real.slice(-20);
      // Cặp ước tính – điểm thật, cùng thang (VSTEP: quy điểm thật ra band để so với ước tính band)
      const p = profile(x, host.today(), hiddenItems(), itemParams);
      const pairs = (['L', 'R', 'W', 'S'] as const).flatMap(k => {
        const real = r[k], est = p[k].band;
        if (real === null || est === null) return [];
        return [{ skill: k, est, real: x.exam === 'vstep' ? vstepToBand(real) : real }];
      });
      host.save();
      const msg = pairs.length ? pairs.map(q => `${q.skill}: lệch ${Math.abs(q.est - q.real).toString().replace('.', ',')} band`).join(' · ') : 'Chưa có ước tính để so.';
      host.toast(`Đã lưu. ${msg}`);
      void sendPairs(host, x, x.exam, pairs);
      host.go('hub');
    },
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('submit', e => {
      const f = e.target as HTMLFormElement | null, k = f?.dataset?.xform;
      if (!f || !k || !forms[k]) return;
      e.preventDefault(); e.stopImmediatePropagation();
      forms[k](f, (e as SubmitEvent).submitter as HTMLButtonElement | null);
    }, true);
    document.addEventListener('click', e => {
      const t = (e.target as Element | null)?.closest?.('[data-x]') as HTMLElement | null;
      if (!t) return;
      const f = act[t.dataset.x || ''];
      if (f) { e.preventDefault(); f(t); }
    });
  }

  return {
    version: MODULE_VERSION,
    render,
    after(route: string) {
      stopTimer();
      mc.after(route);
      const sa = document.getElementById('xsetaudio') as HTMLAudioElement | null;
      if (route === 'set' && prun?.ver === 'noise' && sa) attachNoise(sa); else detachNoise();
      if (route === 'place-run' && run && !run.st.finished) {
        timer = setInterval(() => {
          const sec = run?.st.sections[run.st.i], el = document.getElementById('xtimer');
          if (!run || !sec || run.st.finished) return stopTimer();
          const left = remainingMs(sec, Date.now());
          if (el) { const s = Math.ceil(left / 1000); el.textContent = `Còn ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }
          if (left <= 0) {   // hết giờ: chấm phần đã chọn của bài đang làm rồi chuyển kỹ năng
            stopTimer();
            const f = document.querySelector('form[data-xform="placenext"]') as HTMLFormElement | null, given: Record<string, string | undefined> = {};
            if (f) for (const [k, v] of new FormData(f).entries()) given[k] = String(v);
            host.toast('Hết giờ phần này.');
            placeNext(given);
          }
        }, 1000);
      }
    },
    sanitize: sanitizeX,
    merge: mergeX,
  };
}
