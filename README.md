# FeedbackFlow

FeedbackFlow is an internal feedback intelligence and triage tool. It ingests external feedback (e.g. GitHub issues), runs AI analysis to extract sentiment, severity, and topics, and surfaces the most important issues for product teams to act on.

This project was built for **[StartupExpert]** as part of an internal tooling initiative to make feedback processing more structured, searchable, and actionable.

---

## ✨ What FeedbackFlow Does

- **Centralizes feedback** from external sources (initially GitHub Issues).
- **Analyzes feedback with AI** to extract:
  - Sentiment (`POSITIVE`, `NEUTRAL`, `NEGATIVE`)
  - Severity (`S1–S5`)
  - Topics (keywords / themes)
- **Highlights critical issues** via:
  - High-severity signals in the UI
  - Automatic Slack alerts for S4/S5 items
- **Enables structured triage** with:
  - `NEW → ACKNOWLEDGED → ACTIONED` workflow
  - Per-change triage notes
  - History of who changed what, and when
- **Provides dashboards**:
  - Sentiment and severity trends
  - Top topics
  - Source breakdown
- **Supports two roles**:
  - **Admins**: full control, including manual AI re-analysis
  - **Members**: can view and triage feedback items

---

## 🔧 Tech Stack

**Frontend & App Framework**

- [Next.js version 16+](https://nextjs.org/) (App Router, TypeScript, strict mode)
- React (Server & Client Components)
- Tailwind CSS + custom UI components (light/dark theme) + shadcn UI
- Recharts for charts & dashboards

**Backend & Database**

- Next.js Route Handlers for API endpoints (`app/api/*`)
- [Prisma](https://www.prisma.io/) as ORM
- Relational database (e.g. PostgreSQL)

**Auth & Security**

- [NextAuth](https://next-auth.js.org/) with **Credentials** provider
- JWT-based sessions
- Role-based access control (`ADMIN` / `MEMBER`)

**AI & Integrations**

- OpenAI API (via a custom `analyzeFeedback` helper) for LLM
- GitHub API for ingesting issues (Pattern A)
- Slack Incoming Webhook for high-severity alerts (S4/S5)

**Infrastructure (Production)**

- Hosted on **AWS Amplify** (Next.js SSR support)
- Custom domain: `feedbackflow.site` (managed via Namecheap)
- Background jobs:
  - AWS Lambda + EventBridge for ingestion cron
  - AWS Lambda + EventBridge for daily digest

For operational details (cron jobs, environment variables, etc.), see  
➡️ [`docs/operations.md`](docs/operations.md)

---

## 🧩 Core Features

### 1. Feedback Inbox

- Paginated table of feedback items
- Filterable by:
  - Status
  - Sentiment
  - Severity 
  - Source
  - Topic
  - Free-text search in raw content
- Sortable by:
  - Created date
  - Status
  - Sentiment
  - Severity

### 2. Feedback Detail Review

- Full raw feedback content
- Latest AI analysis:
  - Sentiment
  - Severity
  - Summary
  - Topics
- Triage controls:
  - Status transitions: `NEW → ACKNOWLEDGED → ACTIONED`
  - Triage note box (optional note per change)
- High-severity banner for S4/S5 including:
  - Clear warning
  - Shortcut link to the Slack `#alerts` channel

### 3. Dashboards

- **Feedback Trend (Last 7 Days)** – total count per day
- **Sentiment Trend (Last 7 Days)** – POS/NEU/NEG lines
- **Top Topics (Last 7 Days)** – horizontal bar chart
- **Feedback Source Breakdown** – pie chart by source

- Admin has additional features in dashbord , see more in [`docs/operations.md`].


  









