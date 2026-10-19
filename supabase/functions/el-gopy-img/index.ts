// v168 🔐 Quản lý góp ý: cấp link xem ảnh góp ý (kho riêng tư el-gopy) có hạn 1 giờ, chỉ cho người có khoá quản trị ELA-….
// Khoá kiểm bằng public.el_admin_ok (băm SHA-256 trong el_admin). Dùng khoá service role do Supabase cấp sẵn cho hàm, không có khoá nào trong mã.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const PATH = /^[0-9]{4}-[0-9]{2}\/[a-z0-9]{8,40}\.jpg$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  let body: { key?: string; paths?: string[] };
  try { body = await req.json(); } catch (_e) { return json({ error: 'body' }, 400); }
  const { data: ok } = await sb.rpc('el_admin_ok', { k: String(body.key || '') });
  if (ok !== true) return json({ error: 'forbidden' }, 403);
  const paths = (Array.isArray(body.paths) ? body.paths : []).filter((p) => typeof p === 'string' && PATH.test(p)).slice(0, 60);
  if (!paths.length) return json({ urls: {} });
  const { data, error } = await sb.storage.from('el-gopy').createSignedUrls(paths, 3600);
  if (error) return json({ error: 'sign' }, 500);
  const urls: Record<string, string> = {};
  for (const x of data || []) if (x.path && x.signedUrl) urls[x.path] = x.signedUrl;
  return json({ urls });
});
