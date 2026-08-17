// 📁 app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'catalog',
    loadChildren: () =>
      import('./features/books/books.module').then(m => m.BooksModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'loans',
    loadChildren: () =>
      import('./features/loans/loans.module').then(m => m.LoansModule),
    canActivate: [AuthGuard]
  },
  {
  path: 'security-dashboard',
  loadComponent: () => import('./features/security-dashboard/security-dashboard.component')
    .then(m => m.SecurityDashboardComponent),
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['admin'] }
  },
  {
    path: 'logs',
    loadChildren: () =>
      import('./features/logs/logs.module').then(m => m.LogsModule),
    canActivate: [AuthGuard, RoleGuard], 
    data: { roles: ['admin'] }
  },
  {
    path: '',
    redirectTo: '/catalog',
    pathMatch: 'full'
  },
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  }
];