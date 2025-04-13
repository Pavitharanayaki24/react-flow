"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Sidebar from "./SideBar 1";
import TopBar from "./TopBar 1";
import HelperLines from "./HelperLines 1";
import { getHelperLines } from "./utils1"
import { BottomControls, Footer } from "./BottomControls 1";
import { UserInfoBar, RocketCounter } from "./UserInfoBar 1";
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
  useNodesState
} from "reactflow";
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
}: {
  data: { iconSrc: string; title: string; hideLabel?: boolean };
  selected: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.title);

  const handleDoubleClick = () => {
    if (!data.hideLabel) setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
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
      <div className="w-full h-full relative flex items-center justify-center">
        <img
          src={data.iconSrc}
          alt={label}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Conditional Label */}
        {!data.hideLabel && (
          <div
            onDoubleClick={handleDoubleClick}
            className="absolute inset-0 flex items-center justify-center"
          >
            {isEditing ? (
              <input
                value={label}
                autoFocus
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="outline-none text-black text-xs bg-transparent border-none p-0 m-0 w-3/4 text-center"
              />
            ) : (
              <span className="text-xs bg-transparent px-1 rounded cursor-pointer text-black">
                {label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  "custom-shape": IconNode,
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
      setEdges((eds) => addEdge(params, eds));
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
      
      const newNode: Node = {
        id: uuidv4(),
        type: parsed.type || "custom-shape",
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
    const newNode: Node = {
      id: uuidv4(),
      type: "custom-shape",
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

  return (
    <ReactFlowProvider>
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Sidebar
        onClickPlaceIcon={(icon) => {
          const randomPosition = {
            x: 600 + Math.floor(Math.random() * 200) - 100,
            y: Math.floor(Math.random() * 600),
          };
          const newNode: Node = {
            id: uuidv4(),
            type: "custom-shape",
            position: randomPosition,
            data: {
              iconSrc: icon.iconSrc,
              title: icon.title,
            },
            style: { width: 125, height: 125 },
          };
          setNodes((prev: Node[]) => [...prev, newNode]);
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
      />
      <UserInfoBar />
      <RocketCounter />
      <BottomControls />
      <Footer />
      <div onClick={handleCanvasClick} className="w-full h-screen overflow-auto">
        <ReactFlow
          nodes={nodes.map((node: Node) => ({
            ...node,
            data: { ...node.data, selected: node.selected || false },
          }))}
          edges={edges}
          onConnect={onConnect}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
        >
          <Background variant="dots" gap={20} size={1} />
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
        nodes={nodes}
        edges={edges}
      />
    </div>
    </ReactFlowProvider>
  );
};

export default ArchPlanner;