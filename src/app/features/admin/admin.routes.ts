import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StaffShellComponent } from '../../core/layouts/staff-shell/staff-shell.component';
import { RouteFoundationComponent } from '../../shared/ui/route-foundation/route-foundation.component';

export const ADMIN_ROUTES: Routes = [{
  path: '', component: StaffShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] },
  children: [
    { path: 'dashboard', component: RouteFoundationComponent, data: { eyebrow: 'Administración', title: 'Dashboard', description: 'Supervisa la operación de la biblioteca desde un solo lugar.' } },
    { path: 'users', component: RouteFoundationComponent, data: { eyebrow: 'Administración', title: 'Usuarios', description: 'La gestión de cuentas se incorporará con información real y permisos auditables.' } },
    { path: 'books', loadComponent: () => import('./pages/books/books-page.component').then(m => m.BooksPageComponent) },
    { path: 'loans', loadChildren: () => import('../loans/loans.module').then(m => m.LoansModule) },
    { path: 'logs', loadChildren: () => import('../logs/logs.module').then(m => m.LogsModule) },
    { path: 'security', loadComponent: () => import('../security-dashboard/security-dashboard.component').then(m => m.SecurityDashboardComponent) },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
  ]
}];
