// 📁 core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private router: Router,
    private snackBar: MatSnackBar // ✅ Agregado para notificaciones
  ) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      return true;
    }

    // ✅ Mostrar mensaje informativo
    this.snackBar.open(
      '🔒 Debes iniciar sesión para acceder a esta página',
      'Cerrar',
      { 
        duration: 3000,
        panelClass: ['info-snackbar']
      }
    );

    this.router.navigate(['/auth/login']);
    return false;
  }
}