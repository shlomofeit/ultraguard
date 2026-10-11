import { io } from 'socket.io-client';
import { LISTENER_EVENT } from '../utils/socketEvents.js';

const SERVER_URL = 'http://localhost:3000/listener';

const event = {
  id: crypto.randomUUID(),
  startedAt: new Date().toISOString(),
  durationMs: 960,
  type: 'silverpush',
  confidence: 0.9,
  peakFreqHz: 18000,
  freqsHz: [18000, 18500, 19500],
  snrDb: 42,
  payload: 'UG01',
  sampleRate: 44100,
};

const socket = io(SERVER_URL);

socket.on('connect', async () => {
  const firstAck = await socket.emitWithAck(LISTENER_EVENT, event);
  console.log('First send:', firstAck);

  const secondAck = await socket.emitWithAck(LISTENER_EVENT, event);
  console.log('Second send:', secondAck);

  console.log(`Event id: ${event.id}`);
  socket.disconnect();
});

socket.on('connect_error', (error) => {
  console.error(`Connection failed: ${error.message}`);
  socket.disconnect();
});
