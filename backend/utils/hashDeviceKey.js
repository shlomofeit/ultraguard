import crypto from "node:crypto";

export function hashDeviceKey(deviceKey) {
  const hash = crypto.createHash("sha256").update(deviceKey).digest("hex");
  return hash;
}
