"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "./layout/SideBar 1";
import TopBar from "./layout/TopBar 1";
import HelperLines from "./HelperLines 1";
import { getHelperLines } from "./utils1"
import { BottomControls, Footer } from "./panels/BottomControls 1";
import { UserInfoBar, RocketCounter } from "./layout/UserInfoBar 1";
import "reactflow/dist/style.css";

import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  NodeResizer,
  Handle,
  Position,
  useNodesState,
  ConnectionMode,
  OnConnect,
  Panel,
  useEdgesState,
  BackgroundVariant,
  useReactFlow
} from "reactflow";
import {useStore} from './store'
import {  EditableEdge } from './edges/EditableEdge';
import{ControlPointData} from './edges/ControlPoint';
import { ConnectionLine } from './edges/ConnectionLine';
import { Toolbar } from './Toolbar';
import { DEFAULT_ALGORITHM } from './edges/constants';
//end ofee
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
  NodeChange,
  OnNodesChange
} from "reactflow";
import { v4 as uuidv4 } from "uuid";
import PreviewModal from './PreviewModal';
import { saveGraph, loadGraph, ensureGraphReady, autoSaveGraph, loadSavedGraph } from "./graphStorage";
import MessageBox from './MessageBox';

type HistoryItem = {
  nodes: Node[];
  edges: Edge[];
};

const useUndoRedo = (
  getNodes: () => Node[],
  getEdges: () => Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) => {
  const [past, setPast] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((prev) => [...prev, { nodes: getNodes(), edges: getEdges() }]);
    setFuture([]);
  }, [getNodes, getEdges]);

  const undo = useCallback(() => {
    setPast((prev) => {
      if (prev.length < 2) return prev;
      const newPast = prev.slice(0, -1);
      const lastState = newPast[newPast.length - 1];
      setNodes(lastState.nodes);
      setEdges(lastState.edges);
      setFuture((f) => [prev[prev.length - 1], ...f]);
      return newPast;
    });
  }, [setNodes, setEdges]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const [next, ...rest] = f;
      setPast((prev) => [...prev, next]);
      setNodes(next.nodes);
      setEdges(next.edges);
      return rest;
    });
  }, [setNodes, setEdges]);

  return { undo, redo, takeSnapshot };
};

// === COPY/PASTE HOOK ===
const useCopyPaste = (
  getNodes: () => Node[],
  getEdges: () => Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  takeSnapshot: () => void
) => {
  const mousePosRef = useRef({ x: 0, y: 0 });
  const bufferRef = useRef<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", updateMouse);
    window.addEventListener("mousedown", updateMouse);
    return () => {
      window.removeEventListener("mousemove", updateMouse);
      window.removeEventListener("mousedown", updateMouse);
    };
  }, []);

  const copy = () => {
    const selectedNodes = getNodes().filter((n) => n.selected);
    const selectedEdges = getEdges().filter((e) =>
      selectedNodes.find((n) => n.id === e.source) &&
      selectedNodes.find((n) => n.id === e.target)
    );
    bufferRef.current = { nodes: selectedNodes, edges: selectedEdges };
  };

  const cut = () => {
    copy();
    const { nodes: bufferNodes, edges: bufferEdges } = bufferRef.current;
    setNodes((nodes) => nodes.filter((n) => !bufferNodes.find((bn) => bn.id === n.id)));
    setEdges((edges) => edges.filter((e) => !bufferEdges.find((be) => be.id === e.id)));
    takeSnapshot();
  };

  const paste = () => {
    const { nodes: bufferNodes, edges: bufferEdges } = bufferRef.current;
    const offsetX = mousePosRef.current.x - Math.min(...bufferNodes.map((n) => n.position.x));
    const offsetY = mousePosRef.current.y - Math.min(...bufferNodes.map((n) => n.position.y));
    const idMap = new Map<string, string>();

    const newNodes = bufferNodes.map((n) => {
      const newId = uuidv4();
      idMap.set(n.id, newId);
      return {
        ...n,
        id: newId,
        position: {
          x: n.position.x + offsetX,
          y: n.position.y + offsetY
        },
        selected: true,
        data: {
          ...n.data,
          hideLabel: isAwsIcon(n.data.iconSrc),
        }
      };
    });    

    const newEdges = bufferEdges.map((e) => ({
      ...e,
      id: uuidv4(),
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
      selected: true
    }));

    setNodes((nodes) =>
      nodes.map((n) => ({ ...n, selected: false })).concat(newNodes)
    );
    setEdges((edges) =>
      edges.map((e) => ({ ...e, selected: false })).concat(newEdges)
    );
    takeSnapshot();
  };

  return { copy, cut, paste };
};

const IconNode = ({
  data,
  selected,
  type,
  id
}: {
  data: { 
    iconSrc: string; 
    title: string; 
    hideLabel?: boolean; 
    onShapeSelect?: (shape: string, handle: Position) => void;
    id?: string; 
  };
  selected: boolean;
  type: string;
  id: string;
}) => {
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [showShapes, setShowShapes] = useState(false);
  const { getNodes, setNodes, setEdges } = useReactFlow();
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const [isMenuHovered, setIsMenuHovered] = useState(false);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapeMenuRef.current && !(shapeMenuRef.current as HTMLElement).contains(event.target as HTMLElement)) {
        setShowShapes(false);
        setHoveredHandle(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getNodeStyle = () => {
    const baseStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      border: '2px solid #1a1a1a'
    };

    switch (type) {
      case 'circle':
        return {
          ...baseStyle,
          borderRadius: '50%'
        };
      case 'diamond':
        return {
          ...baseStyle,
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
        };
      default: // square
        return {
          ...baseStyle,
          borderRadius: '4px'
        };
    }
  };
  
  const handleMouseEnter = (position: Position) => {
    setHoveredHandle(position);
    setShowShapes(true);
  };
  
  const handleMouseLeave = () => {
    if (!isMenuHovered) {
      setHoveredHandle(null);
      setShowShapes(false);
    }
  };

  const handleShapeMenuMouseEnter = () => {
    setIsMenuHovered(true);
  };

  const handleShapeMenuMouseLeave = () => {
    setIsMenuHovered(false);
    setHoveredHandle(null);
    setShowShapes(false);
  };
  
  const handleShapeClick = (selectedShape: string) => {
    const nodes = getNodes();
    const currentNode = nodes.find(node => node.id === id);
    
    if (!currentNode) return;
    
    const offset = 200;
    const activeHandle = hoveredHandle ?? Position.Right;
    let newPosition = { x: currentNode.position.x, y: currentNode.position.y };
    let sourceHandle = '';
    let targetHandle = '';
    
    // Determine position and handles based on the active handle
    switch (activeHandle) {
      case Position.Top:
        newPosition.y -= offset;
        sourceHandle = 'top';
        targetHandle = 'bottom';
        break;
      case Position.Right:
        newPosition.x += offset;
        sourceHandle = 'right';
        targetHandle = 'left';
        break;
      case Position.Bottom:
        newPosition.y += offset;
        sourceHandle = 'bottom';
        targetHandle = 'top';
        break;
      case Position.Left:
        newPosition.x -= offset;
        sourceHandle = 'left';
        targetHandle = 'right';
        break;
    }
    
    // Create new node
    const newNode = {
      id: `node-${uuidv4()}`,
      type: selectedShape,
      position: newPosition,
      data: {
        iconSrc: "",
        title: selectedShape,
      },
      style: { width: 125, height: 125 },
    };
    
    // Create edge with proper handles
    const newEdge = {
      id: `edge-${uuidv4()}`,
      source: currentNode.id,
      target: newNode.id,
      type: 'editable-edge',
      sourceHandle: sourceHandle,
      targetHandle: targetHandle,
      data: {
        algorithm: DEFAULT_ALGORITHM,
        points: []
      }
    };
    
    // Add both node and edge
    setNodes((prevNodes: Node[]) => [...prevNodes, newNode]);
    setEdges((prevEdges: Edge[]) => [...prevEdges, newEdge]);
    
    // Reset state
    setHoveredHandle(null);
    setShowShapes(false);
  };
  

  return (
    <div className="w-full h-full flex items-center justify-center group relative">
      <NodeResizer
            color="#3b82f6"
            isVisible={selected}
            minWidth={50}
            minHeight={50}
            handleStyle={{
              width: 8,
              height: 8,
              backgroundColor: '#fff',
              border: '2px solid #3b82f6',
            }}
          />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      {type === 'triangle' ? (
        <div className="w-full h-full">
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M50 5 L95 95 L5 95 Z"
              fill="white"
              stroke="#1a1a1a"
              strokeWidth="2"
            />
          </svg>
        </div>
      ) : (
        <div style={getNodeStyle()} />
      )}

      {/* Connection Points */}
      <div className="absolute top-1/2 left-0 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-400 bg-white opacity-0 group-hover:opacity-40" />
      <div className="absolute top-1/2 right-0 w-2 h-2 translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-400 bg-white opacity-0 group-hover:opacity-40" />
      <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-400 bg-white opacity-0 group-hover:opacity-40" />
      <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 translate-y-1/2 rounded-full border border-dashed border-blue-400 bg-white opacity-0 group-hover:opacity-40" />

      {/* Directional Arrows */}
      {/* Top Arrow */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[38px] opacity-0 group-hover:opacity-30 hover:opacity-100 transition-all duration-200 cursor-pointer ${hoveredHandle === Position.Top ? 'opacity-100' : ''}`}
           onMouseEnter={() => handleMouseEnter(Position.Top)}
           onMouseLeave={handleMouseLeave}
           onClick={() => handleShapeClick('circle')}
      >
        <div className="w-[48px] h-[48px] flex flex-col items-center">
          {/* Top arrow head */}
          <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[10px] transition-all duration-200 ${hoveredHandle === Position.Top ? 'border-b-blue-500' : 'border-b-sky-400'}`} />
          {/* Top arrow body */}
          <div className={`w-[3px] h-[18px] transition-all duration-200 -mt-[1px] ${hoveredHandle === Position.Top ? 'bg-blue-500' : 'bg-sky-400'}`} />
        </div>
      </div>

      {/* Right Arrow */}
      <div className={`absolute top-1/2 right-0 translate-x-[58px] -translate-y-1/2 opacity-0 group-hover:opacity-30 hover:opacity-100 transition-all duration-200 cursor-pointer ${hoveredHandle === Position.Right ? 'opacity-100' : ''}`}
           onMouseEnter={() => handleMouseEnter(Position.Right)}
           onMouseLeave={handleMouseLeave}
           onClick={() => handleShapeClick('square')}
      >
        <div className="w-[48px] h-[48px] flex items-center ml-[10px]">
          {/* Right arrow body */}
          <div className={`w-[18px] h-[3px] transition-all duration-200 ${hoveredHandle === Position.Right ? 'bg-blue-500' : 'bg-sky-400'}`} />
          {/* Right arrow head */}
          <div className={`w-0 h-0 border-l-[10px] border-y-[8px] border-y-transparent transition-all duration-200 -ml-[1px] ${hoveredHandle === Position.Right ? 'border-l-blue-500' : 'border-l-sky-400'}`} />
        </div>
      </div>

      {/* Bottom Arrow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[58px] opacity-0 group-hover:opacity-30 hover:opacity-100 transition-all duration-200 cursor-pointer ${hoveredHandle === Position.Bottom ? 'opacity-100' : ''}`}
           onMouseEnter={() => handleMouseEnter(Position.Bottom)}
           onMouseLeave={handleMouseLeave}
           onClick={() => handleShapeClick('triangle')}
      >
        <div className="w-[48px] h-[48px] flex flex-col items-center mt-[10px]">
          {/* Bottom arrow body */}
          <div className={`w-[3px] h-[18px] transition-all duration-200 ${hoveredHandle === Position.Bottom ? 'bg-blue-500' : 'bg-sky-400'}`} />
          {/* Bottom arrow head */}
          <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] transition-all duration-200 -mt-[1px] ${hoveredHandle === Position.Bottom ? 'border-t-blue-500' : 'border-t-sky-400'}`} />
        </div>
      </div>

      {/* Left Arrow */}
      <div className={`absolute top-1/2 left-0 -translate-x-[58px] -translate-y-1/2 opacity-0 group-hover:opacity-30 hover:opacity-100 transition-all duration-200 cursor-pointer ${hoveredHandle === Position.Left ? 'opacity-100' : ''}`}
           onMouseEnter={() => handleMouseEnter(Position.Left)}
           onMouseLeave={handleMouseLeave}
           onClick={() => handleShapeClick('diamond')}
      >
        <div className="w-[48px] h-[48px] flex items-center justify-end mr-[10px]">
          {/* Left arrow head */}
          <div className={`w-0 h-0 border-r-[10px] border-y-[8px] border-y-transparent transition-all duration-200 -mr-[1px] ${hoveredHandle === Position.Left ? 'border-r-blue-500' : 'border-r-sky-400'}`} />
          {/* Left arrow body */}
          <div className={`w-[18px] h-[3px] transition-all duration-200 ${hoveredHandle === Position.Left ? 'bg-blue-500' : 'bg-sky-400'}`} />
        </div>
      </div>

      {/* Shape Selection Menu */}
      {showShapes && hoveredHandle && (
        <div 
          ref={shapeMenuRef}
          onMouseEnter={() => {
            handleShapeMenuMouseEnter();
            setIsMenuHovered(true);
          }}
          onMouseLeave={() => {
            handleShapeMenuMouseLeave();
            setIsMenuHovered(false);
          }}
          className={`absolute bg-white shadow-md rounded-lg p-3 z-50 ${
            hoveredHandle === Position.Top || hoveredHandle === Position.Bottom 
              ? 'w-[160px] grid grid-flow-col gap-3' // horizontal layout for top/bottom
              : 'w-[50px] grid grid-cols-1 gap-3'   // vertical layout for right/left
          }`}
          style={{
            left: hoveredHandle === Position.Right ? '100%' : 
                  hoveredHandle === Position.Left ? 'auto' : '50%',
            right: hoveredHandle === Position.Left ? '100%' : 'auto',
            top: hoveredHandle === Position.Bottom ? '100%' : 
                  hoveredHandle === Position.Top ? 'auto' : '50%',
            bottom: hoveredHandle === Position.Top ? '100%' : 'auto',
            transform: hoveredHandle === Position.Right ? 'translate(53px, -50%)' :
                      hoveredHandle === Position.Left ? 'translate(-53px, -50%)' :
                      hoveredHandle === Position.Bottom ? 'translate(-50%, 53px)' :
                      'translate(-50%, -53px)'
          }}
        >
          {/* Circle */}
          <div 
            className={`${
              hoveredHandle === Position.Top || hoveredHandle === Position.Bottom
                ? 'w-8 h-8' // larger for top/bottom
                : 'w-8 h-8'   // smaller for right/left
            } border-2 ${isMenuHovered ? 'border-black' : 'border-gray-300'} rounded-full hover:border-blue-500 cursor-pointer bg-white flex items-center justify-center hover:bg-blue-50`}
            onClick={() => handleShapeClick('circle')}
          />
          {/* Square */}
          <div 
            className={`${
              hoveredHandle === Position.Top || hoveredHandle === Position.Bottom
                ? 'w-8 h-8' // larger for top/bottom
                : 'w-8 h-8'   // smaller for right/left
            } border-2 ${isMenuHovered ? 'border-black' : 'border-gray-300'} hover:border-blue-500 cursor-pointer bg-white flex items-center justify-center hover:bg-blue-50`}
            onClick={() => handleShapeClick('square')}
          />
          {/* Triangle */}
          <div 
            className={`${
              hoveredHandle === Position.Top || hoveredHandle === Position.Bottom
                ? 'w-8 h-8' // larger for top/bottom
                : 'w-8 h-8'   // smaller for right/left
            } border-2 ${isMenuHovered ? 'border-black' : 'border-gray-300'} hover:border-blue-500 cursor-pointer bg-white flex items-center justify-center hover:bg-blue-50`}
            onClick={() => handleShapeClick('triangle')}
          >
            <svg 
              width="80%" 
              height="80%" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M12 4L20 19H4L12 4Z" 
                fill="white" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

    </div>
  );
};


const nodeTypes: NodeTypes = {
  "custom-shape": IconNode,
  "square": IconNode,
  "triangle": IconNode,
  "circle": IconNode,
  "diamond": IconNode
};

// Define edgeTypes outside the component to prevent recreation on each render
const edgeTypes = {
  'editable-edge': EditableEdge,
  'smoothstep': EditableEdge,
  'catmull': EditableEdge,
  'linear': EditableEdge,
  'bezier': EditableEdge,
  'default': EditableEdge
};



const isAwsIcon = (iconSrc: string) => {
  return iconSrc.toLowerCase().includes('aws');
};

const ArchPlanner = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [title, setTitle] = useState("Untitled Mural");
  const [clickedIcon, setClickedIcon] = useState<{ iconSrc: string; title: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showEdgeTypeOptions, setShowEdgeTypeOptions] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Reset preview state on page load and when component unmounts
  useEffect(() => {
    setIsPreviewOpen(false);
    setShowEdgeTypeOptions(false);
    return () => {
      setIsPreviewOpen(false);
      setShowEdgeTypeOptions(false);
    };
  }, []);

  // Make sure nodes and edges are properly re-initialized after closing the preview
  useEffect(() => {
    if (!isPreviewOpen) {
      // Trigger a re-render of the ReactFlow component
      setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 100);
    }
  }, [isPreviewOpen]);

  const getNodes = () => nodes;
  const getEdges = () => edges;

  const { undo, redo, takeSnapshot } = useUndoRedo(getNodes, getEdges, setNodes, setEdges);
  const { cut, copy, paste } = useCopyPaste(getNodes, getEdges, setNodes, setEdges, takeSnapshot);

  const [helperLineHorizontal, setHelperLineHorizontal] = useState<
    number | undefined
  >(undefined);
  const [helperLineVertical, setHelperLineVertical] = useState<
    number | undefined
  >(undefined);

  const customApplyNodeChanges = useCallback(
    (changes: NodeChange[], nodes: Node[]): Node[] => {
      // reset the helper lines (clear existing lines, if any)
      setHelperLineHorizontal(undefined);
      setHelperLineVertical(undefined);

      // this will be true if it's a single node being dragged
      // inside we calculate the helper lines and snap position for the position where the node is being moved to
      if (
        changes.length === 1 &&
        changes[0].type === 'position' &&
        changes[0].dragging &&
        changes[0].position
      ) {
        const helperLines = getHelperLines(changes[0], nodes);

        // if we have a helper line, we snap the node to the helper line position
        // this is being done by manipulating the node position inside the change object
        changes[0].position.x =
          helperLines.snapPosition.x ?? changes[0].position.x;
        changes[0].position.y =
          helperLines.snapPosition.y ?? changes[0].position.y;

        // if helper lines are returned, we set them so that they can be displayed
        setHelperLineHorizontal(helperLines.horizontal);
        setHelperLineVertical(helperLines.vertical);
      }

      return applyNodeChanges(changes, nodes);
    },
    []
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nodes: Node[]) => customApplyNodeChanges(changes, nodes));
    },
    [setNodes, customApplyNodeChanges]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'y' && !event.shiftKey) {
        event.preventDefault();
        redo();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        copy();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'x') {
        event.preventDefault();
        cut();
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        paste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, copy, cut, paste]);

  useEffect(() => {
    takeSnapshot();
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        const newEdge = {
          ...params,
          id: `edge-${uuidv4()}`,
          type: 'smoothstep',
          data: {
            algorithm: DEFAULT_ALGORITHM,
            points: []
          }
        };
        return addEdge(newEdge, eds);
      });
      takeSnapshot();
    },
    [setEdges, takeSnapshot]
  );

  const onNodeDragStop = useCallback(
    (_event: React.SyntheticEvent, node: Node) => {
      setNodes((nds: Node[]) =>
        nds.map((n: Node) => (n.id === node.id ? { ...n, position: node.position } : n))
      );
      takeSnapshot();
      setHelperLineHorizontal(undefined);
      setHelperLineVertical(undefined);
    },
    [takeSnapshot]
  );  

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const data = event.dataTransfer.getData("application/reactflow");
      if (!data) return;

      const parsed = JSON.parse(data);
      const position = {
        x: event.clientX - reactFlowBounds.left - 10,
        y: event.clientY - reactFlowBounds.top,
      };
      
      // Determine node type based on the icon title
      let nodeType = 'square';
      if (parsed.title.toLowerCase().includes('triangle')) {
        nodeType = 'triangle';
      } else if (parsed.title.toLowerCase().includes('circle')) {
        nodeType = 'circle';
      } else if (parsed.title.toLowerCase().includes('diamond')) {
        nodeType = 'diamond';
      }
      
      const newNode: Node = {
        id: uuidv4(),
        type: nodeType,
        position,
        data: {
          iconSrc: parsed.iconSrc,
          title: parsed.title,
          hideLabel: isAwsIcon(parsed.iconSrc),
        },
        style: { width: 125, height: 125 },
      };
      setNodes((nds: Node[]) => [...nds, newNode]);
      takeSnapshot();
    },
    [takeSnapshot]
  );

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!clickedIcon) return;
    const bounds = (e.target as HTMLDivElement).getBoundingClientRect();
    const position = {
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    };
    
    // Determine node type based on the icon title
    let nodeType = 'square';
    if (clickedIcon.title.toLowerCase().includes('triangle')) {
      nodeType = 'triangle';
    } else if (clickedIcon.title.toLowerCase().includes('circle')) {
      nodeType = 'circle';
    } else if (clickedIcon.title.toLowerCase().includes('diamond')) {
      nodeType = 'diamond';
    }

    const newNode: Node = {
      id: uuidv4(),
      type: nodeType,
      position,
      data: {
        iconSrc: clickedIcon.iconSrc,
        title: clickedIcon.title,
        hideLabel: isAwsIcon(clickedIcon.iconSrc),
      },
      style: { width: 125, height: 125 },
    };
    setNodes((nds) => [...nds, newNode]);
    setClickedIcon(null);
    takeSnapshot();
  };

  const handleFlowUpdate = (newNodes: Node[], newEdges: Edge[]) => {
    console.log("Updating flow with:", newNodes.length, "nodes and", newEdges.length, "edges");
    
    const updatedNodes = newNodes.map(node => ({
      ...node,
      type: node.type || 'square' // Ensure type is never undefined
    }));
    
    // Update nodes first
    setNodes(updatedNodes);
    
    // Then update edges with proper types
    const updatedEdges = newEdges.map(edge => ({
      ...edge,
      type: edge.type || 'editable-edge',
      data: {
        ...edge.data,
        algorithm: edge.data?.algorithm || DEFAULT_ALGORITHM,
        points: edge.data?.points || []
      }
    }));
    
    setEdges(updatedEdges);
    takeSnapshot();
  };

  // Add a handler for edge changes
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      setEdges((eds) => {
        return eds.map(edge => {
          const change = changes.find(c => c.id === edge.id);
          if (change && change.type === 'select') {
            return { ...edge, selected: change.selected };
          }
          // Preserve algorithm if already set
          const algorithm = edge.data?.algorithm || DEFAULT_ALGORITHM;
          return {
            ...edge,
            data: {
              ...edge.data,
              algorithm
            }
          };
        });
      });
    },
    []
  );

  const handleEdgeTypeSelect = () => {
    setShowEdgeTypeOptions(!showEdgeTypeOptions);
  };

  const handleSave = async () => {
    try {
      await ensureGraphReady();
      saveGraph(nodes, edges);
    } catch (error) {
      console.error("Error saving graph:", error);
    }
  };

  const handleLoad = async () => {
    try {
      await ensureGraphReady();
      loadGraph(setNodes, setEdges);
    } catch (error) {
      console.error("Error loading graph:", error);
    }
  };

  // Auto-save when nodes or edges change
  useEffect(() => {
    autoSaveGraph(nodes, edges);
  }, [nodes, edges]);

  // Load saved graph on initial mount
  useEffect(() => {
    loadSavedGraph(setNodes, setEdges);
  }, []);

  return (
    <ReactFlowProvider>
      <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
        <Sidebar
          onClickPlaceIcon={(icon) => {
            const randomPosition = {
              x: 600 + Math.floor(Math.random() * 200) - 100,
              y: Math.floor(Math.random() * 600),
            };
            // Determine node type based on the icon title
            let nodeType = 'square';
            if (icon.title.toLowerCase().includes('triangle')) {
              nodeType = 'triangle';
            } else if (icon.title.toLowerCase().includes('circle')) {
              nodeType = 'circle';
            } else if (icon.title.toLowerCase().includes('diamond')) {
              nodeType = 'diamond';
            }
            const newNode: Node = {
              id: uuidv4(),
              type: nodeType,
              position: randomPosition,
              data: {
                iconSrc: icon.iconSrc,
                title: icon.title,
              },
              style: { width: 125, height: 125 },
            };
            setNodes((prev: Node[]) => [...prev, newNode]);
            takeSnapshot();
          }}
        />
        <TopBar 
          title={title}
          setTitle={setTitle}
          undo={undo}
          redo={redo}
          cut={cut}
          copy={copy}
          paste={paste}
          onPreview={() => setIsPreviewOpen(true)}
          onEChange={() => {
            if (edges.some(edge => edge.selected)) {
              return <Toolbar />;
            }
            return null;
          }}
          onEdgeTypeSelect={handleEdgeTypeSelect}
          onSave={handleSave}
          onLoad={handleLoad}
        />
        {showEdgeTypeOptions && (
          <div className="absolute top-14 left-[420px] bg-white border border-gray-200 p-4 rounded-lg shadow-lg z-20">
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edgeType"
                  value="bezier-catmull-rom"
                  onChange={() => {
                    setEdges(edges.map(edge => ({
                      ...edge,
                      type: 'smoothstep',
                      data: {
                        ...edge.data,
                        algorithm: 'bezier-catmull-rom',
                        points: []
                      }
                    })));
                    setShowEdgeTypeOptions(false);
                  }}
                />
                <span className="text-sm text-emerald-500">Bezier-Catmull-Rom</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edgeType"
                  value="catmull-rom"
                  onChange={() => {
                    setEdges(edges.map(edge => ({
                      ...edge,
                      type: 'smoothstep',
                      data: {
                        ...edge.data,
                        algorithm: 'catmull-rom',
                        points: edge.data?.points || []
                      }
                    })));
                    setShowEdgeTypeOptions(false);
                  }}
                />
                <span className="text-sm text-pink-500">Catmull-Rom</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="edgeType"
                  value="linear"
                  onChange={() => {
                    setEdges(edges.map(edge => ({
                      ...edge,
                      type: 'smoothstep',
                      data: {
                        ...edge.data,
                        algorithm: 'linear'
                      }
                    })));
                    setShowEdgeTypeOptions(false);
                  }}
                />
                <span className="text-sm text-blue-500">Linear</span>
              </label>
            </div>
          </div>
        )}
        <UserInfoBar />
        <RocketCounter />
        <BottomControls />
        <Footer />
        <div onClick={handleCanvasClick} className="w-full h-screen overflow-auto">
          <ReactFlow
            key={`react-flow-${forceUpdate}`}
            nodes={nodes.map((node: Node) => ({
              ...node,
              type: node.type || 'square',
              data: { ...node.data, selected: node.selected || false },
            }))}
            edges={edges}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            connectionLineComponent={ConnectionLine}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            <MiniMap style={{ position: "absolute", bottom: "60px" }} />
            <HelperLines
              horizontal={helperLineHorizontal}
              vertical={helperLineVertical}
            />
          </ReactFlow>
        </div>
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            // Force a redraw of ReactFlow after closing the modal
            setTimeout(() => {
              setForceUpdate(prev => prev + 1);
            }, 100);
          }}
          nodes={nodes.map(node => ({
            ...node,
            type: node.type || 'square',
            width: node.width || 125,
            height: node.height || 125
          }))}
          edges={edges}
          onUpdateFlow={handleFlowUpdate}
        />
        <MessageBox />
      </div>
    </ReactFlowProvider>
  );
};

export default ArchPlanner;