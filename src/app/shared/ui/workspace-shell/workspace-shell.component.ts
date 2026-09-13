import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationItem } from '../../../core/navigation/navigation.model';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({ selector: 'app-workspace-shell', standalone: true, imports: [A11yModule, AppBrandComponent, AvatarComponent, MatButtonModule, MatIconModule, MatTooltipModule, RouterLink, RouterLinkActive, RouterOutlet], templateUrl: './workspace-shell.component.html', styleUrls: ['./workspace-shell.component.scss'], changeDetection: ChangeDetectionStrategy.OnPush })
export class WorkspaceShellComponent {
  private readonly sidebarStorageKey = 'booklibrary_sidebar_collapsed';

  @Input({ required: true }) navigation: readonly NavigationItem[] = [];
  @Input({ required: true }) username = '';
  @Input({ required: true }) contextLabel = '';
  @Output() logoutRequested = new EventEmitter<void>();

  isSidebarCollapsed = localStorage.getItem(this.sidebarStorageKey) === 'true';
  isLogoutDialogOpen = false;
  isLoggingOut = false;

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    localStorage.setItem(this.sidebarStorageKey, String(this.isSidebarCollapsed));
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
