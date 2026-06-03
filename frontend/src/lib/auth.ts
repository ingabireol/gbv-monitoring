export type UserRole = "admin" | "victim" | "police" | "socialworker" | "districtadmin" | "partner";
export interface StoredUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  district?: string;
  institution?: string;
}

const ROLE_KEY = "gbv_role";
const USER_KEY = "gbv_user";
const TOKEN_KEY = "gbv_token";

export function getUserRole(): UserRole | null {
  return (localStorage.getItem(ROLE_KEY) as UserRole) || null;
}

export function setUserRole(role: UserRole): void {
  localStorage.setItem(ROLE_KEY, role);
}

export function setCurrentUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCurrentUser(): StoredUser | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function getUserFirstName(user: StoredUser | null): string {
  if (!user) {
    return "Victim";
  }

  const candidate = (user.name || user.username || user.email || "").trim();
  if (!candidate) {
    return "Victim";
  }

  if (candidate.includes("@")) {
    const localPart = candidate.split("@")[0].trim();
    const firstSegment = localPart.split(/[._-]+/).find(Boolean);
    return firstSegment ? capitalizeName(firstSegment) : "Victim";
  }

  const firstToken = candidate.split(/\s+/).find(Boolean);
  return firstToken ? capitalizeName(firstToken) : "Victim";
}

function capitalizeName(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: StoredUser): void {
  setAuthToken(token);
  setUserRole(user.role);
  setCurrentUser(user);
}

export function clearRole(): void {
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}
