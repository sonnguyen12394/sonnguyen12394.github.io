// v133 Chiến Binh Chữ, mốc 1: điều khiển trận + ô Vũ khí (fight.ts luật trận, cb.ts rèn / tinh hoa, fightview.ts vẽ).
// v134: trận kiểu Chaos Orbit (thời gian thực); thêm chọn nhân vật (ngang sức), thành tích, kỷ lục; ô Giày / Bùa có tác dụng.
// main.ts tạo một lần: acts (nút data-e), forms, onEv (đọc kết quả mỗi lần ingest để cộng tinh hoa), bar() cho sảnh, view() cho route 'cb'.
// Trận KHÔNG gọi ingest và không đụng sổ bằng chứng (P13): mô-đun này không nhận hàm ingest.

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import type { ECtx } from './views.ts';
import type { StatRow } from './bag.ts';
import type { Observation, EvEvent } from './ev/types.ts';
import { tierOf } from './avatar.ts';
import { FIGHTS, newFight, fightById, edgeOf, type Fight, type FightDef, type Gear } from './fight.ts';
import { openFight, type FightHandle } from './fightview.ts';
import { ACH, CHARS, CHAR_IDS, charOpen, isChar, type CharId } from './fightmeta.ts';
import {
  ensureCb, freshCb, essOf, addEss, wornW, canForge, forge, nextFight, unlocked, reward, logFight, addFb, tipOf, loseAdvice, fightStats, fbText, addRun, pickChar,
  W_COST, W_MAX, W_VI, FORGE_VI, type CbSave, type Forge,
} from './cb.ts';
import { sfx, toggleMusic } from './sfx.ts';

export interface FcDeps {
  host: EHost; E: () => EState;
  rows: () => StatRow[];                    // chỉ số thật (bag.ts statsOf)
  vocPass: () => number;                    // số kỹ năng từ vựng đang vững (để nói còn thiếu bao nhiêu)
  lvAt: number[];                           // bag.ts LV_AT
  wallet: () => number;                     // xu (thô) còn tiêu được
  heroSvg: (size: number, w: number) => string;   // chibi cầm Vũ khí bậc w
  garden: () => number; last: () => string; dirGame: () => string | undefined;
  start: (act: string) => void;             // mở lò (nút bắt đầu của game cũ)
  coins: (n: number) => void;               // cộng xu (thô) khi thắng
  ver: string;
}

export function makeFight(d: FcDeps) {
  const { host } = d, esc = host.esc;
  const sv = (): CbSave => ensureCb(d.E().cb ||= freshCb());
  const peek = (): CbSave => (d.E().cb ? ensureCb(d.E().cb!) : freshCb());
  const lvOf = (id: string) => d.rows().find(r => r.id === id)?.lv ?? 0;
  const vocLv = () => lvOf('voc');
  const worn = () => wornW(peek(), vocLv());
  const gear = (): Gear => ({ w: worn(), giap: tierOf(lvOf('gra')), khien: tierOf(lvOf('lis')), giay: tierOf(lvOf('pro')), bua: tierOf(lvOf('spk')) });
  const vocLeft = (lv: number) => Math.max(0, (d.lvAt[Math.max(0, lv - 1)] ?? 0) - d.vocPass());
  const tip = () => tipOf({ s: peek(), vocLv: vocLv(), vocLeft: vocLeft(Math.min(W_MAX, peek().w + 1)), coins: d.wallet(), garden: d.garden(), last: d.last(), dirGame: d.dirGame() });

  // ---------- Một trận ----------
  let f: Fight | null = null, view: FightHandle | null = null, t0 = 0, t1 = 0, logged = false, star = 0;
  function begin(def: FightDef): void {
    const s = sv(); if (!unlocked(s, def.id)) { host.toast('Thắng trận trước để mở trận này.'); return; }
    stop(false);
    const ch = isChar(s.ch) && charOpen(s.ch, s.best) ? s.ch : 'orbiter';
    f = newFight(def, gear(), (Date.now() ^ (s.log.length * 2654435761)) >>> 0, ch, true);
    t0 = Date.now(); t1 = 0; logged = false;
    if (typeof document === 'undefined') return;
    view = openFight({
      f: () => f, hero: d.heroSvg(120, gear().w), pos: s.pos,
      onMove: () => { if (!t1) t1 = Date.now(); },
      onOver: () => finish(),
      onPos: p => { sv().pos = p; host.save(); },
    });
    view.banner(`${CHARS[ch].ic} ${CHARS[ch].vi} · ${def.tip}`, 5200);
    // Móc cho test e2e: kết thúc trận ngay (thắng / thua) để kiểm màn kết mà không phải chơi hết.
    const root = document.getElementById('whfx') as (HTMLElement & { _end?: (r: 'win' | 'lose') => void }) | null;
    if (root) root._end = r => { if (!f || f.over) return; f.over = r; f.why = r === 'lose' ? 'dead' : ''; if (r === 'lose') f.p.hp = 0; finish(); };
    sfx('open');
  }
  function record(r: 'w' | 'l' | 'q'): void {
    if (!f || logged) return; logged = true;
    const s = sv();
    // n = số quái hạ; acc = phần máu còn lại (0–1); t1 = giây tới lần chạy đầu.
    logFight(s, { d: host.today(), id: f.def.id, w: f.gear.w, need: f.def.need, r, n: Math.min(999, f.kills), acc: Math.round(Math.max(0, f.p.hp / f.p.maxHp) * 100) / 100, t1: t1 ? Math.round((t1 - t0) / 1000) : 0, sec: Math.round((Date.now() - t0) / 1000) });
    host.save();
  }
  let lastWin = 0, lastGold = 0, newAch: string[] = [], newChars: CharId[] = [];
  function finish(): void {
    if (!f || logged) return;
    const s = sv(), def = f.def, win = f.over === 'win';
    // Xu nhặt trong trận cũng là nguyên liệu thô (không vượt thưởng thắng của trận, để không cày trận dễ thay học).
    lastWin = win ? reward(s, def) : 0; lastGold = Math.min(def.coins, f.gold);
    if (lastWin + lastGold) d.coins(lastWin + lastGold);
    if (win && !s.clr.includes(def.id)) s.clr.push(def.id);
    const before = CHAR_IDS.filter(c => charOpen(c, s.best));
    newAch = addRun(s, { id: def.id, win, t: f.t, kills: f.kills, combo: f.combo.best, evos: f.evos, boss: !!def.boss });
    newChars = CHAR_IDS.filter(c => charOpen(c, s.best) && !before.includes(c));
    record(win ? 'w' : 'l');
    view?.end(endHtml());
  }
  function stop(log: boolean): void {
    if (log && f && !f.over) record('q');
    view?.close(); view = null;
  }
  function endHtml(): string {
    if (!f) return '';
    const def = f.def, s = peek(), mm = Math.floor(f.t / 60), ss = String(Math.floor(f.t % 60)).padStart(2, '0');
    const stat = `<p class="cbstat">Sống ${mm}:${ss} · cấp ${f.p.level} · hạ ${f.kills} quái · combo ×${f.combo.best} · gây ${Math.round(f.dealt)} sát thương</p>`;
    const unlock = [...newAch.map(id => { const a = ACH.find(x => x.id === id)!; return `${a.ic} ${a.vi}`; }), ...newChars.map(c => `${CHARS[c].ic} mở nhân vật ${CHARS[c].vi}`)];
    const un = unlock.length ? `<p class="cbtip">🏅 ${unlock.map(esc).join(' · ')}</p>` : '';
    const fbBtn = '<button class="whb wide" data-e="cbfbopen">💬 Góp ý</button>', home = '<button class="whb wide" data-e="cbhome">Về sảnh</button>';
    const coins = lastWin + lastGold ? `<p>+${lastWin + lastGold} 🪙 xu (thô để rèn)${lastGold ? ` · nhặt ${lastGold}` : ''}</p>` : '';
    if (f.over === 'win') {
      const nx = nextFight(s), more = nx.id !== def.id && unlocked(s, nx.id);
      return `<p class="cbtitle">🏆 Thắng ${esc(def.vi)}!</p>${coins}${stat}${un}
        <div class="whrow">${more ? `<button class="whbig" data-e="cbnext" data-id="${nx.id}">▶ Trận tiếp: ${esc(nx.vi)}</button>` : `<button class="whbig" data-e="cbagain">⚔️ Đánh lại</button>`}${fbBtn}${home}</div>`;
    }
    const adv = loseAdvice(def, f.gear.w, s, d.wallet(), vocLv()), t = tip();
    const why = f.why === 'time' ? `Hết ${def.boss?.lim ?? 0} giây mà ${esc(def.boss?.vi ?? '')} vẫn đứng.` : 'Bạn đã hết máu.';
    const main = adv.act === 'forge' ? `<button class="whbig" data-e="cbforge">🔨 Rèn Vũ khí bậc ${s.w + 1} ngay</button>`
      : adv.act === 'lo' ? `<button class="whbig" data-e="cblo" data-g="${t.forge}">🔨 Rèn Vũ khí: vào ${FORGE_VI[t.forge].ico} ${esc(FORGE_VI[t.forge].vi)}</button>`
      : '<button class="whbig" data-e="cbagain">⚔️ Đánh lại</button>';
    return `<p class="cbtitle">💥 Thua ${esc(def.vi)}</p><p>${why}</p><p class="cbadv">${esc(adv.text)}</p>${adv.gap ? `<p class="cbtip">🔨 Thợ rèn: ${esc(t.why)}</p>` : ''}${coins}${stat}${un}
      <div class="whrow">${main}${adv.gap ? '<button class="whb wide" data-e="cbagain">⚔️ Đánh lại</button>' : ''}${fbBtn}${home}</div>`;
  }
  function openLo(game: Forge): void {
    const s = sv(); s.tip = { day: host.today(), game }; host.save();
    stop(true); sfx('open'); d.start(FORGE_VI[game].start);
  }
  function doForge(): void {
    const s = sv(), c = canForge(s, d.wallet());
    if (!c.ok) { sfx('nope'); host.toast(c.why === 'max' ? 'Vũ khí đã ở bậc cao nhất của khu 1.' : c.why === 'ess' ? `Còn thiếu ${c.lack} tinh hoa: trả lời đúng ở lò để có thêm.` : `Còn thiếu ${c.lack} xu: thắng trận để có thêm.`); return; }
    forge(s, d.wallet()); sfx('tierup'); host.save();
    const w = worn();
    host.toast(w >= s.w ? `🔨 Rèn xong ${W_VI[s.w]} (bậc ${s.w})! Đã mặc vào.` : `🔨 Rèn xong ${W_VI[s.w]} (bậc ${s.w}). Cần Từ vựng Lv ${s.w} mới mặc được (đang Lv ${vocLv()}).`);
    stop(true); host.go('cb');
  }

  // ---------- Tinh hoa (đọc kết quả của ingest; không đổi bằng chứng) ----------
  function onEv(o: Observation, ev: EvEvent | null): void {
    if (!ev) return;
    const s = d.E().cb, v = essOf({ node: o.node, ok: !!o.ok, ctx: o.ctx, hint: o.hint, nov: ev.nov === 1, day: host.today() }, s?.tip ?? null);
    if (!v) return;
    const cb = sv(), need = cb.w < W_MAX ? W_COST[cb.w + 1]!.ess : Infinity, before = cb.ess;
    const add = addEss(cb, v, host.today());
    if (add && before < need && cb.ess >= need) host.toast(`🔨 Đủ tinh hoa rèn Vũ khí bậc ${cb.w + 1}! Về sảnh bấm Thợ rèn.`);
  }

  // ---------- Sảnh: khối Chiến Binh (nút chính duy nhất: ⚔️). Thợ rèn gọn một dòng (lý do đầy đủ ở title + trang Chiến Binh) để sảnh vừa ~một màn. ----------
  function bar(): string {
    const s = peek(), nx = nextFight(s), w = worn(), t = tip();
    const label = nx.boss ? 'Đánh boss' : 'Vào trận';
    const sub = `${esc(nx.vi)} · cần Vũ khí bậc ${nx.need} · bạn bậc ${w}`;
    const smith = t.ready ? `<button class="btn cbsmith" data-e="cbforge" title="${esc(t.why)}"><span aria-hidden="true">🔨</span><span class="cbsl"><b>Rèn Vũ khí bậc ${s.w + 1} ngay</b><span class="hint">${esc(t.why)}</span></span></button>`
      : `<button class="btn cbsmith" data-e="cblo" data-g="${t.forge}" title="${esc(t.why)}"><span aria-hidden="true">🔨</span><span class="cbsl"><b>Thợ rèn gợi ý: ${FORGE_VI[t.forge].ico} ${esc(FORGE_VI[t.forge].vi)}</b><span class="hint">${esc(t.why)}</span></span></button>`;
    return `<div class="cbbar stack"><button class="btn primary big cbgo" data-e="cbgo" data-id="${nx.id}">⚔️ ${label}: ${esc(nx.vi)}<small>${sub}</small></button>
      <div class="cbrow">${smith}<button class="btn cblink" data-e="go" data-r="cb" aria-label="Chiến Binh: Vũ khí ${esc(W_VI[w])}, ${s.ess} tinh hoa"><span aria-hidden="true">🗡️</span><small>✨ ${s.ess}</small></button></div></div>`;
  }

  // ---------- Route 'cb': Vũ khí, trận, ô khác, số liệu, góp ý ----------
  function viewCb(c: ECtx): string {
    const s = peek(), w = worn(), next = Math.min(W_MAX, s.w + 1), cost = W_COST[next]!, vl = vocLv(), coins = d.wallet(), t = tip();
    const can = canForge(s, coins), max = s.w >= W_MAX;
    const bar = (v: number, n: number) => `<span class="cbpb" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${Math.min(v, n)}"><i style="width:${Math.min(100, Math.round((v / Math.max(1, n)) * 100))}%"></i></span>`;
    const req = (ok: boolean, txt: string) => `<li class="${ok ? 'ok' : ''}">${ok ? '✅' : '⬜'} ${txt}</li>`;
    const forgeBox = max ? '<p class="hint">Vũ khí đã tới bậc cao nhất của khu 1 (mốc sau mở bậc 4–5: cần câu ở ngữ cảnh mới).</p>' : `
      <p><b>Rèn bậc ${next}: ${esc(W_VI[next])}</b> · sát thương lưỡi ×${(1.32 ** next / 1.32 ** s.w).toFixed(2).replace('.', ',')} so với bậc ${s.w} (ở trận cần đúng bậc này: ×${(edgeOf({ need: next }, { w: next }) / edgeOf({ need: next }, { w: s.w })).toFixed(2).replace('.', ',')})</p>
      <ul class="cbreq">${req(s.ess >= cost.ess, `✨ Tinh hoa ${s.ess}/${cost.ess} ${bar(s.ess, cost.ess)}`)}${req(coins >= cost.coins, `🪙 Xu ${coins}/${cost.coins}`)}
        ${req(vl >= next, `📚 Từ vựng Lv ${vl}/${next} để mặc${vl >= next ? '' : ` (còn ${vocLeft(next)} kỹ năng vững nữa)`}`)}</ul>
      <div class="row"><button class="btn${can.ok ? ' primary' : ''}" data-e="cbforge"${can.ok ? '' : ' aria-disabled="true"'}>🔨 Rèn bậc ${next}</button><button class="btn" data-e="cblo" data-g="${t.forge}">${FORGE_VI[t.forge].ico} Vào lò: ${esc(FORGE_VI[t.forge].vi)}</button></div>
      <p class="hint">🔨 Thợ rèn: ${esc(t.why)}</p>`;
    const fights = FIGHTS.map(x => {
      const ok = unlocked(s, x.id), won = s.clr.includes(x.id);
      return `<li class="cbfrow"><span class="stack" style="gap:1px"><b>${won ? '✅' : ok ? '⚔️' : '🔒'} ${esc(x.vi)}</b><span class="hint">${esc(x.sub)} · cần Vũ khí bậc ${x.need}${w < x.need ? ` (bạn bậc ${w})` : ''}</span></span>
        ${ok ? `<button class="btn small${x.id === nextFight(s).id ? ' primary' : ''}" data-e="cbgo" data-id="${x.id}">${won ? 'Đánh lại' : 'Vào trận'}</button>` : '<span class="hint">thắng trận trước</span>'}</li>`;
    }).join('');
    const g = gear(), other = [
      ['🛡️ Giáp', 'Ngữ pháp', `bậc ${g.giap}: nhận ít hơn ${Math.round((1 - 0.97 ** g.giap) * 100)}% sát thương`],
      ['🔰 Khiên', 'Nghe', `bậc ${g.khien}: Sóng rè của boss yếu hơn ${Math.round(g.khien * 6)}%`],
      ['👢 Giày', 'Phát âm', `bậc ${g.giay ?? 0}: chạy nhanh hơn ${(g.giay ?? 0) * 3}%, DASH hồi nhanh hơn ${(g.giay ?? 0) * 5}%`],
      ['📿 Bùa', 'Nói', `bậc ${g.bua ?? 0}: Tuyệt kỹ sạc nhanh hơn ${(g.bua ?? 0) * 8}%`],
      ['🎩 Mũ', 'Đọc', 'chưa có tác dụng (mốc 2)'], ['💍 Nhẫn', 'Viết', 'chưa có tác dụng (mốc 2)'],
    ].map(([a, b, e]) => `<li><b>${a}</b> <span class="hint">(${b})</span>: ${e}</li>`).join('');
    const cur = isChar(s.ch) && charOpen(s.ch, s.best) ? s.ch : 'orbiter';
    const chars = CHAR_IDS.map(id => {
      const c = CHARS[id], open = charOpen(id, s.best), on = id === cur;
      return `<li class="cbch${on ? ' on' : ''}${open ? '' : ' lock'}"><span class="stack" style="gap:1px"><b>${c.ic} ${esc(c.vi)}${on ? ' ✓' : ''}</b><span class="hint">▲ ${esc(c.pro)} · ▼ ${esc(c.con)}</span>${open ? '' : `<span class="hint">🔒 ${esc(c.reqTxt ?? '')}</span>`}</span>
        ${open && !on ? `<button class="btn small" data-e="cbch" data-id="${id}">Chọn</button>` : ''}</li>`;
    }).join('');
    const achs = ACH.map(a => `<li class="${s.ach.includes(a.id) ? 'ok' : ''}">${s.ach.includes(a.id) ? a.ic : '🔒'} <b>${esc(a.vi)}</b> <span class="hint">${esc(a.d)}</span></li>`).join('');
    const st = fightStats(s.log);
    const stats = st.n ? `<p>${st.n} trận · thắng ${st.win} · bỏ giữa ${st.quit} · chơi tiếp ${st.again}${st.t1 !== null ? ` · giây tới lần chạy đầu (trung vị) ${st.t1}` : ''}</p>
      <ul class="cbside">${st.bySide.map(b => `<li>Chênh bậc ${b.d >= 0 ? '+' : ''}${b.d}: thắng ${b.win}/${b.n}</li>`).join('')}</ul>` : '<p class="hint">Chưa có trận nào.</p>';
    return `<section class="stack cbpage"><div class="row"><button class="btn ghost" data-e="go" data-r="quest">← Sảnh</button></div>
      <span class="eyebrow">Chiến Binh Chữ · khu 1</span><h1>⚔️ Chiến Binh</h1>
      <div class="cbhero"><span aria-hidden="true">${d.heroSvg(110, w)}</span><div class="stack" style="gap:4px"><b>🗡️ Vũ khí: ${esc(W_VI[w])} (bậc ${w})</b>
        <span class="hint">Đã rèn bậc ${s.w}${s.w > w ? ` · đang mặc bậc ${w} vì Từ vựng mới Lv ${vl}` : ''}. Vũ khí quyết định phần lớn sát thương; tay né và cách chọn nâng cấp phần còn lại.</span>
        <span class="hint">✨ Tinh hoa chỉ có khi trả lời đúng ở lò (Vườn từ, Vòng Chữ, Mỏ Chữ, Lò rèn). Không mua được.</span></div></div>
      <section class="panel stack" aria-labelledby="cb-forge"><h2 id="cb-forge">🔨 Lò rèn Vũ khí</h2>${forgeBox}</section>
      <section class="panel stack" aria-labelledby="cb-fights"><h2 id="cb-fights">🗺️ Trận khu 1</h2><ul class="cbflist">${fights}</ul></section>
      <section class="panel stack" aria-labelledby="cb-ch"><h2 id="cb-ch">🧑‍🚀 Nhân vật</h2><p class="hint">Mỗi nhân vật một lối chơi, không ai mạnh hơn tổng thể. Mở bằng việc làm trong trận.</p><ul class="cbchars">${chars}</ul></section>
      <details class="panel"><summary>Các ô đồ khác (lấy bậc từ chỉ số thật)</summary><ul class="cbother">${other}</ul></details>
      <details class="panel"><summary>🏅 Thành tích ${s.ach.length}/${ACH.length}</summary><ul class="cbach">${achs}</ul></details>
      <section class="panel stack" aria-labelledby="cb-stats"><h2 id="cb-stats">📊 Số liệu trận</h2>${stats}</section>
      <section class="panel stack" aria-labelledby="cb-fb"><h2 id="cb-fb">💬 Góp ý nhanh</h2>
        <form class="stack" data-eform="cbfb2"><label>Chấm <select name="s">${[5, 4, 3, 2, 1].map(i => `<option value="${i}">${'★'.repeat(i)}</option>`).join('')}</select></label>
          <input name="t" maxlength="200" placeholder="Một dòng: vui ở đâu, chán ở đâu?" aria-label="Một dòng góp ý"><div class="row"><button class="btn" type="submit">Lưu góp ý</button>
          <button class="btn" type="button" data-e="cbsend">📤 Gửi cho nhà làm game (${s.fb.length})</button></div></form></section>
      <p class="hint">Bản thử v134 (trận kiểu Chaos Orbit): chưa người thật kiểm. Số liệu chỉ ở máy này.</p></section>`;
  }

  const acts: Record<string, (el: HTMLElement) => void> = {
    cbgo: el => { const def = fightById(el.dataset.id ?? '') ?? nextFight(peek()); begin(def); },
    cbagain: () => { const s = sv(), l = s.log[s.log.length - 1]; if (l) l.again = 1; const def = f?.def ?? nextFight(s); begin(def); },
    cbnext: el => { const s = sv(), l = s.log[s.log.length - 1]; if (l) l.again = 1; begin(fightById(el.dataset.id ?? '') ?? nextFight(s)); },
    cbexit: () => { stop(true); host.render(); },
    cbhome: () => { stop(true); host.go('quest'); },
    cbch: el => { const id = el.dataset.id ?? '', s = sv(); if (!isChar(id) || !charOpen(id, s.best) || !pickChar(s, id)) return; sfx('equip'); host.save(); host.render(); },
    cbmusic: () => { toggleMusic(); view?.music(); view?.refresh(); sfx('tap'); },
    cbfbopen: () => { star = 0; view?.fb(true); },
    cbfbclose: () => view?.fb(false),
    cbstar: el => {
      star = Math.max(1, Math.min(5, Number(el.dataset.s) || 0)); sfx('tap');
      const box = el.closest('form'); if (!box) return;
      (box.elements.namedItem('s') as HTMLInputElement).value = String(star);
      box.querySelectorAll<HTMLElement>('.cbst').forEach((b, i) => { b.textContent = i < star ? '★' : '☆'; b.setAttribute('aria-checked', String(i + 1 === star)); });
    },
    cbforge: () => doForge(),
    cblo: el => { const g = (el.dataset.g as Forge) in FORGE_VI ? (el.dataset.g as Forge) : tip().forge; openLo(g); },
    cbsend: () => { const txt = fbText(peek(), d.ver); if (host.share) host.share(txt); else { try { void navigator.clipboard?.writeText(txt); host.toast('Đã sao chép góp ý.'); } catch { host.toast('Không sao chép được.'); } } },
  };
  const forms: Record<string, (el: HTMLFormElement) => void> = {
    cbfb: el => {
      const fd = new FormData(el), s = Number(fd.get('s')) || 0, t = String(fd.get('t') ?? '').trim();
      if (!s) { host.toast('Chạm một ngôi sao (1–5) trước.'); return; }
      addFb(sv(), { d: host.today(), at: 'fight', id: f?.def.id ?? 'k1-l1', s, t }); host.save(); view?.fb(false); host.toast('💬 Cảm ơn! Đã lưu góp ý.');
    },
    cbfb2: el => {
      const fd = new FormData(el), s = Number(fd.get('s')) || 5, t = String(fd.get('t') ?? '').trim();
      addFb(sv(), { d: host.today(), at: 'forge', id: 'cb', s, t }); host.save(); host.toast('💬 Cảm ơn! Đã lưu góp ý.'); host.render();
    },
  };
  return {
    acts, forms, onEv, bar, view: viewCb,
    open: (): boolean => !!view, close: () => stop(true),
    peek: () => f,
    worn,
    spent: (): number => d.E().cb?.spent ?? 0,
  };
}
export type FightCtl = ReturnType<typeof makeFight>;
