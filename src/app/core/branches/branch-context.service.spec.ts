import { TestBed } from '@angular/core/testing';
import { BranchContextService } from './branch-context.service';
import { SessionScopeService } from '../auth/session-scope.service';

describe('BranchContextService', () => {
  it('invalidates prior context and refuses choices outside the loaded membership', () => {
    const context = TestBed.inject(BranchContextService);
    const scope = TestBed.inject(SessionScopeService);
    context.setBranches([{ id: 'a', code: 'A', name: 'Centro', timeZone: 'UTC' }], true);
    expect(context.selectedId()).toBeNull();
    context.select('a');
    expect(context.selectedId()).toBe('a');
    const version = scope.version;
    context.select('b');
    expect(context.selectedId()).toBe('a');
    context.reset();
    expect(context.selectedId()).toBeNull();
    expect(scope.version).toBeGreaterThan(version);
  });
});
