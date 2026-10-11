import jwt from 'jsonwebtoken';

export function generateToken(userId, expiresIn) {
  const token = jwt.sign({ userId }, process.env.TOKEN_SECRET_KEY, {
    expiresIn,
  });
  return token;
}
