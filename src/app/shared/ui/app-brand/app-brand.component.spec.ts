import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppBrandComponent } from './app-brand.component';

describe('AppBrandComponent', () => {
  let fixture: ComponentFixture<AppBrandComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppBrandComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(AppBrandComponent);
  });

  it('provides an accessible home link', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a').getAttribute('aria-label')).toBe('Ir al inicio de Book Library');
  });
});
