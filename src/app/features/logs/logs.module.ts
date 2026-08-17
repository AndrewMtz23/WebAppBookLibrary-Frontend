// 📁 logs.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms'; // ✅ Agregado FormsModule

import { LogsRoutingModule } from './logs-routing.module';
import { LogsListComponent } from './logs-list.component';

import { MaterialModule } from '../../shared/material.module';

@NgModule({
  declarations: [
    LogsListComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule, 
    MaterialModule,
    LogsRoutingModule
  ]
})
export class LogsModule {}