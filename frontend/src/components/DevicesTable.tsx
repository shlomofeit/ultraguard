import type { Device } from "../types/device";
import type { Room } from "../types/room";
import { formatTimeAgo } from "../utils/formatTimeAgo";

interface DevicesTableProps {
  devices: Device[];
  rooms: Room[];
  editingId: string | null;
  onEdit: (device: Device) => void;
  onRevoke: (device: Device) => void;
  onDelete: (device: Device) => void;
}

const ONLINE_MS = 30 * 1000;

const getBadge = (device: Device, nowMs: number) => {
  if (device.revokedAt) {
    return <span className="badge bad">בוטל</span>;
  }
  if (!device.lastSeenAt) {
    return <span className="badge off">ממתין</span>;
  }
  const isOnline = nowMs - new Date(device.lastSeenAt).getTime() < ONLINE_MS;
  if (!isOnline) {
    return <span className="badge off">לא מחובר</span>;
  }
  return <span className="badge ok">מחובר</span>;
};

const DevicesTable = ({
  devices,
  rooms,
  editingId,
  onEdit,
  onRevoke,
  onDelete,
}: DevicesTableProps) => {
  if (devices.length === 0) {
    return <p className="note">עוד אין מכשירים</p>;
  }

  const nowMs = Date.now();

  const getRoomName = (roomId: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "–";

  return (
    <table className="devices-table">
      <thead>
        <tr>
          <th>מכשיר</th>
          <th>חדר</th>
          <th>נראה לאחרונה</th>
          <th>מצב</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((device) => {
          const isEditing = device.id === editingId;
          return (
            <tr key={device.id} className={isEditing ? "editing" : ""}>
              <td>{device.name}</td>
              <td>{getRoomName(device.roomId)}</td>
              <td>{formatTimeAgo(device.lastSeenAt, nowMs)}</td>
              <td>{getBadge(device, nowMs)}</td>
              <td className="row-actions">
                <button disabled={isEditing} onClick={() => onEdit(device)}>
                  {isEditing ? "בעריכה…" : "ערוך"}
                </button>
                {!device.revokedAt && (
                  <button onClick={() => onRevoke(device)}>בטל מפתח</button>
                )}
                <button className="danger" onClick={() => onDelete(device)}>
                  מחק
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DevicesTable;
