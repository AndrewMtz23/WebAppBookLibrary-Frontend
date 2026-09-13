import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuditApi } from '../data-access/audit.api';
import { AuditDetail, AuditItem, AuditPage, AuditQuery, auditQueryParams, parseAuditQuery } from '../data-access/audit.models';

@Component({selector:'app-audit-page',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./audit-page.component.html',styleUrl:'./audit-page.component.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class AuditPageComponent {
  private route=inject(ActivatedRoute);private router=inject(Router);private api=inject(AuditApi);private destroy=inject(DestroyRef);private request?:Subscription;private detailRequest?:Subscription;private opener?:HTMLElement;
  readonly page=signal<AuditPage|null>(null);readonly loading=signal(true);readonly error=signal('');readonly detail=signal<AuditDetail|null>(null);readonly detailLoading=signal(false);readonly detailError=signal('');
  draft:AuditQuery=parseAuditQuery(this.route.snapshot.queryParamMap);query:AuditQuery={...this.draft};
  constructor(){this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(params=>{this.query=parseAuditQuery(params);this.draft={...this.query};this.load();});this.destroy.onDestroy(()=>{this.request?.unsubscribe();this.detailRequest?.unsubscribe();});}
  apply(){void this.router.navigate([], {relativeTo:this.route,queryParams:auditQueryParams({...this.draft,page:1})});} clear(){void this.router.navigate([], {relativeTo:this.route,queryParams:{}});} refresh(){this.load();}
  move(delta:number){const next=this.query.page+delta;if(next<1)return;void this.router.navigate([], {relativeTo:this.route,queryParams:auditQueryParams({...this.query,page:next})});}
  open(item:AuditItem,event:Event){this.opener=event.currentTarget as HTMLElement;this.detail.set(null);this.detailError.set('');this.detailLoading.set(true);this.detailRequest?.unsubscribe();this.detailRequest=this.api.detail(item.id).subscribe({next:value=>{this.detail.set(value);this.detailLoading.set(false);queueMicrotask(()=>document.querySelector<HTMLElement>('[data-audit-close]')?.focus());},error:()=>{this.detailLoading.set(false);this.detailError.set('No fue posible cargar el detalle sanitizado.');}});}
  close(){this.detailRequest?.unsubscribe();this.detail.set(null);this.detailError.set('');this.detailLoading.set(false);queueMicrotask(()=>this.opener?.focus());}
  @HostListener('document:keydown',['$event']) keyboard(event:KeyboardEvent){if(!(this.detailLoading()||this.detail()||this.detailError()))return;if(event.key==='Escape'){event.preventDefault();this.close();return;}if(event.key!=='Tab')return;const controls=Array.from(document.querySelectorAll<HTMLElement>('.drawer button:not([disabled]),.drawer a[href],.drawer input:not([disabled])'));if(!controls.length)return;const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
  private load(){this.loading.set(true);this.error.set('');this.request?.unsubscribe();this.request=this.api.search(this.query).subscribe({next:value=>{this.page.set(value);this.loading.set(false);},error:()=>{this.loading.set(false);this.error.set('No fue posible consultar la auditoría.');}});}
}
