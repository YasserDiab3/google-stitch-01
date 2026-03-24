import { Link, Route, Routes, useParams } from "react-router-dom";
import { screens } from "./data/screens";
import { supabase } from "./lib/supabase";

function HomePage() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

  return (
    <div className="shell">
      <header className="hero">
        <div>
          <p className="eyebrow">EHS System</p>
          <h1>منصة جاهزة للإنتاج بواجهة أمامية وخلفية وربط Supabase</h1>
          <p className="lead">
            المشروع يحتوي الآن على أساس frontend و backend، مع شاشات Stitch كمرجع
            بصري وتهيئة أولية لربط البيانات والصلاحيات والتقارير.
          </p>
        </div>
        <div className="hero-card">
          <div className="stack">
            <span>Frontend</span>
            <strong>React + Vite + TypeScript</strong>
          </div>
          <div className="stack">
            <span>Backend</span>
            <strong>Express + Supabase</strong>
          </div>
          <div className="stack">
            <span>API</span>
            <strong>{apiBaseUrl}</strong>
          </div>
          <div className="stack">
            <span>Supabase</span>
            <strong>{supabase ? "Configured from env" : "Missing env values"}</strong>
          </div>
        </div>
      </header>

      <section className="panel">
        <div className="section-head">
          <h2>الشاشات المرجعية</h2>
          <p>كل بطاقة تعرض الشاشة المرجعية مع معاينة HTML والصورة المصدّرة.</p>
        </div>
        <div className="grid">
          {screens.map((screen) => (
            <article key={screen.screenId} className="card">
              <img src={screen.imagePath} alt={screen.title} />
              <div className="card-body">
                <h3>{screen.title}</h3>
                <p>{screen.description}</p>
                <div className="card-meta">
                  <span>{screen.platform}</span>
                  <span>{screen.moduleKey}</span>
                </div>
                <Link to={`/modules/${screen.slug}`} className="button">
                  فتح المعاينة
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulePage() {
  const { slug } = useParams();
  const screen = screens.find((item) => item.slug === slug);

  if (!screen) {
    return (
      <div className="shell">
        <div className="panel empty">
          <h2>الشاشة غير موجودة</h2>
          <Link to="/" className="button">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="module-header">
        <div>
          <p className="eyebrow">{screen.moduleKey}</p>
          <h1>{screen.title}</h1>
          <p className="lead">{screen.description}</p>
        </div>
        <Link to="/" className="button secondary">
          جميع الشاشات
        </Link>
      </div>

      <div className="module-grid">
        <section className="panel">
          <h2>صورة الشاشة</h2>
          <img className="detail-image" src={screen.imagePath} alt={screen.title} />
        </section>
        <section className="panel">
          <h2>معاينة HTML</h2>
          <iframe title={screen.title} className="preview-frame" src={screen.htmlPath} />
        </section>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/modules/:slug" element={<ModulePage />} />
    </Routes>
  );
}
