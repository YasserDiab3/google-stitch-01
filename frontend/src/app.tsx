import { useEffect, useMemo, useState } from "react";
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
  const [state, setState] = useState<LoginState>({
    email: "",
    password: "",
    loading: false,
    error: ""
  });

  const destination = (location.state as { from?: string } | undefined)?.from || "/app";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState((current) => ({
        ...current,
        error: "إعدادات Supabase غير مكتملة داخل متغيرات البيئة."
      }));
      return;
    }

    setState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password
      });

      if (error || !data.session?.access_token) {
        throw error || new Error("تعذر إنشاء الجلسة");
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
        error: error instanceof Error ? error.message : "تعذر تسجيل الدخول",
        loading: false
      }));
      return;
    }

    setState((current) => ({ ...current, loading: false }));
  }

  return (
    <div className="auth-shell">
      <section className="login-panel">
        <div className="login-copy">
          <span className="eyebrow badge">EHS Control Center</span>
          <h1>دخول حقيقي عبر Supabase ثم عرض الصفحات حسب الصلاحية</h1>
          <p className="lead">
            تم تحويل الواجهة لتعمل بتسجيل دخول فعلي عبر Supabase Auth، ثم تحميل
            المستخدم والموديولات المسموحة من الـ backend بدلاً من الاعتماد على عرض ثابت.
          </p>

          <div className="callout-grid">
            <article className="callout">
              <strong>مصادقة حقيقية</strong>
              <span>تسجيل الدخول يعتمد على جلسة Supabase الفعلية.</span>
            </article>
            <article className="callout">
              <strong>صلاحيات من backend</strong>
              <span>الصفحات والموديولات تُحمّل من الخادم بحسب دور المستخدم.</span>
            </article>
            <article className="callout">
              <strong>جاهز للتوسع</strong>
              <span>يمكن استبدال المؤشرات المرجعية ببيانات حية من الجداول الحالية.</span>
            </article>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-head">
            <h2>تسجيل الدخول</h2>
            <p>
              {isConfigured
                ? "استخدم حساب Supabase المسجل داخل مشروعك."
                : "أضف قيم Supabase إلى متغيرات البيئة قبل استخدام تسجيل الدخول."}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              البريد الإلكتروني
              <input
                value={state.email}
                onChange={(event) =>
                  setState((current) => ({ ...current, email: event.target.value }))
                }
                type="email"
                placeholder="user@company.com"
              />
            </label>

            <label>
              كلمة المرور
              <input
                value={state.password}
                onChange={(event) =>
                  setState((current) => ({ ...current, password: event.target.value }))
                }
                type="password"
                placeholder="••••••••"
              />
            </label>

            {state.error ? <p className="form-error">{state.error}</p> : null}

            <button className="button login-button" type="submit" disabled={state.loading}>
              {state.loading ? "جاري التحقق..." : "دخول إلى النظام"}
            </button>
          </form>

          <div className="demo-box">
            <h3>ملاحظات الربط</h3>
            <div className="demo-list">
              <div className="demo-item">
                <strong>Supabase Auth</strong>
                <span>تسجيل الدخول يتم عبر `signInWithPassword`.</span>
              </div>
              <div className="demo-item">
                <strong>profiles</strong>
                <span>الـ backend يحمّل أو ينشئ profile تلقائياً للمستخدم.</span>
              </div>
              <div className="demo-item">
                <strong>Navigation</strong>
                <span>القائمة والصفحات تُحمّل من `/api/navigation/screens`.</span>
              </div>
            </div>
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
