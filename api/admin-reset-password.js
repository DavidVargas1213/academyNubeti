const { verifyAdmin, SUPABASE_URL } = require('./_verify');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const admin = await verifyAdmin(req);
  if (!admin) return res.status(403).json({ error: 'No autorizado' });

  const { userId, newPassword } = req.body || {};
  if (!userId || !newPassword) return res.status(400).json({ error: 'Falta userId o newPassword' });

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const updateResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });
  const updated = await updateResp.json();
  if (!updateResp.ok) {
    return res.status(updateResp.status).json({ error: updated.msg || updated.error_description || 'No se pudo cambiar la contraseña' });
  }

  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ must_change_password: true }),
  });

  res.status(200).json({ ok: true });
};
