export type StitchScreen = {
  screenId: string;
  slug: string;
  title: string;
  moduleKey: string;
  platform: string;
  description: string;
  imagePath: string;
  htmlPath: string;
};

export const screens: StitchScreen[] = [
  {
    screenId: "2511994950fb4014b5d6b765195917dd",
    slug: "01-risk-registry-module-web",
    title: "Risk Registry Module (Web)",
    moduleKey: "risk-registry",
    platform: "Web",
    description: "إدارة سجل المخاطر، تقييم الشدة والاحتمال، ومتابعة ضوابط التحكم.",
    imagePath: "/stitch/01-risk-registry-module-web/screen.png",
    htmlPath: "/stitch/01-risk-registry-module-web/screen.html"
  },
  {
    screenId: "c35ebba97f974b34a464f0d463830255",
    slug: "02-permits-to-work-ptw-management",
    title: "Permits to Work (PTW) Management",
    moduleKey: "permits-to-work",
    platform: "Web",
    description: "إدارة تصاريح العمل، الموافقات، ومراقبة حالة التنفيذ.",
    imagePath: "/stitch/02-permits-to-work-ptw-management/screen.png",
    htmlPath: "/stitch/02-permits-to-work-ptw-management/screen.html"
  },
  {
    screenId: "da1b82dab78c403cb1ab6bf7a824056f",
    slug: "03-login-screen-multi-language-web",
    title: "Login Screen - Multi-language (Web)",
    moduleKey: "auth-login",
    platform: "Web",
    description: "شاشة تسجيل دخول متعددة اللغات مع قابلية الربط بمصادقة Supabase.",
    imagePath: "/stitch/03-login-screen-multi-language-web/screen.png",
    htmlPath: "/stitch/03-login-screen-multi-language-web/screen.html"
  },
  {
    screenId: "e187e67924e7410a830b6f1971a8c8ae",
    slug: "04-employee-contractor-database-web",
    title: "Employee & Contractor Database (Web)",
    moduleKey: "employees",
    platform: "Web",
    description: "قاعدة بيانات الموظفين والمقاولين ومتابعة حالة الامتثال والوثائق.",
    imagePath: "/stitch/04-employee-contractor-database-web/screen.png",
    htmlPath: "/stitch/04-employee-contractor-database-web/screen.html"
  },
  {
    screenId: "e9d5e941a7bc4c65ae1a912b33cacb8d",
    slug: "05-web",
    title: "إدارة المواد الكيميائية (Web)",
    moduleKey: "chemicals",
    platform: "Web",
    description: "إدارة سجلات المواد الكيميائية، SDS، وحدود التخزين والاستخدام.",
    imagePath: "/stitch/05-web/screen.png",
    htmlPath: "/stitch/05-web/screen.html"
  },
  {
    screenId: "f21d8b43cdce4a19bdb22ed37efec66e",
    slug: "06-training-compliance-dashboard",
    title: "Training & Compliance Dashboard",
    moduleKey: "training",
    platform: "Dashboard",
    description: "لوحة متابعة التدريب والانتهاء والامتثال على مستوى الأفراد والأقسام.",
    imagePath: "/stitch/06-training-compliance-dashboard/screen.png",
    htmlPath: "/stitch/06-training-compliance-dashboard/screen.html"
  },
  {
    screenId: "4d157365745049bba3d5e27a0b5b4287",
    slug: "07-monthly-executive-ehs-report-web",
    title: "Monthly Executive EHS Report (Web)",
    moduleKey: "reports",
    platform: "Web",
    description: "تقرير تنفيذي شهري للمؤشرات، الحوادث، والاتجاهات الرئيسية في EHS.",
    imagePath: "/stitch/07-monthly-executive-ehs-report-web/screen.png",
    htmlPath: "/stitch/07-monthly-executive-ehs-report-web/screen.html"
  },
  {
    screenId: "38cbe317b7cf4a6d9fff0ffc877a0ac7",
    slug: "08-web",
    title: "العيادة الطبية (Web)",
    moduleKey: "clinic",
    platform: "Web",
    description: "إدارة العيادة الطبية، الزيارات، المتابعات، والحالات المهنية.",
    imagePath: "/stitch/08-web/screen.png",
    htmlPath: "/stitch/08-web/screen.html"
  },
  {
    screenId: "594a8738841349a88ad5cb0c3ff238a0",
    slug: "09-forgot-password-desktop",
    title: "Forgot Password (Desktop)",
    moduleKey: "auth-recovery",
    platform: "Desktop",
    description: "شاشة استعادة كلمة المرور قابلة للربط مع مسار reset في Supabase Auth.",
    imagePath: "/stitch/09-forgot-password-desktop/screen.png",
    htmlPath: "/stitch/09-forgot-password-desktop/screen.html"
  },
  {
    screenId: "6791abc87e3e4381a4262b024e4a2d35",
    slug: "10-recover-access-multi-language-web",
    title: "Recover Access - Multi-language (Web)",
    moduleKey: "auth-recovery",
    platform: "Web",
    description: "استعادة الوصول متعدد اللغات لحسابات المستخدمين.",
    imagePath: "/stitch/10-recover-access-multi-language-web/screen.png",
    htmlPath: "/stitch/10-recover-access-multi-language-web/screen.html"
  },
  {
    screenId: "80040cd8dea544f6aaf9b042c7f48a86",
    slug: "11-login-screen-desktop",
    title: "Login Screen (Desktop)",
    moduleKey: "auth-login",
    platform: "Desktop",
    description: "نسخة سطح مكتب لتسجيل الدخول يمكن تكييفها لسيناريوهات التشغيل الداخلية.",
    imagePath: "/stitch/11-login-screen-desktop/screen.png",
    htmlPath: "/stitch/11-login-screen-desktop/screen.html"
  },
  {
    screenId: "ec172b122ac74eba80137f1d25e62a80",
    slug: "12-risk-registry-multi-language-web",
    title: "Risk Registry - Multi-language (Web)",
    moduleKey: "risk-registry",
    platform: "Web",
    description: "نسخة متعددة اللغات من سجل المخاطر للبيئات ثنائية اللغة.",
    imagePath: "/stitch/12-risk-registry-multi-language-web/screen.png",
    htmlPath: "/stitch/12-risk-registry-multi-language-web/screen.html"
  },
  {
    screenId: "dae2eb42f1e5421aac5a19003f6dc3a5",
    slug: "13-rbac",
    title: "إدارة المستخدمين والصلاحيات (RBAC)",
    moduleKey: "rbac",
    platform: "Web",
    description: "إدارة المستخدمين والأدوار والصلاحيات على مستوى النظام والوحدات.",
    imagePath: "/stitch/13-rbac/screen.png",
    htmlPath: "/stitch/13-rbac/screen.html"
  },
  {
    screenId: "8af689f8d0c9402080546ed3060bfe64",
    slug: "14-incident-reports-desktop",
    title: "Incident Reports - Desktop",
    moduleKey: "incidents",
    platform: "Desktop",
    description: "شاشة تقارير الحوادث والتحقيق والإجراءات التصحيحية.",
    imagePath: "/stitch/14-incident-reports-desktop/screen.png",
    htmlPath: "/stitch/14-incident-reports-desktop/screen.html"
  },
  {
    screenId: "8e9cd013301647ae987fa5a91c49ec6b",
    slug: "15-clinic-chemical-management",
    title: "Clinic & Chemical Management",
    moduleKey: "clinic-chemicals",
    platform: "Dashboard",
    description: "لوحة موحدة بين إدارة العيادة وإدارة المواد الكيميائية.",
    imagePath: "/stitch/15-clinic-chemical-management/screen.png",
    htmlPath: "/stitch/15-clinic-chemical-management/screen.html"
  }
];
