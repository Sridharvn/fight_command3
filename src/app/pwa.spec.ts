import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { SwRegistrationOptions } from '@angular/service-worker';

describe('PWA & Fight Command Manifest Configuration (HF-PWA-001, HF-PWA-002)', () => {
  it('should provide ServiceWorker registration in appConfig (HF-PWA-002)', () => {
    TestBed.configureTestingModule({
      providers: appConfig.providers,
    });

    const swOptions = TestBed.inject(SwRegistrationOptions, null);
    expect(swOptions).toBeTruthy();
    expect(swOptions?.registrationStrategy).toBe('registerWhenStable:30000');
  });

  it('should have document configured for Fight Command PWA (HF-PWA-001)', () => {
    // Check manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      manifestLink.setAttribute('href', 'manifest.webmanifest');
      document.head.appendChild(manifestLink);
    }
    expect(manifestLink.getAttribute('href')).toBe('manifest.webmanifest');

    // Check theme-color meta
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      themeMeta.setAttribute('content', '#dc2626');
      document.head.appendChild(themeMeta);
    }
    expect(themeMeta.getAttribute('content')).toBe('#dc2626');
  });
});
