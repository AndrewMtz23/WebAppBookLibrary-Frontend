import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookReviewsComponent } from './book-reviews.component';
import { AuthService } from '../../core/services/auth.service';
import { SessionScopeService } from '../../core/auth/session-scope.service';
describe('BookReviewsComponent',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[BookReviewsComponent],providers:[provideRouter([]),provideHttpClient(),provideHttpClientTesting(),{provide:AuthService,useValue:{sessionSnapshot:{user:{role:'user'}}}}]}));
 function setup(){const f=TestBed.createComponent(BookReviewsComponent);f.componentRef.setInput('bookId','book');f.detectChanges();const h=TestBed.inject(HttpTestingController);h.expectOne('/api/books/book/reviews?page=1&pageSize=20').flush({items:[],total:0,averageRating:null});h.expectOne('/api/books/book/reviews/my').flush(null);return{f,h,c:f.componentInstance};}
 it('preserves rejected draft, blocks double submission and requires refresh after conflict',()=>{const{c,h}=setup();c.text='My draft';c.rating=4;c.save();c.save();h.expectOne('/api/books/book/reviews/my').flush({detail:'Changed'},{status:409,statusText:'Conflict'});expect(c.text).toBe('My draft');expect(c.conflict()).toBeTrue();c.save();h.expectNone('/api/books/book/reviews/my');h.verify();});
 it('clears private content and cancels requests when identity changes',()=>{const{c,h}=setup();c.text='Private draft';c.rating=5;c.save();const r=h.expectOne('/api/books/book/reviews/my');TestBed.inject(SessionScopeService).invalidate();expect(r.cancelled).toBeTrue();expect(c.text).toBe('');expect(c.mine()).toBeNull();h.verify();});
 it('renders text without interpreting HTML and shows a real empty average',()=>{const{f,c,h}=setup();expect(c.summary()?.averageRating).toBeNull();c.summary.set({items:[{id:'r',displayName:'Name',rating:5,text:'<img src=x onerror=alert(1)>',createdAt:'2026-10-19',updatedAt:'2026-10-19'}],total:1,averageRating:5,page:1,pageSize:20});f.detectChanges();expect(f.nativeElement.querySelector('.review-text img')).toBeNull();expect(f.nativeElement.textContent).toContain('<img src=x');h.verify();});
});
