import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type UiStatus = 'available' | 'unavailable' | 'active' | 'returned' | 'overdue' | 'cancelled' | 'digital';
const STATUS_PRESENTATION: Readonly<Record<UiStatus, { label: string; icon: string; tone: string }>> = {
  available: { label: 'Disponible', icon: 'check_circle', tone: 'success' }, unavailable: { label: 'No disponible', icon: 'block', tone: 'neutral' },
  active: { label: 'Activo', icon: 'schedule', tone: 'info' }, returned: { label: 'Devuelto', icon: 'assignment_turned_in', tone: 'success' },
  overdue: { label: 'Vencido', icon: 'error', tone: 'danger' }, cancelled: { label: 'Cancelado', icon: 'cancel', tone: 'neutral' },
  digital: { label: 'Digital', icon: 'devices', tone: 'accent' }
};

@Component({ selector: 'app-status-badge', standalone: true, imports: [MatIconModule], templateUrl: './status-badge.component.html', styleUrl: './status-badge.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class StatusBadgeComponent { @Input({ required: true }) status: UiStatus = 'active'; get presentation() { return STATUS_PRESENTATION[this.status]; } }
