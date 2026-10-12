import type { Room } from "../types/room";

interface RoomsListProps {
  rooms: Room[];
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
}

const RoomsList = ({ rooms, onEdit, onDelete }: RoomsListProps) => {
  if (rooms.length === 0) {
    return <p>עוד אין חדרים</p>;
  }

  return (
    <ul className="room-chips">
      {rooms.map((room) => (
        <li key={room.id}>
          {room.name}
          <button onClick={() => onEdit(room)}>ערוך</button>
          <button onClick={() => onDelete(room)}>מחק</button>
        </li>
      ))}
    </ul>
  );
};

export default RoomsList;
