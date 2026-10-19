-- v167 💬 Góp ý mọi màn (người sáng lập 19/10/2026: "trong quá trình học muốn có nút góp ý để gửi ý kiến cũng như hình ảnh nếu cần, rồi sẽ tổng hợp lại xử lý").
-- Bảng el_gopy: mỗi góp ý một dòng, kèm bối cảnh màn / câu đang làm (ctx), ảnh ở kho riêng tư el-gopy (imgs = đường dẫn),
-- ảnh dự phòng dạng data URL khi tải ảnh lên kho không được (imgd). App chỉ GHI (el_gopy_post); đọc / xử lý: chủ dự án (docs/GOP-Y.md).
create table if not exists public.el_gopy (
  id bigserial primary key,
  at timestamptz not null default now(),
  kid text,                         -- băm mã đồng bộ nếu có (nối với nhật ký học el_log), không thì null
  dev text,
  app_v integer,
  kind text not null,               -- loi | kho | y | khac
  txt text not null,
  ctx jsonb not null default '{}'::jsonb,
  imgs text[] not null default '{}',
  imgd text[] not null default '{}',
  status text not null default 'moi',   -- moi | dang | xong | bo
  note text                          -- ghi chú xử lý của người làm app
);
create index if not exists el_gopy_status_at on public.el_gopy (status, at);
alter table public.el_gopy enable row level security;
revoke all on public.el_gopy from anon, authenticated;
revoke all on sequence public.el_gopy_id_seq from anon, authenticated;

create or replace function public.el_gopy_post(k text, dev text, kind text, txt text, ctx jsonb, imgs text[], imgd text[], v integer)
returns bigint language plpgsql security definer set search_path to '' as $fn$
declare h text; nid bigint; p text;
begin
  if kind is null or kind not in ('loi', 'kho', 'y', 'khac') then return 0; end if;
  if txt is null or length(btrim(txt)) = 0 or length(txt) > 4000 then return 0; end if;
  if dev is not null and dev !~ '^[a-z0-9]{6,16}$' then return 0; end if;
  if ctx is null or jsonb_typeof(ctx) <> 'object' or pg_column_size(ctx) > 8000 then ctx := '{}'::jsonb; end if;
  if coalesce(array_length(imgs, 1), 0) > 3 or coalesce(array_length(imgd, 1), 0) > 3 then return 0; end if;
  foreach p in array coalesce(imgs, '{}') loop
    if p !~ '^[0-9]{4}-[0-9]{2}/[a-z0-9]{8,40}[.]jpg$' then return 0; end if;
  end loop;
  foreach p in array coalesce(imgd, '{}') loop
    if length(p) > 700000 or p !~ '^data:image/jpeg;base64,' then return 0; end if;
  end loop;
  if (select count(*) from public.el_gopy g where g.at > now() - interval '1 hour') > 300 then return 0; end if;
  if dev is not null and (select count(*) from public.el_gopy g where g.dev = el_gopy_post.dev and g.at > now() - interval '1 hour') > 30 then return 0; end if;
  if public.el_key_ok(k) then h := encode(extensions.digest(k, 'sha256'), 'hex'); end if;
  insert into public.el_gopy (kid, dev, app_v, kind, txt, ctx, imgs, imgd) values (h, dev, v, kind, txt, ctx, coalesce(imgs, '{}'), coalesce(imgd, '{}')) returning id into nid;
  return nid;
end $fn$;
grant execute on function public.el_gopy_post(text, text, text, text, jsonb, text[], text[], integer) to anon;

-- Kho ảnh riêng tư: app chỉ được TẢI LÊN (không đọc, không liệt kê, không ghi đè), JPEG ≤ 1,5 MB, tên do app sinh ngẫu nhiên.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('el-gopy', 'el-gopy', false, 1572864, array['image/jpeg']) on conflict (id) do nothing;
create policy el_gopy_upload on storage.objects for insert to anon
  with check (bucket_id = 'el-gopy' and name ~ '^[0-9]{4}-[0-9]{2}/[a-z0-9]{8,40}[.]jpg$');
