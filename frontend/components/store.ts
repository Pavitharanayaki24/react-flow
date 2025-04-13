import { create } from 'zustand';
import { type XYPosition } from '@xyflow/react';

import type { Flow, Store, Actions } from './types';
import { fromXml, asJavaScript, asJson, asXml } from "./utils1";
import { useDebouncedValue } from './hooks';

const initFlow: Flow = {
  width: 800,
  height: 600,

  title: '',
  subtitle: '',
  position: 'top-left',
  font: 'Arial',

  nodes: [
    { id: '1', width: 100, height: 40, position: { x: 0, y: 0 } },
    { id: '2', width: 100, height: 40, position: { x: 25, y: 100 } },
  ],
  edges: [{ id: '1-2', source: '1', target: '2' }],
};

// This global state is needed because we need transfer the
// control points that have been added while drawing the connection
// to the new edge that is created onConnect
interface AppState {
  connectionLinePath: XYPosition[];
  setConnectionLinePath: (connectionLinePath: XYPosition[]) => void;
}

// HOOKS -----------------------------------------------------------------------

/**
 *
 * Access the store by calling this hook with a function to extract the slice of
 * the store you're interested in. We use Zustand internally at React Flow and we
 * recommend folks use it for state management in their projects too!
 *
 */
export const useStore = create<Store>((set) => ({
  flow: null,
  setFlow: (flow) => set({ flow }),
  type: 'html',
  setType: (type) => set({ type }),
}));

/**
 *
 * Access the state in the store without any of the actions. This will cause a
 * re-render when any part of the store is updated.
 *
 */
export const useStoreState = () =>
  useStore(
    ({
      // We're destructuring all these actions just so its simple to return only
      // the state.
      flow,
    }) => flow
  );

export const useFlow = () => useStore((state) => state.flow);

export const useStoreActions = () => {
  return useStore(
    ({
      setFlow,
    }) => ({
      setFlow,
    })
  );
};

export const useAppStore = create<AppState>((set) => ({
  connectionLinePath: [],
  setConnectionLinePath: (connectionLinePath: XYPosition[]) => {
    set({ connectionLinePath });
  },
}));
