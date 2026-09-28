-- v19: Giải đấu tuần (ẩn danh) + nhắc học bằng Web Push.
-- Giống sync_blob: bảng bật RLS, không có policy, anon chỉ gọi được các hàm RPC dưới đây (security definer, search_path rỗng).
-- Khoá riêng VAPID và bí mật gọi cron nằm trong Vault (tên: el_vapid, el_cron), không nằm trong file này.

-- ---------- Giải đấu tuần ----------
-- Mã giải đấu ELL-… (100 bit ngẫu nhiên) nằm riêng trên máy người học; máy chủ chỉ lưu băm SHA-256.
-- Mỗi tuần (theo giờ Việt Nam) người học vào một nhóm ≤ 30 người cùng hạng. Hết tuần: top 5 lên hạng, 5 người cuối (nhóm ≥ 10) xuống hạng.
create table if not exists public.el_league (
  id text not null,
  wk text not null,
  tier smallint not null default 0 check (tier between 0 and 4),
  grp int not null,
  nm text not null check (length(nm) between 2 and 20),
  xp int not null default 0 check (xp between 0 and 20000),
  mv smallint,
  updated_at timestamptz not null default now(),
  primary key (id, wk)
);
create index if not exists el_league_wk_tier_grp on public.el_league (wk, tier, grp);
alter table public.el_league enable row level security;
revoke all on public.el_league from anon, authenticated;

create or replace function public.el_week(off int default 0) returns text
language sql stable set search_path = '' as $$
  select to_char((now() at time zone 'Asia/Ho_Chi_Minh') + make_interval(days => 7 * off), 'IYYY-"W"IW')
$$;

create or replace function public.el_lg_key_ok(k text) returns boolean
language sql immutable set search_path = '' as $$
  select k is not null and k ~ '^ELL-[0-9A-HJKMNP-TV-Z]{20}$'
$$;

create or replace function public.el_lg_name(nm text) returns text
language sql immutable set search_path = '' as $$
  select btrim(regexp_replace(left(coalesce(nm, ''), 40), '[[:cntrl:]<>&"''`\\]', '', 'g'))
$$;

-- Ghi XP tuần này (chỉ tăng, tối đa 20.000). Lần đầu trong tuần: tính hạng từ kết quả tuần trước rồi xếp vào nhóm.
create or replace function public.el_league_post(k text, nm text, x int)
returns table (tier smallint, grp int, mv smallint)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare
  h text; w text := public.el_week(0); pw text := public.el_week(-1);
  n text := left(public.el_lg_name(nm), 20); xx int := least(greatest(coalesce(x, 0), 0), 20000);
  t smallint := 0; m smallint := null; g int; c int; p record; rk int; sz int;
begin
  if not public.el_lg_key_ok(k) then raise exception 'bad key'; end if;
  if length(n) < 2 then raise exception 'bad name'; end if;
  h := encode(extensions.digest(k, 'sha256'), 'hex');
  update public.el_league l set xp = greatest(l.xp, xx), nm = n, updated_at = now()
    where l.id = h and l.wk = w returning l.tier, l.grp, l.mv into t, g, m;
  if found then return query select t, g, m; return; end if;
  t := 0; m := null; g := null;   -- RETURNING INTO không khớp dòng nào gán NULL

  select * into p from public.el_league l where l.id = h and l.wk < w order by l.wk desc limit 1;
  if found then
    t := p.tier;
    if p.wk = pw then
      select count(*) filter (where l.xp > p.xp) + 1, count(*) into rk, sz
        from public.el_league l where l.wk = p.wk and l.tier = p.tier and l.grp = p.grp;
      if rk <= 5 and p.xp > 0 and sz >= 2 then t := least(p.tier + 1, 4); m := case when t > p.tier then 1 else 0 end;
      elsif sz >= 10 and rk > sz - 5 then t := greatest(p.tier - 1, 0); m := case when t < p.tier then -1 else 0 end;
      else m := 0; end if;
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('el_league:' || w || ':' || t));
  select l.grp, count(*) into g, c from public.el_league l
    where l.wk = w and l.tier = t group by l.grp order by l.grp desc limit 1;
  if g is null then g := 0; elsif c >= 30 then g := g + 1; end if;
  insert into public.el_league (id, wk, tier, grp, nm, xp, mv) values (h, w, t, g, n, xx, m);
  return query select t, g, m;
end $$;

-- Bảng xếp hạng nhóm của mình tuần này (không lộ mã hay băm của người khác).
create or replace function public.el_league_board(k text)
returns table (nm text, xp int, me boolean, tier smallint, mv smallint, wk text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_variable
declare h text; w text := public.el_week(0); r record;
begin
  if not public.el_lg_key_ok(k) then return; end if;
  h := encode(extensions.digest(k, 'sha256'), 'hex');
  select * into r from public.el_league l where l.id = h and l.wk = w;
  if not found then return; end if;
  return query select l.nm, l.xp, l.id = h, r.tier, r.mv, w from public.el_league l
    where l.wk = w and l.tier = r.tier and l.grp = r.grp order by l.xp desc, l.updated_at asc limit 30;
end $$;

-- Rời giải đấu: xoá mọi dòng của mã này.
create or replace function public.el_league_leave(k text) returns boolean
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare c int;
begin
  if not public.el_lg_key_ok(k) then return false; end if;
  delete from public.el_league where id = encode(extensions.digest(k, 'sha256'), 'hex');
  get diagnostics c = row_count; return c > 0;
end $$;

-- ---------- Nhắc học bằng Web Push ----------
-- Chỉ lưu: địa chỉ đăng ký thông báo của trình duyệt (endpoint + khoá mã hoá), giờ nhắc, múi giờ, ngày học gần nhất, số từ đến hạn.
create table if not exists public.el_push_sub (
  id text primary key,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  at_min smallint not null check (at_min between 0 and 1439),
  tz smallint not null check (tz between -840 and 840),
  studied date,
  shown date,
  due int not null default 0 check (due between 0 and 100000),
  fails smallint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.el_push_sub enable row level security;
revoke all on public.el_push_sub from anon, authenticated;

create or replace function public.el_push_ep_ok(ep text) returns boolean
language sql immutable set search_path = '' as $$
  select ep is not null and length(ep) < 1024 and ep ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9.-]+\.push\.apple\.com|[a-z0-9.-]+\.notify\.windows\.com)/'
$$;

create or replace function public.el_push_set(ep text, p256dh text, auth text, at text, tz int, studied text, due int)
returns boolean language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare am int;
begin
  if not public.el_push_ep_ok(ep) then raise exception 'bad endpoint'; end if;
  if p256dh !~ '^[A-Za-z0-9_-]{80,100}$' or auth !~ '^[A-Za-z0-9_-]{16,32}$' then raise exception 'bad keys'; end if;
  if at !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'bad time'; end if;
  am := split_part(at, ':', 1)::int * 60 + split_part(at, ':', 2)::int;
  insert into public.el_push_sub as s (id, endpoint, p256dh, auth, at_min, tz, studied, due)
    values (encode(extensions.digest(ep, 'sha256'), 'hex'), ep, p256dh, auth, am, least(greatest(coalesce(tz, 420), -840), 840),
            case when studied ~ '^\d{4}-\d{2}-\d{2}$' then studied::date end, least(greatest(coalesce(due, 0), 0), 100000))
  on conflict (id) do update set p256dh = excluded.p256dh, auth = excluded.auth, at_min = excluded.at_min, tz = excluded.tz,
    studied = coalesce(excluded.studied, s.studied), due = excluded.due, fails = 0, updated_at = now();
  return true;
end $$;

create or replace function public.el_push_seen(ep text, studied text, due int) returns boolean
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
begin
  if not public.el_push_ep_ok(ep) then return false; end if;
  update public.el_push_sub set studied = case when el_push_seen.studied ~ '^\d{4}-\d{2}-\d{2}$' then el_push_seen.studied::date else el_push_sub.studied end,
    due = least(greatest(coalesce(el_push_seen.due, 0), 0), 100000), updated_at = now()
  where id = encode(extensions.digest(ep, 'sha256'), 'hex');
  return found;
end $$;

create or replace function public.el_push_del(ep text) returns boolean
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
begin
  if ep is null then return false; end if;
  delete from public.el_push_sub where id = encode(extensions.digest(ep, 'sha256'), 'hex');
  return found;
end $$;

-- Dùng nội bộ (Edge Function el-remind, kết nối thẳng CSDL): ai đã qua giờ nhắc, hôm nay chưa học, chưa được nhắc.
create or replace function public.el_push_due()
returns table (id text, endpoint text, p256dh text, auth text, due int, local_day date)
language sql stable set search_path = '' as $$
  select s.id, s.endpoint, s.p256dh, s.auth, s.due, (now() at time zone 'UTC' + make_interval(mins => s.tz))::date
  from public.el_push_sub s
  where extract(hour from now() at time zone 'UTC' + make_interval(mins => s.tz)) * 60
      + extract(minute from now() at time zone 'UTC' + make_interval(mins => s.tz)) >= s.at_min
    and s.shown is distinct from (now() at time zone 'UTC' + make_interval(mins => s.tz))::date
    and s.studied is distinct from (now() at time zone 'UTC' + make_interval(mins => s.tz))::date
  limit 2000
$$;

-- Quyền: anon chỉ gọi các RPC công khai; hàm nội bộ chỉ cho postgres/service_role.
revoke execute on function public.el_push_due() from public, anon, authenticated;
revoke execute on function public.el_league_post(text, text, int), public.el_league_board(text), public.el_league_leave(text),
  public.el_push_set(text, text, text, text, int, text, int), public.el_push_seen(text, text, int), public.el_push_del(text) from public;
grant execute on function public.el_league_post(text, text, int), public.el_league_board(text), public.el_league_leave(text),
  public.el_push_set(text, text, text, text, int, text, int), public.el_push_seen(text, text, int), public.el_push_del(text) to anon, authenticated;
