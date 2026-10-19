-- v169 (người sáng lập 19/10/2026: "bỏ key đi, cho phép quyền xoá hẳn"; đã được báo: ai mở web cũng xem / sửa / xoá được góp ý).
-- el_gopy_list / el_gopy_set / el_gopy_add bỏ kiểm khoá quản trị (tham số k giữ lại để không đổi lời gọi, bị bỏ qua).
-- Xoá hẳn (góp ý + ảnh) ở edge function el-gopy-img (op 'purge'), chỉ khi góp ý đang ở trạng thái 'xoa'. el_admin / el_admin_ok để lại, không dùng.
create or replace function public.el_gopy_list(k text, st text, kd text) returns jsonb language plpgsql stable security definer set search_path to '' as $fn$
begin
  return jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(g) - 'kid' order by g.at desc) from (
        select id, at, upd, kind, txt, ctx, imgs, imgd, status, note, app_v, dev, kid from public.el_gopy x
        where (st is null and x.status <> 'xoa' or x.status = st) and (kd is null or x.kind = kd)
        order by x.at desc limit 300) g), '[]'::jsonb),
    'count', coalesce((select jsonb_object_agg(kind || ':' || status, n) from (select kind, status, count(*) n from public.el_gopy group by 1, 2) c), '{}'::jsonb));
end $fn$;
create or replace function public.el_gopy_set(k text, gid bigint, st text, nt text, kd text, tx text) returns boolean language plpgsql security definer set search_path to '' as $fn$
begin
  if st is not null and st not in ('moi', 'dang', 'xong', 'bo', 'xoa') then return false; end if;
  if kd is not null and kd not in ('loi', 'kho', 'y', 'khac') then return false; end if;
  if tx is not null and (length(btrim(tx)) = 0 or length(tx) > 4000) then return false; end if;
  update public.el_gopy set status = coalesce(st, status), note = case when nt is null then note else left(nt, 2000) end,
    kind = coalesce(kd, kind), txt = coalesce(tx, txt), upd = now() where id = gid;
  return found;
end $fn$;
create or replace function public.el_gopy_add(k text, kd text, tx text, nt text) returns bigint language plpgsql security definer set search_path to '' as $fn$
declare nid bigint;
begin
  if kd is null or kd not in ('loi', 'kho', 'y', 'khac') or tx is null or length(btrim(tx)) = 0 or length(tx) > 4000 then return 0; end if;
  insert into public.el_gopy (kind, txt, note, ctx, dev) values (kd, tx, left(nt, 2000), '{"src":"admin"}'::jsonb, 'admin') returning id into nid;
  return nid;
end $fn$;
