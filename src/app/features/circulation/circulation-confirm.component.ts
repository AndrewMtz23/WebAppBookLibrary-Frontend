import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({ standalone: true, imports: [FormsModule, MatDialogModule, MatButtonModule], template: `
  <h2 mat-dialog-title>{{ data.title }}</h2>
  <mat-dialog-content><p>{{ data.message }}</p>
    @if (data.reason) { <label for="decision-reason">Motivo del rechazo</label><textarea id="decision-reason" [(ngModel)]="reason" maxlength="500" rows="4" required></textarea> }
  </mat-dialog-content>
  <mat-dialog-actions align="end"><button mat-button [mat-dialog-close]="null">Volver</button><button mat-flat-button [disabled]="data.reason && !reason.trim()" [mat-dialog-close]="{ reason: reason.trim() }">Confirmar</button></mat-dialog-actions>`,
  styles: [`textarea { display: block; width: 100%; box-sizing: border-box; margin-top: .5rem; color: inherit; background: transparent; border: 1px solid currentColor; border-radius: .5rem; padding: .7rem; font: inherit; }`]
})
export class CirculationConfirmComponent { readonly data = inject<{title: string; message: string; reason?: boolean}>(MAT_DIALOG_DATA); reason = ''; }
