import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { ReaderShellComponent } from '../../core/layouts/reader-shell/reader-shell.component';
import { RouteFoundationComponent } from '../../shared/ui/route-foundation/route-foundation.component';
import { CatalogFacade } from '../catalog/data-access/catalog.facade';
import { MyLibraryFacade } from './data-access/my-library.facade';

export const READER_ROUTES: Routes = [{
  path: '', component: ReaderShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['user'] },
  children: [
    { path: 'discover', component: RouteFoundationComponent, data: { eyebrow: 'Para ti', title: 'Descubrir', description: 'Un punto de partida para encontrar tu próxima lectura.' } },
    { path: 'catalog/:bookId', loadComponent: () => import('../catalog/pages/book-detail/book-detail-page.component').then(m => m.BookDetailPageComponent) },
    {
      path: 'catalog',
      providers: [CatalogFacade],
      loadComponent: () => import('../catalog/pages/catalog/catalog-page.component').then(m => m.CatalogPageComponent)
    },
    {
      path: 'my-library', providers: [MyLibraryFacade],
      loadComponent: () => import('./pages/my-library/my-library-page.component').then(m => m.MyLibraryPageComponent)
    },
    { path: 'favorites', loadComponent: () => import('./pages/favorites/favorites-page.component').then(m => m.FavoritesPageComponent) },
    { path: 'profile', component: RouteFoundationComponent, data: { title: 'Perfil', description: 'Gestiona tu identidad y preferencias de lectura.' } },
    { path: '', pathMatch: 'full', redirectTo: 'discover' }
  ]
}];
