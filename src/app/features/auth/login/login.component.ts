// 📁 features/auth/login/login.component.ts
import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { LoginRequest } from 'src/app/shared/models/auth-request.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  isLoggedIn = false;
  hidePassword = true;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar // ✅ Agregado para notificaciones
  ) {}

  togglePasswordVisibility(event: MouseEvent) {
    event.preventDefault();
    this.hidePassword = !this.hidePassword;
  }

  login() {
    this.isLoading = true;
    this.errorMessage = '';

    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password.';
      this.isLoading = false;
      return;
    }

    const loginRequest: LoginRequest = {
      username: this.username,
      password: this.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('✅ Login successful:', response);
        this.isLoading = false;
        this.isLoggedIn = true;


        // ✅ Mostrar notificación de éxito
        this.snackBar.open(
          `¡Bienvenido, ${response.user.username}!`, 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );

        // ✅ NAVEGACIÓN CORREGIDA
        this.navigateBasedOnRole(response.user.role);
      },
      error: (err) => {
        console.error('❌ Login error:', err);
        this.isLoading = false;

        // ✅ MANEJO DE ERRORES MEJORADO
        if (err.status === 400) {
          this.errorMessage = 'Por favor ingresa usuario y contraseña.';
        } else if (err.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos.';
        } else if (err.status === 404) {
          this.errorMessage = 'Usuario no encontrado.';
        } else if (err.status === 0) {
          this.errorMessage = 'Error de conexión. Verifica que el servidor esté funcionando.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta más tarde.';
        }

        // ✅ También mostrar en snackbar
        this.snackBar.open(
          this.errorMessage, 
          'Cerrar', 
          { 
            duration: 4000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // ✅ NAVEGACIÓN CORREGIDA SEGÚN LAS RUTAS QUE TIENES
  private navigateBasedOnRole(role: string): void {
    console.log('🚀 Navigating based on role:', role);
    
    // ✅ CORREGIDO: Usar roles exactos de tu backend
    switch (role) {
      case 'Admin':
        console.log('🔑 Admin detected - redirecting to catalog');
        this.router.navigate(['/catalog']); // ✅ Admin ve catálogo con todas las opciones
        break;
      case 'Librarian':
        console.log('📚 Librarian detected - redirecting to catalog');
        this.router.navigate(['/catalog']); // ✅ Librarian ve catálogo con opciones de gestión
        break;
      case 'User':
        console.log('👤 User detected - redirecting to catalog');
        this.router.navigate(['/catalog']); // ✅ Usuario ve catálogo para apartar libros
        break;
      default:
        console.log('❓ Unknown role - redirecting to catalog');
        this.router.navigate(['/catalog']); // ✅ Por defecto al catálogo
        break;
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  // ✅ CORREGIDO: Método para navegar como invitado
  navigateToBooks(): void {
    this.router.navigate(['/catalog']); // ✅ CORREGIDO: /books → /catalog
  }
}