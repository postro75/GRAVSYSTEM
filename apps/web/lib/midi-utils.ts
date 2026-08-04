export type QuantizeGrid = 'off' | '1/4' | '1/8' | '1/16';

export const QUANTIZE_OPTIONS: QuantizeGrid[] = ['off', '1/4', '1/8', '1/16'];

export function gridToBeats(grid: QuantizeGrid): number {
  switch (grid) {
    case '1/4':
      return 1;
    case '1/8':
      return 0.5;
    case '1/16':
      return 0.25;
    case 'off':
    default:
      return 0;
  }
}

export function quantizeValue(value: number, grid: QuantizeGrid, min = 0): number {
  if (grid === 'off') return Math.max(min, value);
  const step = gridToBeats(grid);
  const rounded = Math.round(value / step) * step;
  return Math.max(min, rounded);
}
