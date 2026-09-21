import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { safeAuthReturnUrl } from '../../../core/auth/return-route';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
    selector: 'app-register', templateUrl: './register.component.html', styleUrls: ['./register.component.scss'],
    standalone: false
})
export class RegisterComponent {
  username = '';
  password = '';
  confirmPassword = '';
  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(private readonly auth: AuthService, private readonly router: Router, private readonly snackBar: MatSnackBar, private readonly route: ActivatedRoute) {}
  get authQuery() { return { returnUrl: safeAuthReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl')) }; }

  togglePasswordVisibility(event: MouseEvent, field: 'password' | 'confirmPassword'): void {
    event.preventDefault();
    field === 'password' ? this.hidePassword = !this.hidePassword : this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  isFormValid(): boolean {
    return Boolean(this.username && this.email && this.password && this.confirmPassword && this.password === this.confirmPassword);
  }

  register(): void {
    this.errorMessage = '';
    if (!this.isFormValid()) { this.errorMessage = 'Completa todos los campos correctamente.'; return; }
    if (this.username.length < 3) { this.errorMessage = 'El usuario debe tener al menos 3 caracteres.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) { this.errorMessage = 'Ingresa un correo válido.'; return; }

    this.isLoading = true;
    this.auth.register({ username: this.username, password: this.password, email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Cuenta creada. Ya puedes iniciar sesión.';
        this.snackBar.open(this.successMessage, 'Cerrar', { duration: 3500 });
        void this.router.navigate(['/auth/login'], { queryParams: this.authQuery });
      },
      error: error => {
        this.isLoading = false;
        this.errorMessage = error.message || 'No fue posible crear la cuenta.';
        this.snackBar.open(this.errorMessage, 'Cerrar', { duration: 4000 });
      }
    });
  }

  clearForm(): void {
    this.username = ''; this.password = ''; this.confirmPassword = ''; this.email = '';
    this.errorMessage = ''; this.successMessage = '';
  }

  navigateToLogin(): void { void this.router.navigate(['/auth/login'], { queryParams: this.authQuery }); }
}
