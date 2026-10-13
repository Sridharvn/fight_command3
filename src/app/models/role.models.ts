export type ScopeType = 'GLOBAL' | 'COUNTRY' | 'STATE' | 'DISTRICT' | 'EVENT';

export interface RoleItem {
  id: number;
  name: string;
  parentRoleId?: number | null;
  parentRole?: RoleItem | null;
  hierarchyLevel?: number;
  scopeType: ScopeType;
  isSystem: boolean;
  canCreateRoles: boolean;
  isDeleted?: boolean;
  permissions: string[];
  createdAt?: string;
}

export interface CreateRolePayload {
  name: string;
  parentRoleId?: number;
  scopeType?: ScopeType;
  permissions: string[];
  canCreateRoles?: boolean;
}

export interface UpdateRolePayload {
  name?: string;
  scopeType?: ScopeType;
  permissions?: string[];
  canCreateRoles?: boolean;
}

export interface PermissionItem {
  key: string;
  label: string;
  description?: string;
}

export interface PermissionCategoryGroup {
  category: string;
  icon?: string;
  permissions: PermissionItem[];
}
