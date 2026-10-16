import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseFooter } from './base-footer';

describe('BaseFooter', () => {
  let component: BaseFooter;
  let fixture: ComponentFixture<BaseFooter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseFooter],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseFooter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render Fight Command copyright text (HF-PWA-001)', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const copyright = compiled.querySelector('.copyright');
    expect(copyright?.textContent).toContain('Fight Command');
  });
});
