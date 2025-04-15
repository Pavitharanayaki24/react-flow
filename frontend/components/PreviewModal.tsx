import React, { useState, useEffect, useCallback, memo } from 'react';
import ReactFlow, { 
  Background, 
  MiniMap, 
  Controls,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  Handle,
  useStore
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Editor } from '@monaco-editor/react';

// Custom Node Components
const SquareNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] bg-white border-2 border-gray-800 rounded-md">
    <Handle type="target" position="top" />
    <Handle type="source" position="bottom" />
  </div>
));

const TriangleNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px]">
    <Handle type="target" position="top" />
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M50 5 L95 95 L5 95 Z"
        fill="white"
        stroke="#1a1a1a"
        strokeWidth="2"
      />
    </svg>
    <Handle type="source" position="bottom" />
  </div>
));

const CircleNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px] rounded-full bg-white border-2 border-gray-800">
    <Handle type="target" position="top" />
    <Handle type="source" position="bottom" />
  </div>
));

const DiamondNode = memo(({ data }: { data: any }) => (
  <div className="w-[125px] h-[125px]">
    <Handle type="target" position="top" />
    <div className="w-full h-full" style={{
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      backgroundColor: 'white',
      border: '2px solid #1a1a1a'
    }} />
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
    shape?: string;
  };
  width?: number;
  height?: number;
  style?: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  animated?: boolean;
  type?: string;
  data?: {
    color?: string;
    [key: string]: any;
  };
  style?: Record<string, any>;
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
  const [downloadProgress, setDownloadProgress] = useState(false);
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
        type: node.type // Preserve original node type
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
      
      // Create a notification to show status
      const notification = document.createElement('div');
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
      notification.style.color = 'white';
      notification.style.padding = '12px 24px';
      notification.style.borderRadius = '8px';
      notification.style.zIndex = '9999';
      notification.style.fontFamily = 'Arial, sans-serif';
      notification.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      notification.style.opacity = '0.8';
      notification.textContent = 'Processing...';
      document.body.appendChild(notification);
      
      const updateStatus = (message: string) => {
        // Only update status for important messages
        if (message.includes('error') || message.includes('failed') || message.includes('complete')) {
          notification.textContent = message;
        }
      };
      
      // Try the simple HTML export first for reliability if selected
      if (downloadFormat === 'html') {
        // Silent processing instead of showing status
        // updateStatus('Generating HTML diagram...');
        
        // Create a simplified HTML version of the diagram
        const nodesHtml = previewNodes.map(node => {
          const x = node.position.x;
          const y = node.position.y;
          const width = node.width || 150;
          const height = node.height || 150;
          const label = node.data.label || node.data.title || node.id;
          
          // Determine shape CSS
          let shapeCss = '';
          if (node.type === 'circle') {
            shapeCss = 'border-radius: 50%;';
          } else if (node.type === 'triangle') {
            shapeCss = 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);';
          } else if (node.type === 'diamond') {
            shapeCss = 'clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);';
          }
          
          return `
            <div class="node" data-id="${node.id}" style="
              position: absolute;
              left: ${x}px;
              top: ${y}px;
              width: ${width}px;
              height: ${height}px;
              z-index: 1;
            ">
              <div class="node-content" style="
                width: 100%;
                height: 100%;
                background-color: white;
                border: 2px solid #1a192b;
                display: flex;
                align-items: center;
                justify-content: center;
                ${shapeCss}
              ">
                <div class="node-label" style="
                  padding: 10px;
                  text-align: center;
                  font-weight: bold;
                  word-break: break-word;
                ">${label}</div>
              </div>
            </div>
          `;
        }).join('');
        
        // Simple edge rendering
        const edgesHtml = previewEdges.map(edge => {
          const sourceNode = previewNodes.find(n => n.id === edge.source);
          const targetNode = previewNodes.find(n => n.id === edge.target);
          
          if (sourceNode && targetNode) {
            const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
            const sourceY = sourceNode.position.y + (sourceNode.height || 150);
            const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
            const targetY = targetNode.position.y;
            
            return `
              <svg class="edge" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none;">
                <line 
                  x1="${sourceX}" 
                  y1="${sourceY}" 
                  x2="${targetX}" 
                  y2="${targetY}" 
                  stroke="#555" 
                  stroke-width="2"
                />
              </svg>
            `;
          }
          
          return '';
        }).join('');
        
        const html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Architecture Diagram</title>
              <style>
                * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
                }
                
                body, html {
                  width: 1200px;
                  height: 800px;
                  font-family: Arial, sans-serif;
                  overflow: hidden;
                  background-color: white;
                }
                
                .diagram-container {
                  position: relative;
                  width: 100%;
                  height: 100%;
                }
                
                .header {
                  position: absolute;
                  top: 20px;
                  left: 20px;
                  z-index: 10;
                  background-color: rgba(255, 255, 255, 0.8);
                  padding: 10px;
                  border-radius: 4px;
                }
                
                h1 {
                  font-size: 24px;
                  margin-bottom: 8px;
                  color: #333;
                }
                
                p {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 5px;
                }
                
                .node {
                  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                
                /* Background dots */
                .diagram-background {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  background-image: radial-gradient(#ddd 1px, transparent 1px);
                  background-size: 20px 20px;
                  background-position: 0 0;
                  z-index: -1;
                }
              </style>
            </head>
            <body>
              <div class="diagram-container">
                <div class="diagram-background"></div>
                
                <!-- Edges -->
                ${edgesHtml}
                
                <!-- Nodes -->
                ${nodesHtml}
                
                <header class="header">
                  <h1>Architecture Diagram</h1>
                  <p>Nodes: ${previewNodes.length}, Edges: ${previewEdges.length}</p>
                </header>
              </div>
            </body>
          </html>
        `;
        
        // Download the HTML file directly without server
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'architecture-diagram.html';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        updateStatus('HTML diagram downloaded!');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 3000);
        setIsDownloading(false);
        return;
      }
      
      // For PNG/JPG, use the server-side rendering approach
      // Fix any scaling issues by normalizing node positions
      const normalizedNodes = previewNodes.map(node => ({
        ...node,
        type: node.type || 'default',
        position: {
          x: Math.round(node.position.x),
          y: Math.round(node.position.y),
        },
        data: {
          ...node.data,
          label: node.data.label || node.data.title || node.id, // Ensure label is present
          iconSrc: node.data.iconSrc || '',
          shape: node.type === 'circle' ? 'circle' : 
                 node.type === 'triangle' ? 'triangle' : 
                 node.type === 'diamond' ? 'diamond' : 'default'
        },
        width: node.width || 150, // Match server-side expected size
        height: node.height || 150,
        style: {
          border: '2px solid #1a192b',
          background: '#ffffff',
          ...node.style
        }
      }));
      
      const normalizedEdges = previewEdges.map(edge => ({
        ...edge,
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: '',  // Provide empty string instead of null
        targetHandle: '',  // Provide empty string instead of null
        type: 'smoothstep', // Always use smoothstep
        animated: false, // Disable animation for export
        data: {
          ...edge.data,
          color: '#555'
        },
        style: {
          stroke: '#555',
          strokeWidth: 2
        }
      }));
      
      // Create the data object to send to the server
      const previewData = {
        type: downloadFormat,
        width: 1200, // Use larger size for better quality
        height: 800,
        position: 'top-left',
        font: 'Arial, sans-serif',
        title: "Architecture Diagram",
        subtitle: `Nodes: ${normalizedNodes.length}, Edges: ${normalizedEdges.length}`,
        nodes: normalizedNodes,
        edges: normalizedEdges,
        debug: true // Enable debug mode
      };
      
      updateStatus('Connecting to server...');
      
      // Try to find the server on port 8080 first
      let serverPort = 8080;
      let portFound = false;
      
      try {
        const portResponse = await fetch(`http://localhost:${serverPort}/health`, { 
          method: 'GET'
        });
        if (portResponse.ok) {
          portFound = true;
          console.log(`Found server on port ${serverPort}`);
        }
      } catch (error) {
        console.log(`Server not found on port ${serverPort}, trying alternatives...`);
      }
      
      // If not found, try ports 8081-8090
      if (!portFound) {
        for (let port = 8081; port <= 8090; port++) {
          try {
            updateStatus(`Trying server on port ${port}...`);
            const portResponse = await fetch(`http://localhost:${port}/health`);
            if (portResponse.ok) {
              serverPort = port;
              portFound = true;
              console.log(`Found server on port ${port}`);
              break;
            }
          } catch (error) {
            // Continue to next port
          }
        }
      }
      
      if (!portFound) {
        updateStatus('Server not found. Using client-side export...');
        
        try {
          // Fall back to HTML export and convert to data URL
          // This isn't ideal but allows a download even if server isn't running
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 1200;
          tempCanvas.height = 800;
          const ctx = tempCanvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Failed to create canvas context');
          }
          
          // Don't show status while generating to avoid UI flashing
          // updateStatus('Generating image...');
          
          // Fill canvas with white background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 1200, 800);
          
          // Draw title
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText('Architecture Diagram', 20, 40);
          
          // Draw subtitle
          ctx.font = '14px Arial';
          ctx.fillStyle = 'gray';
          ctx.fillText(`Nodes: ${normalizedNodes.length}, Edges: ${normalizedEdges.length}`, 20, 60);
          
          // Draw nodes
          normalizedNodes.forEach(node => {
            const x = node.position.x;
            const y = node.position.y;
            const width = node.width || 150;
            const height = node.height || 150;
            
            ctx.fillStyle = 'white';
            ctx.strokeStyle = '#1a192b';
            ctx.lineWidth = 2;
            
            if (node.type === 'circle') {
              // Draw circle
              const centerX = x + width / 2;
              const centerY = y + height / 2;
              const radius = width / 2;
              
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.fill();
              ctx.stroke();
            } else if (node.type === 'triangle') {
              // Draw triangle
              ctx.beginPath();
              ctx.moveTo(x + width / 2, y);
              ctx.lineTo(x, y + height);
              ctx.lineTo(x + width, y + height);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else if (node.type === 'diamond') {
              // Draw diamond
              ctx.beginPath();
              ctx.moveTo(x + width / 2, y);
              ctx.lineTo(x + width, y + height / 2);
              ctx.lineTo(x + width / 2, y + height);
              ctx.lineTo(x, y + height / 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Default square/rectangle
              ctx.fillRect(x, y, width, height);
              ctx.strokeRect(x, y, width, height);
            }
            
            // Draw node label
            ctx.fillStyle = 'black';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            
            const label = node.data.label || node.data.title || node.id;
            const labelX = x + width / 2;
            const labelY = y + height / 2;
            
            ctx.fillText(label, labelX, labelY);
          });
          
          // Draw edges as simple lines
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 2;
          
          normalizedEdges.forEach(edge => {
            const sourceNode = normalizedNodes.find(n => n.id === edge.source);
            const targetNode = normalizedNodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              const sourceX = sourceNode.position.x + (sourceNode.width || 150) / 2;
              const sourceY = sourceNode.position.y + (sourceNode.height || 150);
              const targetX = targetNode.position.x + (targetNode.width || 150) / 2;
              const targetY = targetNode.position.y;
              
              ctx.beginPath();
              ctx.moveTo(sourceX, sourceY);
              ctx.lineTo(targetX, targetY);
              ctx.stroke();
            }
          });
          
          // Get data URL and convert to blob
          const dataUrl = tempCanvas.toDataURL(downloadFormat === 'jpg' ? 'image/jpeg' : 'image/png');
          
          // Create download link
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `architecture-diagram.${downloadFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          updateStatus('Image downloaded!');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          setIsDownloading(false);
          return;
        } catch (clientError) {
          console.error('Client-side export failed:', clientError);
          updateStatus('Client-side export failed. Please run the server.');
          setTimeout(() => {
            document.body.removeChild(notification);
          }, 3000);
          setIsDownloading(false);
          return;
        }
      }
      
      // Proceed silently instead of showing the generating message
      // updateStatus('Generating image...');
      
      // Send the data to the server
      const response = await fetch(`http://localhost:${serverPort}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(previewData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}\n${errorText}`);
      }
      
      // Skip status update for generated images
      // updateStatus('Image generated! Downloading...');
      
      // Get the image data
      const blob = await response.blob();
      
      if (blob.size < 100) {
        throw new Error('Generated image is too small, likely empty');
      }
      
      // Create a download link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `architecture-diagram.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(downloadUrl);
      updateStatus('Download complete!');
      
      // Remove the notification after a delay
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error: any) {
      console.error('Error downloading image:', error);
      alert(`Failed to download image: ${error.message || 'Unknown error'}`);
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
              Download
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