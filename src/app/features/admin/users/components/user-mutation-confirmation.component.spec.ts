import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMutationConfirmationComponent } from './user-mutation-confirmation.component';

describe('UserMutationConfirmationComponent', () => {
  let fixture: ComponentFixture<UserMutationConfirmationComponent>;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UserMutationConfirmationComponent] });
    fixture = TestBed.createComponent(UserMutationConfirmationComponent);
    fixture.componentInstance.mutation = { type: 'status', user: { id: 'target', username: 'ana', displayName: 'Ana', email: 'ana@example.test', role: 'user', isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastLoginAt: null }, nextActive: false };
  });

  it('disables confirmation during reconciliation and offers retry on reconciliation failure', () => {
    fixture.componentRef.setInput('reconciling', true);
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('[data-confirm]') as HTMLButtonElement).disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Consultando el estado actual');

    fixture.componentRef.setInput('reconciling', false);
    fixture.componentRef.setInput('reconciliationError', 'No pudimos consultar la cuenta.');
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('[data-reconcile-retry]') as HTMLButtonElement).disabled).toBeFalse();
    expect((fixture.nativeElement.querySelector('[data-confirm]') as HTMLButtonElement).disabled).toBeTrue();
  });

  it('focuses an enabled safe control for reconciliation states and confirm when actionable', async () => {
    const warn = spyOn(console, 'warn');
    const states = [
      { reconciling: true, reconciliationError: '', selector: '[data-cancel]' },
      { reconciling: false, reconciliationError: 'No pudimos consultar la cuenta.', selector: '[data-reconcile-retry]' },
      { reconciling: false, reconciliationError: '', selector: '[data-confirm]' }
    ];

    for (const state of states) {
      const current = TestBed.createComponent(UserMutationConfirmationComponent);
      current.componentInstance.mutation = fixture.componentInstance.mutation;
      current.componentRef.setInput('reconciling', state.reconciling);
      current.componentRef.setInput('reconciliationError', state.reconciliationError);
      current.detectChanges();
      await current.whenStable();
      const focused = current.nativeElement.querySelector(state.selector) as HTMLButtonElement;
      expect(document.activeElement).toBe(focused);
      expect(focused.disabled).toBeFalse();
    }

    expect(warn.calls.allArgs().some(args => String(args[0]).includes('cdkFocusInitial'))).toBeFalse();
  });
});
