import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, Input, OnChanges, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, Subscription, finalize, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { ReviewService } from './review.service';
import { MyReview, PublicReviewPage, REVIEW_STATES, reviewError } from './review.models';
@Component({selector:'app-book-reviews',standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./book-reviews.component.html',styleUrl:'./reviews.scss'})
export class BookReviewsComponent implements OnChanges {
 @Input({required:true}) bookId='';
 private readonly api=inject(ReviewService);readonly auth=inject(AuthService);private readonly scope=inject(SessionScopeService);private readonly destroy=inject(DestroyRef);private readonly element=inject<ElementRef<HTMLElement>>(ElementRef);
 private readonly context=new Subject<void>();private listRequest?:Subscription;private mineRequest?:Subscription;
 readonly summary=signal<PublicReviewPage|null>(null);readonly mine=signal<MyReview|null>(null);readonly loading=signal(false);readonly ownLoading=signal(false);readonly saving=signal(false);readonly error=signal('');readonly feedback=signal('');readonly conflict=signal(false);readonly sessionChanged=signal(false);readonly ownReady=signal(false);
 readonly states=REVIEW_STATES;readonly stars=[1,2,3,4,5];rating=0;text='';page=1;reportId='';reportReason='';
 get signedIn(){return !!this.auth.sessionSnapshot;}get reader(){return this.auth.sessionSnapshot?.user.role==='user';}get pages(){return Math.ceil((this.summary()?.total??0)/20);}
 constructor(){this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(()=>{this.clear();this.sessionChanged.set(true);});}
 ngOnChanges(){this.clear();this.sessionChanged.set(false);this.load();}
 private scoped<T>(r:Observable<T>){return r.pipe(takeUntil(this.context),takeUntil(this.scope.changed$),takeUntilDestroyed(this.destroy));}
 private clear(){this.context.next();this.summary.set(null);this.mine.set(null);this.text='';this.rating=0;this.reportId='';this.reportReason='';this.page=1;this.error.set('');this.feedback.set('');this.conflict.set(false);this.ownReady.set(false);this.saving.set(false);}
 private focus(){const version=this.scope.version;setTimeout(()=>{if(!this.destroy.destroyed&&this.scope.version===version)this.element.nativeElement.querySelector<HTMLElement>('.notice:not(:empty)')?.focus();});}
 load(page=this.page,preserve=false){if(!this.bookId||this.saving()||this.sessionChanged())return;this.page=page;this.error.set('');this.listRequest?.unsubscribe();this.loading.set(true);
  this.listRequest=this.scoped(this.api.public(this.bookId,page)).pipe(finalize(()=>this.loading.set(false))).subscribe({next:r=>this.summary.set(r),error:e=>{this.summary.set(null);this.error.set(reviewError(e));this.focus();}});
  if(this.signedIn){this.mineRequest?.unsubscribe();this.ownLoading.set(true);this.ownReady.set(false);this.mineRequest=this.scoped(this.api.mine(this.bookId)).pipe(finalize(()=>this.ownLoading.set(false))).subscribe({next:r=>{this.mine.set(r);this.ownReady.set(true);this.conflict.set(false);if(!preserve){this.rating=r?.rating??0;this.text=r?.text??'';}},error:e=>{this.mine.set(null);this.error.set(reviewError(e));this.focus();}});}
 }
 save(){if(!this.reader||!this.ownReady()||this.rating<1||this.rating>5||this.text.length>2000)return;this.mutate(this.api.save(this.bookId,this.rating,this.text,this.mine()?.version??0),()=>{this.feedback.set('Tu reseña se guardó.');this.load();});}
 remove(){const r=this.mine();if(!r)return;this.mutate(this.api.remove(this.bookId,r.version),()=>{this.text='';this.rating=0;this.feedback.set('Tu reseña se retiró.');this.load();});}
 report(){if(!this.reader||!this.reportId||!this.reportReason.trim()||this.reportReason.length>1000)return;this.mutate(this.api.report(this.reportId,this.reportReason),()=>{this.reportId='';this.reportReason='';this.feedback.set('Reporte recibido. El administrador lo revisará.');});}
 private mutate<T>(request:Observable<T>,done:()=>void){if(this.saving()||this.conflict()||this.sessionChanged())return;this.saving.set(true);this.error.set('');this.feedback.set('');this.scoped(request).pipe(finalize(()=>this.saving.set(false))).subscribe({next:()=>{this.saving.set(false);done();this.focus();},error:e=>{this.conflict.set(e.status===409);this.error.set(reviewError(e));this.focus();}});}
}
