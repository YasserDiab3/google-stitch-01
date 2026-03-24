export const moduleTableMap = {
  riskRegistry: "risk_registry",
  permitsToWork: "permits_to_work",
  employees: "employees_contractors",
  chemicals: "chemical_inventory",
  training: "training_records",
  incidents: "incident_reports",
  clinic: "clinic_records",
  reports: "monthly_ehs_reports",
  users: "profiles"
} as const;

export type ModuleKey = keyof typeof moduleTableMap;

export const modules = Object.entries(moduleTableMap).map(([key, table]) => ({
  key,
  table
}));
