-- Bỏ phần đếm người dùng mỗi ngày của bản v45 (bản đó không phát hành; người dùng quyết định bỏ hẳn v45).
drop view if exists el_admin.days;
drop function if exists public.el_day_post(text, int);
drop table if exists public.el_day;
