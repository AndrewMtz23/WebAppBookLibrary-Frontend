import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { BranchSelectorComponent } from './branch-selector.component';
import { BranchContextService } from './branch-context.service';

describe('BranchSelectorComponent resource origins', () => {
  const id = '000000000000000000000042';
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ imports: [BranchSelectorComponent], providers: [
      provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: AuthService, useValue: { session$: of({ user: { id: 'staff', role: 'librarian' } }), sessionSnapshot: { user: { id: 'staff', role: 'librarian' } } } }
    ] });
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.returnValue(`/librarian/copies/${id}`);
  });
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); sessionStorage.clear(); });

  it('resolves an old copy URL before selecting its authorized branch', () => {
    TestBed.createComponent(BranchSelectorComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/branches/context').flush({ enabled: true });
    http.expectOne('/api/branches/my').flush([{ id: 'origin', name: 'Origin', code: 'O', timeZone: 'UTC' }]);
    expect(TestBed.inject(BranchContextService).selectedId()).toBeNull();
    http.expectOne(`/api/copies/${id}/context`).flush({ branchId: 'origin', branchName: 'Origin' });
    expect(TestBed.inject(BranchContextService).selectedId()).toBe('origin');
  });

  it('does not select an inaccessible copy origin', () => {
    const fixture = TestBed.createComponent(BranchSelectorComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/branches/context').flush({ enabled: true });
    http.expectOne('/api/branches/my').flush([]);
    http.expectOne(`/api/copies/${id}/context`).flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(TestBed.inject(BranchContextService).selectedId()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se pudo resolver la sucursal del ejemplar');
  });

  it('updates a deep link when the user changes branch manually', () => {
    const fixture = TestBed.createComponent(BranchSelectorComponent);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/branches/context').flush({ enabled: true });
    http.expectOne('/api/branches/my').flush([{ id: 'origin', name: 'Origin', code: 'O', timeZone: 'UTC' }, {id:'other',name:'Other',code:'B',timeZone:'UTC'}]);
    http.expectOne(`/api/copies/${id}/context`).flush({ branchId: 'origin' });
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.componentInstance.select('other', true);
    expect(navigate).toHaveBeenCalledWith([], {queryParams:{branch:'other'},queryParamsHandling:'merge',replaceUrl:true});
  });
});
