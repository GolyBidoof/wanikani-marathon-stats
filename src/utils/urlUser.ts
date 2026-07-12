const USER_PARAM = 'user';

export function getUserFromUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get(USER_PARAM)?.trim() || '';
}

export function setUserInUrl(username: string): void {
  const url = new URL(window.location.href);

  if (username) {
    url.searchParams.set(USER_PARAM, username);
  } else {
    url.searchParams.delete(USER_PARAM);
  }

  window.history.replaceState(window.history.state, '', url);
}

export function goToMainPage(): void {
  const url = new URL(window.location.href);
  url.search = '';
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.hash}`);
}

export function buildUserUrl(username: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set(USER_PARAM, username);
  return url.toString();
}
