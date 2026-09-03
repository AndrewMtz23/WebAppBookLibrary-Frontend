import { HttpBackend, HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';

export type ProbeStatus = 'passed' | 'failed' | 'inconclusive' | 'unavailable';

export interface SecurityProbe {
  name: string;
  endpoint: string;
  expectedStatus: number;
}

export interface SecurityProbeResult extends SecurityProbe {
  actualStatus: number | null;
  durationMs: number;
  checkedAt: string;
  status: ProbeStatus;
  explanation: string;
}

export interface SecuritySummary {
  score: number | null;
  passed: number;
  failed: number;
  inconclusive: number;
  unavailable: number;
  conclusive: number;
}

@Injectable({ providedIn: 'root' })
export class SecurityAnalysisService {
  private readonly anonymousHttp: HttpClient;
  private readonly probes: SecurityProbe[] = [
    { name: 'Estado de la API', endpoint: '/api/health', expectedStatus: 200 },
    { name: 'Catálogo protegido', endpoint: '/api/books', expectedStatus: 401 },
    { name: 'Préstamos protegidos', endpoint: '/api/loans', expectedStatus: 401 },
    { name: 'Auditoría protegida', endpoint: '/api/log/recent', expectedStatus: 401 },
    { name: 'Usuarios no expuestos', endpoint: '/api/users', expectedStatus: 404 }
  ];

  constructor(handler: HttpBackend) {
    this.anonymousHttp = new HttpClient(handler);
  }

  runSecurityAnalysis(): Observable<SecurityProbeResult[]> {
    return forkJoin(this.probes.map(probe => this.runProbe(probe)));
  }

  classify(probe: SecurityProbe, actualStatus: number, durationMs: number): SecurityProbeResult {
    let status: ProbeStatus;
    if (actualStatus === 0) status = 'unavailable';
    else if (actualStatus === probe.expectedStatus) status = 'passed';
    else if (actualStatus > 0 && actualStatus < 500) status = 'failed';
    else status = 'inconclusive';

    const explanation = status === 'passed'
      ? `Respuesta esperada observada: HTTP ${actualStatus}.`
      : status === 'failed'
        ? `Se esperaba HTTP ${probe.expectedStatus}, pero se observó HTTP ${actualStatus}.`
        : status === 'unavailable'
          ? 'No fue posible conectar con la API.'
          : `HTTP ${actualStatus} no permite confirmar este control.`;

    return {
      ...probe,
      actualStatus: actualStatus || null,
      durationMs,
      checkedAt: new Date().toISOString(),
      status,
      explanation
    };
  }

  calculateSummary(results: SecurityProbeResult[]): SecuritySummary {
    const count = (status: ProbeStatus) => results.filter(result => result.status === status).length;
    const passed = count('passed');
    const failed = count('failed');
    const conclusive = passed + failed;
    return {
      score: conclusive === 0 ? null : Math.round((passed / conclusive) * 100),
      passed,
      failed,
      inconclusive: count('inconclusive'),
      unavailable: count('unavailable'),
      conclusive
    };
  }

  private runProbe(probe: SecurityProbe): Observable<SecurityProbeResult> {
    const startedAt = performance.now();
    return this.anonymousHttp.get(probe.endpoint, { observe: 'response' }).pipe(
      map((response: HttpResponse<unknown>) => this.classify(probe, response.status, Math.round(performance.now() - startedAt))),
      catchError((error: HttpErrorResponse) => of(this.classify(probe, error.status, Math.round(performance.now() - startedAt))))
    );
  }
}
