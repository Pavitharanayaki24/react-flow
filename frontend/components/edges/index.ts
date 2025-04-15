import { HTMLAttributes } from 'react';
import type { PanelProps as ReactFlowPanelProps } from 'reactflow';
/**
 * @expand
 */
export type PanelProps = HTMLAttributes<HTMLDivElement> & {
    /**
     * The position of the panel.
     * @default "top-left"
     */
    position?: ReactFlowPanelProps['position'];
};
/**
 * The `<Panel />` component helps you position content above the viewport.
 * It is used internally by the [`<MiniMap />`](/api-reference/components/minimap)
 * and [`<Controls />`](/api-reference/components/controls) components.
 *
 * @public
 *
 * @example
 * ```jsx
 *import { ReactFlow, Background, Panel } from 'reactflow';
 *
 *export default function Flow() {
 *  return (
 *    <ReactFlow nodes={[]} fitView>
 *      <Panel position="top-left">top-left</Panel>
 *      <Panel position="top-center">top-center</Panel>
 *      <Panel position="top-right">top-right</Panel>
 *      <Panel position="bottom-left">bottom-left</Panel>
 *      <Panel position="bottom-center">bottom-center</Panel>
 *      <Panel position="bottom-right">bottom-right</Panel>
 *    </ReactFlow>
 *  );
 *}
 *```
 */
export declare const Panel: import("react").ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {
    /**
     * The position of the panel.
     * @default "top-left"
     */
    position?: ReactFlowPanelProps['position'] | undefined;
} & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=index.d.ts.map