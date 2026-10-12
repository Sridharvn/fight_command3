import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BaseHeader } from './base-header/base-header';
import { BaseFooter } from './base-footer/base-footer';

@Component({
  selector: 'app-base-layout',
  imports: [BaseHeader, BaseFooter],
  templateUrl: './base-layout.html',
  styleUrl: './base-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayout { }

