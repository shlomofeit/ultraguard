import { useState } from "react";
import type { Room, RoomFormErrors, RoomInput } from "../types/room";

interface RoomFormProps {
  room: Room | null;
  isLoading: boolean;
  onSubmit: (input: RoomInput) => void;
  onCancel: () => void;
}

const validateRoomForm = (values: RoomInput): RoomFormErrors => {
  const errors: RoomFormErrors = {};
  if (values.name.trim().length < 2) {
    errors.name = "שם חדר צריך להכיל לפחות 2 תווים";
  }
  return errors;
};

const RoomForm = ({ room, isLoading, onSubmit, onCancel }: RoomFormProps) => {
  const [name, setName] = useState(room?.name ?? "");
  const [errors, setErrors] = useState<RoomFormErrors>({});

  const handleSubmit = () => {
    const formErrors = validateRoomForm({ name });
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      onSubmit({ name: name.trim() });
      setName("");
    }
  };

  return (
    <form
      className="room-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor="room-name">שם החדר</label>
      <input
        id="room-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {errors.name && <p className="form-error">{errors.name}</p>}
      <div className="row-actions">
        <button type="submit" className="primary" disabled={isLoading}>
          {room ? "שמור" : "הוסף חדר"}
        </button>
        {room && (
          <button type="button" onClick={onCancel}>
            ביטול
          </button>
        )}
      </div>
    </form>
  );
};

export default RoomForm;
