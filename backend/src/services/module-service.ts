import { moduleCatalog, type ModuleKey } from "../config/modules.js";
import { supabaseAdmin } from "../lib/supabase.js";

function applyPeopleFilter<TQuery>(query: TQuery, moduleKey: ModuleKey) {
  const builder = query as TQuery & {
    ilike: (column: string, pattern: string) => TQuery;
    not: (column: string, operator: string, value: string) => TQuery;
  };

  if (moduleKey === "contractors") {
    return builder.ilike("employer_type", "%contract%");
  }

  if (moduleKey === "employees") {
    return builder.not("employer_type", "ilike", "%contract%");
  }

  return query;
}

export async function listModuleRows(moduleKey: ModuleKey, limit = 50) {
  const table = moduleCatalog[moduleKey].table;
  const query = applyPeopleFilter(supabaseAdmin.from(table).select("*"), moduleKey).limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getModuleRow(moduleKey: ModuleKey, id: string) {
  const table = moduleCatalog[moduleKey].table;
  const query = applyPeopleFilter(supabaseAdmin.from(table).select("*").eq("id", id), moduleKey);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function createModuleRow(moduleKey: ModuleKey, payload: Record<string, unknown>) {
  const table = moduleCatalog[moduleKey].table;
  const normalizedPayload =
    moduleKey === "employees"
      ? {
          employer_type: "employee",
          ...payload
        }
      : moduleKey === "contractors"
        ? {
            employer_type: "contractor",
            ...payload
          }
        : payload;

  const { data, error } = await supabaseAdmin
    .from(table)
    .insert(normalizedPayload)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateModuleRow(
  moduleKey: ModuleKey,
  id: string,
  payload: Record<string, unknown>
) {
  const table = moduleCatalog[moduleKey].table;
  const normalizedPayload =
    moduleKey === "employees"
      ? {
          ...payload,
          employer_type: "employee"
        }
      : moduleKey === "contractors"
        ? {
            ...payload,
            employer_type: "contractor"
          }
        : payload;

  const { data, error } = await supabaseAdmin
    .from(table)
    .update(normalizedPayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function findEmployeeByCode(employeeCode: string) {
  const { data, error } = await supabaseAdmin
    .from("employees_contractors")
    .select("id, employee_no, full_name, employer_type, department, compliance_status")
    .ilike("employee_no", employeeCode.trim())
    .single();

  if (error) {
    throw error;
  }

  return data;
}
