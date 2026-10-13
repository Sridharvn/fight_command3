export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: number;
  accessToken: string;
  refreshToken: string;
}

export interface UserRole {
  id: number;
  name: string;
  scopeType?: string;
  hierarchyLevel?: number;
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRole;
  isActive: boolean;
  isDeleted?: boolean;
  permissions?: string[] | null;
  countryId?: number | null;
  stateId?: number | null;
  districtId?: number | null;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  error: string | null;
}
