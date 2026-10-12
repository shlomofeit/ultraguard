import { afterEach, describe, expect, it, vi } from "vitest";
import type { Socket } from "socket.io-client";
import { RETRY_MS, createSender } from "../../src/listener/sender";
import type { EventInput, SocketAck } from "../../src/types/event";

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
  const handlers = new Map<string, () => void>();
  const sent: string[] = [];
  const answers: SocketAck[] = [];
  const fake = {
    connected: isConnected,
    active: true,
    on: (name: string, handler: () => void) => handlers.set(name, handler),
    disconnect: vi.fn(),
    timeout: () => ({
      emitWithAck: async (_name: string, event: EventInput) => {
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
  return { socket: fake as unknown as Socket, sent, answers, connect, reject };
};

const waitForQueue = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("sender", () => {
  afterEach(() => {
    vi.useRealTimers();
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
