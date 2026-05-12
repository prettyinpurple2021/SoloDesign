import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const requestedPort = Number.parseInt(process.env.PORT ?? '8080', 10);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) {
      console.error('Failed to serve index.html', error);
      const status = error.status || 500;
      const message = status >= 500 ? 'Internal Server Error' : 'Unable to load application';
      res.status(status).send(message);
    }
  });
});

app.listen(port, () => {
  console.log(`SoloDesign listening on port ${port}`);
});
