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
  BackgroundVariant
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
  type
}: {
  data: { iconSrc: string; title: string; hideLabel?: boolean };
  selected: boolean;
  type: string;
}) => {
  const isBasicShape = ['square', 'triangle', 'circle', 'diamond'].includes(type);

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

  return (
    <div className="w-full h-full flex items-center justify-center group relative">
      <NodeResizer
        minWidth={40}
        minHeight={40}
        isVisible={selected}
        lineClassName="!border-gray-400"
        handleClassName="!w-2 !h-2 !bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-[10px] !h-[10px] opacity-0 group-hover:opacity-100 z-10"
      />
      <Handle
        type="source"
        position={Position.Right}
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
  'bezier': EditableEdge
};



const isAwsIcon = (iconSrc: string) => {
  return iconSrc.toLowerCase().includes('aws');
};

const ArchPlanner = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [title, setTitle] = useState("Untitled Mural");
  const [clickedIcon, setClickedIcon] = useState<{ iconSrc: string; title: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showEdgeTypeOptions, setShowEdgeTypeOptions] = useState(false);

  // Reset preview state on page load and when component unmounts
  useEffect(() => {
    setIsPreviewOpen(false);
    setShowEdgeTypeOptions(false);
    return () => {
      setIsPreviewOpen(false);
      setShowEdgeTypeOptions(false);
    };
  }, []);

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
    (params: Edge | Connection) => {
      takeSnapshot();
      const { connectionLinePath } = useStore.getState();
      const edge = {
        ...params,
        id: `${Date.now()}-${params.source}-${params.target}`,
        type: 'smoothstep',
        selected: false,
        data: {
          algorithm: DEFAULT_ALGORITHM,
          points: connectionLinePath ? connectionLinePath.map(
            (point: any, i: number) => ({
              ...point,
              id: window.crypto.randomUUID(),
              prev: i === 0 ? undefined : i - 1,
              active: true
            })
          ) : []
        }
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [takeSnapshot]
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
    const updatedNodes = newNodes.map(node => ({
      ...node,
      type: node.type || 'square' // Ensure type is never undefined
    }));
    setNodes(updatedNodes);
    setEdges(newEdges);
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
        />
        {showEdgeTypeOptions && (
          <div className="absolute top-14 left-[420px] bg-white border border-gray-200 p-4 rounded-lg shadow-lg z-20">
            <div className="flex flex-col space-y-2">
              <button 
                className="px-4 py-2 hover:bg-gray-100 rounded text-left whitespace-nowrap flex items-center"
                onClick={() => {
                  // Set edge type to catmull-rom
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
              >
                <svg width="50" height="24" viewBox="0 0 50 24" className="mr-2">
                  <path d="M5,12 Q15,4 25,12 Q35,20 45,12" stroke="#F06292" strokeWidth="3" fill="none" />
                </svg>
                Catmull-Rom
              </button>
              <button 
                className="px-4 py-2 hover:bg-gray-100 rounded text-left whitespace-nowrap flex items-center"
                onClick={() => {
                  // Set edge type to linear
                  setEdges(edges.map(edge => ({
                    ...edge,
                    edgetype: 'smoothstep',
                    data: {
                      ...edge.data,
                      algorithm: 'linear'
                    }
                  })));
                  setShowEdgeTypeOptions(false);
                }}
              >
                <svg width="50" height="24" viewBox="0 0 50 24" className="mr-2">
                  <line x1="5" y1="12" x2="45" y2="12" stroke="#03A9F4" strokeWidth="3" />
                </svg>
                Linear
              </button>
              <button 
                className="px-4 py-2 hover:bg-gray-100 rounded text-left whitespace-nowrap flex items-center"
                onClick={() => {
                  // Set edge type to bezier-catmull-rom
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
              >
                <svg width="50" height="24" viewBox="0 0 50 24" className="mr-2">
                  <path d="M5,12 C15,0 35,24 45,12" stroke="#00BFA5" strokeWidth="3" fill="none" />
                  <circle cx="5" cy="12" r="3" fill="#00BFA5" />
                </svg>
                Bezier-Catmull-Rom
              </button>
            </div>
          </div>
        )}
        <UserInfoBar />
        <RocketCounter />
        <BottomControls />
        <Footer />
        <div onClick={handleCanvasClick} className="w-full h-screen overflow-auto">
          <ReactFlow
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
          onClose={() => setIsPreviewOpen(false)}
          nodes={nodes.map(node => ({
            ...node,
            type: node.type || 'square', // Ensure type is never undefined
            width: node.width || 125, // Ensure width is never null
            height: node.height || 125 // Ensure height is never null
          }))}
          edges={edges}
          onUpdateFlow={handleFlowUpdate}
        />
      </div>
    </ReactFlowProvider>
  );
};

export default ArchPlanner;