// v128 Điều khiển Túi chữ · Xưởng của Tí · Chỉ số (bag.ts, bagview.ts). main.ts tạo một lần (makeBag) và nối: body, hub, acts, forms,
// perk (hiệu ứng trang bị cho game). Chế tạo không ghi bằng chứng; lượt tự nói / tự gõ cả câu ghi nhật ký H (như game nói).

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import type { ECtx } from './views.ts';
import type { HKind } from './hmeter.ts';
import { sfx } from './sfx.ts';
import {
  freshBag, earned, have, canPay, pay, gemsOf, albumsOf, claimAlbum, statsOf, reqOk, charLv, GEAR, CRAFT_COST,
  morphTask, morphPick, typedOk, colTask, colPick, sentTask, sentOk, soulOk, type BagSave, type Earned, type StatRow, type Perk, type StatIn,
} from './bag.ts';
import { viewBag, viewBagHub, type BagTab, type CraftRun } from './bagview.ts';
import { cluesOf, CHAPTERS, type StorySave } from './story.ts';
import { makeForge, type ForgeDeps } from './forgectl.ts';
import { makeHero, type HeroTab } from './heroctl.ts';

export interface BagDeps {
  host: EHost;
  E: () => EState;
  act: () => number;                                  // khu truyện hiện tại (mở linh kiện, đồ)
  resident: () => [string, string] | null;            // cư dân cần giúp của chương
  giftDone: () => boolean;
  gift: () => boolean;                                // đánh dấu việc phụ "tặng Lời" (true nếu lần đầu)
  statIn: () => StatIn;
  fading: () => Set<string>;                          // id từ đang mờ (sắp quên)
  hx: () => { sp: number; ty: number; recall: number };
  hlog: (k: HKind, v?: number | boolean) => void;
  wk: (kind: 'sentence' | 'word', n: number, game: string) => void;
  coins: (n: number) => void;
  wallet: () => number;                               // v132 ví xu chung (mua thời trang)
  forge: Omit<ForgeDeps, 'host' | 'E' | 'coins'>;   // v129 Lò rèn năng lực
}

export function makeBag(d: BagDeps) {
  const { host } = d;
  const sv = (): BagSave => { const e = d.E() as EState & { bg?: BagSave }; return (e.bg ||= freshBag()); };
  let tab: BagTab | null = null, cr: CraftRun | null = null, micN = 0, used = '';
  const fg = makeForge({ ...d.forge, host, E: d.E, coins: d.coins });
  const words = (): number => { const e = d.E(); return (e.gn?.words ?? 0) + (e.gh?.words ?? 0); };
  const ear = (): Earned => { const h = d.hx(); return earned({ words: words(), sp: h.sp, ty: h.ty, recall: h.recall }); };
  const rows = (): StatRow[] => statsOf(d.statIn());
  // v132 nhân vật: 7 ô trang bị theo chỉ số thật, thời trang, tạo nhân vật (heroctl.ts).
  const hero = makeHero({ host, E: d.E, rows, lv: () => charLv(rows()), wallet: d.wallet, open: (t: HeroTab) => { tab = t; if (t === 'me') hero.enter(); host.render(); window.scrollTo?.(0, 0); } });
  const toTab = (t: BagTab): void => { cr = null; fg.reset(); hero.reset(); tab = t; if (t === 'me') hero.enter(); };
  const seed = () => (Date.now() ^ (sv().mk * 2654435761)) >>> 0;
  const lex = () => host.lexicon?.() ?? [];
  const rec: Record<string, string[]> = {};   // đề vừa làm (tránh lặp ngay), chỉ trong phiên
  const recent = (k: string): string[] => rec[k] ?? [];
  const remember = (k: string, v: string) => { const r = (rec[k] ||= []); r.push(v); if (r.length > 6) r.shift(); };
  function reset(): void { tab = null; cr = null; fg.reset(); hero.reset(); }

  function start(kind: CraftRun['kind']): void {
    const e = ear(), s = sv();
    if (!canPay(e, s, CRAFT_COST[kind])) { host.toast('Chưa đủ ✨ Viên chữ: tìm thêm từ ở ⛏️ Mỏ Chữ hoặc 🎡 Vòng Chữ.'); return; }
    const sd = seed(), act = d.act(), gm = gemsOf(d.E().ev.led, d.E().gv?.plants), mine = new Set(lex().filter(w => gm.has(w.id)).map(w => w.en));
    micN++;
    cr = { kind, seed: sd, phase: kind === 'sent' ? 'order' : 'pick', sel: [], tries: 0, msg: '', ok: null, gold: false, via: null, key: `bg:${micN}`,
      ...(kind === 'morph' ? { morph: morphTask(act, sd, mine, recent('m')) } : kind === 'col' ? { col: colTask(act, sd, recent('c')) } : { sent: sentTask(act, sd, d.resident()?.[1], recent('s')) }) };
    tab = 'craft'; host.render(); window.scrollTo?.(0, 0);
  }
  // Thành công: trả nguyên liệu ở lúc này (làm sai không mất gì).
  function made(item: 'tu' | 'cum' | 'loi', label: string): boolean {
    const r = cr!, s = sv();
    if (!pay(ear(), s, CRAFT_COST[r.kind])) { r.ok = false; r.msg = 'Hết nguyên liệu giữa chừng.'; return false; }
    s.it[item]++; s.mk++; s.day = host.today();
    r.ok = true; r.msg = label; sfx('clear');
    return true;
  }
  function soul(text: string, via: 'mic' | 'type'): void {
    const r = cr; if (!r?.sent || r.phase !== 'soul') return;
    const ok = soulOk(r.sent.en, text, via);
    if (text.split(/\s+/).filter(Boolean).length >= 3) d.hlog(via === 'mic' ? 'sp' : 'ty');
    r.tries++;
    if (ok) { const s = sv(); s.it.loi = Math.max(0, s.it.loi - 1); s.it.loiv++; r.gold = true; r.via = via; r.phase = 'done'; r.ok = true; r.msg = via === 'mic' ? '🌟 Máy nghe rõ câu của bạn: Lời vàng!' : '🌟 Gõ lại đúng cả câu mà không nhìn: Lời vàng!'; sfx('clear'); }
    else { r.ok = false; r.msg = via === 'mic' ? `Máy nghe ra: “${text}”. Thử lại nhé (nói sai cũng không mất gì).` : 'Chưa khớp hết câu. Thử lại, hoặc giữ 💬 Lời thường.'; sfx('place'); }
    host.save(); host.render();
  }

  const acts: Record<string, (el: HTMLElement) => void> = {
    ...hero.acts,
    bgopen: el => { toTab((el.dataset.t as BagTab) || 'me'); host.render(); window.scrollTo?.(0, 0); },
    bgcraft: () => { cr = null; tab = 'craft'; host.render(); window.scrollTo?.(0, 0); },
    bgtab: el => { toTab((el.dataset.t as BagTab) || 'bag'); host.render(); },
    ...Object.fromEntries(Object.entries(fg.acts).map(([k, f]) => [k, (el: HTMLElement) => { if (k === 'bgfgo') { cr = null; tab = 'forge'; } f(el); }])),
    bgdone: () => { cr = null; tab = 'craft'; host.render(); },
    bgmk: el => start((el.dataset.k as CraftRun['kind']) || 'morph'),
    bgaff: el => {
      const r = cr; if (!r?.morph || r.phase !== 'pick') return;
      const v = morphPick(r.morph, el.dataset.v ?? '');
      if (v.ok) { r.phase = 'type'; r.msg = ''; sfx('ok'); } else { r.ok = false; r.msg = `💥 ${v.why}`; sfx('bad'); }
      host.render();
    },
    bgverb: el => {
      const r = cr; if (!r?.col || r.phase !== 'pick') return;
      const v = colPick(r.col, el.dataset.v ?? '');
      if (v.ok) { if (made('cum', `🔗 Xong cụm “${r.col.verb} ${r.col.rest}”.${v.why ? ' ' + v.why : ''}`)) { remember('c', `${r.col.verb} ${r.col.rest}`); r.phase = 'done'; } }
      else { r.tries++; r.ok = false; r.msg = `💥 ${v.why}`; sfx('bad'); if (r.tries >= 2) { r.phase = 'done'; r.msg = `Cụm đúng là “${r.col.verb} ${r.col.rest}”. Ghi nhớ rồi làm cụm khác nhé (không mất nguyên liệu).`; } }
      host.save(); host.render();
    },
    bgtile: el => {
      const r = cr; if (!r?.sent || r.phase !== 'order') return;
      const i = Number(el.dataset.i); if (!(i >= 0 && i < r.sent.tiles.length) || r.sel.includes(i)) return;
      r.sel.push(i); r.msg = '';
      if (r.sel.length === r.sent.tiles.length) {
        if (sentOk(r.sent, r.sel)) {
          if (made('loi', `💬 Đúc xong Lời của ${r.sent.who}.`)) { remember('s', r.sent.en); r.phase = 'soul'; d.wk('sentence', 1, 'craft'); }
        } else { r.tries++; r.ok = false; r.msg = 'Chưa đúng thứ tự. Bỏ lá cuối và thử lại (không mất gì).'; sfx('bad'); }
      }
      host.save(); host.render();
    },
    bgundo: () => { const r = cr; if (!r?.sent || r.phase !== 'order') return; r.sel.pop(); r.msg = ''; host.render(); },
    bgskip: () => { const r = cr; if (!r?.sent || r.phase !== 'soul') return; r.phase = 'done'; r.msg = 'Giữ 💬 Lời thường. Lần sau thử thổi hồn để có 🌟.'; host.render(); },
    bgmic: () => { const r = cr; if (!r?.sent || r.phase !== 'soul') return; micN++; r.key = `bg:${micN}`; host.asrHear?.(r.key); host.render(); },
    bgforge: el => {
      const g = GEAR.find(x => x.id === el.dataset.id), s = sv(); if (!g || s.gear.includes(g.id)) return;
      if ((g.act ?? 0) > d.act() || (g.after && !s.gear.includes(g.after))) { host.toast('Trang bị này chưa mở.'); return; }
      if (!pay(ear(), s, g.cost)) { host.toast('Chưa đủ nguyên liệu hoặc đồ.'); return; }
      s.gear.push(g.id); s.day = host.today(); sfx('clear'); host.cheer?.(true);
      host.toast(reqOk(g, rows()) ? `🔥 Rèn xong ${g.vi}: đang phát huy!` : `🔥 Rèn xong ${g.vi}. Phát huy khi chỉ số thật đủ.`);
      host.save(); host.render();
    },
    bgclaim: el => {
      const node = el.dataset.n ?? '', gems = gemsOf(d.E().ev.led, d.E().gv?.plants), a = albumsOf(lex(), gems, sv().alb).find(x => x.node === node); if (!a) return;
      const coins = claimAlbum(sv(), a); if (!coins) return;
      d.coins(coins); sfx('clear'); host.toast(`${a.tier === 2 ? '🏆' : '⭐'} Album: +${coins} xu`); host.save(); host.render();
    },
    bggift: () => {
      const s = sv(), who = d.resident(); if (!who) return;
      if (d.giftDone()) { host.toast(`${who[1]} đã nhận Lời của bạn ở chương này.`); return; }
      const k = s.it.loiv > 0 ? 'loiv' : s.it.loi > 0 ? 'loi' : null; if (!k) { host.toast('Chưa có 💬 Lời: đúc một câu ở Xưởng trước.'); return; }
      s.it[k]--;
      if (d.gift()) d.coins(10);
      sfx('clear'); host.toast(`🎁 ${who[1]}: “Thank you! ${k === 'loiv' ? 'What a lovely voice!' : 'I love it!'}” +10 xu`);
      host.save(); host.render();
    },
  };
  const val = (f: HTMLFormElement): string => { const i = f.querySelector('input'), v = String(i?.value ?? '').trim(); if (i) i.value = ''; return v; };
  const forms: Record<string, (f: HTMLFormElement) => void> = {
    bgtype: f => {
      const r = cr, v = val(f); if (!r?.morph || r.phase !== 'type' || !v) return;
      if (typedOk(r.morph.out, v)) { if (made('tu', `🔩 Ghép xong “${r.morph.out}”!`)) { const s = sv(); s.words = [...s.words.filter(w => w !== r.morph!.out), r.morph.out].slice(-40); remember('m', r.morph.out); r.phase = 'done'; } }
      else { r.tries++; r.ok = false; sfx('bad'); r.msg = r.tries >= 2 ? `Từ đúng là “${r.morph.out}”. Không mất nguyên liệu; làm từ khác nhé.` : `“${v}” chưa đúng chính tả. Thử lại một lần nữa.`; if (r.tries >= 2) r.phase = 'done'; }
      host.save(); host.render();
    },
    bgsoul: f => { const v = val(f); if (v) soul(v, 'type'); },
    ...fg.forms,
  };
  function mic(): { has: boolean; busy: boolean | string; heard: string | null } {
    const has = !!host.hasAsr?.(), r = cr;
    if (!has || !r?.sent || r.phase !== 'soul') return { has, busy: false, heard: null };
    const h = host.asrHeard?.(r.key) ?? null, busy = host.asrBusy?.(r.key) ?? false;
    if (h && used !== r.key) { used = r.key; const alts = [h.heard, ...h.alts].filter(Boolean); const best = alts.find(a => soulOk(r.sent!.en, a, 'mic')) ?? alts[0] ?? ''; setTimeout(() => soul(best, 'mic'), 0); }
    return { has, busy, heard: h?.heard ?? null };
  }

  // Số món làm được ngay: công thức ở Xưởng đủ nguyên liệu + trang bị mở được và đủ nguyên liệu.
  const readyOf = (s: BagSave, e: Earned): number => (['morph', 'col', 'sent'] as const).filter(k => canPay(e, s, CRAFT_COST[k])).length + GEAR.filter(g => !s.gear.includes(g.id) && (g.act ?? 0) <= d.act() && (!g.after || s.gear.includes(g.after)) && canPay(e, s, g.cost)).length;
  return {
    acts, forms, reset, hero,
    open(): boolean { return tab !== null; },
    // Hiệu ứng trang bị đang phát huy (sở hữu + chỉ số thật đủ). moves: cộng; pat, vcoin: nhân (mặc định 1); wcoin: cộng.
    perk(p: Perk): number {
      const s = (d.E() as EState & { bg?: BagSave }).bg; if (!s?.gear.length) return p === 'pat' || p === 'vcoin' ? 1 : 0;
      const rs = rows(), on = GEAR.filter(g => s.gear.includes(g.id) && g.perk[0] === p && reqOk(g, rs)).map(g => g.perk[1]);
      return on.length ? Math.max(...on) : p === 'pat' || p === 'vcoin' ? 1 : 0;
    },
    body(c: ECtx): string | null {
      if (!tab) return null;
      const e = d.E(), s = sv(), gm = gemsOf(e.ev.led, e.gv?.plants), fade = d.fading(), lx = lex(), by = new Map(lx.map(w => [w.id, w]));
      const gems = [...gm.values()].filter(g => by.has(g.id)).map(g => ({ ...g, en: by.get(g.id)!.en, vi: by.get(g.id)!.vi, fading: fade.has(g.id) })).sort((a, b) => b.tier - a.tier || b.last - a.last);
      const albums = albumsOf(lx, gm, s.alb).map(a => ({ ...a, vi: host.group?.(a.node)?.vi ?? host.group?.(a.node)?.topic ?? a.node }));
      const sy = (e as EState & { sy?: StorySave }).sy;
      return viewBag(c, { s, e: ear(), rows: rows(), tab, act: d.act(), gems, albums, clues: cluesOf(sy), clueTotal: CHAPTERS.filter(x => x.clue).length, who: d.resident(), giftDone: d.giftDone(), cr, mic: mic(), forge: tab === 'forge' || tab === 'map' ? fg.body(c, tab) : '', hero: tab === 'me' || tab === 'look' || tab === 'make' ? hero.body(c, tab) : '' });
    },
    // v131 thanh tài nguyên + chấm đỏ: cấp Thợ Chữ và số món làm được ngay (cùng cách tính với thẻ ở sảnh).
    lv: (): number => charLv(rows()),
    ready(): number { const s = sv(), e = ear(); return readyOf(s, e); },
    hub(c: ECtx): string {
      const s = sv(), e = ear(), rs = rows();
      const ready = readyOf(s, e);
      return viewBagHub(c, s, e, rs, ready, fg.cov());
    },
    have: (k: Parameters<typeof have>[2]) => have(ear(), sv(), k),
    peek: () => (tab === 'forge' ? fg.peek() : null),
  };
}
