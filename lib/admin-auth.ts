export function isAdminToken(headers: Headers): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) return false;
  const authHeader = headers.get('authorization');
  return authHeader === `Bearer ${adminKey}`;
}
