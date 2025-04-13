import React from 'react';
import ReactFlow, { Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  edges: any[];
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, nodes, edges }) => {
  if (!isOpen) return null;

  const generateCode = () => {
    const nodeCode = nodes.map(node => {
      return `{
  id: "${node.id}",
  type: "${node.type}",
  position: { x: ${node.position.x}, y: ${node.position.y} },
  data: {
    iconSrc: "${node.data.iconSrc}",
    title: "${node.data.title}"
  }
}`;
    }).join(',\n');

    const edgeCode = edges.map(edge => {
      return `{
  id: "${edge.id}",
  source: "${edge.source}",
  target: "${edge.target}"
}`;
    }).join(',\n');

    return `const nodes = [\n${nodeCode}\n];\n\nconst edges = [\n${edgeCode}\n];`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Live Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
              >
                <Background variant="dots" gap={20} size={1} />
                <MiniMap />
              </ReactFlow>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="h-full bg-gray-100 p-4 overflow-auto">
              <pre className="text-sm">
                {generateCode()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 