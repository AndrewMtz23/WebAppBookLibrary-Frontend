import { StaffPageHeaderComponent } from '../../../../shared/ui/staff-page-header/staff-page-header.component';
import { Component } from '@angular/core';
import { StaffLoansFacade } from '../../../loans/data-access/staff-loans.facade';
import { StaffLoansComponent } from '../../../loans/components/staff-loans.component';
@Component({ selector: 'app-librarian-loans-page', standalone: true, imports: [StaffPageHeaderComponent, StaffLoansComponent], providers: [StaffLoansFacade], template: '<app-staff-page-header icon="assignment_return" title="Préstamos" description="Registra devoluciones y atiende los préstamos de tus lectores."></app-staff-page-header><app-staff-loans />', styleUrl: '../../../loans/components/staff-loans.scss' })
export class LoansPageComponent {}
