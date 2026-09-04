import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { StaffShellComponent } from '../../core/layouts/staff-shell/staff-shell.component';
import { RouteFoundationComponent } from '../../shared/ui/route-foundation/route-foundation.component';

export const LIBRARIAN_ROUTES: Routes = [{
  path: '', component: StaffShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['librarian'] },
  children: [
    { path: 'dashboard', component: RouteFoundationComponent, data: { eyebrow: 'Operación', title: 'Dashboard', description: 'Organiza el catálogo y las solicitudes pendientes.' } },
    { path: 'books', loadChildren: () => import('../books/books.module').then(m => m.BooksModule) },
    { path: 'loans', loadChildren: () => import('../loans/loans.module').then(m => m.LoansModule) },
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
  ]
}];
