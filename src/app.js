import cookieParser from 'cookie-parser';
import express from 'express';
import path from 'node:path';
import helmet from 'helmet';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(helmet());

app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

app.use((req, res) => {
  res.json(`${req.url} doesn't have ${req.method} method`);
});

app.use(errorHandler);

export default app;
