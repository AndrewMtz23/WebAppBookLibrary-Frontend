import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import type QrScanner from 'qr-scanner';
import { parseCopyInput } from './copy-code';
@Component({ selector: 'app-copy-scanner', standalone: true, template: `<button type="button" [disabled]="active()" (click)="start()">Escanear con cámara</button>@if (active()) { <button type="button" (click)="stop()">Cerrar cámara</button> }<video #video [hidden]="!active()" muted playsinline aria-label="Vista de la cámara para leer una etiqueta"></video><p role="status">{{ message() }}</p>`, styles: [`:host{display:block;margin-top:1rem}video{display:block;width:100%;max-width:400px;max-height:300px;margin-block:1rem}video[hidden]{display:none}button{min-height:44px;padding:.6rem 1rem;margin-right:.5rem;font:inherit;cursor:pointer;color:var(--color-text);background:var(--color-surface);border:1px solid var(--color-border);border-radius:8px}`] })
export class CopyScannerComponent implements OnDestroy {
  @ViewChild('video', { static: true }) video!: ElementRef<HTMLVideoElement>;
  @Output() readonly decoded = new EventEmitter<string>(); readonly active = signal(false); readonly message = signal('');
  private scanner?: QrScanner; private generation = 0; private destroyed = false; private starting = false;
  async start() {
    if (this.active() || this.destroyed || this.starting) return; this.starting = true; const generation = ++this.generation; this.active.set(true); this.message.set('Apunta al QR de la etiqueta.');
    let scanner: QrScanner | undefined;
    try {
      const { default: Scanner } = await import('qr-scanner');
      if (this.destroyed || generation !== this.generation) return;
      scanner = new Scanner(this.video.nativeElement, result => {
        if (this.destroyed || generation !== this.generation) return;
        if (!parseCopyInput(result.data, window.location.origin)) { this.message.set('Esta etiqueta no pertenece a la biblioteca. Puedes escribir el código.'); return; }
        this.stop(); this.decoded.emit(result.data);
      }, { returnDetailedScanResult: true, preferredCamera: 'environment', maxScansPerSecond: 5 });
      this.scanner = scanner; await scanner.start();
    } catch { if (!this.destroyed && generation === this.generation) { this.stop(); this.message.set('No pudimos abrir la cámara. Puedes escribir o pegar el código.'); } }
    finally { if (this.destroyed || generation !== this.generation) { scanner?.destroy(); this.closeTracks(); } this.starting = false; }
  }
  stop() { ++this.generation; this.scanner?.destroy(); this.scanner = undefined; this.closeTracks(); this.active.set(false); }
  private closeTracks() { const video = this.video?.nativeElement; const stream = video?.srcObject; if (stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop()); if (video) video.srcObject = null; }
  ngOnDestroy() { this.destroyed = true; this.stop(); }
}
