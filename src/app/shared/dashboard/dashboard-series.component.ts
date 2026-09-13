import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
export interface DashboardSeriesDatum { date: string; physical: number; digital: number; }
@Component({
  selector: 'app-dashboard-series', standalone: true,
  template: `<section class="series" aria-labelledby="series-title"><header><div><p class="eyebrow">Actividad por día</p><h2 id="series-title">{{ title }}</h2></div><p>{{ periodLabel }} · Unidad: {{ unit }}</p></header>
    <p class="legend"><span class="physical"></span> Físicas <span class="digital"></span> Digitales</p>
    @if (total === 0) { <div class="empty"><strong>Sin actividad real en este periodo</strong><p>No se simulan datos para completar la gráfica.</p></div> }
    @else { <p class="summary">{{ total }} reservas en {{ points.length }} días; la escala parte de cero y alcanza {{ maximum }}.</p><div class="plot" role="img" [attr.aria-label]="'Serie diaria de reservas. ' + total + ' en total; escala desde cero hasta ' + maximum">
      <span class="zero">0</span>@for (point of points; track point.date) { <span class="bars" [attr.title]="point.date + ': ' + point.physical + ' físicas, ' + point.digital + ' digitales'"><i class="physical" [style.height.%]="height(point.physical)"></i><i class="digital" [style.height.%]="height(point.digital)"></i></span> }
    </div><details><summary>Ver tabla de datos</summary><table><thead><tr><th>Fecha local</th><th>Físicas</th><th>Digitales</th></tr></thead><tbody>@for (point of points; track point.date) { <tr><th>{{ point.date }}</th><td>{{ point.physical }}</td><td>{{ point.digital }}</td></tr> }</tbody></table></details> }
  </section>`,
  styles: [`.series{padding:clamp(1rem,3vw,2rem);border:1px solid var(--color-border);border-radius:var(--radius-card);background:var(--color-surface)}header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}h2{margin:.2rem 0;font-family:var(--font-display);font-size:var(--text-xl)}header>p,.summary{color:var(--color-text-muted);font-size:var(--text-sm)}.legend{display:flex;align-items:center;gap:.45rem;font-size:var(--text-sm)}.legend span{width:.75rem;height:.75rem;border-radius:2px}.physical{background:var(--color-primary)}.digital{background:var(--color-accent)}.plot{position:relative;display:flex;height:13rem;align-items:flex-end;gap:clamp(2px,.5vw,7px);padding:1rem .25rem 1.25rem 1.5rem;border-bottom:2px solid var(--color-ink);border-left:2px solid var(--color-ink);overflow:hidden}.zero{position:absolute;bottom:-.15rem;left:.35rem;font:var(--text-xs) var(--font-mono)}.bars{display:flex;flex:1;height:100%;align-items:flex-end;gap:1px}.bars i{display:block;min-width:2px;flex:1;border-radius:3px 3px 0 0}.empty{padding:2rem;text-align:center;background:var(--color-canvas);border-radius:var(--radius-md)}details{margin-top:1rem}table{width:100%;margin-top:.75rem;border-collapse:collapse}th,td{padding:.5rem;border-bottom:1px solid var(--color-border);text-align:left}@media(max-width:600px){header{display:block}.plot{height:10rem}}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardSeriesComponent {
  @Input({ required: true }) title = ''; @Input({ required: true }) periodLabel = ''; @Input() unit = 'reservas'; @Input() points: readonly DashboardSeriesDatum[] = [];
  get total() { return this.points.reduce((sum, point) => sum + point.physical + point.digital, 0); }
  get maximum() { return Math.max(0, ...this.points.flatMap(point => [point.physical, point.digital])); }
  height(value: number) { return this.maximum === 0 ? 0 : value * 100 / this.maximum; }
}
