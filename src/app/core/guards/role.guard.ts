// 📁 core/guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService // ✅ Agregado para mejor integración
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const rawUserRole = this.authService.getUserRole();
    const userRole = rawUserRole?.toLowerCase() || null; // ✅ Manejar undefined

    // ✅ Verificar si no hay roles requeridos
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    // ✅ Verificar si el usuario tiene el rol requerido
    if (userRole && expectedRoles.includes(userRole)) {
      return true;
    }

    // ✅ Mostrar mensaje personalizado según el rol del usuario
    const roleMessages = {
      'admin': '⚠️ Esta sección requiere permisos de administrador.',
      'librarian': '📚 Esta función es solo para bibliotecarios y administradores.',
      'user': '👤 No tienes permisos para acceder a esta sección.'
    };

    const defaultMessage = '⚠️ Acceso denegado. No tienes permisos suficientes.';
    const message = roleMessages[userRole as keyof typeof roleMessages] || defaultMessage;

    // ✅ Mostrar notificación con estilo de error
    this.snackBar.open(message, 'Cerrar', { 
      duration: 4000,
      panelClass: ['error-snackbar']
    });

    // ✅ Redirigir según el contexto del usuario
    const redirectRoute = this.getRedirectRoute(userRole);
    this.router.navigate([redirectRoute]);
    
    return false;
  }

  // ✅ Método para determinar la ruta de redirección - tipado corregido
  private getRedirectRoute(userRole: string | null): string {
    switch (userRole) {
      case 'admin':
      case 'librarian':
        return '/catalog';
      case 'user':
        return '/catalog';
      default:
        return '/auth/login';
    }
  }
}