import type { AudioState } from "../types/event";
import { FRAME_SIZE } from "./dsp";

export const ANALYSER_FFT_SIZE = 2048;

export interface Capture {
  sampleRate: number;
  analyser: AnalyserNode;
  getAudioState: () => AudioState;
  isMicLive: () => boolean;
  stop: () => void;
}

export const startCapture = async (
  onFrame: (frame: Float32Array) => void,
): Promise<Capture> => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule("/capture-worklet.js");

  const source = ctx.createMediaStreamSource(stream);
  const capture = new AudioWorkletNode(ctx, "capture-processor", {
    processorOptions: { frameSize: FRAME_SIZE },
  });
  const analyser = ctx.createAnalyser();
  analyser.fftSize = ANALYSER_FFT_SIZE;
  const mute = ctx.createGain();
  mute.gain.value = 0;

  capture.port.onmessage = (e: MessageEvent<Float32Array>) => onFrame(e.data);
  source.connect(capture);
  capture.connect(mute);
  source.connect(analyser);
  analyser.connect(mute);
  mute.connect(ctx.destination);
  await ctx.resume();

  const getAudioState = (): AudioState =>
    ctx.state === "running" || ctx.state === "closed" ? ctx.state : "suspended";

  const isMicLive = () =>
    stream
      .getAudioTracks()
      .some((track) => track.readyState === "live" && !track.muted);

  const stop = () => {
    capture.port.onmessage = null;
    stream.getTracks().forEach((track) => track.stop());
    void ctx.close();
  };

  return {
    sampleRate: ctx.sampleRate,
    analyser,
    getAudioState,
    isMicLive,
    stop,
  };
};
