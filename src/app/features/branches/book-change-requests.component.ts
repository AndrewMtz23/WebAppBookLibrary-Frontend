import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface ChangeRequest { id: string; branchId: string; status: string; version: number; createdAt: string; original: Record<string, unknown> | null; proposed: Record<string, unknown>; }
@Component({ selector: 'app-book-change-requests', standalone: true, imports: [StaffPageHeaderComponent,DatePipe], changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<section class="branch-page"><app-staff-page-header icon="edit_note" title="Solicitudes de cambios" description="Revisa las propuestas bibliográficas y conserva el historial de decisiones." />
    @if (error()) { <p role="alert">{{ error() }} <button (click)="load()">Actualizar</button></p> }
    @if (busy()) { <p role="status">Procesando…</p> }
    @for (item of items(); track item.id) {
      <article><header><h2>{{ item.proposed['title'] }}</h2><p>{{ label(item.status) }} · {{ item.createdAt | date:'medium' }}</p></header>
        <details><summary>Comparar propuesta</summary><div class="table-wrap"><table><thead><tr><th>Campo</th><th>Versión original</th><th>Propuesta</th></tr></thead><tbody>
          @for (field of fields; track field[0]) { <tr><th scope="row">{{ field[1] }}</th><td>{{ value(item.original?.[field[0]]) }}</td><td>{{ value(item.proposed[field[0]]) }}</td></tr> }
        </tbody></table></div></details>
        @if (admin && item.status === 'pending') {
          <footer><button [disabled]="busy()" (click)="pending.set({item, approve: true})">Aprobar cambios</button><button [disabled]="busy()" (click)="pending.set({item, approve: false})">Rechazar</button></footer>
        }
      </article>
    } @empty { @if (!busy() && !error()) { <p>No hay solicitudes.</p> } }
    <nav aria-label="Páginas de solicitudes"><button [disabled]="page() === 1 || busy()" (click)="go(-1)">Anterior</button><span>Página {{ page() }}</span><button [disabled]="page()*20 >= total() || busy()" (click)="go(1)">Siguiente</button></nav>
    @if (pending(); as action) { <section role="region" aria-labelledby="decision-title" class="confirmation"><h2 id="decision-title">{{ action.approve ? '¿Aprobar la propuesta?' : '¿Rechazar la propuesta?' }}</h2><p>{{ action.approve ? 'Se actualizará la ficha compartida en las sucursales que la utilizan.' : 'El libro conservará sus datos actuales y la decisión quedará en el historial.' }}</p><button [disabled]="busy()" (click)="decide()">Confirmar</button><button [disabled]="busy()" (click)="pending.set(null)">Cancelar</button></section> }
  </section>`, styleUrl: './branches.scss' })
export class BookChangeRequestsComponent {
  private readonly http = inject(HttpClient); private readonly destroy = inject(DestroyRef);
  readonly admin = inject(AuthService).sessionSnapshot?.user.role === 'admin';
  readonly items = signal<ChangeRequest[]>([]); readonly total = signal(0); readonly page = signal(1); readonly busy = signal(false); readonly error = signal('');
  readonly pending = signal<{item: ChangeRequest; approve: boolean} | null>(null);
  readonly fields = [['title','Título'],['subtitle','Subtítulo'],['authors','Autoría'],['isbn','ISBN'],['description','Descripción'],['publisher','Editorial'],['publishedDate','Publicación'],['language','Idioma'],['pageCount','Páginas'],['genres','Categorías'],['tags','Etiquetas'],['coverUrl','Portada'],['digitalResourceUrl','Recurso digital']];
  constructor() { this.load(); }
  value(value: unknown): string { return Array.isArray(value) ? value.join(', ') : value === null || value === undefined || value === '' ? '—' : String(value); }
  label(status: string) { return ({pending:'Pendiente',approved:'Aprobada',rejected:'Rechazada'} as Record<string,string>)[status] ?? status; }
  go(delta: number) { this.page.update(p => p + delta); this.load(); }
  load() { this.busy.set(true); this.error.set(''); this.http.get<{items:ChangeRequest[];totalCount:number}>('/api/book-change-requests', {params:{page:this.page(),pageSize:20}}).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.busy.set(false))).subscribe({next:r=>{this.items.set(r.items);this.total.set(r.totalCount);},error:()=>this.error.set('No se pudieron cargar las solicitudes.')}); }
  decide() { const action=this.pending(); if(!action || this.busy())return;this.busy.set(true);this.error.set('');this.http.put(`/api/book-change-requests/${action.item.id}/decision`,{approve:action.approve,expectedVersion:action.item.version}).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.busy.set(false))).subscribe({next:()=>{this.pending.set(null);this.load();},error:()=>{this.pending.set(null);this.error.set('No se aplicó la decisión. Actualiza la lista: el libro, la solicitud o tus permisos pueden haber cambiado.');}}); }
}
