const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

export function setAuthCookies(res, tokens) {
  res.cookie('token', tokens.token, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_MAX_AGE_MS,
  });

  if (tokens.refreshToken) {
    res.cookie('refreshToken', tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }
}

export function clearAuthCookies(res) {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
}
