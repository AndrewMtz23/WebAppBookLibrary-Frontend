import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminReviewsPageComponent } from './admin-reviews-page.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';
describe('AdminReviewsPageComponent',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[AdminReviewsPageComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting()]}));
 it('keeps moderation reason on conflict and cancels private data on session change',()=>{
  const f=TestBed.createComponent(AdminReviewsPageComponent);f.detectChanges();const h=TestBed.inject(HttpTestingController);const c=f.componentInstance;
  h.expectOne('/api/admin/review-reports?page=1&pageSize=20&status=open').flush({items:[],totalPages:0});h.expectOne('/api/admin/reviews?page=1&pageSize=20').flush({items:[],totalPages:0});
  c.select('review');h.expectOne('/api/admin/reviews/review?page=1&pageSize=20').flush({review:{id:'review',text:'Text',rating:4,visibility:'visible',version:2},history:{items:[],totalPages:0}});
  c.reason='Reason';c.moderate('hidden');c.moderate('hidden');const r=h.expectOne('/api/admin/reviews/review/visibility');expect(r.request.body.expectedVersion).toBe(2);r.flush({detail:'Changed'},{status:409,statusText:'Conflict'});
  expect(c.reason).toBe('Reason');expect(c.conflict()).toBeTrue();TestBed.inject(SessionScopeService).invalidate();expect(c.detail()).toBeNull();expect(c.reason).toBe('');h.verify();
 });
 it('reloads the selected review after moderation without cancelling its detail request',()=>{
  const f=TestBed.createComponent(AdminReviewsPageComponent);f.detectChanges();const h=TestBed.inject(HttpTestingController);const c=f.componentInstance;
  h.expectOne('/api/admin/review-reports?page=1&pageSize=20&status=open').flush({items:[],totalPages:0});h.expectOne('/api/admin/reviews?page=1&pageSize=20').flush({items:[],totalPages:0});
  c.select('review');h.expectOne('/api/admin/reviews/review?page=1&pageSize=20').flush({review:{id:'review',visibility:'visible',version:1},history:{items:[]}});
  c.reason='Reason';c.moderate('hidden');h.expectOne('/api/admin/reviews/review/visibility').flush(2);
  const detail=h.expectOne('/api/admin/reviews/review?page=1&pageSize=20');expect(detail.cancelled).toBeFalse();
  h.match(r=>r.url==='/api/admin/reviews'||r.url==='/api/admin/review-reports').forEach(r=>r.flush({items:[],totalPages:0}));
  if(!detail.cancelled)detail.flush({review:{id:'review',visibility:'hidden',version:2},history:{items:[]}});
  expect(c.detail()?.review.visibility).toBe('hidden');h.verify();
 });
});
