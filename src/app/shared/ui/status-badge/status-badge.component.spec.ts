import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatusBadgeComponent] }).compileComponents();
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('renders an icon and localized label for canonical status', () => {
    fixture.componentRef.setInput('status', 'available');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-icon')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Disponible');
  });
});
