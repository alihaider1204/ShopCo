/** Read admin access from JWT (no network). Matches server: isAdmin flag or role admin. */
export function isAdminFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.isAdmin || payload.role === 'admin') return true;
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    const u = JSON.parse(raw);
    return !!(u?.isAdmin || u?.role === 'admin');
  } catch {
    return false;
  }
}
