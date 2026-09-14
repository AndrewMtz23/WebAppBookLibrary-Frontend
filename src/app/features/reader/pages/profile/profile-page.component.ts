import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ErrorStateComponent } from '../../../../shared/ui/error-state/error-state.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { ReaderProfile } from '../../models/reader.models';
import { ProfileFacade } from '../../data-access/profile.facade';

@Component({
  selector: 'app-profile-page', standalone: true,
  providers: [ProfileFacade],
  imports: [CommonModule, MatButtonModule, MatIconModule, PageHeaderComponent, ErrorStateComponent, SkeletonComponent, AvatarComponent],
  templateUrl: './profile-page.component.html', styleUrl: './profile-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  readonly facade = inject(ProfileFacade);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  displayName(profile: ReaderProfile): string { return profile.displayName.trim() || profile.username; }
  initials(profile: ReaderProfile): string {
    return this.displayName(profile).split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  }
  logout(): void { this.auth.logout(); void this.router.navigate(['/auth/login']); }
}
