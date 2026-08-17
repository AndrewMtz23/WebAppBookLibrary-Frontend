import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AppConfig {
  apiUrl: string;
  environment: string;
  debug: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Load configuration from public/config.json
   * Falls back to environment.ts if file not found
   */
  loadConfig(): Observable<AppConfig> {
    if (this.config) {
      return of(this.config);
    }

    return this.http.get<AppConfig>('/config.json').pipe(
      tap(config => {
        this.config = config;
        console.log('Configuration loaded from config.json:', config);
      }),
      catchError(() => {
        // Fallback to environment configuration
        this.config = {
          apiUrl: environment.apiUrl,
          environment: environment.production ? 'production' : 'development',
          debug: environment.debug
        };
        console.log('Using environment configuration as fallback:', this.config);
        return of(this.config);
      })
    );
  }

  /**
   * Get the current configuration
   */
  getConfig(): AppConfig {
    if (!this.config) {
      return {
        apiUrl: environment.apiUrl,
        environment: environment.production ? 'production' : 'development',
        debug: environment.debug
      };
    }
    return this.config;
  }

  /**
   * Get API URL
   */
  getApiUrl(): string {
    return this.getConfig().apiUrl;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.getConfig().debug;
  }

  /**
   * Get current environment
   */
  getEnvironment(): string {
    return this.getConfig().environment;
  }
}
