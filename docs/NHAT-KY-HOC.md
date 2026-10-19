# Nhật ký học: ghi và phân tích (v166)

Soạn 19/10/2026. Người sáng lập: "lưu dữ liệu tất cả thao tác hoặc chỉ số khi học của tôi khi test để sau này phân tích". Tự soạn, chưa người thật kiểm.

## Bật thế nào
Tôi → Cài đặt → **Ghi dữ liệu học để phân tích** → *Bật ghi dữ liệu học*.
- Bật sẽ tự tạo **mã đồng bộ** `ELK-…` nếu chưa có. Ghi lại mã này: nó là cách duy nhất để tìm dữ liệu của bạn trên máy chủ.
- Dùng nhiều máy: trên máy thứ hai, nhập cùng mã ở phần Đồng bộ rồi bật ghi. Mỗi máy có mã máy riêng (`dev`) nên vẫn phân biệt được.
- Mặc định tắt. Tắt lúc nào cũng được; hàng chờ chưa gửi bị xoá.
- Xoá hết dữ liệu trên máy chủ: phần Đồng bộ → *Xoá tiến độ trên máy chủ*.

## Ghi những gì
Bảng `public.el_log` trong project Supabase `english-ladder`. Mỗi dòng có các cột:

| Cột | Ý nghĩa |
|---|---|
| `kid` | băm SHA-256 của mã đồng bộ (máy chủ không giữ mã gốc) |
| `dev` | mã ngẫu nhiên của máy |
| `app_v` | số bản app |
| `at` | giờ trên máy lúc xảy ra |
| `day` | ngày học theo app (`today()`) |
| `k` | loại dòng, xem bảng dưới |
| `d` | chi tiết (JSON) |

| `k` | Khi nào | `d` có |
|---|---|---|
| `ans` | mỗi câu trả lời ở mọi nơi trong app (đi qua `eEv`) | `node` (u:unit / g:ngữ pháp / fn: / ph:), `lv` mức 1–5, `ok` 0/1, `item`, `qt` dạng câu, `ctx`, `src`, `g` xác suất đoán, `rt` ms, `giv` câu bạn gõ / máy chép lời (≤ 120 ký tự), `sk` đang ở lượt / màn nào |
| `go` | đổi màn | `v` màn mới, `from` màn cũ |
| `evc` | sự kiện app (bắt đầu / xong lượt `s:…` / `d:…`, bật đồng bộ…) | `e` |
| `snap` | lần ghi đầu mỗi ngày | `A1` / `A2`: `learn`, `mem`, `total` (hai thanh Mục tiêu); `fast`: `path`, `ch` (số chặng đã làm), `gap` (số chỗ lủng); `due`, `gdue`, `units`, `gram`, `xp`, `streak` |

**Không ghi:** tên, email, tài khoản, giọng nói (chỉ lời máy chép).

**Cách gửi:** hàng chờ ở `localStorage` (tối đa 5 000 dòng), gửi theo lô 200 dòng sau 20 giây yên, và gửi nốt khi đóng / chuyển app. Mất mạng thì gửi bù sau. Máy chủ chỉ nhận ghi qua hàm `el_log_post` (`security definer`, kiểm mã, tối đa 300 dòng / lần, 20 000 dòng / giờ / mã); app không đọc lại được bảng.

Toàn bộ tiến độ (bản sao nén) vẫn ở `sync_blob` như trước, khi bật đồng bộ.

## Phân tích
Đọc bằng SQL Editor của Supabase (hoặc nhờ Claude chạy qua Supabase MCP). Thay `<mã>` bằng mã đồng bộ của bạn.

```sql
-- kid của bạn
select encode(extensions.digest('<mã>', 'sha256'), 'hex');

-- số câu, tỉ lệ đúng, thời gian trả lời trung vị theo ngày
select day, count(*) n, round(avg((d->>'ok')::int)::numeric, 2) dung,
       percentile_cont(.5) within group (order by (d->>'rt')::int) rt_ms
from el_log where kid = '<kid>' and k = 'ans' group by day order by day;

-- hai thanh Học / Nhớ A2 theo ngày (tiến tới Thi chuyển cấp)
select day, d->'A2'->>'learn' hoc, d->'A2'->>'mem' nho, d->'A2'->>'total' tong, d->'fast' hoc_nhanh
from el_log where kid = '<kid>' and k = 'snap' order by day;

-- chỗ sai nhiều nhất (từ / điểm ngữ pháp)
select d->>'node' nut, count(*) filter (where d->>'ok' = '0') sai, count(*) n
from el_log where kid = '<kid>' and k = 'ans' group by 1 having count(*) >= 3 order by sai desc limit 30;

-- thời gian học mỗi ngày (ước lượng: khoảng giữa hai thao tác ≤ 5 phút)
select day, round(sum(least(extract(epoch from gap), 300)) / 60) phut from (
  select day, at - lag(at) over (partition by dev order by at) gap from el_log where kid = '<kid>') x
where gap is not null group by day order by day;

-- tỉ lệ qua nhầm của ⚡ Học nhanh (docs/HOC-NHANH-KE-HOACH.md §7): câu ôn đến hạn sau khi qua chặng
select d->>'node' nut, avg((d->>'ok')::int) dung from el_log
where kid = '<kid>' and k = 'ans' and d->>'sk' = 'review' group by 1 order by 2 limit 30;
```

## Rủi ro
- Lộ mã đồng bộ = người khác ghi thêm được dòng vào nhật ký của bạn (không đọc được). Giữ mã như mật khẩu.
- `giv` có thể chứa câu bạn tự viết ở bài Viết / Nói. Không viết thông tin cá nhân vào bài luyện nếu không muốn nó nằm trên máy chủ.
- Hàng chờ quá 5 000 dòng (offline rất lâu) thì dòng cũ nhất bị bỏ.
