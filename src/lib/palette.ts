export function generatePalette(count: number, seedHue: number): string[] {
  const colors: string[] = [];
  const baseHue = typeof seedHue === 'number' ? seedHue : Math.floor(Math.random() * 360);
  const n = Math.max(count, 1);
  for (let i = 0; i < n; i++) {
    const hue = (baseHue + (360 / n) * i) % 360;
    colors.push(`hsl(${hue} 70% 55%)`);
  }
  return colors;
}
