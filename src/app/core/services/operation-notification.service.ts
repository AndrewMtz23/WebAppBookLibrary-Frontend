import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class OperationNotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, false);
  }

  error(message: string): void {
    this.show(message, true);
  }

  private show(message: string, error: boolean): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: error ? 0 : 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      politeness: error ? 'assertive' : 'polite',
      panelClass: error ? 'operation-toast--error' : 'operation-toast--success'
    });
  }
}
