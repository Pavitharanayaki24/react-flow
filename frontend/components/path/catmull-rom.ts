import type { ControlPointData } from '../edges/ControlPoint';
import { Position, type XYPosition } from 'reactflow';
import { isControlPoint } from '../utils1';

export function getCatmullRomPath(
  points: XYPosition[],
  bezier = false,
  sides = { fromSide: Position.Left, toSide: Position.Right }
) {
  if (points.length < 2) return '';

  const [start, end] = [points[0], points[points.length - 1]];
  const gapSize = 15;
  
  // Handle Bezier curve separately
  if (bezier) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Calculate control points for smooth curve
    const controlPoint1X = start.x + dx * 0.25;
    const controlPoint1Y = start.y + dy * 0.1;
    const controlPoint2X = start.x + dx * 0.75;
    const controlPoint2Y = end.y - dy * 0.1;
    
    return `M ${start.x} ${start.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${end.x} ${end.y}`;
  }
  
  // Handle Catmull-Rom with orthogonal path
  const fromHandle = start;
  const toHandle = end;
  
  if (sides.fromSide === Position.Right && sides.toSide === Position.Left) {
    // When connecting right to left
    return `M ${fromHandle.x} ${fromHandle.y}
            L ${fromHandle.x + gapSize} ${fromHandle.y}
            L ${fromHandle.x + gapSize} ${fromHandle.y - gapSize}
            L ${toHandle.x - gapSize} ${fromHandle.y - gapSize}
            L ${toHandle.x - gapSize} ${toHandle.y}
            L ${toHandle.x} ${toHandle.y}`;
  }
  
  // Default straight line for other cases
  return `M ${fromHandle.x} ${fromHandle.y} L ${toHandle.x} ${toHandle.y}`;
}

export function getCatmullRomControlPoints(
  points: (ControlPointData | XYPosition)[],
  bezier = false,
  sides = { fromSide: Position.Left, toSide: Position.Right }
) {
  if (points.length < 2) return [];

  const [start, end] = [points[0], points[points.length - 1]];
  const gapSize = 15;

  // Handle Bezier control points
  if (bezier) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    return [
      {
        id: 'control1',
        active: false,
        x: start.x + dx * 0.25,
        y: start.y + dy * 0.1
      },
      {
        id: 'control2',
        active: false,
        x: start.x + dx * 0.75,
        y: end.y - dy * 0.1
      }
    ];
  }

  // Handle Catmull-Rom control points
  if (sides.fromSide === Position.Right && sides.toSide === Position.Left) {
    return [
      {
        id: 'start-corner',
        active: false,
        x: start.x + gapSize,
        y: start.y - gapSize
      },
      {
        id: 'mid-horizontal',
        active: false,
        x: end.x - gapSize,
        y: start.y - gapSize
      },
      {
        id: 'end-corner',
        active: false,
        x: end.x - gapSize,
        y: end.y
      }
    ];
  }

  // Default control point for other cases
  return [
    {
      id: 'mid',
      active: false,
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    }
  ];
}
