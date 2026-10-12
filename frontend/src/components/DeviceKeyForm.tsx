import { useState } from "react";

interface DeviceKeyFormProps {
  deviceKey: string;
  onSave: (deviceKey: string) => void;
}

const DeviceKeyForm = ({ deviceKey, onSave }: DeviceKeyFormProps) => {
  const [value, setValue] = useState(deviceKey);

  return (
    <form
      className="device-key-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value.trim());
      }}
    >
      <label htmlFor="device-key">מפתח מכשיר</label>
      <input
        id="device-key"
        dir="ltr"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">שמור</button>
    </form>
  );
};

export default DeviceKeyForm;
