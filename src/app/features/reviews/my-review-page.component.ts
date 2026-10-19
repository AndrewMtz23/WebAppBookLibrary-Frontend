import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { ReviewService } from './review.service';
import { MyReview, REVIEW_STATES, reviewError } from './review.models';
@Component({selector:'app-my-review',standalone:true,imports:[RouterLink],styleUrl:'./reviews.scss',template:`<main class="admin-page"><p class="eyebrow">Tu contribución</p><h1>Actualización de tu reseña</h1><p role="alert">{{error()}}</p>@if(loading()){<p role="status">Cargando…</p>}@if(review();as r){<p>{{states[r.visibility]}}</p><p class="review-text">{{r.moderationReason}}</p><p class="review-text">{{r.text}}</p><div class="actions"><a [routerLink]="['/app/catalog',r.bookId]">Abrir libro</a><a routerLink="/app/support">Contactar soporte</a></div><p>Si el libro ya no está disponible en el catálogo, todavía puedes retirar tu reseña aquí.</p>@if(r.visibility!=='removed'){<button [disabled]="saving()" (click)="remove()">Retirar mi reseña</button><small>La decisión vigente de moderación se conserva hasta su revisión.</small>}}</main>`})
export class MyReviewPageComponent {
 private readonly api=inject(ReviewService);
 private readonly scope=inject(SessionScopeService);
 private readonly route=inject(ActivatedRoute);
 private readonly destroy=inject(DestroyRef);
 private readonly context=new Subject<void>();
 readonly review=signal<MyReview|null>(null);readonly error=signal('');readonly loading=signal(true);readonly saving=signal(false);readonly states=REVIEW_STATES;
 constructor(){
  this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(()=>{this.context.next();this.review.set(null);this.error.set('La sesión cambió. Abre nuevamente el aviso.');this.loading.set(false);});
  this.route.paramMap.pipe(
   tap(()=>{this.context.next();this.review.set(null);this.loading.set(true);this.error.set('');}),
   switchMap(p=>this.api.mineById(p.get('id')??'').pipe(catchError(e=>{this.error.set(reviewError(e));return of(null);}))),
   takeUntil(this.scope.changed$),takeUntilDestroyed()
  ).subscribe(r=>{this.review.set(r);this.loading.set(false);});
 }
 remove(){
  const r=this.review();if(!r||this.saving())return;this.saving.set(true);
  this.api.remove(r.bookId,r.version).pipe(takeUntil(this.context),takeUntil(this.scope.changed$),takeUntilDestroyed(this.destroy),finalize(()=>this.saving.set(false))).subscribe({
   next:version=>this.review.set({...r,visibility:'removed',text:'',rating:null,version}),
   error:e=>this.error.set(reviewError(e))
  });
 }
}
