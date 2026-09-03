import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SecurityAnalysisService, SecurityProbeResult } from './security-analysis.service';
import { SecurityDashboardComponent } from './security-dashboard.component';

describe('SecurityDashboardComponent', () => {
  let fixture: ComponentFixture<SecurityDashboardComponent>;
  let component: SecurityDashboardComponent;
  const analysis = jasmine.createSpyObj<SecurityAnalysisService>('SecurityAnalysisService', ['runSecurityAnalysis', 'calculateSummary']);

  beforeEach(async () => {
    analysis.runSecurityAnalysis.and.returnValue(of([]));
    analysis.calculateSummary.and.returnValue({ score: null, passed: 0, failed: 0, inconclusive: 0, unavailable: 0, conclusive: 0 });
    await TestBed.configureTestingModule({ imports: [SecurityDashboardComponent], providers: [{ provide: SecurityAnalysisService, useValue: analysis }] }).compileComponents();
    fixture = TestBed.createComponent(SecurityDashboardComponent);
    component = fixture.componentInstance;
  });

  it('states that the report is not a penetration test', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('no sustituye una auditoría ni una prueba de penetración');
  });

  it('renders unavailable without calling it a vulnerability', () => {
    const unavailable: SecurityProbeResult = { name: 'API', endpoint: '/api/health', expectedStatus: 200, actualStatus: null, durationMs: 1, checkedAt: new Date(0).toISOString(), status: 'unavailable', explanation: 'No fue posible conectar con la API.' };
    component.results = [unavailable];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No disponible');
    expect(fixture.nativeElement.textContent).not.toContain('Vulnerable');
  });
});
