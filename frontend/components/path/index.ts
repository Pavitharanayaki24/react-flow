// Define our own types to avoid import issues
type XYPosition = { x: number; y: number };

// Define our own Position enum
enum Position {
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

import type { ControlPointData } from '../edges/ControlPoint';

import { getLinearPath, getLinearControlPoints } from './linear';
import { getCatmullRomPath, getCatmullRomControlPoints } from './catmull-rom';
import { Algorithm } from '../edges/constants';

// Force logs to ensure we know which algorithm is being used
function logAlgorithm(name: string, algorithm: Algorithm) {
  console.log(`[PATH SYSTEM] Using ${name} for algorithm: ${algorithm}`);
}

export function getControlPoints(
  points: (ControlPointData | XYPosition)[],
  algorithm: Algorithm = Algorithm.Default,
  sides = { fromSide: Position.Left, toSide: Position.Right }
) {
  // Explicit handling for each algorithm with proper parameters
  switch (algorithm) {
    case Algorithm.Default:
      logAlgorithm('DEFAULT standard edge control points', algorithm);
      // For default, use linear control points for simplicity
      return [];
      
    case Algorithm.Linear:
      logAlgorithm('LINEAR control points', algorithm);
      return getLinearControlPoints(points);

    case Algorithm.CatmullRom:
      logAlgorithm('CATMULL-ROM control points', algorithm);
      // EXPLICITLY pass false for bezier parameter
      return getCatmullRomControlPoints(points, false, sides);

    case Algorithm.BezierCatmullRom:
      logAlgorithm('BEZIER-CATMULL-ROM control points', algorithm);
      // EXPLICITLY pass true for bezier parameter
      return getCatmullRomControlPoints(points, true, sides);
      
    default:
      logAlgorithm('DEFAULT FALLBACK control points', algorithm);
      return [];
  }
}

export function getPath(
  points: XYPosition[],
  algorithm: Algorithm = Algorithm.Default,
  sides = { fromSide: Position.Left, toSide: Position.Right }
) {
  // Explicit handling for each algorithm with proper parameters
  switch (algorithm) {
    case Algorithm.Default:
      logAlgorithm('DEFAULT standard edge path', algorithm);
      // For default edges, return empty string to use ReactFlow's default rendering
      if (points.length < 2) return '';
      const [source, target] = [points[0], points[points.length - 1]];
      return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
      
    case Algorithm.Linear:
      logAlgorithm('LINEAR path', algorithm);
      return getLinearPath(points);

    case Algorithm.CatmullRom:
      logAlgorithm('CATMULL-ROM path', algorithm);
      // EXPLICITLY pass false for bezier parameter
      return getCatmullRomPath(points, false, sides);

    case Algorithm.BezierCatmullRom:
      logAlgorithm('BEZIER-CATMULL-ROM path', algorithm);
      // EXPLICITLY pass true for bezier parameter
      return getCatmullRomPath(points, true, sides);
      
    default:
      logAlgorithm('DEFAULT FALLBACK path', algorithm);
      if (points.length < 2) return '';
      const [src, tgt] = [points[0], points[points.length - 1]];
      return `M ${src.x} ${src.y} L ${tgt.x} ${tgt.y}`;
  }
}
