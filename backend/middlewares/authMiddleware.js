import { authService } from '../services/auth.service.js';

export async function authMiddleware(req, res, next) {
  req.user = await authService.getUserFromToken(req.cookies.token);
  next();
}
