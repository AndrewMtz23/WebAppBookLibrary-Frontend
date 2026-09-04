import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RouteFoundationComponent } from './route-foundation.component';

describe('RouteFoundationComponent', () => {
  let fixture: ComponentFixture<RouteFoundationComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RouteFoundationComponent, RouterTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(RouteFoundationComponent);
  });
  it('describes an upcoming area without pretending to contain data', () => {
    fixture.componentRef.setInput('title', 'Dashboard');
    fixture.componentRef.setInput('description', 'Resumen operativo.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La estructura está lista');
  });
});
