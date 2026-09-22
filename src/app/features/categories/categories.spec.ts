import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CategoriesApi, Category } from './categories.api';
import { CategorySelectorComponent } from './category-selector.component';
import { CategoriesPageComponent } from './categories-page.component';
import { OperationNotificationService } from '../../core/services/operation-notification.service';
const category: Category = { id: 'history', name: 'Historia', slug: 'historia', isActive: true, version: 3, description: null, createdAt: '', updatedAt: '', bookCount: 2 };
const page = (items: Category[], current = 1, next = false) => ({ items, page: current, pageSize: 20, totalPages: next ? 2 : current, totalItems: items.length, hasNextPage: next, hasPreviousPage: current > 1 });
describe('controlled categories', () => {
  let http: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: OperationNotificationService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } }] }); http = TestBed.inject(HttpTestingController); });
  afterEach(() => http.verify());
  it('sends versions with status and guarded delete and separates public/admin lists', () => {
    const api = TestBed.inject(CategoriesApi);
    api.list('Historia', 2, true, 'false').subscribe(); const list = http.expectOne(r => r.url === '/api/admin/categories'); expect(list.request.params.get('page')).toBe('2'); expect(list.request.params.get('isActive')).toBe('false'); list.flush(page([]));
    api.status(category).subscribe(); const status = http.expectOne('/api/admin/categories/history/status'); expect(status.request.body).toEqual({ isActive: false, version: 3 }); status.flush(category);
    api.delete(category).subscribe(); const remove = http.expectOne('/api/admin/categories/history?version=3'); expect(remove.request.method).toBe('DELETE'); remove.flush(null);
  });
  it('reaches later selector pages, retains inactive selections, and limits assignments to eight', () => {
    const fixture = TestBed.createComponent(CategorySelectorComponent); fixture.componentRef.setInput('existing', [{ ...category, isActive: false }]); fixture.componentRef.setInput('ids', ['history']); fixture.detectChanges();
    http.expectOne(r => r.url === '/api/categories').flush(page([{ ...category, id: 'other' }], 1, true));
    const selector = fixture.componentInstance; expect(selector.label('history')).toContain('inactiva'); selector.load(2);
    const request = http.expectOne(r => r.params.get('page') === '2'); request.flush(page([{ ...category, id: 'late' }], 2));
    const changed = spyOn(selector.idsChange, 'emit'); selector.toggle('late'); expect(changed).toHaveBeenCalledWith(['history', 'late']);
    selector.ids = Array.from({length: 8}, (_, i) => String(i)); changed.calls.reset(); selector.toggle('late'); expect(changed).not.toHaveBeenCalled();
  });
  it('preserves category editor draft after a version conflict', () => {
    const fixture = TestBed.createComponent(CategoriesPageComponent); fixture.detectChanges(); http.expectOne(r => r.url === '/api/admin/categories').flush(page([category]));
    const component = fixture.componentInstance; component.edit(category); component.editor!.name = 'Historia revisada'; component.save();
    const request = http.expectOne('/api/admin/categories/history'); expect(request.request.body.version).toBe(3); request.flush({}, { status: 409, statusText: 'Conflict' });
    http.expectOne(r => r.url === '/api/admin/categories').flush(page([{ ...category, version: 4 }]));
    expect(component.editor?.name).toBe('Historia revisada'); expect(component.mutationError()).toContain('Conflicto'); expect(component.busy()).toBeFalse();
  });
});
