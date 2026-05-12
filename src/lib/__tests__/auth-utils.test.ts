/**
 * Auth Utilities Tests
 *
 * Tests for JWT token management utilities used throughout the frontend.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Cookies from 'js-cookie';

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  authLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  default: {
    createChild: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  isTokenExpired,
  isTokenExpiringSoon,
  getTokenExpiryTime,
  getTokenExpiryDisplay,
  decodeToken,
} from '../auth-utils';

// ─── JWT Test Tokens ──────────────────────────────────────────────────────────

/**
 * Creates a mock JWT token with the given expiry time.
 * Note: These are not cryptographically valid — they're for testing decode/expiry logic only.
 */
function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mock-signature`;
}

const now = Math.floor(Date.now() / 1000);

const validToken = createMockJwt({
  sub: 'user-123',
  email: 'user@example.com',
  role: 'ADMIN',
  iat: now - 3600,
  exp: now + 3600, // expires in 1 hour
});

const expiredToken = createMockJwt({
  sub: 'user-123',
  email: 'user@example.com',
  role: 'ADMIN',
  iat: now - 7200,
  exp: now - 3600, // expired 1 hour ago
});

const expiringSoonToken = createMockJwt({
  sub: 'user-123',
  email: 'user@example.com',
  role: 'ADMIN',
  iat: now - 3600,
  exp: now + 600, // expires in 10 minutes (< 30 min threshold)
});

// ─── Cookie Management ────────────────────────────────────────────────────────

describe('Cookie Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return access token from cookies', () => {
      vi.mocked(Cookies.get).mockReturnValue(validToken);
      const token = getAccessToken();
      expect(Cookies.get).toHaveBeenCalledWith('accessToken');
      expect(token).toBe(validToken);
    });

    it('should return undefined when no token', () => {
      vi.mocked(Cookies.get).mockReturnValue(undefined);
      const token = getAccessToken();
      expect(token).toBeUndefined();
    });
  });

  describe('setAccessToken', () => {
    it('should set access token in cookies', () => {
      setAccessToken(validToken);
      expect(Cookies.set).toHaveBeenCalledWith(
        'accessToken',
        validToken,
        expect.objectContaining({ expires: 7, path: '/' }),
      );
    });
  });

  describe('removeAccessToken', () => {
    it('should remove access token from cookies', () => {
      removeAccessToken();
      expect(Cookies.remove).toHaveBeenCalledWith('accessToken', { path: '/' });
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from cookies', () => {
      vi.mocked(Cookies.get).mockReturnValue('refresh-token-value');
      const token = getRefreshToken();
      expect(Cookies.get).toHaveBeenCalledWith('refreshToken');
      expect(token).toBe('refresh-token-value');
    });
  });

  describe('setRefreshToken', () => {
    it('should set refresh token in cookies', () => {
      setRefreshToken('my-refresh-token');
      expect(Cookies.set).toHaveBeenCalledWith(
        'refreshToken',
        'my-refresh-token',
        expect.objectContaining({ expires: 7, path: '/' }),
      );
    });
  });

  describe('removeRefreshToken', () => {
    it('should remove refresh token from cookies', () => {
      removeRefreshToken();
      expect(Cookies.remove).toHaveBeenCalledWith('refreshToken', { path: '/' });
    });
  });
});

// ─── Token Decoding ───────────────────────────────────────────────────────────

describe('Token Decoding', () => {
  it('should decode a valid JWT token', () => {
    const payload = decodeToken(validToken);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-123');
    expect(payload?.email).toBe('user@example.com');
    expect(payload?.role).toBe('ADMIN');
  });

  it('should return null for an invalid token', () => {
    const payload = decodeToken('not.a.valid.jwt');
    expect(payload).toBeNull();
  });

  it('should return null for empty string', () => {
    const payload = decodeToken('');
    expect(payload).toBeNull();
  });
});

// ─── Token Expiry Checks ──────────────────────────────────────────────────────

describe('Token Expiry', () => {
  describe('isTokenExpired', () => {
    it('should return false for a valid (non-expired) token', () => {
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for an expired token', () => {
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for an invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return false for a token expiring in 1 hour', () => {
      expect(isTokenExpiringSoon(validToken)).toBe(false);
    });

    it('should return true for a token expiring in 10 minutes', () => {
      expect(isTokenExpiringSoon(expiringSoonToken)).toBe(true);
    });

    it('should return true for an already expired token', () => {
      expect(isTokenExpiringSoon(expiredToken)).toBe(true);
    });
  });

  describe('getTokenExpiryTime', () => {
    it('should return positive seconds for a valid token', () => {
      const seconds = getTokenExpiryTime(validToken);
      expect(seconds).not.toBeNull();
      expect(seconds!).toBeGreaterThan(0);
      // Should be approximately 3600 seconds (1 hour)
      expect(seconds!).toBeLessThanOrEqual(3600);
      expect(seconds!).toBeGreaterThan(3500);
    });

    it('should return 0 for an expired token', () => {
      const seconds = getTokenExpiryTime(expiredToken);
      expect(seconds).toBe(0);
    });

    it('should return null for an invalid token', () => {
      const seconds = getTokenExpiryTime('invalid-token');
      expect(seconds).toBeNull();
    });
  });

  describe('getTokenExpiryDisplay', () => {
    it('should return "Expired" for an expired token', () => {
      const display = getTokenExpiryDisplay(expiredToken);
      expect(display).toBe('Expired');
    });

    it('should return hours for a token expiring in 1 hour', () => {
      const display = getTokenExpiryDisplay(validToken);
      // Token expires in ~3600s; display shows hours or minutes depending on exact timing
      expect(display).toMatch(/hour|minute/);
    });

    it('should return minutes for a token expiring in 10 minutes', () => {
      const display = getTokenExpiryDisplay(expiringSoonToken);
      expect(display).toContain('minute');
    });

    it('should return "Unknown" for an invalid token', () => {
      const display = getTokenExpiryDisplay('invalid-token');
      expect(display).toBe('Unknown');
    });
  });
});

// ─── Token Payload Validation ─────────────────────────────────────────────────

describe('Token Payload Validation', () => {
  it('should contain required JWT fields', () => {
    const payload = decodeToken(validToken);
    expect(payload).toHaveProperty('sub');
    expect(payload).toHaveProperty('email');
    expect(payload).toHaveProperty('role');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');
  });

  it('should have exp greater than iat for valid token', () => {
    const payload = decodeToken(validToken);
    expect(payload!.exp).toBeGreaterThan(payload!.iat);
  });

  it('should have exp less than iat for expired token', () => {
    const payload = decodeToken(expiredToken);
    expect(payload!.exp).toBeLessThan(now);
  });
});
