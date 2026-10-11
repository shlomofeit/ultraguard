import { useEffect } from "react";
import { useListenerStore } from "../store/listenerStore";
import DetectionList from "../components/DetectionList";

const ListenPage = () => {
  const isListening = useListenerStore((state) => state.isListening);
  const isLoading = useListenerStore((state) => state.isLoading);
  const error = useListenerStore((state) => state.error);
  const sampleRate = useListenerStore((state) => state.sampleRate);
  const startedAtMs = useListenerStore((state) => state.startedAtMs);
  const detections = useListenerStore((state) => state.detections);
  const setStartListening = useListenerStore(
    (state) => state.setStartListening,
  );
  const setStopListening = useListenerStore((state) => state.setStopListening);
  const removeDetections = useListenerStore((state) => state.removeDetections);
  const isConnected = useListenerStore((state) => state.isConnected);
  const queueSize = useListenerStore((state) => state.queueSize);

  useEffect(() => {
    return () => setStopListening();
  }, [setStopListening]);

  return (
    <main className="listen-page">
      <h1>מצב האזנה</h1>
      <p>
        המכשיר מאזין לתדרים 16 קילו-הרץ ומעלה, ומציג כל שידור שזוהה. האודיו נבדק
        לוקאלית ולא נשמר וכמובן לא נשלח.
      </p>

      {isListening ? (
        <button onClick={setStopListening}>עצור האזנה</button>
      ) : (
        <button onClick={setStartListening} disabled={isLoading}>
          {isLoading ? "מפעיל..." : "התחל האזנה"}
        </button>
      )}
      <button onClick={removeDetections}>נקה רשימה</button>

      {error && <p className="form-error">{error}</p>}
      {sampleRate && <p>קצב דגימה: {sampleRate} Hz</p>}
      {isListening && (
        <p>
          {isConnected ? "מחובר לשרת" : "אין חיבור לשרת"}
          {queueSize > 0 && ` · ${queueSize} אירועים מחכים לשליחה`}
        </p>
      )}

      <DetectionList
        detections={detections}
        startedAtMs={startedAtMs ?? Date.now()}
      />
    </main>
  );
};

export default ListenPage;
