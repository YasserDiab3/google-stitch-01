import { moduleTableMap, type ModuleKey } from "../config/modules.js";
import { supabaseAdmin } from "../lib/supabase.js";

export async function listModuleRows(moduleKey: ModuleKey, limit = 50) {
  const table = moduleTableMap[moduleKey];
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(limit);
  if (error) throw error;
  return data;
}

export async function getModuleRow(moduleKey: ModuleKey, id: string) {
  const table = moduleTableMap[moduleKey];
  const { data, error } = await supabaseAdmin.from(table).select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function createModuleRow(moduleKey: ModuleKey, payload: Record<string, unknown>) {
  const table = moduleTableMap[moduleKey];
  const { data, error } = await supabaseAdmin.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateModuleRow(
  moduleKey: ModuleKey,
  id: string,
  payload: Record<string, unknown>
) {
  const table = moduleTableMap[moduleKey];
  const { data, error } = await supabaseAdmin
    .from(table)
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
