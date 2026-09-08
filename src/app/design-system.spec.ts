describe('editorial design system', () => {
  const cssVariable = (name: string): string =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  it('exposes the semantic color contract', () => {
    expect(cssVariable('--color-canvas')).toBe('#f4f0e8');
    expect(cssVariable('--color-ink')).toBe('#0d1b2a');
    expect(cssVariable('--color-primary')).toBe('#2557d6');
  });

  it('exposes spacing, radius and focus contracts', () => {
    expect(cssVariable('--space-4')).toBe('1rem');
    expect(cssVariable('--radius-card')).toBe('1.125rem');
    expect(cssVariable('--focus-ring')).toContain('37 87 214');
  });
});
