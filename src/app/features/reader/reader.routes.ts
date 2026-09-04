import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { ReaderShellComponent } from '../../core/layouts/reader-shell/reader-shell.component';
import { RouteFoundationComponent } from '../../shared/ui/route-foundation/route-foundation.component';

export const READER_ROUTES: Routes = [{
  path: '', component: ReaderShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['user'] },
  children: [
    { path: 'discover', component: RouteFoundationComponent, data: { eyebrow: 'Para ti', title: 'Descubrir', description: 'Un punto de partida para encontrar tu próxima lectura.' } },
    { path: 'catalog', loadChildren: () => import('../books/books.module').then(m => m.BooksModule) },
    { path: 'my-library', loadChildren: () => import('../loans/loans.module').then(m => m.LoansModule) },
    { path: 'favorites', component: RouteFoundationComponent, data: { title: 'Favoritos', description: 'Aquí vivirán los libros que quieras conservar cerca.' } },
    { path: 'profile', component: RouteFoundationComponent, data: { title: 'Perfil', description: 'Gestiona tu identidad y preferencias de lectura.' } },
    { path: '', pathMatch: 'full', redirectTo: 'discover' }
  ]
}];
