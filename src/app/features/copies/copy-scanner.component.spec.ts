import { TestBed } from '@angular/core/testing';
import { CopyScannerComponent } from './copy-scanner.component';
describe('CopyScannerComponent', () => {
  it('waits for an outstanding camera request before restarting and closes a late stream', async () => {
    const { default: QrScanner } = await import('qr-scanner');
    const finishes: (() => void)[] = [];
    const start = spyOn(QrScanner.prototype, 'start').and.callFake(() => new Promise<void>(resolve => { finishes.push(resolve); }));
    const fixture = TestBed.createComponent(CopyScannerComponent); fixture.detectChanges();
    const pending = fixture.componentInstance.start();
    for (let attempt = 0; attempt < 100 && !finishes.length; attempt++) await new Promise(resolve => setTimeout(resolve, 5));
    expect(finishes.length).toBe(1);
    fixture.componentInstance.stop();
    const restart = fixture.componentInstance.start();
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(start).toHaveBeenCalledTimes(1);
    const stream = new MediaStream(); const stop = jasmine.createSpy('stop');
    spyOn(stream, 'getTracks').and.returnValue([{ stop } as unknown as MediaStreamTrack]);
    fixture.componentInstance.video.nativeElement.srcObject = stream;
    finishes.forEach(finish => finish()); await Promise.all([pending, restart]);
    expect(stop).toHaveBeenCalled();
    expect(fixture.componentInstance.video.nativeElement.srcObject).toBeNull();
    fixture.destroy();
  });
  it('does not request the camera until asked and keeps manual access after denial', async () => {
    const request = spyOn(navigator.mediaDevices, 'getUserMedia').and.rejectWith(new DOMException('Denied', 'NotAllowedError'));
    const fixture = TestBed.createComponent(CopyScannerComponent); fixture.detectChanges();
    expect(request).not.toHaveBeenCalled();
    await fixture.componentInstance.start(); fixture.detectChanges();
    expect(fixture.componentInstance.message()).toContain('código');
    expect(fixture.componentInstance.active()).toBeFalse();
    fixture.destroy();
  });
});
