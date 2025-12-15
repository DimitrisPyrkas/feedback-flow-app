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
  - **Admins**: Full control, including manual AI re-analysis
  - **Members**: Can view and triage feedback items

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
- **AWS RDS PostgreSQL** (Production Database)
  - Users manage it using pgAdmin or Prisma Studio

**Auth & Security**
- [NextAuth](https://next-auth.js.org/) with **Credentials** provider
- JWT-based sessions
- Role-based access control (`ADMIN` / `MEMBER`)

**AI & Integrations**
- OpenAI API (GPT-4o-mini) for intelligence
- GitHub API for ingesting issues (Pattern A)
- Slack Incoming Webhooks for notifications

**Infrastructure (AWS)**
- **Hosting:** AWS Amplify (Gen 2)
- **Database:** AWS RDS PostgreSQL (Publicly accessible, secured via strong credentials)
- **Cron Jobs:** AWS EventBridge Scheduler triggering AWS Lambda functions
- **Domain:** Custom domain `feedbackflow.site` (Route 53 / External DNS)

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


## 🚀 Getting Started

1. **Clone the repo**
   ```bash
   git clone [https://github.com/DimitrisPyrkas/feedback-flow-app.git](https://github.com/DimitrisPyrkas/feedback-flow-app.git)
   cd feedback-flow-app

2. **Install dependencies**
    ```bash
    npm install
3. **Set up Environment variables**
  - in .env and .env.local files add the keys for (OpenAI, Cron Secret, NextAuth Secret, Database URL).

4. **Run locally**
   ```bash 
    npx prisma generate
    npm run dev

For details on how to promote users to Admin, access the production database, and configure the background Cron jobs, please refer to the Operations Guide:

➡️ Read docs/operations.md









