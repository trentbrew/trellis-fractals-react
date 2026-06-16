import { describe, expect, it } from 'vitest';
import { resolvePointerPresence, viewportToFixed } from '@/lib/presence/coordinate-space';

describe('coordinate-space', () => {
  it('uses literal viewport clientX/clientY', () => {
    expect(resolvePointerPresence(640, 480)).toEqual({ x: 640, y: 480 });
    expect(viewportToFixed(640, 480)).toEqual({ left: 640, top: 480 });
  });
});
