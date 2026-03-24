export type UserRole =
  | "admin"
  | "ehs_manager"
  | "supervisor"
  | "clinic"
  | "contractor_manager"
  | "executive";

export type StitchScreen = {
  screenId: string;
  slug: string;
  title: string;
  moduleKey: string;
  platform: string;
  description: string;
  imagePath: string;
  htmlPath: string;
  accent: string;
  allowedRoles: UserRole[];
  category: "Operations" | "People" | "Health" | "Reporting" | "Security" | "Access";
  kpis: Array<{
    label: string;
    value: string;
  }>;
};

export type ModuleItem = {
  key: string;
  table: string;
  title: string;
  allowedRoles: UserRole[];
};

export const roleLabels: Record<UserRole, string> = {
  admin: "مدير النظام",
  ehs_manager: "مدير السلامة والبيئة",
  supervisor: "مشرف العمليات",
  clinic: "مسؤول العيادة",
  contractor_manager: "مسؤول المقاولين",
  executive: "الإدارة التنفيذية"
};
