import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, finalize, takeUntil } from 'rxjs';
import { SessionScopeService } from '../../core/auth/session-scope.service';
import { ReviewService } from './review.service';
import { AdminReviewDetail, MyReview, REVIEW_STATES, ReviewPage, ReviewReport, reviewError } from './review.models';
@Component({selector:'app-admin-reviews',standalone:true,imports:[CommonModule,FormsModule,RouterLink],templateUrl:'./admin-reviews-page.component.html',styleUrl:'./reviews.scss'})
export class AdminReviewsPageComponent {
 private readonly api=inject(ReviewService);private readonly scope=inject(SessionScopeService);private readonly destroy=inject(DestroyRef);private readonly element=inject<ElementRef<HTMLElement>>(ElementRef);private readonly context=new Subject<void>();private readonly selection=new Subject<void>();
 readonly reviews=signal<ReviewPage<MyReview>|null>(null);readonly reports=signal<ReviewPage<ReviewReport>|null>(null);readonly detail=signal<AdminReviewDetail|null>(null);readonly loading=signal(false);readonly saving=signal(false);readonly error=signal('');readonly feedback=signal('');readonly conflict=signal(false);readonly sessionChanged=signal(false);readonly states=REVIEW_STATES;
 page=1;reportPage=1;status='open';visibility='';bookId='';reason='';resolutionReason='';selectedReport:ReviewReport|null=null;
 constructor(){this.scope.changed$.pipe(takeUntilDestroyed()).subscribe(()=>{this.context.next();this.selection.next();this.reviews.set(null);this.reports.set(null);this.detail.set(null);this.selectedReport=null;this.reason='';this.resolutionReason='';this.bookId='';this.visibility='';this.status='open';this.page=1;this.reportPage=1;this.error.set('');this.feedback.set('');this.conflict.set(false);this.sessionChanged.set(true);});this.load();}
 private scoped<T>(r:Observable<T>){return r.pipe(takeUntil(this.context),takeUntil(this.scope.changed$),takeUntilDestroyed(this.destroy));}
 private focus(){const version=this.scope.version;setTimeout(()=>{if(!this.destroy.destroyed&&this.scope.version===version)this.element.nativeElement.querySelector<HTMLElement>('.notice:not(:empty)')?.focus();});}
 load(){if(this.saving()||this.sessionChanged())return;this.context.next();this.error.set('');this.loading.set(true);
  this.scoped(this.api.adminList(this.page,this.visibility,this.bookId)).pipe(finalize(()=>this.loading.set(false))).subscribe({next:r=>this.reviews.set(r),error:e=>{this.reviews.set(null);this.error.set(reviewError(e));this.focus();}});
  this.scoped(this.api.reports(this.reportPage,this.status)).subscribe({next:r=>this.reports.set(r),error:e=>{this.reports.set(null);this.error.set(reviewError(e));this.focus();}});
 }
 select(id:string,page=1,preserve=false){if(this.saving()||this.sessionChanged())return;this.selection.next();this.detail.set(null);if(!preserve){this.reason='';this.resolutionReason='';this.selectedReport=null;}this.scoped(this.api.adminDetail(id,page)).pipe(takeUntil(this.selection)).subscribe({next:r=>{this.detail.set(r);this.conflict.set(false);},error:e=>{this.error.set(reviewError(e));this.focus();}});}
 openReport(report:ReviewReport){this.select(report.reviewId);this.selectedReport=report;}
 refresh(){const id=this.detail()?.review.id;this.selectedReport=null;this.load();if(id)this.select(id,1,true);}
 moderate(visibility:string){const r=this.detail()?.review;if(!r||!this.reason.trim()||this.reason.length>1000)return;this.mutate(this.api.setVisibility(r.id,visibility,this.reason,r.version),()=>{this.reason='';this.load();this.select(r.id);});}
 resolve(resolution:string){const r=this.selectedReport;if(!r||!this.resolutionReason.trim()||this.resolutionReason.length>1000)return;this.mutate(this.api.resolve(r.id,resolution,this.resolutionReason,r.version),()=>{this.selectedReport=null;this.resolutionReason='';this.load();});}
 private mutate<T>(request:Observable<T>,done:()=>void){if(this.saving()||this.conflict()||this.sessionChanged())return;this.saving.set(true);this.error.set('');this.feedback.set('');this.scoped(request).pipe(finalize(()=>this.saving.set(false))).subscribe({next:()=>{this.saving.set(false);this.feedback.set('Decisión guardada.');done();this.focus();},error:e=>{this.conflict.set(e.status===409);this.error.set(reviewError(e));this.focus();}});}
}
