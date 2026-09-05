/**
 * Chart colours for the factory-ui system. The palette deliberately does not
 * reach for extra hues: every slice is one accent stepped through opacity, so
 * a distribution reads as a single ramp of "machine" data rather than a mood
 * board. Slices are expected to arrive sorted by value, so the ramp also
 * reads as magnitude.
 *
 * `base` is a resolved token colour (e.g. `#2dd4bf`); see `useFxTokens`.
 */
export function generatePalette(count: number, base: string): string[] {
  const rgb = parseColor(base);
  const n = Math.max(count, 1);
  const maxAlpha = 1;
  const minAlpha = n > 6 ? 0.18 : 0.28;
  const colors: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    const alpha = maxAlpha - (maxAlpha - minAlpha) * t;
    colors.push(`rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`);
  }
  return colors;
}

function parseColor(input: string): [number, number, number] {
  const s = input.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  // Fallback: the dark-theme machine accent, so charts never render invisible.
  return [45, 212, 191];
}
