import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseHeader } from './base-header';

describe('BaseHeader', () => {
  let component: BaseHeader;
  let fixture: ComponentFixture<BaseHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaseHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(BaseHeader);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
