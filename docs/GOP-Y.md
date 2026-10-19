# 💬 Góp ý: gửi và xử lý (v167)

Soạn 19/10/2026. Người sáng lập: "trong quá trình học muốn có nút góp ý để gửi ý kiến cũng như hình ảnh nếu cần, rồi sẽ tổng hợp lại xử lý". Tự soạn, chưa người thật kiểm.

## Gửi
- Nút **💬** ở thanh đầu trang (mọi màn). Lúc đang làm bài, thanh đầu trang ẩn nên có **nút 💬 nổi ở góc dưới phải**.
- Chọn loại: 🐞 Lỗi · 🤔 Khó hiểu · 💡 Ý tưởng · 📝 Khác. Gõ vài chữ (bắt buộc). Thêm tới 3 ảnh: trên iPhone chụp màn hình trước, rồi chọn ở 📷 Thêm ảnh.
- Tấm góp ý đè lên màn đang học: đóng lại là về đúng câu đang làm, không mất lượt.
- App tự kèm **bối cảnh** (`ctx`): màn, tiêu đề, lượt (`sk`), câu đang làm (`item`, `prompt`), unit / bài ngữ pháp, đường ⚡ / 📘, cấp, ngày học, loại máy, cỡ màn hình.
- Mất mạng: lưu trên máy, có mạng tự gửi. Màn Tôi → Góp ý có danh sách "Góp ý đã gửi" (số #id để đối chiếu).

## Lưu ở đâu
Project Supabase `english-ladder`:
- Bảng `public.el_gopy`: `id`, `at`, `kind` (loi / kho / y / khac), `txt`, `ctx`, `imgs` (đường dẫn ảnh trong kho), `imgd` (ảnh dự phòng dạng data URL khi tải lên kho không được), `status` (moi / dang / xong / bo), `note` (ghi chú xử lý), `kid` (nối với nhật ký học nếu đã bật mã đồng bộ), `dev`, `app_v`.
- Kho ảnh riêng tư `el-gopy` (Storage): app chỉ tải lên, không đọc, không liệt kê. Xem ảnh: Supabase → Storage → `el-gopy` → thư mục theo tháng.
- App chỉ ghi (`el_gopy_post`, kiểm loại, độ dài, ≤ 3 ảnh, ≤ 30 góp ý / giờ / máy). Migration: `supabase/migrations/20261019100000_gopy.sql`.

## Xử lý (gợi ý mỗi tuần một lần)
1. Lấy góp ý mới:
   ```sql
   select id, at, kind, txt, ctx->>'h1' man, ctx->>'item' cau, ctx->>'prompt' de_bai, imgs, cardinality(imgd) anh_du_phong, app_v
   from el_gopy where status = 'moi' order by at;
   ```
2. Nhóm theo chỗ (cùng màn / cùng câu) và theo loại; lỗi chặn việc học sửa trước.
   ```sql
   select kind, coalesce(ctx->>'item', ctx->>'view') cho, count(*) n, min(id) vi_du from el_gopy where status = 'moi' group by 1, 2 order by n desc;
   ```
3. Đánh dấu khi bắt đầu / xong:
   ```sql
   update el_gopy set status = 'dang', note = 'sửa ở v167' where id in (1, 2);
   update el_gopy set status = 'xong' where id = 1;
   ```
4. Có thể nhờ Claude: "đọc góp ý mới trong el_gopy, nhóm lại, đề xuất cách sửa". Claude đọc được chữ và bối cảnh qua Supabase; ảnh thì bạn mở trong Storage (Claude chưa xem được ảnh từ đây).

## Rủi ro
- Ảnh chụp màn hình có thể lộ thông tin trên máy (thông báo, tên). Cắt ảnh trước khi gửi nếu cần.
- Ảnh dự phòng (`imgd`) nằm trong bảng, nặng; nếu thấy nhiều thì kho ảnh đang lỗi, cần xem lại quyền tải lên.
