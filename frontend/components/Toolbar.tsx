// import { useCallback } from 'react';
// import { useEdges, useReactFlow } from '@xyflow/react';
// import { Algorithm, COLORS } from './editable-edge/constants';
// import { EditableEdge } from './editable-edge/EditableEdge';

// import css from './Toolbar.module.css';

// export function Toolbar() {
//   const { setEdges } = useReactFlow();
//   const edges = useEdges();

//   const onAlgorithmChange = useCallback(
//     (algorithm: Algorithm) => {
//       setEdges((edges) =>
//         edges.map((edge) => {
//           if (edge.type === 'editable-edge') {
//             return {
//               ...edge,
//               data: {
//                 ...edge.data,
//                 algorithm,
//               },
//             };
//           }
//           return edge;
//         })
//       );
//     },
//     [setEdges]
//   );

//   return (
//     <div className={css.toolbar}>
//       <div className={css.algorithm}>
//         <label>Algorithm:</label>
//         <select
//           onChange={(e) => onAlgorithmChange(e.target.value as Algorithm)}
//           defaultValue={Algorithm.BezierCatmullRom}
//         >
//           <option value={Algorithm.Linear}>Linear</option>
//           <option value={Algorithm.CatmullRom}>Catmull-Rom</option>
//           <option value={Algorithm.BezierCatmullRom}>Bezier Catmull-Rom</option>
//         </select>
//       </div>
//     </div>
//   );
// } 