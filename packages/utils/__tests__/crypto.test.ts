import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../crypto.js';

const KEY = 'a'.repeat(32); // 32-char key for AES-256

describe('crypto', () => {
  it('encrypt returns a non-empty string', () => {
    const result = encrypt('hello world', KEY);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('decrypt reverses encrypt', () => {
    const plaintext = 'שלום עולם 🌍';
    const ciphertext = encrypt(plaintext, KEY);
    expect(decrypt(ciphertext, KEY)).toBe(plaintext);
  });

  it('two encryptions of same plaintext produce different ciphertexts (random IV)', () => {
    const c1 = encrypt('same', KEY);
    const c2 = encrypt('same', KEY);
    expect(c1).not.toBe(c2);
  });

  it('decrypt throws on tampered ciphertext', () => {
    const ciphertext = encrypt('data', KEY);
    const tampered = ciphertext.slice(0, -4) + 'XXXX';
    expect(() => decrypt(tampered, KEY)).toThrow();
  });

  it('encrypt throws on empty plaintext', () => {
    expect(() => encrypt('', KEY)).toThrow();
  });

  it('encrypt throws on empty key', () => {
    expect(() => encrypt('data', '')).toThrow();
  });
});
