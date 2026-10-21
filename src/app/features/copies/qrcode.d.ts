declare module 'qrcode' {
  const qr: { toCanvas(canvas: HTMLCanvasElement, text: string, options?: { width?: number; margin?: number; errorCorrectionLevel?: 'M' | 'Q'; color?: { dark: string; light: string } }): Promise<void> };
  export default qr;
}
