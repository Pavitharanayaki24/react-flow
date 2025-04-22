import { Position } from 'reactflow';

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return distance * curvature;  // <-- More responsive to curvature
  }

  return curvature * 50 * Math.sqrt(-distance); // <-- increased multiplier for more dramatic curves
}

export function getControlWithCurvature(
  pos: Position,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  c: number
): [number, number] {
  switch (pos) {
    case Position.Left:
      return [x1 - calculateControlOffset(x1 - x2, c), y1];
    case Position.Right:
      return [x1 + calculateControlOffset(x2 - x1, c), y1];
    case Position.Top:
      return [x1, y1 - calculateControlOffset(y1 - y2, c)];
    case Position.Bottom:
      return [x1, y1 + calculateControlOffset(y2 - y1, c)];
    default:
      return [x1, y1]; // fallback, important to handle all cases
  }
}
