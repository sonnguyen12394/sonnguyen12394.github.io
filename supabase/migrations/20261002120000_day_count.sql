-- v45: đếm số người dùng mỗi ngày, chỉ khi người học đã bật "Chia sẻ thống kê ẩn danh".
-- Mỗi máy gửi tối đa một lần/ngày cho mỗi loại; máy chủ chỉ cộng vào tổng của ngày, không lưu từng lượt gửi.
-- open = đã mở app; learn = đã học (có ngày học, như chuỗi ngày). Không nối được giữa các ngày, nên không có "người dùng duy nhất/tuần".

create table if not exists public.el_day (
  day date not null,
  kind text not null check (kind in ('open', 'learn')),
  n int not null default 0,
  primary key (day, kind)
);
alter table public.el_day enable row level security;
revoke all on public.el_day from anon, authenticated;

create or replace function public.el_day_post(kind text, v int)
returns boolean language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
begin
  if kind not in ('open', 'learn') then return false; end if;
  insert into public.el_day as d (day, kind, n) values ((now() at time zone 'Asia/Ho_Chi_Minh')::date, kind, 1)
  on conflict (day, kind) do update set n = d.n + 1
  where d.n < 1000000;   -- chặn dội
  return true;
end $$;

revoke execute on function public.el_day_post(text, int) from public;
grant execute on function public.el_day_post(text, int) to anon, authenticated;

-- Cho chủ app: số người mở app và số người học mỗi ngày, 60 ngày gần nhất (select * from el_admin.days;).
create or replace view el_admin.days as
  select day, max(n) filter (where kind = 'open') as mo_app, max(n) filter (where kind = 'learn') as hoc
  from public.el_day where day > current_date - 60 group by day order by day desc;
