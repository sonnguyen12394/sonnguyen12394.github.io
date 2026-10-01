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
      for (const a of sec.answers) { x.resp.push({ i: a.id, c: a.correct ? 1 : 0, d: day, s: sec.skill, b: a.b, g: a.g }); items[a.id] = a.correct ? 1 : 0; }
      const r = run.res.find(q => q.skill === sec.skill);
      if (r) x.attempts.push({ id: `place-${sec.skill.toLowerCase()}`, kind: 'place', exam, day, skill: sec.skill, correct: sec.answers.filter(a => a.correct).length, total: sec.answers.length, band: r.band, se: r.se, secs, wrong: sec.answers.filter(a => !a.correct).map(a => a.id) });
    }
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

  const routes: Record<string, (c: Ctx) => string> = {
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
    exam(el) {
      const v = el.dataset.v as ExamId;
      if (!EXAM_NAME[v]) return;
      const x = X(), first = !x.attempts.some(a => a.kind === 'place');
      x.exam = v; host.save(); host.toast(`Đã chọn ${EXAM_NAME[v]}.`); host.go(first ? 'place' : 'hub');
    },
    examreset() { X().exam = ''; host.save(); host.go('hub'); },
    route(el) { host.go(el.dataset.r || 'hub'); },
    placestart() { void placeStart(); },
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
