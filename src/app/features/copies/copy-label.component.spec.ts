import { TestBed } from '@angular/core/testing';
import { CopyLabelComponent } from './copy-label.component';
describe('CopyLabelComponent', () => {
  it('renders a decodable local QR without private assignment data', async () => {
    const fixture = TestBed.createComponent(CopyLabelComponent);
    fixture.componentRef.setInput('copyId', '0123456789abcdef01234567'); fixture.componentRef.setInput('code', 'CP-001'); fixture.componentRef.setInput('title', 'A book');
    fixture.detectChanges(); await fixture.whenStable();
    await fixture.componentInstance.render();
    expect(fixture.componentInstance.error()).toBe('');
    expect(fixture.componentInstance.ready()).toBeTrue();
    const { default: QrScanner } = await import('qr-scanner');
    const result = await QrScanner.scanImage(fixture.nativeElement.querySelector('canvas'), { returnDetailedScanResult: true });
    expect(result.data).toBe(window.location.origin + '/librarian/copies/0123456789abcdef01234567');
    fixture.destroy();
  });
});
