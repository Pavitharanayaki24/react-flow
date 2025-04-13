import fs from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Background, ReactFlow, Handle } from 'reactflow';
import puppeteer from 'puppeteer';

// Custom node components using React.createElement
const SquareNode = ({ data }) => React.createElement('div', {
  style: {
    width: '100%',
    height: '100%',
    background: '#fff',
    border: '2px solid #1a192b',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px'
  }
}, [
  React.createElement(Handle, { type: 'target', position: 'top' }),
  React.createElement('div', null, data.label),
  React.createElement(Handle, { type: 'source', position: 'bottom' })
]);

const DefaultNode = ({ data }) => React.createElement('div', {
  style: {
    width: '100%',
    height: '100%',
    background: '#fff',
    border: '2px solid #1a192b',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px'
  }
}, [
  React.createElement(Handle, { type: 'target', position: 'top' }),
  React.createElement('div', null, data.label),
  React.createElement(Handle, { type: 'source', position: 'bottom' })
]);

const nodeTypes = {
  square: SquareNode,
  default: DefaultNode,
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
    },
    React.createElement(Background, null)
  );
}

let styles = '';
try {
  styles = await fs.readFile(
    process.env.NODE_MODULES
      ? `${process.env.NODE_MODULES}/node_modules/reactflow/dist/style.css`
      : './node_modules/reactflow/dist/style.css',
    'utf-8'
  );
} catch (error) {
  console.warn('Could not load ReactFlow styles:', error.message);
  styles = '';
}

const absolute = {
  ['top-left']: 'top: 20px; left: 20px',
  ['top-right']: 'top: 20px; right: 20px',
  ['bottom-left']: 'bottom: 20px; left: 20px',
  ['bottom-right']: 'bottom: 20px; right: 20px',
};

export async function toHtml(flow) {
  const content = toStaticMarkup(flow);

  return `
    <html style="overflow: hidden;">
      <head>
        <style>${styles}</style>
        <style>html, body { margin: 0; font-family: Arial, sans-serif; }</style>
      </head>
      <body 
        style="width: ${flow.width}px; height: ${flow.height}px; margin: 0;"
      >
        <header style="position: absolute; ${
          absolute[flow.position]
        }; font-family: ${flow.font.replace('"', "'")};">
          <h1 style="line-height: 1; margin-bottom: 16px">${flow.title}</h1>
          <div>${flow.subtitle}</div>
        </header>
        ${content}
      </body>
    </html>`;
}

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  ignoreHTTPSErrors: true,
  dumpio: false,
  headless: 'new',
  protocolTimeout: 60000,
});

export async function toImage(flow, type) {
  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: flow.width, height: flow.height });
    
    const html = await toHtml(flow);
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const image = await page.screenshot({ 
      type,
      timeout: 30000
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
    return {
      ...node,
      type: node.type || 'default',
      data: {
        ...node.data,
        label: node.data?.label || node.id
      },
      position: node.position || { x: 0, y: 0 },
      width: node.width || 150,
      height: node.height || 50,
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
        animated: edge.animated || true
      })),
      width,
      height,
    })
  );
} 