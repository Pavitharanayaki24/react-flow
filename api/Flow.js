import fs from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Background, ReactFlow, Handle } from 'reactflow';
import puppeteer from 'puppeteer';

// Custom node components using React.createElement
const CustomShapeNode = ({ data }) => {
  const isTriangle = data.iconSrc?.includes('triangle') || data.shape === 'triangle';
  const isCircle = data.iconSrc?.includes('circle') || data.shape === 'circle';
  const isDiamond = data.iconSrc?.includes('diamond') || data.shape === 'diamond';

  const containerStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  };

  const shapeStyle = {
    width: '100%',
    height: '100%',
    background: '#fff',
    border: '2px solid #1a192b',
    display: 'flex',
    alignItems: isTriangle ? 'flex-end' : 'center',
    justifyContent: 'center',
    padding: '10px',
    position: 'absolute',
    top: 0,
    left: 0,
    ...(isTriangle && {
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      paddingBottom: '30px'
    }),
    ...(isCircle && {
      borderRadius: '50%'
    }),
    ...(isDiamond && {
      clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
    })
  };

  return React.createElement('div', {
    style: containerStyle,
    className: 'custom-shape-node',
    'data-shape': isTriangle ? 'triangle' : isCircle ? 'circle' : isDiamond ? 'diamond' : 'default'
  }, [
    React.createElement(Handle, { 
      type: 'target', 
      position: 'top',
      style: { zIndex: 3 }
    }),
    React.createElement('div', {
      style: shapeStyle,
    }, React.createElement('div', {
      style: {
        position: 'relative',
        zIndex: 2
      }
    }, data.label || data.title)),
    React.createElement(Handle, { 
      type: 'source', 
      position: 'bottom',
      style: { zIndex: 3 }
    })
  ]);
};

const nodeTypes = {
  'custom-shape': CustomShapeNode,
  default: CustomShapeNode
};

export function Flow({ flowId, nodes, edges, width, height }) {
  return React.createElement(
    ReactFlow,
    {
      id: flowId,
      nodes: nodes,
      edges: edges,
      fitView: true,
      width: width,
      height: height,
      nodeTypes: nodeTypes,
      defaultEdgeOptions: {
        type: 'smoothstep',
        animated: true,
      },
      style: {
        width: '100%',
        height: '100%',
        background: 'white'
      }
    },
    React.createElement(Background, { color: '#aaa', gap: 16 })
  );
}

// Inline ReactFlow styles
const styles = `
  .react-flow {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
  .react-flow__renderer {
    width: 100%;
    height: 100%;
  }
  .react-flow__node {
    position: absolute;
    user-select: none;
    pointer-events: all;
    transform-origin: 0 0;
    box-sizing: border-box;
    cursor: grab;
  }
  .react-flow__edge {
    pointer-events: all;
  }
  .react-flow__handle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #1a192b;
    border-radius: 100%;
    cursor: crosshair;
  }
  .react-flow__handle-top {
    top: -4px;
    left: 50%;
    transform: translate(-50%, 0);
  }
  .react-flow__handle-bottom {
    bottom: -4px;
    left: 50%;
    transform: translate(-50%, 0);
  }
  .react-flow__background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    user-select: none;
    z-index: -1;
  }
`;

const absolute = {
  ['top-left']: 'top: 20px; left: 20px',
  ['top-right']: 'top: 20px; right: 20px',
  ['bottom-left']: 'bottom: 20px; left: 20px',
  ['bottom-right']: 'bottom: 20px; right: 20px',
};

export async function toHtml(flow) {
  const content = toStaticMarkup(flow);

  return `
    <!DOCTYPE html>
    <html style="overflow: hidden;">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${styles}</style>
        <style>
          html, body { 
            margin: 0; 
            padding: 0;
            font-family: Arial, sans-serif; 
            background-color: white;
            width: 100%;
            height: 100%;
            overflow: hidden;
          }
          .react-flow {
            width: 100%;
            height: 100%;
            background-color: white;
          }
          .custom-shape-node {
            width: 100%;
            height: 100%;
            position: relative;
          }
          .custom-shape-node[data-shape="triangle"] > div:nth-child(2) {
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%) !important;
          }
          .custom-shape-node[data-shape="circle"] > div:nth-child(2) {
            border-radius: 50% !important;
          }
          .custom-shape-node[data-shape="diamond"] > div:nth-child(2) {
            clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) !important;
          }
          .react-flow__handle {
            background-color: #1a192b;
            width: 8px;
            height: 8px;
            z-index: 3;
          }
          .react-flow__edge {
            z-index: 1;
          }
          .react-flow__edge-path {
            stroke: #555;
            stroke-width: 2;
          }
        </style>
      </head>
      <body style="width: ${flow.width}px; height: ${flow.height}px; margin: 0; padding: 0; background-color: white;">
        <header style="position: absolute; top: 20px; left: 20px; font-family: ${flow.font.replace('"', "'")}; z-index: 10;">
          <h1 style="line-height: 1; margin-bottom: 16px">${flow.title}</h1>
          <div>${flow.subtitle}</div>
        </header>
        <div style="width: 100%; height: 100%; position: relative;">
          ${content}
        </div>
      </body>
    </html>`;
}

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  ignoreHTTPSErrors: true,
  headless: 'new',
  protocolTimeout: 60000,
});

export async function toImage(flow, type) {
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ 
      width: flow.width, 
      height: flow.height,
      deviceScaleFactor: 2 // Increase resolution for better quality
    });
    
    const html = await toHtml(flow);
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for ReactFlow to initialize
    await page.waitForFunction(() => {
      return document.querySelector('.react-flow') !== null;
    }, { timeout: 5000 });

    const image = await page.screenshot({ 
      type,
      timeout: 30000,
      clip: {
        x: 0,
        y: 0,
        width: flow.width,
        height: flow.height
      }
    });

    return image;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  } finally {
    if (page) {
      await page.close().catch(console.error);
    }
  }
}

export default Flow;

function toStaticMarkup({ width, height, edges, ...flow }) {
  const nodes = flow.nodes.map((node) => {
    const isTriangle = node.data?.iconSrc?.includes('triangle');
    const isCircle = node.data?.iconSrc?.includes('circle');
    const isDiamond = node.data?.iconSrc?.includes('diamond');
    
    let shape = 'default';
    if (isTriangle) shape = 'triangle';
    else if (isCircle) shape = 'circle';
    else if (isDiamond) shape = 'diamond';

    return {
      ...node,
      type: 'custom-shape',
      data: {
        ...node.data,
        label: node.data?.label || node.data?.title || node.id,
        shape: shape
      },
      style: {
        ...node.style,
        width: node.width || 150,
        height: node.height || 150 // Make height equal to width for better shape proportions
      }
    };
  });

  return renderToStaticMarkup(
    React.createElement(Flow, {
      flowId: 'flow-preview',
      nodes,
      edges: edges.map(edge => ({
        ...edge,
        id: edge.id || `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'smoothstep',
        animated: edge.animated || true,
        style: {
          stroke: edge.data?.color || '#555',
          strokeWidth: 2
        }
      })),
      width,
      height,
    })
  );
} 