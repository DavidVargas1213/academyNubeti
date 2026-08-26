// Helper compartido: valida que quien llama esté logueado Y sea admin.
// Usa la service_role key (secreta, solo existe como variable de entorno en Vercel).
const SUPABASE_URL = 'https://lkdcigvbdcvdpyuynzlh.supabase.co';
const ANON_KEY = 'sb_publishable_JhLtUgUWVyKXDVKVc9RbBw_vj4F_WYY';

async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!userResp.ok) return null;
  const user = await userResp.json();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const profResp = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=is_admin`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const rows = await profResp.json();
  if (!rows[0]?.is_admin) return null;
  return user;
}

module.exports = { verifyAdmin, SUPABASE_URL };
