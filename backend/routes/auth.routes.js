import express from 'express';
import rateLimit from 'express-rate-limit';
import { authService } from '../services/auth.service.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { clearAuthCookies, setAuthCookies } from '../utils/setAuthCookies.js';

export const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many attempts, try again later!' },
});

router.post('/register', authLimiter, async (req, res) => {
  const { user, tokens } = await authService.register(req.body);
  setAuthCookies(res, tokens);

  res.status(201).json(user);
});

router.post('/login', authLimiter, async (req, res) => {
  const { user, tokens } = await authService.login(req.body);
  setAuthCookies(res, tokens);

  res.json(user);
});

router.post('/refresh', async (req, res) => {
  const { user, tokens } = await authService.refresh(req.cookies.refreshToken);
  setAuthCookies(res, tokens);

  res.json(user);
});

router.post('/logout', (req, res) => {
  clearAuthCookies(res);

  res.json({ message: 'Logged out!' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json(req.user);
});
