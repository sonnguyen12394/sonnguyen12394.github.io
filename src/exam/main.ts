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
import { itemParams, cleanCache } from './packs.ts';

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

  const routes: Record<string, (c: Ctx) => string> = {
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
      X().exam = v; host.save(); host.toast(`Đã chọn ${EXAM_NAME[v]}.`); host.go('hub');
    },
    examreset() { X().exam = ''; host.save(); host.go('hub'); },
    route(el) { host.go(el.dataset.r || 'hub'); },
    netrefresh() { void refresh(host, true).then(ok => { host.toast(ok ? 'Đã tải số liệu mới.' : 'Chưa tải được (mất mạng?).'); host.render(); }); },
  };

  const forms: Record<string, (f: HTMLFormElement, submitter: HTMLButtonElement | null) => void> = {
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
    after() { /* các màn có hẹn giờ/âm thanh sẽ khởi động ở đây */ },
    sanitize: sanitizeX,
    merge: mergeX,
  };
}
