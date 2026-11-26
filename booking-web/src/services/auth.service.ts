import { authStorage } from '@/lib/authStorage';
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
    if (token) authStorage.setItem('token', token);
    authStorage.setItem('userEmail', user.email);
    authStorage.setItem('userName', user.name);
    authStorage.setItem('userId', String(user.id));

    if (user.nim_nip) authStorage.setItem('userNim', user.nim_nip);
    else authStorage.removeItem('userNim');

    if (user.role) {
      authStorage.setItem('role', user.role.slug);
      authStorage.setItem('roleName', user.role.name);
      authStorage.setItem('roleId', String(user.role.id));
    } else {
      authStorage.removeItem('role');
      authStorage.removeItem('roleName');
      authStorage.removeItem('roleId');
    }

    if (user.unit) {
      authStorage.setItem('userUnit', user.unit.name);
      authStorage.setItem('unitId', String(user.unit.id));
    } else {
      authStorage.removeItem('userUnit');
      authStorage.removeItem('unitId');
    }

    authStorage.setItem('isProfileCompleted', user.is_profile_completed ? 'true' : 'false');
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  saveAuthData(data: LoginResponse): void {
    this.saveUser(data.user, data.token);
  },

  clearAuthData(): void {
    ['token', 'userEmail', 'userName', 'userId', 'userNim', 'role', 'roleName', 'roleId', 'userUnit', 'unitId', 'isProfileCompleted']
      .forEach((key) => authStorage.removeItem(key));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  isAuthenticated(): boolean {
    return !!authStorage.getItem('token');
  },

  getRole(): string | null {
    return authStorage.getItem('role');
  },

  getRoleSlug(): RoleSlug | null {
    const value = authStorage.getItem('role');
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
