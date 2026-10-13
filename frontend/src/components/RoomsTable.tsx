import type { Room } from "../types/room";
import type { Device } from "../types/device";
import type { ManagedUser } from "../types/user";

interface RoomsTableProps {
  rooms: Room[];
  devices: Device[];
  users: ManagedUser[];
  editingId: string | null;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

const RoomsTable = ({
  rooms,
  devices,
  users,
  editingId,
  onEdit,
  onDelete,
}: RoomsTableProps) => {
  if (rooms.length === 0) {
    return <p className="note">עוד אין חדרים. מתחילים בהוספת חדר בטופס.</p>;
  }

  const getViewerNames = (roomId: string) =>
    users
      .filter((user) => user.role === "viewer" && user.roomIds.includes(roomId))
      .map((user) => user.name)
      .join(", ");

  return (
    <table className="devices-table">
      <thead>
        <tr>
          <th>חדר</th>
          <th>מכשירים</th>
          <th>צופים</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => {
          const devicesCount = devices.filter(
            (device) => device.roomId === room.id,
          ).length;
          const isEditing = room.id === editingId;
          return (
            <tr key={room.id} className={isEditing ? "editing" : ""}>
              <td>{room.name}</td>
              <td>
                {devicesCount > 0 ? (
                  devicesCount
                ) : (
                  <span className="badge off">אין מכשיר</span>
                )}
              </td>
              <td>{getViewerNames(room.id) || "–"}</td>
              <td className="row-actions">
                <button disabled={isEditing} onClick={() => onEdit(room)}>
                  {isEditing ? "בעריכה…" : "ערוך"}
                </button>
                <button className="danger" onClick={() => onDelete(room)}>
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

export default RoomsTable;
