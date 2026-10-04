import { Component, DestroyRef, EventEmitter, HostListener, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { takeUntil } from 'rxjs';
import { CirculationService, CirculationPolicy } from './circulation.service';
import { CirculationConfirmComponent } from './circulation-confirm.component';
import { ReaderActionAccessService } from '../../core/auth/reader-action-access.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { AuthService } from '../../core/services/auth.service';

@Component({ selector: 'app-pickup-action', standalone: true, imports: [DatePipe, MatButtonModule, RouterLink], template: `
  @if (policy(); as p) {
    @if (p.mode === 'active') {
      @if (pickup(); as own) { <p><strong>Listo para recoger</strong> · Hasta {{ own.pickupExpiresAt | date:'medium' }} · {{ zone }}</p><a routerLink="/app/my-library">Gestionar recogida</a> }
      @else if (waiting(); as w) { <p><strong>En espera</strong> · Posición orientativa {{ w.queuePosition }}</p><a routerLink="/app/my-library">Gestionar espera</a> }
      @else { <button mat-flat-button [disabled]="busy() || done() || checking()" (click)="act()">{{ available && !queueRequired() ? 'Reservar para recoger' : 'Entrar en lista de espera' }}</button> }
      <p>Recogida en {{ p.pickupHours }} horas. El préstamo de {{ p.loanDays }} días empieza cuando el personal entrega el ejemplar.</p>
      <p>Favoritos no ocupa un lugar en la espera.</p>
    } @else if (p.mode === 'legacy') { <button mat-flat-button [disabled]="!available" (click)="legacy.emit()">Reservar ejemplar</button> }
    @else { <p>Las nuevas reservas físicas están pausadas. Puedes gestionar las existentes en Mi biblioteca.</p> }
  } @else { <button mat-button (click)="load()">Consultar disponibilidad de reservas</button> }
  @if (message()) { <p role="status">{{ message() }}</p><a routerLink="/app/my-library">Revisar Mi biblioteca</a> }
`, styles: [`:host { display: block; max-width: 38rem; } p { font-size: .875rem; line-height: 1.5; }`] })
export class PickupActionComponent implements OnChanges {
  @Input({ required: true }) bookId = ''; @Input() available = false;
  @Output() legacy = new EventEmitter<void>(); @Output() changed = new EventEmitter<void>();
  readonly policy = signal<CirculationPolicy | null>(null); readonly busy = signal(false); readonly done = signal(false); readonly queueRequired = signal(false); readonly message = signal('');
  private readonly api = inject(CirculationService); private readonly dialogs = inject(MatDialog); private readonly access = inject(ReaderActionAccessService);
  private readonly scope = inject(SessionScopeService); private readonly destroy = inject(DestroyRef); private key = crypto.randomUUID();
  private readonly auth = inject(AuthService); readonly checking = signal(false);
  readonly pickup = signal<{ pickupExpiresAt: string } | null>(null); readonly waiting = signal<{ queuePosition: number } | null>(null);
  readonly zone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  constructor() { this.load(); this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(() => { this.message.set(''); this.done.set(false); this.busy.set(false); this.pickup.set(null); this.waiting.set(null); this.key = crypto.randomUUID(); }); }
  ngOnChanges() { this.refreshOwn(); }
  @HostListener('window:focus') refreshOwn() {
    if (!this.bookId || !this.auth.sessionSnapshot) return;
    const id = this.bookId; this.checking.set(true);
    this.api.own(id).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({ next: state => { if (id !== this.bookId) return; this.pickup.set(state.pickup); this.waiting.set(state.waiting); this.checking.set(false); }, error: () => { this.checking.set(false); this.message.set('No pudimos comprobar tu reserva. Revisa Mi biblioteca antes de solicitar otra.'); } });
  }
  load() { this.api.policy().pipe(takeUntilDestroyed(this.destroy)).subscribe({ next: p => this.policy.set(p), error: () => this.message.set('No pudimos consultar las reglas. Reintenta para reservar.') }); }
  act() {
    if (this.busy() || !this.access.ensureReader('reserve', this.bookId)) return;
    const reserve = this.available && !this.queueRequired();
    this.dialogs.open(CirculationConfirmComponent, { width: '440px', maxWidth: 'calc(100vw - 32px)', data: { title: reserve ? 'Reservar para recoger' : 'Entrar en lista de espera', message: reserve ? `Tendrás ${this.policy()!.pickupHours} horas continuas para recogerlo. El personal confirmará la entrega.` : 'Te avisaremos cuando haya un ejemplar. La posición no garantiza una fecha de disponibilidad.' } }).afterClosed().pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe(value => {
      if (!value) return; this.busy.set(true);
      (reserve ? this.api.reserve(this.bookId, this.key) : this.api.join(this.bookId, this.key)).pipe(takeUntil(this.scope.changed$), takeUntilDestroyed(this.destroy)).subscribe({
        next: () => { this.busy.set(false); this.done.set(true); this.message.set(reserve ? 'Reserva lista para recoger. Consulta tu fecha límite en Mi biblioteca.' : 'Tu solicitud de espera quedó registrada.'); this.refreshOwn(); this.changed.emit(); },
        error: e => { this.busy.set(false); const code = e.code || e.error?.code; this.queueRequired.set(code === 'waitlist_priority_required' || code === 'book_unavailable'); this.message.set(e.status === 409 ? 'La disponibilidad cambió. Actualizamos la ficha; revisa tu biblioteca y vuelve a intentarlo.' : 'No recibimos confirmación. Revisa Mi biblioteca antes de reintentar.'); this.changed.emit(); }
      });
    });
  }
}
