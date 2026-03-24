# EHS System

هيكل المشروع:

- `frontend/`: واجهة React + Vite + TypeScript.
- `backend/`: API جاهزة للتكامل مع Supabase.
- `supabase/`: مخطط SQL ابتدائي للجداول الأساسية.
- `stitch_exports/`: مخرجات Stitch الأصلية.

## التشغيل المحلي

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
npm run dev:frontend
npm run dev:backend
```

## البناء للإنتاج

```bash
npm run build
docker compose up --build
```

## متطلبات Supabase

- ضع `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` في `frontend/.env`.
- ضع `SUPABASE_URL` و `SUPABASE_ANON_KEY` و `SUPABASE_SERVICE_ROLE_KEY` في `backend/.env`.
- طبّق ملف `supabase/schema.sql` على مشروع Supabase.
