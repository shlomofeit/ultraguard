import { afterEach, describe, expect, it, vi } from "vitest";
import { telegramService } from "../../services/telegram.service.js";

describe("telegramService", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing when there is no bot token", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const isSent = await telegramService.sendMessage("hello");

    expect(isSent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the message to the chat", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token-1");
    vi.stubEnv("TELEGRAM_CHAT_ID", "chat-1");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const isSent = await telegramService.sendMessage("hello");

    const [url, options] = fetchMock.mock.calls[0];
    expect(isSent).toBe(true);
    expect(url).toBe("https://api.telegram.org/bottoken-1/sendMessage");
    expect(JSON.parse(options.body)).toEqual({
      chat_id: "chat-1",
      text: "hello",
    });
  });

  it("does not throw when Telegram cannot be reached", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "token-1");
    vi.stubEnv("TELEGRAM_CHAT_ID", "chat-1");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const isSent = await telegramService.sendMessage("hello");

    expect(isSent).toBe(false);
  });
});
