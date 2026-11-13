import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetricCount } from './dashboard.models';

@Component({
  selector: 'app-dashboard-distribution', standalone: true, imports: [RouterLink, DecimalPipe],
  template: `<section class="distribution-panel">
    <header><p class="eyebrow">Catálogo actual</p><h2>Una mirada a tu colección</h2><p>Títulos activos por formato y género</p></header>
    <div class="collection-grid">
      <section class="formats" aria-label="Distribución por formato">
        <div class="donut-wrap">
          <svg viewBox="0 0 160 160" role="img" [attr.aria-label]="summary">
            <circle class="ring-track" cx="80" cy="80" r="64" />
            @for(item of media; track item.key; let index = $index) {
              <circle class="ring-segment" cx="80" cy="80" r="64" pathLength="100"
                [style.stroke]="color(index)" [attr.stroke-dasharray]="percentage(item.count) + ' ' + (100 - percentage(item.count))"
                [attr.stroke-dashoffset]="-offset(index)" transform="rotate(-90 80 80)" />
            }
          </svg>
          <div class="donut-center" aria-hidden="true"><strong>{{ total }}</strong><span>títulos</span></div>
        </div>
        @if(total === 0){<p class="empty">Todavía no hay títulos activos.</p>}
        <ul class="format-legend">@for(item of media; track item.key; let index = $index){
          <li><a routerLink="/admin/books" [queryParams]="{isActive:true,mediaType:item.key}">
            <span class="swatch" [style.background]="color(index)"></span><span>{{ label(item.key) }}</span>
            <strong>{{ item.count }}</strong><small>{{ percentage(item.count) | number:'1.0-1' }}%</small>
          </a></li>
        }</ul>
      </section>
      <section class="genres" aria-label="Títulos por género"><h3>Géneros principales</h3><p class="note">Un título puede pertenecer a varios géneros.</p>
        @if(genres.length === 0){<p class="empty">No hay géneros para mostrar.</p>}
        <ul>@for(item of genres; track item.key){<li><a routerLink="/admin/books" [queryParams]="{isActive:true,genre:item.key}">
          <span class="bar-label"><span>{{ item.key }}</span><strong>{{ item.count }}</strong></span>
          <span class="bar-track" aria-hidden="true"><span [style.width.%]="genreWidth(item.count)"></span></span>
        </a></li>}</ul>
      </section>
    </div>
  </section>`,
  styleUrl: './dashboard-distribution.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardDistributionComponent {
  @Input() media: readonly MetricCount[] = [];
  @Input() genres: readonly MetricCount[] = [];
  get total(): number { return this.media.reduce((sum, item) => sum + item.count, 0); }
  percentage(count: number): number { return this.total ? count / this.total * 100 : 0; }
  offset(index: number): number { return this.percentage(this.media.slice(0, index).reduce((sum, item) => sum + item.count, 0)); }
  genreWidth(count: number): number { const max = Math.max(0, ...this.genres.map(item => item.count)); return max ? count / max * 100 : 0; }
  label(key: string): string { return ({physical: 'Físicos', digital: 'Digitales'} as Record<string,string>)[key] ?? key; }
  color(index: number): string { return ['var(--color-primary)', 'var(--dashboard-teal, #168477)', 'var(--color-text-muted)'][index % 3]; }
  get summary(): string { return this.total ? this.media.map(item => `${this.label(item.key)}: ${item.count}`).join('. ') : 'Sin títulos activos'; }
}
