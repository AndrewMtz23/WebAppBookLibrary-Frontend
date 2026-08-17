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
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';

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
    MatChipsModule,
    MatBadgeModule,
    HighchartsChartModule
  ],
  template: `
    <div class="security-dashboard">
      <!-- ✅ HEADER MEJORADO -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-icon">
            <mat-icon>security</mat-icon>
          </div>
          <div class="hero-text">
            <h1>Security Assessment Dashboard</h1>
            <p>Análisis comparativo de vulnerabilidades entre APIs seguras e inseguras</p>
          </div>
          <div class="hero-actions">
            <button 
              mat-raised-button 
              color="primary" 
              class="scan-button"
              (click)="runSecurityAnalysis()"
              [disabled]="loading">
              <mat-icon>{{ loading ? 'hourglass_empty' : 'scanner' }}</mat-icon>
              {{ loading ? 'Escaneando Seguridad...' : 'Iniciar Escaneo' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ✅ MÉTRICAS PRINCIPALES MEJORADAS -->
      <div class="metrics-section" *ngIf="securityMetrics">
        <div class="metrics-grid">
          <!-- API Segura -->
          <mat-card class="metric-card secure-card">
            <mat-card-header class="metric-header">
              <div class="api-icon secure-icon">
                <mat-icon>verified_user</mat-icon>
              </div>
              <div class="api-title">
                <mat-card-title>API Segura</mat-card-title>
                <mat-card-subtitle>Implementación con controles de seguridad</mat-card-subtitle>
              </div>
              <div class="grade-badge" [class]="'grade-' + securityMetrics.secure.grade.toLowerCase()">
                {{ securityMetrics.secure.grade }}
              </div>
            </mat-card-header>
            
            <mat-card-content class="metric-content">
              <div class="score-display">
                <div class="score-number" [class]="getScoreClass(securityMetrics.secure.score)">
                  {{ securityMetrics.secure.score }}%
                </div>
                <div class="score-status" [class]="getStatusClass(securityMetrics.secure.status)">
                  {{ securityMetrics.secure.status }}
                </div>
              </div>
              
              <div class="metric-stats">
                <div class="stat-item">
                  <mat-icon class="stat-icon success">check_circle</mat-icon>
                  <span class="stat-label">Tests Pasados:</span>
                  <span class="stat-value success">{{ securityMetrics.secure.passedTests }}/{{ securityTests.length }}</span>
                </div>
                <div class="stat-item">
                  <mat-icon class="stat-icon" [class]="securityMetrics.secure.vulnerabilities > 0 ? 'warning' : 'success'">
                    {{ securityMetrics.secure.vulnerabilities > 0 ? 'warning' : 'security' }}
                  </mat-icon>
                  <span class="stat-label">Vulnerabilidades:</span>
                  <span class="stat-value" [class]="securityMetrics.secure.vulnerabilities > 0 ? 'warning' : 'success'">
                    {{ securityMetrics.secure.vulnerabilities }}
                  </span>
                </div>
                <div class="stat-item">
                  <mat-icon class="stat-icon neutral">schedule</mat-icon>
                  <span class="stat-label">Tiempo Promedio:</span>
                  <span class="stat-value neutral">{{ securityMetrics.secure.avgResponseTime | number:'1.0-0' }}ms</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- API Insegura -->
          <mat-card class="metric-card insecure-card">
            <mat-card-header class="metric-header">
              <div class="api-icon insecure-icon">
                <mat-icon>gpp_bad</mat-icon>
              </div>
              <div class="api-title">
                <mat-card-title>API Insegura</mat-card-title>
                <mat-card-subtitle>Sin controles de seguridad (demostración)</mat-card-subtitle>
              </div>
              <div class="grade-badge" [class]="'grade-' + securityMetrics.insecure.grade.toLowerCase()">
                {{ securityMetrics.insecure.grade }}
              </div>
            </mat-card-header>
            
            <mat-card-content class="metric-content">
              <div class="score-display">
                <div class="score-number" [class]="getScoreClass(securityMetrics.insecure.score)">
                  {{ securityMetrics.insecure.score }}%
                </div>
                <div class="score-status" [class]="getStatusClass(securityMetrics.insecure.status)">
                  {{ securityMetrics.insecure.status }}
                </div>
              </div>
              
              <div class="metric-stats">
                <div class="stat-item">
                  <mat-icon class="stat-icon" [class]="securityMetrics.insecure.passedTests > 0 ? 'success' : 'error'">
                    {{ securityMetrics.insecure.passedTests > 0 ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                  <span class="stat-label">Tests Pasados:</span>
                  <span class="stat-value" [class]="securityMetrics.insecure.passedTests > 0 ? 'success' : 'error'">
                    {{ securityMetrics.insecure.passedTests }}/{{ securityTests.length }}
                  </span>
                </div>
                <div class="stat-item">
                  <mat-icon class="stat-icon error">dangerous</mat-icon>
                  <span class="stat-label">Vulnerabilidades:</span>
                  <span class="stat-value error">{{ securityMetrics.insecure.vulnerabilities }}</span>
                </div>
                <div class="stat-item">
                  <mat-icon class="stat-icon neutral">schedule</mat-icon>
                  <span class="stat-label">Tiempo Promedio:</span>
                  <span class="stat-value neutral">{{ securityMetrics.insecure.avgResponseTime | number:'1.0-0' }}ms</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- ✅ RESUMEN COMPARATIVO -->
        <mat-card class="comparison-card" *ngIf="securityMetrics.comparison">
          <mat-card-header>
            <mat-icon mat-card-avatar class="comparison-icon">compare</mat-icon>
            <mat-card-title>Análisis Comparativo</mat-card-title>
            <mat-card-subtitle>{{ securityMetrics.comparison.summary }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="comparison-content">
              <div class="recommendation">
                <mat-icon class="rec-icon">lightbulb</mat-icon>
                <span>{{ securityMetrics.comparison.recommendation }}</span>
              </div>
              <div class="advantage-meter" *ngIf="securityMetrics.comparison.secureApiAdvantage > 0">
                <span class="advantage-label">Ventaja de Seguridad:</span>
                <span class="advantage-value">+{{ securityMetrics.comparison.secureApiAdvantage }}%</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- ✅ GRÁFICAS MEJORADAS -->
      <div class="charts-section" *ngIf="securityMetrics">
        <div class="charts-grid">
          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="chart-icon">donut_large</mat-icon>
              <mat-card-title>Distribución de Seguridad</mat-card-title>
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
              <mat-icon mat-card-avatar class="chart-icon">bar_chart</mat-icon>
              <mat-card-title>Vulnerabilidades por API</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <highcharts-chart
                [Highcharts]="Highcharts"
                [options]="vulnerabilityChart"
                class="chart chart-vulnerability"> 
              </highcharts-chart>
            </mat-card-content>
          </mat-card>

          <mat-card class="chart-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="chart-icon">pie_chart</mat-icon>
              <mat-card-title>Distribución de Riesgos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <highcharts-chart
                [Highcharts]="Highcharts"
                [options]="riskDistributionChart"
                class="chart">
              </highcharts-chart>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- ✅ RESULTADOS DETALLADOS MEJORADOS -->
      <div class="results-section" *ngIf="testResults">
        <div class="results-grid">
          <!-- API Segura Results -->
          <mat-card class="results-card secure-results">
            <mat-card-header>
              <mat-icon mat-card-avatar class="results-icon secure">verified_user</mat-icon>
              <mat-card-title>Resultados API Segura</mat-card-title>
              <mat-card-subtitle>
                {{ testResults.secure.length }} pruebas ejecutadas
                <mat-chip-set class="status-chips">
                  <mat-chip class="passed-chip">{{ securityMetrics.secure.passedTests }} Pasadas</mat-chip>
                  <mat-chip class="failed-chip" *ngIf="securityMetrics.secure.vulnerabilities > 0">
                    {{ securityMetrics.secure.vulnerabilities }} Fallidas
                  </mat-chip>
                </mat-chip-set>
              </mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content class="results-content">
              <div class="result-item" *ngFor="let result of testResults.secure">
                <div class="result-header">
                  <mat-icon class="result-icon" [class]="getResultIconClass(result)">
                    {{ getTestIcon(result) }}
                  </mat-icon>
                  <div class="result-info">
                    <div class="result-title">{{ result.test }}</div>
                    <div class="result-metadata">
                      <span class="status-code" [class]="getStatusCodeClass(result.statusCode)">
                        {{ result.statusCode }}
                      </span>
                      <span class="response-time">{{ result.responseTime }}ms</span>
                      <mat-chip class="severity-chip" [class]="'severity-' + result.severity">
                        {{ result.vulnerability ? 'VULNERABLE' : 'SEGURO' }}
                      </mat-chip>
                    </div>
                  </div>
                </div>
                <div class="result-details">
                  {{ result.details }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- API Insegura Results -->
          <mat-card class="results-card insecure-results">
            <mat-card-header>
              <mat-icon mat-card-avatar class="results-icon insecure">gpp_bad</mat-icon>
              <mat-card-title>Resultados API Insegura</mat-card-title>
              <mat-card-subtitle>
                {{ testResults.insecure.length }} pruebas ejecutadas
                <mat-chip-set class="status-chips">
                  <mat-chip class="passed-chip" *ngIf="securityMetrics.insecure.passedTests > 0">
                    {{ securityMetrics.insecure.passedTests }} Pasadas
                  </mat-chip>
                  <mat-chip class="failed-chip">{{ securityMetrics.insecure.vulnerabilities }} Vulnerables</mat-chip>
                </mat-chip-set>
              </mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content class="results-content">
              <div class="result-item" *ngFor="let result of testResults.insecure">
                <div class="result-header">
                  <mat-icon class="result-icon" [class]="getResultIconClass(result)">
                    {{ getTestIcon(result) }}
                  </mat-icon>
                  <div class="result-info">
                    <div class="result-title">{{ result.test }}</div>
                    <div class="result-metadata">
                      <span class="status-code" [class]="getStatusCodeClass(result.statusCode)">
                        {{ result.statusCode }}
                      </span>
                      <span class="response-time">{{ result.responseTime }}ms</span>
                      <mat-chip class="severity-chip" [class]="'severity-' + result.severity">
                        {{ result.vulnerability ? 'VULNERABLE' : 'SEGURO' }}
                      </mat-chip>
                    </div>
                  </div>
                </div>
                <div class="result-details">
                  {{ result.details }}
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- ✅ LOADING OVERLAY MEJORADO -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="loading-content">
          <mat-spinner diameter="80" color="primary"></mat-spinner>
          <h3>Ejecutando Escaneo de Seguridad</h3>
          <p>Analizando vulnerabilidades en ambas APIs...</p>
          <div class="loading-progress">
            <mat-icon>scanner</mat-icon>
            <span>Procesando pruebas de penetración</span>
          </div>
        </div>
      </div>

      <!-- ✅ ESTADO INICIAL MEJORADO -->
      <div class="empty-state" *ngIf="!testResults && !loading">
        <div class="empty-content">
          <mat-icon class="empty-icon">security</mat-icon>
          <h3>Análisis de Seguridad Listo</h3>
          <p>Ejecuta un escaneo completo para comparar la seguridad entre las APIs implementadas.</p>
          <div class="empty-features">
            <div class="feature-item">
              <mat-icon>verified_user</mat-icon>
              <span>Análisis de Autenticación</span>
            </div>
            <div class="feature-item">
              <mat-icon>bug_report</mat-icon>
              <span>Detección de Vulnerabilidades</span>
            </div>
            <div class="feature-item">
              <mat-icon>assessment</mat-icon>
              <span>Métricas Comparativas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .security-dashboard {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }

    /* ✅ HERO SECTION */
    .hero-section {
      margin-bottom: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      padding: 48px;
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .hero-content {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .chart-vulnerability {
    height: 400px; /* Ajusta este valor según necesites */
    }

    .hero-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      padding: 16px;
      backdrop-filter: blur(10px);
    }

    .hero-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .hero-text {
      flex: 1;
    }

    .hero-text h1 {
      font-size: 2.5rem;
      font-weight: 300;
      margin: 0 0 8px 0;
    }

    .hero-text p {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .scan-button {
      font-size: 16px !important;
      padding: 12px 32px !important;
      border-radius: 25px !important;
      font-weight: 500 !important;
    }

    /* ✅ METRICS SECTION */
    .metrics-section {
      margin-bottom: 32px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .metric-card {
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }

    .secure-card {
      border-top: 4px solid #4CAF50;
      background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
    }

    .insecure-card {
      border-top: 4px solid #f44336;
      background: linear-gradient(135deg, #ffffff 0%, #fff8f8 100%);
    }

    .metric-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 16px 24px;
    }

    .api-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .secure-icon {
      background: linear-gradient(135deg, #4CAF50, #66BB6A);
      color: white;
    }

    .insecure-icon {
      background: linear-gradient(135deg, #f44336, #ef5350);
      color: white;
    }

    .api-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .api-title {
      flex: 1;
    }

    .grade-badge {
      padding: 8px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }

    .grade-a\+ {
      background: #4CAF50;
      color: white;
    }

    .grade-a {
      background: #8BC34A;
      color: white;
    }

    .grade-b {
      background: #FFC107;
      color: #333;
    }

    .grade-c {
      background: #FF9800;
      color: white;
    }

    .grade-f {
      background: #f44336;
      color: white;
    }

    .metric-content {
      padding: 0 24px 24px 24px;
    }

    .score-display {
      text-align: center;
      margin-bottom: 24px;
    }

    .score-number {
      font-size: 3rem;
      font-weight: 300;
      line-height: 1;
      margin-bottom: 8px;
    }

    .score-number.excellent {
      color: #4CAF50;
    }

    .score-number.good {
      color: #8BC34A;
    }

    .score-number.warning {
      color: #FF9800;
    }

    .score-number.danger {
      color: #f44336;
    }

    .score-status {
      font-size: 14px;
      font-weight: 600;
      padding: 6px 16px;
      border-radius: 20px;
      display: inline-block;
    }

    .status-excelente {
      background: #E8F5E8;
      color: #2E7D32;
    }

    .status-bueno {
      background: #F1F8E9;
      color: #558B2F;
    }

    .status-regular {
      background: #FFF8E1;
      color: #F57C00;
    }

    .status-malo {
      background: #FFE0B2;
      color: #E65100;
    }

    .status-crítico {
      background: #FFEBEE;
      color: #C62828;
    }

    .metric-stats {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .stat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stat-icon.success {
      color: #4CAF50;
    }

    .stat-icon.warning {
      color: #FF9800;
    }

    .stat-icon.error {
      color: #f44336;
    }

    .stat-icon.neutral {
      color: #666;
    }

    .stat-label {
      font-weight: 500;
      color: #666;
    }

    .stat-value {
      margin-left: auto;
      font-weight: 600;
    }

    .stat-value.success {
      color: #4CAF50;
    }

    .stat-value.warning {
      color: #FF9800;
    }

    .stat-value.error {
      color: #f44336;
    }

    .stat-value.neutral {
      color: #666;
    }

    /* ✅ COMPARISON CARD */
    .comparison-card {
      border-radius: 16px;
      background: linear-gradient(135deg, #fff 0%, #f8f9ff 100%);
      border-left: 4px solid #2196F3;
    }

    .comparison-icon {
      background: linear-gradient(135deg, #2196F3, #42A5F5);
      color: white;
    }

    .comparison-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .recommendation {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #F3F4F6;
      border-radius: 12px;
      border-left: 4px solid #2196F3;
    }

    .rec-icon {
      color: #2196F3;
      font-size: 24px;
    }

    .advantage-meter {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #E8F5E8;
      border-radius: 8px;
    }

    .advantage-value {
      font-weight: 600;
      color: #4CAF50;
      font-size: 1.2rem;
    }

    /* ✅ CHARTS SECTION */
    .charts-section {
      margin-bottom: 32px;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 24px;
    }

    .chart-card {
      border-radius: 16px;
      background: white;
      transition: transform 0.3s ease;
    }

    .chart-card:hover {
      transform: translateY(-2px);
    }

    .chart-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }

    .chart {
      width: 100%;
      height: 300px;
    }

    /* ✅ RESULTS SECTION */
    .results-section {
      margin-bottom: 32px;
    }

    .results-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .results-card {
      border-radius: 16px;
      max-height: 600px;
      overflow-y: auto;
    }

    .secure-results {
      border-left: 4px solid #4CAF50;
    }

    .insecure-results {
      border-left: 4px solid #f44336;
    }

    .results-icon.secure {
      background: #4CAF50;
      color: white;
    }

    .results-icon.insecure {
      background: #f44336;
      color: white;
    }

    .status-chips {
      margin-top: 8px;
    }

    .passed-chip {
      background: #E8F5E8;
      color: #2E7D32;
    }

    .failed-chip {
      background: #FFEBEE;
      color: #C62828;
    }

    .results-content {
      padding: 16px;
    }

    .result-item {
      margin-bottom: 16px;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      background: #fafafa;
    }

    .result-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .result-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .result-icon.success {
      color: #4CAF50;
    }

    .result-icon.warning {
      color: #FF9800;
    }

    .result-icon.error {
      color: #f44336;
    }

    .result-info {
      flex: 1;
    }

    .result-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .result-metadata {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status-code {
      font-family: 'Courier New', monospace;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-code.success {
      background: #E8F5E8;
      color: #2E7D32;
    }

    .status-code.error {
      background: #FFEBEE;
      color: #C62828;
    }

    .status-code.info {
      background: #E3F2FD;
      color: #1565C0;
    }

    .response-time {
      font-size: 11px;
      color: #666;
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .severity-chip {
      font-size: 10px !important;
      height: 20px !important;
      padding: 0 8px !important;
    }

    .severity-critical {
      background: #f44336 !important;
      color: white !important;
    }

    .severity-high {
      background: #FF9800 !important;
      color: white !important;
    }

    .severity-medium {
      background: #FFC107 !important;
      color: #333 !important;
    }

    .severity-low {
      background: #4CAF50 !important;
      color: white !important;
    }

    .result-details {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
      background: white;
      padding: 8px 12px;
      border-radius: 6px;
      border-left: 3px solid #ddd;
    }

    /* ✅ LOADING OVERLAY */
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .loading-content {
      text-align: center;
      color: white;
      background: rgba(255, 255, 255, 0.1);
      padding: 48px;
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }

    .loading-content h3 {
      margin: 24px 0 8px 0;
      font-weight: 300;
    }

    .loading-content p {
      margin: 0 0 24px 0;
      opacity: 0.8;
    }

    .loading-progress {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0.7;
    }

    /* ✅ EMPTY STATE */
    .empty-state {
      text-align: center;
      padding: 80px 24px;
      background: white;
      border-radius: 16px;
      margin-top: 32px;
    }

    .empty-content {
      max-width: 500px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #667eea;
      margin-bottom: 24px;
    }

    .chart-card:nth-child(2) .chart {  /* Selecciona específicamente la segunda gráfica */
      height: 350px !important;        /* Ajusta el valor (ej: 350px para más altura) */
    }

    .empty-content h3 {
      color: #333;
      margin-bottom: 16px;
      font-weight: 300;
    }

    .empty-content p {
      color: #666;
      margin-bottom: 32px;
      line-height: 1.6;
    }

    .empty-features {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 32px;
    }

    .feature-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      opacity: 0.7;
    }

    .feature-item mat-icon {
      color: #667eea;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .feature-item span {
      font-size: 12px;
      color: #666;
    }

    /* ✅ RESPONSIVE */
    @media (max-width: 768px) {
      .security-dashboard {
        padding: 16px;
      }

      .hero-content {
        flex-direction: column;
        text-align: center;
        gap: 16px;
      }

      .hero-text h1 {
        font-size: 2rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .results-grid {
        grid-template-columns: 1fr;
      }

      .empty-features {
        flex-direction: column;
        gap: 16px;
      }
    }
  `]
})
export class SecurityDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  Highcharts: typeof Highcharts = Highcharts;
  
  securityScoreChart: any = {};
  vulnerabilityChart: any = {};
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
    
    this.snackBar.open('🔍 Iniciando escaneo de seguridad...', 'Cerrar', {
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
          
          this.snackBar.open('✅ Escaneo completado exitosamente', 'Cerrar', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error en análisis:', error);
          this.loading = false;
          
          this.snackBar.open('❌ Error durante el escaneo', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }

  initializeCharts(): void {
    this.securityScoreChart = {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 300, width: 450 },
      title: { text: '', style: { fontSize: '16px' } },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f}%' },
          showInLegend: true
        }
      },
      series: [{ type: 'pie', name: 'APIs', data: [] }]
    };

    this.vulnerabilityChart = {
      chart: { type: 'column', backgroundColor: 'transparent', height: 350, width: 450 },
      title: { text: '', style: { fontSize: '16px' } },
      xAxis: { categories: ['API Segura', 'API Insegura'] },
      yAxis: { min: 0, title: { text: 'Vulnerabilidades' } },
      legend: { enabled: false },
      plotOptions: {
        column: {
          dataLabels: { enabled: true },
          borderRadius: 4
        }
      },
      series: [{ name: 'Vulnerabilidades', data: [] }]
    };

    this.riskDistributionChart = {
      chart: { type: 'pie', backgroundColor: 'transparent', height: 300, width: 450 },
      title: { text: '', style: { fontSize: '16px' } },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f}%' },
          showInLegend: true
        }
      },
      series: [{ type: 'pie', name: 'Tests', data: [] }]
    };
  }

  updateCharts(): void {
    if (!this.testResults || !this.securityMetrics) return;

    // Security Score Comparison
    this.securityScoreChart = {
      ...this.securityScoreChart,
      series: [{ type: 'pie', name: 'APIs', data: [
        { name: 'API Segura', y: this.securityMetrics.secure.score, color: '#4CAF50' },
        { name: 'API Insegura', y: this.securityMetrics.insecure.score, color: '#f44336' }
      ]}]
    };

    // Vulnerabilities
    this.vulnerabilityChart = {
      ...this.vulnerabilityChart,
      series: [{ name: 'Vulnerabilidades', data: [
        { y: this.securityMetrics.secure.vulnerabilities, color: '#4CAF50' },
        { y: this.securityMetrics.insecure.vulnerabilities, color: '#f44336' }
      ]}]
    };

    // Risk Distribution
    const riskCounts = this.getRiskDistribution();
    this.riskDistributionChart = {
      ...this.riskDistributionChart,
      series: [{ type: 'pie', name: 'Tests', data: [
        { name: 'Crítico', y: riskCounts['CRITICAL'], color: '#f44336' },
        { name: 'Alto', y: riskCounts['HIGH'], color: '#FF9800' },
        { name: 'Medio', y: riskCounts['MEDIUM'], color: '#FFC107' },
        { name: 'Bajo', y: riskCounts['LOW'], color: '#4CAF50' }
      ]}]
    };
  }

  getRiskDistribution(): Record<string, number> {
    const distribution: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 0, 'MEDIUM': 0, 'LOW': 0 };
    this.securityTests.forEach(test => { distribution[test.riskLevel]++; });
    return distribution;
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'EXCELENTE': return 'status-excelente';
      case 'BUENO': return 'status-bueno';
      case 'REGULAR': return 'status-regular';
      case 'MALO': return 'status-malo';
      case 'CRÍTICO': return 'status-crítico';
      default: return 'status-regular';
    }
  }

  getStatusCodeClass(statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 400 && statusCode < 500) return 'error';
    if (statusCode >= 500) return 'error';
    return 'info';
  }

  getResultIconClass(result: ApiTestResult): string {
    if (result.vulnerability) return 'error';
    if (result.success && !result.vulnerability) return 'success';
    return 'warning';
  }

  getTestIcon(result: ApiTestResult): string {
    if (result.vulnerability) return 'dangerous';
    if (result.success && !result.vulnerability) return 'verified_user';
    return 'warning';
  }
}