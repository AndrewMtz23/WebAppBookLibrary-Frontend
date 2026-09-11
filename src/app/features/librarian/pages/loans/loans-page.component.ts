import { Component } from '@angular/core';
import { StaffLoansFacade } from '../../../loans/data-access/staff-loans.facade';
import { StaffLoansComponent } from '../../../loans/components/staff-loans.component';
@Component({ selector: 'app-librarian-loans-page', standalone: true, imports: [StaffLoansComponent], providers: [StaffLoansFacade], template: '<header><p class="eyebrow">Operación</p><h1>Préstamos</h1><p>Registra devoluciones y atiende los préstamos de tus lectores.</p></header><app-staff-loans />', styleUrl: '../../../loans/components/staff-loans.scss' })
export class LoansPageComponent {}
