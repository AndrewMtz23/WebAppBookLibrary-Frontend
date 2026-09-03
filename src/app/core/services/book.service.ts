import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiMessage, ApiResponse } from 'src/app/shared/models/api-response.model';
import { Book, BookInput } from 'src/app/shared/models/book.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly apiUrl = `${environment.apiUrl}/books`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<Book[]>> {
    return this.http.get<ApiResponse<Book[]>>(this.apiUrl);
  }

  getById(id: string): Observable<ApiResponse<Book>> {
    return this.http.get<ApiResponse<Book>>(`${this.apiUrl}/${id}`);
  }

  create(book: BookInput): Observable<ApiResponse<Book>> {
    return this.http.post<ApiResponse<Book>>(this.apiUrl, book);
  }

  update(id: string, book: BookInput): Observable<ApiMessage> {
    return this.http.put<ApiMessage>(`${this.apiUrl}/${id}`, book);
  }

  delete(id: string): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/${id}`);
  }
}
