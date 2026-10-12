import { useRef, useState } from "react";

interface DeviceKeyBoxProps {
  deviceKey: string;
  onHide: () => void;
}

const DeviceKeyBox = ({ deviceKey, onHide }: DeviceKeyBoxProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(deviceKey);
      setCopyMessage("הועתק");
    } catch {
      if (codeRef.current) {
        window.getSelection()?.selectAllChildren(codeRef.current);
      }
      setCopyMessage("המפתח מסומן. העתק אותו עם Ctrl+C");
    }
  };

  return (
    <div className="device-key">
      <p>
        זה מפתח המכשיר. הוא מוצג רק עכשיו. מעתיקים אותו לדף ההאזנה במכשיר:
      </p>
      <code ref={codeRef} dir="ltr">
        {deviceKey}
      </code>
      <div className="row-actions">
        <button onClick={handleCopy}>העתק</button>
        <button onClick={onHide}>הסתר</button>
        {copyMessage && <span className="note">{copyMessage}</span>}
      </div>
    </div>
  );
};

export default DeviceKeyBox;
