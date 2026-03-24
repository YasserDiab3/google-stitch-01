import type { UserRole } from "../config/modules.js";
import { supabaseAdmin } from "../lib/supabase.js";

export type ManagedUserProfile = {
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

type CreateManagedUserInput = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  department?: string | null;
  locale?: string | null;
  isActive?: boolean;
};

type UpdateManagedUserInput = {
  fullName?: string;
  role?: UserRole;
  department?: string | null;
  locale?: string | null;
  isActive?: boolean;
};

export async function listManagedUsers() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, role, department, is_active, locale, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []) as ManagedUserProfile[];
}

export async function createManagedUser(input: CreateManagedUserInput) {
  const { data: createdUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      role: input.role
    },
    app_metadata: {
      role: input.role
    }
  });

  if (authError || !createdUser.user) {
    throw authError || new Error("Failed to create auth user");
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: createdUser.user.id,
        email: input.email,
        full_name: input.fullName,
        role: input.role,
        department: input.department || null,
        locale: input.locale || "ar",
        is_active: input.isActive ?? true
      },
      {
        onConflict: "id"
      }
    )
    .select("id, email, full_name, role, department, is_active, locale, created_at, updated_at")
    .single();

  if (profileError) {
    throw profileError;
  }

  return profile as ManagedUserProfile;
}

export async function updateManagedUser(id: string, input: UpdateManagedUserInput) {
  const updatePayload: Record<string, unknown> = {};

  if (typeof input.fullName === "string") {
    updatePayload.full_name = input.fullName;
  }
  if (typeof input.role === "string") {
    updatePayload.role = input.role;
  }
  if (input.department !== undefined) {
    updatePayload.department = input.department;
  }
  if (input.locale !== undefined) {
    updatePayload.locale = input.locale;
  }
  if (typeof input.isActive === "boolean") {
    updatePayload.is_active = input.isActive;
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", id)
    .select("id, email, full_name, role, department, is_active, locale, created_at, updated_at")
    .single();

  if (profileError) {
    throw profileError;
  }

  if (typeof input.role === "string" || typeof input.fullName === "string") {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        ...(typeof input.fullName === "string" ? { full_name: input.fullName } : {}),
        ...(typeof input.role === "string" ? { role: input.role } : {})
      },
      app_metadata: typeof input.role === "string" ? { role: input.role } : undefined
    });

    if (authError) {
      throw authError;
    }
  }

  return profile as ManagedUserProfile;
}
