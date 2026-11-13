import { Component } from '@angular/core';
import { CirculationPanelComponent } from './circulation-panel.component';
import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';

@Component({
  standalone: true,
  imports: [CirculationPanelComponent, StaffPageHeaderComponent],
  template: `
    <app-staff-page-header
      icon="swap_horiz"
      title="Circulación"
      description="Confirma entregas y resuelve solicitudes de renovación."
    />
    <app-circulation-panel [staff]="true" />
  `,
  styles: [`:host { display: block; min-width: 0; color: var(--color-text); font-family: var(--font-body); }`]
})
export class CirculationPageComponent {}
