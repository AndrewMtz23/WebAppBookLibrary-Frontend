// 📁 features/security-dashboard/security-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// ✅ IMPORTACIONES DE ANGULAR MATERIAL
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// ✅ HIGHCHARTS
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';

// ✅ SERVICIOS E INTERFACES
import { SecurityAnalysisService, SecurityTest, ApiTestResult } from './security-analysis.service';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatListModule,
    MatSnackBarModule,
    HighchartsChartModule
  ],
  template: `
    <div class="security-dashboard">
      <!-- ✅ HEADER -->
      <mat-card class="header-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="security-icon">security</mat-icon>
          <mat-card-title>Dashboard de Seguridad</mat-card-title>
          <mat-card-subtitle>Análisis de vulnerabilidades en APIs</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-actions>
          <button 
            mat-raised-button 
            color="primary" 
            (click)="runSecurityAnalysis()"
            [disabled]="loading">
            <mat-icon>{{ loading ? 'hourglass_empty' : 'play_arrow' }}</mat-icon>
            {{ loading ? 'Analizando...' : 'Ejecutar Análisis' }}
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- ✅ MÉTRICAS GENERALES -->
      <div class="metrics-row" *ngIf="securityMetrics">
        <mat-card class="metric-card secure">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon>shield</mat-icon>
              <span>API Segura</span>
            </div>
            <div class="metric-score">{{ securityMetrics.secure.score }}%</div>
            <div class="metric-status" [ngClass]="getStatusClass(securityMetrics.secure.status)">
              {{ securityMetrics.secure.status }}
            </div>
            <div class="metric-details">
              <small>{{ securityMetrics.secure.vulnerabilities }} vulnerabilidades</small>
              <small>{{ securityMetrics.secure.avgResponseTime | number:'1.0-0' }}ms promedio</small>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="metric-card insecure">
          <mat-card-content>
            <div class="metric-header">
              <mat-icon>gpp_bad</mat-icon>
              <span>API Insegura</span>
            </div>
            <div class="metric-score">{{ securityMetrics.insecure.score }}%</div>
            <div class="metric-status" [ngClass]="getStatusClass(securityMetrics.insecure.status)">
              {{ securityMetrics.insecure.status }}
            </div>
            <div class="metric-details">
              <small>{{ securityMetrics.insecure.vulnerabilities }} vulnerabilidades</small>
              <small>{{ securityMetrics.insecure.avgResponseTime | number:'1.0-0' }}ms promedio</small>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ✅ GRÁFICAS -->
      <div class="charts-container" *ngIf="securityMetrics">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>speed</mat-icon>
              Puntuación de Seguridad
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <highcharts-chart
              [Highcharts]="Highcharts"
              [options]="securityScoreChart"
              class="chart">
            </highcharts-chart>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>bug_report</mat-icon>
              Vulnerabilidades
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <highcharts-chart
              [Highcharts]="Highcharts"
              [options]="vulnerabilityChart"
              class="chart">
            </highcharts-chart>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ✅ CONFIGURACIÓN DE TESTS -->
      <mat-card class="tests-config-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Configuración de Tests
          </mat-card-title>
          <mat-card-subtitle>{{ securityTests.length }} tests configurados</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="tests-list">
            <mat-expansion-panel 
              *ngFor="let test of securityTests; let i = index"
              class="test-panel">
              
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon [class]="'risk-' + test.riskLevel.toLowerCase()">
                    {{ test.riskLevel === 'CRITICAL' ? 'dangerous' : 
                       test.riskLevel === 'HIGH' ? 'warning' : 
                       test.riskLevel === 'MEDIUM' ? 'info' : 'check_circle' }}
                  </mat-icon>
                  {{ test.name }}
                </mat-panel-title>
                <mat-panel-description>
                  <span class="risk-badge" [class]="'risk-' + test.riskLevel.toLowerCase()">
                    {{ test.riskLevel }}
                  </span>
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="test-details">
                <p><strong>Descripción:</strong> {{ test.description }}</p>
                <div class="test-config">
                  <span class="config-item">
                    <mat-icon>http</mat-icon>
                    {{ test.method }} {{ test.endpoint }}
                  </span>
                </div>
                <div class="expected-results">
                  <div class="expected secure">
                    <strong>API Segura:</strong> {{ test.expectedSecure }}
                  </div>
                  <div class="expected insecure">
                    <strong>API Insegura:</strong> {{ test.expectedInsecure }}
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ✅ RESULTADOS DETALLADOS -->
      <div class="results-container" *ngIf="testResults">
        <div class="results-section">
          <mat-card class="results-card secure-results">
            <mat-card-header>
              <mat-icon mat-card-avatar class="secure-icon">shield</mat-icon>
              <mat-card-title>Resultados API Segura</mat-card-title>
              <mat-card-subtitle>{{ testResults.secure.length }} tests ejecutados</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <mat-list>
                <mat-list-item *ngFor="let result of testResults.secure" class="result-item">
                  <mat-icon 
                    matListItemIcon 
                    [color]="getTestColor(result)">
                    {{ getTestIcon(result) }}
                  </mat-icon>
                  
                  <div matListItemTitle>{{ result.test }}</div>
                  <div matListItemLine>
                    <span class="status-code">{{ result.statusCode }}</span>
                    <span class="response-time">{{ result.responseTime }}ms</span>
                    <span class="vulnerability-status" 
                          [class]="result.vulnerability ? 'vulnerable' : 'secure'">
                      {{ result.vulnerability ? 'VULNERABLE' : 'SEGURO' }}
                    </span>
                  </div>
                  <div matListItemLine class="details">{{ result.details }}</div>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>

          <mat-card class="results-card insecure-results">
            <mat-card-header>
              <mat-icon mat-card-avatar class="insecure-icon">gpp_bad</mat-icon>
              <mat-card-title>Resultados API Insegura</mat-card-title>
              <mat-card-subtitle>{{ testResults.insecure.length }} tests ejecutados</mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <mat-list>
                <mat-list-item *ngFor="let result of testResults.insecure" class="result-item">
                  <mat-icon 
                    matListItemIcon 
                    [color]="getTestColor(result)">
                    {{ getTestIcon(result) }}
                  </mat-icon>
                  
                  <div matListItemTitle>{{ result.test }}</div>
                  <div matListItemLine>
                    <span class="status-code">{{ result.statusCode }}</span>
                    <span class="response-time">{{ result.responseTime }}ms</span>
                    <span class="vulnerability-status" 
                          [class]="result.vulnerability ? 'vulnerable' : 'secure'">
                      {{ result.vulnerability ? 'VULNERABLE' : 'SEGURO' }}
                    </span>
                  </div>
                  <div matListItemLine class="details">{{ result.details }}</div>
                </mat-list-item>
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- ✅ LOADING SPINNER -->
      <div class="loading-overlay" *ngIf="loading">
        <mat-spinner diameter="60"></mat-spinner>
        <p>Ejecutando análisis de seguridad...</p>
      </div>

      <!-- ✅ ESTADO INICIAL -->
      <mat-card class="empty-state" *ngIf="!testResults && !loading">
        <mat-card-content>
          <mat-icon class="empty-icon">security</mat-icon>
          <h3>Análisis de Seguridad</h3>
          <p>Haz clic en "Ejecutar Análisis" para comenzar la evaluación de vulnerabilidades en las APIs.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .security-dashboard {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-card {
      margin-bottom: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-card .mat-card-header {
      margin-bottom: 16px;
    }

    .security-icon {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .header-card .mat-card-title,
    .header-card .mat-card-subtitle {
      color: white;
    }

    .header-card .mat-card-actions {
      margin: 0;
      padding: 16px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .metric-card.secure {
      border-left: 4px solid #4CAF50;
    }

    .metric-card.insecure {
      border-left: 4px solid #f44336;
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      margin-bottom: 8px;
    }

    .metric-score {
      font-size: 2.5rem;
      font-weight: bold;
      line-height: 1;
      margin-bottom: 8px;
    }

    .metric-status {
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
      display: inline-block;
      margin-bottom: 12px;
    }

    .metric-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .metric-details small {
      color: #666;
      font-size: 11px;
    }

    .status-secure {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-medium {
      background-color: #fff8e1;
      color: #f57c00;
    }

    .status-vulnerable {
      background-color: #ffebee;
      color: #c62828;
    }

    .charts-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .chart-card {
      min-height: 350px;
    }

    .chart {
      width: 100%;
      height: 280px;
    }

    .chart-card .mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
    }

    .tests-config-card {
      margin-bottom: 24px;
    }

    .test-panel {
      margin-bottom: 8px;
    }

    .test-details {
      padding: 16px;
    }

    .config-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 13px;
    }

    .expected-results {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .expected {
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      border-left: 3px solid;
    }

    .expected.secure {
      background-color: #e8f5e8;
      border-color: #4CAF50;
      color: #2e7d32;
    }

    .expected.insecure {
      background-color: #ffebee;
      border-color: #f44336;
      color: #c62828;
    }

    .risk-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 8px;
      text-transform: uppercase;
    }

    .risk-critical {
      background-color: #d32f2f;
      color: white;
    }

    .risk-high {
      background-color: #f57c00;
      color: white;
    }

    .risk-medium {
      background-color: #fbc02d;
      color: #333;
    }

    .risk-low {
      background-color: #388e3c;
      color: white;
    }

    .results-container {
      margin-bottom: 24px;
    }

    .results-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .results-card {
      max-height: 600px;
      overflow-y: auto;
    }

    .secure-results {
      border-left: 4px solid #4CAF50;
    }

    .insecure-results {
      border-left: 4px solid #f44336;
    }

    .secure-icon {
      background-color: #4CAF50;
      color: white;
    }

    .insecure-icon {
      background-color: #f44336;
      color: white;
    }

    .result-item {
      border-bottom: 1px solid #eee;
      padding: 12px 0;
    }

    .result-item:last-child {
      border-bottom: none;
    }

    .result-item [matListItemLine] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 4px;
    }

    .status-code {
      font-family: 'Courier New', monospace;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
    }

    .response-time {
      font-size: 11px;
      color: #666;
    }

    .vulnerability-status {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 8px;
      text-transform: uppercase;
    }

    .vulnerability-status.vulnerable {
      background-color: #ffebee;
      color: #c62828;
    }

    .vulnerability-status.secure {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .details {
      font-size: 11px;
      color: #888;
      font-style: italic;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      color: white;
    }

    .loading-overlay p {
      margin-top: 16px;
      font-size: 14px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      margin-top: 48px;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      color: #666;
      margin-bottom: 8px;
    }

    .empty-state p {
      color: #999;
      max-width: 400px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .security-dashboard {
        padding: 8px;
      }
      
      .metrics-row {
        grid-template-columns: 1fr;
      }
      
      .charts-container {
        grid-template-columns: 1fr;
      }
      
      .results-section {
        grid-template-columns: 1fr;
      }
      
      .expected-results {
        grid-template-columns: 1fr;
      }
      
      .chart {
        height: 240px;
      }
    }
  `]
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  Highcharts: typeof Highcharts = Highcharts;
  
  securityScoreChart: any = {};
  vulnerabilityChart: any = {};
  responseTimeChart: any = {};
  riskDistributionChart: any = {};

  loading = false;
  securityTests: SecurityTest[] = [];
  testResults: {secure: ApiTestResult[], insecure: ApiTestResult[]} | null = null;
  securityMetrics: any = null;

  constructor(
    private securityService: SecurityAnalysisService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSecurityTests();
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSecurityTests(): void {
    this.securityTests = this.securityService.getSecurityTests();
  }

  runSecurityAnalysis(): void {
    this.loading = true;
    
    this.snackBar.open('🔍 Ejecutando análisis de seguridad...', 'Cerrar', {
      duration: 3000
    });

    this.securityService.runFullSecurityAnalysis()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.testResults = results;
          this.securityMetrics = this.securityService.calculateSecurityMetrics(results);
          this.updateCharts();
          this.loading = false;
          
          this.snackBar.open('✅ Análisis completado', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error en análisis:', error);
          this.loading = false;
          
          this.snackBar.open('❌ Error en el análisis', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  initializeCharts(): void {
    this.securityScoreChart = {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 280 },
      title: { text: 'Puntuación de Seguridad', style: { fontSize: '16px' } },
      plotOptions: {
        pie: {
          startAngle: -90, endAngle: 90, center: ['50%', '75%'], size: '110%', innerSize: '50%',
          dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.y}%', style: { fontSize: '12px' } }
        }
      },
      series: [{ type: 'pie', name: 'Seguridad', data: [
        { name: 'Seguridad', y: 0, color: '#4ECDC4' },
        { name: 'Vulnerable', y: 100, color: '#e6e6e6' }
      ]}]
    };

    this.vulnerabilityChart = {
      chart: { type: 'column', backgroundColor: 'transparent', height: 280 },
      title: { text: 'Vulnerabilidades', style: { fontSize: '16px' } },
      xAxis: { categories: ['API Segura', 'API Insegura'] },
      yAxis: { min: 0, title: { text: 'Vulnerabilidades' } },
      legend: { enabled: false },
      series: [{ name: 'Vulnerabilidades', data: [
        { y: 0, color: '#4ECDC4' }, { y: 0, color: '#FF6B6B' }
      ]}]
    };
  }

  updateCharts(): void {
    if (!this.testResults || !this.securityMetrics) return;

    const score = this.securityMetrics.secure.score;
    const scoreColor = score >= 80 ? '#4ECDC4' : score >= 60 ? '#FFE66D' : '#FF6B6B';
    
    this.securityScoreChart = {
      ...this.securityScoreChart,
      series: [{ type: 'pie', name: 'Seguridad', data: [
        { name: 'Seguridad', y: score, color: scoreColor },
        { name: 'Vulnerable', y: 100 - score, color: '#e6e6e6' }
      ]}]
    };

    this.vulnerabilityChart = {
      ...this.vulnerabilityChart,
      series: [{ name: 'Vulnerabilidades', data: [
        { y: this.securityMetrics.secure.vulnerabilities, color: '#4ECDC4' },
        { y: this.securityMetrics.insecure.vulnerabilities, color: '#FF6B6B' }
      ]}]
    };
  }

  getRiskDistribution(): Record<string, number> {
    const distribution: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0 };
    this.securityTests.forEach(test => { distribution[test.riskLevel]++; });
    return distribution;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SEGURO': return 'status-secure';
      case 'MEDIO': return 'status-medium';
      case 'VULNERABLE': return 'status-vulnerable';
      default: return 'status-unknown';
    }
  }

  getTestIcon(result: ApiTestResult): string {
    if (result.vulnerability) return 'warning';
    if (result.success) return 'check_circle';
    return 'error';
  }

  getTestColor(result: ApiTestResult): string {
    if (result.vulnerability) return 'warn';
    if (result.success) return 'primary';
    return 'accent';
  }
}