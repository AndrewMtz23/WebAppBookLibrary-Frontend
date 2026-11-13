import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface BreakdownDatum { label: string; value: number; }

@Component({
  selector: 'app-dashboard-breakdown', standalone: true,
  template: `<section class="breakdown">
    <header><p class="eyebrow">{{ eyebrow }}</p><h2>{{ title }}</h2><p class="description">{{ description }}</p></header>
    @if(stacked && total > 0){
      <div class="stack" aria-hidden="true">@for(item of items;track item.label;let index=$index){<span [style.width.%]="share(item.value)" [style.background]="color(index)"></span>}</div>
    }
    <dl [class.horizontal]="!stacked">@for(item of items;track item.label;let index=$index){
      <div class="row"><dt><span class="swatch" [style.background]="color(index)" aria-hidden="true"></span>{{ item.label }}</dt><dd>{{ item.value }}</dd>
        @if(!stacked){<div class="track" aria-hidden="true"><span [style.width.%]="width(item.value)" [style.background]="color(index)"></span></div>}
      </div>
    }</dl>
    @if(total === 0){<p class="empty">{{ emptyText }}</p>}
    @if(!stacked && total > 0){<p class="scale">Escala desde 0 hasta {{ maximum }} · {{ unit }}</p>}
  </section>`,
  styles: [`
    :host{display:block;min-width:0}.breakdown{box-sizing:border-box;height:100%;padding:1.5rem;border:1px solid var(--color-border);border-radius:var(--radius-card);background:var(--color-surface)}
    .eyebrow{margin:0;color:var(--color-primary);font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase}h2{margin:.5rem 0;font:700 1.15rem var(--font-display)}
    .description,.empty,.scale{font-size:.8rem;line-height:1.5;color:var(--color-text-muted)}.description{margin:0 0 1.25rem}.scale{margin:1rem 0 0;font-size:.7rem}
    .stack{display:flex;height:1rem;border-radius:6px;overflow:hidden;background:var(--color-canvas);margin:1.5rem 0}.stack span{display:block;height:100%}
    dl{margin:0}.row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.5rem 1rem;margin-top:1rem}dt{display:flex;align-items:center;gap:.5rem;font-size:.85rem;overflow-wrap:anywhere}dd{margin:0;font-weight:800;font-variant-numeric:tabular-nums}.swatch{width:.55rem;height:.55rem;flex-shrink:0;border-radius:2px}
    .track{grid-column:1/-1;height:.65rem;background:var(--color-canvas);border-radius:4px;overflow:hidden}.track span{display:block;height:100%;border-radius:inherit}
    .empty{padding:.75rem;margin:1rem 0 0;background:var(--color-canvas);border-radius:8px;text-align:center}
  `], changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardBreakdownComponent {
  @Input() eyebrow = 'Estado actual';
  @Input({required:true}) title = '';
  @Input() description = '';
  @Input() unit = 'registros';
  @Input() emptyText = 'No hay registros para mostrar.';
  @Input() stacked = false;
  @Input() items: readonly BreakdownDatum[] = [];
  get total(): number { return this.items.reduce((sum, item) => sum + item.value, 0); }
  get maximum(): number { return Math.max(0, ...this.items.map(item => item.value)); }
  share(value:number):number { return this.total ? value / this.total * 100 : 0; }
  width(value:number):number { return this.maximum ? value / this.maximum * 100 : 0; }
  color(index:number):string { return ['var(--color-primary)','var(--dashboard-teal, #168477)','var(--color-text-muted)','var(--color-primary)'][index % 4]; }
}
