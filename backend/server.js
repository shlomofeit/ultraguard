import 'dotenv/config';
import app from './app.js';
import http from 'http';
import { Server } from 'socket.io';
import { registerListenerSocket } from './sockets/listener.socket.js';
import { registerLiveSocket } from './sockets/live.socket.js';
import { eventFeaturesRepo } from './repositories/eventFeatures.repo.js';

const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { credentials: true, origin: process.env.CLIENT_ORIGIN },
});

app.set('io', io);

registerListenerSocket(io);
registerLiveSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

try {
  await eventFeaturesRepo.createIndexes();
} catch (error) {
  console.error('Mongo is not available, event features will not be saved', error.message);
}
