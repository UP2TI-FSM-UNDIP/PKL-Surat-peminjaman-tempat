/**
 * Tempat menyimpan sesi login di browser.
 *
 * Default memakai localStorage (satu login untuk semua tab). Untuk demo dengan
 * dev login, VITE_AUTH_PER_TAB=true memakai sessionStorage sehingga setiap tab
 * bisa login sebagai role yang berbeda tanpa saling menimpa.
 */
const perTab = import.meta.env.VITE_AUTH_PER_TAB === 'true';

function store(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  return perTab ? window.sessionStorage : window.localStorage;
}

export const authStorage = {
  getItem: (key: string): string | null => store()?.getItem(key) ?? null,
  setItem: (key: string, value: string): void => store()?.setItem(key, value),
  removeItem: (key: string): void => store()?.removeItem(key),
};
