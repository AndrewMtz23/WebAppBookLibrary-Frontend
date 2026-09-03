// 📁 loans/loans.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoansRoutingModule } from './loans-routing.module';
import { LoansUserComponent } from './loansuser/loansuser.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // ✅ IMPORTANTE: FormsModule
import { MaterialModule } from '../../shared/material.module';

@NgModule({
  declarations: [
    LoansUserComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, // ✅ ESTE ES EL QUE FALTA PARA ngModel
    LoansRoutingModule,
    MaterialModule
  ]
})
export class LoansModule {}
