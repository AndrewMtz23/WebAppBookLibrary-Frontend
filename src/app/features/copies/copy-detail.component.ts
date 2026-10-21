import { CopyLabelComponent } from './copy-label.component';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, finalize, takeUntil } from 'rxjs';
import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
import { AuthService } from '../../core/services/auth.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { CopiesService } from './copies.service';
import { COPY_CONDITIONS, COPY_STATES, CopyCondition, CopyHistory, CopyResponse, CopyStatus, copyError } from './copies.models';

@Component({ standalone: true, imports: [CommonModule, FormsModule, RouterLink, StaffPageHeaderComponent, CopyLabelComponent], templateUrl: './copy-detail.component.html', styleUrl: './copies.scss' })
export class CopyDetailComponent {
  private readonly api = inject(CopiesService); private readonly http = inject(HttpClient); private readonly route = inject(ActivatedRoute);
  private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef); private readonly context = new Subject<void>();
  readonly auth = inject(AuthService); readonly states = COPY_STATES; readonly conditions = COPY_CONDITIONS;
  readonly copy = signal<CopyResponse | null>(null); readonly book = signal<{ title: string; coverUrl: string | null } | null>(null);
  readonly history = signal<CopyHistory[]>([]); readonly historyTotal = signal(0); readonly loading = signal(false); readonly saving = signal(false);
  readonly error = signal(''); readonly feedback = signal(''); readonly conflict = signal(false); readonly sessionChanged = signal(false);
  id = ''; historyPage = 1; condition: CopyCondition | '' = ''; location = ''; notes = ''; reason = ''; enteredCode = ''; pendingStatus: CopyStatus | '' = ''; private operationKey = crypto.randomUUID();
  constructor() {
    this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.context.next(); this.copy.set(null); this.book.set(null); this.history.set([]); this.notes = ''; this.location = ''; this.reason = ''; this.enteredCode = ''; this.condition = ''; this.pendingStatus = ''; this.sessionChanged.set(true); });
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe(p => { this.id = p.get('id') ?? ''; this.load(); });
  }
  private scoped<T>(request: Observable<T>) { return request.pipe(takeUntil(this.context), takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)); }
  load() {
    if (this.sessionChanged() || this.saving()) return;
    this.context.next(); this.loading.set(true); this.error.set(''); this.conflict.set(false);
    this.scoped(this.api.get(this.id)).pipe(finalize(() => this.loading.set(false))).subscribe({ next: copy => {
      this.copy.set(copy); this.condition = copy.condition ?? ''; this.location = copy.location ?? ''; this.notes = copy.notes ?? ''; this.operationKey = crypto.randomUUID();
      this.scoped(this.http.get<{ title: string; coverUrl: string | null }>(`/api/books/${encodeURIComponent(copy.bookId)}`)).subscribe({ next: book => this.book.set(book), error: () => this.book.set(null) });
    }, error: e => { this.copy.set(null); this.error.set(copyError(e)); } });
    this.loadHistory();
  }
  loadHistory(delta = 0) { this.historyPage += delta; this.scoped(this.api.history(this.id, this.historyPage)).subscribe({ next: r => { this.history.set(r.items); this.historyTotal.set(r.totalCount); }, error: e => this.error.set(copyError(e)) }); }
  metadata() { const c = this.copy(); if (c) this.mutate(this.api.update(c.id, { expectedVersion: c.version, location: this.location || null, notes: this.notes || null })); }
  inspect() { const c = this.copy(); if (!c || !this.condition) return; this.mutate(this.api.inspect(c.id, { expectedVersion: c.version, inspection: { condition: this.condition, location: this.location || null, notes: this.notes || null } })); }
  changeStatus() { const c = this.copy(); if (!c || !this.pendingStatus || !this.reason.trim()) return; this.mutate(this.api.changeStatus(c.id, { expectedVersion: c.version, status: this.pendingStatus, reason: this.reason, idempotencyKey: this.operationKey })); }
  returnCopy() {
    const c = this.copy(); if (!c || c.status !== 'loaned' || !this.condition || this.enteredCode.trim().toUpperCase() !== c.inventoryCode) return;
    this.mutate(this.http.put(`/api/loans/${encodeURIComponent(c.activeAssignmentId!)}/return`, { copy: { copyId: c.id, expectedVersion: c.version }, inspection: { condition: this.condition, location: this.location || null, notes: this.notes || null }, idempotencyKey: this.operationKey }));
  }
  collect() {
    const c = this.copy(); if (!c || c.status !== 'held' || c.inspectionPending || this.enteredCode.trim().toUpperCase() !== c.inventoryCode) return;
    if (!c.assignmentVersion) return;
    this.mutate(this.http.put(`/api/pickup-reservations/${encodeURIComponent(c.activeAssignmentId!)}/collect`, { expectedVersion: c.assignmentVersion, copy: { copyId: c.id, expectedVersion: c.version } }));
  }
  actions(): CopyStatus[] { const status = this.copy()?.status; if (!status || status === 'retired') return []; const options: CopyStatus[] = status === 'lost' ? ['maintenance'] : status === 'available' ? ['maintenance', 'lost'] : status === 'maintenance' || status === 'held' || status === 'loaned' ? ['lost'] : []; if (this.auth.getUserRole() === 'admin' && ['available', 'maintenance', 'lost'].includes(status)) options.push('retired'); return options; }
  private mutate<T>(request: Observable<T>) {
    if (this.saving() || this.conflict() || this.sessionChanged() || this.notes.length > 1000 || this.location.length > 200) return;
    this.saving.set(true); this.error.set(''); this.feedback.set('');
    this.scoped(request).pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.saving.set(false); this.pendingStatus = ''; this.reason = ''; this.enteredCode = ''; this.feedback.set('Operación registrada.'); this.load(); }, error: e => { this.conflict.set(e.status === 409); this.error.set(copyError(e)); } });
  }
}
