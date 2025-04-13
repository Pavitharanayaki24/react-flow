import React, { useState, useEffect } from 'react';
import ReactFlow, { Background, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';
import { Editor } from '@monaco-editor/react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: any[];
  edges: any[];
  onUpdateFlow: (nodes: any[], edges: any[]) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, nodes, edges, onUpdateFlow }) => {
  const [format, setFormat] = useState<'json' | 'js' | 'xml'>('json');
  const [editorValue, setEditorValue] = useState('');
  const [previewNodes, setPreviewNodes] = useState(nodes);
  const [previewEdges, setPreviewEdges] = useState(edges);

  useEffect(() => {
    if (!isOpen) {
      setFormat('json');
      setEditorValue('');
      setPreviewNodes(nodes);
      setPreviewEdges(edges);
    }
  }, [isOpen, nodes, edges]);

  useEffect(() => {
    if (isOpen) {
      generateCode();
    }
  }, [format, nodes, edges, isOpen]);

  const generateCode = () => {
    const flowData = {
      nodes,
      edges
    };

    switch (format) {
      case 'json':
        setEditorValue(JSON.stringify(flowData, null, 2));
        break;
      case 'js':
        setEditorValue(`const flowData = ${JSON.stringify(flowData, null, 2)};`);
        break;
      case 'xml':
        const xmlNodes = nodes.map(node => `
  <node id="${node.id}" type="${node.type}">
    <position x="${node.position.x}" y="${node.position.y}" />
    <data>
      <iconSrc>${node.data.iconSrc}</iconSrc>
      <title>${node.data.title}</title>
    </data>
  </node>`).join('');
        
        const xmlEdges = edges.map(edge => `
  <edge id="${edge.id}" source="${edge.source}" target="${edge.target}" />`).join('');
        
        setEditorValue(`<flow>
  <nodes>${xmlNodes}
  </nodes>
  <edges>${xmlEdges}
  </edges>
</flow>`);
        break;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;

    try {
      let parsedData;
      switch (format) {
        case 'json':
          parsedData = JSON.parse(value);
          break;
        case 'js':
          const jsMatch = value.match(/const flowData = ([\s\S]*?);/);
          if (jsMatch) {
            parsedData = eval(`(${jsMatch[1]})`);
          }
          break;
        case 'xml':
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(value, 'text/xml');
          const nodes = Array.from(xmlDoc.getElementsByTagName('node')).map(node => ({
            id: node.getAttribute('id'),
            type: node.getAttribute('type'),
            position: {
              x: parseFloat(node.querySelector('position')?.getAttribute('x') || '0'),
              y: parseFloat(node.querySelector('position')?.getAttribute('y') || '0')
            },
            data: {
              iconSrc: node.querySelector('data iconSrc')?.textContent,
              title: node.querySelector('data title')?.textContent
            }
          }));
          const edges = Array.from(xmlDoc.getElementsByTagName('edge')).map(edge => ({
            id: edge.getAttribute('id'),
            source: edge.getAttribute('source'),
            target: edge.getAttribute('target')
          }));
          parsedData = { nodes, edges };
          break;
      }

      if (parsedData && parsedData.nodes && parsedData.edges) {
        setPreviewNodes(parsedData.nodes);
        setPreviewEdges(parsedData.edges);
        onUpdateFlow(parsedData.nodes, parsedData.edges);
      }
    } catch (error) {
      console.error('Error parsing flow data:', error);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg p-6 w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Flow Data Editor</h2>
          <div className="flex items-center space-x-4">
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value as 'json' | 'js' | 'xml')}
              className="border rounded px-2 py-1"
            >
              <option value="json">JSON</option>
              <option value="js">JavaScript</option>
              <option value="xml">XML</option>
            </select>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="h-full">
              <ReactFlow
                nodes={previewNodes}
                edges={previewEdges}
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
            <div className="h-full">
              <Editor
                height="100%"
                defaultLanguage={format === 'xml' ? 'xml' : 'javascript'}
                value={editorValue}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  automaticLayout: true
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal; 