import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { CounterStore } from '../../store/counter.store';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [CounterStore]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render header logo text from BaseLayout', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-text')?.textContent).toContain('Martial Arts Arena');
  });

  it('should increment count on button click', async () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const incBtn = compiled.querySelector('.btn-increment') as HTMLButtonElement;
    expect(incBtn).toBeTruthy();

    incBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const countNum = compiled.querySelector('.count-number') as HTMLElement;
    expect(countNum.textContent?.trim()).toBe('1');
  });
});
