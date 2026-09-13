import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { LibrarianDashboardPageComponent } from '../../features/librarian/dashboard/pages/librarian-dashboard-page.component';

describe('dashboard page navigation', () => {
  it('restores the URL period and maps each librarian KPI to exact list filters', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'librarian/dashboard', component: LibrarianDashboardPageComponent }]), provideHttpClient(), provideHttpClientTesting()] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/librarian/dashboard?from=2026-09-01&to=2026-09-10&timezone=America%2FMexico_City');
    const request = TestBed.inject(HttpTestingController).expectOne(item => item.url === '/api/dashboard/librarian');
    expect(request.request.params.get('from')).toBe('2026-09-01');
    expect(request.request.params.get('timezone')).toBe('America/Mexico_City');
    request.flush({ generatedAt:'2026-09-11T00:00:00Z',from:'2026-09-01T06:00:00Z',to:'2026-09-11T06:00:00Z',totalReservations:2,activeReservations:3,overdueReservations:1,activeBooks:4,availablePhysicalCopies:2,byMedia:[],timezone:'America/Mexico_City',previousFrom:'2026-08-22T06:00:00Z',previousTo:'2026-09-01T06:00:00Z',returnedPhysical:{current:1,previous:0,percentageChange:null},digitalReservations:{current:1,previous:1,percentageChange:0},lowInventoryTitles:1,outOfStockTitles:1,topReservedTitles:[],titlesWithoutReservations:[{id:'book-quiet',label:'Quiet',count:0}] });
    await harness.fixture.whenStable();
    harness.detectChanges();

    const anchors = Array.from(harness.routeNativeElement!.querySelectorAll('a')) as HTMLAnchorElement[];
    const overdue = anchors.find(anchor => anchor.textContent?.includes('Vencidos físicos'))!;
    const returned = anchors.find(anchor => anchor.textContent?.includes('Devueltos en el periodo'))!;
    expect(overdue.getAttribute('href')).toContain('status=overdue');
    expect(overdue.getAttribute('href')).toContain('mediaType=physical');
    expect(returned.getAttribute('href')).toContain('dateField=returnedAt');
    expect(returned.getAttribute('href')).toContain('from=2026-09-01T06:00:00Z');
    expect(anchors.find(anchor => anchor.textContent?.includes('Crear libro'))?.getAttribute('href')).toContain('create=true');
    expect(anchors.find(anchor => anchor.textContent?.includes('Quiet'))?.getAttribute('href')).toContain('bookId=book-quiet');
    TestBed.inject(HttpTestingController).verify();
  });
});
