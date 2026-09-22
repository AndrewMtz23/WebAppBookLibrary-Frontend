import { Component, DestroyRef, EventEmitter, Input, OnChanges, OnInit, Output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CategoriesApi, CategoryRef } from './categories.api';
import { PagedResult } from '../../shared/models/paged-result.model';
@Component({
  selector: 'app-category-selector', standalone: true, imports: [FormsModule],
  styleUrl: '../books/components/staff-books.scss',
  styles: [`.chips, .options { display: flex; flex-wrap: wrap; gap: .5rem; margin-block: .75rem; } .options button[aria-pressed=true] { border-color: var(--color-primary); background: var(--color-primary-soft); }`],
  template: `
    <div role="group" aria-labelledby="category-label"><p id="category-label">Géneros * · {{ ids.length }}/8 seleccionados</p>
    <div class="chips" aria-label="Géneros seleccionados">@for (id of ids; track id) { <button type="button" [disabled]="disabled" (click)="toggle(id)" [attr.aria-label]="'Quitar ' + label(id)">{{ label(id) }} ×</button> }</div>
    @if (legacy.length && !existing.length) { <p>Clasificación anterior: {{ legacy.join(', ') }}. Selecciona sus equivalentes del catálogo para guardar; no se crean categorías automáticamente.</p> }
    <label>Buscar géneros<input [disabled]="disabled" [ngModel]="query" (ngModelChange)="search($event)" [ngModelOptions]="{standalone:true}" maxlength="80" placeholder="Buscar en el catálogo"></label>
    @if (loading()) { <p role="status">Cargando géneros…</p> }
    @if (error()) { <p role="alert" class="error">{{ error() }}</p><button type="button" (click)="load()" [disabled]="disabled">Reintentar</button> }
    @if (result(); as result) {
      <div class="options">@for (category of result.items; track category.id) { <button type="button" [attr.aria-pressed]="ids.includes(category.id)" [disabled]="disabled || (!ids.includes(category.id) && ids.length >= 8)" (click)="toggle(category.id)">{{ category.name }}</button> }</div>
      @if (!result.items.length && !loading()) { <p>No hay géneros disponibles con esta búsqueda.</p> }
      <nav class="pagination" aria-label="Páginas de géneros"><button type="button" [disabled]="disabled || loading() || !result.hasPreviousPage" (click)="load(page - 1)">Anterior</button><span>{{ result.page }} / {{ result.totalPages || 1 }}</span><button type="button" [disabled]="disabled || loading() || !result.hasNextPage" (click)="load(page + 1)">Siguiente</button></nav>
    }
    @if (invalid) { <p role="alert" class="error">Selecciona entre 1 y 8 géneros del catálogo.</p> }
    <small>Las categorías inactivas ya asignadas pueden conservarse o quitarse.</small></div>`
})
export class CategorySelectorComponent implements OnInit, OnChanges {
  @Input() ids: string[] = []; @Input() existing: readonly CategoryRef[] = []; @Input() legacy: readonly string[] = [];
  @Input() disabled = false; @Input() invalid = false;
  @Output() idsChange = new EventEmitter<string[]>();
  private readonly api = inject(CategoriesApi); private readonly destroyRef = inject(DestroyRef);
  private request?: Subscription; private readonly known = new Map<string, CategoryRef>();
  readonly result = signal<PagedResult<CategoryRef> | null>(null); readonly error = signal(''); readonly loading = signal(false);
  query = ''; page = 1;
  ngOnInit() { this.load(); }
  ngOnChanges() { this.existing.forEach(category => this.known.set(category.id, category)); }
  label(id: string) { const category = this.known.get(id); return category ? category.name + (category.isActive ? '' : ' (inactiva)') : 'Categoría asignada'; }
  search(query: string) { this.query = query; this.load(1); }
  load(page = this.page) {
    this.page = page; this.request?.unsubscribe(); this.loading.set(true); this.error.set('');
    this.request = this.api.list(this.query.trim(), page).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { result.items.forEach(category => this.known.set(category.id, category)); this.result.set(result); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('No pudimos cargar los géneros. Conservamos tu selección.'); }
    });
  }
  toggle(id: string) {
    if (this.disabled) return;
    if (this.ids.includes(id)) this.idsChange.emit(this.ids.filter(value => value !== id));
    else if (this.ids.length < 8 && (this.known.get(id)?.isActive || this.existing.some(c => c.id === id))) this.idsChange.emit([...this.ids, id]);
  }
}
