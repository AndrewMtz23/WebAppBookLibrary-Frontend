import { TestBed } from '@angular/core/testing';
import { ReadingEditorComponent } from './reading-editor.component';
import { ReadingResponse } from '../models/reading.models';

export const readingFixture: ReadingResponse = {
  bookId: 'book', revision: 'entry:1', title: 'A book', coverUrl: null, bookAvailable: true,
  status: 'reading', progressMode: 'page', currentPage: 40, pageCountSnapshot: 100, currentPageCount: 80,
  progressPercent: 40, pageCountChanged: true, startedAt: '2030-01-01T00:00:00Z', finishedAt: null,
  lastProgressAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z'
};

describe('ReadingEditorComponent', () => {
  function create(entry: ReadingResponse | null = readingFixture, pages: number | null = 80) {
    const f = TestBed.createComponent(ReadingEditorComponent);
    f.componentRef.setInput('entry', entry); f.componentRef.setInput('pageCount', pages); f.detectChanges(); return f;
  }
  it('preserves snapshot and sends a single progress value with the observed revision', () => {
    const f = create(); const saved = jasmine.createSpy(); f.componentInstance.save.subscribe(saved);
    f.componentInstance.value = 55; f.componentInstance.submit();
    expect(saved).toHaveBeenCalledWith(jasmine.objectContaining({ currentPage: 55, progressPercent: null, expectedRevision: 'entry:1', adoptCurrentPageCount: false }));
  });
  it('requires explicit confirmation to reset and to remove', () => {
    const f = create(); const saved = jasmine.createSpy(); const removed = jasmine.createSpy();
    f.componentInstance.save.subscribe(saved); f.componentInstance.remove.subscribe(removed);
    f.componentInstance.status = 'want_to_read'; f.componentInstance.submit(); expect(saved).not.toHaveBeenCalled();
    f.componentInstance.confirmReset = true; f.componentInstance.submit();
    expect(saved).toHaveBeenCalledWith(jasmine.objectContaining({ currentPage: 0, confirmReset: true }));
    f.componentInstance.requestRemove(); expect(removed).not.toHaveBeenCalled();
    f.componentInstance.confirmRemove(); expect(removed).toHaveBeenCalledOnceWith('entry:1');
  });
  it('requires correction when adopting a smaller total and retains draft on conflict', () => {
    const f = create(readingFixture, 20); const saved = jasmine.createSpy(); f.componentInstance.save.subscribe(saved);
    f.componentInstance.adopt = true; f.componentInstance.submit(); expect(saved).not.toHaveBeenCalled();
    f.componentInstance.value = 15; f.componentInstance.submit(); expect(saved).toHaveBeenCalled();
    f.componentRef.setInput('conflict', true); f.componentRef.setInput('error', 'Conflicto'); f.detectChanges();
    expect(f.componentInstance.value).toBe(15); expect(f.nativeElement.textContent).toContain('Recargar');
    saved.calls.reset(); f.componentInstance.submit(); expect(saved).not.toHaveBeenCalled();
  });
  it('rejects fractional percentages and has no pages option without a valid total', () => {
    const f = create(null, null); const saved = jasmine.createSpy(); f.componentInstance.save.subscribe(saved);
    f.componentInstance.status = 'reading'; f.componentInstance.value = 12.5; f.componentInstance.submit(); expect(saved).not.toHaveBeenCalled();
    expect(f.componentInstance.canUsePages).toBeFalse();
    f.componentInstance.value = 100; f.componentInstance.submit(); expect(saved).toHaveBeenCalledWith(jasmine.objectContaining({ progressPercent: 100 }));
  });
});
