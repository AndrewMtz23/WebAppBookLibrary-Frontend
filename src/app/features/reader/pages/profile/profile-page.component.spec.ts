import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ReaderService } from '../../data-access/reader.service';
import { ProfileFacade } from '../../data-access/profile.facade';
import { ProfilePageComponent } from './profile-page.component';

describe('ProfilePageComponent', () => {
  it('uses username fallback, renders role and dates, and keeps independent aggregate results', () => {
    const reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getProfile', 'getLoans', 'getFavorites']);
    reader.getProfile.and.returnValue(of({ id: 'u1', displayName: '', username: 'elena', email: 'elena@example.com', role: 'user', createdAt: '2025-01-02T00:00:00Z', lastLoginAt: '2026-09-06T12:00:00Z' }));
    reader.getLoans.and.returnValues(
      of({ items: [], page: 1, pageSize: 1, totalItems: 3, totalPages: 3, hasNextPage: true, hasPreviousPage: false }),
      throwError(() => new Error('history unavailable'))
    );
    reader.getFavorites.and.returnValue(of({ items: [], page: 1, pageSize: 1, totalItems: 7, totalPages: 7, hasNextPage: true, hasPreviousPage: false }));
    TestBed.configureTestingModule({ imports: [ProfilePageComponent, NoopAnimationsModule], providers: [
      provideRouter([]), ProfileFacade,
      { provide: ReaderService, useValue: reader },
      { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } }
    ] });
    const fixture = TestBed.createComponent(ProfilePageComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('elena');
    expect(text).toContain('Lector');
    expect(text).toContain('3');
    expect(text).toContain('7');
    expect(text).toContain('No disponible');
    expect(text).not.toContain('Cambiar contraseña');
    expect(text).not.toContain('Eliminar cuenta');
  });

  it('shows the profile photo returned by the API', () => {
    const reader = jasmine.createSpyObj<ReaderService>('ReaderService', ['getProfile', 'getLoans', 'getFavorites']);
    reader.getProfile.and.returnValue(of({ id: 'u1', displayName: 'Elena', username: 'elena', email: 'elena@example.com', avatarUrl: 'https://images.example.test/elena.jpg', role: 'user', createdAt: '2025-01-02T00:00:00Z', lastLoginAt: null }));
    reader.getLoans.and.returnValues(of({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }), of({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    reader.getFavorites.and.returnValue(of({ items: [], page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false }));
    TestBed.configureTestingModule({ imports: [ProfilePageComponent, NoopAnimationsModule], providers: [
      provideRouter([]), ProfileFacade, { provide: ReaderService, useValue: reader }, { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } }
    ] });
    const fixture = TestBed.createComponent(ProfilePageComponent); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avatar img')?.getAttribute('src')).toBe('https://images.example.test/elena.jpg');
  });
});
