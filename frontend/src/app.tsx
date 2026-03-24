import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchAllowedModules, fetchAllowedScreens, fetchCurrentUser, type ApiUser } from "./lib/api";
import { supabase } from "./lib/supabase";
import { roleLabels, type ModuleItem, type StitchScreen, type UserRole } from "./data/screens";

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
      setState((current) => ({ ...current, error: copy.warning }));
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
      setError(copy.warning);
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
      setError(copy.warning);
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
  screens
}: {
  user: ApiUser;
  screens: StitchScreen[];
}) {
  const groupedScreens = screens.reduce<Record<string, StitchScreen[]>>((accumulator, screen) => {
    accumulator[screen.category] ??= [];
    accumulator[screen.category].push(screen);
    return accumulator;
  }, {});

  const totalKpis = screens.reduce((count, screen) => count + screen.kpis.length, 0);

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
          <strong>{screens.length}</strong>
          <span>صفحات متاحة</span>
        </article>
        <article className="overview-card stat-card">
          <strong>{Object.keys(groupedScreens).length}</strong>
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
          <p>هذه القائمة تأتي من الـ backend بناءً على صلاحيات المستخدم الحالية.</p>
        </div>

        <div className="module-collection">
          {Object.entries(groupedScreens).map(([category, items]) => (
            <div className="module-group" key={category}>
              <div className="module-group-head">
                <h3>{category}</h3>
                <span>{items.length} صفحات</span>
              </div>
              <div className="module-cards">
                {items.map((screen) => (
                  <Link
                    className="module-card"
                    key={screen.screenId}
                    to={`/app/modules/${screen.slug}`}
                    style={{ "--card-accent": screen.accent } as CSSProperties}
                  >
                    <div className="module-card-top">
                      <span>{screen.platform}</span>
                      <strong>{screen.title}</strong>
                    </div>
                    <p>{screen.description}</p>
                    <div className="module-kpis">
                      {screen.kpis.map((kpi) => (
                        <div key={kpi.label}>
                          <strong>{kpi.value}</strong>
                          <span>{kpi.label}</span>
                        </div>
                      ))}
                    </div>
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

function ModulePage({
  user,
  screens
}: {
  user: ApiUser;
  screens: StitchScreen[];
}) {
  const { slug } = useParams();
  const screen = screens.find((item) => item.slug === slug);

  if (!screen) {
    return (
      <div className="empty-state">
        <h2>هذه الصفحة غير متاحة لهذا الدور</h2>
        <p>القائمة الحالية مأخوذة من الخادم ولا تشمل هذه الصفحة للمستخدم الحالي.</p>
        <Link to="/app" className="button">
          العودة إلى اللوحة الرئيسية
        </Link>
      </div>
    );
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
          {screens.map((screen) => (
            <Link
              className={location.pathname === `/app/modules/${screen.slug}` ? "nav-link active" : "nav-link"}
              key={screen.slug}
              to={`/app/modules/${screen.slug}`}
            >
              {screen.title}
            </Link>
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
            <Route path="/" element={<DashboardPage user={session.user} screens={screens} />} />
            <Route
              path="/modules/:slug"
              element={<ModulePage user={session.user} screens={screens} />}
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
