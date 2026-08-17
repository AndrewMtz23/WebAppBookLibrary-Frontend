// 📁 book-dialog.component.ts
import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BookService } from 'src/app/core/services/book.service';
import { Book } from 'src/app/shared/models/book.model';

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
    MatDialogModule,
    MatSlideToggleModule
  ],
  templateUrl: './book-dialog.component.html',
  styleUrls: ['./book-dialog.component.css']
})
export class BookDialogComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<BookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { book?: Book }
  ) {}

  ngOnInit(): void {
    // ✅ Determinar si estamos editando basado en si hay un libro en data
    this.isEditMode = !!this.data?.book;

    // ✅ Inicializar formulario con datos del libro si existe
    this.form = this.fb.group({
      title: [this.data?.book?.title || '', Validators.required],
      author: [this.data?.book?.author || '', Validators.required],
      genre: [this.data?.book?.genre || '', Validators.required],
      year: [this.data?.book?.year || null, [Validators.min(0)]],
      isAvailable: [this.data?.book?.isAvailable ?? true]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const bookData: Book = {
      id: this.data?.book?.id, // ✅ Usar el ID del libro existente si estamos editando
      ...this.form.value
    };

    // ✅ Decidir entre update o create basado en si tenemos ID
    const request$ = this.isEditMode && bookData.id
      ? this.bookService.update(bookData.id, bookData)
      : this.bookService.create(bookData);

    request$.subscribe({
      next: (result) => {
        this.snackBar.open(
          this.isEditMode ? 'Libro actualizado correctamente' : 'Libro creado correctamente',
          'Cerrar',
          { duration: 3000 }
        );
        // ✅ Cerrar diálogo y devolver resultado para que la lista se actualice
        this.dialogRef.close(result);
      },
      error: (error) => {
        console.error('Error al guardar libro:', error);
        this.snackBar.open('Error al guardar libro', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onCancel(): void {
    // ✅ Cerrar diálogo sin resultado
    this.dialogRef.close();
  }
}