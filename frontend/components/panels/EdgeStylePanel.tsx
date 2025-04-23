import React from 'react';
import { Position } from '@xyflow/react';
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
  if (!selectedEdge) return null;

  const currentAlgorithm = selectedEdge.data?.algorithm || DEFAULT_ALGORITHM;

  return (
    <div className="fixed right-4 top-20 bg-white rounded-lg shadow-lg p-4 w-64 z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Edge Style</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="edgeStyle"
              value="linear"
              checked={currentAlgorithm === 'linear'}
              onChange={(e) => onEdgeStyleChange(selectedEdge.id, e.target.value)}
              className="w-4 h-4 text-blue-500"
            />
            <span>Linear</span>
          </div>
          <div className="w-16 h-1.5 bg-blue-500 rounded-full" />
        </label>

        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="edgeStyle"
              value="catmull-rom"
              checked={currentAlgorithm === 'catmull-rom'}
              onChange={(e) => onEdgeStyleChange(selectedEdge.id, e.target.value)}
              className="w-4 h-4 text-pink-500"
            />
            <span>Catmull-Rom</span>
          </div>
          <div className="w-16 h-1.5 bg-pink-500 rounded-full" />
        </label>

        <label className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              name="edgeStyle"
              value="bezier-catmull-rom"
              checked={currentAlgorithm === 'bezier-catmull-rom'}
              onChange={(e) => onEdgeStyleChange(selectedEdge.id, e.target.value)}
              className="w-4 h-4 text-green-500"
            />
            <span>Bezier-Catmull-Rom</span>
          </div>
          <div className="w-16 h-1.5 bg-green-500 rounded-full" />
        </label>
      </div>

     
    </div>
  );
};

export default EdgeStylePanel; 