import { Component, DestroyRef, ElementRef, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subscription, finalize, takeUntil } from 'rxjs';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { SupportService } from './support.service';
import { CATEGORY_LABELS, STATUS_LABELS, TicketSummary, supportError } from './support.models';
import { SupportDetailComponent } from './support-detail.component';
@Component({ selector: 'app-support-page', standalone: true, imports: [DatePipe, FormsModule, RouterLink, SupportDetailComponent], templateUrl: './support-page.component.html', styleUrl: './support.scss' })
export class SupportPageComponent implements OnInit {
  @Input() staff = false;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef); private readonly api = inject(SupportService); private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef);
  private request?: Subscription; private lastPayload = ''; private requestKey = '';
  readonly items = signal<TicketSummary[]>([]); readonly loading = signal(false); readonly saving = signal(false); readonly error = signal(''); readonly feedback = signal(''); readonly selected = signal(''); readonly sessionChanged = signal(false);
  readonly categories = CATEGORY_LABELS; readonly statuses = STATUS_LABELS; readonly categoryKeys = Object.keys(CATEGORY_LABELS); readonly statusKeys = Object.keys(STATUS_LABELS);
  page = 1; totalPages = 0; total = 0; status = ''; categoryFilter = ''; category = 'loan'; subject = ''; description = '';
  constructor() { this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.items.set([]); this.total = 0; this.totalPages = 0; this.page = 1; this.status = ''; this.categoryFilter = ''; this.selected.set(''); this.subject = ''; this.description = ''; this.error.set(''); this.feedback.set(''); this.requestKey = ''; this.lastPayload = ''; this.loading.set(false); this.saving.set(false); this.sessionChanged.set(true); }); }
  ngOnInit(): void { this.load(); }
  private focusNotice(selector: string): void {
    const version = this.scope.version;
    setTimeout(() => { if (!this.destroy.destroyed && this.scope.version === version) this.element.nativeElement.querySelector<HTMLElement>(selector)?.focus(); });
  }
  private scoped<T>(request: Observable<T>): Observable<T> { return request.pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)); }
  load(page = 1): void {
    if (this.sessionChanged()) return;
    this.request?.unsubscribe(); this.loading.set(true); this.error.set(''); this.page = page;
    this.request = this.scoped(this.api.list(this.staff, page, this.status, this.categoryFilter)).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: result => { this.items.set(result.items); this.totalPages = result.totalPages; this.total = result.totalItems; }, error: e => { this.error.set(supportError(e)); this.focusNotice('.error'); }
    });
  }
  create(): void {
    if (this.saving() || this.sessionChanged()) return;
    if (!this.subject.trim() || !this.description.trim()) { this.error.set('Escribe un asunto y una descripción.'); return; }
    const payload = JSON.stringify([this.category, this.subject, this.description]);
    if (payload !== this.lastPayload) { this.requestKey = crypto.randomUUID(); this.lastPayload = payload; }
    this.saving.set(true); this.error.set('');
    this.scoped(this.api.create({ category: this.category, subject: this.subject, description: this.description, idempotencyKey: this.requestKey })).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: result => { this.subject = ''; this.description = ''; this.lastPayload = ''; this.requestKey = ''; this.feedback.set('Solicitud creada. Puedes consultar su atención en la lista.'); this.focusNotice('.feedback'); this.load(); },
      error: e => { this.error.set(supportError(e)); this.focusNotice('.error'); }
    });
  }
}
