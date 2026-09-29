import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { ReadingActionComponent } from './reading-action.component';
import { ReadingEditorComponent } from './reading-editor.component';
import { AuthService } from '../../../core/services/auth.service';
import { OperationNotificationService } from '../../../core/services/operation-notification.service';

describe('ReadingActionComponent latest catalog total', () => {
  it('uses the current reading response instead of stale detail data, including a removed total', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: { sessionSnapshot: { user: { role: 'admin' } } } },
      { provide: OperationNotificationService, useValue: { success: () => {} } }] });
    const f = TestBed.createComponent(ReadingActionComponent); f.componentRef.setInput('bookId', 'book'); f.componentRef.setInput('pageCount', 100); f.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const total of [50, null]) {
      f.componentInstance.open();
      http.expectOne(r => r.url === '/api/reading/my').flush({ items: [{ bookId: 'book', revision: 'entry:1', status: 'reading', progressMode: 'page', currentPage: 80, pageCountSnapshot: 100, currentPageCount: total, pageCountChanged: true, bookAvailable: true }], counts: {}, totalItems: 1 });
      f.detectChanges();
      expect(f.debugElement.query(By.directive(ReadingEditorComponent)).componentInstance.pageCount).toBe(total);
      f.componentInstance.close(); f.detectChanges();
    }
    http.verify();
  });
});
