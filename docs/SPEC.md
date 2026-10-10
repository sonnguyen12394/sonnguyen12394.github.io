# English Ladder — Master Spec v2

> **08/10/2026 — Spec v2.4 thay hướng sản phẩm.** Người sáng lập chốt: nguồn sự thật là **Master Spec v2.4** (`docs/SPEC-v2.4.md`), triển khai **thuần v2.4**:
> 1. MVP chỉ một Target Model là **CEFR Pre-A1 → C2**. IELTS, VSTEP, giao tiếp là Future Target Models: dữ liệu giữ nguyên (`status: "future"` trong `content/engine/goals/`), ẩn khỏi người học, bật lại được trong Cài đặt → Nâng cao; dùng để kiểm chứng mở rộng ở M10 của v2.4.
> 2. **Game là trải nghiệm chính**: người học chơi để thắng, việc học tiếng Anh nằm ẩn trong luật chơi (stealth learning) — mỗi hành động trong game là một thử thách ngôn ngữ do engine chọn, nhằm lên cấp nhanh nhất. Không dùng dark pattern; tiến độ học và dữ liệu luôn xem được.
> 3. Kiến trúc evidence theo v2.4 (Observation → Evidence → Ledger → Aggregate → Learner State → Decision Snapshot), đo bằng `docs/CONFORMANCE-200-v2.4.md` và `docs/SCORECARD-v2.4.md`.
>
> Các quyết định ở phần dưới vẫn có hiệu lực khi không trái với ba điểm trên (năng lượng/Super giả lập giữ nguyên). Lộ trình xây mới: v52 → v88 (xem phần "Lộ trình v2.4" cuối tệp).

Cập nhật: 03/10/2026. Bản đọc và bình luận: Claude Docs "English Ladder — Master Spec v2". Tệp này là bản AI đọc khi xây; hai bản phải giống nhau.

## Cách đọc

Bản này chốt mọi điểm còn mở của Master Spec gốc (51 mục) để bắt tay xây engine trên app hiện tại. 51 mục gốc vẫn có hiệu lực, trừ 4 mục được sửa ở phần "Các mục được sửa".

- **Quyết định của người sáng lập**: nguồn sự thật. Không ai (kể cả AI) tự đổi; muốn đổi phải hỏi lại.
- **Quyết định kỹ thuật**: do Claude chốt theo uỷ quyền. Sửa được khi dữ liệu thật cho thấy sai, ghi lý do trong lịch sử.
- **Rủi ro**: chỉ ghi nhận, không dùng để đổi hướng.

## Quyết định của người sáng lập

App là một engine học dùng chung cho mọi mục tiêu, kiếm tiền kiểu Duolingo, và được chứng minh bằng điểm thi thật của chính người sáng lập trước khi lên store.

| Chủ đề | Quyết định |
| --- | --- |
| Giá trị lõi | Một engine cho mọi mục tiêu; thêm mục tiêu = thêm Target Model, không xây app mới |
| Phạm vi engine đầu tiên | CEFR Pre-A1 → C2; IELTS Academic + General 4.0–9.0; VSTEP B1, B2, C1; giao tiếp hằng ngày, công việc, du lịch, học tập |
| Cách xây | Xây lên app hiện tại (v44), không viết lại. AI viết code và soạn nội dung; người sáng lập định hướng và kiểm tra |
| Thời gian | Không gấp, miễn đúng. Người sáng lập đợi engine và bắt đầu học từ M4; ngày thi và doanh thu lùi theo tốc độ xây |
| Người dùng đầu tiên | Chính người sáng lập: mất gốc (A1–A2), muốn thi VSTEP và IELTS |
| Kiếm tiền | Giống Duolingo: thuê bao tháng/năm, quảng cáo ở bản miễn phí, năng lượng theo lượt (mỗi bài tốn như nhau, đúng hay sai), XP theo hoạt động, game hoá, quy mô lớn |
| Giai đoạn demo | Web, chạy đủ cơ chế kiếm tiền nhưng chưa thu tiền thật |
| Cổng lên store | Người sáng lập đạt điểm thi thật ở kỳ thi chọn ngay sau bài chẩn đoán đầu vào trên engine (M3); khi đó mới làm tài khoản, thanh toán, store |
| AI | Làm sau. Trước hết mọi chức năng phải tốt nhất có thể mà không lệ thuộc AI |
| Điểm kỹ thuật còn mở | Giao cho Claude quyết, miễn đúng triết lý spec |
| Bản v45 (nhánh `claude/v45-ai-copy-honest-free`) | Để nguyên, quyết sau. Không gộp nguyên trạng vì chữ "không quảng cáo" trái với mô hình đã chọn |

Bài học từ lịch sử app: bản v35 chuyển sang "miễn phí 100%" do AI khuyên, không phải ý người sáng lập. Từ nay AI không đổi hướng sản phẩm khi chưa hỏi.

## Tầm nhìn và triết lý

App luôn biết bước tiếp theo người học nên làm: biết họ đang ở đâu, mục tiêu ở đâu, còn thiếu gì, và đã thật sự chứng minh được gì. Các nguyên tắc dưới đây giữ nguyên từ spec gốc.

1. **Luật vận hành**: không hỏi "đã học bao nhiêu" mà hỏi "đã chứng minh được năng lực nào so với mục tiêu" (mục 51).
2. **Đường đi tối thiểu**: chỉ học thứ còn thiếu mà mục tiêu cần; không học lại thứ đã thành thạo (mục 4, 20).
3. **Mục tiêu = Target Model có phiên bản** trên đồ thị năng lực, không phải khoá học cố định (mục 5, 6).
4. **Mastery theo 5 mức** (nhận ra, hiểu, nhớ ra, dùng có kiểm soát, dùng tự do), phụ thuộc mục tiêu, dựa trên nhiều bằng chứng (mục 8–12).
5. **Biết kiến thức ≠ làm được việc**: cần bằng chứng làm bài thật (mục 11).
6. **Learning Path tách Memory Maintenance**: đã thành thạo thì ra khỏi lộ trình, chuyển sang ôn duy trì (mục 17, 18).
7. **Tiến độ học ≠ mức sẵn sàng** cho mục tiêu (mục 19).
8. **CEFR, IELTS, VSTEP là các mô hình riêng**, chỉ tham chiếu lẫn nhau (mục 28).
9. **Nội dung là dữ liệu**, tách khỏi giao diện; có schema, kiểm tra tự động (mục 44, 45).

Vòng lặp lõi:

```
Mục tiêu → Target Model → Chẩn đoán → Trạng thái người học → Khoảng thiếu → Learning Path
  → Học + luyện → Bằng chứng → Mastery
       Mastery chưa đạt → quay lại Học + luyện
       Mastery đạt      → Ôn duy trì (FSRS); quên → quay lại Learning Path
  → Bài Can-Do → Sẵn sàng?
       chưa → tính lại Khoảng thiếu
       có   → Đạt mục tiêu (kỳ thi: bằng điểm thi thật)
```

## Các mục được sửa

Bốn mục của spec gốc được sửa cho khớp quyết định của người sáng lập; phần còn lại giữ nguyên.

| Mục | Spec gốc | Bản sửa |
| --- | --- | --- |
| 35. AI khi chạy | Không dùng AI khi chạy | Engine không phụ thuộc AI: mọi chức năng chạy đầy đủ khi không có AI. AI là lớp cắm thêm ở giai đoạn sau (ví dụ chấm Viết/Nói trong gói trả phí), qua một giao diện "người chấm" chung với máy chấm luật và tự chấm |
| 40. Động lực | Không thao túng | Game hoá kiểu Duolingo: năng lượng theo lượt, chuỗi ngày, giải đấu, XP theo hoạt động. Năng lượng trừ theo lượt chứ không theo lỗi, vì engine cố ý cho câu vừa đủ khó; chẩn đoán, ôn đến hạn, bài Can-Do, thi thử không tốn năng lượng |
| 42. Quyền riêng tư và tài khoản | Không cần tài khoản; mã hoá xuất/nhập | Demo web: lưu trên máy + mã đồng bộ hiện có, không tài khoản. Giai đoạn store: tài khoản cho mọi người dùng (đồng bộ, mua gói); vẫn tuân Nghị định 13/2023, đồng ý của cha mẹ với người dưới 16 tuổi, không bán dữ liệu |
| 43. Kinh doanh | Không quảng cáo, không gói trả phí; nghiên cứu B2B | Thuê bao tháng/năm + quảng cáo ở bản miễn phí + giới hạn lượt bằng năng lượng. Demo chạy đủ cơ chế, chưa thu tiền. B2B (trường, trung tâm) là hướng phụ, để sau |

## Quyết định kỹ thuật (mục 50)

Mọi điểm còn mở đều đã có phương án, chạy được khi chưa có dữ liệu người dùng và nâng cấp được khi có. Các con số (ngưỡng, dung lượng năng lượng) là tham số cấu hình, chỉnh được mà không sửa code.

### 1. Mô hình dữ liệu (mục 50.1, 50.6, 50.7)

- **Goal** → **Target Model** có phiên bản (ví dụ `ielts-ac-6.5@1.0`) → danh sách nút cần đạt, mỗi nút kèm **mức cần** (1–5) và **loại yêu cầu** (nền tảng / kỹ năng / làm bài).
- **Nút năng lực**: dùng chung cho mọi mục tiêu. Mỗi nút có kỹ năng, cấp CEFR tham chiếu, thẻ ngữ cảnh (hằng ngày, công việc, du lịch, học thuật, thi).
- **Cạnh tiền đề**: loại *cứng* (phải đạt trước) hoặc *mềm* (giúp học nhanh hơn), độ mạnh 0–1. Mặc định do người soạn đặt (cứng = 1, mềm = 0,5); sau này hiệu chỉnh bằng tỉ lệ "học nút sau thành công khi chưa đạt nút trước".
- **Mục kiến thức** (từ, cụm, ngữ pháp, chức năng giao tiếp, âm) gắn vào nút. **Câu hỏi** gắn vào mục hoặc nút, kèm mức mastery nó đo, dạng câu, ngữ cảnh và xác suất đoán mò.
- Lưu dưới dạng JSON trong `content/engine/`, có schema trong `content/schema/`. CI kiểm: đồ thị không có vòng (sắp xếp tô-pô), mọi nút trong Target Model có đủ câu đo ở mức cần, mọi id tồn tại.
- Trạng thái người học: một nhánh mới trong bản lưu (`st.e`), có số phiên bản và hàm migrate riêng, giống cách `st.x` của phần ôn thi đang làm.

### 2. Mastery (mục 50.2)

Mỗi cặp (nút, mức) giữ một phân phối Beta(α, β). Mỗi lần trả lời cộng bằng chứng, có trừ phần đoán mò g (1/số phương án với trắc nghiệm, 0 với câu tự gõ) và nhầm tay s (mặc định 0,1):

```
đúng: α ← α + w·(1 − g)      sai: β ← β + w·(1 − s)      m = α / (α + β)
```

- w = 1, còn 0,5 khi cùng một câu lặp lại trong 24 giờ (tránh nhớ đáp án).
- Bằng chứng ở mức cao tính luôn cho các mức thấp hơn của cùng nút.
- **Đạt** khi m ≥ 0,8 và cận dưới khoảng tin cậy 80% ≥ 0,6.
- Không cần dữ liệu hiệu chỉnh để chạy. Khi một câu có ≥ 200 lượt trả lời, thay g bằng tham số IRT của câu (`src/exam/irt.ts`).

### 3. Confidence (mục 50.3)

| Mức | Điều kiện |
| --- | --- |
| Thấp | Dưới 3 lượt có trọng số, hoặc cận dưới < 0,5 |
| Vừa | Đạt ngưỡng Mastery, bằng chứng từ 1 dạng câu hoặc 1–2 ngữ cảnh |
| Cao | ≥ 2 dạng câu, ≥ 3 ngữ cảnh, độ lệch chuẩn ≤ 0,1 |

### 4. Mastery theo mục tiêu

Target Model ghi mức cần cho từng nút. Mặc định: nút phục vụ Đọc/Nghe cần tới mức 3 (nhớ ra); nút phục vụ Viết/Nói cần tới mức 4–5 (dùng có kiểm soát / tự do).

### 5. Decay và Memory Maintenance (mục 50.4)

- Mỗi mục kiến thức đã đạt có thẻ FSRS-5 (`src/exam/fsrs.ts`: `review`, `retrievability`).
- Nút vào hàng ôn khi khả năng nhớ trung bình của các mục của nó < 0,85.
- Ôn đạt → giữ Đạt. Ôn trượt 2 lần liền → nút mất Đạt, quay lại Learning Path.

### 6. Đường đi tối thiểu (mục 50.5)

1. Tập thiếu = nút trong Target Model chưa đạt mức cần, cộng mọi tiền đề cứng chưa đạt của chúng (đệ quy).
2. Sắp xếp tô-pô: chỉ nút đã đủ tiền đề cứng mới được mở.
3. Trong các nút đã mở, ưu tiên = số nút mục tiêu phụ thuộc vào nó (có trọng số độ mạnh cạnh) ÷ số phút ước tính để đạt.
4. Buổi học hằng ngày theo số phút: ôn đến hạn trước (tối đa 30% thời gian), rồi nút ưu tiên cao nhất; mỗi tuần ít nhất một bài làm thật (Can-Do).
5. Nhiều mục tiêu cùng lúc: gộp Target Model, lấy mức cần cao nhất của mỗi nút; mục tiêu có ngày thi gần hơn được nhân trọng số ưu tiên.

**Kiểm tra để bỏ qua**: khi lộ trình đưa vào một nút người học thấy đã biết, họ làm một bài kiểm tra ngắn ở mức cần; qua thì nút Đạt ngay. Lý do: 20 phút chẩn đoán không phủ hết vài trăm nút.

### 7. Chẩn đoán

1. **Nghe/Đọc**: bài kiểm tra thích ứng IRT sẵn có (`src/exam/placement.ts`). Kết quả đặt tiên nghiệm cho các nút theo cấp CEFR: nút dưới cấp ước tính Beta(3, 1), trên cấp Beta(1, 3).
2. **Dò đồ thị**: chọn nút có m gần 0,5 nhất và nhiều nút mục tiêu phụ thuộc nhất. Đạt → nâng tiên nghiệm các tiền đề cứng; trượt → dò xuống tiền đề (đây cũng là cách truy gốc rễ, mục 15).
3. Dừng ở 20 phút hoặc khi mọi nút "biên" đạt Confidence Vừa. Phần còn lại dò ngầm trong các buổi học sau.

### 8. Goal Readiness và Goal Achieved (mục 50.15)

| Loại mục tiêu | Readiness | Achieved |
| --- | --- | --- |
| IELTS, VSTEP | Nghe/Đọc: xác suất band ≥ mục tiêu từ IRT ± sai số. Viết/Nói: từ máy chấm luật + tự chấm (mục 10). Tổng: mô phỏng 4 kỹ năng theo cách tính điểm của kỳ thi (`scales.ts`). Sẵn sàng khi xác suất ≥ 80% | Điểm thi thật đạt mục tiêu |
| CEFR, giao tiếp | Tỉ lệ nút cần đã Đạt với Confidence ≥ Vừa, cộng bài Can-Do đã qua | Mọi nút Đạt + mọi bài Can-Do qua + không trượt ôn trong 14 ngày (không có kỳ thi ngoài để đối chiếu) |

### 9. CEFR ↔ IELTS ↔ VSTEP (mục 50.14)

Mỗi kỳ thi có Target Model riêng. Bảng quy đổi có nguồn trong `src/exam/scales.ts` (`bandToCefr`, `bandToVstep`, `vstepToBand`) chỉ dùng để đặt tiên nghiệm và để hiển thị tham khảo, không dùng để kết luận đạt.

### 10. Viết và Nói khi chưa có AI (mục 50.8)

- **Người chấm** là một giao diện chung: máy chấm luật, tự chấm, sau này AI. Mỗi lần chấm trả điểm từng tiêu chí kèm độ tin cậy.
- Luật: `vxWChecks` (độ dài, đoạn, từ nối, lỗi chắc chắn sai), `vxSpeechStats` (tốc độ, vốn từ), `perfEst` (ước tính cấp CEFR từ 5 đặc trưng), `vocabProfile`.
- Tự chấm theo bài mẫu có chú thích từng band; theo dõi độ lệch của người tự chấm so với điểm thật và trừ độ lệch đó.
- Readiness Viết/Nói được giới hạn ở Confidence Vừa cho tới khi có người chấm AI hoặc cặp điểm thật.

### 11. Kiếm tiền trong demo (mục 50.11)

- **Năng lượng theo lượt**: mỗi bài học mới hoặc luyện tập tốn năng lượng như nhau, đúng hay sai không đổi; hồi theo thời gian; hết thì dừng học mới. Không trừ theo lỗi vì engine cố ý cho câu vừa đủ khó (đúng 75–85%): 5 tim trừ theo lỗi sẽ hết sau 20–33 câu. Dung lượng, chi phí mỗi bài và tốc độ hồi là tham số cấu hình. **XP** tính theo hoạt động (số bài, số phút) như Duolingo, hiển thị tách khỏi Readiness.
- **Không tốn năng lượng**: ôn tập đến hạn, chẩn đoán, bài Can-Do, đề thi thử (để không làm sai phép đo).
- **Gói Super giả lập**: công tắc trong Cài đặt; bật thì không giới hạn năng lượng, không quảng cáo.
- **Quảng cáo giả lập**: ô quảng cáo ở màn kết quả bài học (bản miễn phí).
- Ghi số liệu trên máy: số lần hết năng lượng, số phút bị chặn, để đo ảnh hưởng lên việc học của người sáng lập.
- Tái dùng mẫu `st.money` từng có ở v16–v17 (xem `migrate()` trong `app.js`).

### 12. Tài khoản và đồng bộ (mục 50.12)

Demo: lưu trên máy + mã đồng bộ `ELK-…` hiện có. Giai đoạn store: Supabase Auth, chuyển dữ liệu từ mã đồng bộ sang tài khoản, thanh toán qua cửa hàng. Chọn cách đóng gói (TWA hay app gốc) ở M8.

### 13. Các điểm còn lại

- **Kho từ vựng** (mục 50.13): bắt đầu từ `content/wordlist.json` (9.345 mục, đã gắn cấp CEFR), bổ sung theo bảng phủ từng nút.
- **Chiến thuật làm bài** (mục 50.9): là nút kỹ năng riêng trong Target Model kỳ thi, không thay nút năng lực.
- **Quy mô MVP** (mục 50.10): đủ 4 nhóm mục tiêu theo quyết định của người sáng lập; lộ trình M1–M8 bên dưới.

## Tái dùng app hiện tại

Engine được xây thành mô-đun TypeScript mới `src/engine/`, nối với app qua giao diện Host giống `src/exam/host.ts`. Phần lớn nền móng đã có sẵn:

| Phần engine | Dùng lại | Vị trí |
| --- | --- | --- |
| Nút Can-Do CEFR | Danh sách "Tôi có thể…" theo cấp × kỹ năng, nhóm năng lực | `CANDO`, `skPass`, `skLv` trong `app.js` |
| Nút kỹ năng thi | 26 dạng câu IELTS/VSTEP, bài học, ~1.350 câu có giải thích | `content/exam/types/`, `content/exam/practice/` |
| Mục từ vựng | 9.345 từ đã gắn cấp CEFR | `content/wordlist.json` |
| Bài học nền A1–C2 | Từ vựng, ngữ pháp, chức năng, đọc, nghe | `app.js`, `data/lv-*.json` |
| Chẩn đoán Nghe/Đọc | IRT 3PL thích ứng, 96 câu | `src/exam/irt.ts`, `src/exam/placement.ts` |
| Decay | FSRS-5 | `src/exam/fsrs.ts`, `src/exam/notebook.ts` |
| Kế hoạch theo ngày thi | Giờ cần theo band (Cambridge GLH), cảnh báo không kịp | `src/exam/plan.ts` (`hoursAt`, `makePlan`) |
| Quy đổi điểm | IELTS, VSTEP, CEFR có nguồn | `src/exam/scales.ts` |
| Chấm Viết/Nói bằng luật | Độ dài, từ nối, lỗi, tốc độ nói, cấp CEFR | `vxWChecks`, `vxSpeechStats`, `perfEst`, `vocabProfile` trong `app.js` |
| Bài làm thật (Can-Do) | 7 đề thi thử, thi thử Viết/Nói VSTEP, 24 hội thoại mở, nhắc lại câu | `src/exam/mock.ts`, `app.js` |
| Kiểm nội dung | Schema, đáp án, phép thử "không có bài" chống đoán mò | `tools/content-check.ts`, `content/AUTHORING.md` |
| Thống kê câu, cặp điểm thật | Độ khó thật, độ chính xác ước tính | `src/exam/net.ts`, bảng `el_resp`, `el_pair` trên Supabase |
| Game hoá | Chuỗi ngày, XP, giải đấu tuần, linh vật | `app.js`, bảng `el_league` |
| Đồng bộ | Mã `ELK-…`, sao lưu | `syncRpc`, `syncNow` trong `app.js` |

Cái cần viết mới: đồ thị + Target Model, trạng thái mastery/confidence, dò đồ thị, Learning Path, Readiness, năng lượng/Super/quảng cáo giả lập, và nội dung cho các nút còn thiếu.

## Lộ trình xây

Tám mốc theo thứ tự phụ thuộc, không hạn ngày; mỗi mốc chỉ xong khi đạt tiêu chí.

**Giai đoạn demo web (chưa thu tiền)**

| Mốc | Tiêu chí xong |
| --- | --- |
| M1 · Mô hình nội dung | Schema + đồ thị từ nội dung sẵn có; CI báo 0 vòng lặp, 0 id lạc |
| M2 · Trạng thái người học | Mastery + Confidence + FSRS chạy; bản lưu cũ migrate không mất dữ liệu |
| M3 · Chẩn đoán dò theo đồ thị | Xong trong 20 phút; mọi nút biên của mục tiêu đạt Confidence Vừa |
| M4 · Learning Path + Memory Maintenance | Màn "Bước tiếp theo" tự xếp buổi học; nút đã đạt chuyển sang ôn duy trì |
| M5 · Bài Can-Do + Goal Readiness | Readiness cho đủ 4 nhóm mục tiêu, kèm khoảng tin cậy |
| M6 · Lấp nội dung | Mọi nút của mọi Target Model có đủ câu đo ở mức cần, qua phép thử đoán mò |
| M7 · Kiếm tiền giả lập | Năng lượng theo lượt, Super, quảng cáo giả chạy; số phút bị chặn được ghi lại |

**Cổng: điểm thi thật của người sáng lập đạt mục tiêu**

**Giai đoạn store**

| Mốc | Tiêu chí xong |
| --- | --- |
| M8 · Lên store | Tài khoản cho mọi người, thanh toán thật, Google Play |

Từ M4, người sáng lập học hằng ngày bằng engine; những chỗ vướng khi học quyết định thứ tự lấp nội dung ở M6.

## Giới hạn thực tế

Bốn điều engine không làm được trong giai đoạn demo, ghi thẳng để không ai hiểu sai.

1. **Demo kiểm chứng trải nghiệm, chưa kiểm chứng độ chính xác.** Với một người dùng, mọi tham số (độ mạnh tiền đề, ngưỡng mastery, độ khó câu) là giả định của người soạn; chỉ hiệu chỉnh được khi có nhiều người dùng.
2. **Điểm thi của người sáng lập chứng minh người sáng lập học được, không chứng minh engine đúng.** Cỡ mẫu là 1, và việc duyệt nội dung hằng ngày cũng là học. Dùng được làm câu chuyện, không dùng làm bằng chứng độ chính xác.
3. **Trước khi có AI, engine không tự tuyên bố sẵn sàng cho Viết/Nói mức cao.** Luật biết người học *có dùng* một từ hay cấu trúc, không biết dùng *đúng và tự nhiên*; mức 5 (dùng tự do) chỉ đạt Confidence Vừa.
4. **Nội dung quyết định thời gian, không phải code.** Ước tính thô 10.000–20.000 câu cho 4 nhóm mục tiêu (hiện ~1.350 câu ôn thi); câu AI viết cần 2–3 vòng soát chống đoán mò (`content/AUTHORING.md`). M6 là mốc dài nhất.

## Rủi ro đã ghi nhận

Các rủi ro dưới đây được theo dõi trong lúc xây, không dùng để đổi hướng đã chốt.

| Rủi ro | Dấu hiệu theo dõi | Cách giảm |
| --- | --- | --- |
| Khối lượng nội dung cho 4 nhóm mục tiêu rất lớn | Bảng phủ: số nút chưa đủ câu đo ở mức cần | Nút dùng chung giữa các mục tiêu; lấp theo thứ tự Learning Path của người sáng lập |
| Đợi engine làm lùi ngày học, ngày thi và doanh thu | Thời gian từ nay tới khi M4 chạy | Xây M1–M4 trước, nội dung chỉ đủ cho mục tiêu của người sáng lập rồi mới mở rộng |
| Độ mạnh tiền đề do người soạn đoán | Người học trượt nút sau dù đã đạt nút trước | Hiệu chỉnh từ dữ liệu khi có; ghi lại lý do mỗi lần sửa |
| Readiness Viết/Nói kém tin cậy khi chưa có AI | Chênh lệch tự chấm với điểm thật | Giới hạn Confidence ở Vừa; nói rõ trên màn hình |
| Năng lượng làm chậm việc học của chính người sáng lập | Số lần hết năng lượng, số phút bị chặn mỗi tuần | Công tắc Super giả lập; điều chỉnh dung lượng và tốc độ hồi |
| XP theo hoạt động kéo người học đi cày XP thay vì lấp khoảng thiếu | Tỉ lệ phút học ngoài Learning Path | Nút chính luôn là "Bước tiếp theo"; Readiness hiển thị ngang hàng XP |
| Điểm trong app của người sáng lập bị thổi phồng vì đã duyệt nội dung | Điểm app cao hơn đề ngoài | Đo mốc bằng đề ngoài chưa từng xem trước khi đăng ký thi thật |
| `app.js` lớn (3,8 MB) làm chậm máy yếu | Thời gian mở app trên Android rẻ | Engine viết thành mô-đun riêng, nội dung tải theo nút |

## Lộ trình v2.4 (từ 08/10/2026)

Mỗi mốc một PR, chấm lại 200 + 400 tiêu chí sau mỗi mốc.

| Bản | Mốc | Tiêu chí xong |
| --- | --- | --- |
| v52 | Chốt hướng: chỉ CEFR + Pre-A1 | Mục tiêu ngoài CEFR ở trạng thái tương lai, tab Ôn thi ẩn; mục tiêu Pre-A1; bài Pre-A1 là bằng chứng |
| v53 | Evidence L0–L4 | Observation, Evidence Evaluator, Ledger theo giá trị, Aggregate bảo toàn thông tin, Beta là trạng thái dẫn xuất tính lại được |
| v54 | Decision Snapshot | Quyết định quan trọng có snapshot, tái tạo được; màn "Vì sao?" |
| v55 | Mastery v3 | Phân vị Beta chính xác, giảm theo thời gian, trạng thái nút, model disagreement, misconception |
| v56 | Mô phỏng learner | 10 Scenario + 20 Meta-Test chạy tự động; báo cáo calibration, FP/FN |
| v57 | Knowledge/Graph | Universal Language Core, rationale/version cạnh, tiền đề thay thế, kiểm orphan/unreachable |
| v58 | Chẩn đoán liên tục | 5 chế độ, giá trị thông tin ÷ nỗ lực, truy gốc theo cạnh |
| v59 | Gap + NBA | 8 loại gap, utility §57, luật retention §58 |
| v60 | Transfer | Câu/ngữ cảnh mới, thất bại transfer → disagreement |
| v61 | Micro-learning | Chính sách ngắt §53, giải thích → luyện → kiểm lại → về game |
| v62 | Game Ladder Quest | Game Challenge Model, học ẩn trong game, tách kỹ năng game khỏi ngôn ngữ |
| v63 | Đo hiệu quả + chấm lại | Bộ câu giữ riêng đo trước / sau / trễ 7 và 30 ngày, nhãn A/B khi đồng ý; `npm run score` chấm lại 200 + 400 tiêu chí từ dữ liệu có test chứng minh (`docs/SCORE.md`) |
| v64 | Goal-first + Ladder Quest là màn chính | Bài dò ngắn → mục tiêu CEFR tự đặt (đổi được); mọi lối vào đều có mục tiêu; tab Chơi là màn mặc định |
| v65 | Lỗ hổng → cách sửa | remedy.ts quyết định câu theo loại lỗ hổng; nguy cơ quên từ FSRS; cờ trong game; Đạt CEFR đòi transfer (có miễn) |
| v66 | Chất lượng bằng chứng (m3.2) | Độ khó câu, ≥ 2 câu khác nhau, câu trùng nội dung, mệt; kiểm toán trôi model, ước lượng slip/guess, độ nhạy trọng số |
| v67 | Mô hình nội dung | Bản đồ câu → nút (28.114 câu, 0 mồ côi), phiên bản từng câu, nút âm vị + chức năng giao tiếp, tiền đề thay thế, Readiness theo mô hình dữ liệu |
| v68 | Chấm lại | `npm run score` trên dữ liệu chấm mới (`docs/SCORE.md`) |
| v69 | Bot người học L01 (người mới hoàn toàn) | `tools/learners/l01.ts` chơi app qua giao diện 44 ngày mô phỏng; luật m3.3 (nhớ lại cách quãng gỡ kẹt xác minh, Claim chỉ thành Đạt bằng bằng chứng thật), ôn từ sổ bằng chứng, tháp giãn cách + dạy trước + câu thử sau trại, chẩn đoán trừ đoán mò; báo cáo `reports/learners/L01/REPORT.md` |
| v70 | Bot người học L02 (người học yếu) | Lõi bot chung (`tools/learners/core.ts`); lỗ hổng từ bằng chứng (hiểu sai theo mẫu lỗi, thuộc câu → transfer, chưa có bằng chứng → hỏi thử), bí kíp nhắm đúng hiểu sai trong tháp, leo thang khi can thiệp chưa hiệu quả, ôn phần đang học, bớt dò khi sai nhiều, điểm nghẽn trên tháp, nghe phân biệt âm trong tháp; báo cáo `reports/learners/L02/REPORT.md` |
| v71 | Bot người học L03 (người học trung bình) | Mục tiêu người học chọn đứng đầu (mục tiêu tự đặt giữ làm bậc đệm); bài dò tìm trần nhận ra và dò tiếp khi còn đang lên cấp; Claim kiểm ở đúng mức đã suy ra, xác nhận xong từng phần; khám phá theo độ phủ vùng kỹ năng (nghe); điểm nghẽn = yếu × quan trọng, ưu tiên trong tầng; người học đúng ≥ 85% → hỏi thẳng mức cần, nới lượt/nút/ngày; không lùi về câu mức thấp đã Đạt; báo lên cấp cuối tầng; báo cáo `reports/learners/L03/REPORT.md` |
| v72 | Sảnh Chơi + Xếp Khối Chữ | Sảnh "Chơi" nhiều game (tháp thành "Leo nhanh"); Xếp Khối Chữ: bàn 8 × 8, mỗi bộ khối có sau một câu do engine chọn (ưu tiên rương ôn), đúng thì thêm bom / sét, sai vẫn nhận khối, cứu bàn 2 lần để ván không ngắn lại; hình khối theo seed độc lập với câu (P14); điểm / kỷ lục / chuỗi ngày là telemetry `e.bk`; âm thanh WebAudio tự tạo; test chặn tên thương hiệu game khác trong tệp phát hành |
| v73 | Bàn Cờ Phố | Bàn vòng 16 ô (Nhà, ô cảnh, 4 lô đất), 8 lượt tung / lần chơi; xúc xắc chỉ quyết định loại cảnh, nội dung do bộ chọn chung `picker` (tách từ `planFloor`, thứ tự NBA giữ nguyên dù đi đường nào); xây / nâng nhà bằng xu (ví = xu kiếm được − xu đã tiêu), đi qua nhà mình / về Nhà được thêm xu, không bao giờ trừ xu; telemetry `e.bd`; bot luân phiên 3 game |
| v74 | Bài Câu (F3 ngữ pháp) | Lá bài = từ của câu ngữ pháp do engine chọn (`picker`, nút g:, `app.js eOrder`: câu sắp xếp / câu tự gõ đã điền / câu sửa đúng + lá bẫy từ đáp án sai hay gặp); tự dựng câu = bằng chứng mức 3 (g = 0); 3 bàn × 3 lượt, chip × nhân, bùa chọn sau mỗi bàn; thua bàn không kết thúc ván; telemetry `e.gc` |
| v75 | Quán Cà Phê (F5 nghe + F7 giao tiếp) | 6 khách / ca; câu của nút fn: (`app.js eFn`): nghe khách nói bằng giọng máy → chọn nghĩa (mức 2), tình huống + văn phong → chọn câu đáp (mức 3), luôn 4 lựa chọn; sao + đồ trang trí quán; telemetry `e.gq` |
| v76 | Bắt Âm (F4 phát âm) | Nghe một từ của cặp âm, chạm đúng 1 trong 3 bong bóng (đoán mò 1/3); câu nghe phân biệt âm dùng chung đổi từ 2 → 3 lựa chọn; không hết giờ, bong bóng đứng yên khi chạm; sai thì nghe lại hai từ của cặp + mẹo khẩu hình; telemetry `e.gs`; sảnh Chơi nhóm theo mục đích học |
| v77 | Câu đố ngày (F10 ôn tập + F2) | 16 ô từ của 4 cụm (u:) do engine chọn (ôn → đang học → lộ trình), mỗi cụm một họ chủ đề khác (`puzzle.ts family`); ghép nhóm không vào năng lực; sau mỗi nhóm nhớ lại một từ khác của cụm (tự gõ mức 3 nếu đã học, chọn trong 4 mức 2 nếu mới); không giới hạn lượt nộp; câu đố mỗi ngày + ván luyện thêm; telemetry `e.gd` |
| v78 | Thám tử (F6 đọc + F11) | Một bài đọc đúng cấp đang học (`app.js eTexts`: văn bản đời thường, bài dài, bài của unit), chưa làm trước, bài của unit đã học trước; mỗi câu hỏi là một manh mối (3 lựa chọn), câu ý chính là kết luận; sai thì tô sáng câu chứa đáp án + vì sao + thử lại không tính điểm; chạm từ để xem nghĩa; điểm lưu như tab Đọc (Can-Do); telemetry `e.gt` |
| v79 | Đài phát thanh (F5 nghe đoạn) | Cùng lõi với Thám tử nhưng nghe cả bài bằng giọng máy (hai giọng), lời ẩn tới cuối, nghe lại / chậm không giới hạn; điểm lưu như tab Nghe (Can-Do); máy không có giọng thì ẩn game; telemetry `e.gr` |
| v80 | Bắt Âm: vòng nói thử (F4) | Sau mỗi từ có nút "Nói thử" (máy nghe giọng của app, `asrBox`): máy nghe ra đúng từ hay từ kia của cặp âm; đúng +5 điểm (telemetry, không vào năng lực); máy không nghe được giọng thì ẩn |
| v81 | Karaoke hội thoại (F8 nói) | Hội thoại đúng cấp đang học (chưa đóng vai, có chức năng đang học); người học nói vai B, máy đọc vai A; máy nghe khớp từ hoặc tự chấm; kết quả lưu như màn Đóng vai (Can-Do nói); không ghi bằng chứng vào nút; telemetry `e.gk` |
| v82 | Xưởng sửa câu (F3 + F9) | Câu sai hay gặp (`fx`) của điểm ngữ pháp do engine chọn; tự gõ lại câu đúng = bằng chứng mức 4 (g = 0); sai thì tô từ cần sửa + vì sao; 6 đơn / ca; telemetry `e.gw` |
| v83 | Thư gửi cư dân phố (F9 viết đoạn) | Đề viết (`WTASKS`) đúng cấp đang học, chưa viết trước; máy kiểm thư `writeChecks` + lỗi hay gặp; cư dân hồi âm (đạt như màn Viết theo đề → quà, thiếu → hỏi lại đúng mục); tự chấm 4 tiêu chí; lưu như màn Viết theo đề (Can-Do viết); telemetry `e.gl` |
| v84 | Ra lệnh cho robot (F8 nói + F2) | Lưới 5 × 5, đồ vật là hình của từ thuộc cụm do engine chọn; lệnh tiếng Anh nói (máy nghe tự do) hoặc gõ; robot chỉ nhặt khi gọi đúng tên; không vào mức thuộc; telemetry `e.gb` |
| v85 | Tốc độ 60 giây / Ghép cặp | Nguồn từ: đến hạn ôn trước, rồi từ mới học (thay cho ngẫu nhiên); ghép nhầm giải thích nghĩa cả hai từ |
| v86 | Thám hiểm sương mù (F1 xếp lớp) | Bài chẩn đoán dạng bản đồ 4 × 4: người chơi chọn đường Từ vựng / Ngữ pháp, engine chọn điểm dò; ô mở dù đúng hay sai (không thưởng câu đúng); một đường đủ nửa thì khoá; kết quả = màn chẩn đoán; 7 ngày một lần; telemetry `e.gf`. Từ v86 app chỉ tập trung CEFR: game luyện thi (F12) bỏ khỏi kế hoạch |
| v87 | Vườn từ (F2 từ mới) | Từ mới của cụm do engine chọn: hạt (thẻ dạy trước: hình, IPA, âm, câu ví dụ) → mầm (nhận ra, mức 1) → cây (nhớ ngược, mức 2) → hoa (tự gõ, mức 3); một bậc / ngày; sai giữ bậc + xem lại thẻ; bậc cây trong `e.gv` |
| v88 | Bộ não chọn game (director) | Sảnh không còn bắt người học tự chọn trong 15 game: `director.ts` đọc nhu cầu học lúc này (chưa xếp lớp, cây đến ngày tưới, phần sắp quên, loại nút đầu lộ trình NBA, điểm nghẽn, Can-Do kỹ năng còn thiếu, máy có giọng đọc / máy nghe) → một nút "▶ Chơi tiếp" kèm lý do + lộ trình 3 chặng / ngày (mỗi chặng một nhu cầu, tối đa một chặng kỹ năng); đổi dạng sau mỗi game; màn kết mọi game có "▶ Tiếp"; danh sách game thu gọn trong "Tất cả trò chơi"; snapshot `dir` cho Vì sao?; trạng thái `e.gp` |
| v89 | Trục trải nghiệm T + Phố chung | `docs/GAME-CRITERIA.md` §8–§9 (đối chiếu spec ở §9.0): trục T tách khỏi trục học, phục vụ North Star, không tối ưu thời gian trong app; `play.ts` đo theo game: bỏ giữa, chơi tiếp sau ván (Persistence C336), câu bằng chứng / phút (C341, C360), giây tới thao tác đầu, thời lượng (tier 0, chỉ ở máy, `st.e.pm`); `town.ts` Phố chung 15 công trình × 4 ★ suy ra từ bản lưu từng game (không thêm dữ liệu), màn kết báo Phố mới + mốc gần nhất; Tí dẫn đường; âm Leo tháp; Tốc độ 60 giây / Ghép cặp thu vào Trò nhanh (cũ) |
| v90 | Quyết định là hành động tiếng Anh (đợt 2 phần 1) | Quán: khách phản ứng theo loại câu đáp (đúng việc + văn phong / lệch văn phong / sai việc), tiền boa theo văn phong hợp (`eFn` thêm `react`, `regs`; đúng / sai vẫn theo đáp án); Xưởng: chạm chỗ hỏng trước khi gõ (dãy con chung dài nhất; chạm sai → câu gõ sau là có gợi ý) |
| v91 | Xu chung có chỗ tiêu | Trang trí Phố (4 món / công trình, mở theo ★, `st.e.tw`), hồi tim Leo tháp bằng 25 xu một lần mỗi tầng; ví = xu kiếm − xu Bàn Cờ − xu Phố; màu `--bad` đạt WCAG AA trên nền báo sai |
| v92 | Game tiếp nhận / trình diễn nâng bằng trình bày | Thám tử / Đài: bảng manh mối (câu đúng ghim đáp án, câu kết luận ghép từ các mảnh), biên bản vụ án / ghi chép bản tin ở màn kết; Karaoke: màn biểu diễn (mức máy nghe ra từng câu, câu hay nhất, câu nên luyện lại, nghe mẫu); chặng đã xong của lộ trình đạt WCAG AA |
| v93 | Game chủ lực Vòng Chữ (GAME-CRITERIA §10.5) | Vuốt chữ thành từ trên canvas toàn màn hình (lớp phủ ngoài #app, 60 fps, vuốt / bàn phím / ô gõ, âm theo chữ, nhạc nền tắt được, hướng dẫn lần đầu); màn dựng từ cụm u: do bộ chọn chung đưa ra + kho 6.343 từ đơn của app (`host.lexicon`); bằng chứng mức 2 chỉ ở ô của cụm engine chọn (gợi ý → có trợ giúp / sai); đường cong độ khó theo màn, 6 chương; thử thách ngày + chia sẻ; bộ não chọn game ưu tiên cho ôn từ; Phố có công trình mới; `st.e.gh`; bot `playWheel` |
| v94 | Vòng Chữ: chiều sâu, sưu tập, phong cảnh | Combo nhân xu, ô vàng (ưu tiên ô của cụm engine chọn), hũ từ thưởng đổi gợi ý miễn phí; sổ từ theo chương (chạm để nghe); phong cảnh canvas động cho 6 chương; chuỗi ngày thử thách ngày; `st.e.gh.book / jar / free / daily.streak` |
| v95 | Game chủ lực thứ hai Mỏ Chữ (GAME-CRITERIA §10.7) | Lưới chữ 6 × 7 canvas toàn màn hình, vuốt ô kề nhau (cả chéo) thành từ; ô vỡ, chữ rơi, lấp từ trên; nhiệm vụ = từ của cụm u: do bộ chọn chung đưa ra, luôn có đường (gieo lại khi bị phá); giới hạn lượt (không đồng hồ), từ sai không tốn lượt; đá quý vỡ hàng, ô vàng, chuỗi; bằng chứng mức 2 chỉ ở nhiệm vụ của cụm; mỏ hôm nay + chuỗi ngày + chia sẻ; `st.e.gn`; bot `playHunt` |
| v96 | Mỏ Chữ: mục tiêu kiểu ghép 3, màn mốc, sổ từ chung (GAME-CRITERIA §10.8) | Mục tiêu theo màn: tìm từ / phá băng / đưa rương xuống đáy (từ màn 4); màn mốc 10, 20… có băng hình vẽ tay; thắng = đủ từ nhiệm vụ + xong mục tiêu, gợi ý chuyển sang từ ngắn có trên lưới nên không kẹt; mục tiêu cũng ở DOM cho trình đọc màn hình; từ nhiệm vụ vào sổ từ chung (chương ⛏️ Mỏ Chữ); bộ não xen kẽ hai game chủ lực theo game chơi gần nhất (`flag`), kể cả trong lộ trình ngày; băng / rương không ghi bằng chứng |
| — | Tiêu chí game theo chức năng | `docs/GAME-CRITERIA.md`: 13 chức năng học của app; 10 tiêu chí chung (G1–G10, thang 10, trọng số; bắt buộc G3 ≥ 8 và G9 ≥ 8) + tiêu chí riêng theo chức năng; chấm 5 game hiện có (Leo tháp 7,1 · Xếp Khối 7,6 · Bàn Cờ 7,1 · Tốc độ 60 giây 5,6 · Ghép cặp 5,9); thứ tự game nên làm tiếp |
