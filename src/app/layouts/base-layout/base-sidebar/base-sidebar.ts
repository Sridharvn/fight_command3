import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutStore } from '../../../stores/layout.store';
import { AuthStore } from '../../../stores/auth.store';

@Component({
  selector: 'app-base-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './base-sidebar.html',
  styleUrl: './base-sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseSidebar {
  protected readonly layoutStore = inject(LayoutStore);
  protected readonly authStore = inject(AuthStore);

  get initials(): string {
    const user = this.authStore.user();
    if (!user) return '?';
    const first = user.firstName ? user.firstName[0].toUpperCase() : '';
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return `${first}${last}` || user.email[0].toUpperCase();
  }

  onLogout(): void {
    this.authStore.logout();
  }
}
