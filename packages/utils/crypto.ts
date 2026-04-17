import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SEPARATOR = ':';

export function encrypt(plaintext: string, key: string): string {
  if (!plaintext) throw new Error('plaintext must not be empty');
  if (!key) throw new Error('key must not be empty');

  const keyBuffer = Buffer.from(key, 'utf8').subarray(0, 32);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(SEPARATOR);
}

export function decrypt(ciphertext: string, key: string): string {
  if (!ciphertext) throw new Error('ciphertext must not be empty');
  if (!key) throw new Error('key must not be empty');

  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) throw new Error('invalid ciphertext format');

  const [ivB64, authTagB64, encryptedB64] = parts;
  const keyBuffer = Buffer.from(key, 'utf8').subarray(0, 32);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encryptedData = Buffer.from(encryptedB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
}
