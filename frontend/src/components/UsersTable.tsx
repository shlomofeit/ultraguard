import type { ManagedUser, UserRole } from "../types/user";
import type { Room } from "../types/room";

interface UsersTableProps {
  users: ManagedUser[];
  rooms: Room[];
  currentUserId: string;
  onRoomsChange: (user: ManagedUser, roomIds: string[]) => void;
  onRoleChange: (user: ManagedUser, role: UserRole) => void;
}

const UsersTable = ({
  users,
  rooms,
  currentUserId,
  onRoomsChange,
  onRoleChange,
}: UsersTableProps) => {
  if (users.length === 0) {
    return <p>עוד אין משתמשים</p>;
  }

  const handleRoomToggle = (user: ManagedUser, roomId: string) => {
    const roomIds = user.roomIds.includes(roomId)
      ? user.roomIds.filter((id) => id !== roomId)
      : [...user.roomIds, roomId];
    onRoomsChange(user, roomIds);
  };

  return (
    <table className="devices-table">
      <thead>
        <tr>
          <th>שם</th>
          <th>אימייל</th>
          <th>תפקיד</th>
          <th>חדרים שהוא רואה</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td dir="ltr">{user.email}</td>
            <td>
              <select
                value={user.role}
                disabled={user.id === currentUserId}
                onChange={(e) => onRoleChange(user, e.target.value as UserRole)}
              >
                <option value="viewer">צופה</option>
                <option value="admin">מנהל</option>
              </select>
            </td>
            <td>
              {user.role === "admin" ? (
                "כל החדרים"
              ) : (
                <div className="row-actions">
                  {rooms.map((room) => (
                    <label key={room.id} className="check">
                      <input
                        type="checkbox"
                        checked={user.roomIds.includes(room.id)}
                        onChange={() => handleRoomToggle(user, room.id)}
                      />
                      {room.name}
                    </label>
                  ))}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UsersTable;
