import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ApiError } from 'src/app/core/http/api-error';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoginRequest } from 'src/app/shared/models/auth-request.model';
import { landingRouteForRole } from 'src/app/core/auth/role-landing';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  isLoggedIn = false;
  hidePassword = true;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  togglePasswordVisibility(event: MouseEvent): void {
    event.preventDefault();
    this.hidePassword = !this.hidePassword;
  }

  login(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Ingresa tu usuario y contraseña.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const request: LoginRequest = { username: this.username, password: this.password };

    this.authService.login(request).subscribe({
      next: response => {
        this.isLoggedIn = true;
        this.snackBar.open(`¡Bienvenido, ${response.user.username}!`, 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        void this.router.navigate([landingRouteForRole(response.user.role)]);
      },
      error: (error: ApiError) => {
        this.isLoading = false;
        this.errorMessage = error.message;
        this.snackBar.open(this.errorMessage, 'Cerrar', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  navigateToRegister(): void { void this.router.navigate(['/auth/register']); }
  navigateToBooks(): void { void this.router.navigate(['/catalog']); }
}
