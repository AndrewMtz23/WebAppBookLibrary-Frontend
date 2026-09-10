import { TestBed } from '@angular/core/testing';
import { StaffBookListComponent } from './staff-book-list.component';
import { BookSummary } from '../../../shared/models/book.model';

describe('StaffBookListComponent permissions and filters', () => {
  const book: BookSummary = { id: 'one', title: 'Libro', authors: ['Autora'], subtitle: null, coverUrl: null, mediaType: 'physical', genres: ['Historia'], totalCopies: 2, availableCopies: 1, reservationCount: 0, isFavorite: false, isActive: false };
  it('only emits exceptional deletion when explicitly enabled and inactive', () => {
    const fixture = TestBed.createComponent(StaffBookListComponent);
    const component = fixture.componentInstance; const emitted = spyOn(component.permanent, 'emit');
    component.deletePermanently(book); expect(emitted).not.toHaveBeenCalled();
    component.canPermanentDelete = true; component.deletePermanently({ ...book, isActive: true }); expect(emitted).not.toHaveBeenCalled();
    component.deletePermanently(book); expect(emitted).toHaveBeenCalledWith(book);
  });
  it('preserves unapplied filter input during loading-only updates', () => {
    const fixture = TestBed.createComponent(StaffBookListComponent); fixture.detectChanges();
    fixture.componentInstance.draft.query = 'borrador';
    fixture.componentRef.setInput('loading', true); fixture.detectChanges();
    expect(fixture.componentInstance.draft.query).toBe('borrador');
  });
  it('disables Create and every Edit action while an editor save is pending', () => {
    const fixture = TestBed.createComponent(StaffBookListComponent);
    fixture.componentRef.setInput('page', { items: [book], totalItems: 1 });
    fixture.componentRef.setInput('editorSaving', true); fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const editorCommands = buttons.filter(button => ['Crear libro', 'Editar'].includes(button.textContent!.trim()));
    expect(editorCommands.length).toBe(3);
    expect(editorCommands.every(button => button.disabled)).toBeTrue();
  });
});
