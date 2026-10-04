import { Component } from '@angular/core';
import { CirculationPanelComponent } from './circulation-panel.component';
@Component({ standalone: true, imports: [CirculationPanelComponent], template: `<header><p>Operación de biblioteca</p><h1>Circulación</h1><p>Confirma entregas y resuelve solicitudes de renovación.</p></header><app-circulation-panel [staff]="true" />`, styles: [`:host { display: block; padding: clamp(1rem, 3vw, 2.5rem); max-width: 1200px; margin: auto; } h1 { margin-block: .5rem; }`] })
export class CirculationPageComponent {}
