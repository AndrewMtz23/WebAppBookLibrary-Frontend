import { Component } from '@angular/core';
import { StaffLoansFacade } from '../../../loans/data-access/staff-loans.facade';
import { StaffLoansComponent } from '../../../loans/components/staff-loans.component';
@Component({ selector: 'app-admin-loans-page', standalone: true, imports: [StaffLoansComponent], providers: [StaffLoansFacade], template: '<header><p class="eyebrow">Administración</p><h1>Préstamos</h1><p>Supervisa reservas, vencimientos y movimientos de la biblioteca.</p></header><app-staff-loans />', styleUrl: '../../../loans/components/staff-loans.scss' })
export class LoansPageComponent {}
