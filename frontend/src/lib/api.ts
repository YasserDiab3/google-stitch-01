import { getAllowedModules, getAllowedScreens, roleLabels, type ModuleItem, type StitchScreen, type UserRole } from "../data/screens";
import { supabase } from "./supabase";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl || "http://localhost:8080/api";
const defaultLoginEmail = import.meta.env.VITE_DEFAULT_LOGIN_EMAIL?.trim().toLowerCase();
const backendIsPlaceholder = !configuredApiBaseUrl || configuredApiBaseUrl.includes("example.com");

export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleLabel?: string;
};

export type RiskRegistryRow = {
  id: string;
  title: string;
  category: string | null;
  severity: number | null;
  likelihood: number | null;
  status: string;
  owner_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  if (backendIsPlaceholder) {
    throw new Error("Backend unavailable");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
      ,
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "API request failed");
  }

  return (await response.json()) as T;
}

function inferRoleFromEmail(email: string): UserRole {
  const normalizedEmail = email.toLowerCase();

  if (defaultLoginEmail && normalizedEmail === defaultLoginEmail) {
    return "admin";
  }

  if (normalizedEmail.includes("clinic")) {
    return "clinic";
  }

  if (normalizedEmail.includes("contract")) {
    return "contractor_manager";
  }

  if (normalizedEmail.includes("supervisor")) {
    return "supervisor";
  }

  if (normalizedEmail.includes("ehs")) {
    return "ehs_manager";
  }

  return "executive";
}

async function buildLocalUser(token: string): Promise<ApiUser> {
  if (!supabase) {
    throw new Error("Supabase client is not configured");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    throw error || new Error("Unable to resolve authenticated user");
  }

  const roleFromMetadata = (data.user.user_metadata?.role ||
    data.user.app_metadata?.role) as UserRole | undefined;
  const role = roleFromMetadata && roleLabels[roleFromMetadata] ? roleFromMetadata : inferRoleFromEmail(data.user.email);

  return {
    id: data.user.id,
    email: data.user.email,
    fullName:
      (data.user.user_metadata?.full_name as string | undefined) ||
      data.user.email.split("@")[0],
    role,
    roleLabel: roleLabels[role]
  };
}

export async function fetchCurrentUser(token: string) {
  try {
    return await apiFetch<{ user: ApiUser }>("/auth/me", token);
  } catch {
    return { user: await buildLocalUser(token) };
  }
}

export async function fetchAllowedScreens(token: string) {
  try {
    return await apiFetch<{ user: ApiUser; screens: StitchScreen[] }>("/navigation/screens", token);
  } catch {
    const user = await buildLocalUser(token);
    return {
      user,
      screens: getAllowedScreens(user.role)
    };
  }
}

export async function fetchAllowedModules(token: string) {
  try {
    return await apiFetch<{ modules: ModuleItem[] }>("/modules", token);
  } catch {
    const user = await buildLocalUser(token);
    return {
      modules: getAllowedModules(user.role)
    };
  }
}

export async function listRiskRegistry(token: string) {
  return apiFetch<{ moduleKey: "riskRegistry"; data: RiskRegistryRow[] }>("/modules/riskRegistry", token);
}

export async function createRiskRegistryEntry(
  token: string,
  payload: Partial<RiskRegistryRow> & Pick<RiskRegistryRow, "title">
) {
  return apiFetch<{ moduleKey: "riskRegistry"; data: RiskRegistryRow }>(
    "/modules/riskRegistry",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function updateRiskRegistryEntry(
  token: string,
  id: string,
  payload: Partial<RiskRegistryRow>
) {
  return apiFetch<{ moduleKey: "riskRegistry"; data: RiskRegistryRow }>(
    `/modules/riskRegistry/${id}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload)
    }
  );
}
