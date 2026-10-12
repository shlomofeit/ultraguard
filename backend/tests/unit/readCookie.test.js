import { describe, expect, it } from "vitest";
import { readCookie } from "../../utils/readCookie.js";

describe("readCookie", () => {
  it("finds a cookie among others", () => {
    expect(readCookie("theme=dark; token=abc.def; refreshToken=xyz", "token")).toBe(
      "abc.def",
    );
  });

  it("keeps an equals sign inside the value", () => {
    expect(readCookie("token=abc==", "token")).toBe("abc==");
  });

  it("returns null when the cookie is missing or there are no cookies", () => {
    expect(readCookie("theme=dark", "token")).toBe(null);
    expect(readCookie(undefined, "token")).toBe(null);
  });
});
