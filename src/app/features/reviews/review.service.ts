import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { AdminReviewDetail, MyReview, PublicReviewPage, ReviewPage, ReviewReport } from './review.models';
@Injectable({providedIn:'root'})
export class ReviewService {
 private readonly http=inject(HttpClient);
 private timed<T>(r:Observable<T>):Observable<T>{return r.pipe(timeout(20000));}
 private book(id:string){return `/api/books/${encodeURIComponent(id)}/reviews`;}
 public(bookId:string,page=1){return this.timed(this.http.get<PublicReviewPage>(this.book(bookId),{params:{page,pageSize:20}}));}
 mine(bookId:string){return this.timed(this.http.get<MyReview|null>(this.book(bookId)+'/my'));}
 mineById(id:string){return this.timed(this.http.get<MyReview>(`/api/reviews/${encodeURIComponent(id)}/my`));}
 save(bookId:string,rating:number,text:string,expectedVersion:number){return this.timed(this.http.put<MyReview>(this.book(bookId)+'/my',{rating,text,expectedVersion}));}
 remove(bookId:string,expectedVersion:number){return this.timed(this.http.delete<number>(this.book(bookId)+'/my',{params:{expectedVersion}}));}
 report(id:string,reason:string){return this.timed(this.http.post<string>(`/api/reviews/${encodeURIComponent(id)}/reports`,{reason}));}
 adminList(page=1,visibility='',bookId=''){return this.timed(this.http.get<ReviewPage<MyReview>>('/api/admin/reviews',{params:{page,pageSize:20,...(visibility?{visibility}:{}),...(bookId?{bookId}:{})}}));}
 adminDetail(id:string,page=1){return this.timed(this.http.get<AdminReviewDetail>(`/api/admin/reviews/${encodeURIComponent(id)}`,{params:{page,pageSize:20}}));}
 reports(page=1,status='open'){return this.timed(this.http.get<ReviewPage<ReviewReport>>('/api/admin/review-reports',{params:{page,pageSize:20,status}}));}
 setVisibility(id:string,visibility:string,reason:string,expectedVersion:number){return this.timed(this.http.put<number>(`/api/admin/reviews/${encodeURIComponent(id)}/visibility`,{visibility,reason,expectedVersion}));}
 resolve(id:string,resolution:string,reason:string,expectedVersion:number){return this.timed(this.http.put<number>(`/api/admin/review-reports/${encodeURIComponent(id)}/resolution`,{resolution,reason,expectedVersion}));}
}
