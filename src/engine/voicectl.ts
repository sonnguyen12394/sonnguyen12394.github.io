// v122–v127 Phố Chữ nói: điều khiển ván (Quán bằng giọng, Hỏi chuyện, Bến Cảng, Sương quay lại, Phố thật) + Bảng đo H.
// main.ts tạo một lần (makeVoice) và nối vào: activeGame, questBody, hành động data-e / biểu mẫu, peek cho bot, sảnh.
// Lời nói (máy nghe) là phản hồi + số đo H, không vào mức thuộc (quy định chung của app). Vào sổ bằng chứng chỉ khi: tự GÕ từ đã học ở
// biển hiệu (nhớ lại), tự GÕ câu có từ vừa đào được (dùng ở ngữ cảnh mới), nghe phân biệt cặp âm (như màn Âm).

import type { EHost } from './host.ts';
import type { EState } from './state.ts';
import type { ECtx } from './views.ts';
import type { Observation } from './ev/types.ts';
import type { Peek } from './main.ts';
import { sfx } from './sfx.ts';
import { ambStart, ambStop, type Amb } from './ambience.ts';
import { hAdd, hScore, type HKind } from './hmeter.ts';
import {
  freshVoice, pickConvs, pickOpts, turnCoins, thinkSec, usesWord, wcount, askMatch, isQuestion, pickCase, suspectOrder, portOrders, signsOf, signOk,
  realTask, weekOf as vWeek, type Conv, type Via, type VoiceSave, type SoundSet, type Fading,
} from './voice.ts';
import { viewTalk, viewTalkEnd, viewAsk, viewAskEnd, viewPort, viewPortEnd, viewSigns, viewSignsEnd, viewVoiceHub, viewHMeter, portKey, type TalkRun, type AskRun, type PortRun, type SignRun, type Mic } from './voiceview.ts';

export type VoiceGame = 'talk' | 'ask' | 'port' | 'signs';
export interface VoiceDeps {
  host: EHost;
  E: () => EState;
  lv: () => string;
  act: () => number;                                   // khu truyện đang ở (1 Chợ Sáng, 2 Bến Cảng, 3 Rừng Trúc; 0 mở đầu)
  ev: (o: Observation) => void;                       // ghi bằng chứng (ingest)
  coins: (n: number) => void;
  wk: (kind: 'sentence' | 'play' | 'word', n: number, game: string) => void;
  snap: (subj: string, dec: string, info: Record<string, number | string>) => void;
}
export interface VoiceHostX {   // móc của app.js dành cho Phố Chữ nói (khai báo tuỳ chọn trong EHost bằng ép kiểu: app cũ không có thì game ẩn)
  convs?(): Conv[];
  cvTurn?(id: string, node: string, text: string): { hit: boolean; next: string; reply: string; rp: string } | null;
  convSave?(id: string, log: Array<{ node: string; q: string; text: string; ms: number; words: number; hint: boolean; ok: string }>): { und: number; pass: boolean } | null;
  sayAs?(text: string, k: number, slow?: boolean): void;
  fading?(n: number): Fading[];
  wordRecall?(id: string, ok: boolean, typed: boolean): void;
  sounds?(): SoundSet[];
  ghints?(text: string): Array<{ why: string; snip: string }>;
  asrStop?(): void;
}

export function makeVoice(d: VoiceDeps) {
  const { host } = d, X = host as EHost & VoiceHostX;
  const sv = (): VoiceSave => { const e = d.E() as EState & { vo?: VoiceSave }; return (e.vo ||= freshVoice()); };
  const today = () => host.today();
  const hlog = (k: HKind, v: number | boolean = 1) => hAdd(sv().hx, today(), k, v);
  let talk: TalkRun | null = null, ask: AskRun | null = null, port: PortRun | null = null, sign: SignRun | null = null, hview = false;
  // Lượt nói: mỗi lần gửi tăng n → khoá máy nghe mới; heard đã dùng thì không gửi lại.
  let micN = 0, used = '';
  const micKey = (g: string) => `vo:${g}:${micN}`;
  const amb = (): Amb => (['market', 'market', 'harbor', 'forest'] as Amb[])[d.act()] ?? 'market';
  const say = (t: string, k = 0, slow = false) => { if (X.sayAs) X.sayAs(t, k, slow); else host.say?.(t); };

  function reset(): void { talk = ask = port = sign = null; hview = false; ambStop(); host.asrOff?.(); }
  const seed = () => (Date.now() ^ (d.E().ev.led.length * 2654435761)) >>> 0;
  const prod = (text: string, via: Via) => { if (via === 'pick') { hlog('ch'); return; } if (wcount(text) >= 3) hlog(via === 'mic' ? 'sp' : 'ty'); };

  // ---------- 🗣️ Quán bằng giọng ----------
  // Từ vừa tìm ở Mỏ Chữ / Vòng Chữ (14 ngày qua) chưa dùng trong câu nào → món đặc biệt cuối ca.
  function dugWord(): TalkRun['special'] {
    const lex = host.lexicon?.() ?? [], by = new Map(lex.map(w => [w.id, w])), t = today(), led = d.E().ev.led, usedIds = new Set(led.filter(x => x.ctx === 'use').map(x => x.item ?? ''));
    for (let i = led.length - 1; i >= 0; i--) {
      const x = led[i]!; if (t - x.day > 14) break;
      const m = x.ok && (x.ctx === 'wheel' || x.ctx === 'hunt') ? /^w:(.+):(wheel|hunt)$/.exec(x.item ?? '') : null, w = m ? by.get(m[1]!) : undefined;
      if (w && !usedIds.has(`use:${w.id}`)) return { id: w.id, en: w.en, vi: w.vi, node: w.node, done: false, ok: null, text: '' };
    }
    return null;
  }
  function tkStart(): void {
    const all = X.convs?.() ?? [];
    if (!all.length) { host.toast('Bản app này chưa có hội thoại cho Quán.'); return; }
    const s = sv(), convs = pickConvs(all, d.lv(), s.tk.played, seed(), 2);
    if (!convs.length) { host.toast('Chưa có khách ở cấp này.'); return; }
    reset(); micN++;
    talk = { floor: s.tk.runs + 1, seed: seed(), lv: convs[0]!.lv, convs, ci: 0, node: convs[0]!.start, pre: '', t0: Date.now(), miss: 0, hint: false, vi: false, turns: [], per: [[]], coins: 0, tips: 0, served: 0, done: false, amb: !!s.amb && convs[0]!.lv !== 'A1', special: dugWord(), phase: 'talk', picks: null, last: null };
    if (talk.amb) ambStart(amb());
    tkSay(); host.render();
  }
  const tkLine = (r: TalkRun) => { const cv = r.convs[r.ci]!; return (r.pre ? r.pre + ' ' : '') + cv.n[r.node]!.a; };
  function tkSay(slow = false): void { const r = talk; if (!r || r.phase === 'special') return; const cv = r.convs[r.ci]; if (cv) say(tkLine(r), cv.k, slow); }
  function tkAnswer(texts: string[], via: Via): void {
    const r = talk; if (!r || r.done) return;
    if (r.phase === 'special') { tkSpecial(texts, via); return; }
    if (r.phase !== 'talk') return;
    const cv = r.convs[r.ci]!, line = tkLine(r), ms = Date.now() - r.t0;
    let text = texts[0] ?? '', res: ReturnType<NonNullable<VoiceHostX['cvTurn']>> = null;
    for (const t of texts) { const x = X.cvTurn?.(cv.id, r.node, t) ?? null; if (x?.hit) { text = t; res = x; break; } if (!res) res = x; }
    if (!res || !text.trim()) return;
    micN++; prod(text, via);
    const think = via === 'mic' ? thinkSec(ms, line) : null;
    if (think !== null) hlog('lat', think);
    if (r.amb && r.miss === 0) hlog('l4', res.hit);
    if (!res.hit && r.miss < 1) {   // chưa hiểu: khách hỏi lại một lần (luyện sửa hiểu lầm), hiện phương án chọn làm bậc lùi
      r.turns.push({ node: r.node, q: line, text, via, hit: false, first: false, think, coins: 0, tip: false }); r.per[r.ci]!.push(r.turns[r.turns.length - 1]!);
      r.miss++; r.pre = res.rp || "Sorry, I didn't catch that."; r.t0 = Date.now(); r.picks = pickOpts(cv, r.node, r.seed + r.turns.length); r.last = { hit: false, via, tip: false, reply: '' };
      sfx('place'); tkSay(); host.render(); return;
    }
    const first = res.hit && r.miss === 0, pay = turnCoins(first, via, think, r.lv);
    const t = { node: r.node, q: line, text, via, hit: res.hit, first, think, coins: res.hit ? pay.coins : 1, tip: res.hit && pay.tip };
    r.turns.push(t); r.per[r.ci]!.push(t); r.coins += t.coins; if (t.tip) r.tips++;
    if (res.hit) { sfx('ok'); if (via !== 'pick') d.wk('sentence', 1, 'talk'); }
    r.last = { hit: res.hit, via, tip: t.tip, reply: res.reply }; r.miss = 0; r.picks = null; r.hint = false; r.vi = false;
    r.node = res.next; r.pre = res.reply; r.t0 = Date.now();
    if (cv.n[r.node]?.end) { tkConvDone(); return; }
    tkSay(); host.render();
  }
  function tkConvDone(): void {
    const r = talk!, cv = r.convs[r.ci]!, ts = r.per[r.ci] ?? [];
    const log = ts.map((t, i) => ({ node: t.node, q: t.q, text: t.text, ms: Math.round((t.think ?? 4) * 1000), words: wcount(t.text), hint: false, ok: !t.hit ? (ts[i + 1]?.node === t.node ? 'repair' : 'default') : t.first ? 'match' : 'late' }));
    const res = X.convSave?.(cv.id, log) ?? null, und = ts.length ? ts.filter(t => t.first && t.hit).length / Math.max(1, new Set(ts.map(t => t.node)).size) : 0;
    if (und >= 0.7 && ts.some(t => t.via !== 'pick')) hlog('cv');
    if (und >= 0.5) r.served++;
    const s = sv(); s.tk.played[cv.id] = (s.tk.played[cv.id] ?? 0) + 1;
    r.pre = ''; r.phase = 'between';
    d.snap(`talk:${cv.id}`, `talk:${res?.pass ? 'pass' : 'done'}`, { und: Math.round(und * 100) / 100, turns: ts.length, said: ts.filter(t => t.via !== 'pick').length });
    if (r.ci + 1 < r.convs.length) { r.ci++; r.per.push([]); r.node = r.convs[r.ci]!.start; r.phase = 'talk'; r.t0 = Date.now() + 1500; r.last = null; tkSay(); host.render(); return; }
    if (r.special) { r.phase = 'special'; r.t0 = Date.now(); host.render(); return; }
    tkEnd();
  }
  function tkSpecial(texts: string[], via: Via): void {
    const r = talk!, s = r.special!, text = texts.find(t => usesWord(t, s.en)) ?? texts[0] ?? '';
    if (!text.trim()) return;
    micN++; prod(text, via);
    const ok = usesWord(text, s.en);
    s.ok = ok; s.text = text;
    if (via === 'type') d.ev({ node: s.node, level: 3, ok, g: 0, item: `use:${s.id}`, text: `Dùng “${s.en}” trong câu`, qt: 'typed', ctx: 'use', src: 'game', ch: `talk:${r.floor}:use` });
    else hlog('xf', ok);
    if (ok) { s.done = true; r.coins += 15; sfx('clear'); d.wk('sentence', 1, 'talk'); } else sfx('place');
    host.render();
  }
  function tkEnd(): void {
    const r = talk; if (!r) return;
    r.done = true; r.phase = 'done'; ambStop(); host.asrOff?.();
    const s = sv(); s.tk.runs++; s.tk.served += r.served; s.tk.tips += r.tips; s.tk.coins += r.coins; s.tk.day = today();
    d.coins(r.coins);
    d.snap(`talk:${r.floor}`, 'talk:end', { coins: r.coins, tips: r.tips, served: r.served, turns: r.turns.length, said: r.turns.filter(t => t.via !== 'pick').length });
    sfx('end'); host.save(); host.render();
  }

  // ---------- 🔎 Hỏi chuyện nhân chứng ----------
  function akStart(): void {
    const s = sv(), sd = seed(), c = pickCase(d.lv(), s.ak.played, sd);
    if (!c) { host.toast('Chưa có vụ nào.'); return; }
    reset(); micN++;
    ask = { floor: s.ak.runs + 1, seed: sd, c, got: [], log: [], order: suspectOrder(c, sd), phase: 'ask', pick: null, tries: 0, done: false, t0: Date.now(), reply: '', hints: [] };
    host.render();
  }
  function akAnswer(texts: string[], via: Via): void {
    const r = ask; if (!r || r.phase !== 'ask') return;
    let text = texts[0] ?? '', f = null as ReturnType<typeof askMatch>;
    for (const t of texts) { const x = askMatch(r.c, t, r.got); if (x) { text = t; f = x; break; } }
    if (!text.trim()) return;
    micN++; prod(text, via);
    const q = isQuestion(text) || texts.some(isQuestion);
    if (via === 'mic') hlog('lat', thinkSec(Date.now() - r.t0, r.reply));
    hlog('xf', !!f);
    r.log.push({ text, via, fact: f?.id ?? null, q });
    r.reply = f ? f.a : q ? "Hmm, I'm not sure. Ask me something else." : '';
    r.hints = via === 'type' ? (X.ghints?.(text) ?? []).slice(0, 2) : [];
    if (f && !r.got.includes(f.id)) { r.got.push(f.id); sfx('ok'); d.wk('sentence', 1, 'ask'); } else sfx('place');
    if (r.reply) say(r.reply, 1);
    r.t0 = Date.now(); host.render();
  }
  function akPick(i: number): void {
    const r = ask; if (!r || r.phase !== 'pick' || r.done) return;
    r.pick = i; r.tries++;
    if (i === r.c.ans) {
      r.done = true; r.phase = 'done';
      const s = sv(); s.ak.runs++; if (r.tries === 1) s.ak.solved++; s.ak.day = today(); s.ak.played = [...s.ak.played.filter(x => x !== r.c.id), r.c.id].slice(-40);
      const coins = r.got.length * 5 + (r.tries === 1 ? 15 : 0); d.coins(coins);
      d.snap(`ask:${r.c.id}`, `ask:${r.tries === 1 ? 'solved' : 'done'}`, { got: r.got.length, qs: r.log.filter(x => x.q).length, tries: r.tries, coins });
      sfx('end'); host.save();
    } else sfx('bad');
    host.render();
  }

  // ---------- ⚓ Bến Cảng lệnh giọng ----------
  function ptStart(): void {
    const sets = X.sounds?.() ?? [];
    if (!sets.length) { host.toast('Bản app này chưa có cặp âm.'); return; }
    const e = d.E(), weak = (id: string) => { const c = e.m[`ph:${id}`]?.[1]; return c ? c.a / (c.a + c.b) : 0.5; };
    reset(); const sd = seed();
    port = { floor: sv().pt.runs + 1, seed: sd, orders: portOrders(sets, weak, sd, 8), i: 0, res: [], mode: host.hasAsr?.() ? 'speak' : 'listen', pos: (sd & 1) as 0 | 1, said: '', ans: null, tries: 0, done: false, t0: Date.now() };
    if (port.mode === 'listen') say(port.orders[0]!.target);
    host.render();
  }
  function ptSend(): void {
    const r = port; if (!r || r.mode !== 'speak' || r.ans === 'ok' || r.ans === 'other') return;
    const x = host.asrRes?.(portKey(r));
    if (!x) { host.toast('Bấm 🎙 rồi nói lệnh trước.'); return; }
    const k = x.k === 'ok' || x.k === 'other' ? x.k : 'unclear';
    r.ans = k; r.tries++;
    hlog('ph', k === 'ok');
    if (k === 'ok') sfx('clear'); else sfx(k === 'other' ? 'bad' : 'place');
    if (k === 'ok' || k === 'other' || r.tries >= 2) r.res[r.i] = k;
    host.render();
  }
  function ptTap(w: string): void {
    const r = port; if (!r || r.mode !== 'listen' || r.ans) return;
    const o = r.orders[r.i]!, ok = w === o.target;
    r.ans = ok ? 'ok' : 'other'; r.res[r.i] = r.ans;
    d.ev({ node: `ph:${o.set}`, level: 1, ok, g: 0.5, item: `port:${o.set}:${o.target}`, qt: 'mcq', ctx: 'listen-pair', src: 'pron', ch: `port:${r.floor}` });
    sfx(ok ? 'ok' : 'bad'); host.render();
  }
  function ptNext(skip = false): void {
    const r = port; if (!r) return;
    if (skip || r.res[r.i] === undefined) r.res[r.i] = skip ? 'skip' : r.ans ?? 'skip';
    host.asrOff?.();
    if (r.i + 1 >= r.orders.length) { ptEnd(); return; }
    r.i++; r.ans = null; r.tries = 0; r.pos = (Math.random() < 0.5 ? 0 : 1);
    if (r.mode === 'listen') say(r.orders[r.i]!.target);
    host.render();
  }
  function ptEnd(): void {
    const r = port!; r.done = true;
    const ok = r.res.filter(x => x === 'ok').length, n = r.res.filter(x => x !== 'skip').length, s = sv();
    s.pt.runs++; s.pt.ok += ok; s.pt.n += n; s.pt.day = today(); if (r.mode === 'speak' && n) s.pt.best = Math.max(s.pt.best, Math.round((ok / n) * 100));
    d.coins(ok * 3); d.snap(`port:${r.floor}`, `port:${r.mode}`, { ok, n });
    sfx('end'); host.save(); host.render();
  }

  // ---------- 🌫️ Sương quay lại ----------
  const fadingList = (): Fading[] => X.fading?.(12) ?? [];
  function sgStart(): void {
    const list = signsOf(fadingList(), 6);
    if (!list.length) { host.toast('Chưa có biển hiệu nào mờ: học thêm từ, vài ngày sau quay lại.'); return; }
    reset(); micN++;
    sign = { floor: sv().sg.runs + 1, signs: list, i: 0, lit: list.map(() => false), res: list.map(() => null), ans: null, done: false, t0: Date.now() };
    host.render();
  }
  function sgAnswer(texts: string[], via: Via): void {
    const r = sign; if (!r || r.ans || r.done) return;
    const s = r.signs[r.i]!, ok = texts.length ? signOk(s.en, texts) : false, said = texts[0] ?? '';
    micN++;
    X.wordRecall?.(s.id, ok, via === 'type');
    if (via === 'type' && said) d.ev({ node: s.node, level: 2, ok, g: 0, item: `w:${s.id}:signs`, text: s.vi, qt: 'typed', ctx: 'recall', src: 'game', ch: `signs:${r.floor}` });
    if (!s.due) { if (s.gap >= 30) hlog('r30', ok); else if (s.gap >= 7) hlog('r7', ok); }   // tới hạn: lịch ôn của app (srsStep) đã ghi nhớ trễ
    r.ans = { ok, said }; r.res[r.i] = ok; r.lit[r.i] = ok;
    sfx(ok ? 'clear' : 'bad');
    if (ok) d.wk('word', 1, 'signs');
    host.render();
  }
  function sgNext(): void {
    const r = sign; if (!r) return;
    if (r.i + 1 >= r.signs.length) {
      r.done = true; const ok = r.res.filter(x => x === true).length, s = sv();
      s.sg.runs++; s.sg.lit += ok; s.sg.day = today(); d.coins(ok * 4);
      d.snap(`signs:${r.floor}`, 'signs:end', { ok, n: r.signs.length });
      sfx('end'); host.save(); host.render(); return;
    }
    r.i++; r.ans = null; host.render();
  }

  // ---------- Lời nói: micro / gõ / chọn ----------
  const curGame = (): VoiceGame | null => (talk && !talk.done ? 'talk' : ask && !ask.done ? 'ask' : sign && !sign.done ? 'signs' : null);
  function mic(): Mic {
    const g = curGame(), has = !!host.hasAsr?.();
    if (!g || !has) return { has, busy: false, heard: null };
    const k = micKey(g), h = host.asrHeard?.(k) ?? null, busy = host.asrBusy?.(k) ?? false;
    if (h && used !== k) {   // máy vừa nghe xong: gửi ngay (một lần cho mỗi khoá)
      used = k; const alts = [h.heard, ...h.alts].filter(Boolean);
      setTimeout(() => submit(alts, 'mic'), 0);
    }
    return { has, busy, heard: h?.heard ?? null };
  }
  function submit(texts: string[], via: Via): void {
    const g = curGame();
    if (g === 'talk') tkAnswer(texts, via); else if (g === 'ask') akAnswer(texts, via); else if (g === 'signs') sgAnswer(texts, via);
  }
  const typed = (f: HTMLFormElement): string => { const i = f.querySelector('input'), v = String(i?.value ?? '').trim(); if (i) i.value = ''; return v; };

  // ---------- Hành động ----------
  const acts: Record<string, (el: HTMLElement) => void> = {
    tkstart: () => tkStart(),
    akstart: () => akStart(),
    ptstart: () => ptStart(),
    sgstart: () => sgStart(),
    vmic: () => { const g = curGame(); if (g) host.asrHear?.(micKey(g)); },
    vstop: () => { X.asrStop?.(); },
    vpick: el => { const r = talk, i = Number(el.dataset.i); if (r?.picks && r.picks.opts[i]) tkAnswer([r.picks.opts[i]!], 'pick'); },
    vamb: () => { const r = talk, s = sv(); s.amb = s.amb ? 0 : 1; if (r) r.amb = !!s.amb; if (s.amb && r && !r.done) ambStart(amb()); else ambStop(); host.save(); host.render(); },
    tkplay: el => tkSay(el.dataset.slow === '1'),
    tkvi: () => { if (talk) { talk.vi = !talk.vi; host.render(); } },
    tkhint: () => { if (talk) { talk.hint = !talk.hint; host.render(); } },
    tknext: () => { if (talk?.phase === 'special') tkEnd(); },
    tkskip: () => { if (talk?.phase === 'special') tkEnd(); },
    akdone: () => { if (ask && ask.phase === 'ask' && ask.got.length >= Math.max(2, ask.c.facts.length - 1)) { ask.phase = 'pick'; host.render(); } },
    akpick: el => akPick(Number(el.dataset.i)),
    ptsend: () => ptSend(),
    pttap: el => ptTap(el.dataset.w ?? ''),
    ptnext: () => ptNext(),
    ptskip: () => ptNext(true),
    sgno: () => sgAnswer([], 'type'),
    sgnext: () => sgNext(),
    hmeter: () => { reset(); hview = true; host.render(); window.scrollTo?.(0, 0); },
    rwdone: el => {
      const s = sv(), wk = vWeek(today()), id = el.dataset.id ?? '';
      if (s.rw.wk === wk) return;
      s.rw.wk = wk; s.rw.done = [...s.rw.done.filter(x => x !== id), id].slice(-60); s.rw.total++; hlog('rw'); d.coins(30);
      d.snap('real', 'real:done', { task: id, wk }); sfx('clear'); host.toast('🌍 +30 xu. Dùng tiếng Anh ngoài đời là bước quan trọng nhất!'); host.save(); host.render();
    },
  };
  const forms: Record<string, (f: HTMLFormElement) => void> = {
    tksay: f => { const v = typed(f); if (v) tkAnswer([v], 'type'); },
    aksay: f => { const v = typed(f); if (v) akAnswer([v], 'type'); },
    sgsay: f => { const v = typed(f); if (v) sgAnswer([v], 'type'); },
  };

  return {
    acts, forms, reset, hlog,
    START: { tkstart: 'talk', akstart: 'ask', ptstart: 'port', sgstart: 'signs' } as Record<string, VoiceGame>,
    active(): { game: VoiceGame; done: boolean } | null {
      if (talk) return { game: 'talk', done: talk.done };
      if (ask) return { game: 'ask', done: ask.done };
      if (port) return { game: 'port', done: port.done };
      if (sign) return { game: 'signs', done: sign.done };
      return null;
    },
    body(c: ECtx): string | null {
      if (hview) { const e = d.E(), h = hScore({ log: sv().hx, led: e.ev.led, today: today(), gate: Object.keys(e.gg?.done ?? {}).length, real: host.exam?.().real.length ?? 0 }); return viewHMeter(c, h.rows, h.total, h.measured); }
      if (talk) return talk.done ? viewTalkEnd(c, talk, sv().tk) : viewTalk(c, talk, mic());
      if (ask) return ask.done ? viewAskEnd(c, ask, sv().ak) : viewAsk(c, ask, mic());
      if (port) return port.done ? viewPortEnd(c, port, sv().pt) : viewPort(c, port, port.mode === 'speak' && host.asr ? host.asr(portKey(port), port.orders[port.i]!.target, port.orders[port.i]!.other, 'Nói lệnh') : '');
      if (sign) return sign.done ? viewSignsEnd(c, sign) : viewSigns(c, sign, mic());
      return null;
    },
    hub(c: ECtx): string {
      const e = d.E(), h = hScore({ log: sv().hx, led: e.ev.led, today: today(), gate: Object.keys(e.gg?.done ?? {}).length, real: host.exam?.().real.length ?? 0 });
      return viewVoiceHub(c, sv(), signsOf(fadingList(), 6).length, realTask(d.lv(), today()), vWeek(today()), h.total);
    },
    fading: (): number => signsOf(fadingList(), 6).length,
    total(): number { const e = d.E(); return hScore({ log: sv().hx, led: e.ev.led, today: today(), gate: Object.keys(e.gg?.done ?? {}).length, real: 0 }).total; },
    peek(): Peek | null {
      if (talk && !talk.done) {
        const r = talk;
        if (r.phase === 'special' && r.special) return r.special.ok ? { run: 'talkwait', node: r.special.node, level: 0, id: 'special', prompt: '', game: 'talk' } : { run: 'talkuse', node: r.special.node, level: 3, id: `use:${r.special.id}`, prompt: r.special.vi, accept: [`I can see a ${r.special.en} here.`], game: 'talk' };
        const cv = r.convs[r.ci]!, nd = cv.n[r.node]!;
        return { run: 'talk', node: '', level: 0, id: `${cv.id}:${r.node}:${r.turns.length}`, prompt: tkLine(r), accept: [nd.m], game: 'talk', ...(r.picks ? { opts: r.picks.opts, ans: r.picks.ans } : {}) };
      }
      if (ask && !ask.done) {
        const r = ask, f = r.c.facts.find(x => !r.got.includes(x.id));
        if (r.phase === 'pick' || !f) return { run: 'askpick', node: '', level: 0, id: r.c.id, prompt: '', opts: r.order.map(i => r.c.sus[i]!.name), ans: r.order.indexOf(r.c.ans), game: 'ask' };
        const q = f.q[0]!.split(' ').map(s => s.split('|')[0]).join(' ');
        return { run: 'ask', node: '', level: 0, id: `${r.c.id}:${f.id}`, prompt: f.vi, accept: [`${q.charAt(0).toUpperCase()}${q.slice(1)}?`], game: 'ask' };
      }
      if (port && !port.done) { const o = port.orders[port.i]!; return { run: port.mode === 'speak' ? 'port' : 'portlisten', node: `ph:${o.set}`, level: 1, id: portKey(port), prompt: o.target, accept: [o.target], opts: [o.target, o.other], ans: 0, game: 'port' }; }
      if (sign && !sign.done) { const s = sign.signs[sign.i]!; return sign.ans ? null : { run: 'signs', node: s.node, level: 2, id: `w:${s.id}:signs`, prompt: s.vi, accept: [s.en], game: 'signs' }; }
      return null;
    },
    hidden(): boolean { return hview; },
  };
}
export type Voice = ReturnType<typeof makeVoice>;
