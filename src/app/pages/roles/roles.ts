import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { RolesStore } from '../../stores/roles.store';
import { RoleItem, ScopeType } from '../../models/role.models';

@Component({
  selector: 'app-roles',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPage implements OnInit {
  protected readonly rolesStore = inject(RolesStore);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isModalOpen = signal(false);
  readonly editingRoleId = signal<number | null>(null);
  readonly modalError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly selectedPermissions = signal<string[]>([]);

  readonly scopeOptions: ScopeType[] = ['GLOBAL', 'COUNTRY', 'STATE', 'DISTRICT'];

  readonly roleForm = this.fb.group({
    name: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_ -]+$/)]],
    scopeType: ['GLOBAL' as ScopeType, [Validators.required]],
    canCreateRoles: [false],
  });

  ngOnInit(): void {
    this.rolesStore.loadRoles();
    this.rolesStore.loadPermissions();
  }

  openCreateModal(): void {
    this.editingRoleId.set(null);
    this.modalError.set(null);
    this.selectedPermissions.set([]);
    this.roleForm.reset({
      name: '',
      scopeType: 'GLOBAL',
      canCreateRoles: false,
    });
    this.isModalOpen.set(true);
  }

  openEditModal(role: RoleItem): void {
    this.editingRoleId.set(role.id);
    this.modalError.set(null);
    this.selectedPermissions.set([...(role.permissions || [])]);
    this.roleForm.reset({
      name: role.name,
      scopeType: role.scopeType,
      canCreateRoles: !!role.canCreateRoles,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.modalError.set(null);
  }

  isPermissionSelected(permKey: string): boolean {
    return this.selectedPermissions().includes(permKey);
  }

  togglePermission(permKey: string): void {
    const current = this.selectedPermissions();
    if (current.includes(permKey)) {
      this.selectedPermissions.set(current.filter((k) => k !== permKey));
    } else {
      this.selectedPermissions.set([...current, permKey]);
    }
  }

  toggleCategory(permKeys: string[]): void {
    const current = this.selectedPermissions();
    const allSelected = permKeys.every((k) => current.includes(k));
    if (allSelected) {
      this.selectedPermissions.set(current.filter((k) => !permKeys.includes(k)));
    } else {
      const merged = new Set([...current, ...permKeys]);
      this.selectedPermissions.set(Array.from(merged));
    }
  }

  toggleGroup(group: { category: string; permissions: { key: string; label: string }[] }): void {
    const keys = group.permissions.map((p) => p.key);
    this.toggleCategory(keys);
  }

  onSaveRole(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.modalError.set(null);
    const formVal = this.roleForm.getRawValue();

    const editId = this.editingRoleId();
    if (editId) {
      this.rolesStore
        .updateRole(editId, {
          name: formVal.name,
          scopeType: formVal.scopeType,
          canCreateRoles: formVal.canCreateRoles,
          permissions: this.selectedPermissions(),
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeModal();
          },
          error: (err: any) => {
            this.isSubmitting.set(false);
            this.modalError.set(err?.error?.message || 'Failed to update role');
          },
        });
    } else {
      this.rolesStore
        .createRole({
          name: formVal.name,
          scopeType: formVal.scopeType,
          canCreateRoles: formVal.canCreateRoles,
          permissions: this.selectedPermissions(),
        })
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.closeModal();
          },
          error: (err: any) => {
            this.isSubmitting.set(false);
            this.modalError.set(err?.error?.message || 'Failed to create role');
          },
        });
    }
  }

  onDeleteRole(role: RoleItem): void {
    if (role.isSystem) {
      alert('System roles cannot be deleted.');
      return;
    }
    if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      this.rolesStore.deleteRole(role.id).subscribe();
    }
  }
}
