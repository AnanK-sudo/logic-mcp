import { describe, it, expect } from 'vitest';
import { insertPluginSource, PLUGIN_CATEGORIES } from '../src/ax/plugins.js';

describe('plugin JXA generation', () => {
  it('knows categories for stock vocal plugins', () => {
    expect(PLUGIN_CATEGORIES['Compressor']).toBe('Dynamics');
    expect(PLUGIN_CATEGORIES['Channel EQ']).toBe('EQ');
    expect(PLUGIN_CATEGORIES['DeEsser 2']).toBe('Dynamics');
    expect(PLUGIN_CATEGORIES['Limiter']).toBe('Dynamics');
  });
  it('builds insert source with category, plugin, format', () => {
    const src = insertPluginSource('Lead Vox', 'Compressor', 'Dynamics');
    expect(src).toContain('Lead Vox');
    expect(src).toContain('Dynamics');
    expect(src).toContain('Compressor');
    expect(src).toContain('Stereo');
  });
});
