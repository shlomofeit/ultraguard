import type { ManagedUser } from "../types/user";
import type { Room } from "../types/room";

interface UsersTableProps {
  users: ManagedUser[];
  rooms: Room[];
  currentUserId: string;
  editingId: string | null;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}

const UsersTable = ({
  users,
  rooms,
  currentUserId,
  editingId,
  onEdit,
  onDelete,
}: UsersTableProps) => {
  if (users.length === 0) {
    return <p className="note">עוד אין משתמשים</p>;
  }

  const getRoomNames = (user: ManagedUser) => {
    if (user.role === "admin") {
      return "כל החדרים";
    }
    const names = rooms
      .filter((room) => user.roomIds.includes(room.id))
      .map((room) => room.name);
    return names.length > 0 ? names.join(", ") : "אין חדרים";
  };

  return (
    <table className="devices-table">
      <thead>
        <tr>
          <th>שם</th>
          <th>אימייל</th>
          <th>תפקיד</th>
          <th>חדרים</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          const isEditing = user.id === editingId;
          return (
            <tr key={user.id} className={isEditing ? "editing" : ""}>
              <td>{isSelf ? `${user.name} (אתה)` : user.name}</td>
              <td dir="ltr">{user.email}</td>
              <td>{user.role === "admin" ? "מנהל" : "צופה"}</td>
              <td>{getRoomNames(user)}</td>
              <td className="row-actions">
                <button disabled={isEditing} onClick={() => onEdit(user)}>
                  {isEditing ? "בעריכה…" : "ערוך"}
                </button>
                <button
                  className="danger"
                  disabled={isSelf}
                  title={isSelf ? "אי אפשר למחוק את עצמך" : undefined}
                  onClick={() => onDelete(user)}
                >
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

export default UsersTable;
