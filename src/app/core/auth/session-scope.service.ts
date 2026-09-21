import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/** Cancels work tied to a previous identity without coupling data facades to auth. */
@Injectable({ providedIn: 'root' })
export class SessionScopeService {
  private readonly changes = new Subject<void>();
  readonly changed$ = this.changes.asObservable();
  version = 0;
  invalidate(): void { this.version++; this.changes.next(); }
}
