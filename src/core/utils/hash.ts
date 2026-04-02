import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

/**
 * Hash a plain text password/token.
 * Use salt rounds of 12 for passwords, 10 for refresh tokens.
 */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

/** Hash a refresh token — slightly cheaper than password hashing */
export const hashToken = (plain: string): Promise<string> =>
  bcrypt.hash(plain, 10);

/**
 * Compare a plain text value against its bcrypt hash.
 * Returns true if they match.
 */
export const compareHash = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);
