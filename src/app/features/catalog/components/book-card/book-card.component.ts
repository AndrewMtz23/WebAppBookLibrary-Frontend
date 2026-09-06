import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BookSummary } from '../../../../shared/models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BookCardComponent {
  @Input({ required: true }) book!: BookSummary;
  @Input() favoriteBusy = false;
  @Input() favoriteState: boolean | null = null;
  @Output() readonly openBook = new EventEmitter<string>();
  @Output() readonly toggleFavorite = new EventEmitter<BookSummary>();
  imageFailed = false;

  get favorite(): boolean { return this.favoriteState ?? this.book.isFavorite; }

  primaryLabel(book: BookSummary): string {
    return book.mediaType === 'digital' ? 'Ver y leer' : 'Ver y reservar';
  }

  availabilityLabel(book: BookSummary): string {
    if (book.mediaType === 'digital') return 'Acceso digital';
    return (book.availableCopies ?? 0) > 0
      ? `${book.availableCopies} ${book.availableCopies === 1 ? 'ejemplar disponible' : 'ejemplares disponibles'}`
      : 'Sin ejemplares disponibles';
  }

  markImageFailed(): void {
    this.imageFailed = true;
  }
}
