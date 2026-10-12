// v130 Kéo / thu phóng bản đồ Phố Chữ: vanilla pointer events (một ngón kéo, hai ngón chụm), con lăn, nút + / − / ⌂, Tab tới công trình thì
// camera đi theo. Camera chỉ là tiện ích trình bày: nhớ ở localStorage của máy này (bọc try/catch), không vào st.e / đồng bộ.

import { clampCam, camCss, ZMAX, type Cam } from './worldmap.ts';

const KEY = 'el-map-cam', TAP = 6;
let cam: Cam | null = null, home: Cam | null = null, dragged = 0, shown = '', lastMoved = false;

function load(): Cam | null {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && [v.cx, v.cy, v.z].every(n => typeof n === 'number' && isFinite(n)) ? v : null; } catch { return null; }
}
function store(c: Cam): void { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* chế độ riêng tư: bỏ qua */ } }
const frame = (): HTMLElement | null => (typeof document === 'undefined' ? null : document.querySelector('#app .wmap'));
const reduced = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function apply(f: HTMLElement, c: Cam, smooth = false): void {
  const w = f.querySelector('.wworld') as HTMLElement | null;
  if (!w) return;
  cam = clampCam(c, f.clientWidth, f.clientHeight);
  w.style.transition = smooth && !reduced() ? 'transform .35s ease' : '';
  w.style.transform = camCss(cam, f.clientWidth, f.clientHeight);
  f.dataset.z = String(cam.z);
}
// Camera mặc định: tâm ở ghim "Bạn ở đây", phóng sao cho khoảng 440 đơn vị vừa bề ngang khung (chữ công trình đọc được trên điện thoại),
// không quá 1,1 trên màn rộng (nhìn được nhiều khu một lúc).
const homeOf = (f: HTMLElement, hx: number, hy: number): Cam => ({ cx: hx, cy: hy, z: Math.min(1.1, Math.max(0.6, f.clientWidth / 440)) });

// Vừa kéo (không phải chạm) thì bỏ qua cú click kết thúc chính lần kéo đó. Lần nhấn mới (pointerdown) xoá cờ, nên bấm ＋ ngay sau khi kéo vẫn ăn.
export const justDragged = (): boolean => lastMoved && Date.now() - dragged < 400;
export function mapZoom(k: number): void {
  const f = frame(); if (!f || !cam) return;
  apply(f, { ...cam, z: cam.z * k }, true); store(cam!);
}
export function mapHome(): void { const f = frame(); if (!f || !home) return; apply(f, home, true); store(cam!); }
export function mapFocus(x: number, y: number): void { const f = frame(); if (!f || !cam) return; apply(f, { ...cam, cx: x, cy: y }, true); store(cam!); }

// Gọi sau mỗi lần vẽ (host gọi after('quest')): đặt lại camera lên lớp thế giới mới và gắn sự kiện một lần cho mỗi khung.
export function mapMount(): void {
  const f = frame();
  if (!f || f.dataset.bound) return;
  f.dataset.bound = '1';
  // Bảng công trình vừa mở nằm dưới khung: cuộn tới cho thấy (một lần mỗi công trình, không cuộn lại khi vẽ lại cùng bảng).
  const sh = document.querySelector('#app .wsheet') as HTMLElement | null, key = sh?.getAttribute('aria-labelledby') ?? '';
  if (sh && key !== shown) sh.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  shown = key;
  const hx = Number(f.dataset.hx) || 500, hy = Number(f.dataset.hy) || 1200;
  home = homeOf(f, hx, hy);
  apply(f, cam ?? load() ?? home);

  // Vừa kéo xong thì nuốt cú bấm (mọi nút trên bản đồ, kể cả data-go của app), trước khi tới bộ bắt sự kiện ở document.
  f.addEventListener('click', ev => { if (justDragged()) { ev.stopPropagation(); ev.preventDefault(); } }, true);
  const pts = new Map<number, { x: number; y: number }>();
  let start: { x: number; y: number; c: Cam; d: number; mx: number; my: number } | null = null, moved = false;
  const mid = () => { const a = [...pts.values()]; return { x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length, d: a.length > 1 ? Math.hypot(a[0]!.x - a[1]!.x, a[0]!.y - a[1]!.y) : 0 }; };
  const begin = () => { const m = mid(); start = { x: m.x, y: m.y, c: { ...cam! }, d: m.d, mx: m.x, my: m.y }; };
  f.addEventListener('pointerdown', ev => {
    if (ev.button > 0) return;
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pts.size === 1) { moved = false; lastMoved = false; }
    begin();
  });
  f.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId) || !start || !cam) return;
    pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    const m = mid();
    if (!moved && Math.hypot(m.x - start.mx, m.y - start.my) < TAP && !(m.d && start.d && Math.abs(m.d - start.d) > TAP)) return;
    if (!moved) { moved = true; try { f.setPointerCapture(ev.pointerId); } catch { /* không hỗ trợ */ } }
    const z = start.d && m.d ? start.c.z * (m.d / start.d) : start.c.z;
    apply(f, { cx: start.c.cx - (m.x - start.x) / z, cy: start.c.cy - (m.y - start.y) / z, z });
  });
  const end = (ev: PointerEvent) => {
    if (!pts.delete(ev.pointerId)) return;
    if (moved) { dragged = Date.now(); lastMoved = true; if (cam) store(cam); }
    if (pts.size) begin(); else start = null;
  };
  f.addEventListener('pointerup', end);
  f.addEventListener('pointercancel', end);
  f.addEventListener('wheel', ev => {
    if (!cam) return;
    ev.preventDefault();
    apply(f, { ...cam, z: cam.z * Math.exp(-ev.deltaY * 0.0015) }); store(cam!);
  }, { passive: false });
  // Bàn phím: Tab tới công trình nằm ngoài khung thì kéo camera tới đó.
  f.addEventListener('focusin', ev => {
    const t = (ev.target as HTMLElement).closest?.('.wplace') as HTMLElement | null;
    if (!t || !cam) return;
    const x = Number(t.dataset.x), y = Number(t.dataset.y), fr = f.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.left < fr.left || r.right > fr.right || r.top < fr.top || r.bottom > fr.bottom) mapFocus(x, y);
    f.scrollLeft = 0; f.scrollTop = 0;   // trình duyệt tự cuộn khung khi focus: camera đã lo việc đó
  });
  f.addEventListener('keydown', ev => {
    if (!cam) return;
    const step = 80 / cam.z, k: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (ev.target !== f) return;   // mũi tên chỉ kéo khi đang đứng ở khung (không phải ở nút)
    if (k[ev.key]) { ev.preventDefault(); apply(f, { ...cam, cx: cam.cx + k[ev.key]![0], cy: cam.cy + k[ev.key]![1] }); store(cam); }
    else if (ev.key === '+' || ev.key === '=') { ev.preventDefault(); mapZoom(1.25); }
    else if (ev.key === '-') { ev.preventDefault(); mapZoom(0.8); }
  });
}
