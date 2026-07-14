import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildUserUrl, getUserFromUrl, goToMainPage, setUserInUrl } from './urlUser';

describe('urlUser helpers', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/wanikani-marathon-stats/');
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('reads the user query param', () => {
    window.history.replaceState({}, '', '/?user=Alice');
    expect(getUserFromUrl()).toBe('Alice');
  });

  it('writes and clears the user query param', () => {
    setUserInUrl('bob');
    expect(window.location.search).toBe('?user=bob');

    setUserInUrl('');
    expect(window.location.search).toBe('');
  });

  it('builds a shareable profile url', () => {
    window.history.replaceState({}, '', '/wanikani-marathon-stats/');
    expect(buildUserUrl('alice')).toBe('http://localhost:3000/wanikani-marathon-stats/?user=alice');
  });

  it('clears search params when returning home', () => {
    window.history.replaceState({}, '', '/wanikani-marathon-stats/?user=alice&foo=bar');
    goToMainPage();
    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/wanikani-marathon-stats/');
  });
});
