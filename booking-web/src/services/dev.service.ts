import api from '@/lib/axios';
import type { LoginResponse } from '@/services/auth.service';

export interface DevAccount {
  user_id: number;
  name: string;
  email: string;
  role: {
    name: string;
    slug: string;
  };
  unit: {
    name: string;
    code?: string | null;
    category?: string | null;
  };
}

export interface DevSession {
  enabled: boolean;
  default_user_id: number | null;
  accounts: DevAccount[];
}

/**
 * Menu dev hanya dirender di dev server atau saat VITE_DEV_LOGIN=true.
 * Backend tetap penentu akhir: tanpa AUTH_DEV_LOGIN, semua request 404.
 */
export const DEV_LOGIN_UI_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_DEV_LOGIN === 'true';

/**
 * Setelah logout, auto-login dev dimatikan untuk sesi tab ini supaya alur SSO
 * tetap bisa diuji. Tombol "Masuk sebagai Admin" menghapus flag ini.
 */
export const DEV_LOGIN_OPT_OUT_KEY = 'dev_login_opt_out';

export const devService = {
  /**
   * Probe ringan saat aplikasi dibuka. null berarti dev login tidak tersedia.
   */
  async session(): Promise<DevSession | null> {
    try {
      const response = await api.get<DevSession>('/dev/session', { timeout: 1500 });
      return response.data;
    } catch {
      return null;
    }
  },

  async login(userId?: number): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
      '/dev/login',
      userId ? { user_id: userId } : {},
    );
    return response.data;
  },
};
