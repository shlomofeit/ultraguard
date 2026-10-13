import {
  LIVE_ROOM_STATUS,
  LIVE_UNWATCH,
  LIVE_WATCH,
} from '../utils/socketEvents.js';
import { authService } from '../services/auth.service.js';
import { roomsService } from '../services/rooms.service.js';
import { readCookie } from '../utils/readCookie.js';

export function registerLiveSocket(io) {
  const viewers = io.of('/live');

  viewers.use(async (socket, next) => {
    try {
      const token = readCookie(socket.handshake.headers.cookie, 'token');
      socket.data.user = await authService.getUserFromToken(token);
      next();
    } catch (error) {
      next(error);
    }
  });

  viewers.on('connection', async (socket) => {
    socket.on(LIVE_WATCH, async (roomId) => {
      try {
        const canWatch = await roomsService.canAccessRoom(
          socket.data.user,
          roomId,
        );
        if (!canWatch) {
          return;
        }
      } catch (error) {
        console.error(error);
        return;
      }

      socket.join(`room:${roomId}`);
      try {
        const roomStatus = await roomsService.getRoomStatus(roomId);
        socket.emit(LIVE_ROOM_STATUS, roomStatus);
      } catch (error) {
        console.error(error);
      }
    });

    socket.on(LIVE_UNWATCH, (roomId) => {
      socket.leave(`room:${roomId}`);
    });

    try {
      const rooms = await roomsService.getRooms(socket.data.user);
      socket.join(rooms.map((room) => `status:${room.id}`));
    } catch (error) {
      console.error(error);
    }
  });
}
