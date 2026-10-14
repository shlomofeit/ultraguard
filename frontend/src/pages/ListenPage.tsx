import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useListenerStore } from "../store/listenerStore";
import { useRoomStatusStore } from "../store/roomStatusStore";
import RoomCard from "../components/RoomCard";
import DetectionList from "../components/DetectionList";
import DeviceKeyForm from "../components/DeviceKeyForm";
import DeviceKeyCard from "../components/DeviceKeyCard";
import Radar from "../components/Radar";
import Spectrum from "../components/Spectrum";
import LiveWave from "../components/LiveWave";

const ListenPage = () => {
  const isListening = useListenerStore((state) => state.isListening);
  const isLoading = useListenerStore((state) => state.isLoading);
  const error = useListenerStore((state) => state.error);
  const sampleRate = useListenerStore((state) => state.sampleRate);
  const analyser = useListenerStore((state) => state.analyser);
  const startedAtMs = useListenerStore((state) => state.startedAtMs);
  const detections = useListenerStore((state) => state.detections);
  const isMicDeaf = useListenerStore((state) => state.isMicDeaf);
  const setStartListening = useListenerStore(
    (state) => state.setStartListening,
  );
  const setStopListening = useListenerStore((state) => state.setStopListening);
  const removeDetections = useListenerStore((state) => state.removeDetections);
  const isConnected = useListenerStore((state) => state.isConnected);
  const queueSize = useListenerStore((state) => state.queueSize);
  const isRejected = useListenerStore((state) => state.isRejected);
  const deviceKey = useListenerStore((state) => state.deviceKey);
  const keyStatus = useListenerStore((state) => state.keyStatus);
  const keyInfo = useListenerStore((state) => state.keyInfo);
  const keyError = useListenerStore((state) => state.keyError);
  const setDeviceKey = useListenerStore((state) => state.setDeviceKey);
  const setCheckedDeviceKey = useListenerStore(
    (state) => state.setCheckedDeviceKey,
  );
  const removeDeviceKey = useListenerStore((state) => state.removeDeviceKey);
  const statuses = useRoomStatusStore((state) => state.statuses);
  const location = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const keyFromLink = new URLSearchParams(location.hash.slice(1)).get("key");
    if (!keyFromLink) {
      setCheckedDeviceKey();
      return;
    }
    nav("/listen", { replace: true });
    if (!isListening) {
      removeDeviceKey();
      setDeviceKey(keyFromLink);
    }
  }, [
    location.hash,
    isListening,
    nav,
    setDeviceKey,
    setCheckedDeviceKey,
    removeDeviceKey,
  ]);

  const isKeyFormVisible = !deviceKey;
  const deviceRoom = statuses.find(
    (status) => status.roomName === keyInfo?.roomName,
  );

  const handleOpenRoom = (roomId: string) => {
    nav(`/stats?room=${roomId}`);
  };

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
          <LiveWave analyser={analyser} />
          {getStatusText()}
        </span>
      </header>

      {error && <p className="form-error">{error}</p>}
      {isMicDeaf && (
        <p className="form-error">
          המיקרופון של המכשיר הזה לא קולט תדרים מעל 17 קילו-הרץ, ולכן הוא לא
          יכול לזהות ביקונים. כדאי להאזין מטלפון.
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
          {deviceRoom && (
            <div className="device-room">
              <h2>החדר של המכשיר הזה</h2>
              <RoomCard
                status={deviceRoom}
                nowMs={Date.now()}
                onOpen={handleOpenRoom}
              />
            </div>
          )}
          <h2>מפתח מכשיר</h2>
          {isKeyFormVisible ? (
            <>
              <p className="note">
                מקבלים אותו מהמנהל בדף הניהול. נשמר בדפדפן הזה בלבד.
              </p>
              <DeviceKeyForm
                isChecking={keyStatus === "checking"}
                error={keyError}
                onSubmit={setDeviceKey}
              />
            </>
          ) : (
            <DeviceKeyCard
              deviceKey={deviceKey}
              keyInfo={keyInfo}
              status={keyStatus}
              canReplace={!isListening}
              onReplace={removeDeviceKey}
            />
          )}
        </section>
      </div>

      <section className="glass panel">
        <div className="panel-head">
          <h2>גרף מיקרופון חי</h2>
          <small>
            דיבור ורעשים נשארים מתחת ל-16 קילו-הרץ. ביקון מופיע באזור המודגש.
          </small>
        </div>
        <Spectrum analyser={analyser} sampleRate={sampleRate} />
      </section>

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
