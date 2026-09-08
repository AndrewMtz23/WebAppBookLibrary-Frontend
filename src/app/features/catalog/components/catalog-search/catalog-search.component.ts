import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-catalog-search',
  standalone: true,
  imports: [FormsModule, MatIconModule],
  templateUrl: './catalog-search.component.html',
  styleUrl: './catalog-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CatalogSearchComponent implements OnDestroy {
  @Input() value = '';
  @Output() readonly searchChanged = new EventEmitter<string>();
  private readonly values = new Subject<string>();
  private readonly subscription: Subscription;
  private composing = false;

  constructor() {
    this.subscription = this.values.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(value => this.searchChanged.emit(value.trim().length >= 2 ? value.trim() : ''));
  }

  onInput(value: string): void {
    this.value = value;
    if (!this.composing) this.values.next(value);
  }

  compositionStart(): void { this.composing = true; }

  compositionEnd(value: string): void {
    this.composing = false;
    this.onInput(value);
  }

  clear(): void {
    this.value = '';
    this.values.next('');
  }

  ngOnDestroy(): void { this.subscription.unsubscribe(); }
}
