import { useEffect, useRef } from "react";

interface LiveWaveProps {
  analyser: AnalyserNode | null;
}

const BARS = 5;

const LiveWave = ({ analyser }: LiveWaveProps) => {
  const barsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (!analyser) {
      barsRef.current.forEach((bar) => bar && (bar.style.height = "3px"));
      return;
    }
    const levels = new Uint8Array(analyser.frequencyBinCount);
    let frameId = 0;

    const draw = () => {
      analyser.getByteFrequencyData(levels);
      const step = Math.floor(levels.length / BARS);
      barsRef.current.forEach((bar, i) => {
        if (!bar) {
          return;
        }
        const level = levels[i * step + step] ?? 0;
        bar.style.height = `${3 + (level / 255) * 11}px`;
      });
      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  }, [analyser]);

  return (
    <span className="wave">
      {Array.from({ length: BARS }, (_, i) => (
        <i
          key={i}
          ref={(el) => {
            barsRef.current[i] = el;
          }}
        />
      ))}
    </span>
  );
};

export default LiveWave;
