import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isPassiveShowcaseEmbed,
  resolvePlaygroundTenantId,
} from './session-room';

describe('isPassiveShowcaseEmbed', () => {
  it('is true for fractal blog iframes without a room slug', () => {
    expect(isPassiveShowcaseEmbed('?embed=1&vantage=8')).toBe(true);
  });

  it('is false when embed names a shared room', () => {
    expect(isPassiveShowcaseEmbed('?embed=1&room=fractals-blog')).toBe(false);
  });

  it('is false for full app routes', () => {
    expect(isPassiveShowcaseEmbed('?vantage=8')).toBe(false);
  });
});

describe('resolvePlaygroundTenantId', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    });
    vi.stubGlobal('window', {
      location: { hostname: 'playground.trellis.computer', search: '' },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses showcase tenant for passive embeds on hosted origins', () => {
    expect(resolvePlaygroundTenantId(false, '?embed=1&vantage=10')).toBeUndefined();
  });

  it('uses session tenant when embed names a room', () => {
    expect(resolvePlaygroundTenantId(false, '?embed=1&room=fractals-blog')).toBe(
      'embed-fractals-blog',
    );
  });

  it('uses showcase tenant for readonly embeds', () => {
    expect(resolvePlaygroundTenantId(true, '?embed=1&readonly=1')).toBeUndefined();
  });
});
