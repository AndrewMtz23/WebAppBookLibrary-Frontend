import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { BookSummary } from '../../../../shared/models/book.model';

@Component({ selector: 'app-featured-book', standalone: true, imports: [RouterLink, MatIconModule], templateUrl: './featured-book.component.html', styleUrl: './featured-book.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class FeaturedBookComponent { @Input({ required: true }) book!: BookSummary; }
