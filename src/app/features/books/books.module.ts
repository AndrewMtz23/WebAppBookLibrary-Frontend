// 📁 books.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BooksRoutingModule } from './books-routing.module';
import { RouterModule } from '@angular/router'; 
import { BooksListComponent } from './catalog/books-list.component';
// ✅ NO declarar BookDialogComponent aquí porque es standalone

import { MaterialModule } from 'src/app/shared/material.module';

@NgModule({
  declarations: [
    BooksListComponent
    // ✅ BookDialogComponent NO se declara porque es standalone
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    RouterModule,
    BooksRoutingModule
  ]
})
export class BooksModule {}