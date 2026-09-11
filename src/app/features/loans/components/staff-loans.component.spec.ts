import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { StaffLoansComponent } from './staff-loans.component';
import { StaffLoansFacade } from '../data-access/staff-loans.facade';
import { AuthService } from '../../../core/services/auth.service';
describe('StaffLoansComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [StaffLoansComponent], providers: [StaffLoansFacade, provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getUserRole: () => 'librarian' } }] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders semantic results and keeps focus through confirmation and successful completion', async () => {
    const fixture = TestBed.createComponent(StaffLoansComponent); fixture.detectChanges(); const http = TestBed.inject(HttpTestingController);
    const loan = { id:'a', bookId:'b',userId:'u',bookTitle:'La biblioteca',displayName:'Ana',username:'ana',status:'active',mediaType:'physical',reservedAt:'2026-09-01T00:00:00Z',dueAt:null,returnedAt:null,cancelledAt:null,notes:null };
    http.expectOne(r => r.url === '/api/loans').flush({items:[loan],totalItems:1,page:1,totalPages:1,pageSize:20}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table caption').textContent).toContain('Préstamos');
    fixture.nativeElement.querySelector('[data-detail]').click(); http.expectOne('/api/loans/a').flush({loan,history:[{eventType:'created',timestamp:loan.reservedAt,source:'recorded-date',actorUsername:null}],historyTruncated:false}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]').textContent).toContain('Fecha registrada');
    fixture.nativeElement.querySelector('[data-return]').focus();
    fixture.nativeElement.querySelector('[data-return]').click(); fixture.detectChanges(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('.confirmation').textContent).toContain('La biblioteca');
    expect(fixture.nativeElement.querySelector('.confirmation').textContent).toContain('Ana');
    const confirm = fixture.nativeElement.querySelector('.confirmation .primary');
    expect(document.activeElement).toBe(confirm);
    confirm.click();
    http.expectOne('/api/loans/a/return').flush({idempotent:false});
    http.expectOne('/api/loans/a').flush({loan:{...loan,status:'returned'},history:[],historyTruncated:false});
    http.expectOne(r => r.url === '/api/loans').flush({items:[],totalItems:0,page:1,totalPages:0,pageSize:20});
    fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]'));
  });
  it('shows forbidden and retry inline without a false empty state', () => {
    const fixture = TestBed.createComponent(StaffLoansComponent); fixture.detectChanges(); TestBed.inject(HttpTestingController).expectOne(r => r.url === '/api/loans').flush({}, {status:403,statusText:'Forbidden'}); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('permiso'); expect(fixture.nativeElement.querySelector('.empty')).toBeNull();
  });
  it('restores keyboard focus when a refreshed filter removes the opening row', async () => {
    const fixture = TestBed.createComponent(StaffLoansComponent); fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const loan = { id:'a', bookId:'b',userId:'u',bookTitle:'Libro',displayName:'Ana',username:'ana',status:'active',mediaType:'physical',reservedAt:'2026-09-01T00:00:00Z',dueAt:null,returnedAt:null,cancelledAt:null,notes:null };
    http.expectOne(r => r.url === '/api/loans').flush({items:[loan],totalItems:1,page:1,totalPages:1,pageSize:20}); fixture.detectChanges();
    const opener = fixture.nativeElement.querySelector('[data-detail]') as HTMLButtonElement;
    opener.focus(); opener.click();
    http.expectOne('/api/loans/a').flush({loan,history:[],historyTruncated:false}); fixture.detectChanges(); await fixture.whenStable();
    fixture.componentInstance.vm.page.set({items:[],totalItems:0,page:1,totalPages:0,pageSize:20,hasNextPage:false,hasPreviousPage:false});
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Cerrar detalle"]').click();
    fixture.detectChanges(); await fixture.whenStable();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.toolbar button'));
  });
});
