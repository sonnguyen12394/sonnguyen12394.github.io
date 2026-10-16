// v135 Màn đối chiếu (route 'cmp'): phần A2 đã vững nhờ lối ⚔️ Chiến Binh (game) hay lối 📘 Học (app cũ), và nhóm nào game chưa có lò.
// Thuần chuỗi HTML; số liệu từ compare.ts. Không dùng chữ "thi / đề / kiểm tra".

import type { ECtx } from './views.ts';
import { cmpVerdict, type CmpOut, type Door } from './compare.ts';

const pct = (n: number, t: number): number => (t ? Math.round((100 * n) / t) : 0);

export function viewCompare(c: ECtx, o: CmpOut | null, door: Door, goalVi: string, cap?: number): string {
  const esc = c.host.esc;
  const sw = door === 'game'
    ? '<button class="btn" data-act="door" data-door="app">📘 Sang lối Học</button>'
    : '<button class="btn" data-act="door" data-door="game">⚔️ Sang lối Chiến Binh</button>';
  const head = `<h1>⚖️ Đối chiếu game và app</h1>
    <p class="hint">Bạn đang ở lối <b>${door === 'game' ? '⚔️ Chiến Binh (game)' : '📘 Học (app cũ)'}</b>. Hai lối dùng chung một bộ não: học ở đâu cũng tính tiến độ. Màn này chỉ ghi <b>câu đúng của bạn đến từ lối nào</b>.</p>
    <div class="row">${sw}<button class="btn" data-go="more">Về Tôi</button></div>`;
  if (!o) return `<section class="panel stack cmp">${head}<p>Chưa có đích. Chọn đích (ví dụ A2) rồi quay lại đây.</p></section>`;
  const legend = '<p class="hint cmpleg"><i class="cg"></i> nhờ game · <i class="ca"></i> nhờ app · <i class="cb2"></i> cả hai · <i class="cp"></i> có từ trước khi tách lối</p>';
  const rows = o.rows.filter(r => r.total).map(r => {
    const seg = (cls: string, n: number) => (n ? `<i class="${cls}" style="width:${pct(n, r.total)}%"></i>` : '');
    return `<li class="cmprow stack">
      <b>${r.ico} ${esc(r.vi)} · ${r.solid}/${r.total} vững</b>
      <span class="cmpbar" role="img" aria-label="${esc(r.vi)}: ${r.game} nhờ game, ${r.app} nhờ app, ${r.both} cả hai, ${r.before} từ trước, ${r.total - r.solid} chưa vững">${seg('cg', r.game)}${seg('ca', r.app)}${seg('cb2', r.both)}${seg('cp', r.before)}</span>
      <span class="hint">⚔️ ${r.game} · 📘 ${r.app} · cả hai ${r.both} · từ trước ${r.before} · câu đúng: game ${r.ansG}, app ${r.ansA}</span>
      <span class="hint">${r.pull ? '⚔️ Game có lò cho nhóm này.' : '🔒 Game chưa có lò cho nhóm này: hiện chỉ học được ở lối 📘 Học.'}</span>
    </li>`;
  }).join('');
  return `<section class="panel stack cmp">${head}
    <p><b>Đích: ${esc(goalVi)}</b> · ${o.solid}/${o.total} phần đã vững (${pct(o.solid, o.total)}%).</p>
    <p class="cmpv">${esc(cmpVerdict(o, cap))}</p>
    <p class="hint">Trong ${o.solid} phần đã vững: ⚔️ nhờ game ${o.game} · 📘 nhờ app ${o.app} · cả hai ${o.both} · từ trước khi tách lối ${o.before}.</p>
    ${legend}<ul class="cmplist">${rows}</ul>
    <p class="hint">Chưa người thật kiểm. "Nhờ game" nghĩa là mọi câu đúng của phần đó đến từ lối game; bạn vẫn là một người học, nên đây là đối chiếu nguồn luyện, không phải thí nghiệm tách biệt.</p>
  </section>`;
}
