import api from '@/lib/axios';
import { getRolePath } from '@/lib/roleRoutes';
import { isRoleSlug, type AuthUser, type RoleSlug } from '@/types/auth';

export const AUTH_CHANGED_EVENT = 'auth-changed';

interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/login', credentials);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/logout');
    return response.data;
  },

  async getUser(): Promise<AuthUser> {
    const response = await api.get<AuthUser>('/user');
    return response.data;
  },

  saveUser(user: AuthUser, token?: string): void {
    if (token) localStorage.setItem('token', token);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userId', String(user.id));

    if (user.nim_nip) localStorage.setItem('userNim', user.nim_nip);
    else localStorage.removeItem('userNim');

    if (user.role) {
      localStorage.setItem('role', user.role.slug);
      localStorage.setItem('roleName', user.role.name);
      localStorage.setItem('roleId', String(user.role.id));
    } else {
      localStorage.removeItem('role');
      localStorage.removeItem('roleName');
      localStorage.removeItem('roleId');
    }

    if (user.unit) {
      localStorage.setItem('userUnit', user.unit.name);
      localStorage.setItem('unitId', String(user.unit.id));
    } else {
      localStorage.removeItem('userUnit');
      localStorage.removeItem('unitId');
    }

    localStorage.setItem('isProfileCompleted', user.is_profile_completed ? 'true' : 'false');
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  saveAuthData(data: LoginResponse): void {
    this.saveUser(data.user, data.token);
  },

  clearAuthData(): void {
    ['token', 'userEmail', 'userName', 'userId', 'userNim', 'role', 'roleName', 'roleId', 'userUnit', 'unitId', 'isProfileCompleted']
      .forEach((key) => localStorage.removeItem(key));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  getRole(): string | null {
    return localStorage.getItem('role');
  },

  getRoleSlug(): RoleSlug | null {
    const value = localStorage.getItem('role');
    return isRoleSlug(value) ? value : null;
  },

  getRolePath(value?: string | null): string {
    return getRolePath(value ?? this.getRole());
  },

  redirectByRole(role?: string | null, navigate?: (options: { to: string }) => void): void {
    const path = getRolePath(role);
    if (navigate) {
      navigate({ to: path });
      return;
    }
    const baseUrl = import.meta.env.BASE_URL || '/';
    const fullPath = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${path}`;
    window.location.href = fullPath;
  },

  async updateProfile(data: { name: string; nim_nip: string }): Promise<AuthUser> {
    const response = await api.patch<{ success: boolean; message: string; data: AuthUser }>('/user/profile', data);
    return response.data.data;
  },
};
