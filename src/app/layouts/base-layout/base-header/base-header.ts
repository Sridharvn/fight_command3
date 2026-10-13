import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../stores/auth.store';
import { LayoutStore } from '../../../stores/layout.store';

@Component({
  selector: 'app-base-header',
  imports: [RouterLink],
  templateUrl: './base-header.html',
  styleUrl: './base-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseHeader {
  protected readonly authStore = inject(AuthStore);
  protected readonly layoutStore = inject(LayoutStore);
}
