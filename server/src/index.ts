import http from 'http';
import { config } from './config';
import app from './app';

const server = http.createServer(app);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`Gauge DB server running on port ${config.port}`);
});

export { app, server };
