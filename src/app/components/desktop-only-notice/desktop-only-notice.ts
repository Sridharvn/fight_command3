import { Component, ChangeDetectionStrategy, output } from '@angular/core';

@Component({
  selector: 'app-desktop-only-notice',
  templateUrl: './desktop-only-notice.html',
  styleUrl: './desktop-only-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopOnlyNoticeComponent {
  readonly continueAnyway = output<void>();

  onContinueAnyway(): void {
    this.continueAnyway.emit();
  }
}
