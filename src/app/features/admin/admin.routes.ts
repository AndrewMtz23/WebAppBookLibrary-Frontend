import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StaffShellComponent } from '../../core/layouts/staff-shell/staff-shell.component';

export const ADMIN_ROUTES: Routes = [{
  path: '', component: StaffShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin'] },
  children: [
    { path: 'dashboard', loadComponent: () => import('./dashboard/pages/admin-dashboard-page.component').then(m => m.AdminDashboardPageComponent) },
    { path: 'users', loadComponent: () => import('./users/pages/users-page.component').then(m => m.UsersPageComponent) },
    { path: 'books', loadComponent: () => import('./pages/books/books-page.component').then(m => m.BooksPageComponent) },
    { path: 'loans', loadComponent: () => import('./pages/loans/loans-page.component').then(m => m.LoansPageComponent) },
    { path: 'logs', loadComponent: () => import('./audit/pages/audit-page.component').then(m => m.AuditPageComponent) },
    { path: 'security', loadComponent: () => import('./security/pages/security-page.component').then(m => m.SecurityPageComponent) },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
  ]
}];
