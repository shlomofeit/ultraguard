import { useState } from "react";
import type { Room } from "../types/room";
import type {
  DeviceFormErrors,
  DeviceInput,
  DeviceKind,
} from "../types/device";

interface DeviceFormProps {
  rooms: Room[];
  isLoading: boolean;
  onSubmit: (input: DeviceInput) => void;
}

const validateDeviceForm = (values: DeviceInput): DeviceFormErrors => {
  const errors: DeviceFormErrors = {};
  if (!values.roomId) {
    errors.roomId = "צריך לבחור חדר";
  }
  if (values.name.trim().length < 2) {
    errors.name = "שם מכשיר צריך להכיל לפחות 2 תווים";
  }
  return errors;
};

const DeviceForm = ({ rooms, isLoading, onSubmit }: DeviceFormProps) => {
  const [values, setValues] = useState<DeviceInput>({
    roomId: "",
    name: "",
    kind: "browser",
  });
  const [errors, setErrors] = useState<DeviceFormErrors>({});

  const handleChange = (field: keyof DeviceInput, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = () => {
    const formErrors = validateDeviceForm(values);
    setErrors(formErrors);
    if (Object.keys(formErrors).length === 0) {
      onSubmit({ ...values, name: values.name.trim() });
      setValues((current) => ({ ...current, name: "" }));
    }
  };

  return (
    <form
      className="device-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor="device-room">חדר</label>
      <select
        id="device-room"
        value={values.roomId}
        onChange={(e) => handleChange("roomId", e.target.value)}
      >
        <option value="">בחר חדר</option>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>
            {room.name}
          </option>
        ))}
      </select>
      {errors.roomId && <p className="form-error">{errors.roomId}</p>}

      <label htmlFor="device-name">שם המכשיר</label>
      <input
        id="device-name"
        value={values.name}
        onChange={(e) => handleChange("name", e.target.value)}
      />
      {errors.name && <p className="form-error">{errors.name}</p>}

      <label htmlFor="device-kind">סוג</label>
      <select
        id="device-kind"
        value={values.kind}
        onChange={(e) => handleChange("kind", e.target.value as DeviceKind)}
      >
        <option value="browser">דפדפן</option>
        <option value="python">Python</option>
      </select>

      <button type="submit" disabled={isLoading}>
        צור מכשיר
      </button>
    </form>
  );
};

export default DeviceForm;
