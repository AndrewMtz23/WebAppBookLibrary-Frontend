import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  let fixture: ComponentFixture<ErrorStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ErrorStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(ErrorStateComponent);
  });

  it('emits retry intent', () => {
    let emitted = false;
    fixture.componentInstance.retryRequested.subscribe(() => emitted = true);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBeTrue();
  });
});
