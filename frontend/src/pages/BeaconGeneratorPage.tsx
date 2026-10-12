import { useEffect, useState } from "react";
import type {
  BeaconFormErrors,
  BeaconFormValues,
  BeaconType,
} from "../types/beacon";
import { BEACON_LABELS, TEXT_BEACONS, getRepeatMs } from "../listener/beacons";
import { buildSegments, getDurationMs } from "../listener/beaconGenerator";
import { startBeacon, stopBeacon } from "../listener/beaconPlayer";

const BEACON_TYPES = Object.keys(BEACON_LABELS) as BeaconType[];

const validateBeacon = (values: BeaconFormValues): BeaconFormErrors => {
  const errors: BeaconFormErrors = {};
  if (TEXT_BEACONS.includes(values.type) && values.text.trim() === "") {
    errors.text = "צריך תוכן לשידור";
  }
  return errors;
};

const BeaconGeneratorPage = () => {
  const [values, setValues] = useState<BeaconFormValues>({
    type: "silverpush",
    text: "UG01",
  });
  const [errors, setErrors] = useState<BeaconFormErrors>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const isTextBeacon = TEXT_BEACONS.includes(values.type);
  const segments = buildSegments(values.type, values.text);
  const durationMs = getDurationMs(segments);
  const allFreqs = segments.flatMap((s) =>
    s.kind === "tones" ? s.freqsHz : [s.fromHz, s.toHz],
  );
  const freqs = [...new Set(allFreqs)].sort((a, b) => a - b);

  useEffect(() => {
    return () => stopBeacon();
  }, []);

  const handleTypeChange = (type: BeaconType) => {
    setValues({ ...values, type });
    if (isPlaying) {
      stopBeacon();
      setIsPlaying(false);
    }
  };

  const handleStart = async () => {
    const newErrors = validateBeacon(values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    try {
      setStartError(null);
      const rate = await startBeacon(values.type, values.text);
      setSampleRate(rate);
      setIsPlaying(true);
    } catch (err) {
      setStartError("לא הצלחתי להפעיל את הרמקול");
    }
  };

  const handleStop = () => {
    stopBeacon();
    setIsPlaying(false);
  };

  return (
    <main className="beacon-page">
      <h1>מחולל ביקונים</h1>
      <p>הגבר את עוצמת המדיה, ופתח את המקלט במכשיר אחר.</p>

      <label htmlFor="beacon-type">סוג</label>
      <select
        id="beacon-type"
        value={values.type}
        onChange={(e) => handleTypeChange(e.target.value as BeaconType)}
        disabled={isPlaying}
      >
        {BEACON_TYPES.map((type) => (
          <option key={type} value={type}>
            {BEACON_LABELS[type]}
          </option>
        ))}
      </select>

      {isTextBeacon && (
        <>
          <label htmlFor="beacon-text">תוכן</label>
          <input
            id="beacon-text"
            dir="ltr"
            value={values.text}
            onChange={(e) => setValues({ ...values, text: e.target.value })}
            disabled={isPlaying}
          />
          {errors.text && <p className="form-error">{errors.text}</p>}
        </>
      )}

      <p>
        משך שידור: {durationMs} ms, חוזר כל {getRepeatMs(values.type)} ms
      </p>
      <p dir="ltr">{freqs.map((freq) => `${freq} Hz`).join(", ")}</p>

      {isPlaying ? (
        <button onClick={handleStop}>עצור</button>
      ) : (
        <button onClick={handleStart}>התחל שידור</button>
      )}

      {sampleRate && isPlaying && <p>קצב דגימה: {sampleRate} Hz</p>}
      {startError && <p className="form-error">{startError}</p>}
    </main>
  );
};

export default BeaconGeneratorPage;
