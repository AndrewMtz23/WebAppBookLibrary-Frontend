import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private readonly router: Router, private readonly authService: AuthService) {}

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean | UrlTree {
    const expectedRoles = (route.data['roles'] ?? []) as readonly string[];
    if (expectedRoles.length === 0) return true;
    const role = this.authService.sessionSnapshot?.user.role;
    return role && expectedRoles.includes(role) ? true : this.router.createUrlTree(['/access-denied']);
  }
}
