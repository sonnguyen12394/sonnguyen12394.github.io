-- v36: số liệu ẩn danh cho phần ôn thi (yêu cầu 5.4, 5.11, 8.6). Chỉ nhận khi người học tự bật "Chia sẻ thống kê ẩn danh".
-- Không tên, không email, không mã máy, không mã đồng bộ: mỗi dòng là một lượt làm bài rời rạc, không nối được với nhau.

-- 1. Lượt trả lời: mỗi lượt làm bài (bộ luyện, đề thi thử, kiểm tra đầu vào) một dòng, điểm từng câu 0/1.
create table if not exists public.el_resp (
  id bigint generated always as identity primary key,
  exam text not null check (exam in ('ielts-ac', 'ielts-gt', 'vstep')),
  kind text not null check (kind in ('place', 'set', 'mock')),
  items jsonb not null,           -- {"id-cau": 0|1, ...}
  app_v int,
  at timestamptz not null default now()
);
alter table public.el_resp enable row level security;
revoke all on public.el_resp from anon, authenticated;
create index if not exists el_resp_at on public.el_resp (at desc);

create or replace function public.el_resp_post(exam text, kind text, items jsonb, v int)
returns boolean language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare k text; val jsonb; n int := 0; clean jsonb := '{}'::jsonb;
begin
  if exam not in ('ielts-ac', 'ielts-gt', 'vstep') or kind not in ('place', 'set', 'mock') then return false; end if;
  if items is null or jsonb_typeof(items) <> 'object' then return false; end if;
  for k, val in select key, value from jsonb_each(items) loop
    n := n + 1;
    if n > 200 then exit; end if;
    if k !~ '^[a-z0-9][a-z0-9-]{2,63}$' or val::text not in ('0', '1') then continue; end if;
    clean := clean || jsonb_build_object(k, val::text::int);
  end loop;
  if clean = '{}'::jsonb then return false; end if;
  if (select count(*) from public.el_resp where at > now() - interval '1 minute') > 600 then return false; end if;   -- chặn dội
  insert into public.el_resp (exam, kind, items, app_v) values (exam, kind, clean, v);
  return true;
end $$;

-- Thống kê từng câu từ 50.000 lượt gần nhất: n, tỉ lệ đúng p, độ phân biệt = tương quan giữa câu và tổng điểm phần còn lại.
-- Tính sẵn mỗi giờ (pg_cron) vào bảng nhỏ, nên gọi API chỉ đọc bảng, không quét lại toàn bộ.
create table if not exists public.el_item_stat (item text primary key, n int not null, p real not null, rpb real, at timestamptz not null default now());
alter table public.el_item_stat enable row level security;
revoke all on public.el_item_stat from anon, authenticated;

create or replace function public.el_item_stat_refresh() returns int language plpgsql security definer set search_path = '' as $$
declare c int;
begin
  delete from public.el_item_stat;
  insert into public.el_item_stat (item, n, p, rpb)
  with r as (select id, items from public.el_resp order by at desc limit 50000),
  t as (select r.id, e.key as item, e.value::text::int as s from r, jsonb_each(r.items) e),
  tot as (select id, sum(s) as total from t group by id)
  select t.item, count(*)::int, avg(t.s)::real, corr(t.s, tot.total - t.s)::real
  from t join tot using (id) group by t.item having count(*) >= 10;
  get diagnostics c = row_count;
  return c;
end $$;
revoke execute on function public.el_item_stat_refresh() from public, anon, authenticated;

create or replace function public.el_item_stats()
returns table (item text, n int, p real, rpb real) language sql stable security definer set search_path = '' as $$
  select item, n, p, rpb from public.el_item_stat;
$$;

select cron.schedule('el-item-stat', '7 * * * *', $$select public.el_item_stat_refresh()$$);

-- 2. Cặp "ước tính của app – điểm thi thật" theo từng kỹ năng (để công bố độ chính xác khi đủ ≥ 100 cặp mỗi kỹ năng).
create table if not exists public.el_pair (
  id bigint generated always as identity primary key,
  exam text not null check (exam in ('ielts-ac', 'ielts-gt', 'vstep')),
  skill text not null check (skill in ('L', 'R', 'W', 'S')),
  est real not null check (est between 0 and 10),
  real_score real not null check (real_score between 0 and 10),
  app_v int,
  at timestamptz not null default now()
);
alter table public.el_pair enable row level security;
revoke all on public.el_pair from anon, authenticated;

create or replace function public.el_pair_post(exam text, pairs jsonb, v int)
returns int language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare it jsonb; c int := 0;
begin
  if exam not in ('ielts-ac', 'ielts-gt', 'vstep') or pairs is null or jsonb_typeof(pairs) <> 'array' then return 0; end if;
  for it in select value from jsonb_array_elements(pairs) limit 4 loop
    if (it->>'skill') not in ('L', 'R', 'W', 'S') then continue; end if;
    begin
      insert into public.el_pair (exam, skill, est, real_score, app_v)
      values (exam, it->>'skill', (it->>'est')::real, (it->>'real')::real, v);
      c := c + 1;
    exception when others then null;
    end;
  end loop;
  return c;
end $$;

-- Độ chính xác: số cặp, tỉ lệ lệch ≤ 0,5 band và ≤ 1 band (VSTEP: điểm thang 10 đổi ra band trước khi gửi).
create or replace function public.el_pair_stats()
returns table (exam text, skill text, n int, within_half real, within_one real, mean_err real)
language sql stable security definer set search_path = '' as $$
  select exam, skill, count(*)::int,
    avg((abs(est - real_score) <= 0.5)::int)::real, avg((abs(est - real_score) <= 1)::int)::real, avg(est - real_score)::real
  from public.el_pair group by exam, skill;
$$;

-- 3. Câu ôn thi bị báo lỗi nhiều (chưa sửa): app tạm ẩn chờ sửa (yêu cầu 8.6).
create or replace function public.el_flag_hot(min_n int default 3)
returns table (ref text, n int) language sql stable security definer set search_path = '' as $$
  select ref, sum(n)::int from public.el_flag where not done and kind = 'Ôn thi' group by ref having sum(n) >= greatest(min_n, 2);
$$;

revoke execute on function public.el_resp_post(text, text, jsonb, int), public.el_item_stats(), public.el_pair_post(text, jsonb, int),
  public.el_pair_stats(), public.el_flag_hot(int) from public;
grant execute on function public.el_resp_post(text, text, jsonb, int), public.el_item_stats(), public.el_pair_post(text, jsonb, int),
  public.el_pair_stats(), public.el_flag_hot(int) to anon, authenticated;

-- Cho người soạn: xem nhanh câu có độ phân biệt kém.
create or replace view el_admin.items_weak as
  select * from public.el_item_stat where n >= 50 and (rpb is null or rpb <= 0.05) order by rpb nulls first;
