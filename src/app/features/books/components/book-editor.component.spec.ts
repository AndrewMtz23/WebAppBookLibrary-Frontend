import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BookEditorComponent } from './book-editor.component';

describe('BookEditorComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  it('requires explicit classification for an unmigrated book and omits legacy writes', () => {
    const component = TestBed.createComponent(BookEditorComponent).componentInstance;
    component.form.patchValue({ title: 'Historia', authors: 'Autora', description: 'Descripción suficientemente extensa para guardar.', totalCopies: 1 });
    const saved = spyOn(component.save, 'emit'); component.submit(); expect(saved).not.toHaveBeenCalled();
    component.form.controls.categoryIds.setValue(['history']); component.submit();
    expect(saved.calls.mostRecent().args[0]!.categoryIds).toEqual(['history']);
    expect('genres' in saved.calls.mostRecent().args[0]!).toBeFalse();
  });
  it('moves keyboard focus to the editor heading when opened', () => {
    const fixture = TestBed.createComponent(BookEditorComponent); fixture.detectChanges();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#editor-title'));
  });
  it('preserves a loaded digital resource and entered draft when a server error changes', () => {
    const fixture = TestBed.createComponent(BookEditorComponent);
    fixture.componentRef.setInput('record', { book: { title: 'Original', authors: ['Autora'], description: 'Descripción completa de más de veinte caracteres.', language: 'es', categoryIds: ['category-history'], genres: ['Historia'], tags: [], mediaType: 'digital' }, digitalResourceUrl: 'https://example.org/private.pdf' });
    fixture.detectChanges(); const component = fixture.componentInstance;
    component.form.controls.title.setValue('Borrador');
    fixture.componentRef.setInput('error', 'El servidor rechazó la solicitud.'); fixture.detectChanges();
    const saved = spyOn(component.save, 'emit'); component.submit();
    expect(saved).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Borrador', digitalResourceUrl: 'https://example.org/private.pdf' }));
  });
  it('preserves invalid input and only requires the active media fields', () => {
    const component = TestBed.createComponent(BookEditorComponent).componentInstance;
    const save = spyOn(component.save, 'emit');
    component.form.patchValue({ title: 'Draft', authors: 'Autora', categoryIds: ['category-history'], description: 'corta', mediaType: 'digital', digitalResourceUrl: 'http://insecure.org' });
    component.submit(); expect(save).not.toHaveBeenCalled(); expect(component.form.controls.title.value).toBe('Draft');
    component.form.patchValue({ description: 'Descripción completa de más de veinte caracteres.', digitalResourceUrl: 'https://example.org/file.pdf' });
    component.submit(); expect(save).toHaveBeenCalledWith(jasmine.objectContaining({ totalCopies: null, digitalResourceUrl: 'https://example.org/file.pdf' }));
    save.calls.reset(); component.form.patchValue({ mediaType: 'physical', totalCopies: 1.5 }); component.submit(); expect(save).not.toHaveBeenCalled();
    component.form.patchValue({ totalCopies: 2 }); component.submit(); expect(save).toHaveBeenCalledWith(jasmine.objectContaining({ totalCopies: 2, digitalResourceUrl: null }));
  });
});
