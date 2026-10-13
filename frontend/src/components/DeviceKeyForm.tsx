import { useState } from "react";

interface DeviceKeyFormProps {
  isChecking: boolean;
  error: string | null;
  onSubmit: (deviceKey: string) => void;
}

const DeviceKeyForm = ({ isChecking, error, onSubmit }: DeviceKeyFormProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <form
      className="device-key-form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <label htmlFor="device-key">מפתח מכשיר</label>
      <input
        id="device-key"
        type="password"
        dir="ltr"
        autoComplete="off"
        placeholder="הדבק כאן את המפתח"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="primary"
        disabled={isChecking || !value.trim()}
      >
        {isChecking ? "בודק…" : "בדוק ושמור"}
      </button>
    </form>
  );
};

export default DeviceKeyForm;
