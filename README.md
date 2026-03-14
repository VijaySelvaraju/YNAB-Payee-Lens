# YNAB PayeeLens

A browser-based tool to analyze and clean up payees in your [YNAB (You Need A Budget)](https://www.youneedabudget.com/) budget.

## What It Does

- **Unused Payees** – Identifies payees that have no transactions, so you can hide or delete them in YNAB to keep your budget tidy.
- **Payee Analysis** – Shows each payee's transaction frequency, associated categories, and total amounts spent.
- **Payee Grouping Suggestions** – Suggests payees that may be duplicates or variations of the same merchant, so you can consolidate them.
- **Export to XLSX** – Download analysis results as a spreadsheet for offline reference.

All data is processed entirely in your browser. Your YNAB API token and budget data are never sent to any server other than the official YNAB API.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) and npm
- A YNAB account with at least one budget
- A YNAB Personal Access Token (get one from [YNAB Developer Settings](https://app.youneedabudget.com/settings/developer))

### Run Locally

```sh
# Clone the repository
git clone https://github.com/VijaySelvaraju/ynab-payee-insights-view.git

# Navigate to the project directory
cd ynab-payee-insights-view

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open `http://localhost:5173` in your browser.

### Usage

1. Enter your YNAB Personal Access Token on the home screen.
2. Select the budget you want to analyze.
3. Use the tabs to explore:
   - **Unused Payees** – Review and plan cleanup of payees with no transactions.
   - **Payee Analysis** – Browse all payees with frequency, category, and amount details.
   - **Payee Grouping** – Review suggested payee consolidations.
4. Export results to XLSX if needed.

## Tech Stack

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/) 18
- [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Recharts](https://recharts.org/)
- [TanStack Query](https://tanstack.com/query)

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Branch Protection

The `main` branch is protected with the following rules:

- **Force pushes are restricted** – prevents `git push --force` from overwriting history.
- **Deletions are restricted** – prevents the `main` branch from being accidentally deleted.

## Privacy

This app connects directly to the YNAB API from your browser. No backend server is involved. Your API token is stored only in your browser's session and is never persisted or transmitted anywhere other than directly to YNAB.
