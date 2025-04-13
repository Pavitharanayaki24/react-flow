// import { useCallback } from 'react';
// import {
//   ReactFlow,
//   Background,
//   ConnectionMode,
//   OnConnect,
//   Panel,
//   addEdge,
//   useEdgesState,
//   useNodesState,
// } from '@xyflow/react';

// import '@xyflow/react/dist/style.css';

// import { EditableEdge } from './editable-edge/EditableEdge';
// import { ConnectionLine } from './editable-edge/ConnectionLine';
// import { Toolbar } from './Toolbar';
// import { Algorithm } from './editable-edge/constants';

// const initialNodes = [
//   {
//     id: '1',
//     type: 'default',
//     position: { x: 0, y: 0 },
//     data: { label: 'Node 1' },
//   },
//   {
//     id: '2',
//     type: 'default',
//     position: { x: 200, y: 200 },
//     data: { label: 'Node 2' },
//   },
// ];

// const initialEdges = [
//   {
//     id: 'edge-1',
//     type: 'editable-edge',
//     source: '1',
//     target: '2',
//     data: {
//       algorithm: Algorithm.BezierCatmullRom,
//       points: [],
//     },
//   },
// ];

// const edgeTypes = {
//   'editable-edge': EditableEdge,
// };

// export default function EditableEdgeExample() {
//   const [nodes, , onNodesChange] = useNodesState(initialNodes);
//   const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

//   const onConnect: OnConnect = useCallback(
//     (connection) => {
//       const edge = {
//         ...connection,
//         id: `${Date.now()}-${connection.source}-${connection.target}`,
//         type: 'editable-edge',
//         data: {
//           algorithm: Algorithm.BezierCatmullRom,
//           points: [],
//         },
//       };
//       setEdges((edges) => addEdge(edge, edges));
//     },
//     [setEdges]
//   );

//   return (
//     <div style={{ width: '100%', height: '100vh' }}>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         edgeTypes={edgeTypes}
//         connectionLineComponent={ConnectionLine}
//         connectionMode={ConnectionMode.Loose}
//         fitView
//       >
//         <Background />
//         <Panel position="top-left">
//           <Toolbar />
//         </Panel>
//       </ReactFlow>
//     </div>
//   );
// } 