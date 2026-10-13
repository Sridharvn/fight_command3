import { UserRole } from './auth.models';

export interface UserResponseModel {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  designation?: string | null;
  role: UserRole;
  isActive: boolean;
  isDeleted?: boolean;
  permissions?: string[] | null;
  countryId?: number | null;
  stateId?: number | null;
  districtId?: number | null;
  country?: { countryId: number; name: string };
  state?: { stateId: number; name: string };
  district?: { districtId: number; name: string };
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  designation?: string;
  countryId?: number;
  stateId?: number;
  districtId?: number;
  phoneNumber?: string;
  permissions?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: number;
  designation?: string;
  countryId?: number;
  stateId?: number;
  districtId?: number;
  phoneNumber?: string;
  isActive?: boolean;
  permissions?: string[];
}

export interface UsersPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'deleted' | 'all';
}

export interface UsersPaginatedResponse {
  data: UserResponseModel[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
