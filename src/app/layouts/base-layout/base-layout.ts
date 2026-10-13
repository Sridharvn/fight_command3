import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { BaseHeader } from './base-header/base-header';
import { BaseFooter } from './base-footer/base-footer';
import { BaseSidebar } from './base-sidebar/base-sidebar';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-base-layout',
  imports: [BaseHeader, BaseFooter, BaseSidebar],
  templateUrl: './base-layout.html',
  styleUrl: './base-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayout {
  protected readonly authStore = inject(AuthStore);
}
