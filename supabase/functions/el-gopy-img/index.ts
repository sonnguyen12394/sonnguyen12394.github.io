// v168 🔐 Quản lý góp ý: cấp link xem ảnh góp ý (kho riêng tư el-gopy) có hạn 1 giờ.
// v169 (người sáng lập 19/10/2026: "bỏ key đi, cho phép quyền xoá hẳn"): không còn khoá quản trị (ai mở app cũng dùng được, người sáng lập
// đã chấp nhận rủi ro); thêm op 'purge': xoá hẳn một góp ý ĐANG Ở MỤC ĐÃ XOÁ (status 'xoa') cùng ảnh của nó, không khôi phục được.
// Dùng khoá service role do Supabase cấp sẵn cho hàm, không có khoá nào trong mã.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const PATH = /^[0-9]{4}-[0-9]{2}\/[a-z0-9]{8,40}\.jpg$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: { op?: string; id?: number; paths?: string[] };
  try { body = await req.json(); } catch (_e) { return json({ error: 'body' }, 400); }
  if (body.op === 'purge') {
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return json({ error: 'id' }, 400);
    const { data: row, error: e1 } = await sb.from('el_gopy').select('id,status,imgs').eq('id', id).maybeSingle();
    if (e1) return json({ error: 'read' }, 500);
    if (!row) return json({ ok: true, gone: true });
    if (row.status !== 'xoa') return json({ error: 'not-in-trash' }, 409);   // chỉ xoá hẳn từ mục Đã xoá
    const imgs = (row.imgs || []).filter((p: string) => PATH.test(p));
    if (imgs.length) { const { error: e2 } = await sb.storage.from('el-gopy').remove(imgs); if (e2) return json({ error: 'img' }, 500); }
    const { error: e3 } = await sb.from('el_gopy').delete().eq('id', id).eq('status', 'xoa');
    if (e3) return json({ error: 'row' }, 500);
    return json({ ok: true, imgs: imgs.length });
  }
  const paths = (Array.isArray(body.paths) ? body.paths : []).filter((p) => typeof p === 'string' && PATH.test(p)).slice(0, 60);
  if (!paths.length) return json({ urls: {} });
  const { data, error } = await sb.storage.from('el-gopy').createSignedUrls(paths, 3600);
  if (error) return json({ error: 'sign' }, 500);
  const urls: Record<string, string> = {};
  for (const x of data || []) if (x.path && x.signedUrl) urls[x.path] = x.signedUrl;
  return json({ urls });
});
