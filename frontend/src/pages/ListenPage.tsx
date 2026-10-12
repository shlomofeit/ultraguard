import { useListenerStore } from "../store/listenerStore";
import DetectionList from "../components/DetectionList";
import DeviceKeyForm from "../components/DeviceKeyForm";
import Radar from "../components/Radar";

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
  const isRejected = useListenerStore((state) => state.isRejected);
  const deviceKey = useListenerStore((state) => state.deviceKey);
  const setDeviceKey = useListenerStore((state) => state.setDeviceKey);

  const isOnline = isListening && isConnected && !isRejected;

  const getStatusText = () => {
    if (!isListening) {
      return "לא מאזין";
    }
    return isOnline ? "מחובר לשרת" : "אין חיבור לשרת";
  };

  return (
    <main className="listen-page">
      <header className="page-head">
        <div>
          <h1>האזנה</h1>
          <p>
            המכשיר מאזין לתדרים 16 קילו-הרץ ומעלה. האודיו נבדק כאן במכשיר, לא
            נשמר ולא נשלח.
          </p>
        </div>
        <span className={isOnline ? "live on" : "live"}>
          <span className="live-dot" />
          {getStatusText()}
        </span>
      </header>

      {error && <p className="form-error">{error}</p>}
      {isRejected && (
        <p className="form-error">
          השרת דחה את מפתח המכשיר. בדוק אותו בדף הניהול.
        </p>
      )}

      <div className="listen-grid">
        <section className="glass scope">
          <Radar
            detections={detections}
            isListening={isListening}
            isLoading={isLoading}
            onToggle={isListening ? setStopListening : setStartListening}
          />
          <div className="readout">
            <span>
              קצב דגימה
              <strong dir="ltr">{sampleRate ? `${sampleRate} Hz` : "–"}</strong>
            </span>
            <span>
              זיהויים<strong>{detections.length}</strong>
            </span>
            <span>
              ממתינים לשליחה<strong>{queueSize}</strong>
            </span>
          </div>
          <p className="note">
            ברדאר: הזווית היא התדר, והמרחק מהמרכז הוא עוצמת האות.
          </p>
        </section>

        <section className="glass panel">
          <h2>מפתח מכשיר</h2>
          <p className="note">
            מקבלים אותו מהמנהל בדף הניהול. נשמר בדפדפן הזה בלבד.
          </p>
          {isListening ? (
            <p className="note">כדי להחליף מפתח, עצור קודם את ההאזנה.</p>
          ) : (
            <DeviceKeyForm deviceKey={deviceKey} onSave={setDeviceKey} />
          )}
        </section>
      </div>

      <section className="glass panel">
        <div className="panel-head">
          <h2>זיהויים במכשיר</h2>
          <button onClick={removeDetections}>נקה רשימה</button>
        </div>
        <div className="table-scroll">
          <DetectionList
            detections={detections}
            startedAtMs={startedAtMs ?? Date.now()}
          />
        </div>
      </section>
    </main>
  );
};

export default ListenPage;
