-- v165 Nhật ký học để phân tích (người sáng lập 19/10/2026: "lưu dữ liệu tất cả thao tác hoặc chỉ số khi học của tôi khi test để sau này phân tích").
-- Chỉ ghi khi người học tự bật "Ghi dữ liệu học" (cần mã đồng bộ ELK-…). Không tài khoản, không email: kid = băm SHA-256 của mã, như sync_blob.
-- App chỉ GHI qua el_log_post (security definer); không có quyền đọc bảng. Đọc để phân tích: bảng điều khiển Supabase / SQL của chủ dự án.
create table if not exists public.el_log (
  id bigserial primary key,
  kid text not null,                 -- băm mã đồng bộ (cùng cách băm với sync_blob.id)
  dev text not null,                 -- mã ngẫu nhiên của từng máy (phân biệt điện thoại / máy tính)
  app_v integer,
  at timestamptz not null,           -- giờ trên máy lúc xảy ra
  day integer,                       -- ngày học theo app (today()), có tính lệch ngày khi thử
  k text not null,                   -- loại: ans (một câu trả lời), go (đổi màn), evc (sự kiện app), snap (chỉ số trong ngày)
  d jsonb not null,
  rcv timestamptz not null default now()
);
create index if not exists el_log_kid_at on public.el_log (kid, at);
alter table public.el_log enable row level security;
revoke all on public.el_log from anon, authenticated;
revoke all on sequence public.el_log_id_seq from anon, authenticated;

create or replace function public.el_log_post(k text, dev text, evs jsonb, v integer)
returns integer language plpgsql security definer set search_path to '' as $$
declare h text; e jsonb; n int := 0; t double precision;
begin
  if not public.el_key_ok(k) then return 0; end if;
  if dev is null or dev !~ '^[a-z0-9]{6,16}$' then return 0; end if;
  if evs is null or jsonb_typeof(evs) <> 'array' or jsonb_array_length(evs) > 300 then return 0; end if;
  h := encode(extensions.digest(k, 'sha256'), 'hex');
  -- chặn đổ dữ liệu: tối đa 20 000 dòng / mã / giờ
  if (select count(*) from public.el_log l where l.kid = h and l.rcv > now() - interval '1 hour') > 20000 then return 0; end if;
  for e in select value from jsonb_array_elements(evs) loop
    if jsonb_typeof(e) <> 'object' or pg_column_size(e) > 4000 then continue; end if;
    if coalesce(e->>'k', '') !~ '^[a-z]{2,8}$' or jsonb_typeof(e->'t') <> 'number' then continue; end if;
    t := (e->>'t')::double precision;
    if t < 1.7e12 or t > 4.0e12 then continue; end if;
    insert into public.el_log (kid, dev, app_v, at, day, k, d)
      values (h, dev, v, to_timestamp(t / 1000.0), case when jsonb_typeof(e->'dy') = 'number' then (e->>'dy')::int end, e->>'k', e - 'k' - 't' - 'dy');
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.el_log_post(text, text, jsonb, integer) from public;
grant execute on function public.el_log_post(text, text, jsonb, integer) to anon;

-- "Xoá tiến độ trên máy chủ" xoá luôn nhật ký học của mã đó.
create or replace function public.el_delete(k text)
returns boolean language plpgsql security definer set search_path to '' as $$
declare n int; h text;
begin
  if not public.el_key_ok(k) then return false; end if;
  h := encode(extensions.digest(k, 'sha256'), 'hex');
  delete from public.el_log where kid = h;
  delete from public.sync_blob where id = h;
  get diagnostics n = row_count; return n > 0;
end $$;
