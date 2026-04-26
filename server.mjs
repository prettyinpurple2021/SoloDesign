import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath, {index: false}));
app.get('*', (req, res, next) => {
  const acceptsHtml = req.accepts('html');
  const hasFileExtension = path.extname(req.path) !== '';

  if (!acceptsHtml || hasFileExtension) {
    next();
    return;
  }

  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err && !res.headersSent) {
      console.error('Failed to serve index.html:', err);
      res.status(500).send('Application temporarily unavailable');
    }
  });
});

const parsedPort = parseInt(process.env.PORT ?? '', 10);
const port = Number.isNaN(parsedPort) ? 8080 : parsedPort;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

server.on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
