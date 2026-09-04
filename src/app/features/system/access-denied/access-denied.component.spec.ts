import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AccessDeniedComponent } from './access-denied.component';

describe('AccessDeniedComponent', () => {
  it('explains that the current role lacks access', async () => {
    await TestBed.configureTestingModule({ imports: [AccessDeniedComponent, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('No tienes acceso');
  });
});
