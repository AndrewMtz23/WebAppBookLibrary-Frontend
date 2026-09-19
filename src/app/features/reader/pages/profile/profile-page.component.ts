import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
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
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, PageHeaderComponent, ErrorStateComponent, SkeletonComponent, AvatarComponent],
  templateUrl: './profile-page.component.html', styleUrl: './profile-page.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilePageComponent {
  readonly facade = inject(ProfileFacade);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly roleLabels = { user: 'Lector', librarian: 'Bibliotecario', admin: 'Administrador' };
  draft = { displayName: '', email: '', avatarUrl: '' };
  constructor() {
    effect(() => { const profile = this.facade.profile().data; if (profile) this.reset(profile); });
  }
  reset(profile: ReaderProfile, form?: NgForm): void {
    this.draft = { displayName: this.displayName(profile), email: profile.email, avatarUrl: profile.avatarUrl ?? '' };
    form?.resetForm(this.draft);
    if (form && !this.facade.conflict()) this.facade.saveError.set('');
  }
  changed(profile: ReaderProfile): boolean {
    return this.draft.displayName.trim() !== this.displayName(profile) || this.draft.email.trim() !== profile.email || this.draft.avatarUrl.trim() !== (profile.avatarUrl ?? '');
  }
  get previewUrl(): string | null {
    try { const url = new URL(this.draft.avatarUrl); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
  }
  save(form: NgForm, profile: ReaderProfile): void {
    if (form.invalid || !this.draft.displayName.trim() || !profile.updatedAt || (this.draft.avatarUrl.trim() && !this.previewUrl) || !this.changed(profile)) { form.control.markAllAsTouched(); return; }
    this.facade.save({ displayName: this.draft.displayName.trim(), email: this.draft.email.trim(), avatarUrl: this.draft.avatarUrl.trim() || null, expectedUpdatedAt: profile.updatedAt });
  }

  displayName(profile: ReaderProfile): string { return profile.displayName.trim() || profile.username; }
  initials(profile: ReaderProfile): string {
    return this.displayName(profile).split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
  }
  logout(): void { this.auth.logout(); void this.router.navigate(['/auth/login']); }
}
