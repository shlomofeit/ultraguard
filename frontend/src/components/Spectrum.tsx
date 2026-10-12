import { useEffect, useRef } from "react";

interface SpectrumProps {
  analyser: AnalyserNode | null;
  sampleRate: number | null;
}

const MAX_FREQ_HZ = 22000;
const ULTRASONIC_HZ = 16000;
const LABEL_STEP_HZ = 2000;
const COLUMN_PX = 2;
const BACKGROUND = "#040a14";
const ULTRASONIC_BACKGROUND = "rgba(255, 184, 77, 0.07)";
const AUDIBLE_COLOR = "#8597b5";
const ULTRASONIC_COLOR = "#ffb84d";
const LABEL_COLOR = "#8597b5";

const Spectrum = ({ analyser, sampleRate }: SpectrumProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    const levels = new Float32Array(analyser?.frequencyBinCount ?? 0);
    let ratio = 1;
    let frameId = 0;

    const resize = () => {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
    };

    const drawBackground = () => {
      const { width, height } = canvas;
      const ultrasonicX = (ULTRASONIC_HZ / MAX_FREQ_HZ) * width;
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = ULTRASONIC_BACKGROUND;
      ctx.fillRect(ultrasonicX, 0, width - ultrasonicX, height);

      ctx.fillStyle = LABEL_COLOR;
      ctx.font = `${11 * ratio}px monospace`;
      for (let freqHz = 0; freqHz < MAX_FREQ_HZ; freqHz += LABEL_STEP_HZ) {
        const x = (freqHz / MAX_FREQ_HZ) * width;
        ctx.fillText(`${freqHz / 1000}k`, x + 3 * ratio, height - 4 * ratio);
      }
    };

    const drawLevels = () => {
      if (!analyser || !sampleRate) {
        return;
      }
      analyser.getFloatFrequencyData(levels);
      const { width, height } = canvas;
      const binHz = sampleRate / 2 / levels.length;
      const dbRange = analyser.maxDecibels - analyser.minDecibels;
      const step = COLUMN_PX * ratio;

      for (let x = 0; x < width; x += step) {
        const freqHz = (x / width) * MAX_FREQ_HZ;
        const level = levels[Math.round(freqHz / binHz)];
        const share = (level - analyser.minDecibels) / dbRange;
        const barHeight = Math.max(0, Math.min(1, share)) * height;
        ctx.fillStyle = freqHz >= ULTRASONIC_HZ ? ULTRASONIC_COLOR : AUDIBLE_COLOR;
        ctx.fillRect(x, height - barHeight, step - ratio, barHeight);
      }
    };

    const drawFrame = () => {
      drawBackground();
      drawLevels();
      frameId = requestAnimationFrame(drawFrame);
    };

    resize();
    window.addEventListener("resize", resize);
    frameId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [analyser, sampleRate]);

  return (
    <div className="spectrum-stage">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default Spectrum;
