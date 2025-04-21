import { useCallback, useRef, useMemo, useEffect } from 'react';
import {
  BaseEdge,
  BuiltInNode,
  useReactFlow,
  useStore,
  type Edge,
  type EdgeProps,
  type XYPosition,
} from 'reactflow';

import { ControlPoint, type ControlPointData } from './ControlPoint';
import { getPath, getControlPoints } from '../path';
import { Algorithm, COLORS, DEFAULT_ALGORITHM } from './constants';

const useIdsForInactiveControlPoints = (points: ControlPointData[]) => {
  const ids = useRef<string[]>([])

  if (ids.current.length === points.length) {
    return points.map((point, i) => point.id ? point : (
      { ...point, id: ids.current[i] }))
  } else {
    ids.current = []

    return points.map((point, i) => {
      if (!point.id) {
        const id = window.crypto.randomUUID()
        ids.current[i] = id
        return { ...point, id: id }
      } else {
        ids.current[i] = point.id
        return point
      }
    })
  }
};

export type EditableEdge = Edge<{
  algorithm?: Algorithm;
  points: ControlPointData[];
  _ts?: number;
}> & {
  __timestamp?: number;
};

export function EditableEdgeComponent({
  id,
  selected,
  source,
  sourceX,
  sourceY,
  sourcePosition,
  target,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  markerStart,
  style,
  data = { points: [], algorithm: Algorithm.Default },
  __timestamp,
  ...delegated
}: EdgeProps<EditableEdge>) {
  const sourceOrigin = useMemo(() => ({ x: sourceX, y: sourceY } as XYPosition), [sourceX, sourceY]);
  const targetOrigin = useMemo(() => ({ x: targetX, y: targetY } as XYPosition), [targetX, targetY]);

  // Extract algorithm and any timestamps from data
  const algorithm = data.algorithm || Algorithm.Default;
  const timestamp = data._ts || __timestamp;
  const color = COLORS[algorithm];

  const { setEdges } = useReactFlow<BuiltInNode, EditableEdge>();
  const shouldShowPoints = selected;

  // Debugging log
  useEffect(() => {
    console.log(`Edge ${id} using algorithm: ${algorithm}, timestamp: ${timestamp || 'none'}`);
  }, [id, algorithm, timestamp]);

  const setControlPoints = useCallback(
    (update: (points: ControlPointData[]) => ControlPointData[]) => {
      setEdges((edges: any[]) =>
        edges.map((e) => {
          if (e.id !== id) return e;
          if (!isEditableEdge(e)) return e;

          const points = e.data?.points ?? [];
          const data = { ...e.data, points: update(points) };

          return { ...e, data };
        })
      );
    },
    [id, setEdges]
  );

  const pathPoints = useMemo(() => 
    [sourceOrigin, ...data.points, targetOrigin], 
    [sourceOrigin, data.points, targetOrigin]
  );
  
  // Recalculate control points when algorithm changes
  const controlPoints = useMemo(() => {
    console.log(`Calculating control points for algorithm: ${algorithm}`);
    return getControlPoints(pathPoints, algorithm, {
      fromSide: sourcePosition,
      toSide: targetPosition,
    });
  }, [pathPoints, algorithm, sourcePosition, targetPosition, timestamp]);
  
  // Recalculate path when algorithm changes
  const path = useMemo(() => {
    console.log(`Calculating path for algorithm: ${algorithm}`);
    return getPath(pathPoints, algorithm, {
      fromSide: sourcePosition,
      toSide: targetPosition,
    });
  }, [pathPoints, algorithm, sourcePosition, targetPosition, timestamp]);

  const controlPointsWithIds = useIdsForInactiveControlPoints(controlPoints);

  // Generate a unique key for re-rendering
  const edgeKey = `${id}-${algorithm}-${timestamp || Date.now()}`;

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        {...delegated}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: color,
        }}
        data-algorithm={algorithm}
        data-edge-id={id}
        data-key={edgeKey}
        key={edgeKey}
      />

      {shouldShowPoints &&
        controlPointsWithIds.map((point, index) => (
          <ControlPoint
            key={`${point.id}-${algorithm}-${timestamp || Date.now()}`}
            index={index}
            setControlPoints={setControlPoints}
            color={color}
            {...point}
          />
        ))}
    </>
  );
}

const isEditableEdge = (edge: Edge): edge is EditableEdge =>
  edge.type === 'editable-edge';
export { getPath, EditableEdgeComponent as EditableEdge };

