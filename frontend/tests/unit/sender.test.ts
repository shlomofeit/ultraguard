import { afterEach, describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io-client";
import { RETRY_MS, createSender } from "../../src/listener/sender";
import type {
  EventInput,
  HeartbeatInput,
  SocketAck,
} from "../../src/types/event";
import { LISTENER_HEARTBEAT } from "../../src/utils/socketEvents";

const makeEvent = (id: string): EventInput => ({
  id,
  startedAt: "2026-10-11T08:00:00.000Z",
  durationMs: 960,
  type: "silverpush",
  confidence: 1,
  peakFreqHz: 18000,
  freqsHz: [18000, 18500],
  snrDb: 30,
  payload: null,
  sampleRate: 44100,
});

const makeFakeSocket = (isConnected: boolean) => {
  const handlers = new Map<string, (reason?: string) => void>();
  const sent: string[] = [];
  const names: string[] = [];
  const answers: SocketAck[] = [];
  const fake = {
    connected: isConnected,
    active: true,
    on: (name: string, handler: (reason?: string) => void) =>
      handlers.set(name, handler),
    disconnect: vi.fn(),
    timeout: () => ({
      emitWithAck: async (name: string, event: EventInput) => {
        names.push(name);
        sent.push(event.id);
        return answers.shift() ?? { success: true };
      },
    }),
  };
  const connect = () => {
    fake.connected = true;
    handlers.get("connect")?.();
  };
  const reject = () => {
    fake.active = false;
    handlers.get("connect_error")?.();
  };
  const drop = (reason: string) => {
    fake.connected = false;
    handlers.get("disconnect")?.(reason);
  };
  return {
    socket: fake as unknown as Socket,
    sent,
    names,
    answers,
    connect,
    reject,
    drop,
  };
};

const waitForQueue = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("sender", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports a rejected key when the server disconnects the device", () => {
    const { socket, drop } = makeFakeSocket(true);
    const onStatus = vi.fn();
    createSender(socket, onStatus);

    drop("io server disconnect");

    expect(onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ isConnected: false, isRejected: true }),
    );
  });

  it("does not report a rejected key when the network drops", () => {
    const { socket, drop } = makeFakeSocket(true);
    const onStatus = vi.fn();
    createSender(socket, onStatus);

    drop("transport close");

    expect(onStatus).toHaveBeenLastCalledWith(
      expect.objectContaining({ isRejected: false }),
    );
  });

  it("sends an event and empties the queue on success", async () => {
    const { socket, sent } = makeFakeSocket(true);
    const onStatus = vi.fn();
    const sender = createSender(socket, onStatus);

    sender.sendEvent(makeEvent("a"));
    await waitForQueue();

    expect(sent).toEqual(["a"]);
    expect(onStatus).toHaveBeenLastCalledWith({
      isConnected: true,
      isRejected: false,
      queueSize: 0,
    });
  });

  it("keeps a failed event and sends it again with the same id", async () => {
    vi.useFakeTimers();
    const { socket, sent, answers } = makeFakeSocket(true);
    answers.push({ success: false, message: "Database is down!" });
    const onStatus = vi.fn();
    const sender = createSender(socket, onStatus);

    sender.sendEvent(makeEvent("a"));
    await vi.advanceTimersByTimeAsync(0);
    expect(onStatus).toHaveBeenLastCalledWith({
      isConnected: true,
      isRejected: false,
      queueSize: 1,
    });

    await vi.advanceTimersByTimeAsync(RETRY_MS);
    expect(sent).toEqual(["a", "a"]);
    expect(onStatus).toHaveBeenLastCalledWith({
      isConnected: true,
      isRejected: false,
      queueSize: 0,
    });
  });

  it("holds events while offline and sends them in order on connect", async () => {
    const { socket, sent, connect } = makeFakeSocket(false);
    const sender = createSender(socket, vi.fn());

    sender.sendEvent(makeEvent("a"));
    sender.sendEvent(makeEvent("b"));
    await waitForQueue();
    expect(sent).toEqual([]);

    connect();
    await waitForQueue();
    expect(sent).toEqual(["a", "b"]);
  });

  it("sends a heartbeat only while connected", async () => {
    const heartbeat: HeartbeatInput = {
      sentAt: "2026-10-12T08:00:00.000Z",
      framesProcessed: 430,
      audioState: "running",
      isMicLive: true,
      queueSize: 0,
    };
    const offline = makeFakeSocket(false);
    createSender(offline.socket, vi.fn()).sendHeartbeat(heartbeat);
    await waitForQueue();
    expect(offline.names).toEqual([]);

    const online = makeFakeSocket(true);
    createSender(online.socket, vi.fn()).sendHeartbeat(heartbeat);
    await waitForQueue();
    expect(online.names).toEqual([LISTENER_HEARTBEAT]);
  });

  it("reports when the server rejects the device key", () => {
    const { socket, reject } = makeFakeSocket(false);
    const onStatus = vi.fn();
    createSender(socket, onStatus);

    reject();

    expect(onStatus).toHaveBeenLastCalledWith({
      isConnected: false,
      isRejected: true,
      queueSize: 0,
    });
  });
});
