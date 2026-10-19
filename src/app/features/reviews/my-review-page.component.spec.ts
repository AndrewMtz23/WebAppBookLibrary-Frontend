import { TestBed } from '@angular/core/testing';
import { ActivatedRoute,convertToParamMap,provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { MyReviewPageComponent } from './my-review-page.component';
import { SessionScopeService } from '../../core/auth/session-scope.service';
describe('MyReviewPageComponent',()=>{
 let route:BehaviorSubject<ReturnType<typeof convertToParamMap>>;
 beforeEach(()=>{route=new BehaviorSubject(convertToParamMap({id:'review'}));TestBed.configureTestingModule({imports:[MyReviewPageComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),{provide:ActivatedRoute,useValue:{paramMap:route}}]});});
 it('cancels private detail on session change',()=>{const f=TestBed.createComponent(MyReviewPageComponent);const h=TestBed.inject(HttpTestingController);const r=h.expectOne('/api/reviews/review/my');TestBed.inject(SessionScopeService).invalidate();expect(r.cancelled).toBeTrue();expect(f.componentInstance.review()).toBeNull();h.verify();});
 it('cancels deletion when the routed review changes and on destroy',()=>{const f=TestBed.createComponent(MyReviewPageComponent);const h=TestBed.inject(HttpTestingController);h.expectOne('/api/reviews/review/my').flush({id:'review',bookId:'book',version:1,visibility:'visible'});f.componentInstance.remove();const deletion=h.expectOne('/api/books/book/reviews/my?expectedVersion=1');route.next(convertToParamMap({id:'other'}));expect(deletion.cancelled).toBeTrue();h.expectOne('/api/reviews/other/my').flush({id:'other',bookId:'otherbook',version:2,visibility:'visible'});f.componentInstance.remove();const second=h.expectOne('/api/books/otherbook/reviews/my?expectedVersion=2');f.destroy();expect(second.cancelled).toBeTrue();h.verify();});
});
