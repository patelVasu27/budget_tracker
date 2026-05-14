# SimpleBudget

**Track your monthly expenses in seconds.** No complicated features — just your balance, at a glance.

Log an expense and see your remaining balance in under 5 seconds.

---

## Features

- **One-click expense entry** — Add expenses with category, amount, and date in seconds
- **Voice input** — Hold the mic button and say "spent 400 on food" — no typing required
- **Monthly dashboard** — See income, expenses, and remaining balance at a glance
- **Edit & delete** — Fix mistakes with two-click delete confirmation
- **Authentication** — Email/password auth powered by Supabase
- **Guest mode** — Try the app without signing up

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 18](https://react.dev) | UI framework |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [Vite](https://vitejs.dev) | Build tool |
| [Supabase](https://supabase.com) | Backend (PostgreSQL + Auth) |
| [React Query](https://tanstack.com/query) | Server state |
| [Zustand](https://github.com/pmndrs/zustand) | Client state |
| [React Hook Form](https://react-hook-form.com) | Form handling |
| [date-fns](https://date-fns.org) | Date utilities |
| [Lucide React](https://lucide.dev) | Icons |
| [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) | Voice entry (browser-native, no paid API) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (free tier works)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/simplebudget.git
   cd simplebudget
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a Supabase project**

   - Go to [supabase.com](https://supabase.com) and create a free project
   - Run the following SQL in the SQL Editor to create the required tables:

   ```sql
   -- Monthly settings (income per month)
   CREATE TABLE monthly_settings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     income DECIMAL(12,2) NOT NULL DEFAULT 0,
     month INTEGER NOT NULL,
     year INTEGER NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
     updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
   );

   -- Transactions (expenses)
   CREATE TABLE transactions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     amount DECIMAL(12,2) NOT NULL,
     category TEXT NOT NULL,
     note TEXT,
     date DATE NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
   );
   ```

4. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your Supabase project credentials from **Project Settings → API**:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | TypeScript type check only |
| `npx vitest run` | Run all tests |

## Deployment

### Deploy to Vercel

1. Push your repository to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Configure environment variables:
   - `VITE_SUPABASE_URL` — Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — Your Supabase anon key
4. Deploy — Vercel auto-detects Vite and uses the project's `vercel.json`

The project includes a GitHub Actions CI/CD workflow that:

- Runs TypeScript checks and tests on every push/PR to `main`
- Auto-deploys to Vercel on push to `main` (requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` as repository secrets)

## Project Structure

```
simplebudget/
├── .github/workflows/      # CI/CD pipeline
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── AuthModal.tsx
│   │   ├── AddExpenseModal.tsx
│   │   ├── BalanceCard.tsx
│   │   ├── TransactionList.tsx
│   │   ├── VoiceMicButton.tsx
│   │   └── ErrorBoundary.tsx
│   ├── features/           # Page-level components
│   │   └── Dashboard.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useVoiceCommand.ts
│   │   └── useAmountParser.ts
│   ├── lib/                # Utilities and third-party clients
│   │   ├── supabase.ts
│   │   └── categoryMatcher.ts
│   ├── stores/             # Zustand stores
│   │   └── authStore.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx             # Root component with auth routing
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind imports + custom classes
├── index.html              # HTML entry point
├── vercel.json             # Vercel deployment configuration
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## License

MIT — feel free to use, modify, and distribute.

## Built With

- [React](https://react.dev) — UI framework
- [Supabase](https://supabase.com) — Open-source Firebase alternative
- [Vite](https://vitejs.dev) — Next-generation build tool
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [Lucide](https://lucide.dev) — Beautiful icons
- Hosted on [Vercel](https://vercel.com)
