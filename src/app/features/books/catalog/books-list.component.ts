// 📁 books-list.component.ts
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { Book } from 'src/app/shared/models/book.model';
import { BookService } from 'src/app/core/services/book.service';
import { LoanService } from 'src/app/core/services/loan.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { BookDialogComponent } from '../book-dialog/book-dialog.component';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-books-list',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.css']
})
export class BooksListComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  filteredBooks: Book[] = [];
  loading = true;
  error = '';
  
  // ✅ MODAL DE CONFIRMACIÓN
  @ViewChild('confirmTpl') confirmTpl!: TemplateRef<any>;
  dialogData: any = {};
  
  // ✅ CARRUSEL
  slides = [0, 1]; // Dos slides
  currentSlide = 0;
  carouselInterval: any;
  
  // ✅ FILTROS
  selectedGenre = '';
  showOnlyAvailable = false;
  uniqueGenres: string[] = [];

  constructor(
    private bookService: BookService,
    private loanService: LoanService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadBooks();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  // ✅ MODAL DE CONFIRMACIÓN MEJORADO
  private async confirmDialog(message: string, title = 'Confirmación', type: 'warning' | 'danger' | 'info' = 'warning'): Promise<boolean> {
    // Almacenar los datos en la propiedad del componente
    this.dialogData = { 
      title, 
      message, 
      type,
      icon: type === 'danger' ? 'delete_forever' : 
            type === 'info' ? 'bookmark_add' : 'help_outline',
      confirmText: type === 'danger' ? 'Eliminar' : 
                   type === 'info' ? 'Apartar' : 'Confirmar',
      confirmColor: type === 'danger' ? 'warn' : 'primary'
    };

    console.log('📝 Datos del modal:', this.dialogData); // Debug

    const ref = this.dialog.open(this.confirmTpl, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false
    });
    
    const result = await firstValueFrom(ref.afterClosed());
    console.log('🔍 Resultado del modal:', result); // Debug
    return result === true;
  }

  // ✅ CARRUSEL METHODS
  startCarousel(): void {
    this.carouselInterval = setInterval(() => {
      this.nextSlide();
    }, 5000); // Cambiar cada 5 segundos
  }

  stopCarousel(): void {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  previousSlide(): void {
    this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    // Reiniciar el auto-play
    this.stopCarousel();
    this.startCarousel();
  }

  scrollToBooks(): void {
    document.getElementById('catalog-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }

  // ✅ MÉTODOS DE FILTRADO
  filterByGenre(genre: string): void {
    if (this.selectedGenre === genre) {
      this.selectedGenre = '';
    } else {
      this.selectedGenre = genre;
    }
    this.applyFilters();
  }

  toggleAvailableFilter(): void {
    this.showOnlyAvailable = !this.showOnlyAvailable;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredBooks = this.books.filter(book => {
      const genreMatch = !this.selectedGenre || book.genre === this.selectedGenre;
      const availableMatch = !this.showOnlyAvailable || book.isAvailable;
      return genreMatch && availableMatch;
    });
  }

  clearFilters(): void {
    this.selectedGenre = '';
    this.showOnlyAvailable = false;
    this.filteredBooks = [...this.books];
  }

  private updateGenres(): void {
    this.uniqueGenres = [...new Set(this.books.map(book => book.genre))].filter(Boolean);
  }

  // ✅ TRACKING FUNCTION
  trackByBookId(index: number, book: Book): string {
    return book.id || index.toString();
  }

  // ✅ MÉTODOS EXISTENTES MEJORADOS
  onCreateBook(): void {
    // Pausar carrusel mientras se crea libro
    this.stopCarousel();
    
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBooks();
      }
      // Reiniciar carrusel
      this.startCarousel();
    });
  }

  onEdit(book: Book): void {
    this.stopCarousel();
    
    const dialogRef = this.dialog.open(BookDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { book }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBooks();
      }
      this.startCarousel();
    });
  }

  // ✅ ELIMINAR LIBRO CON MODAL MEJORADO
  async onDelete(bookId: string): Promise<void> {
    console.log('🗑️ Intentando eliminar libro:', bookId); // Debug
    
    const confirmed = await this.confirmDialog(
      '¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer.',
      'Eliminar Libro',
      'danger'
    );

    console.log('✅ Confirmación recibida:', confirmed); // Debug

    if (!confirmed) {
      console.log('❌ Usuario canceló la eliminación');
      return;
    }

    console.log('🚀 Procediendo con la eliminación...'); // Debug

    this.bookService.delete(bookId).subscribe({
      next: () => {
        console.log('✅ Libro eliminado correctamente');
        this.snackBar.open('Libro eliminado correctamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.loadBooks();
      },
      error: (err) => {
        console.error('❌ Error al eliminar libro:', err);
        this.snackBar.open('Error al eliminar el libro', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadBooks(): void {
    this.loading = true;
    this.error = '';
    
    this.bookService.getAll().subscribe({
      next: (res: any) => {
        console.log('✅ Libros cargados:', res);
        this.books = res.data ?? res;
        this.filteredBooks = [...this.books];
        this.updateGenres();
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error al cargar libros:', err);
        this.error = 'Error al cargar los libros';
        this.loading = false;
      }
    });
  }

  // ✅ APARTAR LIBRO CON MODAL MEJORADO
  async apartar(bookId: string): Promise<void> {
    console.log('📚 Intentando apartar libro:', bookId); // Debug
    
    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackBar.open('Debes iniciar sesión para apartar un libro.', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Buscar el libro para mostrar su título en el modal
    const book = this.books.find(b => b.id === bookId);
    const bookTitle = book?.title || 'este libro';

    const confirmed = await this.confirmDialog(
      `¿Quieres apartar "${bookTitle}"? Se creará un préstamo a tu nombre y el libro quedará reservado para ti.`,
      'Apartar Libro',
      'info'
    );

    console.log('✅ Confirmación recibida:', confirmed); // Debug

    if (!confirmed) {
      console.log('❌ Usuario canceló apartar libro');
      return;
    }

    console.log('🚀 Procediendo con apartar libro...'); // Debug

    const loanData = {
      bookId: bookId
    };

    this.loanService.create(loanData).subscribe({
      next: (res) => {
        console.log('✅ Libro apartado exitosamente:', res);
        this.snackBar.open(
          res.message || 'Libro apartado exitosamente', 
          'Cerrar', 
          { 
            duration: 3000,
            panelClass: ['success-snackbar']
          }
        );
        this.loadBooks(); // Recargar para actualizar disponibilidad
      },
      error: (err) => {
        console.error('❌ Error al apartar libro:', err);
        this.snackBar.open(
          err.message || 'No se pudo apartar el libro', 
          'Cerrar', 
          { 
            duration: 4000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  // ✅ GETTERS PARA PERMISOS
  get isAdminOrLibrarian(): boolean {
    return this.authService.isAdminOrLibrarian();
  }

  get isUser(): boolean {
    return this.authService.isUser();
  }

  // ✅ MÉTODO HELPER PARA LOGIN STATE
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // ✅ MÉTODO HELPER: Para verificar si el usuario puede apartar libros
  canBorrowBooks(): boolean {
    return this.authService.isLoggedIn() && this.authService.isUser();
  }

  // ✅ MÉTODO HELPER: Para verificar si se puede mostrar el botón de crear
  canCreateBooks(): boolean {
    return this.authService.canCreateBooks();
  }
}