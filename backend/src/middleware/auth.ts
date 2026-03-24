import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin, supabaseAuth } from "../lib/supabase.js";
import type { UserRole } from "../config/modules.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  authUser: AuthenticatedUser;
  accessToken: string;
};

async function getOrCreateProfile(userId: string, email: string, fullName: string) {
  const { data: existingProfile, error: selectError } = await supabaseAdmin
    .from("profiles")
    .select("full_name, role")
    .eq("id", userId)
    .single();

  if (!selectError && existingProfile) {
    return {
      fullName:
        typeof existingProfile.full_name === "string" && existingProfile.full_name.trim()
          ? existingProfile.full_name
          : fullName,
      role: (existingProfile.role as UserRole) || "executive"
    };
  }

  const { data: insertedProfile, error: insertError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role: "executive",
        locale: "ar",
        is_active: true
      },
      {
        onConflict: "id"
      }
    )
    .select("full_name, role")
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    fullName:
      typeof insertedProfile.full_name === "string" && insertedProfile.full_name.trim()
        ? insertedProfile.full_name
        : fullName,
    role: (insertedProfile.role as UserRole) || "executive"
  };
}

export async function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!token) {
      response.status(401).json({ error: "Missing bearer token" });
      return;
    }

    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      response.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    const email = data.user.email || "";
    const fullName =
      typeof data.user.user_metadata.full_name === "string" && data.user.user_metadata.full_name.trim()
        ? data.user.user_metadata.full_name
        : email.split("@")[0] || "User";

    const profile = await getOrCreateProfile(data.user.id, email, fullName);

    (request as AuthenticatedRequest).authUser = {
      id: data.user.id,
      email,
      fullName: profile.fullName,
      role: profile.role
    };
    (request as AuthenticatedRequest).accessToken = token;

    next();
  } catch (error) {
    next(error);
  }
}
