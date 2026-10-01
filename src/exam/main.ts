// Điểm vào của phần ôn thi IELTS/VSTEP. app.js nạp tệp này (import động) khi người học mở tab "Ôn thi".
// Mô-đun trả về hàm dựng HTML theo route; sự kiện bấm dùng thuộc tính data-x để không lẫn với app.js.

import type { Host } from './host.ts';
import { migrateX, sanitizeX, mergeX, X_V, type XState } from './state.ts';
import type { ExamId } from './scales.ts';
import { viewScales } from './views/scales.ts';
import { viewHub, EXAM_NAME } from './views/hub.ts';

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

  const routes: Record<string, (c: Ctx) => string> = {
    hub: viewHub,
    scales: viewScales,
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
  };

  if (typeof document !== 'undefined') {
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
