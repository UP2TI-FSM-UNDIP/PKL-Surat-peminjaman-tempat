import { expect, type APIRequestContext, type Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:18000/api';

type DevRole = 'admin' | 'peminjam';

interface DevAccount {
  user_id: number;
  name: string;
  email: string;
  role: { name: string; slug: string };
}

interface DevSession {
  enabled: boolean;
  default_user_id: number | null;
  accounts: DevAccount[];
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  nim_nip?: string | null;
  is_profile_completed: boolean;
  role?: { id: number; name: string } | null;
  unit?: { id: number; name: string; category?: string | null } | null;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
  unit_category?: string | null;
}

export async function loginAs(
  page: Page,
  request: APIRequestContext,
  role: DevRole,
): Promise<void> {
  const sessionResponse = await request.get(`${API_BASE}/dev/session`);
  expect(sessionResponse.ok()).toBeTruthy();

  const session = (await sessionResponse.json()) as DevSession;
  expect(session.enabled).toBe(true);

  const userId =
    role === 'admin'
      ? session.default_user_id
      : session.accounts.find(
          (account) => account.email === 'mahasiswa@student.undip.ac.id',
        )?.user_id;

  if (!userId) {
    throw new Error(`Akun dev untuk role ${role} tidak ditemukan`);
  }

  const loginResponse = await request.post(`${API_BASE}/dev/login`, {
    data: { user_id: userId },
  });
  expect(loginResponse.ok()).toBeTruthy();

  const auth = (await loginResponse.json()) as LoginResponse;

  await page.addInitScript((data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userId', String(data.user.id));

    if (data.user.nim_nip) {
      localStorage.setItem('userNim', data.user.nim_nip);
    }

    if (data.user.role) {
      localStorage.setItem('role', data.user.role.name);
      localStorage.setItem('roleId', String(data.user.role.id));
    }

    if (data.user.unit) {
      localStorage.setItem('userUnit', data.user.unit.name);
      localStorage.setItem('unitId', String(data.user.unit.id));
    }

    if (data.unit_category) {
      localStorage.setItem('userUnitCategory', data.unit_category);
    } else if (data.user.unit?.category) {
      localStorage.setItem('userUnitCategory', data.user.unit.category);
    }

    localStorage.setItem(
      'isProfileCompleted',
      data.user.is_profile_completed ? 'true' : 'false',
    );
  }, auth);
}
