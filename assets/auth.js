// Cliente de Supabase compartido + helpers de autenticación para todo el sitio.
const SUPABASE_URL = 'https://lkdcigvbdcvdpyuynzlh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JhLtUgUWVyKXDVKVc9RbBw_vj4F_WYY';

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Llamar al inicio de cada página protegida. Redirige a login.html si no hay sesión.
// Devuelve { session, profile } o null (y ya redirigió).
async function requireAuth() {
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) {
    location.href = 'login.html';
    return null;
  }
  const { data: profile } = await window.sb
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return { session, profile: profile || { id: session.user.id, email: session.user.email, is_admin: false } };
}

async function logout() {
  await window.sb.auth.signOut();
  location.href = 'login.html';
}

// Guarda/actualiza el progreso de un curso para el usuario actual.
async function saveProgress({ slug, category, completed, score, total, attempts }) {
  const { data: { session } } = await window.sb.auth.getSession();
  if (!session) return { error: 'no-session' };
  const { error } = await window.sb.from('progress').upsert({
    user_id: session.user.id,
    guide_slug: slug,
    category: category || null,
    completed: !!completed,
    score: score ?? null,
    total: total ?? null,
    attempts: attempts ?? 1,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,guide_slug' });
  return { error };
}

// Inyecta una barra de navegación superior simple (Mi Progreso / Admin / Salir).
function renderAuthBar(profile) {
  const bar = document.createElement('div');
  bar.id = 'auth-bar';
  bar.style.cssText = 'position:fixed;top:1.25rem;right:2rem;z-index:20;display:flex;gap:.6rem;align-items:center;font-family:"JetBrains Mono",monospace;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;';
  const linkStyle = 'color:#c9c4b4;text-decoration:none;padding:.45rem .75rem;border:1px solid #38352f;border-radius:2px;background:rgba(10,10,10,.7);backdrop-filter:blur(8px);transition:all .2s;';
  let html = `<a href="dashboard.html" style="${linkStyle}">Mi Progreso</a>`;
  if (profile && profile.is_admin) {
    html += `<a href="admin.html" style="${linkStyle}">Admin</a>`;
  }
  html += `<button id="auth-logout-btn" style="${linkStyle}cursor:pointer;">Salir</button>`;
  bar.innerHTML = html;
  document.body.appendChild(bar);
  document.getElementById('auth-logout-btn').addEventListener('click', logout);
}
