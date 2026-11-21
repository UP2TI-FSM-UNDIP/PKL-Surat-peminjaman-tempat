import api from '@/lib/axios';

export interface Role {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface RoleResponse {
  success: boolean;
  data: Role[];
}

export interface SingleRoleResponse {
  success: boolean;
  data: Role;
}

export const roleService = {
  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await api.get<RoleResponse>('/roles');
    return response.data.data ?? [];
  },

  /**
   * Get single role by ID
   */
  async getRole(id: number): Promise<Role> {
    const response = await api.get<SingleRoleResponse>(`/roles/${id}`);
    return response.data.data;
  },
};
