import crypto from 'crypto';

function getOrGenerateSecret(envVarName: string, defaultPrefix: string): string {
  const val = process.env[envVarName];
  if (val && val.length >= 16) {
    return val;
  }

  const generatedSecret = crypto.randomBytes(32).toString('hex');
  console.warn(`[SECURITY WARNING] ${envVarName} is missing or weak. Dynamic cryptographically random secret generated for this process session.`);
  return generatedSecret;
}

export const AUTH_CONFIG = {
  jwtAccessSecret: getOrGenerateSecret('JWT_ACCESS_SECRET', 'access_key'),
  jwtRefreshSecret: getOrGenerateSecret('JWT_REFRESH_SECRET', 'refresh_key'),
  cookieSecret: getOrGenerateSecret('COOKIE_SECRET', 'cookie_key'),
  accessTokenExpiresIn: '7d', // 7 days access token
  refreshTokenExpiresDays: 7,   // 7 days refresh token
  maxFailedLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  issuer: 'veerika-rose-garden-api',
  audience: 'veerika-rose-garden-app'
};
