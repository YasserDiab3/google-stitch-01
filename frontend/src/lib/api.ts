import type { ModuleItem, StitchScreen, UserRole } from "../data/screens";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleLabel?: string;
};

async function apiFetch<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "API request failed");
  }

  return (await response.json()) as T;
}

export async function fetchCurrentUser(token: string) {
  return apiFetch<{ user: ApiUser }>("/auth/me", token);
}

export async function fetchAllowedScreens(token: string) {
  return apiFetch<{ user: ApiUser; screens: StitchScreen[] }>("/navigation/screens", token);
}

export async function fetchAllowedModules(token: string) {
  return apiFetch<{ modules: ModuleItem[] }>("/modules", token);
}
