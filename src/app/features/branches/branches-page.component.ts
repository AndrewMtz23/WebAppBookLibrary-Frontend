import { StaffPageHeaderComponent } from '../../shared/ui/staff-page-header/staff-page-header.component';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { BranchChoice, BranchContextService } from '../../core/branches/branch-context.service';

interface Assignment { user: {id:string;username:string;displayName:string}; assignment: {version:number;isActive:boolean}|null; }
@Component({ selector:'app-branches-page', standalone:true, imports:[StaffPageHeaderComponent,FormsModule], changeDetection:ChangeDetectionStrategy.OnPush, styleUrl:'./branches.scss',
  template:`<section class="branch-page"><app-staff-page-header icon="account_tree" title="Sucursales" description="Administra las sedes y el acceso de bibliotecarios. Cada sede conserva su catálogo e inventario." />
    @if(error()){<p role="alert">{{error()}}</p>} @if(busy()){<p role="status">Procesando…</p>}
    <article><h2>{{ editing() ? 'Editar sucursal' : 'Nueva sucursal' }}</h2><form (ngSubmit)="save()">
      <label>Código<input name="code" [(ngModel)]="draft.code" required maxlength="32" [disabled]="!!editing() || busy()"></label>
      <label>Nombre<input name="name" [(ngModel)]="draft.name" required maxlength="120" [disabled]="busy()"></label>
      <label>Zona horaria IANA<input name="zone" [(ngModel)]="draft.timeZone" placeholder="America/Mexico_City" required [disabled]="busy()"></label>
      <div class="actions"><button type="submit" [disabled]="!context.enabled() || busy() || !draft.name.trim() || !draft.code.trim() || !draft.timeZone.trim()">Guardar</button>@if(editing()){<button type="button" (click)="cancel()" [disabled]="busy()">Cancelar</button>}</div>
    </form></article>
    @for(branch of branches();track branch.id){<article><h2>{{branch.name}}</h2><p>{{branch.code}} · {{branch.timeZone}} · {{branch.isActive ? 'Activa' : 'Cerrada'}}</p><div class="actions"><button [disabled]="busy()" (click)="edit(branch)">Editar</button><button [disabled]="busy()" (click)="toggle.set(branch)">{{branch.isActive ? 'Cerrar sucursal' : 'Reabrir sucursal'}}</button><button [disabled]="busy()" (click)="staff(branch)">Bibliotecarios</button></div></article>}
    @if(toggle();as branch){<section class="confirmation" aria-labelledby="branch-status-title"><h2 id="branch-status-title">{{branch.isActive ? '¿Cerrar' : '¿Reabrir'}} {{branch.name}}?</h2><p>El historial se conserva. No se puede cerrar una sucursal con préstamos, reservas, esperas o renovaciones pendientes.</p><button [disabled]="busy()" (click)="changeStatus(branch)">Confirmar</button><button [disabled]="busy()" (click)="toggle.set(null)">Cancelar</button></section>}
    @if(staffBranch();as branch){<article><h2>Bibliotecarios de {{branch.name}}</h2>@for(row of assignments();track row.user.id){<p>{{row.user.displayName || row.user.username}} · {{row.assignment?.isActive ? 'Asignado' : 'Sin acceso'}} <button [disabled]="busy() || !branch.isActive" (click)="assign(row)">{{row.assignment?.isActive ? 'Revocar acceso' : 'Asignar'}}</button></p>}@empty{<p>No hay cuentas activas de bibliotecario.</p>}</article>}
  </section>` })
export class BranchesPageComponent {
  private readonly http=inject(HttpClient);private readonly destroy=inject(DestroyRef);readonly context=inject(BranchContextService);
  readonly branches=signal<BranchChoice[]>([]);readonly busy=signal(false);readonly error=signal('');readonly editing=signal<BranchChoice|null>(null);readonly toggle=signal<BranchChoice|null>(null);readonly staffBranch=signal<BranchChoice|null>(null);readonly assignments=signal<Assignment[]>([]);
  draft={code:'',name:'',timeZone:'America/Mexico_City'};
  constructor(){this.load();}
  load(){this.http.get<BranchChoice[]>('/api/branches/my').pipe(takeUntilDestroyed(this.destroy)).subscribe({next:rows=>{this.branches.set(rows);this.context.setBranches(rows,this.context.enabled());},error:()=>this.error.set('No se pudieron cargar las sucursales.')});}
  edit(branch:BranchChoice){this.editing.set(branch);this.draft={code:branch.code,name:branch.name,timeZone:branch.timeZone};}
  cancel(){this.editing.set(null);this.draft={code:'',name:'',timeZone:'America/Mexico_City'};}
  save(){if(this.busy() || !this.context.enabled())return;const branch=this.editing();this.command(branch?this.http.put(`/api/branches/${branch.id}`,{name:this.draft.name,timeZone:this.draft.timeZone,isActive:branch.isActive,expectedVersion:branch.version}):this.http.post('/api/branches',this.draft),()=>{this.cancel();this.load();});}
  changeStatus(branch:BranchChoice){this.command(this.http.put(`/api/branches/${branch.id}`,{name:branch.name,timeZone:branch.timeZone,isActive:!branch.isActive,expectedVersion:branch.version}),()=>{this.toggle.set(null);this.load();});}
  staff(branch:BranchChoice){this.staffBranch.set(branch);this.assignments.set([]);this.http.get<Assignment[]>(`/api/branches/${branch.id}/staff`).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:rows=>this.assignments.set(rows),error:()=>this.error.set('No se pudieron cargar las asignaciones.')});}
  assign(row:Assignment){const branch=this.staffBranch();if(!branch)return;this.command(this.http.put(`/api/branches/${branch.id}/staff/${row.user.id}`,{isActive:!row.assignment?.isActive,expectedVersion:row.assignment?.version??0}),()=>this.staff(branch));}
  private command(request:import('rxjs').Observable<unknown>,done:()=>void){if(this.busy())return;this.busy.set(true);this.error.set('');request.pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.busy.set(false))).subscribe({next:done,error:e=>{this.error.set(e.code==='branch_has_commitments'?'La sucursal conserva compromisos pendientes. Resuélvelos antes de cerrarla.':'No se aplicó el cambio. Revisa los datos y actualiza la lista antes de reintentar.');this.load();}});}
}
