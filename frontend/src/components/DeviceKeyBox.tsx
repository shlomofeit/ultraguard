import { useRef, useState } from "react";

interface DeviceKeyBoxProps {
  deviceKey: string;
  onHide: () => void;
}

const DeviceKeyBox = ({ deviceKey, onHide }: DeviceKeyBoxProps) => {
  const codeRef = useRef<HTMLElement>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const activationLink = `${window.location.origin}/listen#key=${deviceKey}`;

  const handleCopy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(message);
    } catch {
      if (codeRef.current) {
        window.getSelection()?.selectAllChildren(codeRef.current);
      }
      setCopyMessage("המפתח מסומן. העתק אותו עם Ctrl+C");
    }
  };

  return (
    <div className="device-key">
      <p>זה מפתח המכשיר. הוא מוצג רק עכשיו.</p>
      <code ref={codeRef} dir="ltr">
        {deviceKey}
      </code>
      <div className="row-actions">
        <button onClick={() => handleCopy(activationLink, "הקישור הועתק")}>
          העתק קישור הפעלה
        </button>
        <button onClick={() => handleCopy(deviceKey, "המפתח הועתק")}>
          העתק מפתח
        </button>
        <button onClick={onHide}>הסתר</button>
      </div>
      {copyMessage && <span className="note">{copyMessage}</span>}
      <p className="note">
        שולחים את קישור ההפעלה לטלפון. פתיחה שלו מכניסה את המפתח לדף ההאזנה.
      </p>
    </div>
  );
};

export default DeviceKeyBox;
