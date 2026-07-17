import { User } from '@/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function isValidToken(token: string | null | undefined): token is string {
  return Boolean(token && token !== 'undefined' && token !== 'null');
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  return isValidToken(token) ? token : null;
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: User): boolean {
  if (!isValidToken(token) || !user) return false;

  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return true;
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  clearAuthSession();
  window.location.href = '/login';
}
