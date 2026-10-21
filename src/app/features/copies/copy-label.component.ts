import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild, signal } from '@angular/core';
import { copyUrl } from './copy-code';
@Component({ selector: 'app-copy-label', standalone: true, template: `<section class="label"><h3>{{ title }}</h3><canvas #canvas aria-label="Código QR del ejemplar" role="img"></canvas><strong>{{ code }}</strong></section>@if (error()) { <p role="alert">{{ error() }}</p> }<button type="button" [disabled]="!ready()" (click)="print()">Imprimir etiqueta</button>`, styles: [`.label{background:#fff;color:#111;display:grid;justify-items:center;padding:1rem;width:240px;max-width:100%;box-sizing:border-box;border:1px solid #ddd}.label h3{color:#111;font:600 14px sans-serif;text-align:center;margin:0;overflow-wrap:anywhere}.label strong{font:700 14px monospace;overflow-wrap:anywhere}canvas{width:200px;height:200px;max-width:100%}button{margin-top:.8rem;min-height:44px;padding:.6rem 1rem;font:inherit;cursor:pointer;color:var(--color-text);background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px}@media print{button{display:none}}`] })
export class CopyLabelComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() copyId = ''; @Input() code = ''; @Input() title = '';
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  readonly error = signal(''); readonly ready = signal(false); private destroyed = false; private generation = 0;
  private readonly afterPrint = () => document.body.classList.remove('printing-copy-label');
  ngAfterViewInit() { void this.render(); window.addEventListener('afterprint', this.afterPrint); }
  ngOnChanges() { if (this.canvas) void this.render(); }
  async render() { const generation = ++this.generation; this.ready.set(false); if (!this.canvas || !this.copyId) return;
    try { const { default: qr } = await import('qrcode'); if (this.destroyed || generation !== this.generation) return; await qr.toCanvas(this.canvas.nativeElement, copyUrl(this.copyId, window.location.origin), { width: 200, margin: 4, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } }); if (!this.destroyed && generation === this.generation) this.ready.set(true); }
    catch { this.error.set('No pudimos generar la etiqueta. Puedes usar el código escrito.'); }
  }
  print() { if (!this.ready()) return; document.body.classList.add('printing-copy-label'); window.print(); }
  ngOnDestroy() { this.destroyed = true; ++this.generation; this.afterPrint(); window.removeEventListener('afterprint', this.afterPrint); }
}
