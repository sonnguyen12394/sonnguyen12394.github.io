# English Ladder

Học tiếng Anh A1 → C2 miễn phí, mỗi lỗi sai được giải thích bằng tiếng Việt.

👉 **https://sonnguyen12394.github.io/**

## Có gì

- Từ vựng A1 → C2 và danh sách từ học thuật (AWL), ôn cách quãng để nhớ lâu.
- Ngữ pháp, chức năng giao tiếp, hội thoại, đọc, viết, phát âm theo khung CEFR, kèm các câu "can-do": biết mình làm được gì ở từng cấp.
- Luyện nghe: chép chính tả cả câu, nghe chọn nghĩa, nghe rồi chọn câu đáp (từ 525 câu thoại).
- Luyện nói với máy nghe giọng của trình duyệt (tự chọn bật), nói nhại (shadowing) có tô màu từ máy nghe ra.
- Đóng vai bằng câu của chính mình: máy so các ý chính với câu mẫu (không dùng AI).
- Bài viết có hồ sơ từ vựng CEFR (tỉ lệ từ mỗi cấp A1–C2, độ đa dạng từ).
- Thi thử VSTEP rút gọn (Nghe + Đọc, có tính giờ, B1→C1) và ước tính bậc.
- Giải đấu tuần ẩn danh: nhóm 30 người, 5 hạng từ Đồng tới Kim cương.
- Đồng bộ nhiều máy bằng mã, không cần tài khoản (tự chọn bật).
- Nhắc học hằng ngày bằng thông báo (Web Push, kể cả iPhone đã cài app), chạy khi mất mạng.
- Công cụ lớp học cho giáo viên: gộp tiến độ cả lớp từ file dữ liệu ẩn danh, không cần máy chủ.

## Cài như ứng dụng

- **Android (Chrome/Edge):** mở link → menu ⋮ → *Cài đặt ứng dụng* / *Thêm vào Màn hình chính*.
- **iPhone/iPad (Safari):** mở link → nút Chia sẻ → *Thêm vào MH chính*.
- **Máy tính (Chrome/Edge):** biểu tượng cài đặt ở thanh địa chỉ.

Sau lần mở đầu có mạng, app dùng được khi mất mạng.

## Quyền riêng tư

Không tài khoản, không theo dõi. Tiến độ lưu trên máy bạn. Xem [chính sách quyền riêng tư](https://sonnguyen12394.github.io/privacy.html).

## Góp ý, giáo viên và trường học

Mở một mục tại [Issues](https://github.com/sonnguyen12394/sonnguyen12394.github.io/issues).

## Đưa lên Google Play (ghi chú cho chủ app)

App là PWA đủ điều kiện đóng gói Trusted Web Activity:

1. Vào https://www.pwabuilder.com, nhập `https://sonnguyen12394.github.io/`, chọn *Package for stores → Android*.
2. Tải gói về, giữ kỹ file khoá ký (keystore).
3. Đặt `.well-known/assetlinks.json` (PWABuilder tạo sẵn, chứa SHA-256 của khoá ký) lên repo này để bỏ thanh địa chỉ trong app.
4. Tạo tài khoản Google Play Console, tải file `.aab` lên, dùng link chính sách quyền riêng tư ở trên.

## Máy chủ (Supabase)

Thư mục `supabase/` chứa migration của bản v19–v20 (bảng + hàm RPC cho giải đấu tuần, thông báo nhắc học và gom câu báo lỗi; xem báo lỗi bằng `select * from el_admin.flags;`) và Edge Function `el-remind` gửi lời nhắc (pg_cron 15 phút/lần). Khoá VAPID và bí mật cron nằm trong Supabase Vault, không nằm trong repo.

## Bản quyền

Xem LICENSE (giữ mọi quyền).
