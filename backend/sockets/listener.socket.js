import {
  LISTENER_EVENT,
  LISTENER_HEARTBEAT,
  LIVE_ALERT,
  LIVE_EVENT,
  LIVE_ROOM_STATUS,
} from "../utils/socketEvents.js";
import { alertsService, ALERT_GRACE_MS } from "../services/alerts.service.js";
import { eventsService } from "../services/events.service.js";
import { devicesService } from "../services/devices.service.js";
import { presenceService } from "../services/presence.service.js";
import { roomsService } from "../services/rooms.service.js";

const STATUS_CHECK_MS = 5000;

export function registerListenerSocket(io) {
  const listeners = io.of("/listener");

  const sendRoomStatus = async (roomStatus) => {
    const { roomId } = roomStatus;
    io.of("/live")
      .to([`room:${roomId}`, `status:${roomId}`])
      .emit(LIVE_ROOM_STATUS, roomStatus);

    const alert = await alertsService.createStatusAlert(roomStatus, Date.now());

    if (alert) {
      io.of("/live").to(`status:${roomId}`).emit(LIVE_ALERT, alert);
    }
  };

  const sendRoomStatuses = async () => {
    try {
      for (const status of presenceService.getChangedStatuses(Date.now())) {
        const roomStatus = await roomsService.getRoomStatus(status.roomId);

        if (roomStatus) {
          await sendRoomStatus(roomStatus);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const checkAllRooms = async () => {
    try {
      for (const roomStatus of await roomsService.getAllRoomsStatus()) {
        await sendRoomStatus(roomStatus);
      }
    } catch (error) {
      console.error(error);
    }
  };

  setInterval(sendRoomStatuses, STATUS_CHECK_MS);
  setTimeout(checkAllRooms, ALERT_GRACE_MS);

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
    presenceService.connectDevice(socket.id, socket.data.device, Date.now());
    sendRoomStatuses();

    socket.on("disconnect", () => {
      presenceService.disconnectDevice(socket.id);
      sendRoomStatuses();
    });

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
        const heartbeat = await devicesService.recordHeartbeat(
          socket.data.device.id,
          data,
        );
        presenceService.recordHeartbeat(socket.id, heartbeat, Date.now());
        sendRoomStatuses();
        ack({ success: true });
      } catch (error) {
        ack({ success: false, message: error.message });
      }
    });
  });
}
