// Cài đặt ôn thi: kỳ thi, mục tiêu, ngày thi, thời gian mỗi ngày; đồng ý chia sẻ thống kê ẩn danh (có kiểm tuổi, yêu cầu 3.3).

import type { Ctx } from '../main.ts';
import { EXAM_NAME } from './hub.ts';
import { dayToIso, back } from './ui.ts';
import type { ExamId } from '../scales.ts';

export const IELTS_TARGETS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
export const VSTEP_TARGETS: Array<[number, string]> = [[4, 'Bậc 3 (B1): trung bình ≥ 4,0'], [6, 'Bậc 4 (B2): trung bình ≥ 6,0'], [8.5, 'Bậc 5 (C1): trung bình ≥ 8,5']];

export function viewSettings(c: Ctx): string {
  const { x, host } = c, esc = host.esc, vstep = x.exam === 'vstep';
  const opt = (v: string, label: string, sel: boolean): string => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;
  const targets = vstep ? VSTEP_TARGETS.map(([v, l]) => opt(String(v), l, x.target === v)).join('')
    : IELTS_TARGETS.map(v => opt(String(v), `Band ${String(v).replace('.', ',')}`, x.target === v)).join('');
  const cs = x.consent;
  return `<section class="stack"><span class="eyebrow">Ôn thi · Cài đặt</span><h1>Kỳ thi và mục tiêu</h1></section>
  <form class="panel stack" data-xform="settings">
    <label class="stack" style="gap:4px"><b>Kỳ thi</b><select class="field" name="exam">${(Object.keys(EXAM_NAME) as ExamId[]).map(k => opt(k, EXAM_NAME[k], x.exam === k)).join('')}</select></label>
    <label class="stack" style="gap:4px"><b>Mục tiêu</b><select class="field" name="target"><option value="">Chưa chọn</option>${targets}</select></label>
    <label class="stack" style="gap:4px"><b>Ngày thi</b><input class="field" type="date" name="date" value="${x.date !== null ? dayToIso(x.date) : ''}" min="${dayToIso(host.today())}"></label>
    <label class="stack" style="gap:4px"><b>Số phút học mỗi ngày</b><input class="field" type="number" name="mins" inputmode="numeric" min="5" max="600" step="5" value="${x.mins}"></label>
    <div class="row"><button class="btn primary">Lưu</button></div></form>
  <form class="panel stack" data-xform="consent" aria-labelledby="xcons">
    <h3 id="xcons">Chia sẻ thống kê ẩn danh</h3>
    <p class="note">Nếu bạn đồng ý, sau mỗi bài app gửi <b>id câu hỏi và đúng/sai</b> (không tên, không email, không mã máy, không tiến độ) để tính độ khó thật của từng câu và tạm ẩn câu kém. Khi bạn ghi điểm thi thật, app gửi thêm cặp “ước tính – điểm thật” để đo độ chính xác. Mỗi ngày app cộng thêm 1 vào tổng số “đã mở app” và “đã học” của ngày đó (chỉ là số đếm chung, không lưu gì về bạn) để biết có bao nhiêu người đang học. Không bán, không dùng cho quảng cáo. Rút lại lúc nào cũng được; tắt thì app không gửi gì nữa.</p>
    <fieldset class="stack" style="border:0;padding:0;margin:0;gap:6px"><legend><b>Bạn bao nhiêu tuổi?</b></legend>
      <label class="chip"><input type="radio" name="age" value="adult"${cs?.adult ? ' checked' : ''}> Từ 16 tuổi trở lên</label>
      <label class="chip"><input type="radio" name="age" value="minor"${cs && !cs.adult ? ' checked' : ''}> Dưới 16 tuổi</label></fieldset>
    <label class="chip"><input type="checkbox" name="parent"${cs?.parent ? ' checked' : ''}> (Dưới 16 tuổi) Cha mẹ hoặc người giám hộ đã đọc và đồng ý</label>
    <p class="hint">Người dưới 16 tuổi cần cha mẹ hoặc người giám hộ đồng ý (Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân). ${x.share ? `Đang bật · đã gửi ${x.sent} lượt.` : 'Đang tắt.'}</p>
    <div class="row">${x.share ? '<button class="btn" name="act" value="off">Tắt chia sẻ</button>' : '<button class="btn primary" name="act" value="on">Đồng ý chia sẻ</button>'}</div></form>
  ${back()}`;
}
