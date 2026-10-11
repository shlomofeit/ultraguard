import type { Socket } from "socket.io-client";
import type { EventInput, SocketAck } from "../types/event";
import { LISTENER_EVENT } from "../utils/socketEvents";

export const ACK_TIMEOUT_MS = 5000;
export const RETRY_MS = 5000;
export const MAX_QUEUE_SIZE = 500;

export interface SenderStatus {
  isConnected: boolean;
  queueSize: number;
}

export interface Sender {
  sendEvent: (event: EventInput) => void;
  stop: () => void;
}

export const createSender = (
  socket: Socket,
  onStatus: (status: SenderStatus) => void,
): Sender => {
  const queue: EventInput[] = [];
  let isSending = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const reportStatus = () => {
    onStatus({ isConnected: socket.connected, queueSize: queue.length });
  };

  const scheduleRetry = () => {
    if (retryTimer) {
      return;
    }
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void flush();
    }, RETRY_MS);
  };

  const flush = async () => {
    if (isSending) {
      return;
    }
    isSending = true;
    while (queue.length > 0 && socket.connected) {
      try {
        const ack: SocketAck = await socket
          .timeout(ACK_TIMEOUT_MS)
          .emitWithAck(LISTENER_EVENT, queue[0]);
        if (!ack.success) {
          scheduleRetry();
          break;
        }
        queue.shift();
        reportStatus();
      } catch {
        scheduleRetry();
        break;
      }
    }
    isSending = false;
  };

  socket.on("connect", () => {
    reportStatus();
    void flush();
  });
  socket.on("disconnect", reportStatus);

  const sendEvent = (event: EventInput) => {
    queue.push(event);
    if (queue.length > MAX_QUEUE_SIZE) {
      queue.shift();
    }
    reportStatus();
    void flush();
  };

  const stop = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
    }
    socket.disconnect();
  };

  return { sendEvent, stop };
};
