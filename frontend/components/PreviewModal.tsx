import React, { useState, useEffect, useCallback, memo } from 'react';
import ReactFlow, { 
  Background, 
  MiniMap, 
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Editor } from '@monaco-editor/react';

// Custom Node Components
const SquareNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] bg-white border-2 border-gray-800 rounded-md flex flex-col items-center justify-center p-2">
    <Handle type="target" position="top" />
    {data.iconSrc && (
      <img src={data.iconSrc} alt={data.title} className="w-12 h-12 mb-2" />
    )}
    <div className="text-center text-sm font-medium">{data.title}</div>
    <Handle type="source" position="bottom" />
  </div>
));

const TriangleNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] flex flex-col items-center justify-center">
    <Handle type="target" position="top" />
    <div className="w-full h-full relative flex flex-col items-center justify-center">
      <div className="absolute w-full h-full" style={{
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        backgroundColor: 'white',
        border: '2px solid #1a1a1a'
      }} />
      <div className="relative z-10 flex flex-col items-center justify-center p-2 mt-4">
        {data.iconSrc && (
          <img src={data.iconSrc} alt={data.title} className="w-12 h-12 mb-2" />
        )}
        <div className="text-center text-sm font-medium">{data.title}</div>
      </div>
    </div>
    <Handle type="source" position="bottom" />
  </div>
));

const CircleNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] rounded-full bg-white border-2 border-gray-800 flex flex-col items-center justify-center p-2">
    <Handle type="target" position="top" />
    {data.iconSrc && (
      <img src={data.iconSrc} alt={data.title} className="w-12 h-12 mb-2" />
    )}
    <div className="text-center text-sm font-medium">{data.title}</div>
    <Handle type="source" position="bottom" />
  </div>
));

const DiamondNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] flex flex-col items-center justify-center">
    <Handle type="target" position="top" />
    <div className="w-full h-full relative flex flex-col items-center justify-center">
      <div className="absolute w-full h-full" style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
        backgroundColor: 'white',
        border: '2px solid #1a1a1a'
      }} />
      <div className="relative z-10 flex flex-col items-center justify-center p-2">
        {data.iconSrc && (
          <img src={data.iconSrc} alt={data.title} className="w-12 h-12 mb-2" />
        )}
        <div className="text-center text-sm font-medium">{data.title}</div>
      </div>
    </div>
    <Handle type="source" position="bottom" />
  </div>
));

// Node type mapping
const nodeTypes = {
  square: SquareNode,
  triangle: TriangleNode,
  circle: CircleNode,
  diamond: DiamondNode
};

interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    iconSrc?: string;
    title: string;
    label?: string;
  };
  width?: number;
  height?: number;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  type?: string;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onUpdateFlow: (nodes: FlowNode[], edges: FlowEdge[]) => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, nodes, edges, onUpdateFlow }) => {
  const [format, setFormat] = useState<'json' | 'js' | 'xml'>('json');
  const [editorValue, setEditorValue] = useState('');
  const [previewNodes, setPreviewNodes] = useState<FlowNode[]>(nodes);
  const [previewEdges, setPreviewEdges] = useState<FlowEdge[]>(edges);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg' | 'html'>('png');
  const [previewScale, setPreviewScale] = useState(1);
  const { fitView } = useReactFlow();

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
      const updatedNodes = nodes.map(node => ({
        ...node,
        type: node.type || 'square'
      }));
      setPreviewNodes(updatedNodes);
      setPreviewEdges(edges);
      generateCode();
      setTimeout(() => fitView({ padding: 0.2 }), 100);
    }
  }, [format, nodes, edges, isOpen, fitView]);

  const generateCode = useCallback(() => {
    const flowData = {
      nodes: previewNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        width: node.width || 125,
        height: node.height || 125
      })),
      edges: previewEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'smoothstep',
        animated: edge.animated || true
      }))
    };

    switch (format) {
      case 'json':
        setEditorValue(JSON.stringify(flowData, null, 2));
        break;
      case 'js':
        setEditorValue(`const flowData = ${JSON.stringify(flowData, null, 2)};`);
        break;
      case 'xml':
        const xmlNodes = previewNodes.map(node => `
  <node id="${node.id}" type="${node.type}">
    <position x="${node.position.x}" y="${node.position.y}" />
    <data>
      <iconSrc>${node.data.iconSrc || ''}</iconSrc>
      <title>${node.data.title}</title>
      <label>${node.data.label || ''}</label>
    </data>
    <dimensions width="${node.width || 125}" height="${node.height || 125}" />
  </node>`).join('');
        
        const xmlEdges = previewEdges.map(edge => `
  <edge id="${edge.id}" source="${edge.source}" target="${edge.target}" type="${edge.type || 'smoothstep'}" animated="${edge.animated || true}" />`).join('');
        
        setEditorValue(`<flow>
  <nodes>${xmlNodes}
  </nodes>
  <edges>${xmlEdges}
  </edges>
</flow>`);
        break;
    }
  }, [format, previewNodes, previewEdges]);

  const handleEditorChange = useCallback((value: string | undefined) => {
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
              title: node.querySelector('data title')?.textContent,
              label: node.querySelector('data label')?.textContent
            },
            width: parseFloat(node.querySelector('dimensions')?.getAttribute('width') || '125'),
            height: parseFloat(node.querySelector('dimensions')?.getAttribute('height') || '125')
          }));
          const edges = Array.from(xmlDoc.getElementsByTagName('edge')).map(edge => ({
            id: edge.getAttribute('id'),
            source: edge.getAttribute('source'),
            target: edge.getAttribute('target'),
            type: edge.getAttribute('type') || 'smoothstep',
            animated: edge.getAttribute('animated') === 'true'
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
  }, [format, onUpdateFlow]);

  const handleDownload = async () => {
    if (isDownloading) return;
    
    try {
      setIsDownloading(true);
      
      const previewData = {
        type: downloadFormat,
        width: 800,
        height: 600,
        position: 'top-left',
        font: 'Arial',
        title: "Architecture Diagram",
        subtitle: "",
        nodes: previewNodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          width: node.width || 125,
          height: node.height || 125
        })),
        edges: previewEdges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'smoothstep',
          animated: edge.animated || true
        }))
      };
      
      const json = JSON.stringify(previewData, null, 0);
      const query = new URLSearchParams({ json }).toString();
      const url = `http://localhost:8080?${query}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `architecture-diagram.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsDownloading(false);
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
            <select 
              value={downloadFormat} 
              onChange={(e) => setDownloadFormat(e.target.value as 'png' | 'jpg' | 'html')}
              className="border rounded px-2 py-1"
            >
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="html">HTML</option>
            </select>
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
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
                nodeTypes={nodeTypes}
                fitView
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true
                }}
              >
                <Background variant="dots" gap={20} size={1} />
                <MiniMap />
                <Controls />
                <Panel position="top-right">
                  <div className="text-xs text-gray-500">
                    Scale: {Math.round(previewScale * 100)}%
                  </div>
                </Panel>
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
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  theme: 'vs-light',
                  lineNumbers: 'on',
                  renderWhitespace: 'none',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                  }
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