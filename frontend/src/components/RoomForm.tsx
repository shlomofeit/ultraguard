import { useState } from "react";
import type { RoomInput } from "../types/room";

interface RoomFormProps {
  isLoading: boolean;
  onSubmit: (input: RoomInput) => void;
}

const RoomForm = ({ isLoading, onSubmit }: RoomFormProps) => {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      setError("שם חדר צריך להכיל לפחות 2 תווים");
      return;
    }
    setError(null);
    onSubmit({ name: name.trim() });
    setName("");
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
      <label htmlFor="room-name">שם חדר חדש</label>
      <input
        id="room-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {error && <p className="form-error">{error}</p>}
      <button type="submit" disabled={isLoading}>
        הוסף חדר
      </button>
    </form>
  );
};

export default RoomForm;
