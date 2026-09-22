import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { By } from '@angular/platform-browser';
import { BookEditorComponent } from '../components/book-editor.component';
import { CategoriesApi } from '../../categories/categories.api';
import { StaffBooksApi } from './staff-books.api';
import { StaffBooksFacade } from './staff-books.facade';
import { BookManagement, BookWriteRequest } from './staff-books.models';

@Component({ standalone: true, imports: [BookEditorComponent], template: `<app-book-editor [record]="facade.editorRecord()" [saving]="facade.saving()" [error]="facade.editorError()" [conflict]="!!facade.conflictRecord()" (save)="facade.save($event)" />` })
class EditorHarness { readonly facade = inject(StaffBooksFacade); }

describe('StaffBooksFacade', () => {
  const record: BookManagement = { book: { id: 'abc', title: 'Original', subtitle: null, authors: ['Autora'], isbn: null, description: 'Una descripción con más de veinte caracteres.', publisher: null, publishedDate: null, language: 'es', pageCount: null, tags: [], coverUrl: null, genres: ['Historia'], mediaType: 'digital', availableCopies: null, totalCopies: null, reservationCount: 0, isFavorite: false, isActive: true, createdAt: '', updatedAt: '' }, digitalResourceUrl: 'https://example.org/private.pdf' };
  const page = { items: [record.book], page: 3, pageSize: 20, totalItems: 41, totalPages: 3, hasNextPage: false, hasPreviousPage: true };
  let api: jasmine.SpyObj<StaffBooksApi>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let facade: StaffBooksFacade;
  beforeEach(() => {
    record.book.categoryIds = ['64b000000000000000000001'];
    record.book.categories = [{ id: '64b000000000000000000001', name: 'Historia', slug: 'historia', isActive: true }];
    TestBed.configureTestingModule({ providers: [{ provide: CategoriesApi, useValue: { list: () => of({ items: record.book.categories, page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false }) } }] });
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { open: jasmine.createSpy('open') } }] });
    api = jasmine.createSpyObj<StaffBooksApi>('api', ['search', 'management', 'create', 'update', 'status', 'permanent']);
    api.search.and.returnValue(of(page)); api.management.and.returnValue(of(record));
    params = new BehaviorSubject(convertToParamMap({ page: '3', query: 'historia', isActive: 'false', lowStock: 'true', missingResource: 'false', language: 'es', sort: 'title', direction: 'asc' }));
    TestBed.configureTestingModule({ providers: [StaffBooksFacade, { provide: StaffBooksApi, useValue: api }, { provide: ActivatedRoute, useValue: { queryParamMap: params } }, { provide: Router, useValue: { navigate: jasmine.createSpy().and.resolveTo(true) } }] });
    facade = TestBed.inject(StaffBooksFacade);
  });
  it('restores all URL filters and sends server pagination on back/forward', () => {
    expect(api.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ page: 3, query: 'historia', isActive: 'false', lowStock: 'true', missingResource: 'false', language: 'es', sort: 'title', direction: 'asc' }));
    params.next(convertToParamMap({ page: '2', mediaType: 'digital', available: 'true' }));
    expect(api.search.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ page: 2, mediaType: 'digital', available: 'true', query: '' }));
  });
  it('refresh preserves the current URL page and filters', () => { facade.refresh(); expect(api.search.calls.mostRecent().args[0].page).toBe(3); });
  it('opens the create editor from the dashboard quick-link URL', () => {
    params.next(convertToParamMap({ create: 'true' }));
    expect(facade.editorOpen()).toBeTrue();
    expect(facade.editorRecord()).toBeNull();
  });
  it('successful update refreshes rows and closes editor', () => {
    facade.edit(record.book); api.update.and.returnValue(of(record.book));
    facade.save({ title: 'Edited' } as BookWriteRequest);
    expect(api.update).toHaveBeenCalled(); expect(api.search.calls.count()).toBe(2); expect(facade.editorOpen()).toBeFalse();
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith('Libro actualizado.', 'Cerrar', jasmine.any(Object));
  });
  it('create uses create command and refreshes rows', () => {
    facade.create(); api.create.and.returnValue(of(record.book)); facade.save({ title: 'New' } as BookWriteRequest);
    expect(api.create).toHaveBeenCalled(); expect(api.update).not.toHaveBeenCalled(); expect(api.search.calls.count()).toBe(2);
    expect(facade.editorOpen()).toBeFalse();
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith('Libro creado.', 'Cerrar', jasmine.any(Object));
  });
  it('409 fetches current server record but preserves original editor until reload chosen', () => {
    facade.edit(record.book); api.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    api.management.and.returnValue(of({ ...record, book: { ...record.book, title: 'Server changed' } }));
    facade.save({ title: 'Draft' } as BookWriteRequest);
    expect(facade.editorRecord()?.book.title).toBe('Original'); expect(facade.conflictRecord()?.book.title).toBe('Server changed');
    expect(facade.editorOpen()).toBeTrue(); facade.reloadEditor(); expect(facade.editorRecord()?.book.title).toBe('Server changed');
  });
  it('keeps refreshing state when a newer URL cancels a pending request', () => {
    api.search.and.returnValue(new Subject());
    facade.refresh();
    params.next(convertToParamMap({ page: '2' }));
    expect(facade.loading()).toBeTrue();
    expect(facade.page()?.items[0].title).toBe('Original');
  });
  it('does not hide permanent-delete conflicts when reconciling rows', () => {
    api.permanent.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    facade.requestPermanent(record.book); facade.confirmCommand();
    expect(facade.error()).toContain('No se puede eliminar');
  });
  it('preserves draft context after 400 and network errors and prevents double save', () => {
    facade.edit(record.book);
    const response = new Subject<typeof record.book>(); api.update.and.returnValue(response);
    facade.save({ title: 'Draft' } as BookWriteRequest); facade.save({ title: 'Duplicate' } as BookWriteRequest);
    expect(api.update.calls.count()).toBe(1);
    response.error(new HttpErrorResponse({ status: 400 }));
    expect(facade.editorOpen()).toBeTrue(); expect(facade.editorRecord()).toEqual(record); expect(facade.saving()).toBeFalse();
    api.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    facade.save({ title: 'Draft' } as BookWriteRequest); expect(facade.editorOpen()).toBeTrue(); expect(facade.editorError()).toContain('conserva');
  });
  it('ignores A reconciliation after B opens and preserves B inputs and identifier', () => {
    const fixture = TestBed.createComponent(EditorHarness);
    facade.edit(record.book); fixture.detectChanges();
    const reconciliation = new Subject<BookManagement>();
    api.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    api.management.and.returnValue(reconciliation);
    facade.save({ title: 'Draft A' } as BookWriteRequest);
    facade.closeEditor();
    const second = { ...record, book: { ...record.book, id: 'second', title: 'Book B' } };
    api.management.and.returnValue(of(second)); facade.edit(second.book); fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(BookEditorComponent)).componentInstance as BookEditorComponent;
    editor.form.controls.title.setValue('Draft B');
    reconciliation.next(record); reconciliation.complete(); fixture.detectChanges();
    expect(facade.conflictRecord()).toBeNull();
    facade.reloadEditor(); fixture.detectChanges();
    expect(facade.editorRecord()?.book.id).toBe('second');
    expect(editor.form.controls.title.value).toBe('Draft B');
    expect(fixture.nativeElement.textContent).not.toContain('Descartar borrador');
  });
  for (const status of [400, 409, 0]) {
    it(`prevents Create/Edit during a pending save and retains actual inputs after ${status}`, () => {
      const fixture = TestBed.createComponent(EditorHarness);
      facade.edit(record.book); fixture.detectChanges();
      const editor = fixture.debugElement.query(By.directive(BookEditorComponent)).componentInstance as BookEditorComponent;
      editor.form.controls.title.setValue('Submitted draft');
      const response = new Subject<typeof record.book>(); api.update.and.returnValue(response);
      editor.submit(); fixture.detectChanges();
      facade.create(); facade.edit({ ...record.book, id: 'second' }); fixture.detectChanges();
      response.error(new HttpErrorResponse({ status })); fixture.detectChanges();
      expect(facade.editorRecord()?.book.id).toBe(record.book.id);
      expect(editor.form.controls.title.value).toBe('Submitted draft');
      expect(editor.form.controls.digitalResourceUrl.value).toBe(record.digitalResourceUrl!);
      expect(facade.editorOpen()).toBeTrue();
      expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(facade.editorError(), 'Cerrar', jasmine.any(Object));
      expect(api.management.calls.count()).toBe(status === 409 ? 2 : 1);
    });
  }
  it('cancels a pending reconciliation on create and ignores its late error', () => {
    facade.edit(record.book);
    const reconciliation = new Subject<BookManagement>();
    api.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    api.management.and.returnValue(reconciliation); facade.save({ title: 'A' } as BookWriteRequest);
    expect(reconciliation.observed).toBeTrue(); facade.create();
    expect(reconciliation.observed).toBeFalse();
    reconciliation.error(new Error('late'));
    expect(facade.editorError()).toBe(''); expect(facade.editorRecord()).toBeNull(); expect(facade.conflictRecord()).toBeNull();
  });
  it('cancels initial editor requests on close and reconciliation on destruction', () => {
    const opening = new Subject<BookManagement>(); api.management.and.returnValue(opening);
    facade.edit(record.book); facade.closeEditor(); expect(opening.observed).toBeFalse();
    api.management.and.returnValue(of(record)); facade.edit(record.book);
    const reconciliation = new Subject<BookManagement>(); api.management.and.returnValue(reconciliation);
    api.update.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    facade.save({ title: 'A' } as BookWriteRequest); expect(reconciliation.observed).toBeTrue();
    TestBed.resetTestingModule(); expect(reconciliation.observed).toBeFalse();
  });

  for (const action of ['activate', 'deactivate', 'delete'] as const) {
    it(`notifies after book ${action} succeeds`, () => {
      api.status.and.returnValue(of(void 0)); api.permanent.and.returnValue(of(void 0));
      const book = { ...record.book, isActive: action === 'deactivate' };
      if (action === 'delete') facade.requestPermanent(book); else facade.requestStatus(book);
      facade.confirmCommand();
      expect(facade.pending()).toBeNull();
      expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledWith(
        action === 'delete' ? 'Libro eliminado definitivamente.' : action === 'activate' ? 'Libro activado.' : 'Libro desactivado.',
        'Cerrar', jasmine.any(Object));
    });
  }

  it('reports a rejected book deletion without announcing success', () => {
    api.permanent.and.returnValue(throwError(() => ({ status: 409 })));
    facade.requestPermanent(record.book); facade.confirmCommand();
    expect(TestBed.inject(MatSnackBar).open).toHaveBeenCalledOnceWith(facade.error(), 'Cerrar', jasmine.any(Object));
  });
});
