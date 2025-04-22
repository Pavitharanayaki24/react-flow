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
  
  if (bezier) {
    // Create a smooth bezier curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Calculate control points for smooth curve
    const controlPoint1X = start.x + dx * 0.25;
    const controlPoint1Y = start.y + dy * 0.1;
    const controlPoint2X = start.x + dx * 0.75;
    const controlPoint2Y = end.y - dy * 0.1;
    
    return `M ${start.x} ${start.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${end.x} ${end.y}`;
  }
  
  // Default to right-angled path for non-bezier
  return `M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`;
}

export function getCatmullRomControlPoints(
  points: (ControlPointData | XYPosition)[],
  bezier = false,
  sides = { fromSide: Position.Left, toSide: Position.Right }
) {
  if (points.length < 2) return [];

  const [start, end] = [points[0], points[points.length - 1]];

  if (bezier) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Add two control points for bezier curve
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

  // Default to single control point for right angle
  return [
    {
      id: '',
      active: false,
      x: start.x,
      y: end.y
    }
  ];
}
