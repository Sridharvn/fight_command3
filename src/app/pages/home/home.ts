import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseLayout } from '../../layouts/base-layout/base-layout';
import { AuthStore } from '../../stores/auth.store';
import { APP_ROUTES } from '../../constants/app-routes';

@Component({
  selector: 'app-home',
  imports: [BaseLayout, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly authStore = inject(AuthStore);
  protected readonly appRoutes = APP_ROUTES;
}
