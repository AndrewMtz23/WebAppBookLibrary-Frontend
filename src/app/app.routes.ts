import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: 'app', loadChildren: () => import('./features/reader/reader.routes').then(m => m.READER_ROUTES) },
  { path: 'librarian', loadChildren: () => import('./features/librarian/librarian.routes').then(m => m.LIBRARIAN_ROUTES) },
  { path: 'admin', loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES) },
  { path: 'privacy', data: { document: 'privacy' }, loadComponent: () => import('./features/legal/legal-document-page.component').then(m => m.LegalDocumentPageComponent) },
  { path: 'legal', data: { document: 'legal' }, loadComponent: () => import('./features/legal/legal-document-page.component').then(m => m.LegalDocumentPageComponent) },
  { path: 'access-denied', loadComponent: () => import('./features/system/access-denied/access-denied.component').then(m => m.AccessDeniedComponent) },

  { path: 'catalog', pathMatch: 'full', redirectTo: 'app/catalog' },
  { path: 'loans', pathMatch: 'full', redirectTo: 'app/my-library' },
  { path: 'logs', pathMatch: 'full', redirectTo: 'admin/logs' },
  { path: 'security-dashboard', pathMatch: 'full', redirectTo: 'admin/security' },
  { path: 'login', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '', pathMatch: 'full', redirectTo: 'app/discover' },
  { path: '**', loadComponent: () => import('./features/system/not-found/not-found.component').then(m => m.NotFoundComponent) }
];
