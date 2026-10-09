// Màn Câu đố ngày (v77). Chỉ trình bày: cụm từ do engine chọn (main.ts, nút u:), luật nhóm / sao ở puzzle.ts. Ô vẽ bằng CSS.

import type { ECtx } from './views.ts';
import type { Challenge } from './quest.ts';
import { GROUPS, PER, stars, type PzGroup, type PzWord } from './puzzle.ts';

export interface RecallItem { id: string; level: 1 | 2 | 3; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[]; en: string; vi: string }
export interface PuzzleRun {
  floor: number; seed: number; t0: number; daily: boolean; n: number; ok: number; coins: number; wrong: string[]; passed?: string[]; done: boolean;
  groups: PzGroup[]; chs: Array<Challenge | null>; rest: PzWord[][];   // từ trên bàn / lượt engine / từ còn lại của cụm (để nhớ lại)
  tiles: Array<[number, number]>; sel: number[]; solved: number[]; mistakes: number; shown: number[]; msg: 'near' | 'no' | null;
  recall: { g: number; item: RecallItem | null; novel: boolean; ans: { ok: boolean; given: string; coins: number } | null } | null;
}

// Màu nhóm của app (không theo bảng màu của game đố chữ nào): xanh ngọc, cam đất, tím than, xanh lá.
const HUE = [176, 24, 262, 128];

export function viewPuzzle(c: ECtx, r: PuzzleRun): string {
  const esc = c.host.esc;
  const head = `<section class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">📅 Câu đố ${r.daily ? 'hôm nay' : 'luyện thêm'} · nhóm ${r.solved.length}/${r.groups.length}</span><span>${'⭐'.repeat(stars(r.mistakes))} · 🪙 ${r.coins}</span></div></section>`;
  const band = (g: number) => { const G = r.groups[g]!; return `<div class="pzband" style="--h:${HUE[g % HUE.length]}"><b>${esc(G.vi)}</b><span lang="en">${G.words.map(w => esc(w.en)).join(' · ')}</span></div>`; };
  const bands = r.solved.map(band).join('');
  if (r.recall) {
    const R = r.recall, it = R.item, G = r.groups[R.g]!;
    const meanings = `<p class="hint">${G.words.map(w => `<b lang="en">${esc(w.en)}</b> ${esc(w.vi)}`).join(' · ')}</p>`;
    if (!it) return `${head}${bands}${meanings}<div class="row"><button class="btn primary" data-e="pznext" id="qnextbtn">Tiếp ▸</button></div>`;
    if (R.ans) {
      const a = R.ans, right = it.accept?.[0] ?? it.opts?.[it.ans ?? 0] ?? it.en;
      return `${head}${bands}${meanings}
        <div class="fb ${a.ok ? 'good' : 'bad'}" role="status"><strong>${a.ok ? 'Nhớ đúng!' : 'Chưa nhớ ra, không sao'}</strong><span>“${esc(it.vi)}” = <b lang="en">${esc(right)}</b></span>${a.ok || !a.given ? '' : `<span class="hint">Bạn trả lời: ${esc(a.given)}</span>`}<span class="hint">+${a.coins} xu${R.novel ? ' · câu mới' : ''}</span></div>
        <div class="row"><button class="btn small" data-say="${esc(it.en)}">🔊 ${esc(it.en)}</button></div>
        <div class="row"><button class="btn primary" data-e="pznext" id="qnextbtn">${r.solved.length >= r.groups.length ? 'Xem kết quả' : 'Về bàn ▸'}</button></div>`;
    }
    const ask = it.opts
      ? `<div class="stack" style="gap:8px">${it.opts.map((o, i) => `<button class="btn" style="justify-content:flex-start" data-e="pzans" data-i="${i}" lang="en">${esc(o)}</button>`).join('')}<button class="btn ghost" data-e="pzans" data-i="-1">Không biết</button></div>`
      : `<form class="stack" data-eform="pztyped"><input class="field" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" lang="en" aria-label="Câu trả lời"><div class="row"><button class="btn primary">Trả lời</button><button class="btn ghost" type="button" data-e="pzans" data-i="-1">Không biết</button></div></form>`;
    return `${head}${bands}<div class="fb good" role="status"><strong>✅ Tìm ra nhóm “${esc(G.vi)}”!</strong></div>
      <p class="hint">🧠 Nhớ lại thêm một từ cùng chủ đề (không có trên bàn)</p><p style="font-size:18px;font-weight:600">${esc(it.prompt)}</p>${ask}`;
  }
  const sel = new Set(r.sel), shown = new Set(r.shown), left = r.tiles.map((t, i) => [t, i] as const).filter(([[g]]) => !r.solved.includes(g));
  const grid = `<div class="pzgrid" role="group" aria-label="Các ô từ">${left.map(([[g, k], i]) => {
    const w = r.groups[g]!.words[k]!, hint = shown.has(i) ? `<small>${esc(w.vi)}</small>` : '';
    return `<button class="pztile${sel.has(i) ? ' on' : ''}" data-e="pztile" data-i="${i}" aria-pressed="${sel.has(i)}"><span lang="en">${!w.learned && w.pic ? `${w.pic} ` : ''}${esc(w.en)}</span>${hint}</button>`;
  }).join('')}</div>`;
  const msg = r.msg === 'near' ? '<p class="warnt" role="status">Gần đúng: 3 trong 4 từ cùng một nhóm.</p>' : r.msg === 'no' ? '<p class="hint" role="status">Chưa phải một nhóm. Thử cách khác, không mất gì.</p>' : '';
  return `${head}${bands}<p class="hint">Tìm ${GROUPS} nhóm, mỗi nhóm ${PER} từ cùng chủ đề. Chạm 4 ô rồi bấm “Nộp nhóm”.</p>${grid}${msg}
    <div class="row"><button class="btn primary" data-e="pzsubmit" ${r.sel.length === PER ? '' : 'disabled'}>Nộp nhóm</button><button class="btn ghost" data-e="pzclear" ${r.sel.length ? '' : 'disabled'}>Bỏ chọn</button><button class="btn ghost" data-e="pzhint">💡 Xem nghĩa 1 ô</button></div>
    <p class="hint">Sai không mất gì: chỉ ít sao hơn. Câu nhớ lại sau mỗi nhóm mới được tính vào năng lực.</p>`;
}

export function viewPuzzleEnd(c: ECtx, r: PuzzleRun, days: number): string {
  const esc = c.host.esc, s = stars(r.mistakes);
  return `<section class="stack"><span class="eyebrow">📅 Câu đố ${r.daily ? 'hôm nay' : 'luyện thêm'}</span><h1>📅 Giải xong!</h1>
    <p style="font-size:22px">${'⭐'.repeat(s)} · ${r.mistakes ? `${r.mistakes} lần nộp chưa đúng` : 'không nộp sai lần nào'}</p>
    <p>Nhớ lại đúng ${r.ok}/${r.n} từ · +${r.coins} xu${r.daily ? ` · đã giải ${days} ngày` : ''}.</p>
    ${r.passed?.length ? `<div class="fb good" role="status"><strong>⬆ Lên cấp: ${r.passed.slice(0, 4).map(esc).join(', ')}</strong><span>đã vững (từ câu bạn tự nhớ ra, không phải từ sao)</span></div>` : ''}
    <p class="hint">Sao và số ngày giải chỉ để vui, bỏ một ngày không mất gì. Chỉ câu nhớ lại được ghi vào bản đồ năng lực.</p></section>
    <div class="row"><button class="btn primary" data-e="pzstart">📅 Ván luyện thêm</button><button class="btn ghost" data-e="qhome">Về sảnh</button></div>`;
}
