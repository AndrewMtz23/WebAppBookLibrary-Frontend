// 📁 features/auth/register/register.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { USER_ROLES } from 'src/app/shared/constant/shared-constants';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username = '';
  password = '';
  confirmPassword = '';
  email = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  role = USER_ROLES.USER; 
  hidePassword = true;
  hideConfirmPassword = true;
  
  availableRoles = [
    { value: USER_ROLES.USER, label: 'Miembro de Biblioteca' }, // ✅ Español
    { value: USER_ROLES.LIBRARIAN, label: 'Bibliotecario' },
    { value: USER_ROLES.ADMIN, label: 'Administrador' }
  ];
  
  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar // ✅ AGREGADO para mejores notificaciones
  ) {}

  togglePasswordVisibility(event: MouseEvent, field: 'password' | 'confirmPassword') {
    event.preventDefault();
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

  isFormValid(): boolean {
    return !!(this.username && this.email && this.password && 
              this.confirmPassword && this.password === this.confirmPassword);
  }

  register() {
    this.errorMessage = '';
    this.successMessage = '';

    // ✅ VALIDACIONES MEJORADAS
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor completa todos los campos correctamente.';
      return;
    }

    if (this.username.length < 3) {
      this.errorMessage = 'El nombre de usuario debe tener al menos 3 caracteres.';
      return;
    }

    if (this.password.length < 5) {
      this.errorMessage = 'La contraseña debe tener al menos 5 caracteres.';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor ingresa un email válido.';
      return;
    }

    console.log('🚀 Registering user:', {
      username: this.username,
      email: this.email,
      role: this.role
    });

    this.isLoading = true;
    
    this.authService.register({
      username: this.username,
      password: this.password,
      email: this.email,
      role: this.role
    }).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        
        this.successMessage = `¡Registro exitoso! Redirigiendo al login...`;
        
        // ✅ NOTIFICACIÓN ADICIONAL
        this.snackBar.open(
          `¡Cuenta creada exitosamente! Bienvenido ${this.username}`, 
          'Cerrar', 
          { 
            duration: 4000,
            panelClass: ['success-snackbar']
          }
        );

        // ✅ Redirigir después de mostrar mensaje
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Registration error:', error);
        this.isLoading = false;
        
        // ✅ MANEJO DE ERRORES MEJORADO
        let errorMsg = 'Error al registrarse. Intenta más tarde.';
        
        if (error?.status === 400) {
          if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.error?.includes('email')) {
            errorMsg = 'Email inválido o ya existe.';
          } else if (error.error?.includes('password')) {
            errorMsg = 'La contraseña debe tener al menos 5 caracteres con mayúscula, minúscula y número.';
          } else if (error.error?.includes('username') || error.error?.includes('already exists')) {
            errorMsg = 'El nombre de usuario ya existe. Elige otro.';
          } else if (typeof error.error === 'string') {
            errorMsg = error.error;
          }
        } else if (error?.status === 409) {
          errorMsg = 'El usuario o email ya están registrados.';
        } else if (error?.status === 0) {
          errorMsg = 'Error de conexión. Verifica que el servidor esté funcionando.';
        }
        
        this.errorMessage = errorMsg;
        
        // ✅ TAMBIÉN MOSTRAR EN SNACKBAR
        this.snackBar.open(
          this.errorMessage, 
          'Cerrar', 
          { 
            duration: 4000,
            panelClass: ['error-snackbar']
          }
        );
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ✅ MÉTODO NUEVO: Para limpiar el formulario
  clearForm(): void {
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.email = '';
    this.role = USER_ROLES.USER;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ✅ MÉTODO NUEVO: Navegar al login
  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}