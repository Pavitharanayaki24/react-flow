import { useEffect, useState, useCallback, useMemo } from 'react';
import { useEdges, useReactFlow, useStore } from 'reactflow';


import { Algorithm, COLORS } from './edges/constants';
import { EditableEdge } from './edges/EditableEdge';

import css from './Toolbar.module.css';

// Define necessary types
interface BaseEdge {
  id: string;
  source: string;
  target: string;
  selected?: boolean;
  data?: any;
}

// Define edge variants outside of component to prevent re-creation
const edgeVariants = [
 
  {
    algorithm: Algorithm.Linear,
    label: 'Linear',
    color: COLORS[Algorithm.Linear]
  },
  {
    algorithm: Algorithm.CatmullRom,
    label: 'Catmull-Rom',
    color: COLORS[Algorithm.CatmullRom]
  },
  {
    algorithm: Algorithm.BezierCatmullRom,
    label: 'Bezier-Catmull-Rom',
    color: COLORS[Algorithm.BezierCatmullRom]
  },
];

// A toolbar that allows the user to change the algorithm of the selected edge
export function Toolbar() {
  const edges = useEdges();
  const { setEdges, getEdges, getNodes } = useReactFlow();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [localAlgorithm, setLocalAlgorithm] = useState<Algorithm | null>(null);
  
  // @ts-ignore - ReactFlow store type is complex
  const transform = useStore((store) => store.transform);

  // Find the selected edge
  const edgess=useEdges();
  console.log(edgess);
  const selectedEdge = useMemo(() => 
    edges.find((edge: BaseEdge) => edge.selected) as EditableEdge | undefined,
    [edges]
  );

  // Update local algorithm when selected edge changes
  useEffect(() => {
    if (selectedEdge?.data?.algorithm) {
      setLocalAlgorithm(selectedEdge.data.algorithm);
      console.log('Selected edge loaded with algorithm:', selectedEdge.data.algorithm);
    }
  }, [selectedEdge?.id]);

  // Position the toolbar near the edge
  useEffect(() => {
    if (!selectedEdge) return;
    
    const sourceNode = getNodes().find((n: any) => n.id === selectedEdge.source);
    const targetNode = getNodes().find((n: any) => n.id === selectedEdge.target);
    
    if (sourceNode && targetNode) {
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;
      
      // Apply zoom transform
      const posX = midX * transform[2] + transform[0];
      const posY = midY * transform[2] + transform[1];
      
      setPosition({
        left: posX,
        top: posY + 40 // Offset below the edge
      });
    }
  }, [selectedEdge, getNodes, transform]);

  // Handle algorithm change - direct replacement approach
  const handleStyleChange = (algorithm: Algorithm) => {
    if (!selectedEdge) return;
    
    console.log('Changing algorithm to:', algorithm);
    
    // Update local state for UI feedback
    setLocalAlgorithm(algorithm);
    
    try {
      // DIRECT COMPLETE REPLACEMENT APPROACH
      // 1. Get all current edges
      const currentEdges = getEdges();
      
      // 2. Create a completely new edge with the same ID but updated algorithm
      const updatedEdge = {
        ...selectedEdge,
        id: selectedEdge.id,
        source: selectedEdge.source,
        target: selectedEdge.target,
        // Important: add a timestamp to force React to see this as a new object
        __timestamp: Date.now(),
        data: {
          ...selectedEdge.data,
          algorithm: algorithm,
          // Add timestamp in data too to force re-render
          _ts: Date.now()
        }
      };
      
      // 3. Create a completely new edges array with the updated edge
      const newEdges = currentEdges.map((e: BaseEdge) => 
        e.id === selectedEdge.id ? updatedEdge : e
      );
      
      // 4. Replace the entire edges array at once
      setEdges(newEdges);
      
      // For debugging
      console.log('Updated edge:', updatedEdge);
    } catch (err) {
      console.error('Error updating edge style:', err);
    }
  };

  // If no edge is selected, don't render the toolbar
  if (!selectedEdge) return null;
  
  // Use local algorithm if available, otherwise fall back to the edge data
  const currentAlgorithm = localAlgorithm || selectedEdge.data?.algorithm;

  return (
    <div 
      className={css.toolbar} 
      style={{
        position: 'absolute',
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translate(-50%, 0)',
        zIndex: 9999, // Ensure it's on top
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        minWidth: '200px',
      }}
    >
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '12px', 
        textAlign: 'center',
        borderBottom: '1px solid #eee',
        paddingBottom: '8px',
        fontSize: '16px'
      }}>
        Edge Style Options
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {edgeVariants.map((style) => (
          <button
            key={style.algorithm}
            onClick={() => handleStyleChange(style.algorithm)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 15px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: currentAlgorithm === style.algorithm 
                ? `${style.color}30` 
                : '#f5f5f5',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: currentAlgorithm === style.algorithm ? 'bold' : 'normal',
              color: style.color,
              outline: currentAlgorithm === style.algorithm 
                ? `2px solid ${style.color}` 
                : 'none',
            }}
          >
            <div style={{
              width: '24px',
              height: '3px',
              backgroundColor: style.color,
              marginRight: '12px',
              borderRadius: '2px',
            }} />
            {style.label}
          </button>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        textAlign: 'center' 
      }}>
        Current style: {currentAlgorithm}
      </div>
    </div>
  );
}
