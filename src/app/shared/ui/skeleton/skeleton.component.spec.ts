import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  it('is hidden from assistive technology', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.firstElementChild.getAttribute('aria-hidden')).toBe('true');
  });
});
