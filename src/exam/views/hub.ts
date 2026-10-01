// Trang chính của tab "Ôn thi": chọn kỳ thi, rồi các việc cần làm cho kỳ thi đó.

import type { Ctx } from '../main.ts';
import type { ExamId } from '../scales.ts';

export const EXAM_NAME: Record<ExamId, string> = {
  'ielts-ac': 'IELTS Academic',
  'ielts-gt': 'IELTS General Training',
  vstep: 'VSTEP (bậc 3–5)',
};

const EXAM_DESC: Record<ExamId, string> = {
  'ielts-ac': 'Du học, xét tuyển đại học, chuẩn đầu ra. Đọc bài học thuật, Viết Task 1 mô tả biểu đồ.',
  'ielts-gt': 'Định cư, làm việc ở nước ngoài. Đọc văn bản đời thường và nơi làm việc, Viết Task 1 là thư.',
  vstep: 'Chứng chỉ B1–C1 trong nước (chuẩn đầu ra, viên chức, giáo viên). Định dạng theo Quyết định 729/QĐ-BGDĐT.',
};

const card = (attrs: string, ic: string, title: string, desc: string, ico: (n: string) => string): string =>
  `<button class="unit morei" ${attrs}><span class="no">${ico(ic)}</span><span class="t"><strong>${title}</strong><span class="muted">${desc}</span></span></button>`;

export function viewHub(c: Ctx): string {
  const { host, x } = c, esc = host.esc, ico = host.ico;
  if (!x.exam) {
    return `<section class="stack"><span class="eyebrow">Ôn thi</span><h1>Bạn ôn thi gì?</h1>
      <p class="muted">Chọn một kỳ thi để app xếp bài theo đúng định dạng đề. Đổi lúc nào cũng được, tiến độ vẫn giữ.</p></section>
      <div class="units">${(Object.keys(EXAM_NAME) as ExamId[]).map(k => card(`data-x="exam" data-v="${k}"`, k === 'vstep' ? 'flag' : 'exam', esc(EXAM_NAME[k]), esc(EXAM_DESC[k]), ico)).join('')}</div>
      <p class="hint">Mọi bài luyện, đề thi thử và cách chấm đều miễn phí, không quảng cáo, không cần tài khoản.</p>`;
  }
  const isV = x.exam === 'vstep';
  return `<section class="stack"><span class="eyebrow">Ôn thi · ${esc(EXAM_NAME[x.exam])}</span><h1>Ôn ${esc(EXAM_NAME[x.exam])}</h1>
      <p class="muted">${esc(EXAM_DESC[x.exam])}</p></section>
    <div class="units">
      ${isV ? card('data-act="exgo"', 'exam', 'Thi thử Nghe + Đọc (rút gọn)', 'Có tính giờ, ước tính điểm từng kỹ năng theo thang 10', ico) : ''}
      ${isV ? card('data-act="vxnew" data-m="w"', 'pen', 'Thi thử Viết', 'Thư ≥ 120 từ và bài luận ≥ 250 từ, 60 phút', ico) : ''}
      ${isV ? card('data-act="vxnew" data-m="s"', 'mic', 'Thi thử Nói', '3 phần, tính giờ, máy chép lời', ico) : ''}
      ${card('data-x="route" data-r="scales"', 'chart', 'Cách tính điểm và nguồn', 'Bảng quy đổi số câu đúng → band, CEFR ↔ IELTS ↔ VSTEP, sai số, giới hạn của app', ico)}
    </div>
    <section class="panel stack"><h3>Đang soạn cho bản tới</h3>
      <ul class="sklist"><li>Kiểm tra đầu vào Nghe + Đọc thích ứng, ≤ 15 phút, ra band kèm sai số</li><li>Kế hoạch học tới ngày thi và sổ lỗi sai</li>
      <li>Luyện từng dạng câu hỏi, mỗi dạng có bài học, mẹo và ≥ 30 câu</li><li>Đề thi thử đầy đủ có âm thanh giọng Anh, Mỹ</li></ul>
      <p class="hint">App phát hành dần; mục nào chưa đủ chỉ tiêu thì chưa ghi là xong.</p></section>
    <div class="row"><button class="btn ghost" data-x="examreset">Đổi kỳ thi</button></div>`;
}
