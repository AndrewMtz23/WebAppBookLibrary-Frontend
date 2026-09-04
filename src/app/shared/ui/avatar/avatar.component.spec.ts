import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AvatarComponent] }).compileComponents();
    fixture = TestBed.createComponent(AvatarComponent);
  });

  it('generates at most two initials from a name', () => {
    fixture.componentRef.setInput('name', 'Ana María Torres');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('AT');
  });
});
