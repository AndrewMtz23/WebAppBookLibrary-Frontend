import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PublicShellComponent } from './public-shell.component';

describe('PublicShellComponent', () => {
  let fixture: ComponentFixture<PublicShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicShellComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicShellComponent);
    fixture.detectChanges();
  });

  it('provides a single public main landmark and an auth outlet', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('main').length).toBe(1);
    expect(element.querySelector('main')?.getAttribute('tabindex')).toBe('-1');
    expect(element.querySelector('router-outlet')).not.toBeNull();
    expect(element.querySelector('[data-private-navigation]')).toBeNull();
  });

  it('marks the editorial artwork as decorative', () => {
    const artwork = fixture.nativeElement.querySelector('.public-shell__artwork');

    expect(artwork?.getAttribute('aria-hidden')).toBe('true');
  });
});
