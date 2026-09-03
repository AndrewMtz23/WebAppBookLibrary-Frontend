import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookService } from 'src/app/core/services/book.service';
import { Book, BookInput } from 'src/app/shared/models/book.model';

@Component({
  selector: 'app-book-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './book-dialog.component.html',
  styleUrls: ['./book-dialog.component.css']
})
export class BookDialogComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly bookService: BookService,
    private readonly snackBar: MatSnackBar,
    private readonly dialogRef: MatDialogRef<BookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: { book?: Book }
  ) {}

  ngOnInit(): void {
    this.isEditMode = Boolean(this.data?.book);
    this.form = this.fb.group({
      title: [this.data?.book?.title ?? '', Validators.required],
      author: [this.data?.book?.author ?? '', Validators.required],
      genre: [this.data?.book?.genre ?? '', Validators.required],
      year: [this.data?.book?.year ?? null, Validators.min(0)]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const book = this.form.getRawValue() as BookInput;
    const bookId = this.data?.book?.id;
    const request$ = this.isEditMode && bookId
      ? this.bookService.update(bookId, book)
      : this.bookService.create(book);

    request$.subscribe({
      next: result => {
        this.snackBar.open(
          this.isEditMode ? 'Libro actualizado correctamente' : 'Libro creado correctamente',
          'Cerrar',
          { duration: 3000 }
        );
        this.dialogRef.close(result);
      },
      error: (error: Error) => {
        this.snackBar.open(error.message || 'Error al guardar el libro', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
