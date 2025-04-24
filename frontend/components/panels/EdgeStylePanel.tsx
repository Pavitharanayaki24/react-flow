import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_ALGORITHM } from '../edges/constants';

interface EdgeStylePanelProps {
  selectedEdge: any;
  onEdgeStyleChange: (edgeId: string, algorithm: string) => void;
  onClose: () => void;
}

const EdgeStylePanel: React.FC<EdgeStylePanelProps> = ({
  selectedEdge,
  onEdgeStyleChange,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [currentAlgorithm, setCurrentAlgorithm] = useState('smoothstep');
  const [hoveredAlgorithm, setHoveredAlgorithm] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Update currentAlgorithm when selectedEdge changes
  useEffect(() => {
    if (selectedEdge) {
      const algorithm = selectedEdge.data?.algorithm || 'smoothstep';
      setCurrentAlgorithm(algorithm);
    }
  }, [selectedEdge]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize edge type if needed
  useEffect(() => {
    if (selectedEdge && (!selectedEdge.data?.algorithm || selectedEdge.data.algorithm === DEFAULT_ALGORITHM)) {
      onEdgeStyleChange(selectedEdge.id, 'smoothstep');
      setCurrentAlgorithm('smoothstep');
    }
  }, [selectedEdge]);

  if (!selectedEdge) return null;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setIsDropdownVisible(false);
    }
  };

  const handlePathSelect = (algorithm: string) => {
    onEdgeStyleChange(selectedEdge.id, algorithm);
    setCurrentAlgorithm(algorithm);
    setIsDropdownVisible(false);
  };

  const handleHoverStart = (algorithm: string) => {
    setHoveredAlgorithm(algorithm);
    // Temporarily change the edge style
    onEdgeStyleChange(selectedEdge.id, algorithm);
  };

  const handleHoverEnd = () => {
    setHoveredAlgorithm(null);
    // Reset to the current algorithm
    onEdgeStyleChange(selectedEdge.id, currentAlgorithm);
  };

  // Function to get display name for the algorithm
  const getDisplayName = (algorithm: string) => {
    if (algorithm === 'smoothstep' || !algorithm) return 'smoothstep';
    if (algorithm === 'bezier-catmull-rom') return 'Bezier';
    if (algorithm === 'catmull-rom') return 'Catmull-Rom';
    return 'Linear';
  };

  return (
    <div style={{ position: 'absolute', top: 60, right: 20, width: '250px', zIndex: 1000 }}>
      {/* Toggle Header */}
      <div
        onClick={toggleExpand}
        style={{
          width: '250px',
          height: '40px',
          background: '#eee',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '10px',
          cursor: 'pointer',
          borderRadius: '8px 8px 0 0',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}
      >
        <span style={{ 
          fontSize: '16px', 
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.3s ease' 
        }}>
          ▼
        </span>
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '16px',
          color: '#333',
        }}>
          ⋮
        </span>
      </div>

      {/* Main Panel */}
      {isExpanded && (
        <div
          ref={panelRef}
          style={{
            width: '250px',
            background: '#fff',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              position: 'relative',
            }}
          >
            <label style={{ fontSize: '14px' }}>Edge : </label>
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownVisible(!isDropdownVisible);
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '100px',
                textAlign: 'center',
              }}
            >
              {getDisplayName(currentAlgorithm)}
            </div>

            {/* Dropdown Menu */}
            {isDropdownVisible && (
              <div 
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '15px',
                  background: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                  borderRadius: '4px',
                  width: '150px',
                  zIndex: 1001,
                }}
              >
                {[
                  { value: 'linear', label: 'Linear' },
                  { value: 'catmull-rom', label: 'Catmull-Rom' },
                  { value: 'bezier-catmull-rom', label: 'Bezier' }
                ].map(({ value, label }, index, array) => (
                  <div
                    key={value}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePathSelect(value);
                    }}
                    onMouseEnter={() => handleHoverStart(value)}
                    onMouseLeave={handleHoverEnd}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      backgroundColor: hoveredAlgorithm === value ? '#f0f0f0' : 'white',
                      borderRadius: index === 0 ? '4px 4px 0 0' : 
                                 index === array.length - 1 ? '0 0 4px 4px' : 
                                 'none',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    {label}
                    {currentAlgorithm === value && (
                      <span style={{ color: '#4299e1' }}></span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EdgeStylePanel; 