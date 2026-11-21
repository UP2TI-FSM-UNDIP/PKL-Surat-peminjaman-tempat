import { expect, type APIRequestContext, type Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:18000/api';

export type DevRole =
  | 'admin'
  | 'wadek2'
  | 'manajer-tata-usaha'
  | 'spv-sumberdaya'
  | 'peminjam'
  | 'dosen';

/** Email akun seed deterministik untuk setiap role. */
const ROLE_EMAILS: Record<DevRole, string> = {
  admin: 'admin@fsm.undip.ac.id',
  wadek2: 'wadek2@fsm.undip.ac.id',
  'manajer-tata-usaha': 'tu@fsm.undip.ac.id',
  'spv-sumberdaya': 'spv@fsm.undip.ac.id',
  peminjam: 'mahasiswa@student.undip.ac.id',
  dosen: 'dosen@undip.ac.id',
};

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
  role?: { id: number; name: string; slug: string } | null;
  unit?: { id: number; name: string; category?: string | null } | null;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
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

  const email = ROLE_EMAILS[role];
  const account = session.accounts.find((item) => item.email === email);

  if (!account) {
    throw new Error(`Akun dev untuk role ${role} (${email}) tidak ditemukan`);
  }

  const loginResponse = await request.post(`${API_BASE}/dev/login`, {
    data: { user_id: account.user_id },
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
      localStorage.setItem('role', data.user.role.slug);
      localStorage.setItem('roleName', data.user.role.name);
      localStorage.setItem('roleId', String(data.user.role.id));
    }

    if (data.user.unit) {
      localStorage.setItem('userUnit', data.user.unit.name);
      localStorage.setItem('unitId', String(data.user.unit.id));
    }

    if (data.user.unit?.category) {
      localStorage.setItem('userUnitCategory', data.user.unit.category);
    }

    localStorage.setItem(
      'isProfileCompleted',
      data.user.is_profile_completed ? 'true' : 'false',
    );
  }, auth);
}

export async function loginWithoutRole(page: Page, request: APIRequestContext): Promise<void> {
  const response = await request.post(`${API_BASE}/login`, {
    data: { email: 'norole@example.test', password: 'password' },
  });
  expect(response.ok()).toBeTruthy();
  const auth = (await response.json()) as LoginResponse;
  await page.addInitScript((data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userId', String(data.user.id));
    localStorage.setItem('isProfileCompleted', 'true');
  }, auth);
}

export async function loginAsProfile(page: Page, request: APIRequestContext): Promise<void> {
  const response = await request.post(`${API_BASE}/login`, {
    data: { email: 'profile@example.test', password: 'password' },
  });
  expect(response.ok()).toBeTruthy();
  const auth = (await response.json()) as LoginResponse;
  await page.addInitScript((data: LoginResponse) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    localStorage.setItem('userName', data.user.name);
    localStorage.setItem('userId', String(data.user.id));
    localStorage.setItem('role', 'peminjam');
    localStorage.setItem('roleName', 'Mahasiswa');
    localStorage.setItem('isProfileCompleted', 'false');
  }, auth);
}
