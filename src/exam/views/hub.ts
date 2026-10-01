// Trang chính của tab "Ôn thi": chọn kỳ thi, rồi các việc cần làm cho kỳ thi đó.

import type { Ctx } from '../main.ts';
import type { ExamId } from '../scales.ts';
import { estimatePanel } from './estimate.ts';
import { fmt, dayVi } from './ui.ts';
import { planFor, todayPanel } from './plan.ts';
import { dueList } from '../notebook.ts';
import { hiddenItems } from '../net.ts';

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
      <div class="units">${(Object.keys(EXAM_NAME) as ExamId[]).map(k => card(`data-x="exam" data-v="${k}"`, k === 'vstep' ? 'map' : 'exam', esc(EXAM_NAME[k]), esc(EXAM_DESC[k]), ico)).join('')}</div>
      <p class="hint">Mọi bài luyện, đề thi thử và cách chấm đều miễn phí, không quảng cáo, không cần tài khoản.</p>`;
  }
  const isV = x.exam === 'vstep', today = host.today();
  const goal = x.target === null ? 'chưa đặt mục tiêu' : isV ? `mục tiêu trung bình ${fmt(x.target)}` : `mục tiêu band ${fmt(x.target)}`;
  const when = x.date === null ? 'chưa có ngày thi' : x.date >= today ? `thi ngày ${dayVi(x.date)} (còn ${x.date - today} ngày)` : `đã thi ngày ${dayVi(x.date)}`;
  return `<section class="stack"><span class="eyebrow">Ôn thi · ${esc(EXAM_NAME[x.exam])}</span><h1>Ôn ${esc(EXAM_NAME[x.exam])}</h1>
      <p class="muted">${esc(goal)} · ${esc(when)} · ${x.mins} phút/ngày <button class="linkbtn" data-x="route" data-r="settings" aria-label="Đổi mục tiêu, ngày thi, thời gian">Đổi</button></p></section>
    ${todayPanel(c, planFor(c))}
    ${estimatePanel(c)}
    <div class="units">
      ${card('data-x="route" data-r="practice"', 'read', 'Luyện theo dạng câu hỏi', 'Bài học, mẹo, bẫy hay gặp và bộ câu luyện có giải thích cho từng dạng câu Nghe, Đọc', ico)}
      ${card('data-x="route" data-r="plan"', 'map', 'Kế hoạch tới ngày thi', 'Lịch từng ngày, ưu tiên kỹ năng xa mục tiêu; cảnh báo khi không kịp', ico)}
      ${card('data-x="route" data-r="nb"', 'repeat', `Sổ lỗi sai${dueList(x, today, hiddenItems()).length ? ` · ${dueList(x, today, hiddenItems()).length} câu đến hạn` : ''}`, 'Câu đã sai tự vào sổ, ôn lại đúng lúc sắp quên', ico)}
      ${card('data-x="route" data-r="place"', 'chart', x.attempts.some(a => a.kind === 'place') ? 'Làm lại kiểm tra đầu vào' : 'Kiểm tra đầu vào (≤ 15 phút)', 'Đọc + Nghe thích ứng, ra band ước tính kèm sai số; xem lại từng câu có giải thích', ico)}
      ${isV ? card('data-act="exgo"', 'exam', 'Thi thử Nghe + Đọc (rút gọn)', 'Có tính giờ, ước tính điểm từng kỹ năng theo thang 10', ico) : ''}
      ${isV ? card('data-act="vxnew" data-m="w"', 'pen', 'Thi thử Viết', 'Thư ≥ 120 từ và bài luận ≥ 250 từ, 60 phút', ico) : ''}
      ${isV ? card('data-act="vxnew" data-m="s"', 'mic', 'Thi thử Nói', '3 phần, tính giờ, máy chép lời', ico) : ''}
      ${card('data-x="route" data-r="real"', 'star', 'Ghi điểm thi thật', 'So với ước tính của app; giúp đo độ chính xác cho mọi người', ico)}
      ${card('data-x="route" data-r="scales"', 'chart', 'Cách tính điểm và nguồn', 'Bảng quy đổi số câu đúng → band, CEFR ↔ IELTS ↔ VSTEP, sai số, giới hạn của app', ico)}
      ${card('data-x="route" data-r="accuracy"', 'info', 'Độ chính xác của ước tính', 'So với điểm thi thật của người học (công bố khi đủ 100 cặp mỗi kỹ năng)', ico)}
      ${card('data-x="route" data-r="settings"', 'gear', 'Cài đặt ôn thi', `Kỳ thi, mục tiêu, ngày thi, thời gian mỗi ngày; chia sẻ thống kê ẩn danh (${x.share ? 'đang bật' : 'đang tắt'})`, ico)}
    </div>
    <section class="panel stack"><h3>Đang soạn cho bản tới</h3>
      <ul class="sklist"><li>Kiểm tra đầu vào Nghe + Đọc thích ứng, ≤ 15 phút, ra band kèm sai số</li><li>Kế hoạch học tới ngày thi và sổ lỗi sai</li>
      <li>Luyện từng dạng câu hỏi, mỗi dạng có bài học, mẹo và ≥ 30 câu</li><li>Đề thi thử đầy đủ có âm thanh giọng Anh, Mỹ</li></ul>
      <p class="hint">App phát hành dần; mục nào chưa đủ chỉ tiêu thì chưa ghi là xong.</p></section>
    <div class="row"><button class="btn ghost" data-x="examreset">Chọn kỳ thi khác</button></div>`;
}
