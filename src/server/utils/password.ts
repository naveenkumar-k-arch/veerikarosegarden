import bcrypt from 'bcryptjs';

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', '123456789', 'admin123',
  'veerika123', 'welcome123', 'qwerty123', 'letmein123', 'p@ssword1'
]);

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (password && password.length > 128) {
    errors.push('Password must not exceed 128 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z).');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z).');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9).');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
    errors.push('This password is too common and easily guessable. Please choose a stronger password.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function hashPassword(password: string): Promise<string> {
  try {
    const argon2 = await import('argon2');
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1
    });
  } catch (argonErr) {
    // Fallback to bcryptjs if native bindings fail in sandboxed runtime (e.g. Vercel Serverless)
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;

  try {
    if (hash.startsWith('$argon2')) {
      const argon2 = await import('argon2');
      return await argon2.verify(hash, password);
    } else if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(password, hash);
    }
    console.error('[SECURITY] Unrecognized password hash format encountered.');
    return false;
  } catch (err) {
    console.error('[PASSWORD] Password verification error:', err);
    return false;
  }
}
