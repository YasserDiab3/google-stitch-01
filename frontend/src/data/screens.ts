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

export type ModuleRoute = {
  key: string;
  title: string;
  table: string;
  category: StitchScreen["category"];
  slug: string;
  description: string;
  platform: string;
  accent: string;
  primaryScreen: StitchScreen;
  variants: StitchScreen[];
  kpis: StitchScreen["kpis"];
};

export const roleLabels: Record<UserRole, string> = {
  admin: "مدير النظام",
  ehs_manager: "مدير السلامة والبيئة",
  supervisor: "مشرف العمليات",
  clinic: "مسؤول العيادة",
  contractor_manager: "مسؤول المقاولين",
  executive: "الإدارة التنفيذية"
};

export const moduleCatalog = {
  riskRegistry: {
    table: "risk_registry",
    title: "سجل المخاطر",
    allowedRoles: ["admin", "ehs_manager", "supervisor", "executive"]
  },
  permitsToWork: {
    table: "permits_to_work",
    title: "تصاريح العمل",
    allowedRoles: ["admin", "ehs_manager", "supervisor"]
  },
  employees: {
    table: "employees_contractors",
    title: "الموظفون والمقاولون",
    allowedRoles: ["admin", "ehs_manager", "contractor_manager"]
  },
  chemicals: {
    table: "chemical_inventory",
    title: "إدارة المواد الكيميائية",
    allowedRoles: ["admin", "ehs_manager", "supervisor"]
  },
  training: {
    table: "training_records",
    title: "التدريب والامتثال",
    allowedRoles: ["admin", "ehs_manager", "contractor_manager", "executive"]
  },
  incidents: {
    table: "incident_reports",
    title: "تقارير الحوادث",
    allowedRoles: ["admin", "ehs_manager", "supervisor", "executive"]
  },
  clinic: {
    table: "clinic_records",
    title: "العيادة الطبية",
    allowedRoles: ["admin", "clinic", "ehs_manager"]
  },
  reports: {
    table: "monthly_ehs_reports",
    title: "التقرير التنفيذي الشهري",
    allowedRoles: ["admin", "ehs_manager", "executive"]
  },
  users: {
    table: "profiles",
    title: "إدارة المستخدمين والصلاحيات",
    allowedRoles: ["admin"]
  }
} as const;

export const navigationScreens: StitchScreen[] = [
  {
    screenId: "2511994950fb4014b5d6b765195917dd",
    slug: "01-risk-registry-module-web",
    title: "سجل المخاطر",
    moduleKey: "riskRegistry",
    platform: "Web",
    description: "إدارة المخاطر المؤسسية، التقييم، خطط التحكم، ومتابعة الإغلاقات.",
    imagePath: "/stitch/01-risk-registry-module-web/screen.png",
    htmlPath: "/stitch/01-risk-registry-module-web/screen.html",
    accent: "#b45309",
    allowedRoles: ["admin", "ehs_manager", "supervisor", "executive"],
    category: "Operations",
    kpis: [
      { label: "مخاطر مفتوحة", value: "24" },
      { label: "عالية الشدة", value: "7" }
    ]
  },
  {
    screenId: "c35ebba97f974b34a464f0d463830255",
    slug: "02-permits-to-work-ptw-management",
    title: "تصاريح العمل",
    moduleKey: "permitsToWork",
    platform: "Web",
    description: "إدارة دورة اعتماد تصاريح العمل وربطها بالمواقع والمقاولين.",
    imagePath: "/stitch/02-permits-to-work-ptw-management/screen.png",
    htmlPath: "/stitch/02-permits-to-work-ptw-management/screen.html",
    accent: "#0f766e",
    allowedRoles: ["admin", "ehs_manager", "supervisor"],
    category: "Operations",
    kpis: [
      { label: "نشطة الآن", value: "13" },
      { label: "بانتظار اعتماد", value: "4" }
    ]
  },
  {
    screenId: "e187e67924e7410a830b6f1971a8c8ae",
    slug: "04-employee-contractor-database-web",
    title: "الموظفون والمقاولون",
    moduleKey: "employees",
    platform: "Web",
    description: "قاعدة بيانات موحدة للموظفين والمقاولين والوثائق والانتهاء.",
    imagePath: "/stitch/04-employee-contractor-database-web/screen.png",
    htmlPath: "/stitch/04-employee-contractor-database-web/screen.html",
    accent: "#2563eb",
    allowedRoles: ["admin", "ehs_manager", "contractor_manager"],
    category: "People",
    kpis: [
      { label: "إجمالي الأفراد", value: "412" },
      { label: "منتهي الامتثال", value: "36" }
    ]
  },
  {
    screenId: "e9d5e941a7bc4c65ae1a912b33cacb8d",
    slug: "05-web",
    title: "إدارة المواد الكيميائية",
    moduleKey: "chemicals",
    platform: "Web",
    description: "متابعة المخزون وSDS والتوافق مع ضوابط التخزين والنقل.",
    imagePath: "/stitch/05-web/screen.png",
    htmlPath: "/stitch/05-web/screen.html",
    accent: "#9333ea",
    allowedRoles: ["admin", "ehs_manager", "supervisor"],
    category: "Operations",
    kpis: [
      { label: "مواد حرجة", value: "18" },
      { label: "SDS مفقود", value: "2" }
    ]
  },
  {
    screenId: "f21d8b43cdce4a19bdb22ed37efec66e",
    slug: "06-training-compliance-dashboard",
    title: "لوحة التدريب والامتثال",
    moduleKey: "training",
    platform: "Dashboard",
    description: "مؤشرات التدريب والانتهاء والالتزام لكل وظيفة وموقع.",
    imagePath: "/stitch/06-training-compliance-dashboard/screen.png",
    htmlPath: "/stitch/06-training-compliance-dashboard/screen.html",
    accent: "#059669",
    allowedRoles: ["admin", "ehs_manager", "contractor_manager", "executive"],
    category: "People",
    kpis: [
      { label: "مكتمل", value: "86%" },
      { label: "دورات منتهية", value: "11" }
    ]
  },
  {
    screenId: "4d157365745049bba3d5e27a0b5b4287",
    slug: "07-monthly-executive-ehs-report-web",
    title: "التقرير التنفيذي الشهري",
    moduleKey: "reports",
    platform: "Web",
    description: "عرض تنفيذي لمؤشرات السلامة، الحوادث، الامتثال والاتجاهات.",
    imagePath: "/stitch/07-monthly-executive-ehs-report-web/screen.png",
    htmlPath: "/stitch/07-monthly-executive-ehs-report-web/screen.html",
    accent: "#dc2626",
    allowedRoles: ["admin", "ehs_manager", "executive"],
    category: "Reporting",
    kpis: [
      { label: "TRIR", value: "0.71" },
      { label: "التقارير الشهرية", value: "12" }
    ]
  },
  {
    screenId: "38cbe317b7cf4a6d9fff0ffc877a0ac7",
    slug: "08-web",
    title: "العيادة الطبية",
    moduleKey: "clinic",
    platform: "Web",
    description: "إدارة الحالات والزيارات المهنية ومتابعة الإجراءات الطبية.",
    imagePath: "/stitch/08-web/screen.png",
    htmlPath: "/stitch/08-web/screen.html",
    accent: "#db2777",
    allowedRoles: ["admin", "clinic", "ehs_manager"],
    category: "Health",
    kpis: [
      { label: "زيارات اليوم", value: "9" },
      { label: "حالات متابعة", value: "3" }
    ]
  },
  {
    screenId: "ec172b122ac74eba80137f1d25e62a80",
    slug: "12-risk-registry-multi-language-web",
    title: "سجل المخاطر متعدد اللغات",
    moduleKey: "riskRegistry",
    platform: "Web",
    description: "نسخة ثنائية اللغة لإدارة المخاطر عبر المواقع والإدارات.",
    imagePath: "/stitch/12-risk-registry-multi-language-web/screen.png",
    htmlPath: "/stitch/12-risk-registry-multi-language-web/screen.html",
    accent: "#92400e",
    allowedRoles: ["admin", "ehs_manager", "supervisor", "executive"],
    category: "Operations",
    kpis: [
      { label: "العربية", value: "مفعلة" },
      { label: "الإنجليزية", value: "مفعلة" }
    ]
  },
  {
    screenId: "dae2eb42f1e5421aac5a19003f6dc3a5",
    slug: "13-rbac",
    title: "إدارة المستخدمين والصلاحيات",
    moduleKey: "users",
    platform: "Web",
    description: "التحكم في الأدوار والصلاحيات والوصول للموديولات حسب المستخدم.",
    imagePath: "/stitch/13-rbac/screen.png",
    htmlPath: "/stitch/13-rbac/screen.html",
    accent: "#7c3aed",
    allowedRoles: ["admin"],
    category: "Security",
    kpis: [
      { label: "أدوار", value: "6" },
      { label: "سياسات", value: "18" }
    ]
  },
  {
    screenId: "8af689f8d0c9402080546ed3060bfe64",
    slug: "14-incident-reports-desktop",
    title: "تقارير الحوادث",
    moduleKey: "incidents",
    platform: "Desktop",
    description: "توثيق الحوادث، التحقيق، الأسباب الجذرية والإجراءات التصحيحية.",
    imagePath: "/stitch/14-incident-reports-desktop/screen.png",
    htmlPath: "/stitch/14-incident-reports-desktop/screen.html",
    accent: "#be123c",
    allowedRoles: ["admin", "ehs_manager", "supervisor", "executive"],
    category: "Reporting",
    kpis: [
      { label: "حوادث مفتوحة", value: "5" },
      { label: "إجراءات متأخرة", value: "2" }
    ]
  },
  {
    screenId: "8e9cd013301647ae987fa5a91c49ec6b",
    slug: "15-clinic-chemical-management",
    title: "العيادة والمواد الكيميائية",
    moduleKey: "clinic",
    platform: "Dashboard",
    description: "لوحة تشغيل موحدة للحالات الطبية والمخاطر الكيميائية.",
    imagePath: "/stitch/15-clinic-chemical-management/screen.png",
    htmlPath: "/stitch/15-clinic-chemical-management/screen.html",
    accent: "#ea580c",
    allowedRoles: ["admin", "clinic", "ehs_manager"],
    category: "Health",
    kpis: [
      { label: "تنبيهات حالية", value: "4" },
      { label: "نقاط تكامل", value: "2" }
    ]
  }
];

export const modules: ModuleItem[] = Object.entries(moduleCatalog).map(([key, value]) => ({
  key,
  table: value.table,
  title: value.title,
  allowedRoles: [...value.allowedRoles]
}));

export function getAllowedScreens(role: UserRole) {
  return navigationScreens.filter((screen) => screen.allowedRoles.includes(role));
}

export function getAllowedModules(role: UserRole) {
  return modules.filter((module) => module.allowedRoles.includes(role));
}

function getScreenPriority(screen: StitchScreen) {
  let score = 0;

  if (screen.platform === "Web") {
    score += 30;
  } else if (screen.platform === "Desktop") {
    score += 20;
  } else if (screen.platform === "Dashboard") {
    score += 10;
  }

  if (screen.title.includes("متعدد اللغات")) {
    score -= 8;
  }

  if (screen.title.includes("والمواد الكيميائية")) {
    score -= 12;
  }

  return score;
}

export function getModuleRoutes(role: UserRole): ModuleRoute[] {
  const allowedScreens = getAllowedScreens(role);
  const allowedModules = getAllowedModules(role);

  return allowedModules
    .map((module) => {
      const variants = allowedScreens
        .filter((screen) => screen.moduleKey === module.key)
        .sort((left, right) => getScreenPriority(right) - getScreenPriority(left));

      const primaryScreen = variants[0];

      if (!primaryScreen) {
        return null;
      }

      return {
        key: module.key,
        title: module.title,
        table: module.table,
        category: primaryScreen.category,
        slug: module.key,
        description: primaryScreen.description,
        platform: primaryScreen.platform,
        accent: primaryScreen.accent,
        primaryScreen,
        variants,
        kpis: primaryScreen.kpis
      } satisfies ModuleRoute;
    })
    .filter((route): route is ModuleRoute => Boolean(route));
}
