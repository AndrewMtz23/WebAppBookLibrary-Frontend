import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  it('returns an access-denied UrlTree when the session role is not allowed', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { sessionSnapshot: { user: { role: 'user' } } } }]
    });
    const router = TestBed.inject(Router);
    const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;
    const result = TestBed.inject(RoleGuard).canActivate(route, { url: '/admin/logs' } as RouterStateSnapshot);

    expect(result).toEqual(router.createUrlTree(['/access-denied']));
  });

  it('allows an admin through the librarian dashboard role matrix', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { sessionSnapshot: { user: { role: 'admin' } } } }]
    });
    const route = { data: { roles: ['librarian', 'admin'] } } as unknown as ActivatedRouteSnapshot;

    expect(TestBed.inject(RoleGuard).canActivate(route, { url: '/librarian/dashboard' } as RouterStateSnapshot)).toBeTrue();
  });
});
