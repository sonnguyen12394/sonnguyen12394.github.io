// Màn Vườn từ (v87). Chỉ trình bày: từ do engine chọn (main.ts), bậc / câu ở garden.ts.

import type { ECtx } from './views.ts';
import type { Challenge } from './quest.ts';
import type { GWord } from './host.ts';
import { STAGE, STAGE_VI, type GItem, type Plant } from './garden.ts';

export interface GardenRun {
  floor: number; seed: number; t0: number; i: number; n: number; ok: number; grown: number; done: boolean;
  list: Array<{ w: GWord; node: string; s: number; isNew: boolean }>; pools: Record<string, Array<{ en: string; vi: string }>>; chs: Record<string, Challenge | null>;
  phase: 'teach' | 'ask'; item: GItem | null; ans: { ok: boolean; given: string } | null; novel: boolean; passed?: string[];
}

const card = (c: ECtx, w: GWord): string => {
  const esc = c.host.esc;
  return `<div class="gdcard"><div class="gdpic" aria-hidden="true">${w.pic || '📗'}</div><div class="stack" style="gap:2px"><b lang="en" style="font-size:22px">${esc(w.en)}</b>
    <span class="hint">${w.ipa ? `<span lang="en">${esc(w.ipa)}</span> · ` : ''}${esc(w.pos)} · <b>${esc(w.vi)}</b></span>
    ${w.ex ? `<span lang="en">“${esc(w.ex)}”</span>${w.exVi ? `<span class="hint">${esc(w.exVi)}</span>` : ''}` : ''}
    <div class="row" style="gap:6px"><button class="btn small" data-say="${esc(w.en)}">🔊 Nghe</button>${w.ex ? `<button class="btn ghost small" data-say="${esc(w.ex)}">🔊 Câu ví dụ</button>` : ''}</div></div></div>`;
};

export function viewGarden(c: ECtx, r: GardenRun): string {
  const esc = c.host.esc, x = r.list[r.i]!, it = r.item;
  const row = r.list.map((y, k) => `<span class="gdpot${k === r.i ? ' cur' : ''}" title="${esc(y.w.en)}">${STAGE[Math.min(3, y.s)]}</span>`).join('');
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">🌱 Vườn từ · cây ${r.i + 1}/${r.list.length}</span><span>🌸 +${r.grown}</span></div><div class="row" style="gap:6px">${row}</div></section>`;
  if (r.phase === 'teach') return `${head}<p class="hint">🌰 Gieo hạt: làm quen từ mới (chưa hỏi)</p>${card(c, x.w)}
    <div class="row"><button class="btn primary" data-e="gdask">Tưới cây ▸</button></div>`;
  if (!it) return `${head}<div class="row"><button class="btn primary" data-e="gdnext">Tiếp ▸</button></div>`;
  const next = Math.min(3, x.s + 1), what = `${STAGE[x.s]} → ${STAGE[next]} ${STAGE_VI[next]}`;
  if (r.ans) {
    const a = r.ans, right = it.accept?.[0] ?? it.opts?.[it.ans ?? 0] ?? '';
    return `${head}<div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? `Cây lớn lên! ${STAGE[next]}` : 'Cây chưa lớn, xem lại thẻ nhé'}</strong>${a.ok ? '' : `<span>Đáp án: <b${it.level === 1 ? '' : ' lang="en"'}>${esc(right)}</b>${a.given ? ` · bạn trả lời: ${esc(a.given)}` : ''}</span>`}</div>
      ${a.ok ? '' : card(c, x.w)}
      <div class="row"><button class="btn primary" data-e="gdnext" id="qnextbtn">${r.i + 1 >= r.list.length ? 'Xem vườn' : 'Cây kế ▸'}</button></div>`;
  }
  const ask = it.opts
    ? `<div class="stack" style="gap:8px">${it.opts.map((o, k) => `<button class="btn" style="justify-content:flex-start" data-e="gdans" data-i="${k}"${it.level === 2 ? ' lang="en"' : ''}>${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="gdans" data-i="-1">Không biết</button></div>`
    : `<form class="stack" data-eform="gdtyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="gdans" data-i="-1">Không biết</button></div></form>`;
  return `${head}<p class="hint">${what}${x.w.pic && it.level === 1 ? '' : ''}</p><p style="font-size:20px;font-weight:600">${it.level === 1 && x.w.pic ? `${x.w.pic} ` : ''}${esc(it.prompt)}</p>${ask}`;
}

export function viewGardenEnd(c: ECtx, r: GardenRun, plants: Record<string, Plant>, words: Record<string, string>): string {
  const esc = c.host.esc, all = Object.entries(plants).sort((a, b) => b[1].s - a[1].s || b[1].d - a[1].d);
  const bloom = all.filter(([, p]) => p.s >= 3).length;
  return `<section class="stack"><span class="eyebrow">🌱 Vườn từ</span><h1>🌷 Vườn của bạn</h1>
    <p style="font-size:20px">Hôm nay: ${r.ok}/${r.n} cây lớn lên · vườn có ${all.length} cây, ${bloom} cây nở hoa 🌸</p>
    <div class="gdbed">${all.slice(0, 60).map(([id, p]) => `<span class="gdplant s${p.s}" title="${esc(STAGE_VI[p.s]!)}">${STAGE[p.s]}<small lang="en">${esc(words[id] ?? id)}</small></span>`).join('')}</div>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu bạn tự trả lời, không phải từ số hoa)</span></div>` : ''}
    <p class="hint">Mỗi cây lớn tối đa một bậc mỗi ngày (giãn cách để nhớ lâu). Hoa nở = bạn đã tự gõ được từ. Mỗi câu trả lời được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="qhome">Về sảnh</button></div>`;
}
