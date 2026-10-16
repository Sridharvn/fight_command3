import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DesktopOnlyNoticeComponent } from './components/desktop-only-notice/desktop-only-notice';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DesktopOnlyNoticeComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentUrl = signal<string>(this.router.url || '');
  readonly isMobileViewport = signal<boolean>(false);
  readonly isAdvisoryDismissed = signal<boolean>(false);

  readonly isPublicRoute = computed<boolean>(() => {
    const url = this.currentUrl();
    // Matches public registration routes like /events/:eventId/register
    return /\/events\/[^/]+\/register/.test(url);
  });

  readonly isAdvisoryVisible = computed<boolean>(() => {
    return this.isMobileViewport() && !this.isAdvisoryDismissed() && !this.isPublicRoute();
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileViewport.set(window.innerWidth < 768);

      const onResize = () => {
        this.isMobileViewport.set(window.innerWidth < 768);
      };

      window.addEventListener('resize', onResize, { passive: true });
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', onResize);
      });
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });
  }

  dismissAdvisory(): void {
    this.isAdvisoryDismissed.set(true);
  }
}
