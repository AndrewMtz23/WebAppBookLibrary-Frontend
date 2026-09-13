import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StaffShellComponent } from '../../core/layouts/staff-shell/staff-shell.component';

export const LIBRARIAN_ROUTES: Routes = [{
  path: '', component: StaffShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['librarian', 'admin'] },
  children: [
    { path: 'dashboard', loadComponent: () => import('./dashboard/pages/librarian-dashboard-page.component').then(m => m.LibrarianDashboardPageComponent) },
    { path: 'books', loadComponent: () => import('./pages/books/books-page.component').then(m => m.BooksPageComponent) },
    { path: 'loans', loadComponent: () => import('./pages/loans/loans-page.component').then(m => m.LoansPageComponent) },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
  ]
}];
