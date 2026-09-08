import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('explains the missing route and offers a way home', async () => {
    await TestBed.configureTestingModule({ imports: [NotFoundComponent, RouterTestingModule] }).compileComponents();
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('no está en el catálogo');
    expect(fixture.nativeElement.querySelector('a')).not.toBeNull();
  });
});
