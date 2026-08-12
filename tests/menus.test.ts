import { describe, it, expect } from 'vitest';
import { menuSource } from '../src/ax/menus.js';

describe('menu source generation', () => {
  it('walks nested menu path', () => {
    const src = menuSource(['File', 'Bounce', 'Project or Section…']);
    expect(src).toContain(`menuBarItems['File']`);
    expect(src).toContain(`menuItems['Bounce']`);
    expect(src).toContain(`menuItems['Project or Section…']`);
  });
  it('escapes quotes', () => {
    expect(menuSource(["It's"])).toContain("It\\'s");
  });
});
