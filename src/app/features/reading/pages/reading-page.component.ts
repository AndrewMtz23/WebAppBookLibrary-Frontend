import { Component, ElementRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadingFacade } from '../data-access/reading.facade';
import { ReadingResponse, ReadingStatus, READING_LABELS } from '../models/reading.models';
import { ReadingEditorComponent } from '../components/reading-editor.component';
import { SessionScopeService } from '../../../core/auth/session-scope.service';

@Component({ selector: 'app-reading-page', standalone: true, imports: [RouterLink, DatePipe, ReadingEditorComponent], providers: [ReadingFacade],
  templateUrl: './reading-page.component.html', styleUrl: './reading-page.component.scss' })
export class ReadingPageComponent {
  readonly facade = inject(ReadingFacade);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly statuses: ReadingStatus[] = ['want_to_read', 'reading', 'finished'];
  readonly labels = READING_LABELS;
  readonly selected = signal<ReadingResponse | null>(null);
  status: ReadingStatus = 'reading'; page = 1;
  private trigger: HTMLElement | null = null;
  constructor() {
    this.facade.saved$.pipe(takeUntilDestroyed()).subscribe(() => this.close());
    inject(SessionScopeService).changed$.pipe(takeUntilDestroyed()).subscribe(() => this.selected.set(null));
    this.load();
  }
  load(): void { this.facade.load({ status: this.status, page: this.page, pageSize: 12 }); }
  select(status: ReadingStatus): void { this.status = status; this.page = 1; this.close(); this.load(); }
  count(status: ReadingStatus): number { const c = this.facade.list().data.counts; return status === 'want_to_read' ? c.wantToRead : status === 'reading' ? c.reading : c.finished; }
  turn(delta: number): void { this.page += delta; this.close(); this.load(); }
  edit(entry: ReadingResponse, event: Event): void { this.trigger = event.currentTarget as HTMLElement; this.facade.resetFeedback(); this.selected.set(entry); queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('app-reading-editor select')?.focus()); }
  close(): void { this.selected.set(null); this.trigger?.focus(); }
  reload(): void { this.close(); this.facade.resetFeedback(); this.load(); }
  tabKey(event: KeyboardEvent, index: number): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    this.select(this.statuses[next]); this.host.nativeElement.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus();
  }
}
