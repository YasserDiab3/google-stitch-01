import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  closePermitToWorkEntry,
  createRiskRegistryEntry,
  createPermitToWorkEntry,
  decidePermitToWorkEntry,
  exportPermitToWorkEntry,
  fetchAllowedModules,
  fetchAllowedScreens,
  fetchCurrentUser,
  getPermitToWorkMeta,
  listPermitNotifications,
  listRiskRegistry,
  listPermitsToWork,
  openPermitToWorkEntry,
  updateRiskRegistryEntry,
  type ApiUser,
  type PermitMetaPayload,
  type PermitNotificationRow,
  type PermitToWorkRow,
  type RiskRegistryRow
} from "./lib/api";
import { supabase } from "./lib/supabase";
import { getModuleRoutes, roleLabels, type ModuleItem, type ModuleRoute, type StitchScreen, type UserRole } from "./data/screens";

type AuthState = {
  user: ApiUser | null;
  accessToken: string;
};

type ActiveSession = {
  user: ApiUser;
  accessToken: string;
};

type LoginState = {
  email: string;
  password: string;
  loading: boolean;
  error: string;
};

type RecoveryState = "request" | "reset";

type AuthLocale = "ar" | "en";

type RiskTab = "all" | "open" | "high" | "closed";

type RiskFormState = {
  title: string;
  category: string;
  severity: number;
  likelihood: number;
  dueDate: string;
};

type PermitTab = "all" | "pending" | "approved" | "rejected" | "closed";

type PermitFormState = {
  workType: string;
  siteId: string;
  contractorId: string;
  description: string;
  validFrom: string;
  validTo: string;
};

const loginCopy = {
  ar: {
    dir: "rtl",
    language: "العربية",
    secureTitle: "دخول آمن",
    secureSubtitle: "سجّل الدخول للوصول إلى لوحة السلامة والموديولات المسموحة حسب صلاحيتك.",
    brandHeadline: "طبقة الأمان التشغيلية الأكثر اعتماداً.",
    brandBody:
      "إدارة الصحة والسلامة والبيئة بمنهجية مؤسسية واضحة، وصول محمي، وتجربة تشغيل إنتاجية جاهزة.",
    status: "كل بروتوكولات السلامة مؤمنة",
    username: "البريد الإلكتروني / اسم المستخدم",
    usernamePlaceholder: "user@company.com",
    password: "كلمة المرور",
    forgot: "نسيت كلمة المرور؟",
    login: "الدخول إلى النظام ←",
    authenticating: "جاري التحقق...",
    with: "أو سجل الدخول بشكل آمن عبر",
    touchId: "Touch ID",
    faceId: "Face ID",
    accessTitle: "بيانات الدخول",
    accessNone: "لا توجد بيانات دخول افتراضية مدمجة داخل المشروع.",
    accessHint: "استخدم حساب Supabase الذي أنشأته من لوحة Authentication أو عرّف بيانات العرض داخل متغيرات البيئة.",
    accessEmail: "اسم المستخدم",
    accessPassword: "كلمة المرور",
    accessPasswordFallback: "غير محددة داخل المشروع",
    notes: "ملاحظات الوصول الآمن",
    note1: "تسجيل الدخول الفعلي يتم عبر signInWithPassword.",
    note2: "الخلفية تحمل أو تنشئ profile تلقائياً بعد نجاح الدخول.",
    note3: "القائمة والصفحات تُحمّل من الخلفية حسب الصلاحية.",
    warning: "إعدادات Supabase غير مكتملة داخل متغيرات البيئة.",
    genericError: "تعذر تسجيل الدخول",
    resetTitle: "استعادة كلمة المرور",
    resetBody: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين عبر Supabase Auth.",
    resetHint: "أدخل بريدك الإلكتروني لاستلام رابط إعادة تعيين كلمة المرور.",
    sendReset: "إرسال رابط الاستعادة",
    sendingReset: "جاري الإرسال...",
    resetSent: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور الجديدة",
    resetPassword: "تعيين كلمة المرور الجديدة",
    updatingPassword: "جاري تحديث كلمة المرور...",
    passwordUpdated: "تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
    recoveryInvalid: "رابط الاستعادة غير صالح أو منتهي. اطلب رابطاً جديداً.",
    passwordMismatch: "كلمتا المرور غير متطابقتين.",
    passwordTooShort: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل.",
    backToLogin: "العودة إلى تسجيل الدخول",
    safetyManual: "دليل السلامة",
    privacy: "الخصوصية",
    support: "الدعم"
  },
  en: {
    dir: "ltr",
    language: "English",
    secureTitle: "Secure Access",
    secureSubtitle:
      "Please authenticate to access your safety dashboard and authorized operational modules.",
    brandHeadline: "The Authoritative Safety Layer.",
    brandBody:
      "Managing environmental, health, and safety protocols with Swiss-grade precision and operational clarity.",
    status: "All Protocols Secure",
    username: "USERNAME / EMAIL",
    usernamePlaceholder: "user@company.com",
    password: "PASSWORD",
    forgot: "Forgot Password?",
    login: "Authenticate →",
    authenticating: "Authenticating...",
    with: "OR SECURE LOGIN WITH",
    touchId: "Touch ID",
    faceId: "Face ID",
    accessTitle: "Access Credentials",
    accessNone: "There are no built-in default credentials in this project.",
    accessHint: "Use a Supabase account you created in Authentication, or define display credentials through environment variables.",
    accessEmail: "Username",
    accessPassword: "Password",
    accessPasswordFallback: "Not defined in the project",
    notes: "SECURE ACCESS NOTES",
    note1: "Real sign-in uses signInWithPassword.",
    note2: "The backend loads or creates the user profile after login.",
    note3: "Navigation and pages are loaded from the backend by role.",
    warning: "Supabase environment variables are missing or incomplete.",
    genericError: "Unable to sign in",
    resetTitle: "Forgot Password",
    resetBody: "Enter your email and we will send you a reset link using Supabase Auth.",
    resetHint: "Enter your email to receive a password reset link.",
    sendReset: "Send Reset Link",
    sendingReset: "Sending...",
    resetSent: "Password reset link sent successfully to your email.",
    newPassword: "NEW PASSWORD",
    confirmPassword: "CONFIRM PASSWORD",
    resetPassword: "Set New Password",
    updatingPassword: "Updating password...",
    passwordUpdated: "Password updated successfully. You can sign in now.",
    recoveryInvalid: "Recovery link is invalid or expired. Request a new one.",
    passwordMismatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 8 characters.",
    backToLogin: "Back to login",
    safetyManual: "SAFETY MANUAL",
    privacy: "PRIVACY",
    support: "SUPPORT"
  }
} as const;

const defaultLoginEmail = import.meta.env.VITE_DEFAULT_LOGIN_EMAIL;
const defaultLoginPasswordHint = import.meta.env.VITE_DEFAULT_LOGIN_PASSWORD_HINT;

function getRoleSummary(role: UserRole) {
  switch (role) {
    case "admin":
      return "وصول كامل إلى جميع الموديولات والإدارة والصلاحيات.";
    case "ehs_manager":
      return "إدارة المخاطر، الحوادث، التدريب، والتقارير التشغيلية.";
    case "supervisor":
      return "متابعة التشغيل اليومي والتصاريح وسجل المخاطر.";
    case "clinic":
      return "إدارة الحالات الطبية والعيادة وربط التنبيهات الصحية.";
    case "contractor_manager":
      return "متابعة المقاولين والتدريب ووثائق الامتثال.";
    case "executive":
      return "عرض تنفيذي للمؤشرات والتقارير دون صلاحيات تشغيلية كاملة.";
  }
}

async function loadServerSession(): Promise<AuthState | null> {
  if (!supabase) {
    return null;
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  const me = await fetchCurrentUser(session.access_token);
  return {
    user: me.user,
    accessToken: session.access_token
  };
}

function LoginPage({
  onLogin,
  isConfigured
}: {
  onLogin: (state: ActiveSession) => void;
  isConfigured: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [locale, setLocale] = useState<AuthLocale>("ar");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    loading: false,
    error: ""
  });

  const destination = (location.state as { from?: string } | undefined)?.from || "/app";
  const copy = loginCopy[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState((current) => ({ ...current, error: "" }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password
      });

      if (error || !data.session?.access_token) {
        throw error || new Error(copy.genericError);
      }

      const me = await fetchCurrentUser(data.session.access_token);
      onLogin({
        user: me.user,
        accessToken: data.session.access_token
      });
      navigate(destination, { replace: true });
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : copy.genericError,
        loading: false
      }));
      return;
    }

    setState((current) => ({ ...current, loading: false }));
  }

  return (
    <div className={`auth-shell ${locale === "en" ? "locale-en" : ""}`} dir={copy.dir}>
      <section className="login-panel">
        <aside className="login-brand-panel">
          <div className="brand-top">
            <div className="brand-title">Sentinel EHS</div>
            <span className="brand-underline" />
          </div>

          <div className="brand-message">
            <h1>{copy.brandHeadline}</h1>
            <p>{copy.brandBody}</p>
          </div>

          <div className="status-panel">
            <span className="status-label">SYSTEM STATUS</span>
            <div className="status-row">
              <span className="status-dot" />
              <strong>{copy.status}</strong>
            </div>
          </div>

          <div className="brand-footer">© 2026 Sentinel EHS Systems. All rights reserved.</div>
        </aside>

        <div className="login-form-panel">
          <button
            className="language-switch"
            type="button"
            onClick={() => setLocale((current) => (current === "ar" ? "en" : "ar"))}
          >
            🌐 {copy.language}
          </button>

          <div className="login-card sleek-login-card">
            <div className="login-card-head login-head-spaced">
              <div>
                <h2>{copy.secureTitle}</h2>
                <p>{copy.secureSubtitle}</p>
              </div>
            </div>

            <form className="login-form polished-login-form" onSubmit={handleSubmit}>
              <label>
                {copy.username}
                <div className="input-shell">
                  <span className="input-icon">👤</span>
                  <input
                    value={state.email}
                    onChange={(event) =>
                      setState((current) => ({ ...current, email: event.target.value }))
                    }
                    type="email"
                    placeholder={copy.usernamePlaceholder}
                  />
                </div>
              </label>

              <div className="password-row-head">
                <span>{copy.password}</span>
                <Link className="forgot-link" to="/forgot-password">
                  {copy.forgot}
                </Link>
              </div>

              <label className="password-field">
                <div className="input-shell">
                  <span className="input-icon">🔒</span>
                  <input
                    value={state.password}
                    onChange={(event) =>
                      setState((current) => ({ ...current, password: event.target.value }))
                    }
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                  />
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </label>

              {state.error ? <p className="form-error">{state.error}</p> : null}
              {!isConfigured ? <p className="form-warning">{copy.warning}</p> : null}

              <button className="button login-button primary-auth-button" type="submit" disabled={state.loading}>
                {state.loading ? copy.authenticating : copy.login}
              </button>
            </form>

            <div className="login-access-card">
              <strong>{copy.accessTitle}</strong>
              {defaultLoginEmail || defaultLoginPasswordHint ? (
                <div className="access-list">
                  <div className="access-item">
                    <span>{copy.accessEmail}</span>
                    <bdi>{defaultLoginEmail || copy.accessNone}</bdi>
                  </div>
                  <div className="access-item">
                    <span>{copy.accessPassword}</span>
                    <bdi>{defaultLoginPasswordHint || copy.accessPasswordFallback}</bdi>
                  </div>
                </div>
              ) : (
                <p className="access-copy">{copy.accessNone}</p>
              )}
              <p className="access-hint">{copy.accessHint}</p>
            </div>

            <div className="login-divider">
              <span>{copy.with}</span>
            </div>

            <div className="quick-auth-grid">
              <div className="quick-auth-card" aria-hidden="true">
                <span className="quick-auth-icon">🆔</span>
                <strong>{copy.touchId}</strong>
              </div>
              <div className="quick-auth-card" aria-hidden="true">
                <span className="quick-auth-icon">🛡️</span>
                <strong>{copy.faceId}</strong>
              </div>
            </div>

            <div className="login-bottom-bar">
              <span className="encryption-pill">🛡 AES-256 ENCRYPTED</span>
              <div className="bottom-links">
                <span>{copy.safetyManual}</span>
                <span>{copy.privacy}</span>
                <span>{copy.support}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ForgotPasswordPage({ isConfigured }: { isConfigured: boolean }) {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<AuthLocale>("ar");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("request");
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const copy = loginCopy[locale];

  useEffect(() => {
    let active = true;

    async function establishRecoverySession() {
      if (!supabase) {
        if (active) {
          setCheckingRecovery(false);
        }
        return;
      }

      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const tokenHash = searchParams.get("token_hash");
        const typeParam = searchParams.get("type");
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const hashType = hashParams.get("type");

        if (tokenHash && typeParam === "recovery") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery"
          });

          if (verifyError) {
            throw verifyError;
          }

          if (active) {
            setRecoveryState("reset");
            window.history.replaceState({}, document.title, "/forgot-password");
          }
        } else if (accessToken && refreshToken && hashType === "recovery") {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
          }

          if (active) {
            setRecoveryState("reset");
            window.history.replaceState({}, document.title, "/forgot-password");
          }
        } else {
          const {
            data: { session }
          } = await supabase.auth.getSession();

          if (active && session) {
            setRecoveryState("reset");
          }
        }
      } catch (recoveryError) {
        if (active) {
          setError(
            recoveryError instanceof Error ? recoveryError.message : copy.recoveryInvalid
          );
        }
      } finally {
        if (active) {
          setCheckingRecovery(false);
        }
      }
    }

    void establishRecoverySession();

    return () => {
      active = false;
    };
  }, [copy.recoveryInvalid]);

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("");
      return;
    }

    if (!email.trim()) {
      setError(copy.resetHint);
      return;
    }

    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/forgot-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (resetError) {
        throw resetError;
      }

      setMessage(copy.resetSent);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : copy.warning);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("");
      return;
    }

    if (newPassword.length < 8) {
      setError(copy.passwordTooShort);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setMessage(copy.passwordUpdated);
      setNewPassword("");
      setConfirmPassword("");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : copy.recoveryInvalid);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`auth-shell ${locale === "en" ? "locale-en" : ""}`} dir={copy.dir}>
      <section className="login-panel forgot-layout">
        <aside className="login-brand-panel">
          <div className="brand-top">
            <div className="brand-title">Sentinel EHS</div>
            <span className="brand-underline" />
          </div>

          <div className="brand-message">
            <h1>{copy.resetTitle}</h1>
            <p>{copy.resetBody}</p>
          </div>

          <div className="status-panel">
            <span className="status-label">SYSTEM STATUS</span>
            <div className="status-row">
              <span className="status-dot" />
              <strong>{copy.status}</strong>
            </div>
          </div>

          <div className="brand-footer">© 2026 Sentinel EHS Systems. All rights reserved.</div>
        </aside>

        <div className="login-form-panel">
          <button
            className="language-switch"
            type="button"
            onClick={() => setLocale((current) => (current === "ar" ? "en" : "ar"))}
          >
            🌐 {copy.language}
          </button>

          <div className="login-card sleek-login-card forgot-card">
            <div className="login-card-head">
              <h2>{copy.resetTitle}</h2>
              <p>{copy.resetBody}</p>
            </div>

            {checkingRecovery ? <div className="recovery-hint">Checking recovery session...</div> : null}

            {!checkingRecovery && recoveryState === "request" ? (
              <form className="login-form polished-login-form" onSubmit={handleReset}>
                <label>
                  {copy.username}
                  <div className="input-shell">
                    <span className="input-icon">✉️</span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      type="email"
                      placeholder={copy.usernamePlaceholder}
                    />
                  </div>
                </label>

                {error ? <p className="form-error">{error}</p> : null}
                {message ? <p className="form-success">{message}</p> : null}
                {!isConfigured ? <p className="form-warning">{copy.warning}</p> : null}

                <button className="button login-button primary-auth-button" type="submit" disabled={loading}>
                  {loading ? copy.sendingReset : copy.sendReset}
                </button>
              </form>
            ) : null}

            {!checkingRecovery && recoveryState === "reset" ? (
              <form className="login-form polished-login-form" onSubmit={handleUpdatePassword}>
                <label>
                  {copy.newPassword}
                  <div className="input-shell">
                    <span className="input-icon">🔒</span>
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </label>

                <label>
                  {copy.confirmPassword}
                  <div className="input-shell">
                    <span className="input-icon">🔐</span>
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type="password"
                      placeholder="••••••••"
                    />
                  </div>
                </label>

                {error ? <p className="form-error">{error}</p> : null}
                {message ? <p className="form-success">{message}</p> : null}

                <button className="button login-button primary-auth-button" type="submit" disabled={loading}>
                  {loading ? copy.updatingPassword : copy.resetPassword}
                </button>
              </form>
            ) : null}

            <button className="ghost-back" type="button" onClick={() => navigate("/login")}>
              {copy.backToLogin}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProtectedRoute({
  session,
  children
}: {
  session: AuthState | null;
  children: JSX.Element;
}) {
  const location = useLocation();

  if (!session?.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function DashboardPage({
  user,
  moduleRoutes
}: {
  user: ApiUser;
  moduleRoutes: ModuleRoute[];
}) {
  const groupedModules = moduleRoutes.reduce<Record<string, ModuleRoute[]>>((accumulator, module) => {
    accumulator[module.category] ??= [];
    accumulator[module.category].push(module);
    return accumulator;
  }, {});

  const totalKpis = moduleRoutes.reduce((count, module) => count + module.kpis.length, 0);

  return (
    <div className="content-stack">
      <section className="overview-grid">
        <article className="overview-card hero-overview">
          <div>
            <p className="eyebrow">لوحة التحكم</p>
            <h2>مرحباً، {user.fullName}</h2>
            <p>{getRoleSummary(user.role)}</p>
          </div>
          <div className="overview-badges">
            <span>{user.roleLabel || roleLabels[user.role]}</span>
            <span>{user.email}</span>
          </div>
        </article>
        <article className="overview-card stat-card">
          <strong>{moduleRoutes.length}</strong>
          <span>موديولات متاحة</span>
        </article>
        <article className="overview-card stat-card">
          <strong>{Object.keys(groupedModules).length}</strong>
          <span>فئات تشغيلية</span>
        </article>
        <article className="overview-card stat-card">
          <strong>{totalKpis}</strong>
          <span>مؤشرات معروضة</span>
        </article>
      </section>

      <section className="section-block">
        <div className="section-title">
          <h2>الموديولات حسب الصلاحية</h2>
          <p>تم تجميع الشاشات المتكررة داخل موديولات واضحة حتى لا يظهر التداخل في القائمة أو في العرض الرئيسي.</p>
        </div>

        <div className="module-collection">
          {Object.entries(groupedModules).map(([category, items]) => (
            <div className="module-group" key={category}>
              <div className="module-group-head">
                <h3>{category}</h3>
                <span>{items.length} موديولات</span>
              </div>
              <div className="module-cards">
                {items.map((module) => (
                  <Link
                    className="module-card"
                    key={module.key}
                    to={`/app/modules/${module.slug}`}
                    style={{ "--card-accent": module.accent } as CSSProperties}
                  >
                    <div className="module-card-top">
                      <span>{module.platform}</span>
                      <strong>{module.title}</strong>
                    </div>
                    <p>{module.description}</p>
                    <div className="module-kpis">
                      {module.kpis.map((kpi) => (
                        <div key={kpi.label}>
                          <strong>{kpi.value}</strong>
                          <span>{kpi.label}</span>
                        </div>
                      ))}
                    </div>
                    {module.variants.length > 1 ? (
                      <span className="module-variant-count">{module.variants.length} عروض مرجعية</span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function RiskRegistryModulePage({
  accessToken,
  moduleRoute,
  user
}: {
  accessToken: string;
  moduleRoute: ModuleRoute;
  user: ApiUser;
}) {
  const [activeTab, setActiveTab] = useState<RiskTab>("all");
  const [rows, setRows] = useState<RiskRegistryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RiskFormState>({
    title: "",
    category: "Operational",
    severity: 3,
    likelihood: 3,
    dueDate: ""
  });

  useEffect(() => {
    let active = true;

    async function loadRisks() {
      try {
        setLoading(true);
        setError("");
        const payload = await listRiskRegistry(accessToken);
        if (!active) {
          return;
        }
        setRows(payload.data);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "تعذر تحميل سجل المخاطر");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRisks();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const filteredRows = rows.filter((row) => {
    if (activeTab === "open") {
      return row.status !== "closed";
    }

    if (activeTab === "high") {
      return (row.severity || 0) >= 4 || (row.likelihood || 0) >= 4;
    }

    if (activeTab === "closed") {
      return row.status === "closed";
    }

    return true;
  });

  const openCount = rows.filter((row) => row.status !== "closed").length;
  const highCount = rows.filter((row) => (row.severity || 0) >= 4 || (row.likelihood || 0) >= 4).length;
  const closedCount = rows.filter((row) => row.status === "closed").length;

  async function handleCreateRisk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("أدخل عنوان الخطر أولاً");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = await createRiskRegistryEntry(accessToken, {
        title: form.title.trim(),
        category: form.category.trim(),
        severity: form.severity,
        likelihood: form.likelihood,
        status: "open",
        due_date: form.dueDate || null,
        owner_id: user.id
      });

      setRows((current) => [payload.data, ...current]);
      setForm({
        title: "",
        category: "Operational",
        severity: 3,
        likelihood: 3,
        dueDate: ""
      });
      setActiveTab("all");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر إنشاء الخطر");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusUpdate(row: RiskRegistryRow, status: string) {
    try {
      setSaving(true);
      setError("");
      const payload = await updateRiskRegistryEntry(accessToken, row.id, { status });
      setRows((current) =>
        current.map((item) => (item.id === row.id ? payload.data : item))
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "تعذر تحديث حالة الخطر");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{moduleRoute.key}</p>
          <h2>{moduleRoute.title}</h2>
          <p>{moduleRoute.description}</p>
        </div>
        <div className="detail-pills">
          <span>{moduleRoute.platform}</span>
          <span>{moduleRoute.category}</span>
          <span>{user.roleLabel || roleLabels[user.role]}</span>
        </div>
      </section>

      <section className="risk-toolbar-card">
        <div className="risk-tabs">
          <button className={activeTab === "all" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("all")}>
            كل المخاطر
          </button>
          <button className={activeTab === "open" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("open")}>
            المفتوحة
          </button>
          <button className={activeTab === "high" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("high")}>
            عالية الأولوية
          </button>
          <button className={activeTab === "closed" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("closed")}>
            المغلقة
          </button>
        </div>

        <div className="risk-summary-grid">
          <article className="risk-summary-card">
            <strong>{rows.length}</strong>
            <span>إجمالي السجلات</span>
          </article>
          <article className="risk-summary-card">
            <strong>{openCount}</strong>
            <span>مفتوحة</span>
          </article>
          <article className="risk-summary-card">
            <strong>{highCount}</strong>
            <span>عالية الأولوية</span>
          </article>
          <article className="risk-summary-card">
            <strong>{closedCount}</strong>
            <span>مغلقة</span>
          </article>
        </div>
      </section>

      <section className="risk-layout">
        <article className="preview-card risk-form-card">
          <div className="card-head">
            <h3>تسجيل خطر جديد</h3>
          </div>

          <form className="risk-form" onSubmit={handleCreateRisk}>
            <label>
              عنوان الخطر
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="مثال: خطر انزلاق في منطقة التشغيل"
              />
            </label>
            <label>
              الفئة
              <input
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                placeholder="Operational"
              />
            </label>
            <div className="risk-form-grid">
              <label>
                الشدة
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.severity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, severity: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                الاحتمالية
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.likelihood}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, likelihood: Number(event.target.value) }))
                  }
                />
              </label>
            </div>
            <label>
              تاريخ الاستحقاق
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              />
            </label>

            <button className="button" type="submit" disabled={saving}>
              {saving ? "جارٍ الحفظ..." : "إضافة إلى السجل"}
            </button>
          </form>
        </article>

        <article className="preview-card risk-table-card">
          <div className="card-head">
            <h3>سجل المخاطر</h3>
            <span>{activeTab === "all" ? "عرض شامل" : "عرض مفلتر"}</span>
          </div>

          {error ? <div className="form-error">{error}</div> : null}
          {loading ? <div className="empty-state">جارٍ تحميل سجل المخاطر...</div> : null}

          {!loading ? (
            <div className="risk-table">
              <div className="risk-table-head">
                <span>الخطر</span>
                <span>الفئة</span>
                <span>التقييم</span>
                <span>الحالة</span>
                <span>الاستحقاق</span>
                <span>إجراء</span>
              </div>
              {filteredRows.map((row) => (
                <div className="risk-row" key={row.id}>
                  <strong>{row.title}</strong>
                  <span>{row.category || "-"}</span>
                  <span>{row.severity || 0} x {row.likelihood || 0}</span>
                  <span className={`risk-status risk-status-${row.status}`}>{row.status}</span>
                  <span>{row.due_date || "-"}</span>
                  <div className="risk-actions">
                    {row.status !== "closed" ? (
                      <button type="button" onClick={() => void handleStatusUpdate(row, "closed")}>
                        إغلاق
                      </button>
                    ) : (
                      <button type="button" onClick={() => void handleStatusUpdate(row, "open")}>
                        إعادة فتح
                      </button>
                    )}
                    {row.status === "open" ? (
                      <button type="button" onClick={() => void handleStatusUpdate(row, "mitigating")}>
                        قيد المعالجة
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {!filteredRows.length ? <div className="empty-state">لا توجد سجلات مطابقة لهذا التبويب.</div> : null}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

function PermitsToWorkModulePage({
  accessToken,
  moduleRoute,
  user
}: {
  accessToken: string;
  moduleRoute: ModuleRoute;
  user: ApiUser;
}) {
  const [activeTab, setActiveTab] = useState<PermitTab>("all");
  const [rows, setRows] = useState<PermitToWorkRow[]>([]);
  const [selectedPermitId, setSelectedPermitId] = useState("");
  const [notifications, setNotifications] = useState<PermitNotificationRow[]>([]);
  const [meta, setMeta] = useState<PermitMetaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [form, setForm] = useState<PermitFormState>({
    workType: "Hot Work",
    siteId: "",
    contractorId: "",
    description: "",
    validFrom: "",
    validTo: ""
  });

  const workflowLabels: Record<string, string> = {
    submitted: "مُرسل",
    in_review: "قيد الاعتماد",
    approved: "معتمد",
    rejected: "مرفوض",
    closed: "مغلق",
    area_manager: "مديرة المنطقة",
    quality: "الجودة",
    safety: "السلامة",
    permit_approver: "معتمد التصريح",
    completed: "مكتمل",
    pending: "بانتظار",
    requester: "طالب التصريح",
    permit_requester: "طالب التصريح"
  };

  const actorStepByRole: Partial<Record<UserRole, string>> = {
    admin: "admin",
    ehs_manager: "safety",
    supervisor: "permit_approver",
    permit_approver: "permit_approver",
    area_manager: "area_manager",
    quality: "quality",
    safety: "safety"
  };

  const canCreatePermit = ["admin", "permit_requester", "supervisor", "ehs_manager"].includes(user.role);
  const selectedPermit = rows.find((row) => row.id === selectedPermitId) || null;

  function replacePermit(nextRow: PermitToWorkRow) {
    setRows((current) => current.map((row) => (row.id === nextRow.id ? nextRow : row)));
  }

  async function loadPermits() {
    try {
      setLoading(true);
      setError("");
      const [payload, metaPayload] = await Promise.all([
        listPermitsToWork(accessToken),
        getPermitToWorkMeta(accessToken)
      ]);
      setRows(payload.data);
      setMeta(metaPayload.data);
      setForm((current) => ({
        ...current,
        workType: current.workType || metaPayload.data.permitTypes[0]?.value || "Hot Work",
        siteId: current.siteId || metaPayload.data.sites[0]?.id || "",
        contractorId: current.contractorId || metaPayload.data.contractors[0]?.id || ""
      }));
      if (!selectedPermitId && payload.data[0]) {
        setSelectedPermitId(payload.data[0].id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل تصاريح العمل");
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications(permitId: string) {
    try {
      setNotificationsLoading(true);
      const payload = await listPermitNotifications(accessToken, permitId);
      setNotifications(payload.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإشعارات");
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    void loadPermits();
  }, [accessToken]);

  useEffect(() => {
    if (selectedPermitId) {
      void loadNotifications(selectedPermitId);
    }
  }, [selectedPermitId]);

  const filteredRows = rows.filter((row) => {
    if (activeTab === "pending") {
      return ["submitted", "in_review"].includes(row.status);
    }
    if (activeTab === "approved") {
      return row.status === "approved";
    }
    if (activeTab === "rejected") {
      return row.status === "rejected";
    }
    if (activeTab === "closed") {
      return row.status === "closed";
    }
    return true;
  });

  const pendingCount = rows.filter((row) => ["submitted", "in_review"].includes(row.status)).length;
  const approvedCount = rows.filter((row) => row.status === "approved").length;
  const rejectedCount = rows.filter((row) => row.status === "rejected").length;
  const closedCount = rows.filter((row) => row.status === "closed").length;

  function canApprove(row: PermitToWorkRow) {
    if (user.role === "admin") {
      return ["submitted", "in_review"].includes(row.status) && row.current_step !== "completed";
    }

    return ["submitted", "in_review"].includes(row.status) && actorStepByRole[user.role] === row.current_step;
  }

  function canClose(row: PermitToWorkRow) {
    return ["admin", "permit_approver", "supervisor", "ehs_manager"].includes(user.role) && ["approved", "closed"].includes(row.status);
  }

  function canExport(row: PermitToWorkRow) {
    return ["approved", "closed"].includes(row.status);
  }

  async function handleCreatePermit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.workType.trim() || !form.siteId) {
      setError("اختر نوع التصريح والموقع قبل الحفظ");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const selectedContractor =
        meta?.contractors.find((contractor) => contractor.id === form.contractorId) || null;
      const payload = await createPermitToWorkEntry(accessToken, {
        work_type: form.workType.trim(),
        site_id: form.siteId,
        contractor_id: form.contractorId || null,
        contractor_name: selectedContractor?.full_name || null,
        description: form.description.trim() || null,
        requested_by: user.id,
        valid_from: form.validFrom || null,
        valid_to: form.validTo || null
      });

      setRows((current) => [payload.data, ...current]);
      setSelectedPermitId(payload.data.id);
      setForm({
        workType: meta?.permitTypes[0]?.value || "Hot Work",
        siteId: meta?.sites[0]?.id || "",
        contractorId: meta?.contractors[0]?.id || "",
        description: "",
        validFrom: "",
        validTo: ""
      });
      setActiveTab("pending");
      await loadNotifications(payload.data.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "تعذر إنشاء تصريح العمل");
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenPermit(row: PermitToWorkRow) {
    try {
      setSaving(true);
      setError("");
      const payload = await openPermitToWorkEntry(accessToken, row.id);
      replacePermit(payload.data);
      setSelectedPermitId(row.id);
      await loadNotifications(row.id);
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : "تعذر فتح التصريح");
    } finally {
      setSaving(false);
    }
  }

  async function handleDecision(row: PermitToWorkRow, action: "approve" | "reject") {
    try {
      setSaving(true);
      setError("");
      const payload = await decidePermitToWorkEntry(accessToken, row.id, action, action === "reject" ? comment : undefined);
      replacePermit(payload.data);
      setSelectedPermitId(row.id);
      setComment("");
      await loadNotifications(row.id);
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "تعذر تحديث دورة الاعتماد");
    } finally {
      setSaving(false);
    }
  }

  async function handleClosePermit(row: PermitToWorkRow) {
    try {
      setSaving(true);
      setError("");
      const payload = await closePermitToWorkEntry(accessToken, row.id);
      replacePermit(payload.data);
      setSelectedPermitId(row.id);
      await loadNotifications(row.id);
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : "تعذر إغلاق التصريح");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportPermit(row: PermitToWorkRow) {
    try {
      setSaving(true);
      setError("");
      const file = await exportPermitToWorkEntry(accessToken, row.id);
      const url = URL.createObjectURL(file.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      await loadPermits();
      await loadNotifications(row.id);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "تعذر تصدير التصريح");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content-stack">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{moduleRoute.key}</p>
          <h2>{moduleRoute.title}</h2>
          <p>{moduleRoute.description}</p>
        </div>
        <div className="detail-pills">
          <span>{moduleRoute.platform}</span>
          <span>{moduleRoute.category}</span>
          <span>{user.roleLabel || roleLabels[user.role]}</span>
        </div>
      </section>

      <section className="risk-toolbar-card">
        <div className="risk-tabs">
          <button className={activeTab === "all" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("all")}>كل التصاريح</button>
          <button className={activeTab === "pending" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("pending")}>بانتظار الاعتماد</button>
          <button className={activeTab === "approved" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("approved")}>المعتمدة</button>
          <button className={activeTab === "rejected" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("rejected")}>المرفوضة</button>
          <button className={activeTab === "closed" ? "risk-tab active" : "risk-tab"} type="button" onClick={() => setActiveTab("closed")}>المغلقة</button>
        </div>

        <div className="risk-summary-grid">
          <article className="risk-summary-card"><strong>{rows.length}</strong><span>إجمالي التصاريح</span></article>
          <article className="risk-summary-card"><strong>{pendingCount}</strong><span>في دائرة الاعتماد</span></article>
          <article className="risk-summary-card"><strong>{approvedCount}</strong><span>معتمدة وجاهزة</span></article>
          <article className="risk-summary-card"><strong>{rejectedCount + closedCount}</strong><span>مرفوضة أو مغلقة</span></article>
        </div>
      </section>

      {error ? <div className="form-error">{error}</div> : null}

      <section className="risk-layout permit-layout">
        {canCreatePermit ? (
          <article className="preview-card risk-form-card">
            <div className="card-head">
              <h3>إصدار تصريح جديد</h3>
              <span>طالب التصريح يبدأ الدورة ثم تتحرك تلقائياً بين الاعتمادات.</span>
            </div>

            <form className="risk-form" onSubmit={handleCreatePermit}>
              <label>
                رقم التصريح
                <input value={meta?.nextPermitNo || "جارٍ التوليد..."} readOnly />
              </label>
              <label>
                نوع التصريح
                <select value={form.workType} onChange={(event) => setForm((current) => ({ ...current, workType: event.target.value }))}>
                  {(meta?.permitTypes || []).map((permitType) => (
                    <option key={permitType.value} value={permitType.value}>
                      {permitType.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                الموقع / المنطقة
                <select value={form.siteId} onChange={(event) => setForm((current) => ({ ...current, siteId: event.target.value }))}>
                  {(meta?.sites || []).map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}{site.code ? ` (${site.code})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                المقاول
                <select value={form.contractorId} onChange={(event) => setForm((current) => ({ ...current, contractorId: event.target.value }))}>
                  <option value="">بدون مقاول محدد</option>
                  {(meta?.contractors || []).map((contractor) => (
                    <option key={contractor.id} value={contractor.id}>
                      {contractor.full_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                وصف العمل
                <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="وصف مختصر لنطاق العمل" />
              </label>
              <div className="risk-form-grid">
                <label>
                  صالح من
                  <input type="datetime-local" value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} />
                </label>
                <label>
                  صالح إلى
                  <input type="datetime-local" value={form.validTo} onChange={(event) => setForm((current) => ({ ...current, validTo: event.target.value }))} />
                </label>
              </div>

              <button className="button" type="submit" disabled={saving}>
                {saving ? "جارٍ إصدار التصريح..." : "إضافة التصريح"}
              </button>
            </form>
          </article>
        ) : (
          <article className="preview-card risk-form-card">
            <div className="card-head">
              <h3>دائرة الاعتماد</h3>
            </div>
            <div className="permit-workflow-list">
              <div className="permit-workflow-step active">1. طالب التصريح</div>
              <div className="permit-workflow-step">2. مديرة المنطقة</div>
              <div className="permit-workflow-step">3. الجودة</div>
              <div className="permit-workflow-step">4. السلامة</div>
              <div className="permit-workflow-step">5. معتمد التصريح</div>
            </div>
          </article>
        )}

        <article className="preview-card risk-table-card">
          <div className="card-head">
            <h3>سجل التصاريح</h3>
            <span>{activeTab === "all" ? "عرض شامل" : "عرض حسب الحالة"}</span>
          </div>

          {loading ? <div className="empty-state">جارٍ تحميل تصاريح العمل...</div> : null}

          {!loading ? (
            <div className="risk-table">
              <div className="risk-table-head permit-table-head">
                <span>رقم التصريح</span>
                <span>نوع العمل</span>
                <span>المنطقة</span>
                <span>الحالة</span>
                <span>الدور الحالي</span>
                <span>إجراء</span>
              </div>
              {filteredRows.map((row) => (
                <div className={`risk-row permit-row ${selectedPermitId === row.id ? "selected" : ""}`} key={row.id}>
                  <strong>{row.permit_no}</strong>
                  <span>{row.work_type}</span>
                  <span>{row.area || "-"}</span>
                  <span className={`risk-status risk-status-${row.status}`}>{workflowLabels[row.status] || row.status}</span>
                  <span>{workflowLabels[row.current_step] || row.current_step}</span>
                  <div className="risk-actions">
                    <button type="button" onClick={() => void handleOpenPermit(row)}>فتح</button>
                    {canApprove(row) ? <button type="button" onClick={() => void handleDecision(row, "approve")}>اعتماد</button> : null}
                    {canApprove(row) ? <button type="button" onClick={() => void handleDecision(row, "reject")}>رفض</button> : null}
                    {canClose(row) && row.status !== "closed" ? <button type="button" onClick={() => void handleClosePermit(row)}>إغلاق</button> : null}
                    {canExport(row) ? <button type="button" onClick={() => void handleExportPermit(row)}>تصدير</button> : null}
                  </div>
                </div>
              ))}
              {!filteredRows.length ? <div className="empty-state">لا توجد تصاريح مطابقة لهذا التبويب.</div> : null}
            </div>
          ) : null}
        </article>
      </section>

      <section className="permit-detail-grid">
        <article className="preview-card permit-detail-card">
          <div className="card-head">
            <h3>تفاصيل التصريح</h3>
            <span>{selectedPermit ? selectedPermit.permit_no : "اختر تصريحاً من السجل"}</span>
          </div>

          {selectedPermit ? (
            <div className="permit-detail-stack">
              <div className="permit-detail-meta">
                <div><strong>نوع العمل:</strong> <span>{selectedPermit.work_type}</span></div>
                <div><strong>المنطقة:</strong> <span>{selectedPermit.area || "-"}</span></div>
                <div><strong>المقاول:</strong> <span>{selectedPermit.contractor_name || "-"}</span></div>
                <div><strong>الوصف:</strong> <span>{selectedPermit.description || "-"}</span></div>
                <div><strong>الحالة:</strong> <span>{workflowLabels[selectedPermit.status] || selectedPermit.status}</span></div>
                <div><strong>آخر خطوة:</strong> <span>{workflowLabels[selectedPermit.current_step] || selectedPermit.current_step}</span></div>
                <div><strong>صالح إلى:</strong> <span>{selectedPermit.valid_to ? new Date(selectedPermit.valid_to).toLocaleString() : "-"}</span></div>
                <div><strong>تم التصدير:</strong> <span>{selectedPermit.exported_at ? new Date(selectedPermit.exported_at).toLocaleString() : "لا"}</span></div>
              </div>

              <div className="permit-workflow-list">
                <div className={`permit-workflow-step ${selectedPermit.area_manager_status}`}>مديرة المنطقة: {workflowLabels[selectedPermit.area_manager_status] || selectedPermit.area_manager_status}</div>
                <div className={`permit-workflow-step ${selectedPermit.quality_status}`}>الجودة: {workflowLabels[selectedPermit.quality_status] || selectedPermit.quality_status}</div>
                <div className={`permit-workflow-step ${selectedPermit.safety_status}`}>السلامة: {workflowLabels[selectedPermit.safety_status] || selectedPermit.safety_status}</div>
                <div className={`permit-workflow-step ${selectedPermit.permit_approver_status}`}>معتمد التصريح: {workflowLabels[selectedPermit.permit_approver_status] || selectedPermit.permit_approver_status}</div>
              </div>

              {canApprove(selectedPermit) ? (
                <label className="permit-comment">
                  سبب الرفض أو ملاحظة الاعتماد
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="أدخل ملاحظة مختصرة تظهر في سجل الإشعارات عند الحاجة" />
                </label>
              ) : null}

              {selectedPermit.rejection_reason ? <div className="form-error permit-inline-note">{selectedPermit.rejection_reason}</div> : null}
            </div>
          ) : (
            <div className="empty-state">افتح تصريحاً من الجدول لعرض الاعتمادات والإشعارات.</div>
          )}
        </article>

        <article className="preview-card permit-detail-card">
          <div className="card-head">
            <h3>الإشعارات المرتبطة</h3>
            <span>{notifications.length} سجل</span>
          </div>

          {notificationsLoading ? <div className="empty-state">جارٍ تحميل الإشعارات...</div> : null}

          {!notificationsLoading ? (
            <div className="permit-notification-list">
              {notifications.map((notification) => (
                <div className="permit-notification-item" key={notification.id}>
                  <strong>{notification.message}</strong>
                  <span>{workflowLabels[notification.recipient_role] || notification.recipient_role}</span>
                  <small>{new Date(notification.created_at).toLocaleString()}</small>
                </div>
              ))}
              {!notifications.length ? <div className="empty-state">لا توجد إشعارات لهذا التصريح بعد.</div> : null}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

function ModulePage({
  user,
  moduleRoutes,
  accessToken
}: {
  user: ApiUser;
  moduleRoutes: ModuleRoute[];
  accessToken: string;
}) {
  const { slug } = useParams();
  const moduleRoute = moduleRoutes.find((item) => item.slug === slug);

  if (!moduleRoute) {
    return (
      <div className="empty-state">
        <h2>هذه الصفحة غير متاحة لهذا الدور</h2>
        <p>القائمة الحالية منظمة على مستوى الموديولات ولا تشمل هذا الرابط للمستخدم الحالي.</p>
        <Link to="/app" className="button">
          العودة إلى اللوحة الرئيسية
        </Link>
      </div>
    );
  }

  const screen = moduleRoute.primaryScreen;

  if (moduleRoute.key === "riskRegistry") {
    return <RiskRegistryModulePage accessToken={accessToken} moduleRoute={moduleRoute} user={user} />;
  }

  if (moduleRoute.key === "permitsToWork") {
    return <PermitsToWorkModulePage accessToken={accessToken} moduleRoute={moduleRoute} user={user} />;
  }

  return (
    <div className="content-stack">
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{screen.moduleKey}</p>
          <h2>{screen.title}</h2>
          <p>{screen.description}</p>
        </div>
        <div className="detail-pills">
          <span>{screen.platform}</span>
          <span>{screen.category}</span>
          <span>{user.roleLabel || roleLabels[user.role]}</span>
        </div>
      </section>

      {moduleRoute.variants.length > 1 ? (
        <section className="variant-strip">
          <div className="section-title compact-title">
            <h2>نسخ وعروض مرتبطة</h2>
            <p>هذه شاشات إضافية لنفس الموديول، لذلك تم جمعها هنا بدلاً من تكرارها في القائمة الجانبية.</p>
          </div>
          <div className="variant-list">
            {moduleRoute.variants.map((variant) => (
              <article className="variant-card" key={variant.screenId}>
                <strong>{variant.title}</strong>
                <span>{variant.platform}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="preview-layout">
        <article className="preview-card">
          <div className="card-head">
            <h3>مؤشرات سريعة</h3>
          </div>
          <div className="insight-list">
            {screen.kpis.map((kpi) => (
              <div className="insight-item" key={kpi.label}>
                <strong>{kpi.value}</strong>
                <span>{kpi.label}</span>
              </div>
            ))}
          </div>
          <img className="detail-image" src={screen.imagePath} alt={screen.title} />
        </article>

        <article className="preview-card frame-card">
          <div className="card-head">
            <h3>المعاينة المرجعية</h3>
            <a href={screen.htmlPath} target="_blank" rel="noreferrer" className="ghost-link">
              فتح HTML
            </a>
          </div>
          <iframe title={screen.title} className="preview-frame" src={screen.htmlPath} />
        </article>
      </section>
    </div>
  );
}

function AppShell({
  session,
  onLogout
}: {
  session: ActiveSession;
  onLogout: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [screens, setScreens] = useState<StitchScreen[]>([]);
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let active = true;

    async function loadNavigation() {
      try {
        setLoading(true);
        setError("");

        const [screenPayload, modulePayload] = await Promise.all([
          fetchAllowedScreens(session.accessToken),
          fetchAllowedModules(session.accessToken)
        ]);

        if (!active) {
          return;
        }

        setScreens(screenPayload.screens);
        setModules(modulePayload.modules);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "تعذر تحميل الصفحات");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadNavigation();

    return () => {
      active = false;
    };
  }, [session.accessToken]);

  async function handleLogout() {
    await onLogout();
    navigate("/login", { replace: true });
  }

  const moduleRoutes = getModuleRoutes(session.user.role);
  const groupedModuleRoutes = moduleRoutes.reduce<Record<string, ModuleRoute[]>>((accumulator, module) => {
    accumulator[module.category] ??= [];
    accumulator[module.category].push(module);
    return accumulator;
  }, {});

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">EHS</span>
          <div>
            <strong>Safety OS</strong>
            <span>Production Workspace</span>
          </div>
        </div>

        <div className="user-card">
          <strong>{session.user.fullName}</strong>
          <span>{session.user.roleLabel || roleLabels[session.user.role]}</span>
          <p>{session.user.email}</p>
        </div>

        <nav className="sidebar-nav">
          <Link className={location.pathname === "/app" ? "nav-link active" : "nav-link"} to="/app">
            اللوحة الرئيسية
          </Link>
          {Object.entries(groupedModuleRoutes).map(([category, items]) => (
            <div className="nav-section" key={category}>
              <span className="nav-section-title">{category}</span>
              {items.map((module) => (
                <Link
                  className={location.pathname === `/app/modules/${module.slug}` ? "nav-link active" : "nav-link"}
                  key={module.slug}
                  to={`/app/modules/${module.slug}`}
                >
                  {module.title}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <button className="button secondary logout-button" onClick={handleLogout} type="button">
          تسجيل الخروج
        </button>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">بيئة العمل</p>
            <h1>منصة EHS مرتبطة فعلياً بالخلفية والصلاحيات</h1>
          </div>
          <div className="workspace-meta">
            <span>{modules.length} موديولات</span>
            <span>{session.user.roleLabel || roleLabels[session.user.role]}</span>
          </div>
        </header>

        {loading ? <div className="empty-state">جاري تحميل الصفحات والموديولات...</div> : null}
        {error ? <div className="empty-state">{error}</div> : null}

        {!loading && !error ? (
          <Routes>
            <Route path="/" element={<DashboardPage user={session.user} moduleRoutes={moduleRoutes} />} />
            <Route
              path="/modules/:slug"
              element={<ModulePage user={session.user} moduleRoutes={moduleRoutes} accessToken={session.accessToken} />}
            />
          </Routes>
        ) : null}
      </main>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<AuthState | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let active = true;

    loadServerSession()
      .then((loadedSession) => {
        if (active) {
          setSession(loadedSession);
          setBooting(false);
        }
      })
      .catch(() => {
        if (active) {
          setBooting(false);
        }
      });

    if (!supabase) {
      return () => {
        active = false;
      };
    }

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!active) {
        return;
      }

      if (!authSession?.access_token) {
        setSession(null);
        return;
      }

      void fetchCurrentUser(authSession.access_token)
        .then((payload) => {
          if (!active) {
            return;
          }

          setSession({
            user: payload.user,
            accessToken: authSession.access_token
          });
        })
        .catch(() => {
          if (active) {
            setSession(null);
          }
        });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (booting) {
    return <div className="boot-screen">جاري تجهيز بيئة العمل...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={setSession} isConfigured={Boolean(supabase)} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage isConfigured={Boolean(supabase)} />} />
      <Route
        path="/app/*"
        element={
          <ProtectedRoute session={session}>
            <AppShell
              session={session as ActiveSession}
              onLogout={async () => {
                if (supabase) {
                  await supabase.auth.signOut();
                }
                setSession(null);
              }}
            />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={session ? "/app" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={session ? "/app" : "/login"} replace />} />
    </Routes>
  );
}
