import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SecurityAnalysisService, SecurityProbeResult, SecuritySummary } from './security-analysis.service';

@Component({
  selector: 'app-security-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './security-dashboard.component.html',
  styleUrls: ['./security-dashboard.component.css']
})
export class SecurityDashboardComponent {
  loading = false;
  results: SecurityProbeResult[] = [];
  summary: SecuritySummary | null = null;
  lastRun: string | null = null;

  constructor(private readonly analysis: SecurityAnalysisService) {}

  run(): void {
    this.loading = true;
    this.analysis.runSecurityAnalysis().subscribe({
      next: results => {
        this.results = results;
        this.summary = this.analysis.calculateSummary(results);
        this.lastRun = new Date().toISOString();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  statusLabel(status: SecurityProbeResult['status']): string {
    return ({ passed: 'Correcto', failed: 'Fallido', inconclusive: 'Inconcluso', unavailable: 'No disponible' })[status];
  }
}
