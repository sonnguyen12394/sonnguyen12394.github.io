-- v31: giám khảo AI (người học tự bật). Chỉ đếm lượt chấm theo ngày để giới hạn chi phí; KHÔNG lưu bài viết, bài nói.
-- k = 'u:' + mã ẩn danh của máy (rid) hoặc 'ip:' + băm địa chỉ IP, hoặc '*' cho tổng cả ngày.
create table if not exists public.el_grade_use (
  day date not null default (now() at time zone 'Asia/Ho_Chi_Minh')::date,
  k text not null,
  n int not null default 0,
  primary key (day, k)
);
alter table public.el_grade_use enable row level security;
revoke all on public.el_grade_use from anon, authenticated;

-- Lấy một lượt: tăng đếm của máy, của IP và của cả ngày; trả về số lượt máy này còn lại, hoặc -1 (hết lượt máy/IP), -2 (hết lượt cả ngày).
create or replace function public.el_grade_take(p_user text, p_ip text, p_cap_user int, p_cap_ip int, p_cap_day int)
returns int language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Ho_Chi_Minh')::date; nu int; ni int; nd int;
begin
  insert into public.el_grade_use (day, k, n) values (d, '*', 1) on conflict (day, k) do update set n = public.el_grade_use.n + 1 returning n into nd;
  if nd > p_cap_day then update public.el_grade_use set n = n - 1 where day = d and k = '*'; return -2; end if;
  insert into public.el_grade_use (day, k, n) values (d, 'u:' || left(p_user, 40), 1) on conflict (day, k) do update set n = public.el_grade_use.n + 1 returning n into nu;
  insert into public.el_grade_use (day, k, n) values (d, 'ip:' || left(p_ip, 64), 1) on conflict (day, k) do update set n = public.el_grade_use.n + 1 returning n into ni;
  if nu > p_cap_user or ni > p_cap_ip then
    update public.el_grade_use set n = n - 1 where day = d and k in ('*', 'u:' || left(p_user, 40), 'ip:' || left(p_ip, 64));
    return -1;
  end if;
  return p_cap_user - nu;
end $$;
revoke all on function public.el_grade_take(text, text, int, int, int) from public, anon, authenticated;

-- Hoàn lại lượt khi gọi AI lỗi (không tính lượt người học không nhận được kết quả).
create or replace function public.el_grade_refund(p_user text, p_ip text)
returns void language sql security definer set search_path = '' as $$
  update public.el_grade_use set n = greatest(0, n - 1)
  where day = (now() at time zone 'Asia/Ho_Chi_Minh')::date and k in ('*', 'u:' || left(p_user, 40), 'ip:' || left(p_ip, 64));
$$;
revoke all on function public.el_grade_refund(text, text) from public, anon, authenticated;

-- Dọn đếm cũ hơn 30 ngày (gọi kèm mỗi lần lấy lượt là đủ nhỏ; không cần cron).
create or replace function public.el_grade_gc() returns void language sql security definer set search_path = '' as $$
  delete from public.el_grade_use where day < (now() at time zone 'Asia/Ho_Chi_Minh')::date - 30;
$$;
revoke all on function public.el_grade_gc() from public, anon, authenticated;
