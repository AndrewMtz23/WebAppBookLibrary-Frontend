import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Loan } from 'src/app/shared/models/loan.model';
import { LoanService } from 'src/app/core/services/loan.service';

@Component({
  selector: 'app-loans-dialog',
  templateUrl: './loan-dialog.component.html',
  styleUrls: ['./loan-dialog.component.css'],
  
})

export class LoansDialogComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<LoansDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { loan?: Loan },
    private loanService: LoanService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data.loan;

    this.form = this.fb.group({
      bookId: [this.data.loan?.bookId || '', Validators.required],
      userId: [this.data.loan?.userId || '', Validators.required],
      loanDate: [this.data.loan?.loanDate || '', Validators.required],
      returnDate: [this.data.loan?.returnDate || ''],
      isReturned: [this.data.loan?.isReturned ?? false]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const loanData: Loan = { ...this.data.loan, ...this.form.value };

    const request$ = this.isEditMode
      ? this.loanService.update(loanData.id!, loanData)
      : this.loanService.create(loanData);

    request$.subscribe({
      next: (res: any) => {
        this.dialogRef.close(res.data || res);
      },
      error: (err) => {
        console.error('Error al guardar préstamo:', err);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
