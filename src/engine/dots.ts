// v131 Chấm đỏ báo việc (GAME-CRITERIA §18.4, P3): công trình nào có việc LÀM ĐƯỢC NGAY thì có chấm. Luật chống ép (khác Gunny):
// chỉ việc làm được ngay (không chấm vì "sắp hết hạn" hay "đã lâu chưa vào"), tối đa MAX_DOTS chấm cùng lúc, theo thứ tự lợi ích học.
// Thuần hàm: số liệu vào do main.ts gom.

import type { PlaceId } from './worldmap.ts';

export const MAX_DOTS = 3;
export interface DotIn {
  story: boolean;    // cảnh truyện đã sẵn sàng để xem
  bag: number;       // số món rèn / chế được ngay ở Xưởng của Tí
  fading: number;    // số từ đang mờ (sắp quên) để thắp lại ở Sương quay lại
  puzzle: boolean;   // câu đố hôm nay chưa giải
  deco: boolean;     // đủ xu mua một món trang trí cho công trình đã có ★
}
// Thứ tự = lợi ích học trước, vui sau: ôn từ sắp quên > truyện (động lực) > rèn đồ > câu đố ngày > trang trí.
export function dots(x: DotIn): PlaceId[] {
  const out: PlaceId[] = [];
  if (x.fading > 0) out.push('signs');
  if (x.story) out.push('story');
  if (x.bag > 0) out.push('bag');
  if (x.puzzle) out.push('puzzle');
  if (x.deco) out.push('notice');
  return out.slice(0, MAX_DOTS);
}
