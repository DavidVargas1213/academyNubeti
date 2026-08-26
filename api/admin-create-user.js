const { verifyAdmin, SUPABASE_URL } = require('./_verify');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ error: 'No autorizado' });

  const { email, password, full_name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Falta email o password' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const createResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: full_name ? { full_name } : undefined,
    }),
  });
  const created = await createResp.json();
  if (!createResp.ok) {
    return res.status(createResp.status).json({ error: created.msg || created.error_description || 'No se pudo crear el usuario' });
  }

  // Marcar que debe cambiar la contraseña en el primer login.
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${created.id}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ must_change_password: true, full_name: full_name || email }),
  });

  res.status(200).json({ ok: true, id: created.id, email: created.email });
};
