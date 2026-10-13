import type { DeviceKeyInfo, DeviceKeyStatus } from "../types/device";

interface DeviceKeyCardProps {
  deviceKey: string;
  keyInfo: DeviceKeyInfo | null;
  status: DeviceKeyStatus;
  canReplace: boolean;
  onReplace: () => void;
}

const VISIBLE_KEY_CHARS = 4;

const DeviceKeyCard = ({
  deviceKey,
  keyInfo,
  status,
  canReplace,
  onReplace,
}: DeviceKeyCardProps) => {
  const maskedKey = "•".repeat(16) + deviceKey.slice(-VISIBLE_KEY_CHARS);
  const isRevoked = status === "revoked";

  const getTitle = () => {
    if (isRevoked) {
      return "✗ המפתח בוטל";
    }
    if (status === "valid") {
      return "✓ מפתח תקין";
    }
    return "מפתח שמור";
  };

  const getText = () => {
    if (isRevoked) {
      return "המנהל ביטל את המפתח של המכשיר הזה. צריך מפתח חדש.";
    }
    if (status === "checking") {
      return "בודק את המפתח מול השרת…";
    }
    if (keyInfo) {
      return `המכשיר "${keyInfo.deviceName}" · חדר "${keyInfo.roomName}"`;
    }
    return "לא הצלחתי לבדוק אותו מול השרת. השרת יבדוק אותו כשמתחילים להאזין.";
  };

  return (
    <>
      <div className={isRevoked ? "key-status bad" : "key-status"}>
        <b>{getTitle()}</b>
        <span>{getText()}</span>
        <span className="mono" dir="ltr">
          {maskedKey}
        </span>
      </div>
      <div className="row-actions">
        <button
          className={isRevoked ? "primary" : ""}
          disabled={!canReplace}
          onClick={onReplace}
        >
          {isRevoked ? "הזן מפתח חדש" : "החלף מפתח"}
        </button>
        <span className="note">
          {canReplace
            ? "המפתח עצמו לא מוצג שוב. אפשר רק להזין חדש."
            : "כדי להחליף מפתח, עצור קודם את ההאזנה."}
        </span>
      </div>
    </>
  );
};

export default DeviceKeyCard;
