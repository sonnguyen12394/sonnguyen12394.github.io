// v132 Điều khiển nhân vật (avatar.ts, heroview.ts): ngoại hình, 7 ô trang bị theo chỉ số thật, tủ thời trang mua bằng xu, ăn mừng lên bậc.
// bagctl tạo một lần và nối vào các tab Túi chữ; main.ts dùng svg() cho sảnh và pending() cho chấm đỏ. Không ghi bằng chứng học.

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import type { ECtx } from './views.ts';
import type { StatRow } from './bag.ts';
import { sfx } from './sfx.ts';
import {
  avatar, gearOf, tiers, power, freshAv, randomLook, canBuy, buy, toggleWear, fashById, fresh, markSeen, itemVi, SLOT, LOOK_MAX,
  type AvSave, type Slot, type FSlot, type Look,
} from './avatar.ts';
import { viewEquip, viewLook, viewMake, type HeroIn } from './heroview.ts';

export type HeroTab = 'me' | 'look' | 'make';
export interface HeroDeps {
  host: EHost;
  E: () => EState;
  rows: () => StatRow[];
  lv: () => number;
  wallet: () => number;
  open: (tab: HeroTab) => void;   // chuyển tab Túi chữ
}
export interface SvgOpt { wear?: Partial<Record<FSlot, string>>; showF?: boolean; label?: string; cls?: string; look?: Look; gear?: Partial<Record<Slot, number>> }   // v133 gear: đè bậc vài ô (Vũ khí đã rèn)

export function makeHero(d: HeroDeps) {
  const { host } = d;
  let sel: Slot | null = null, tryId: string | null = null, party: Slot[] = [], pop = false;
  // Ngoại hình mặc định ổn định theo máy (ngày chọn mục tiêu đầu tiên), để chưa tạo nhân vật vẫn thấy cùng một người.
  const seed = (): number => (d.E().goals[0]?.since ?? 7) * 2654435761;
  const peek = (): AvSave => d.E().av ?? freshAv(seed());
  const sv = (): AvSave => (d.E().av ||= freshAv(seed()));
  const gear = () => gearOf(d.rows());
  const svg = (size: number, o: SvgOpt = {}): string => { const a = peek(); return avatar(o.look ?? a.look, { ...tiers(gear()), ...o.gear }, { size, wear: o.wear ?? a.wear, showF: o.showF ?? a.showF, label: o.label, cls: o.cls }); };
  const pet = (): string => host.mascot?.('happy', 64) ?? '';

  // Mở tab Trang bị: ô nào vừa lên bậc thì ăn mừng một lần (tiếng + viền sáng), rồi ghi đã xem.
  function enter(): void {
    const g = gear(); party = fresh(peek(), g);
    if (party.length) { markSeen(sv(), g); sfx('tierup'); host.save(); }
  }
  function reset(): void { sel = null; tryId = null; party = []; pop = false; }
  function input(): HeroIn {
    const rs = d.rows(), p = pop; pop = false;   // nảy đúng một lần vẽ
    return { av: peek(), gear: gearOf(rs), rows: rs, lv: d.lv(), power: power(rs), coins: d.wallet(), sel, tryId, party, pop: p, hero: svg, pet: pet() };
  }
  function body(c: ECtx, tab: HeroTab): string {
    const x = input();
    return tab === 'look' ? viewLook(c, x) : tab === 'make' ? viewMake(c, x) : viewEquip(c, x);
  }

  const acts: Record<string, (el: HTMLElement) => void> = {
    bgavslot: el => { const s = el.dataset.s as Slot; if (!(s in SLOT)) return; sel = sel === s ? null : s; sfx(sel ? 'open' : 'close'); party = []; host.render(); },
    bgavtry: el => { const id = el.dataset.id ?? ''; if (!fashById(id)) return; tryId = tryId === id ? null : id; pop = true; sfx('tap'); host.render(); },
    bgavbuy: el => {
      const id = el.dataset.id ?? '', f = fashById(id), v = canBuy(peek(), id, d.wallet()); if (!f) return;
      if (!v.ok) { sfx('nope'); host.toast(v.why === 'coins' ? `Chưa đủ xu: cần ${f.price}, đang có ${d.wallet()}. Chơi một ván để kiếm thêm.` : 'Bạn đã có món này.'); return; }
      buy(sv(), id, d.wallet()); pop = true; sfx('buy'); host.toast(`👗 Đã mua và mặc ${f.vi}.`); host.save(); host.render();
    },
    bgavwear: el => {
      const id = el.dataset.id ?? '', r = toggleWear(sv(), id); if (!r) return;
      const a = sv(); if (r === 'on') a.showF = true; pop = true;
      sfx(r === 'on' ? 'equip' : 'unequip'); host.save(); host.render();
    },
    bgavshow: () => { const a = sv(); a.showF = !a.showF; pop = true; sfx(a.showF ? 'equip' : 'unequip'); host.save(); host.render(); },
    bgavmake: () => { sfx('open'); d.open('make'); },
    bgavset: el => {
      const k = el.dataset.k as keyof Look, v = Number(el.dataset.v);
      if (!(k in LOOK_MAX) || !(v >= 0 && v < LOOK_MAX[k])) return;
      sv().look[k] = v; pop = true; sfx('tap'); host.save(); host.render();
    },
    bgavrand: () => { sv().look = randomLook((Date.now() ^ 0x9e3779b9) >>> 0); pop = true; sfx('tap'); host.save(); host.render(); },
    bgavdone: () => { const a = sv(); const first = !a.made; a.made = true; sfx('equip'); host.save(); if (first) host.toast('🎨 Xong! Nhân vật của bạn đã ra phố.'); d.open('me'); },
  };

  return {
    acts, enter, reset, body, svg,
    made: (): boolean => peek().made,
    // Số ô vừa lên bậc chưa xem (chấm đỏ ở Túi chữ, dòng tin ở sảnh).
    pending: (): Slot[] => fresh(peek(), gear()),
    power: (): number => power(d.rows()),
    news: (): string[] => fresh(peek(), gear()).map(s => { const g = gear().find(r => r.slot === s)!; return `✨ ${itemVi(s, g.lv)} vừa lên bậc`; }),
  };
}
export type Hero = ReturnType<typeof makeHero>;
