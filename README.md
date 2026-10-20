<p align="center">
  <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/folder-markdown-open.svg" width="100" alt="project-logo">
</p>
<p align="center">
    <h1 align="center">SIMPLEBUDGET</h1>
</p>
<p align="center">
    <em>Track your monthly expenses in seconds. No complicated features — just your balance, at a glance.</em>
</p>
<p align="center">
    <img src="https://img.shields.io/badge/version-3.0.0-0080ff?style=flat&logo=git&logoColor=white" alt="version">
    <img src="https://img.shields.io/badge/top_language-TypeScript-0080ff?style=flat" alt="repo-top-language">
    <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="license">
</p>
<p align="center">
		<em>Built with the tools and technologies:</em>
</p>
<p align="center">
	<img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" alt="React">
	<img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript">
	<img src="https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E" alt="Vite">
	<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
	<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase">
</p>
<br>

## 🔗 Table of Contents

- [📍 Overview](#-overview)
- [👾 Features](#-features)
- [🔐 Security](#-security)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
  - [☑️ Prerequisites](#-prerequisites)
  - [⚙️ Installation](#-installation)
  - [🤖 Usage](#-usage)
  - [🧪 Testing](#-testing)
- [📌 Project Roadmap](#-project-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👏 Acknowledgments](#-acknowledgments)

---

## 📍 Overview

SimpleBudget is a minimalist, free, and open-source web application designed for quick and seamless monthly income and expense tracking. Built with the philosophy that financial tracking should be frictionless, it allows users to log an expense via text or voice and see their remaining balance in under 5 seconds. The platform runs entirely in the browser, leveraging the native Web Speech API for voice inputs, React for a snappy UI, and Supabase for secure data management and authentication.

**Version 3.0** introduces a thin API layer on Vercel, hardened authorization with defense-in-depth, month navigation for historical records, password reset flows, and a 83% reduction in gzipped bundle size.

---

## 👾 Features

- **One-click expense entry** — Add expenses with category, amount, and date in seconds.
- **Voice input & Natural Language Processing** — Hold the mic button and say "spent 400 on food" — no typing required (uses browser-native Web Speech API with smart phonetic numbers parsing, semantic category matching, and confirm-before-save).
- **Monthly dashboard** — See income, expenses, and remaining balance at a glance.
- **Month navigation** — View any previous or future month's transactions, income, and balance with one tap. Instant "Today" jump button.
- **Sleek Dark Mode** — Premium, tailored dark theme throughout the entire app, matching HSL colors and organic mesh patterns with an instant theme toggle.
- **Guest Mode local categories & CRUD** — Full LocalStorage seeding and offline CRUD operations for guest users, matching the robust Supabase database schemas.
- **Delightful Hover Tooltips** — Reusable, accessible animated tooltips guiding users through actions, speech prompts, and settings.
- **Dynamic target income & settings** — Configure your target monthly income, specific month, and year with automatic remaining balance updates.
- **Custom Category Manager** — Create, update, and delete categories directly from the dashboard, personalized with curated Lucide icons.
- **Advanced Excel & CSV Exports** — Export monthly transactions to beautifully structured Excel spreadsheets (via SheetJS, lazy-loaded on demand) or standard CSV downloads. Formula injection protected.
- **App Branding & Custom Logo** — Custom branded SimpleBudget logo, compressed to 45 KB (97% smaller than before).
- **Edit & delete** — Fix mistakes with two-click delete confirmation.
- **Authentication** — Secure email/password authentication powered by Supabase, with password reset flow and signup email confirmation.
- **Guest mode** — Try the app without signing up.
- **Password reset** — Forgot your password? Receive a reset link via email and set a new one securely.

---

## 🔐 Security

SimpleBudget v3.0 is built with defense-in-depth:

- **Row-Level Security (RLS)** — All 4 database tables (`transactions`, `monthly_settings`, `categories`, `category_groups`) have RLS policies enforcing `auth.uid() = user_id`. Verified against the live database via Supabase MCP.
- **Defense-in-depth authorization** — Every write mutation includes `.eq('user_id', user.id)` in addition to RLS, so even if a policy is ever dropped, rows remain protected.
- **Cross-user isolation tests** — 22 integration tests prove that user A cannot read, insert, update, or delete user B's data. Includes a "break a policy, watch it fail" proof.
- **Security headers** — `vercel.json` ships Content-Security-Policy (`frame-ancestors 'none'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and `Permissions-Policy` to block clickjacking and MIME sniffing.
- **CSV/Excel formula injection protection** — All exported values starting with `=`, `+`, `-`, `@`, or TAB are neutralized with a leading single quote (CWE-1236).
- **No console PII** — Voice transcripts and spoken notes are never logged to the browser console.
- **Rate limiting** — Client-side lockout after 5 failed sign-in attempts (30-second cooldown).
- **Server-side API layer (optional)** — A thin Vercel serverless API (`api/`) enforces authorization in TypeScript with HTTP-only cookies. Enable via `VITE_USE_API_LAYER=true`. Anon key never ships to the browser when enabled.

---

## 📁 Project Structure

```sh
└── Budget_tracker/
    ├── .github/
    │   └── workflows/
    │       └── ci.yml
    ├── api/                                          # Vercel serverless functions (thin API layer)
    │   ├── _lib/
    │   │   ├── auth.ts        # JWT verification, session cookies, token refresh
    │   │   ├── db.ts          # Supabase service-role client (server-side only)
    │   │   ├── errors.ts      # Standardized error responses
    │   │   └── validate.ts    # Zod schemas for all endpoints
    │   ├── auth/
    │   │   ├── signup.ts
    │   │   ├── signin.ts
    │   │   ├── signout.ts
    │   │   ├── session.ts
    │   │   ├── reset-password.ts
    │   │   └── update-password.ts
    │   ├── transactions/
    │   │   ├── index.ts       # GET list, POST create
    │   │   └── [id].ts        # PUT update, DELETE
    │   ├── monthly-settings/
    │   │   └── index.ts       # GET, PUT upsert
    │   ├── categories/
    │   │   ├── index.ts       # GET list, POST create
    │   │   ├── [id].ts        # PUT update, DELETE
    │   │   └── reorder.ts     # PUT batch reorder
    │   └── category-groups/
    │       ├── index.ts       # GET list, POST create
    │       └── [id].ts        # PUT update, DELETE
    ├── public/
    │   ├── logo.png           # Custom branded logo (256x256, 45 KB)
    │   └── favicon.png        # (Removed — was 1.5 MB duplicate)
    ├── src/
    │   ├── components/
    │   │   ├── AddExpenseModal.tsx
    │   │   ├── AuthModal.tsx
    │   │   ├── BalanceCard.tsx
    │   │   ├── CategoryIcon.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── ExportModal.tsx
    │   │   ├── Tooltip.tsx
    │   │   ├── TransactionList.tsx
    │   │   └── VoiceMicButton.tsx
    │   ├── features/
    │   │   ├── CategoryManager.tsx
    │   │   └── Dashboard.tsx
    │   ├── hooks/
    │   │   ├── useAmountParser.ts
    │   │   ├── useCategories.ts
    │   │   └── useVoiceCommand.ts
    │   ├── lib/
    │   │   ├── categoryMatcher.ts
    │   │   ├── export.ts
    │   │   └── supabase.ts
    │   ├── stores/
    │   │   ├── authStore.ts
    │   │   ├── dataStore.ts          # DataStore interface + factory
    │   │   ├── localStore.ts         # localStorage implementation
    │   │   ├── remoteStore.ts        # Direct Supabase implementation
    │   │   ├── remoteStoreV2.ts      # API-based implementation
    │   │   └── themeStore.ts
    │   ├── test/
    │   │   └── integration/
    │   │       └── rls-isolation.test.ts   # 22 cross-user isolation tests
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   └── vite-env.d.ts
    ├── supabase/
    │   ├── migrations/
    │   │   └── 20260520000000_add-income-tracking.sql
    │   ├── rls-only.sql
    │   ├── schema-v2-categories.sql
    │   └── schema.sql
    ├── .env.development.example
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vercel.json
    └── vite.config.ts
```

---

## 🚀 Getting Started

### ☑️ Prerequisites

Ensure you have the following installed on your machine:

- Node.js (Version 20 or higher)
- npm or yarn
- A Supabase account (free tier works perfectly)

### ⚙️ Installation

1. Clone the simplebudget repository:

```sh
❯ git clone https://github.com/patelVasu27/budget_tracker.git
```

2. Change to the project directory:

```sh
❯ cd budget_tracker
```

3. Install the dependencies:

```sh
❯ npm install
```

4. Configure your environment variables by copying `.env.example` to `.env.local` and filling in your Supabase details:

```sh
❯ cp .env.example .env.local
```

### 🤖 Usage

Run the development server locally:

```sh
❯ npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

### 🔧 API Layer (Optional)

To use the thin Vercel API layer instead of direct Supabase access:

1. Set these **server-side** variables in your Vercel dashboard (Project → Settings → Environment Variables):

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SITE_URL=https://yourapp.vercel.app
   ```

2. Enable the feature flag:

   ```
   VITE_USE_API_LAYER=true
   ```

   Add this to `.env.local` for local development, or to Vercel environment variables for production.

3. Default is `false` (direct Supabase access). Flip to `true` to route through the API layer. Fully reversible at any time.

### 🧪 Testing

Execute the test suite using Vitest:

```sh
❯ npx vitest run
```

Run integration tests (RLS cross-user isolation) — requires a `TEST_DATABASE_URL`:

```sh
❯ npm run test:integration
```

---

## 📌 Project Roadmap

- [X] **Phase 1: Foundation & Dashboard** - Initial UI, state management, and Supabase integration.
- [X] **Phase 2: Expense Entry & Transactions** - Create basic manual input forms and dynamic lists.
- [X] **Phase 3: Voice Entry Integration** - Add Speech-to-Text natural language parsing capabilities.
- [X] **Phase 4: Polish & Launch** - Final UX tuning, CI/CD pipeline, and Version 1.0 Release.
- [X] **Phase 5: Version 2.0 Enhancements** - Custom Category Manager, monthly settings & income tracking, robust voice improvements, and advanced Excel/CSV exports.
- [X] **Phase 6: Version 3.0 Production Hardening** - Thin API layer, security headers, defense-in-depth authorization, RLS isolation tests, month navigation, password reset, bundle optimization, image compression, and code splitting.
- [ ] **Phase 7: Version 4.0 Future Roadmap** - Automated recurring transactions, multi-currency support, visual reporting, and theme customization.

---

## 🤝 Contributing

Contributions are welcome! Here are several ways you can contribute:

- **[Report Issues](https://github.com/patelVasu27/budget_tracker/issues)**: Submit bugs found or log feature requests for the `simplebudget` project.
- **[Submit Pull Requests](https://github.com/patelVasu27/budget_tracker/pulls)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your GitHub account.
2. **Clone Locally**: Clone the forked repository to your local machine using `git clone`.
3. **Create a Branch**: Create a new branch for your feature or bug fix.
4. **Make Changes**: Make your changes and commit them with descriptive commit messages.
5. **Push to GitHub**: Push your changes to your forked repository.
6. **Submit a Pull Request**: Submit a PR to the original repository.

</details>

---

## 📄 License

This project is protected under the [MIT](https://choosealicense.com/licenses/mit/) License. Feel free to use, modify, and distribute.

---

## 👏 Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/)
- [SheetJS](https://sheetjs.com/) (CSV/XLSX export)
