import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ADMIN_ROUTES } from '../admin/admin.routes';
import { LIBRARIAN_ROUTES } from '../librarian/librarian.routes';
import { AuthService } from '../../core/services/auth.service';
describe('Staff circulation route integration', () => {
  it('loads independent role pages and consumes dashboard query links', async () => {
    const admin = ADMIN_ROUTES[0].children!.find(r => r.path === 'loans')!;
    const librarian = LIBRARIAN_ROUTES[0].children!.find(r => r.path === 'loans')!;
    expect(admin.loadComponent).toBeDefined(); expect(librarian.loadComponent).toBeDefined();
    TestBed.configureTestingModule({providers:[provideRouter([{...admin,path:'admin/loans'},{...librarian,path:'librarian/loans'}]),provideHttpClient(),provideHttpClientTesting(),{provide:AuthService,useValue:{getUserRole:()=> 'admin'}}]});
    const harness = await RouterTestingHarness.create(); const http = TestBed.inject(HttpTestingController);
    await harness.navigateByUrl('/admin/loans?status=returned&dateField=returnedAt&page=2');
    let req = http.expectOne(r=>r.url === '/api/loans'); expect(req.request.params.get('status')).toBe('returned'); expect(req.request.params.get('page')).toBe('2'); req.flush({items:[],totalItems:0,page:2,totalPages:0});
    expect(harness.routeNativeElement?.textContent).toContain('Supervisa reservas');
    await harness.navigateByUrl('/librarian/loans?status=cancelled&dateField=cancelledAt'); req = http.expectOne(r=>r.url === '/api/loans'); expect(req.request.params.get('dateField')).toBe('cancelledAt'); req.flush({items:[],totalItems:0,page:1,totalPages:0});
    expect(harness.routeNativeElement?.textContent).toContain('Registra devoluciones'); http.verify();
  });
});
