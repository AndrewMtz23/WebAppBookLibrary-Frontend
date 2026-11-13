import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { SessionScopeService } from '../auth/session-scope.service';

export interface BranchChoice { id: string; code: string; name: string; timeZone: string; isActive?: boolean; version?: number; }

@Injectable({ providedIn: 'root' })
export class BranchContextService {
  private readonly scope = inject(SessionScopeService);
  private readonly changes = new Subject<void>();
  readonly changed$ = this.changes.asObservable();
  readonly branches = signal<BranchChoice[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly enabled = signal(false);
  readonly generation = signal(0);
  readonly ready = signal(false);

  setBranches(branches: BranchChoice[], enabled: boolean): void {
    this.branches.set(branches.filter(b => b.isActive !== false));
    this.enabled.set(enabled);
    if (this.selectedId() !== null && !this.branches().some(b => b.id === this.selectedId())) this.change(null);
    this.ready.set(true);
  }
  select(id: string): void {
    if (id === this.selectedId() || !this.branches().some(b => b.id === id)) return;
    this.change(id);
  }
  reset(): void { this.ready.set(false); this.branches.set([]); this.change(null); }
  private change(id: string | null): void {
    this.selectedId.set(id); this.generation.update(v => v + 1);
    this.changes.next(); this.scope.invalidate();
  }
}
