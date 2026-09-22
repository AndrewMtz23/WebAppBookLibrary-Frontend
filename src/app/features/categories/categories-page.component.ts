import { A11yModule } from '@angular/cdk/a11y';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { CategoriesApi, Category } from './categories.api';
import { PagedResult } from '../../shared/models/paged-result.model';
import { OperationNotificationService } from '../../core/services/operation-notification.service';
import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
@Component({
  selector: 'app-categories-page', standalone: true, imports: [FormsModule, A11yModule, StaffPageHeaderComponent],
  templateUrl: './categories-page.component.html', styleUrls: ['../books/components/staff-books.scss', './categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit {
  private readonly api = inject(CategoriesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(OperationNotificationService);
  private request?: Subscription;
  readonly result = signal<PagedResult<Category> | null>(null);
  readonly loading = signal(false); readonly busy = signal(false); readonly error = signal(''); readonly mutationError = signal('');
  query = ''; status = ''; page = 1;
  editor: { record: Category | null; name: string; description: string } | null = null;
  mutation: { record: Category; type: 'status' | 'delete' } | null = null;
  ngOnInit() { this.load(); }
  load(page = this.page) {
    this.page = page; this.loading.set(true); this.error.set(''); this.request?.unsubscribe();
    this.request = this.api.list(this.query.trim(), page, true, this.status).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => { this.result.set(result); this.loading.set(false); if (!result.items.length && page > 1) this.load(page - 1); },
      error: error => { this.loading.set(false); this.error.set(this.message(error)); }
    });
  }
  edit(record: Category | null = null) { this.mutationError.set(''); this.editor = { record, name: record?.name ?? '', description: record?.description ?? '' }; }
  confirm(record: Category, type: 'status' | 'delete') { this.mutationError.set(''); this.mutation = { record, type }; }
  close() { if (!this.busy()) { this.editor = null; this.mutation = null; this.mutationError.set(''); } }
  save() {
    const draft = this.editor;
    if (!draft || this.busy() || !draft.name.trim() || draft.name.trim().length > 80 || draft.description.length > 500) return;
    const body = { name: draft.name.trim(), description: draft.description.trim() || null };
    this.busy.set(true); this.mutationError.set('');
    const request = draft.record ? this.api.update(draft.record.id, { ...body, version: draft.record.version }) : this.api.create(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.complete('Categoría guardada.'), error: error => this.failed(error) });
  }
  applyMutation() {
    if (!this.mutation || this.busy()) return;
    const { record, type } = this.mutation;
    this.busy.set(true); this.mutationError.set('');
    const request: Observable<unknown> = type === 'status' ? this.api.status(record) : this.api.delete(record);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: () => this.complete(type === 'delete' ? 'Categoría eliminada.' : 'Estado actualizado.'), error: error => this.failed(error) });
  }
  private complete(message: string) { this.busy.set(false); this.close(); this.notifications.success(message); this.load(); }
  private failed(error: { status?: number }) { this.busy.set(false); this.mutationError.set(this.message(error)); this.load(); }
  private message(error: { status?: number }) {
    return error.status === 403 ? 'No tienes permiso para administrar categorías.' : error.status === 409
      ? 'Conflicto: el nombre ya existe, la categoría cambió o tiene libros asociados. Conservamos tu borrador. Revisa la lista actual; puedes desactivar una categoría en uso.'
      : error.status === 404 ? 'La categoría ya no existe. Revisa la lista actual.' : 'No pudimos completar la solicitud. Revisa los datos e intenta de nuevo.';
  }
}

