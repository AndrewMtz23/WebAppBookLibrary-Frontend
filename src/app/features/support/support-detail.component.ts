import { Component, DestroyRef, ElementRef, Input, OnChanges, OnInit, SimpleChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { SupportService } from './support.service';
import { Assignee, CATEGORY_LABELS, STATUS_LABELS, StaffDetail, TicketDetail, supportError } from './support.models';
@Component({ selector: 'app-support-detail', standalone: true, imports: [DatePipe, FormsModule, RouterLink], templateUrl: './support-detail.component.html', styleUrl: './support.scss' })
export class SupportDetailComponent implements OnInit, OnChanges {
  @Input() ticketId = ''; @Input() staff = false;
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef); private readonly api = inject(SupportService); private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef); private readonly route = inject(ActivatedRoute);
  private readonly contextChanged = new Subject<void>(); private request?: Subscription; private choicesRequest?: Subscription;
  readonly ticket = signal<TicketDetail | null>(null); readonly staffData = signal<StaffDetail | null>(null); readonly choices = signal<Assignee[]>([]);
  readonly loading = signal(false); readonly saving = signal(false); readonly error = signal(''); readonly feedback = signal(''); readonly conflict = signal(false); readonly sessionChanged = signal(false);
  readonly categories = CATEGORY_LABELS; readonly statuses = STATUS_LABELS;
  text = ''; reason = ''; internal = false; assignee = ''; page = 1;
  constructor() { this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.clear(); this.sessionChanged.set(true); }); }
  ngOnInit(): void { if (!this.ticketId) this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params => { this.clear(); this.ticketId = params.get('id') ?? ''; this.load(); }); }
  ngOnChanges(changes: SimpleChanges): void { if (changes['ticketId']) { this.clear(); this.load(); } }
  private clear(): void { this.contextChanged.next(); this.ticket.set(null); this.staffData.set(null); this.choices.set([]); this.text = ''; this.reason = ''; this.assignee = ''; this.internal = false; this.error.set(''); this.feedback.set(''); this.conflict.set(false); this.loading.set(false); this.saving.set(false); this.page = 1; }
  private focusNotice(selector: string): void {
    const version = this.scope.version;
    setTimeout(() => { if (!this.destroy.destroyed && this.scope.version === version) this.element.nativeElement.querySelector<HTMLElement>(selector)?.focus(); });
  }
  private scoped<T>(request: Observable<T>): Observable<T> { return request.pipe(takeUntil(this.scope.changed$), takeUntil(this.contextChanged), takeUntilDestroyed(this.destroy)); }
  load(page = this.page): void {
    if (!this.ticketId || this.sessionChanged() || this.saving()) return;
    this.request?.unsubscribe(); this.choicesRequest?.unsubscribe(); this.page = page; this.loading.set(true); this.error.set('');
    const request: Observable<TicketDetail | StaffDetail> = this.staff ? this.api.staffDetail(this.ticketId, page) : this.api.detail(this.ticketId, page);
    this.request = this.scoped(request).pipe(finalize(() => this.loading.set(false))).subscribe({ next: result => {
      if ('ticket' in result) { this.staffData.set(result); this.ticket.set(result.ticket); this.assignee = result.assigneeId ?? ''; }
      else this.ticket.set(result);
      this.conflict.set(false);
      if (this.staff) this.choicesRequest = this.scoped(this.api.assignees(this.ticket()!.category)).subscribe({ next: rows => this.choices.set(rows), error: () => this.choices.set([]) });
    }, error: e => { this.error.set(supportError(e)); this.focusNotice('.error'); if (e.status === 401 || e.status === 403 || e.status === 404) { this.ticket.set(null); this.staffData.set(null); } } });
  }
  get canReply(): boolean { return ['open', 'in_progress'].includes(this.ticket()?.status ?? ''); }
  get canReopen(): boolean { const t = this.ticket(); return !this.staff && t?.status === 'resolved' && !!t.reopenUntil && Date.now() <= Date.parse(t.reopenUntil); }
  get nextStatus(): string { return ({ open: 'in_progress', in_progress: 'resolved', resolved: 'closed' } as Record<string, string>)[this.ticket()?.status ?? ''] ?? ''; }
  get totalPages(): number { return Math.max(this.ticket()?.replies.totalPages ?? 0, this.staffData()?.notes.totalPages ?? 0, this.staffData()?.history.totalPages ?? 0); }
  send(): void {
    const t = this.ticket(); if (!t || !this.text.trim() || !this.canReply) return;
    this.mutate(this.internal && this.staff ? this.api.addNote(t.id, this.text, t.version) : this.api.reply(t.id, this.text, t.version, this.staff), () => { this.text = ''; });
  }
  transition(): void { const t = this.ticket(); if (!t || !this.reason.trim()) return; this.mutate(this.api.changeStatus(t.id, this.staff ? this.nextStatus : 'open', this.reason, t.version, this.staff), () => { this.reason = ''; }); }
  assign(): void { const t = this.ticket(); if (t) this.mutate(this.api.assign(t.id, this.assignee || null, t.version)); }
  private mutate(request: Observable<number>, after: () => void = () => {}): void {
    if (this.saving() || this.loading() || this.conflict() || this.sessionChanged()) return;
    this.saving.set(true); this.error.set(''); this.feedback.set('');
    this.scoped(request).pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { after(); this.saving.set(false); this.feedback.set('Cambio guardado.'); this.focusNotice('.feedback'); this.load(); }, error: e => { this.error.set(supportError(e)); this.focusNotice('.error'); if (e.status === 409) this.conflict.set(true); } });
  }
}
