import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { ReaderShellComponent } from '../../core/layouts/reader-shell/reader-shell.component';
import { CatalogFacade } from '../catalog/data-access/catalog.facade';
import { MyLibraryFacade } from './data-access/my-library.facade';
import { DiscoverFacade } from './data-access/discover.facade';
import { ProfileFacade } from './data-access/profile.facade';

export const READER_ROUTES: Routes = [{
  path: '', component: ReaderShellComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['user'] },
  children: [
    { path: 'discover', providers: [DiscoverFacade], loadComponent: () => import('./pages/discover/discover-page.component').then(m => m.DiscoverPageComponent) },
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
    { path: 'profile', providers: [ProfileFacade], loadComponent: () => import('./pages/profile/profile-page.component').then(m => m.ProfilePageComponent) },
    { path: '', pathMatch: 'full', redirectTo: 'discover' }
  ]
}];
