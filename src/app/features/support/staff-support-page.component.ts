import { Component } from '@angular/core';
import { SupportPageComponent } from './support-page.component';
@Component({ selector: 'app-staff-support-page', standalone: true, imports: [SupportPageComponent], template: '<app-support-page [staff]="true" />' })
export class StaffSupportPageComponent {}
