import { LISTENER_EVENT, LIVE_EVENT } from '../utils/socketEvents.js';
import { eventsService } from '../services/events.service.js';

export function registerListenerSocket(io) {
  const listeners = io.of('/listener');

  listeners.use((socket, next) => {
    socket.data.device = {
      id: process.env.DEV_DEVICE_ID,
      roomId: process.env.DEV_ROOM_ID,
    };
    next();
  });

  listeners.on('connection', (socket) => {
    socket.on(LISTENER_EVENT, async (data, ack) => {
      try {
        const event = await eventsService.createEvent(data, socket.data.device);

        if (event) {
          io.of('/live').to(`room:${event.roomId}`).emit(LIVE_EVENT, event);
        }
        ack({ success: true });
      } catch (error) {
        ack({ success: false, message: error.message });
      }
    });
  });
}
