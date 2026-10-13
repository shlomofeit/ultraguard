import { useState } from "react";
import type { Room } from "../types/room";
import type {
  ManagedUser,
  ManagedUserInput,
  UserFormErrors,
  UserRole,
} from "../types/user";

interface UserFormProps {
  user: ManagedUser;
  rooms: Room[];
  isSelf: boolean;
  isLoading: boolean;
  onSubmit: (input: ManagedUserInput) => void;
  onCancel: () => void;
}

const validateUserForm = (values: ManagedUserInput): UserFormErrors => {
  const errors: UserFormErrors = {};
  if (values.name.trim().length < 2) {
    errors.name = "שם צריך להכיל לפחות 2 תווים";
  }
  return errors;
};

const UserForm = ({
  user,
  rooms,
  isSelf,
  isLoading,
  onSubmit,
  onCancel,
}: UserFormProps) => {
  const [values, setValues] = useState<ManagedUserInput>({
    name: user.name,
    role: user.role,
    roomIds: user.roomIds,
  });
  const [errors, setErrors] = useState<UserFormErrors>({});

  const handleRoomToggle = (roomId: string) => {
    setValues((current) => ({
      ...current,
      roomIds: current.roomIds.includes(roomId)
        ? current.roomIds.filter((id) => id !== roomId)
        : [...current.roomIds, roomId],
    }));
  };

  const handleSubmit = () => {
    const formErrors = validateUserForm(values);
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      onSubmit({ ...values, name: values.name.trim() });
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
      <label htmlFor="user-name">שם</label>
      <input
        id="user-name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      {errors.name && <p className="form-error">{errors.name}</p>}

      <label htmlFor="user-role">תפקיד</label>
      <select
        id="user-role"
        value={values.role}
        disabled={isSelf}
        onChange={(e) =>
          setValues({ ...values, role: e.target.value as UserRole })
        }
      >
        <option value="viewer">צופה</option>
        <option value="admin">מנהל</option>
      </select>
      {isSelf && <p className="note">אי אפשר לשנות את התפקיד של עצמך.</p>}

      {values.role === "viewer" ? (
        <>
          <label>חדרים שהמשתמש רואה</label>
          <div className="row-actions">
            {rooms.map((room) => (
              <label key={room.id} className="check">
                <input
                  type="checkbox"
                  checked={values.roomIds.includes(room.id)}
                  onChange={() => handleRoomToggle(room.id)}
                />
                {room.name}
              </label>
            ))}
          </div>
        </>
      ) : (
        <p className="note">מנהל רואה את כל החדרים.</p>
      )}

      <div className="row-actions">
        <button type="submit" className="primary" disabled={isLoading}>
          שמור
        </button>
        <button type="button" onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
};

export default UserForm;
