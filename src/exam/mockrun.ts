// Điều khiển đề thi thử: nạp đề, tải trước âm thanh, phát liền từng phần, đồng hồ, lưu bài đang làm, nộp và chấm.
// Gốc rễ được xử lý:
// - Mạng 4G yếu: tải trước TOÀN BỘ âm thanh phần Nghe (blob) trước khi bắt đầu, để âm thanh không dừng giữa đề.
// - Android hay đóng tab chạy nền: câu trả lời, phần đang nghe và giây đã nghe, giờ còn lại đều lưu vào x.mockRun.
// - Vẽ lại màn hình không được làm mất bài: thẻ <audio> của đề nằm ngoài DOM (new Audio), câu trả lời ghi ngay khi gõ/chọn.

import type { Host } from './host.ts';
import type { XState, MockRun } from './state.ts';
import { MOCKLOG_MAX } from './state.ts';
import type { Ctx } from './main.ts';
import { IDX, loadPack, type MockEntry } from './packs.ts';
import { MOCK_FORMAT, testGroups, numbering, packsFor, scoreMock, mockAdj, type MSkill } from './mock.ts';
import { viewMocks, viewMockIntro, viewMockRun, viewMockResult, mmss, type MockView, type RunUi } from './views/mock.ts';
import { readGiven } from './views/items.ts';
import { FLAG_REASONS } from './views/place.ts';
import { addWrong } from './notebook.ts';
import { sendAttempt, itemStat } from './net.ts';
import { QT } from './content.ts';
import { vstepToBand } from './scales.ts';
import type { Given } from './score.ts';

export interface MockController {
  routes: Record<string, (c: Ctx) => string>;
  act: Record<string, (el: HTMLElement) => void>;
  forms: Record<string, (f: HTMLFormElement) => void>;
  after(route: string): void;
}

export function mockController(host: Host, X: () => XState): MockController {
  let view: MockView | null = null, loading = '', err = '', confirmN = -1, rate = 1;
  const ui: RunUi = { view: 0, playing: false, loadMsg: '', audioErr: '', deadline: 0 };
  let audio: HTMLAudioElement | null = null, timer: ReturnType<typeof setInterval> | null = null, lastSave = 0, saveT: ReturnType<typeof setTimeout> | null = null;
  const blobs = new Map<string, string>();
  const entry = (id: string): MockEntry | undefined => (IDX.mocks ?? []).find(m => m.id === id);
  const run = (): MockRun | null => X().mockRun;

  async function load(t: MockEntry): Promise<MockView> {
    if (view && view.t.id === t.id) return view;
    const gs = (await Promise.all([...new Set([...packsFor(t, 'L'), ...packsFor(t, 'R')])].map(loadPack))).flat();
    const parts = { L: testGroups(t, 'L', gs), R: testGroups(t, 'R', gs) };
    view = { t, parts, num: { L: numbering(parts.L), R: numbering(parts.R) } };
    return view;
  }

  // Tải trước âm thanh mọi phần Nghe (qua service worker nên lần sau dùng được khi mất mạng).
  async function preload(v: MockView): Promise<void> {
    const files = v.parts.L.map(gs => gs[0]?.audio?.file).filter((f): f is string => !!f);
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      if (blobs.has(f)) continue;
      loading = `Đang tải âm thanh ${i + 1}/${files.length}…`; ui.loadMsg = loading; host.render();
      const r = await fetch(f);
      if (!r.ok) throw new Error('http ' + r.status);
      blobs.set(f, URL.createObjectURL(await r.blob()));
    }
    loading = ''; ui.loadMsg = '';
  }

  function saveSoon(): void {
    if (saveT) clearTimeout(saveT);
    saveT = setTimeout(() => { saveT = null; host.save(); }, 600);
  }

  function stopAudio(): void {
    if (audio) { audio.onended = audio.ontimeupdate = audio.onerror = null; try { audio.pause(); } catch { /* đã dừng */ } }
    ui.playing = false;
  }

  function stopTimer(): void {
    const r = run();
    if (timer) { clearInterval(timer); timer = null; }
    if (r && ui.deadline) { r.left = Math.max(0, ui.deadline - Date.now()); host.save(); }
    ui.deadline = 0;
  }

  const timed = (r: MockRun): boolean => r.sk === 'R' || r.phase === 'check';

  async function start(id: string, mode: 'both' | 'L' | 'R'): Promise<void> {
    const t = entry(id);
    if (!t) return;
    err = ''; loading = 'Đang tải đề…'; host.render();
    const sk: MSkill = mode === 'R' ? 'R' : 'L';
    try {
      const v = await load(t);
      if (v.parts[sk].some(gs => !gs.length)) throw new Error('thiếu phần');
      if (sk === 'L') await preload(v);
      stopAudio(); stopTimer();
      const x = X();
      x.mockRun = { t: id, sk, both: mode === 'both', part: 0, pos: 0, phase: 'run', left: sk === 'R' ? MOCK_FORMAT[t.exam].R.minutes * 60000 : 0, given: {}, marked: [], secs: 0 };
      host.save();
      loading = ''; ui.view = 0; ui.audioErr = ''; confirmN = -1;
      host.go('mock-run');
    } catch {
      loading = '';
      err = sk === 'L' ? 'Chưa tải được đề hoặc âm thanh (cần mạng ở lần đầu). Kiểm tra mạng rồi thử lại, hoặc chọn "Chỉ Đọc".' : 'Chưa tải được đề (cần mạng ở lần đầu). Kiểm tra mạng rồi thử lại.';
      host.render();
    }
  }

  async function resume(): Promise<void> {
    const x = X(), r = x.mockRun, t = r && entry(r.t);
    if (!r || !t) { x.mockRun = null; host.save(); host.go('mocks'); return; }
    err = ''; loading = 'Đang mở bài đang làm…'; host.render();
    try {
      const v = await load(t);
      if (r.sk === 'L' && r.phase === 'run') await preload(v);
      loading = ''; ui.view = r.sk === 'L' ? r.part : Math.min(r.part, v.parts[r.sk].length - 1); ui.playing = false; confirmN = -1;
      host.go('mock-run');
    } catch { loading = ''; err = 'Chưa mở được đề (cần mạng nếu đề chưa tải về máy).'; host.go('mocks'); }
  }

  function play(): void {
    const r = run(), v = view;
    if (!r || !v || r.sk !== 'L' || r.phase !== 'run') return;
    const f = v.parts.L[r.part]?.[0]?.audio?.file;
    if (!f) return;
    const a = audio ?? (audio = new Audio());
    const src = blobs.get(f) ?? f, at = r.pos;
    a.onended = partEnded;
    a.onerror = () => { ui.playing = false; ui.audioErr = 'Không phát được âm thanh. Bấm "Thử phát lại".'; host.render(); };
    a.ontimeupdate = () => { const q = run(); if (!q) return; q.pos = a.currentTime; if (Date.now() - lastSave > 5000) { lastSave = Date.now(); host.save(); } };
    const go = (): void => {
      // Làm tiếp sau gián đoạn: lùi 2 giây để không mất câu đang nói dở.
      if (at > 0) { try { a.currentTime = Math.max(0, at - 2); } catch { /* chưa tua được: phát từ đầu phần */ } }
      a.play().then(() => { ui.playing = true; ui.audioErr = ''; host.render(); })
        .catch(() => { ui.playing = false; ui.audioErr = 'Trình duyệt chưa cho phát âm thanh. Bấm "Thử phát lại" và kiểm tra âm lượng.'; host.render(); });
    };
    if (a.dataset.f !== f) { a.dataset.f = f; a.src = src; a.onloadedmetadata = () => { a.onloadedmetadata = null; go(); }; a.load(); }
    else go();
  }

  function partEnded(): void {
    const r = run(), v = view;
    if (!r || !v) return;
    if (r.part < v.parts.L.length - 1) {
      r.part++; r.pos = 0; ui.view = r.part; host.save(); host.render();
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
      play();   // cùng thẻ audio đã được người học bấm phát: iOS cho phát tiếp
    } else {
      stopAudio();
      r.phase = 'check'; r.left = (MOCK_FORMAT[v.t.exam].L.checkSecs ?? 120) * 1000; r.secs += Math.round(v.parts.L.reduce((s, gs) => s + (gs[0]?.audio?.dur ?? 0), 0));
      host.save(); host.render();
    }
  }

  // Ghi câu trả lời của phần đang xem vào bài đang làm (gọi khi gõ/chọn và trước mỗi lần vẽ lại).
  function capture(f: HTMLFormElement | null): void {
    const r = run(), v = view;
    if (!f || !r || !v) return;
    for (const g of v.parts[r.sk][ui.view] ?? []) {
      for (const [k, val] of Object.entries(readGiven(f, g.items, g))) {
        if (val === undefined) delete r.given[k];
        else r.given[k] = Array.isArray(val) ? val.slice(0, 5) : val.slice(0, 80);
      }
    }
  }
  const form = (): HTMLFormElement | null => (typeof document === 'undefined' ? null : document.querySelector('form[data-xform="mocksubmit"]'));

  function adjFor(t: MockEntry, sk: MSkill): number {
    const same = (IDX.mocks ?? []).filter(m => m.exam === t.exam);
    const ids = Object.keys(IDX.items);
    const a = mockAdj(same.map(m => ({ id: m.id, items: ids.filter(i => m[sk].some(p => i.startsWith(p + '-'))) })), itemStat);
    return a?.[t.id] ?? t.adj?.[sk] ?? 0;
  }

  function submit(auto: boolean): void {
    const x = X(), r = x.mockRun, v = view;
    if (!r || !v) return;
    capture(form());
    const parts = v.parts[r.sk], all = parts.flat().flatMap(g => g.items);
    const blank = all.filter(it => r.given[it.id] === undefined).length;
    if (!auto && blank > 0 && confirmN !== blank) { confirmN = blank; host.toast(`Còn ${blank} câu chưa trả lời. Bấm "Nộp bài" lần nữa để nộp.`); return; }
    const t = v.t, sk = r.sk, s = scoreMock(t, sk, parts, r.given, adjFor(t, sk)), day = host.today(), items: Record<string, 0 | 1> = {};
    for (const g of parts.flat()) for (const it of g.items) {
      const m = s.marks[it.id]!, ok = m.got === m.of;
      items[it.id] = ok ? 1 : 0;
      x.resp.push({ i: it.id, c: ok ? 1 : 0, d: day, s: sk, b: it.b, g: QT[g.qtype]?.guess ?? 0 });
      if (!ok) addWrong(x, it.id, g.qtype, day, it.tag);
    }
    const f = MOCK_FORMAT[t.exam][sk];
    const secs = sk === 'R' ? Math.round((f.minutes * 60000 - Math.max(0, ui.deadline ? ui.deadline - Date.now() : r.left)) / 1000)
      : r.secs + Math.round(((f.checkSecs ?? 0) * 1000 - Math.max(0, ui.deadline ? ui.deadline - Date.now() : r.left)) / 1000);
    x.attempts.push({ id: 'mock-' + t.id, kind: 'mock', exam: t.exam, day, skill: sk, correct: s.got, total: s.of,
      band: t.exam === 'vstep' ? vstepToBand(s.score) : s.score, secs: Math.max(0, secs), wrong: all.filter(it => items[it.id] === 0).map(it => it.id).slice(0, 200) });
    x.mockLog[`${t.id}-${sk}`] = { d: day, given: r.given };
    const keys = Object.keys(x.mockLog).sort((a, b) => x.mockLog[a]!.d - x.mockLog[b]!.d);
    for (const k of keys.slice(0, Math.max(0, keys.length - MOCKLOG_MAX))) delete x.mockLog[k];
    if (timer) { clearInterval(timer); timer = null; }
    ui.deadline = 0; stopAudio();
    x.mockRun = null; confirmN = -1;
    host.addMinutes(Math.max(0, secs) / 60); host.markActive(); host.save();
    if (auto) host.toast('Hết giờ: app đã nộp bài.');
    void sendAttempt(host, x, t.exam, 'mock', items);
    host.go(`mock-res/${t.id}/${sk}`);
  }

  function tick(): void {
    const r = run();
    if (!r || !ui.deadline) return;
    const left = ui.deadline - Date.now(), el = typeof document !== 'undefined' ? document.getElementById('xmtimer') : null;
    if (el) el.textContent = mmss(left);
    r.left = Math.max(0, left);
    if (Date.now() - lastSave > 10000) { lastSave = Date.now(); host.save(); }
    if (left <= 0) submit(true);
  }

  if (typeof document !== 'undefined') {
    const onInput = (e: Event): void => {
      const f = (e.target as Element | null)?.closest?.('form[data-xform="mocksubmit"]') as HTMLFormElement | null;
      if (f) { capture(f); saveSoon(); }
    };
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    // Ẩn app (gọi điện, chuyển app): ghi ngay giờ còn lại và vị trí nghe.
    document.addEventListener('visibilitychange', () => { const r = run(); if (document.hidden && r) { if (ui.deadline) r.left = Math.max(0, ui.deadline - Date.now()); host.save(); } });
  }

  const routes: Record<string, (c: Ctx) => string> = {
    mocks: viewMocks,
    mock: c => viewMockIntro(c, entry(c.route.split('/')[1] ?? ''), loading, err),
    'mock-run': c => {
      const r = c.x.mockRun;
      if (!r) return viewMocks(c);
      if (!view || view.t.id !== r.t) { if (!loading) void resume(); return `<p class="muted" role="status">${c.host.esc(loading || 'Đang mở bài đang làm…')}</p>`; }
      if (timed(r) && !ui.deadline) ui.deadline = Date.now() + r.left;
      return viewMockRun(c, view, r, ui);
    },
    'mock-res': c => {
      const [, id = '', sk0 = 'L'] = c.route.split('/'), sk: MSkill = sk0 === 'R' ? 'R' : 'L', t = entry(id), log = c.x.mockLog[`${id}-${sk}`];
      if (!t || !log) return viewMocks(c);
      if (!view || view.t.id !== id) {
        if (!loading) { loading = 'Đang tải đề…'; void load(t).then(() => { loading = ''; host.render(); }, () => { loading = ''; err = 'Chưa tải được đề để xem lại (cần mạng).'; host.go('mock/' + id); }); }
        return `<p class="muted" role="status">Đang tải đề…</p>`;
      }
      const given = log.given as Record<string, Given>;
      return viewMockResult(c, view, sk, given, scoreMock(t, sk, view.parts[sk], given, adjFor(t, sk)), log.d, rate);
    },
  };

  const act: Record<string, (el: HTMLElement) => void> = {
    mockstart(el) { const m = el.dataset.m; void start(el.dataset.t || '', m === 'L' || m === 'R' ? m : 'both'); },
    mockresume() { void resume(); },
    mockquit() { stopAudio(); if (timer) { clearInterval(timer); timer = null; } ui.deadline = 0; X().mockRun = null; host.save(); host.toast('Đã bỏ bài đang làm.'); host.render(); },
    mockplay() { ui.audioErr = ''; play(); },
    mockview(el) { capture(form()); ui.view = Number(el.dataset.p) || 0; const r = run(); if (r && r.sk === 'R') r.part = ui.view; host.render(); if (typeof window !== 'undefined') window.scrollTo(0, 0); },
    mockgo(el) {
      capture(form()); ui.view = Number(el.dataset.p) || 0; host.render();
      const q = document.getElementById('q-' + (el.dataset.i || ''));
      if (q) { q.scrollIntoView({ block: 'start' }); (q.querySelector('input') as HTMLInputElement | null)?.focus({ preventScroll: true }); }
    },
    mockmark(el) {
      const r = run(), id = el.dataset.i || '';
      if (!r || !id) return;
      capture(form());
      r.marked = r.marked.includes(id) ? r.marked.filter(i => i !== id) : [...r.marked, id];
      saveSoon();
      el.setAttribute('aria-pressed', String(r.marked.includes(id)));
      el.textContent = r.marked.includes(id) ? '★ Đã đánh dấu' : '☆ Đánh dấu xem lại';
    },
    mockrate(el) { rate = Number(el.dataset.v) === 0.8 ? 0.8 : 1; host.render(); },
    mockflag(el) {
      const id = el.dataset.i || '', reason = FLAG_REASONS[Number(el.dataset.r)] ?? FLAG_REASONS[0]!;
      const g = view && Object.values(view.parts).flat(2).find(q => q.items.some(i => i.id === id)), it = g?.items.find(i => i.id === id);
      if (!g || !it || !view) return;
      const log = Object.entries(X().mockLog).find(([k]) => k.startsWith(view!.t.id + '-'))?.[1], gv = log?.given[id];
      host.flag({ kind: 'Ôn thi', ref: id, item: g.title, prompt: it.q, answer: JSON.stringify(it.ans).slice(0, 200), given: Array.isArray(gv) ? gv.join(',') : gv ?? '', reason });
      host.toast('Đã ghi nhận. Gửi cho người soạn trong Cài đặt → Câu đã báo lỗi.');
    },
  };

  const forms: Record<string, (f: HTMLFormElement) => void> = {
    mocksubmit() { submit(false); },
  };

  return {
    routes, act, forms,
    after(route: string) {
      const name = route.split('/')[0];
      const r = run();
      if (name !== 'mock-run') {
        // Rời màn làm bài: dừng âm thanh (ghi lại vị trí) và dừng đồng hồ (ghi giờ còn lại).
        if (ui.playing || timer) { stopAudio(); stopTimer(); }
      } else if (r && timed(r) && !timer) {
        if (!ui.deadline) ui.deadline = Date.now() + r.left;
        timer = setInterval(tick, 1000);
      }
      if (name === 'mock-res' && typeof document !== 'undefined') {
        document.querySelectorAll<HTMLAudioElement>('audio[data-rate]').forEach(a => { a.defaultPlaybackRate = rate; a.playbackRate = rate; a.preservesPitch = true; });
      }
    },
  };
}
