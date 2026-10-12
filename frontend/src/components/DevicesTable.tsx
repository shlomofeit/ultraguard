import type { Device } from "../types/device";
import type { Room } from "../types/room";

interface DevicesTableProps {
  devices: Device[];
  rooms: Room[];
  onRevoke: (device: Device) => void;
  onDelete: (device: Device) => void;
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("he-IL") : "–";

const DevicesTable = ({
  devices,
  rooms,
  onRevoke,
  onDelete,
}: DevicesTableProps) => {
  if (devices.length === 0) {
    return <p>עוד אין מכשירים</p>;
  }

  const getRoomName = (roomId: string) =>
    rooms.find((room) => room.id === roomId)?.name ?? "–";

  return (
    <table className="devices-table">
      <thead>
        <tr>
          <th>שם</th>
          <th>חדר</th>
          <th>סוג</th>
          <th>נראה לאחרונה</th>
          <th>מצב</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        {devices.map((device) => (
          <tr key={device.id}>
            <td>{device.name}</td>
            <td>{getRoomName(device.roomId)}</td>
            <td>{device.kind === "browser" ? "דפדפן" : "Python"}</td>
            <td>{formatDate(device.lastSeenAt)}</td>
            <td>{device.revokedAt ? "בוטל" : "פעיל"}</td>
            <td className="row-actions">
              {!device.revokedAt && (
                <button onClick={() => onRevoke(device)}>בטל מפתח</button>
              )}
              <button onClick={() => onDelete(device)}>מחק</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DevicesTable;
