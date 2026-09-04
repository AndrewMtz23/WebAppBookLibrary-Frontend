import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavigationItem } from '../../../core/navigation/navigation.model';
import { AppBrandComponent } from '../app-brand/app-brand.component';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({ selector: 'app-workspace-shell', standalone: true, imports: [AppBrandComponent, AvatarComponent, MatButtonModule, MatIconModule, RouterLink, RouterLinkActive, RouterOutlet], templateUrl: './workspace-shell.component.html', styleUrls: ['./workspace-shell.component.scss'], changeDetection: ChangeDetectionStrategy.OnPush })
export class WorkspaceShellComponent {
  @Input({ required: true }) navigation: readonly NavigationItem[] = [];
  @Input({ required: true }) username = '';
  @Input({ required: true }) contextLabel = '';
  @Output() logoutRequested = new EventEmitter<void>();
}
