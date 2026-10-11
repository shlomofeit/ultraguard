import { LIVE_UNWATCH, LIVE_WATCH } from '../utils/socketEvents.js';

export function registerLiveSocket(io) {
  const viewers = io.of('/live');

  viewers.on('connection', (socket) => {
    socket.on(LIVE_WATCH, (roomId) => {
      socket.join(`room:${roomId}`);
    });

    socket.on(LIVE_UNWATCH, (roomId) => {
      socket.leave(`room:${roomId}`);
    });
  });
}
