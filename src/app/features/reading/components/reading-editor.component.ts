import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgressMode, ReadingResponse, ReadingStatus, SaveReadingRequest } from '../models/reading.models';

@Component({ selector: 'app-reading-editor', standalone: true, imports: [FormsModule],
  templateUrl: './reading-editor.component.html', styleUrl: './reading-editor.component.scss' })
export class ReadingEditorComponent implements OnChanges {
  @Input() entry: ReadingResponse | null = null;
  @Input() pageCount: number | null = null;
  @Input() busy = false;
  @Input() error: string | null = null;
  @Input() conflict = false;
  @Output() save = new EventEmitter<SaveReadingRequest>();
  @Output() remove = new EventEmitter<string>();
  @Output() reload = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  status: ReadingStatus = 'want_to_read';
  mode: ProgressMode = 'percent';
  value: number | null = 0;
  adopt = false;
  confirmReset = false;
  removing = false;
  localError = '';
  get canUsePages(): boolean { return (this.entry?.pageCountSnapshot ?? 0) > 0 || (this.pageCount ?? 0) > 0; }
  get total(): number | null { return this.adopt || this.entry?.progressMode !== 'page' ? this.pageCount : this.entry.pageCountSnapshot; }
  get needsConfirmation(): boolean { return !!this.entry && ((this.entry.status !== 'want_to_read' && this.status === 'want_to_read') || (this.entry.status === 'finished' && this.status === 'reading')); }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entry']) {
      this.status = this.entry?.status ?? 'want_to_read'; this.mode = this.entry?.progressMode ?? 'percent';
      this.value = this.mode === 'page' ? this.entry?.currentPage ?? 0 : this.entry?.progressPercent ?? 0;
      this.adopt = this.confirmReset = this.removing = false; this.localError = '';
    }
    if (changes['error'] && this.error) this.focusError();
  }
  changeMode(): void { this.value = null; this.adopt = false; }
  submit(): void {
    if (this.busy || this.conflict || this.entry?.bookAvailable === false) return;
    this.localError = '';
    const value = this.status === 'want_to_read' ? 0 : this.status === 'finished' ? (this.mode === 'page' ? this.total : 100) : this.value;
    if (value === null || !Number.isInteger(value) || value < 0 || value > (this.mode === 'page' ? this.total ?? -1 : 100)) return this.fail('Introduce un avance entero dentro del total indicado.');
    if (this.needsConfirmation && !this.confirmReset) return this.fail('Confirma el cambio de estado antes de guardar.');
    if (this.entry?.status === 'finished' && this.status === 'reading' && value === (this.mode === 'page' ? this.total : 100)) return this.fail('Para reabrir la lectura, introduce un avance menor al total.');
    this.save.emit({ status: this.status, progressMode: this.mode, progressPercent: this.mode === 'percent' ? value : null,
      currentPage: this.mode === 'page' ? value : null, expectedRevision: this.entry?.revision ?? null,
      confirmReset: this.confirmReset, adoptCurrentPageCount: this.adopt });
  }
  requestRemove(): void { if (!this.busy) { this.removing = true; queueMicrotask(() => this.host.nativeElement.querySelector<HTMLButtonElement>('[data-confirm-remove]')?.focus()); } }
  confirmRemove(): void { if (this.removing && this.entry && !this.busy && !this.conflict) this.remove.emit(this.entry.revision); }
  private fail(message: string): void { this.localError = message; this.focusError(); }
  private focusError(): void { queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[data-reading-error]')?.focus()); }
}
