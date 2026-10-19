-- v168 🔐 Quản lý góp ý (người sáng lập 19/10/2026: "cần 1 mục danh sách góp ý thể hiện chi tiết từng loại góp ý để dễ quản lý xoá sửa thêm").
-- App vẫn không đọc được el_gopy bằng quyền thường; chỉ ai có KHOÁ QUẢN TRỊ (ELA-…, 100 bit ngẫu nhiên) mới xem / sửa / thêm / xoá.
-- Máy chủ chỉ giữ băm SHA-256 của khoá (bảng el_admin, không ai đọc được bằng quyền app). Đặt / đổi khoá: chủ dự án chèn băm mới vào el_admin.
-- "Xoá" = chuyển trạng thái 'xoa' (ẩn khỏi danh sách, khôi phục được); xoá hẳn làm bằng bảng điều khiển Supabase.
create table if not exists public.el_admin (h text primary key, at timestamptz not null default now());
alter table public.el_admin enable row level security;
revoke all on public.el_admin from anon, authenticated;

alter table public.el_gopy add constraint el_gopy_status_ok check (status in ('moi', 'dang', 'xong', 'bo', 'xoa'));
alter table public.el_gopy add column if not exists upd timestamptz;

create or replace function public.el_admin_ok(k text) returns boolean language sql stable security definer set search_path to '' as $fn$
  select k is not null and k ~ '^ELA-[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){4}$'
    and exists (select 1 from public.el_admin a where a.h = encode(extensions.digest(k, 'sha256'), 'hex'))
$fn$;

-- Danh sách: lọc theo trạng thái (null = mọi trạng thái trừ 'xoa') và loại (null = mọi loại); kèm số đếm theo loại × trạng thái.
create or replace function public.el_gopy_list(k text, st text, kd text) returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
begin
  if not public.el_admin_ok(k) then return null; end if;
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(g) - 'kid' order by g.at desc) from (
        select id, at, upd, kind, txt, ctx, imgs, imgd, status, note, app_v, dev, kid from public.el_gopy x
        where (st is null and x.status <> 'xoa' or x.status = st) and (kd is null or x.kind = kd)
        order by x.at desc limit 300) g), '[]'::jsonb),
    'count', coalesce((select jsonb_object_agg(kind || ':' || status, n) from (select kind, status, count(*) n from public.el_gopy group by 1, 2) c), '{}'::jsonb));
end $fn$;

-- Sửa: trạng thái, ghi chú, loại, nội dung (null = giữ nguyên).
create or replace function public.el_gopy_set(k text, gid bigint, st text, nt text, kd text, tx text) returns boolean language plpgsql security definer set search_path to '' as $fn$
begin
  if not public.el_admin_ok(k) then return false; end if;
  if st is not null and st not in ('moi', 'dang', 'xong', 'bo', 'xoa') then return false; end if;
  if kd is not null and kd not in ('loi', 'kho', 'y', 'khac') then return false; end if;
  if tx is not null and (length(btrim(tx)) = 0 or length(tx) > 4000) then return false; end if;
  update public.el_gopy set status = coalesce(st, status), note = case when nt is null then note else left(nt, 2000) end,
    kind = coalesce(kd, kind), txt = coalesce(tx, txt), upd = now() where id = gid;
  return found;
end $fn$;

-- Thêm tay (ý của chính người làm app, góp ý nhận qua kênh khác).
create or replace function public.el_gopy_add(k text, kd text, tx text, nt text) returns bigint language plpgsql security definer set search_path to '' as $fn$
declare nid bigint;
begin
  if not public.el_admin_ok(k) then return 0; end if;
  if kd is null or kd not in ('loi', 'kho', 'y', 'khac') or tx is null or length(btrim(tx)) = 0 or length(tx) > 4000 then return 0; end if;
  insert into public.el_gopy (kind, txt, note, ctx, dev) values (kd, tx, left(nt, 2000), '{"src":"admin"}'::jsonb, 'admin') returning id into nid;
  return nid;
end $fn$;

grant execute on function public.el_admin_ok(text) to anon;
grant execute on function public.el_gopy_list(text, text, text) to anon;
grant execute on function public.el_gopy_set(text, bigint, text, text, text, text) to anon;
grant execute on function public.el_gopy_add(text, text, text, text) to anon;
-- Khoá: insert into public.el_admin (h) values (encode(extensions.digest('ELA-…', 'sha256'), 'hex'));  (chạy tay, không ghi khoá vào repo)
