// 📁 shared/material.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

// ✅ MÓDULOS YA EXISTENTES
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

// ✅ NUEVOS MÓDULOS PARA SECURITY DASHBOARD
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatTabsModule,
    // ✅ MÓDULOS EXISTENTES
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatMenuModule,
    // ✅ NUEVOS MÓDULOS PARA SECURITY DASHBOARD
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule
  ],
  exports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatCardModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatSelectModule,
    MatTabsModule,
    // ✅ MÓDULOS EXISTENTES EN EXPORTS
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatMenuModule,
    // ✅ NUEVOS MÓDULOS EN EXPORTS
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatChipsModule
  ]
})
export class MaterialModule {}