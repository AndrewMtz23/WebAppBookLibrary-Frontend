import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('returns a login UrlTree with the local return URL for anonymous users', () => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { isAuthenticated: false } }]
    });
    const router = TestBed.inject(Router);
    const result = TestBed.inject(AuthGuard).canActivate(
      {} as ActivatedRouteSnapshot,
      { url: '/app/catalog' } as RouterStateSnapshot
    );

    expect(result).toEqual(router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: '/app/catalog' } }));
  });
});
