import { describe, expect, it } from 'vitest';
import { isAdminToken } from '@/lib/admin-auth';

function withAdminKey<T>(value: string | undefined, run: () => T): T {
  const original = process.env.ADMIN_API_KEY;
  if (value === undefined) {
    delete process.env.ADMIN_API_KEY;
  } else {
    process.env.ADMIN_API_KEY = value;
  }
  try {
    return run();
  } finally {
    if (original === undefined) {
      delete process.env.ADMIN_API_KEY;
    } else {
      process.env.ADMIN_API_KEY = original;
    }
  }
}

describe('isAdminToken', () => {
  it('returns false when ADMIN_API_KEY is missing', () => {
    withAdminKey(undefined, () => {
      expect(isAdminToken(new Headers())).toBe(false);
    });
  });

  it('returns true when bearer token matches', () => {
    withAdminKey('secret-key', () => {
      const headers = new Headers({ authorization: 'Bearer secret-key' });
      expect(isAdminToken(headers)).toBe(true);
    });
  });

  it('returns false when bearer token does not match', () => {
    withAdminKey('secret-key', () => {
      const headers = new Headers({ authorization: 'Bearer other-key' });
      expect(isAdminToken(headers)).toBe(false);
    });
  });
});
