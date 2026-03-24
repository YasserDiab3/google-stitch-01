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

export type PermitToWorkRow = {
  id: string;
  permit_no: string;
  work_type: string;
  area: string | null;
  site_id?: string | null;
  description: string | null;
  contractor_name: string | null;
  contractor_id?: string | null;
  requested_by: string | null;
  approved_by: string | null;
  status: string;
  current_step: string;
  area_manager_status: string;
  quality_status: string;
  safety_status: string;
  permit_approver_status: string;
  rejection_reason: string | null;
  opened_at: string | null;
  opened_by: string | null;
  final_approved_at: string | null;
  exported_at: string | null;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
};

export type PermitNotificationRow = {
  id: string;
  permit_id: string;
  event_type: string;
  recipient_role: string;
  message: string;
  created_by: string | null;
  is_read: boolean;
  created_at: string;
};

export type PermitMetaPayload = {
  permitTypes: Array<{ value: string; label: string }>;
  contractors: Array<{ id: string; full_name: string; employee_no: string | null }>;
  sites: Array<{ id: string; name: string; code: string | null }>;
  nextPermitNo: string;
};

export type WorkforceRow = {
  id: string;
  employee_no: string | null;
  full_name: string;
  employer_type: string;
  department: string | null;
  compliance_status: string | null;
  created_at: string;
  updated_at: string;
};

export type ManagedUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  department: string | null;
  is_active: boolean;
  locale: string | null;
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
      Authorization: `Bearer ${token}`,
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

  if (normalizedEmail.includes("request")) {
    return "permit_requester";
  }

  if (normalizedEmail.includes("approver")) {
    return "permit_approver";
  }

  if (normalizedEmail.includes("quality")) {
    return "quality";
  }

  if (normalizedEmail.includes("safety")) {
    return "safety";
  }

  if (normalizedEmail.includes("area")) {
    return "area_manager";
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

export async function listPermitsToWork(token: string) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitToWorkRow[] }>("/modules/permitsToWork", token);
}

export async function listWorkforceModule(token: string, moduleKey: "employees" | "contractors") {
  return apiFetch<{ moduleKey: "employees" | "contractors"; data: WorkforceRow[] }>(
    `/modules/${moduleKey}`,
    token
  );
}

export async function createWorkforceEntry(
  token: string,
  moduleKey: "employees" | "contractors",
  payload: Partial<WorkforceRow> & Pick<WorkforceRow, "full_name">
) {
  return apiFetch<{ moduleKey: "employees" | "contractors"; data: WorkforceRow }>(
    `/modules/${moduleKey}`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function listManagedUsers(token: string) {
  return apiFetch<{ moduleKey: "users"; data: ManagedUserRow[] }>("/modules/users", token);
}

export async function createManagedUserEntry(
  token: string,
  payload: {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    department?: string | null;
    locale?: string | null;
    is_active?: boolean;
  }
) {
  return apiFetch<{ moduleKey: "users"; data: ManagedUserRow }>("/modules/users", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateManagedUserEntry(
  token: string,
  id: string,
  payload: Partial<ManagedUserRow>
) {
  return apiFetch<{ moduleKey: "users"; data: ManagedUserRow }>(`/modules/users/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function getPermitToWorkMeta(token: string) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitMetaPayload }>(
    "/modules/permitsToWork/meta/options",
    token
  );
}

export async function createPermitToWorkEntry(
  token: string,
  payload: Partial<PermitToWorkRow> &
    Pick<PermitToWorkRow, "work_type"> & {
      description?: string | null;
      contractor_name?: string | null;
      contractor_id?: string | null;
      site_id?: string | null;
    }
) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitToWorkRow }>(
    "/modules/permitsToWork",
    token,
    {
      method: "POST",
      body: JSON.stringify(payload)
    }
  );
}

export async function openPermitToWorkEntry(token: string, id: string) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitToWorkRow }>(
    `/modules/permitsToWork/${id}/open`,
    token,
    {
      method: "POST"
    }
  );
}

export async function decidePermitToWorkEntry(
  token: string,
  id: string,
  action: "approve" | "reject",
  comment?: string
) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitToWorkRow }>(
    `/modules/permitsToWork/${id}/decision`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ action, comment })
    }
  );
}

export async function closePermitToWorkEntry(token: string, id: string) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitToWorkRow }>(
    `/modules/permitsToWork/${id}/close`,
    token,
    {
      method: "POST"
    }
  );
}

export async function exportPermitToWorkEntry(token: string, id: string) {
  if (backendIsPlaceholder) {
    throw new Error("Backend unavailable");
  }

  const response = await fetch(`${apiBaseUrl}/modules/permitsToWork/${id}/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error || "API request failed");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename=\"?([^"]+)\"?/i);

  return {
    blob,
    filename: filenameMatch?.[1] || "permit-export.csv"
  };
}

export async function listPermitNotifications(token: string, id: string) {
  return apiFetch<{ moduleKey: "permitsToWork"; data: PermitNotificationRow[] }>(
    `/modules/permitsToWork/${id}/notifications`,
    token
  );
}
