import express from 'express';
import cors from 'cors';
import { toHtml, toImage } from './Flow.js';
import { validateRFQueryParams, validateRFJsonBody } from './middleware.js';

const findAvailablePort = async (startPort) => {
  const net = await import('net');
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
};

const app = express();

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Enable CORS for all routes
app.use(cors());

// Add body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.get('/', [validateRFQueryParams], handler);
app.post('/', [validateRFJsonBody], handler);

// Route to get current port
app.get('/port', (req, res) => {
  res.json({ port: app.get('port') });
});

// Start server
const startServer = async () => {
  const port = await findAvailablePort(8080);
  app.set('port', port);
  app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
  });
};

startServer();

async function handler(req, res, next) {
  try {
    const flow = res.locals.flow;

    switch (flow.type) {
      case 'html': {
        const html = await toHtml(flow);
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
        break;
      }

      case 'png': {
        const imageBuffer = await toImage(flow, 'png');
        res.setHeader('Content-Type', 'image/png');
        res.status(200).send(imageBuffer);
        break;
      }

      case 'jpg': {
        const imageBuffer = await toImage(flow, 'jpeg');
        res.setHeader('Content-Type', 'image/jpeg');
        res.status(200).send(imageBuffer);
        break;
      }

      default:
        res.status(400).json({ error: 'Invalid type specified' });
    }
  } catch (error) {
    next(error);
  }
} 