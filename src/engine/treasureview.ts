// v111 Kho báu ẩn (docs/SPEC.md "Game hoá mọi chức năng"): bộ đo hiệu quả học (measure.ts, 12 câu giữ riêng, không bao giờ xuất hiện
// khi luyện / chơi) trong vỏ game. Mỗi câu là một chiếc rương; không hiện đáp án trong lúc mở (để phép đo không thành bài học);
// xu thưởng theo số rương đã mở, KHÔNG theo đúng / sai (không có lý do đoán bừa hay né câu khó).

import type { ECtx } from './views.ts';

export const CHEST_COINS = 3;

export function viewTreasureCard(c: ECtx, first: boolean): string {
  return `<section class="tcard stack"><span class="eyebrow">🎁 Kho báu ẩn</span>
    <p>${first ? 'Tí tìm thấy một kho báu ẩn ở cổng phố: 12 chiếc rương, mỗi rương là một câu bạn chưa gặp bao giờ.' : 'Kho báu ẩn lại xuất hiện! Mở để Tí biết bạn tiến được bao xa so với lần trước.'}</p>
    <div class="row"><button class="btn primary" data-e="go" data-r="treasure">🎁 Mở kho báu (khoảng 4 phút)</button></div></section>`;
}

export function viewTreasureIntro(c: ECtx, has: boolean): string {
  return `<section class="stack"><span class="eyebrow">🎁 Kho báu ẩn</span><h1>12 chiếc rương</h1>
    <p class="muted">Mỗi rương là một câu bạn chưa gặp bao giờ. Mở xong mới biết bên trong: trong lúc mở, Tí không nói đúng hay sai. Mỗi rương mở được ${CHEST_COINS} xu, dù đúng hay sai, nên cứ trả lời thật, không chắc thì chọn "Không biết".</p></section>
    ${has ? '<div class="row"><button class="btn primary big" data-e="mstart">🗝️ Mở rương đầu tiên</button><button class="btn ghost" data-e="go" data-r="quest">Để sau</button></div>' : '<p class="muted">Hôm nay chưa có kho báu. Tí sẽ báo khi kho báu xuất hiện.</p><div class="row"><button class="btn ghost" data-e="go" data-r="quest">Về sảnh chơi</button></div>'}`;
}

export function viewTreasureDone(c: ECtx, n: number): string {
  return `<section class="stack"><span class="eyebrow">🎁 Kho báu ẩn</span><h1>Đã mở hết ${n} rương!</h1>
    <p>+${n * CHEST_COINS} xu. Tí đã cất kết quả để so với lần mở kho báu sau: nhờ vậy biết bạn tiến bộ thật, không phải chỉ nhớ câu.</p>
    <p class="hint">Kho báu xuất hiện lại sau khoảng 2 tuần học, rồi sau 7 và 30 ngày. Muốn xem số liệu chi tiết: Tôi → Dữ liệu.</p></section>
    <div class="row"><button class="btn primary" data-e="go" data-r="quest">Về sảnh chơi</button></div>`;
}
