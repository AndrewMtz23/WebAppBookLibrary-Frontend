import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SupportService } from './support.service';

describe('SupportService', () => {
  it('keeps staff requests separate and sends optimistic versions and creation keys', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SupportService); const http = TestBed.inject(HttpTestingController);
    service.create({ category: 'loan', subject: 'Help', description: 'Details', idempotencyKey: 'stable-key' }).subscribe();
    const create = http.expectOne('/api/support/tickets'); expect(create.request.body.idempotencyKey).toBe('stable-key'); create.flush({});
    service.reply('ticket', 'Answer', 3, false).subscribe();
    const reply = http.expectOne('/api/support/tickets/ticket/replies'); expect(reply.request.body.expectedVersion).toBe(3); reply.flush(4);
    service.reply('ticket', 'Staff answer', 4, true).subscribe(); http.expectOne('/api/support/tickets/ticket/staff/replies').flush(5);
    service.addNote('ticket', 'Internal', 5).subscribe(); http.expectOne('/api/support/tickets/ticket/notes').flush(6);
    service.detail('ticket', 2).subscribe(); http.expectOne('/api/support/tickets/ticket?page=2&pageSize=20').flush({});
    http.verify();
  });
});
