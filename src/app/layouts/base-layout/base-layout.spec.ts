import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseLayout } from './base-layout';

describe('BaseLayout', () => {
  let component: BaseLayout;
  let fixture: ComponentFixture<BaseLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header and footer components', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-base-header')).toBeTruthy();
    expect(compiled.querySelector('app-base-footer')).toBeTruthy();
  });
});

