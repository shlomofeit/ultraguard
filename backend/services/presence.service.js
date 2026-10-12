export const HEARTBEAT_MS = 10000;
export const MISSED_HEARTBEATS = 3;

const connections = new Map();
const sentCounts = new Map();

function connectDevice(socketId, device, nowMs) {
  connections.set(socketId, {
    deviceId: device.id,
    roomId: device.roomId,
    lastHeartbeatAt: nowMs,
    isMicLive: true,
  });
}

function recordHeartbeat(socketId, heartbeat, nowMs) {
  const connection = connections.get(socketId);

  if (!connection) {
    return;
  }

  connection.lastHeartbeatAt = nowMs;
  connection.isMicLive = heartbeat.isMicLive;
}

function disconnectDevice(socketId) {
  connections.delete(socketId);
}

function getRoomStatus(roomId, nowMs) {
  const activeDeviceIds = new Set();

  for (const connection of connections.values()) {
    const isFresh =
      nowMs - connection.lastHeartbeatAt <= HEARTBEAT_MS * MISSED_HEARTBEATS;

    if (connection.roomId === roomId && connection.isMicLive && isFresh) {
      activeDeviceIds.add(connection.deviceId);
    }
  }

  return { roomId, activeDevices: activeDeviceIds.size };
}

function getChangedStatuses(nowMs) {
  const roomIds = new Set(sentCounts.keys());
  for (const connection of connections.values()) {
    roomIds.add(connection.roomId);
  }

  const changed = [];
  for (const roomId of roomIds) {
    const status = getRoomStatus(roomId, nowMs);

    if (sentCounts.get(roomId) !== status.activeDevices) {
      sentCounts.set(roomId, status.activeDevices);
      changed.push(status);
    }
  }

  return changed;
}

export const presenceService = {
  connectDevice,
  recordHeartbeat,
  disconnectDevice,
  getRoomStatus,
  getChangedStatuses,
};
