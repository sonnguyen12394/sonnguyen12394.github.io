// Màn "Cách tính điểm và nguồn": mọi bảng quy đổi, công thức ước tính, sai số và giới hạn đều xem được (yêu cầu 3.4, 5.2).

import type { Ctx } from '../main.ts';
import { SOURCES, IELTS_LISTENING, IELTS_READING_AC, IELTS_READING_GT, CEFR_TABLE, VSTEP_FORMAT, type RawTable } from '../scales.ts';
import { A_DEFAULT, PRIOR_DEFAULT } from '../irt.ts';
import { MIN_N, HIDE_RPB } from '../stats.ts';

const fmt = (n: number): string => String(n).replace('.', ',');

function rangeRows(t: RawTable): Array<{ from: number; to: number; band: number; official: boolean }> {
  return t.rows.map((r, i) => ({ from: r.min, to: i === 0 ? t.total : t.rows[i - 1]!.min - 1, band: r.band, official: r.official }));
}

function rawTableHtml(t: RawTable, title: string, esc: (s: unknown) => string): string {
  const src = SOURCES[t.source]!;
  return `<section class="panel stack"><h3>${esc(title)}</h3>
    <div class="tablewrap" tabindex="0" role="region" aria-label="${esc(title)}"><table class="tbl"><thead><tr><th>Số câu đúng / ${t.total}</th><th>Band</th><th>Nguồn</th></tr></thead><tbody>
    ${rangeRows(t).map(r => `<tr><td class="num">${r.from === r.to ? r.from : `${r.from}–${r.to}`}</td><td class="num"><b>${fmt(r.band)}</b></td><td>${r.official ? 'Chính thức' : '<span class="warnt">Ước tính của app</span>'}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="hint">Nguồn: <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.title)}</a>, truy cập ${esc(src.accessed)}. ${esc(src.note || '')}</p>
    <p class="hint">${esc(t.estimateNote)} Bài luyện ngắn hơn 40 câu: app quy tỉ lệ số câu đúng về thang 40 rồi tra bảng, nên kết quả luôn là ước tính.</p></section>`;
}

export function viewScales(c: Ctx): string {
  const esc = c.host.esc;
  const src = (id: string): string => { const s = SOURCES[id]!; return `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> (truy cập ${esc(s.accessed)})`; };
  return `<section class="stack"><span class="eyebrow">Ôn thi · Minh bạch</span><h1>Cách tính điểm và nguồn</h1>
    <p class="muted">Mọi con số app đưa ra là <b>ước tính</b>, không phải điểm thi chính thức, và luôn đi kèm khoảng sai số. Dưới đây là toàn bộ bảng và công thức app dùng.</p></section>
  ${rawTableHtml(IELTS_LISTENING, 'IELTS Nghe (Academic và General Training dùng chung)', esc)}
  ${rawTableHtml(IELTS_READING_AC, 'IELTS Đọc — Academic', esc)}
  ${rawTableHtml(IELTS_READING_GT, 'IELTS Đọc — General Training', esc)}
  <section class="panel stack"><h3>Điểm tổng IELTS</h3>
    <p>Trung bình cộng 4 kỹ năng, làm tròn tới nửa band gần nhất: trung bình lẻ ,25 làm tròn lên ,5; lẻ ,75 làm tròn lên band nguyên. Ví dụ 6,5 + 6,5 + 5,0 + 7,0 → 6,25 → <b>6,5</b>.</p>
    <p class="hint">Nguồn: ${src('ieltsOverall')}.</p></section>
  <section class="panel stack"><h3>VSTEP bậc 3–5</h3>
    <p>Định dạng: Nghe ${VSTEP_FORMAT.L.questions} câu (${VSTEP_FORMAT.L.parts.join(' + ')}), khoảng ${VSTEP_FORMAT.L.minutes} phút; Đọc ${VSTEP_FORMAT.R.questions} câu (4 bài), ${VSTEP_FORMAT.R.minutes} phút; Viết ${VSTEP_FORMAT.W.minutes} phút (thư ≥ ${VSTEP_FORMAT.W.tasks[0].words} từ, bài luận ≥ ${VSTEP_FORMAT.W.tasks[1].words} từ); Nói khoảng ${VSTEP_FORMAT.S.minutes} phút, ${VSTEP_FORMAT.S.parts} phần.</p>
    <p>Mỗi kỹ năng chấm thang 10. Điểm trung bình 4 kỹ năng (làm tròn 0,5): <b>4,0–5,5 → bậc 3 (B1)</b>, <b>6,0–8,0 → bậc 4 (B2)</b>, <b>8,5–10 → bậc 5 (C1)</b>; dưới 4,0 chưa đạt bậc 3.</p>
    <p class="hint">Nguồn: ${src('vstep729')}.</p>
    <p><span class="warnt">Ước tính của app:</span> đề VSTEP không công bố bảng đổi số câu đúng ra điểm, nên app tính điểm Nghe/Đọc = số câu đúng ÷ tổng số câu × 10, làm tròn tới 0,5.</p></section>
  <section class="panel stack"><h3>CEFR ↔ IELTS ↔ VSTEP</h3>
    <div class="tablewrap" tabindex="0" role="region" aria-label="Bảng CEFR, IELTS, VSTEP"><table class="tbl"><thead><tr><th>CEFR</th><th>Bậc (VN)</th><th>Band IELTS</th><th>Điểm TB VSTEP</th></tr></thead><tbody>
    ${CEFR_TABLE.map(r => `<tr><td><b>${r.cefr}</b></td><td class="num">${r.bac}</td><td class="num">${r.ielts ? `${fmt(r.ielts[0])}–${fmt(r.ielts[1])}${r.ieltsOfficial ? '' : ' <span class="warnt">(ước tính)</span>'}` : '—'}</td><td class="num">${r.vstep ? `${fmt(r.vstep[0])}–${fmt(r.vstep[1])}` : '—'}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="hint">Nguồn: ${src('ieltsCefr')}; ${src('vstep729')}; ${src('tt01')}. Band IELTS dưới 4,0 ứng với A1–A2 không có trong nguồn chính thức: app ước tính. Không có bảng chính thức đổi thẳng IELTS ↔ VSTEP; app quy đổi qua CEFR và nội suy trong từng khoảng.</p></section>
  <section class="panel stack"><h3>Kiểm tra đầu vào thích ứng: ước tính band thế nào</h3>
    <p>App dùng mô hình đáp ứng câu hỏi 3 tham số: xác suất trả lời đúng = c + (1 − c) ÷ (1 + e<sup>−a(θ − b)</sup>), trong đó θ là band của bạn, b là độ khó câu (band), a là độ phân biệt (mặc định ${fmt(A_DEFAULT)}), c là xác suất đoán mò (1 ÷ số phương án với câu trắc nghiệm, 0 với câu điền).</p>
    <p>Band ước tính là trung bình hậu nghiệm trên thang 0–9 (điểm xuất phát ${fmt(PRIOR_DEFAULT.mean)} ± ${fmt(PRIOR_DEFAULT.sd)}). Câu tiếp theo được chọn trong 3 câu cho nhiều thông tin nhất ở band hiện tại. Khoảng sai số hiển thị = ±1,28 × sai số chuẩn (khoảng tin cậy 80%), làm tròn lên tới 0,5.</p></section>
  <section class="panel stack"><h3>Chất lượng câu hỏi</h3>
    <p>Mỗi câu có độ khó dự kiến lúc soạn. Khi có từ ${MIN_N} lượt trả lời ẩn danh (chỉ từ người học đã đồng ý), app tính độ khó thực tế (tỉ lệ đúng) và độ phân biệt (tương quan giữa câu đó và điểm phần còn lại). Câu có độ phân biệt ≤ ${fmt(HIDE_RPB)} được tạm ẩn chờ sửa. Câu bị báo lỗi nhiều cũng tạm ẩn.</p></section>
  <section class="panel stack"><h3>Giới hạn của app</h3>
    <ul class="sklist"><li>App không dùng AI khi bạn học và không có người chấm. Nghe, Đọc chấm tự động theo đáp án, nên chính xác nhất.</li>
    <li>Viết và Nói chỉ ước tính bằng luật đo được (độ dài, bố cục, từ nối, độ đa dạng từ, tốc độ nói…) kèm bạn tự chấm theo mô tả band. Sai số công bố ±1 band; đừng coi đây là điểm thi.</li>
    <li>Độ chính xác so với điểm thi thật chỉ được công bố khi có ít nhất 100 cặp "ước tính – điểm thật" cho mỗi kỹ năng. Hiện chưa đủ.</li>
    <li>Thi thử VSTEP rút gọn hiện đọc bài nghe bằng giọng của máy bạn. Bài nghe mới của phần ôn thi dùng tệp âm thanh tạo sẵn bằng giọng đọc tổng hợp Kokoro (giấy phép Apache-2.0), giọng Anh và Mỹ; chưa có giọng Úc.</li></ul></section>
  <div class="row"><button class="btn" data-x="route" data-r="hub">Về trang Ôn thi</button></div>`;
}
