import {
  LISTENER_EVENT,
  LISTENER_HEARTBEAT,
  LIVE_EVENT,
} from "../utils/socketEvents.js";
import { eventsService } from "../services/events.service.js";
import { devicesService } from "../services/devices.service.js";

export function registerListenerSocket(io) {
  const listeners = io.of("/listener");

  listeners.use(async (socket, next) => {
    try {
      const device = await devicesService.getDeviceByKey(
        socket.handshake.auth.deviceKey,
      );

      if (!device) {
        next(new Error("Invalid device key!"));
        return;
      }

      socket.data.device = device;
      next();
    } catch (error) {
      next(error);
    }
  });

  listeners.on("connection", (socket) => {
    socket.on(LISTENER_EVENT, async (data, ack) => {
      try {
        const event = await eventsService.createEvent(data, socket.data.device);

        if (event) {
          io.of("/live").to(`room:${event.roomId}`).emit(LIVE_EVENT, event);
        }
        ack({ success: true });
      } catch (error) {
        ack({ success: false, message: error.message });
      }
    });

    socket.on(LISTENER_HEARTBEAT, async (data, ack) => {
      try {
        await devicesService.recordHeartbeat(socket.data.device.id, data);
        ack({ success: true });
      } catch (error) {
        ack({ success: false, message: error.message });
      }
    });
  });
}
