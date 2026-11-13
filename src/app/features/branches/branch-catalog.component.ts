import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { BranchContextService } from '../../core/branches/branch-context.service';
interface Candidate {book:{id:string;title:string;author:string;isbn:string|null;mediaType:string};membership:{version:number;isActive:boolean}|null;}
@Component({selector:'app-branch-catalog',standalone:true,imports:[StaffPageHeaderComponent,FormsModule],changeDetection:ChangeDetectionStrategy.OnPush,styleUrl:'./branches.scss',template:`
  <section class="branch-page"><app-staff-page-header icon="collections_bookmark" title="Incluir títulos existentes" description="Comparte la ficha bibliográfica sin trasladar ejemplares. El inventario sigue perteneciendo a su sucursal." />
  <form (ngSubmit)="search()"><label>Buscar por título<input name="query" [(ngModel)]="query" maxlength="200"></label><button [disabled]="busy()">Buscar</button></form>
  @if(error()){<p role="alert">{{error()}}</p>}@if(busy()){<p role="status">Procesando…</p>}
  @for(row of rows();track row.book.id){<article><h2>{{row.book.title}}</h2><p>{{row.book.author}} · {{row.book.isbn || 'Sin ISBN'}} · {{row.book.mediaType==='physical'?'Físico':'Digital'}}</p><p>{{row.membership?.isActive?'Incluido en esta sucursal':'No incluido'}}</p><button [disabled]="busy()" (click)="pending.set(row)">{{row.membership?.isActive?'Retirar del catálogo':'Incluir en el catálogo'}}</button></article>}@empty{@if(!busy()){<p>No se encontraron títulos.</p>}}
  <nav aria-label="Páginas de títulos"><button [disabled]="page()===1||busy()" (click)="go(-1)">Anterior</button><span>Página {{page()}}</span><button [disabled]="page()*20>=total()||busy()" (click)="go(1)">Siguiente</button></nav>
  @if(pending();as row){<section class="confirmation" aria-labelledby="catalog-action"><h2 id="catalog-action">{{row.membership?.isActive?'¿Retirar':'¿Incluir'}} {{row.book.title}}?</h2><p>La retirada requiere que no haya ejemplares ni compromisos activos. El historial se conserva.</p><button [disabled]="busy()" (click)="save(row)">Confirmar</button><button [disabled]="busy()" (click)="pending.set(null)">Cancelar</button></section>}</section>`})
export class BranchCatalogComponent{
  private readonly http=inject(HttpClient);private readonly destroy=inject(DestroyRef);private readonly context=inject(BranchContextService);
  readonly rows=signal<Candidate[]>([]);readonly page=signal(1);readonly total=signal(0);readonly busy=signal(false);readonly error=signal('');readonly pending=signal<Candidate|null>(null);query='';
  constructor(){this.load();}search(){this.page.set(1);this.load();}go(delta:number){this.page.update(p=>p+delta);this.load();}
  private get url(){return `/api/branches/${this.context.selectedId()}/catalog`;}
  load(){if(!this.context.selectedId())return;this.busy.set(true);this.error.set('');this.http.get<{items:Candidate[];totalItems:number}>(this.url,{params:{search:this.query,page:this.page(),pageSize:20}}).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.busy.set(false))).subscribe({next:r=>{this.rows.set(r.items);this.total.set(r.totalItems);},error:()=>this.error.set('No se pudo consultar el catálogo.')});}
  save(row:Candidate){if(this.busy())return;this.busy.set(true);this.error.set('');this.http.put(`${this.url}/${row.book.id}`,{isActive:!row.membership?.isActive,expectedVersion:row.membership?.version??0}).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.busy.set(false))).subscribe({next:()=>{this.pending.set(null);this.load();},error:()=>{this.pending.set(null);this.error.set('No se modificó el catálogo. Puede haber inventario, compromisos o una versión más reciente. Actualiza la búsqueda antes de reintentar.');}});}
}
