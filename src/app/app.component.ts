// 📁 app.component.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  username: string = '';
  private userSubscription: Subscription;

  constructor(public authService: AuthService, private router: Router) {
    this.userSubscription = this.authService.currentUser.subscribe(
      user => this.username = user || ''
    );
  }

  // ✅ AGREGADO: Debug temporal para verificar roles
  ngOnInit(): void {
    // Solo loggear si está logueado
    if (this.authService.isLoggedIn()) {
      console.log('🔍 APP COMPONENT DEBUG:');
      console.log('  - Username:', this.username);
      console.log('  - User Role:', this.authService.getUserRole());
      console.log('  - Is Admin:', this.authService.isAdmin());
      console.log('  - Is Librarian:', this.authService.isLibrarian());
      console.log('  - Is User:', this.authService.isUser());
      console.log('  - Can View Logs:', this.authService.canViewLogs());
      console.log('  - Role Display Name:', this.authService.getRoleDisplayName());
    }
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  getRoleDisplayName(): string {
    return this.authService.getRoleDisplayName();
  }

  canViewAllLoans(): boolean {
    return this.authService.canViewAllLoans();
  }

  canViewLogs(): boolean {
    const result = this.authService.canViewLogs();
    // ✅ Debug temporal para botón Logs
    console.log('🔍 canViewLogs() called:', result);
    return result;
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole([role]);
  }

  isAdmin(): boolean {
    const result = this.authService.isAdmin();
    // ✅ Debug temporal para botón Logs
    console.log('🔍 isAdmin() called:', result);
    return result;
  }

  isUser(): boolean {
    return this.authService.isUser();
  }

  isAdminOrLibrarian(): boolean {
    return this.authService.isAdminOrLibrarian();
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}