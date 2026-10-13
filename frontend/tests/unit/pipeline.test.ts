import { describe, expect, it } from "vitest";
import { FRAME_SIZE } from "../../src/listener/dsp";
import { generateBeacon } from "../../src/listener/beaconGenerator";
import {
  createPipeline,
  toEventInput,
  type PipelineDetection,
} from "../../src/listener/pipeline";

const SAMPLE_RATE = 44100;

const withSilence = (signal: Float32Array): Float32Array => {
  const quiet = SAMPLE_RATE * 2;
  const samples = new Float32Array(quiet + signal.length + quiet);
  samples.set(signal, quiet);
  for (let i = 0; i < samples.length; i++) {
    samples[i] += Math.sin(i * 12.9898) * 0.001;
  }
  return samples;
};

const run = (samples: Float32Array): PipelineDetection[] => {
  const pipeline = createPipeline(SAMPLE_RATE);
  const detections: PipelineDetection[] = [];
  for (
    let start = 0;
    start + FRAME_SIZE <= samples.length;
    start += FRAME_SIZE
  ) {
    const detection = pipeline.processFrame(
      samples.slice(start, start + FRAME_SIZE),
    );
    if (detection) {
      detections.push(detection);
    }
  }
  return detections;
};

describe("pipeline", () => {
  it("reports a microphone that hears nothing above 17 kHz", () => {
    const pipeline = createPipeline(SAMPLE_RATE);
    const silence = new Float32Array(FRAME_SIZE);
    expect(pipeline.isMicDeaf()).toBe(false);
    for (let i = 0; i < 60; i++) {
      pipeline.processFrame(silence);
    }
    expect(pipeline.isMicDeaf()).toBe(true);
  });

  it("does not report a microphone that hears room noise", () => {
    const pipeline = createPipeline(SAMPLE_RATE);
    let state = 1;
    for (let i = 0; i < 60; i++) {
      const frame = new Float32Array(FRAME_SIZE).map(() => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return (state / 4294967296 - 0.5) * 0.001;
      });
      pipeline.processFrame(frame);
    }
    expect(pipeline.isMicDeaf()).toBe(false);
  });

  it("turns a beacon into one detection at 44.1 kHz", () => {
    const detections = run(
      withSilence(generateBeacon("silverpush", "UG01", SAMPLE_RATE)),
    );
    expect(detections).toHaveLength(1);
    expect(detections[0].isBeacon).toBe(true);
    expect(Math.abs(detections[0].startMs - 2000)).toBeLessThan(50);
  });

  it("builds an event that matches the contract", () => {
    const [detection] = run(
      withSilence(generateBeacon("lisnr", "UG01", SAMPLE_RATE)),
    );
    const startedAtMs = Date.parse("2026-10-11T08:00:00.000Z");
    const event = toEventInput(detection, startedAtMs, SAMPLE_RATE);

    expect(event.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(
      Math.abs(Date.parse(event.startedAt) - (startedAtMs + 2000)),
    ).toBeLessThan(50);
    expect(Number.isInteger(event.durationMs)).toBe(true);
    expect(event.durationMs).toBeGreaterThan(0);
    expect(event.freqsHz.length).toBeGreaterThan(0);
    expect(event.freqsHz.length).toBeLessThanOrEqual(16);
    expect(event.peakFreqHz).toBeGreaterThanOrEqual(10000);
    expect(event.type).toBe("lisnr");
    expect(event.confidence).toBeGreaterThanOrEqual(0.75);
    expect(event.sampleRate).toBe(SAMPLE_RATE);
    expect(event.payload).toBe("UG01");
  });

  it("decodes the text of every text beacon", () => {
    const cases = [
      { type: "silverpush" as const, text: "UG01" },
      { type: "mosquito" as const, text: "Room 7" },
      { type: "lisnr" as const, text: "Hi" },
    ];
    for (const { type, text } of cases) {
      const beacons = run(
        withSilence(generateBeacon(type, text, SAMPLE_RATE)),
      ).filter((detection) => detection.isBeacon);
      expect(beacons[0].payload).toBe(text);
    }
  });
});
