import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationGroup, NavigationItem } from '../../../core/navigation/navigation.model';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';
import { ReaderNavbarComponent } from '../reader-navbar/reader-navbar.component';
import { AdminFooterComponent } from '../admin-footer/admin-footer.component';

@Component({ selector: 'app-workspace-shell', standalone: true, imports: [ThemeToggleComponent, A11yModule, AdminFooterComponent, ReaderNavbarComponent, AppBrandComponent, AvatarComponent, SiteFooterComponent, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, RouterLinkActive, RouterOutlet], templateUrl: './workspace-shell.component.html', styleUrls: ['./workspace-shell.component.scss'], changeDetection: ChangeDetectionStrategy.OnPush })
export class WorkspaceShellComponent {
  private readonly sidebarStorageKey = 'booklibrary_sidebar_collapsed';

  @Input({ required: true }) navigation: readonly NavigationItem[] = [];
  @Input() navigationGroups: readonly NavigationGroup[] = [];
  @Input({ required: true }) username = '';
  @Input() email = '';
  @Input() guest = false;
  @Input() avatarUrl: string | null = null;
  @Input({ required: true }) contextLabel = '';
  @Input() variant: 'reader' | 'staff' = 'staff';
  @Output() logoutRequested = new EventEmitter<void>();

  isSidebarCollapsed = localStorage.getItem(this.sidebarStorageKey) === 'true';
  isLogoutDialogOpen = false;
  isLoggingOut = false;
  private readonly collapsedGroups = new Set<string>();

  get mobileNavigation(): readonly NavigationItem[] {
    if (this.variant === 'reader') return this.navigation.slice(0, 5);
    const publicSite = this.navigation.find(item => item.label === 'Sitio público');
    const operationalItems = this.navigation.filter(item => item !== publicSite).slice(0, 4);
    return publicSite ? [...operationalItems, publicSite] : operationalItems;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem(this.sidebarStorageKey, String(this.isSidebarCollapsed));
  }

  groupId(label: string): string {
    return `navigation-group-${label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  }

  isGroupExpanded(label: string): boolean {
    return !this.collapsedGroups.has(label);
  }

  toggleGroup(label: string): void {
    this.collapsedGroups.has(label) ? this.collapsedGroups.delete(label) : this.collapsedGroups.add(label);
  }

  requestLogout(): void {
    this.isLogoutDialogOpen = true;
  }

  cancelLogout(): void {
    this.isLogoutDialogOpen = false;
  }

  confirmLogout(): void {
    this.isLogoutDialogOpen = false;
    this.isLoggingOut = true;
    this.logoutRequested.emit();
  }
}
