/**
 * Arahkan browser ke portal SSO FSM. SSO lalu memanggil backend /auth/sso dan
 * mengembalikan pengguna ke aplikasi ini.
 *
 * @returns pesan galat bila konfigurasi SSO belum lengkap, selain itu `null`.
 */
export function startSsoLogin(): string | null {
  const clientId = import.meta.env.VITE_SSO_CLIENT_ID as string;
  const redirectUri = import.meta.env.VITE_SSO_REDIRECT_URI as string;
  const ssoLoginUrl =
    (import.meta.env.VITE_SSO_LOGIN_URL as string) || 'https://apps-fsm.undip.ac.id/sso/';

  if (!clientId || !redirectUri) {
    return 'Konfigurasi SSO belum lengkap. Hubungi administrator.';
  }

  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri });
  window.location.href = `${ssoLoginUrl}?${params.toString()}`;
  return null;
}

/** Login email/password lokal hanya aktif bila VITE_LOCAL_LOGIN=true. */
export const LOCAL_LOGIN_ENABLED = import.meta.env.VITE_LOCAL_LOGIN === 'true';
