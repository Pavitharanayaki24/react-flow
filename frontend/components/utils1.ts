import type { Flow, Font, TextPosition } from './types';
import { NodePositionChange, XYPosition, Node } from 'reactflow';

// =================== CONSTANTS ===================
export const fonts = [
  'Arial',
  'Verdana',
  'Tahoma',
  '"Trebuchet MS"',
  '"Times New Roman"',
  'Georgia',
  'Garamond',
  '"Courier New"',
  '"Brush Script MT"',
] as const;

export const textPositions = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const;

// =================== XML & JSON PARSERS ===================
const parser = typeof window !== 'undefined' ? new DOMParser() : null;

export const fromXml = (source: string, prev: Flow) => {
    if (!parser) return prev; // If on server, skip parsing
    const xml = parser.parseFromString(source, 'text/xml');
  
    if (xml.querySelector('parsererror')) return prev;
  const rf = xml.querySelector('react-flow');
  const width = Number(rf?.getAttribute('width')) ?? prev.width;
  const height = Number(rf?.getAttribute('height')) ?? prev.height;
  const title = rf?.getAttribute('title') || prev.title;
  const subtitle = rf?.getAttribute('subtitle') ?? prev.subtitle;
  const position: TextPosition | undefined = (rf?.getAttribute('position') as TextPosition) ?? prev.position;
  const font: Font | undefined = (rf?.getAttribute('font') as Font) ?? prev.font;

  const nodes = Array.from(xml.querySelectorAll('nodes > node')).flatMap((node) => {
    if (!node.hasAttribute('id')) return [];
    const id = node.getAttribute('id')!;
    const x = Number(node.getAttribute('x'));
    const y = Number(node.getAttribute('y'));
    const nodeWidth = Number(node.getAttribute('width'));
    const nodeHeight = Number(node.getAttribute('height'));
    return [{ id, width: nodeWidth || 100, height: nodeHeight || 40, position: { x: Number.isNaN(x) ? 0 : x, y: Number.isNaN(y) ? 0 : y } }];
  });

  const edges = Array.from(xml.querySelectorAll('edges > edge')).flatMap((edge) => {
    const id = edge.getAttribute('id');
    const source = edge.getAttribute('source');
    const target = edge.getAttribute('target');
    if (!id || !source || !target) return [];
    return [{ id, source, target }];
  });

  return { ...prev, nodes, edges, width, height, title, subtitle, position, font };
};

export const asXml = (flow: Flow) => `<react-flow
  width="${flow.width}"
  height="${flow.height}"
  title="${flow.title}"
  subtitle="${flow.subtitle}"
  position="${flow.position}"
  font="${(flow.font ?? '').replace(/"/g, '&quot;')}">
  <nodes>
    ${flow.nodes.map(asXmlNode).join('\n    ')}
  </nodes>
  <edges>
    ${flow.edges.map(asXmlEdge).join('\n    ')}
  </edges>
</react-flow>`;

const asXmlNode = (node: Flow['nodes'][number]) => `<node id="${node.id}" width="${node.width}" height="${node.height}" x="${node.position.x}" y="${node.position.y}" />`;
const asXmlEdge = (edge: Flow['edges'][number]) => `<edge id="${edge.id}" source="${edge.source}" target="${edge.target}" />`;

export const asJson = (flow: Flow) => JSON.stringify(flow, null, 2);
export const fromJson = (source: string) => { try { return JSON.parse(source) as Flow; } catch { return null; } };
export const fromJavascript = (source: string) => { try { const flow = eval(source + '(() => flow)()') ?? ''; return flow; } catch { return null; } };
export const asJavaScript = (flow: Flow) => `const flow = {
  width: ${flow.width},
  height: ${flow.height},
  title: '${flow.title}',
  subtitle: '${flow.subtitle}',
  position: '${flow.position}',
  font: '${flow.font}',
  nodes: [
    ${flow.nodes.map(asNode).join(',\n    ')}
  ],
  edges: [
    ${flow.edges.map(asEdge).join(',\n    ')}
  ],
};`;

const asNode = (node: Flow['nodes'][number]) => `{ id: '${node.id}', width: ${node.width}, height: ${node.height}, position: { x: ${node.position.x}, y: ${node.position.y} } }`;
const asEdge = (edge: Flow['edges'][number]) => `{ id: '${edge.id}', source: '${edge.source}', target: '${edge.target}' }`;

// =================== HELPER LINES ===================
type GetHelperLinesResult = {
  horizontal?: number;
  vertical?: number;
  snapPosition: Partial<XYPosition>;
};

interface MeasuredNode extends Node {
  measured?: { width: number; height: number };
}

export function getHelperLines(change: NodePositionChange, nodes: MeasuredNode[], distance = 5): GetHelperLinesResult {
  const defaultResult = { horizontal: undefined, vertical: undefined, snapPosition: { x: undefined, y: undefined } };
  const nodeA = nodes.find((node) => node.id === change.id);
  if (!nodeA || !change.position) return defaultResult;

  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + (nodeA.measured?.width ?? 0),
    top: change.position.y,
    bottom: change.position.y + (nodeA.measured?.height ?? 0),
    width: nodeA.measured?.width ?? 0,
    height: nodeA.measured?.height ?? 0,
  };

  let horizontalDistance = distance;
  let verticalDistance = distance;

  return nodes.filter((node) => node.id !== nodeA.id).reduce<GetHelperLinesResult>((result, nodeB) => {
    const nodeBBounds = {
      left: nodeB.position.x,
      right: nodeB.position.x + (nodeB.measured?.width ?? 0),
      top: nodeB.position.y,
      bottom: nodeB.position.y + (nodeB.measured?.height ?? 0),
      width: nodeB.measured?.width ?? 0,
      height: nodeB.measured?.height ?? 0,
    };

    const comparisons: [number, 'horizontal' | 'vertical', () => void][] = [
      [Math.abs(nodeABounds.left - nodeBBounds.left), 'vertical', () => {
        result.snapPosition.x = nodeBBounds.left;
        result.vertical = nodeBBounds.left;
      }],
      [Math.abs(nodeABounds.right - nodeBBounds.right), 'vertical', () => {
        result.snapPosition.x = nodeBBounds.right - nodeABounds.width;
        result.vertical = nodeBBounds.right;
      }],
      [Math.abs(nodeABounds.left - nodeBBounds.right), 'vertical', () => {
        result.snapPosition.x = nodeBBounds.right;
        result.vertical = nodeBBounds.right;
      }],
      [Math.abs(nodeABounds.right - nodeBBounds.left), 'vertical', () => {
        result.snapPosition.x = nodeBBounds.left - nodeABounds.width;
        result.vertical = nodeBBounds.left;
      }],
      [Math.abs(nodeABounds.top - nodeBBounds.top), 'horizontal', () => {
        result.snapPosition.y = nodeBBounds.top;
        result.horizontal = nodeBBounds.top;
      }],
      [Math.abs(nodeABounds.bottom - nodeBBounds.top), 'horizontal', () => {
        result.snapPosition.y = nodeBBounds.top - nodeABounds.height;
        result.horizontal = nodeBBounds.top;
      }],
      [Math.abs(nodeABounds.bottom - nodeBBounds.bottom), 'horizontal', () => {
        result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height;
        result.horizontal = nodeBBounds.bottom;
      }],
      [Math.abs(nodeABounds.top - nodeBBounds.bottom), 'horizontal', () => {
        result.snapPosition.y = nodeBBounds.bottom;
        result.horizontal = nodeBBounds.bottom;
      }],
    ];

    for (const [distanceValue, direction, apply] of comparisons) {
      if ((direction === 'horizontal' && distanceValue < horizontalDistance) ||
          (direction === 'vertical' && distanceValue < verticalDistance)) {
        apply();
        if (direction === 'horizontal') horizontalDistance = distanceValue;
        else verticalDistance = distanceValue;
      }
    }

    return result;
  }, defaultResult);
}
