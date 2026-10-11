import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { usersRepo } from '../repositories/users.repo.js';
import { generateToken } from '../utils/generateToken.js';
import {
  loginSchema,
  registerSchema,
  validateSchema,
} from '../utils/validation.js';

const SALT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

function toUser(row) {
  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };

  return user;
}

function createTokens(userId) {
  const tokens = {
    token: generateToken(userId, ACCESS_EXPIRES_IN),
    refreshToken: generateToken(userId, REFRESH_EXPIRES_IN),
  };

  return tokens;
}

function throwUnauthorized(message) {
  const error = new Error(message);
  error.status = 401;
  throw error;
}

async function register(userData) {
  const { name, email, password } = validateSchema(registerSchema, userData);
  const existingUser = await usersRepo.getUserByEmail(email);

  if (existingUser) {
    const error = new Error('Email is already taken!');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const row = await usersRepo.createUser({
    name,
    email,
    password_hash: passwordHash,
  });
  const user = toUser(row);

  return { user, tokens: createTokens(user.id) };
}

async function login(loginData) {
  const { email, password } = validateSchema(loginSchema, loginData);
  const row = await usersRepo.getUserByEmail(email);
  const isMatch = row && (await bcrypt.compare(password, row.password_hash));

  if (!isMatch) {
    throwUnauthorized('Invalid email or password!');
  }

  const user = toUser(row);
  return { user, tokens: createTokens(user.id) };
}

async function getUserFromToken(token) {
  if (!token) {
    throwUnauthorized('Not logged in!');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.TOKEN_SECRET_KEY);
  } catch {
    throwUnauthorized('Session expired, please log in again!');
  }

  const row = await usersRepo.getUserById(payload.userId);

  if (!row) {
    throwUnauthorized('User not found!');
  }

  const user = toUser(row);
  return user;
}

async function refresh(refreshToken) {
  const user = await getUserFromToken(refreshToken);
  const token = generateToken(user.id, ACCESS_EXPIRES_IN);

  return { user, tokens: { token } };
}

export const authService = { register, login, getUserFromToken, refresh };
