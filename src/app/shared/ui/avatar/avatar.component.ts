import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AvatarSize = 'small' | 'medium' | 'large';

@Component({ selector: 'app-avatar', standalone: true, templateUrl: './avatar.component.html', styleUrl: './avatar.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class AvatarComponent {
  @Input({ required: true }) name = '';
  @Input() size: AvatarSize = 'medium';

  get initials(): string {
    const parts = this.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)?.[0] ?? '' : ''}`.toUpperCase();
  }
}
