import { StoredUser, UserRole } from "./auth";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8083/api").replace(/\/$/, "");

interface AuthResponse {
  success: boolean;
  message: string;
  token: string | null;
  userId?: string | null;
  username?: string | null;
  displayName?: string | null;
  email?: string | null;
  role?: string | null;
  district?: string | null;
  institution?: string | null;
  verificationPin?: string | null;
}

interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  role?: string;
  displayName?: string;
  district?: string;
  institution?: string | null;
  ageGroup?: string;
}

interface VerificationPayload {
  email: string;
  pin: string;
}

async function postJson<TBody extends object>(path: string, body: TBody): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => null)) as AuthResponse | null;
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Request failed with status ${response.status}`);
  }

  return data;
}

function mapBackendRoleToUserRole(role?: string | null): UserRole {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "VICTIM":
      return "victim";
    case "POLICE":
      return "police";
    case "SOCIAL_WORKER":
      return "socialworker";
    case "DISTRICT_ADMIN":
      return "districtadmin";
    case "PARTNER":
      return "partner";
    default:
      throw new Error("This account does not have a supported role.");
  }
}

export async function loginUser(username: string, password: string): Promise<{ token: string; user: StoredUser }> {
  const data = await postJson("/auth/login", { username, password });
  if (!data.token) {
    throw new Error("Login succeeded but no token was returned.");
  }

  const role = mapBackendRoleToUserRole(data.role);
  return {
    token: data.token,
    user: {
      id: data.userId ?? username,
      username: data.username ?? username,
      role,
      name: data.displayName ?? data.username ?? username,
      email: data.email ?? undefined,
      district: data.district ?? undefined,
      institution: data.institution ?? undefined,
    },
  };
}

export async function registerVictim(payload: RegisterPayload): Promise<AuthResponse> {
  return postJson("/auth/register", {
    ...payload,
    role: payload.role ?? "VICTIM",
  });
}

export async function requestVictimEmailPin(payload: RegisterPayload): Promise<AuthResponse> {
  return postJson("/auth/register/request-pin", {
    ...payload,
    role: payload.role ?? "VICTIM",
  });
}

export async function verifyVictimEmailPin(payload: VerificationPayload): Promise<AuthResponse> {
  return postJson("/auth/register/verify-pin", payload);
}

export function getRouteForRole(role: UserRole): string {
  switch (role) {
    case "victim":
      return "/victim/dashboard";
    case "police":
      return "/police/dashboard";
    case "socialworker":
      return "/socialworker/dashboard";
    case "districtadmin":
      return "/districtadmin/dashboard";
    case "partner":
      return "/partner/dashboard";
    default:
      return "/dashboard";
  }
}
