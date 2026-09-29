// Nhắc học bằng Web Push. pg_cron gọi hàm này 15 phút/lần kèm header x-el-cron (bí mật trong Vault 'el_cron').
// Lấy người đã qua giờ nhắc, hôm nay chưa học, chưa được nhắc (public.el_push_due) → gửi thông báo đã mã hoá (webpush.js).
// Khoá VAPID nằm trong Vault 'el_vapid' ({pub, jwk, sub}); không có khoá nào trong mã nguồn.
import postgres from 'npm:postgres@3.4.5';
import { send } from './webpush.js';

const sql = postgres(Deno.env.get('SUPABASE_DB_URL')!, { prepare: false, max: 3 });
let cfg: { vapid: { pub: string; jwk: JsonWebKey; sub: string }; cron: string } | null = null;

async function config() {
  if (cfg) return cfg;
  const rows = await sql`select name, decrypted_secret from vault.decrypted_secrets where name in ('el_vapid', 'el_cron')`;
  const m = Object.fromEntries(rows.map((r) => [r.name, r.decrypted_secret]));
  if (!m.el_vapid || !m.el_cron) throw new Error('missing vault secrets');
  cfg = { vapid: JSON.parse(m.el_vapid), cron: m.el_cron };
  return cfg;
}

// Lời nhắc bằng giọng Tí (giống app); câu chung đổi theo ngày để đỡ nhàm.
const LINES = ['Tí nhớ bạn rồi đó! Một bài 5 phút là giữ được lửa 🔥', 'Hôm nay mình leo thêm một nấc nhé? Tí đợi ở nấc tiếp theo 🐶', '5 phút mỗi ngày nhớ lâu hơn cả buổi học dồn đó!'];
const text = (due: number) => JSON.stringify({
  title: 'English Ladder: Tí đang đợi bạn',
  body: due > 0 ? `${due} từ đang chờ bạn ôn. Tí giữ chỗ rồi, vào 5 phút nha 🐶` : LINES[Math.floor(Date.now() / 864e5) % 3],
});

Deno.serve(async (req) => {
  let c;
  try { c = await config(); } catch (_e) { return new Response('config', { status: 500 }); }
  if (req.method !== 'POST' || req.headers.get('x-el-cron') !== c.cron) return new Response('forbidden', { status: 403 });

  const due = await sql`select * from public.el_push_due()`;
  const out = { due: due.length, sent: 0, gone: 0, fail: 0 };
  for (let i = 0; i < due.length; i += 25) {
    await Promise.all(due.slice(i, i + 25).map(async (s) => {
      try {
        const r = await send({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, text(s.due), c!.vapid);
        if (r.status === 404 || r.status === 410) {   // đăng ký đã hết hạn / người dùng gỡ quyền
          await sql`delete from public.el_push_sub where id = ${s.id}`; out.gone++;
        } else if (r.ok) {
          await sql`update public.el_push_sub set shown = ${s.local_day}, fails = 0 where id = ${s.id}`; out.sent++;
        } else throw new Error('http ' + r.status);
      } catch (_e) {
        // Lỗi tạm: thử lại lượt sau; lỗi lần thứ 3 trong ngày thì thôi hôm nay; lỗi mãi thì xoá đăng ký.
        await sql`update public.el_push_sub set fails = fails + 1,
          shown = case when fails >= 2 then ${s.local_day}::date else shown end where id = ${s.id}`;
        await sql`delete from public.el_push_sub where id = ${s.id} and fails >= 30`;
        out.fail++;
      }
    }));
  }
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
});
