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

  it('renders a remote profile image and falls back to initials when it fails', () => {
    fixture.componentRef.setInput('name', 'Ana Torres');
    fixture.componentRef.setInput('imageUrl', 'https://images.example.test/ana.jpg');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(image.src).toContain('https://images.example.test/ana.jpg');
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('AT');
  });
});
