-- v19: lịch chạy. Bí mật gọi Edge Function lấy từ Vault lúc chạy, không nằm trong định nghĩa job.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

select cron.schedule('el-remind', '*/15 * * * *', $$
  select net.http_post(
    url := 'https://nlrcbmgixhpwxrvmklqc.supabase.co/functions/v1/el-remind',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-el-cron', (select decrypted_secret from vault.decrypted_secrets where name = 'el_cron')),
    body := '{}'::jsonb, timeout_milliseconds := 55000)
$$);

-- Dọn dữ liệu cũ mỗi ngày: giải đấu giữ 8 tuần; đăng ký thông báo không cập nhật 120 ngày thì xoá.
select cron.schedule('el-cleanup', '17 3 * * *', $$
  delete from public.el_league where wk < public.el_week(-8);
  delete from public.el_push_sub where updated_at < now() - interval '120 days';
$$);
