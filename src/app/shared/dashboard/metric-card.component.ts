import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-metric-card', standalone: true, imports: [RouterLink],
  template: `<a class="metric" [routerLink]="route" [queryParams]="queryParams" [attr.aria-describedby]="descriptionId">
    <span class="metric__label">{{ label }}</span><strong>{{ value }}</strong>
    @if (comparison !== undefined) { <span class="metric__comparison">{{ comparison === null ? 'Sin base comparable' : (comparison > 0 ? '+' : '') + comparison + '% vs. periodo anterior' }}</span> }
    <span class="metric__definition" [id]="descriptionId">{{ definition }}</span><span class="metric__action">Ver detalle →</span>
  </a>`,
  styles: [`.metric{display:flex;min-height:11rem;flex-direction:column;padding:1.25rem;border:1px solid var(--color-border);border-radius:var(--radius-card);color:var(--color-text);background:var(--color-surface);box-shadow:var(--shadow-sm);text-decoration:none;transition:transform var(--duration-base) var(--ease-out),box-shadow var(--duration-base) var(--ease-out)}.metric:hover,.metric:focus-visible{transform:translateY(-3px);box-shadow:var(--shadow-card)}.metric__label{color:var(--color-text-muted);font-size:var(--text-sm);font-weight:800}.metric strong{margin:.35rem 0;font-family:var(--font-display);font-size:clamp(2rem,4vw,3.25rem);line-height:1}.metric__comparison{color:var(--color-primary);font-size:var(--text-xs);font-weight:800}.metric__definition{margin-top:.65rem;color:var(--color-text-muted);font-size:var(--text-xs);line-height:1.45}.metric__action{margin-top:auto;padding-top:.75rem;color:var(--color-primary);font-size:var(--text-sm);font-weight:800}`],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricCardComponent {
  private static nextId = 0;
  @Input({ required: true }) label = ''; @Input({ required: true }) value: string | number = 0; @Input({ required: true }) definition = '';
  @Input({ required: true }) route: readonly string[] = ['/']; @Input() queryParams: Record<string, string | number | boolean> = {}; @Input() comparison?: number | null;
  readonly descriptionId = `metric-definition-${MetricCardComponent.nextId++}`;
}
