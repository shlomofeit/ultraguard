import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import type { Event, EventType } from "../types/event";
import { BEACON_TYPES, EVENT_TYPE_LABELS } from "../utils/eventTypeLabels";
import { EVENT_TYPE_COLORS } from "../utils/eventTypeColors";
import { fromShare, toShare } from "../utils/frequencyRange";

interface WaterfallProps {
  events: Event[];
  roomNames: Record<string, string> | null;
}

interface Flash {
  freqsHz: number[];
  color: string;
  strength: number;
  lifeMs: number;
}

interface Tag {
  id: string;
  roomId: string;
  type: EventType;
  peakFreqHz: number;
  dropPx: number;
}

const SPEED = 60;
const NEW_EVENT_MS = 10000;
const MIN_FLASH_MS = 400;
const BACKGROUND = "#040a14";
const RULER_STEPS = [16000, 17000, 18000, 19000, 20000, 21000, 22000];

const toRgba = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

const Waterfall = ({ events, roomNames }: WaterfallProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashesRef = useRef<Flash[]>([]);
  const seenIdsRef = useRef(new Set<string>());
  const [tags, setTags] = useState<Tag[]>([]);
  const [hoverShare, setHoverShare] = useState<number | null>(null);

  useEffect(() => {
    const height = canvasRef.current?.clientHeight ?? 0;
    const newTags: Tag[] = [];
    for (const event of events) {
      if (seenIdsRef.current.has(event.id)) {
        continue;
      }
      seenIdsRef.current.add(event.id);
      if (Date.now() - Date.parse(event.receivedAt) > NEW_EVENT_MS) {
        continue;
      }
      flashesRef.current.push({
        freqsHz: event.freqsHz,
        color: EVENT_TYPE_COLORS[event.type],
        strength: Math.min(1, Math.max(0.35, event.snrDb / 30)),
        lifeMs: Math.max(MIN_FLASH_MS, event.durationMs),
      });
      newTags.push({
        id: event.id,
        roomId: event.roomId,
        type: event.type,
        peakFreqHz: event.peakFreqHz,
        dropPx: height,
      });
    }
    if (newTags.length > 0) {
      setTags((current) => [...current, ...newTags]);
    }
  }, [events]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    let ratio = 1;
    let frameId = 0;
    let lastTime = performance.now();
    let carry = 0;

    const resize = () => {
      ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const paintTopLine = (rows: number) => {
      const { width, height } = canvas;
      ctx.drawImage(
        canvas,
        0,
        0,
        width,
        height - rows,
        0,
        rows,
        width,
        height - rows,
      );
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, rows);

      for (let x = 0; x < width; x += 3 * ratio) {
        const noise = Math.random();
        if (noise > 0.55) {
          ctx.fillStyle = `rgba(95, 227, 240, ${(noise - 0.55) * 0.18})`;
          ctx.fillRect(x, 0, 2 * ratio, rows);
        }
      }

      for (const flash of flashesRef.current) {
        const alpha = flash.strength * Math.min(1, flash.lifeMs / 300);
        for (const freqHz of flash.freqsHz) {
          const x = toShare(freqHz) * width;
          const glow = ctx.createRadialGradient(x, 0, 0, x, 0, 9 * ratio);
          glow.addColorStop(0, toRgba(flash.color, alpha));
          glow.addColorStop(1, toRgba(flash.color, 0));
          ctx.fillStyle = glow;
          ctx.fillRect(x - 9 * ratio, 0, 18 * ratio, rows);
        }
      }
    };

    const drawFrame = (time: number) => {
      const elapsedMs = Math.min(100, time - lastTime);
      lastTime = time;

      carry += (elapsedMs / 1000) * SPEED * ratio;
      const rows = Math.floor(carry);
      if (rows > 0) {
        carry -= rows;
        paintTopLine(rows);
      }

      for (const flash of flashesRef.current) {
        flash.lifeMs -= elapsedMs;
      }
      flashesRef.current = flashesRef.current.filter(
        (flash) => flash.lifeMs > 0,
      );

      frameId = requestAnimationFrame(drawFrame);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frameId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const removeTag = (id: string) => {
    setTags((current) => current.filter((tag) => tag.id !== id));
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setHoverShare((e.clientX - box.left) / box.width);
  };

  return (
    <>
      <div
        className="waterfall-stage"
        dir="ltr"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverShare(null)}
      >
        <canvas ref={canvasRef} />

        {tags.map((tag) => {
          const style = {
            left: `${Math.min(92, Math.max(8, toShare(tag.peakFreqHz) * 100))}%`,
            "--c": EVENT_TYPE_COLORS[tag.type],
            "--drop": `${tag.dropPx}px`,
            "--duration": `${tag.dropPx / SPEED}s`,
          } as CSSProperties;
          return (
            <span
              key={tag.id}
              className="waterfall-tag"
              style={style}
              onAnimationEnd={() => removeTag(tag.id)}
            >
              {roomNames && `${roomNames[tag.roomId] ?? ""} · `}
              {EVENT_TYPE_LABELS[tag.type]} ·{" "}
              {(tag.peakFreqHz / 1000).toFixed(1)}k
            </span>
          );
        })}

        {hoverShare !== null && (
          <div className="crosshair" style={{ left: `${hoverShare * 100}%` }}>
            <span>{(fromShare(hoverShare) / 1000).toFixed(2)} kHz</span>
          </div>
        )}
      </div>

      <div className="ruler" dir="ltr">
        {RULER_STEPS.map((freqHz) => (
          <span key={freqHz} style={{ left: `${toShare(freqHz) * 100}%` }}>
            {freqHz / 1000} kHz
          </span>
        ))}
      </div>

      <div className="legend">
        {BEACON_TYPES.map((type) => (
          <span key={type}>
            <i
              className="dot"
              style={{ "--c": EVENT_TYPE_COLORS[type] } as CSSProperties}
            />
            {EVENT_TYPE_LABELS[type]}
          </span>
        ))}
      </div>
    </>
  );
};

export default Waterfall;
