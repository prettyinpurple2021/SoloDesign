import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const requestedPort = Number.parseInt(process.env.PORT ?? '', 10);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 8080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'), (error) => {
    if (error) {
      res.status(error.statusCode || 500).end();
    }
  });
});

app.listen(port, () => {
  console.log(`SoloDesign listening on port ${port}`);
});
