import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { UsersStore } from '../../stores/users.store';
import { RolesStore } from '../../stores/roles.store';
import { MasterDataService } from '../../services/master-data.service';
import { CountryItem, DistrictItem, StateItem } from '../../models/master-data.models';
import { UserResponseModel } from '../../models/user.models';
import { UserSortOption } from '../../stores/users.store';

@Component({
  selector: 'app-users',
  imports: [BaseLayout, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage implements OnInit {
  protected readonly usersStore = inject(UsersStore);
  protected readonly rolesStore = inject(RolesStore);
  private readonly masterDataService = inject(MasterDataService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isModalOpen = signal(false);
  readonly editingUserId = signal<number | null>(null);
  readonly modalError = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  // Cascading location state
  readonly countries = signal<CountryItem[]>([]);
  readonly states = signal<StateItem[]>([]);
  readonly districts = signal<DistrictItem[]>([]);

  readonly userForm = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    roleId: [1, [Validators.required]],
    designation: [''],
    countryId: [null as number | null],
    stateId: [null as number | null],
    districtId: [null as number | null],
    phoneNumber: [''],
  });

  ngOnInit(): void {
    this.usersStore.loadUsers();
    this.rolesStore.loadRoles();
    this.loadCountries();
  }

  loadCountries(): void {
    this.masterDataService.getCountries().subscribe({
      next: (countries) => this.countries.set(countries),
      error: () => this.countries.set([]),
    });
  }

  onCountryChange(countryIdStr: string): void {
    const countryId = countryIdStr ? Number(countryIdStr) : null;
    this.userForm.patchValue({ countryId, stateId: null, districtId: null });
    this.states.set([]);
    this.districts.set([]);

    if (countryId) {
      this.masterDataService.getStates(countryId).subscribe({
        next: (states) => this.states.set(states),
        error: () => this.states.set([]),
      });
    }
  }

  onStateChange(stateIdStr: string): void {
    const stateId = stateIdStr ? Number(stateIdStr) : null;
    this.userForm.patchValue({ stateId, districtId: null });
    this.districts.set([]);

    if (stateId) {
      this.masterDataService.getDistricts(stateId).subscribe({
        next: (districts) => this.districts.set(districts),
        error: () => this.districts.set([]),
      });
    }
  }

  openCreateModal(): void {
    this.editingUserId.set(null);
    this.modalError.set(null);
    this.userForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: this.rolesStore.roles()[0]?.id || 1,
      designation: '',
      countryId: null,
      stateId: null,
      districtId: null,
      phoneNumber: '',
    });
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(4)]);
    this.userForm.controls.password.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(user: UserResponseModel): void {
    this.editingUserId.set(user.id);
    this.modalError.set(null);
    this.userForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      roleId: user.role?.id || 1,
      designation: user.designation || '',
      countryId: user.countryId || null,
      stateId: user.stateId || null,
      districtId: user.districtId || null,
      phoneNumber: user.phoneNumber || '',
    });
    // Password optional during edit
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();

    if (user.countryId) {
      this.masterDataService.getStates(user.countryId).subscribe((states) => {
        this.states.set(states);
        if (user.stateId) {
          this.masterDataService.getDistricts(user.stateId).subscribe((districts) => {
            this.districts.set(districts);
          });
        }
      });
    }

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.modalError.set(null);
  }

  onSaveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.modalError.set(null);
    const formVal = this.userForm.getRawValue();

    const editId = this.editingUserId();
    if (editId) {
      // Update
      const payload: any = {
        firstName: formVal.firstName,
        lastName: formVal.lastName,
        email: formVal.email,
        roleId: Number(formVal.roleId),
        designation: formVal.designation || undefined,
        countryId: formVal.countryId || undefined,
        stateId: formVal.stateId || undefined,
        districtId: formVal.districtId || undefined,
        phoneNumber: formVal.phoneNumber || undefined,
      };

      this.usersStore.updateUser(editId, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.modalError.set(err?.error?.message || 'Failed to update user');
        },
      });
    } else {
      // Create
      const payload: any = {
        firstName: formVal.firstName,
        lastName: formVal.lastName,
        email: formVal.email,
        password: formVal.password,
        roleId: Number(formVal.roleId),
        designation: formVal.designation || undefined,
        countryId: formVal.countryId || undefined,
        stateId: formVal.stateId || undefined,
        districtId: formVal.districtId || undefined,
        phoneNumber: formVal.phoneNumber || undefined,
      };

      this.usersStore.createUser(payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeModal();
        },
        error: (err: any) => {
          this.isSubmitting.set(false);
          this.modalError.set(err?.error?.message || 'Failed to create user');
        },
      });
    }
  }

  onDeleteUser(userId: number): void {
    if (confirm('Are you sure you want to deactivate/delete this user?')) {
      this.usersStore.deleteUser(userId).subscribe();
    }
  }

  onReactivateUser(userId: number): void {
    this.usersStore.reactivateUser(userId).subscribe();
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.usersStore.setSearch(input.value);
  }

  setStatus(status: 'active' | 'deleted' | 'all'): void {
    this.usersStore.setStatus(status);
  }

  prevPage(): void {
    if (this.usersStore.page() > 1) {
      this.usersStore.setPage(this.usersStore.page() - 1);
    }
  }

  nextPage(): void {
    if (this.usersStore.page() < this.usersStore.totalPages()) {
      this.usersStore.setPage(this.usersStore.page() + 1);
    }
  }

  getJurisdiction(user: UserResponseModel): string {
    if (user.district?.name) {
      return `${user.district.name}, ${user.state?.name || ''}`.replace(/,\s*$/, '');
    }
    if (user.state?.name) {
      return `${user.state.name}, ${user.country?.name || ''}`.replace(/,\s*$/, '');
    }
    if (user.country?.name) {
      return user.country.name;
    }
    if (user.role?.scopeType === 'GLOBAL') {
      return 'Global Scope';
    }
    return 'National / Unassigned';
  }

  onSortChange(sort: string): void {
    this.usersStore.setSort(sort as UserSortOption);
  }

  refreshUsers(): void {
    this.usersStore.loadUsers();
  }

  exportUsersToCsv(): void {
    const users = this.usersStore.sortedUsers();
    if (!users || users.length === 0) return;

    const headers = ['User ID', 'First Name', 'Last Name', 'Email', 'Role', 'Jurisdiction', 'Designation', 'Phone', 'Status'];
    const rows = users.map((u) => [
      u.id,
      `"${(u.firstName || '').replace(/"/g, '""')}"`,
      `"${(u.lastName || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.role?.name || '').replace(/"/g, '""')}"`,
      `"${this.getJurisdiction(u).replace(/"/g, '""')}"`,
      `"${(u.designation || '').replace(/"/g, '""')}"`,
      `"${(u.phoneNumber || '').replace(/"/g, '""')}"`,
      u.isDeleted ? 'Deactivated' : u.isActive ? 'Active' : 'Pending',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `users-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
