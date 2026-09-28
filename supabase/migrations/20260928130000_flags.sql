-- v20: gom “Báo lỗi câu này” của người học về một chỗ để người soạn sửa nội dung theo thứ tự ưu tiên.
-- Người học tự bấm gửi (Cài đặt → Câu đã báo lỗi). Chỉ gửi câu hỏi, đáp án của app, câu người học trả lời, lý do; không tên, không tiến độ.
-- Báo lỗi trùng nhau (cùng câu, cùng lý do, cùng câu trả lời) được cộng dồn vào n: n càng lớn càng nên sửa trước.
create table if not exists public.el_flag (
  id text primary key,
  kind text not null,
  ref text not null,
  item text,
  prompt text,
  answer text,
  given text,
  reason text not null,
  n int not null default 1,
  app_v int,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  done boolean not null default false
);
alter table public.el_flag enable row level security;
revoke all on public.el_flag from anon, authenticated;

create or replace function public.el_flag_post(items jsonb, v int)
returns int language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare it jsonb; c int := 0; k text; r text; kd text; rf text; total int;
begin
  if items is null or jsonb_typeof(items) <> 'array' then return 0; end if;
  select count(*) into total from public.el_flag;
  for it in select value from jsonb_array_elements(items) limit 20 loop
    kd := left(coalesce(it->>'kind', ''), 40); rf := left(coalesce(it->>'ref', ''), 120); r := left(coalesce(it->>'reason', ''), 160);
    if kd = '' or rf = '' or r = '' then continue; end if;
    k := md5(concat_ws('|', kd, rf, left(it->>'prompt', 300), left(it->>'answer', 200), r, left(it->>'given', 200)));
    update public.el_flag f set n = f.n + 1, last_at = now(), app_v = greatest(f.app_v, v) where f.id = k;
    if not found then
      if total >= 50000 then continue; end if;   -- chặn spam làm phình bảng
      insert into public.el_flag (id, kind, ref, item, prompt, answer, given, reason, app_v)
      values (k, kd, rf, left(it->>'item', 200), left(it->>'prompt', 300), left(it->>'answer', 200), left(it->>'given', 200), r, v);
      total := total + 1;
    end if;
    c := c + 1;
  end loop;
  return c;
end $$;
revoke execute on function public.el_flag_post(jsonb, int) from public;
grant execute on function public.el_flag_post(jsonb, int) to anon, authenticated;

-- Danh sách cho người soạn (xem trong Supabase → SQL: select * from el_admin.flags;). Schema riêng, không mở qua API.
create schema if not exists el_admin;
revoke all on schema el_admin from public, anon, authenticated;
create or replace view el_admin.flags as
  select n, kind, item, prompt, answer, given, reason, app_v, last_at, id from public.el_flag where not done order by n desc, last_at desc;
