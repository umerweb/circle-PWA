# Circle Fund (Danmark) 🇩🇰

A progressive web application (PWA) for private community savings, monthly contributions, and transparent mutual aid in Denmark.

Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase PostgreSQL**.

---

## 🚀 Key Features

- **PWA & Mobile-First**: Installable on iOS/Android, standalone display, responsive Nordic minimalist interface, and safe service worker caching.
- **Bilingual Support (EN / DA)**: Full natural English and Danish translations for all navigation, actions, notifications, status badges, and reports.
- **Monthly Collection (50 DKK)**:
  - Target calculation: `active_members × 50 DKK` (minimum 50 DKK, custom higher amounts supported).
  - MobilePay instructions and customizable payment note format (e.g. `CF-NOV-[YourName]`).
  - Distinguishes **member-reported** payments from **collector-confirmed** receipts.
  - Collector's own contribution is explicitly tracked and recorded.
- **Role-Based Access**:
  - `Administrator`: Member management, collector approvals, fund creation, report approval, confidential beneficiary view, audit logs.
  - `Collector`: Active monthly collection management, MobilePay verification, own contribution record.
  - `Member`: View collection target, report payment sent, view anonymized support cases, volunteer for future months.
- **Collector Volunteering**: Members can apply for upcoming months; administrators review and assign primary collectors.
- **Beneficiaries & Privacy**: Supports anonymous beneficiaries (members see alias names like "Community Family #1" while administrators retain confidential case records).
- **Financial Reports & Exports**: Monthly & annual balance sheets, participation rates, one-click PDF downloads (via jsPDF) and CSV exports.
- **Immutable Audit Logs**: Chronological logging of all financial changes and administrator actions.
- **Safe Email Architecture**: Complete bilingual email templates and delivery interface. Operates in safe mode (`EMAIL_ENABLED=false`) without external API dependencies. Native WhatsApp mobile sharing enabled.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Nordic Minimalist palette with Emerald accent)
- **Database**: Supabase PostgreSQL 17 with Row Level Security (RLS)
- **Auth**: Supabase Auth / Session cookie authentication with RBAC
- **Icons**: Lucide React
- **PDF Generation**: jsPDF & jsPDF-AutoTable

---

## ⚙️ Environment Variables Checklist

Configure these in `.env.local` for local development or in the **Vercel Project Settings → Environment Variables**:

| Variable | Description | Example / Location |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection pooler URI | `postgresql://postgres.[REF]:[PASS]@[HOST]:5432/postgres` |
| `db_pass` | Supabase database password | Set during project creation |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://qsizzlodkoocbmiudwxh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Supabase Dashboard → Project Settings → API |
| `ADMIN_EMAIL` | Super administrator email | `umer.web2@gmail.com` |
| `EMAIL_ENABLED` | Email sending toggle | `false` (keep disabled until email provider is configured) |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://your-vercel-domain.vercel.app` |

---

## 📦 Setup & Database Migration

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Database Migrations**:
   Applies schema, indexes, tables, and RLS policies:
   ```bash
   npm run db:migrate
   ```

3. **Seed Initial Data**:
   Creates initial super admin (`umer.web2@gmail.com`), 40 dummy members, active November 2026 fund, and initial cases:
   ```bash
   npm run db:seed
   ```

4. **Run Acceptance Test Suite**:
   ```bash
   node --env-file=.env scripts/test-workflows.js
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## 👥 Initial Members & Production Transition

- **Super Administrator**: `umer.web2@gmail.com`
- **Demo Members**: 40 placeholder records (`Demo Member 1 (Lars Nielsen)` through `Demo Member 40 (Lærke Sondergaard)`), clearly marked with `is_demo=true`.
- **Purging Demo Data Before Production**:
  In the Members Directory (`/members`), click the **"Remove All Demo Data"** button. This safely purges only the 40 test records and associated test contributions without altering the administrator account or real members added manually.

---

## 🚀 Vercel Deployment Instructions

1. **Push to GitHub**:
   Ensure all changes are committed to `https://github.com/umerweb/circle-PWA`.
   ```bash
   git add .
   git commit -m "Circle Fund production-ready application"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your repository `umerweb/circle-PWA`.
   - Framework preset: **Next.js**.
   - Add the required environment variables:
     - `DATABASE_URL`: `postgresql://postgres.qsizzlodkoocbmiudwxh:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
     - `NEXT_PUBLIC_SUPABASE_URL`: `https://qsizzlodkoocbmiudwxh.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `[YOUR-ANON-KEY]`
     - `ADMIN_EMAIL`: `umer.web2@gmail.com`
     - `EMAIL_ENABLED`: `false`
   - Click **Deploy**.
