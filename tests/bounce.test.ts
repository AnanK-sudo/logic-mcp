import { describe, it, expect } from 'vitest';
import { bounceDestination } from '../src/ax/bounce.js';

describe('bounce destination', () => {
  it('joins dir and name with wav extension', () => {
    expect(bounceDestination('/tmp/x', 'mix v1')).toEqual({ dir: '/tmp/x', name: 'mix v1', full: '/tmp/x/mix v1.wav' });
  });
  it('strips a provided extension', () => {
    expect(bounceDestination('/tmp/x', 'mix.wav').full).toBe('/tmp/x/mix.wav');
  });
});
