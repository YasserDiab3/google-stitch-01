# Vercel Deployment

هذا المشروع يُنشر على Vercel كـ monorepo باستخدام مشروعين منفصلين:

- `frontend/` مشروع Vercel مستقل للواجهة الأمامية.
- `backend/` مشروع Vercel مستقل للواجهة الخلفية.

السبب: توثيق Vercel الحالي يوصي في monorepos بإنشاء Project مستقل لكل Root Directory، بدلاً من محاولة نشر الواجهة والخلفية معاً داخل مشروع Vercel واحد.

## 1. نشر الواجهة الأمامية

- Project Root Directory: `frontend`
- Framework Preset: `Vite`
- Build Command: الافتراضي
- Output Directory: `dist`

Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`

## 2. نشر الواجهة الخلفية

- Project Root Directory: `backend`
- Framework Preset: `Express`

Environment Variables:

- `NODE_ENV=production`
- `PORT=3000`
- `CORS_ORIGIN=https://your-frontend-domain.vercel.app`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3. الربط بين المشروعين

بعد نشر الـ backend:

1. انسخ رابط مشروع الـ backend على Vercel.
2. ضعه في `VITE_API_BASE_URL` داخل Project Settings الخاصة بالـ frontend.
3. أعد نشر الـ frontend.

## 4. ملاحظات مهمة

- لا تضع `SUPABASE_SERVICE_ROLE_KEY` في مشروع `frontend`.
- ملف `frontend/vercel.json` مضاف لتفعيل deep linking لتطبيق Vite SPA.
- ملف `backend/src/app.ts` الآن يصدّر Express app بشكل متوافق مع Vercel.
