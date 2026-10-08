// Khả năng nhớ ước lượng từ sổ bằng chứng (v69, bot L01). Thuần hàm.
// Ôn đúng lúc dựa trên thẻ FSRS của bài học cũ (host.recall). Người học chỉ chơi tháp thì không có thẻ nào → trước đây app không bao
// giờ biết họ sắp quên, rương ôn không xuất hiện (0 lần trong 44 ngày của bot L01). Ở đây dựng lại một thẻ FSRS ảo từ sổ L1:
// mỗi ngày có trả lời ở nút là một lần ôn (đúng tự lực = Good, đúng có trợ giúp = Hard, sai = Again), rồi tính khả năng nhớ hôm nay.

import { newCard, review, retrievability, type Card, type Grade } from '../exam/fsrs.ts';
import type { EvStore } from './ev/types.ts';

export function evCard(ev: EvStore, node: string): Card | null {
  const byDay = new Map<number, Grade>();
  for (const e of ev.led) {
    if (e.node !== node || byDay.has(e.day)) continue;   // lượt đầu tiên mỗi ngày, như một lần ôn thẻ
    byDay.set(e.day, !e.ok ? 1 : e.asst ? 2 : 3);
  }
  let c: Card | null = null;
  for (const [day, g] of [...byDay].sort((a, b) => a[0] - b[0])) c = c ? review(c, g, day) : newCard(g, day);
  return c;
}

export function evRecall(ev: EvStore, node: string, today: number): number | null {
  const c = evCard(ev, node);
  return c ? retrievability(Math.max(0, today - c.last), c.s) : null;
}
