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
	<img src="https://img.shields.io/badge/license-MIT-0080ff?style=flat" alt="license">
	<img src="https://img.shields.io/badge/version-1.0.0-0080ff?style=flat&logo=git&logoColor=white" alt="version">
	<img src="https://img.shields.io/badge/top_language-TypeScript-0080ff?style=flat" alt="repo-top-language">
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

---

## 👾 Features

- **One-click expense entry** — Add expenses with category, amount, and date in seconds.
- **Voice input** — Hold the mic button and say "spent 400 on food" — no typing required (uses browser-native Web Speech API).
- **Monthly dashboard** — See income, expenses, and remaining balance at a glance.
- **Edit & delete** — Fix mistakes with two-click delete confirmation.
- **Authentication** — Secure email/password authentication powered by Supabase.
- **Guest mode** — Try the app without signing up.

---

## 📁 Project Structure

```sh
└── Budget_tracker/
    ├── .github/
    │   └── workflows/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── AddExpenseModal.tsx
    │   │   ├── AuthModal.tsx
    │   │   ├── BalanceCard.tsx
    │   │   ├── ErrorBoundary.tsx
    │   │   ├── TransactionList.tsx
    │   │   └── VoiceMicButton.tsx
    │   ├── features/
    │   │   └── Dashboard.tsx
    │   ├── hooks/
    │   │   ├── useAmountParser.ts
    │   │   └── useVoiceCommand.ts
    │   ├── lib/
    │   │   ├── categoryMatcher.ts
    │   │   └── supabase.ts
    │   ├── stores/
    │   │   └── authStore.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── index.css
    │   ├── main.tsx
    │   └── vite-env.d.ts
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
❯ git clone https://github.com/yourusername/simplebudget.git
```

2. Change to the project directory:
```sh
❯ cd simplebudget
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

### 🧪 Testing

Execute the test suite using Vitest:
```sh
❯ npx vitest run
```

---

## 📌 Project Roadmap

- [X] **Phase 1: Foundation & Dashboard** - Initial UI, state management, and Supabase integration.
- [X] **Phase 2: Expense Entry & Transactions** - Create basic manual input forms and dynamic lists.
- [X] **Phase 3: Voice Entry Integration** - Add Speech-to-Text natural language parsing capabilities.
- [X] **Phase 4: Polish & Launch** - Final UX tuning, CI/CD pipeline, and Version 1.0 Release.
- [ ] **Phase 5: Future Enhancements** - Visual improvements, theming, and potential integrations.

---

## 🤝 Contributing

Contributions are welcome! Here are several ways you can contribute:

- **[Report Issues](https://github.com/yourusername/simplebudget/issues)**: Submit bugs found or log feature requests for the `simplebudget` project.
- **[Submit Pull Requests](https://github.com/yourusername/simplebudget/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
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

---
