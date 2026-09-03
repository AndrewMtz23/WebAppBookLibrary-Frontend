import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './core/services/auth.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.scss'],
    standalone: false
})
export class AppComponent implements OnDestroy {
  username = '';
  private readonly userSubscription: Subscription;

  constructor(public readonly authService: AuthService, private readonly router: Router) {
    this.userSubscription = this.authService.currentUser.subscribe(user => this.username = user ?? '');
  }

  ngOnDestroy(): void { this.userSubscription.unsubscribe(); }
  getRoleDisplayName(): string { return this.authService.getRoleDisplayName(); }
  canViewAllLoans(): boolean { return this.authService.canViewAllLoans(); }
  canViewLogs(): boolean { return this.authService.canViewLogs(); }
  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }
  hasRole(role: string): boolean { return this.authService.hasRole([role]); }
  isAdmin(): boolean { return this.authService.isAdmin(); }
  isUser(): boolean { return this.authService.isUser(); }
  isAdminOrLibrarian(): boolean { return this.authService.isAdminOrLibrarian(); }

  handleLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/auth/login']);
  }
}
