export type DeviceKind = "browser" | "python";

export interface DeviceInput {
  roomId: string;
  name: string;
  kind: DeviceKind;
}

export interface Device extends DeviceInput {
  id: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

export interface CreatedDevice {
  device: Device;
  deviceKey: string;
}

export interface DeviceFormErrors {
  roomId?: string;
  name?: string;
}
