# FeedbackFlow – Operations & Handover Guide

This document explains how to operate FeedbackFlow in local developement and production environments. It covers:

- User role management (Promoting Admins)
- How the Cron-based Ingestion & Digest systems are wired
- Required Environment Variables

*Note: For installation and setup instructions ("Getting Started"), please refer to the main `README.md`.*

---

## 1. User Roles & Access Management

### 👥 User Roles

**1. MEMBER (Default)**
- Can view all feedback items.
- Can triage feedback status (`NEW` → `ACKNOWLEDGED` → `ACTIONED`).
- Can view standard charts and dashboards.
- **Cannot** trigger manual AI analysis.

**2. ADMIN**
- Includes all MEMBER permissions.
- **Exclusive Features:**
  - Manual AI Analysis (Single item or Batch).
  - Advanced Dashboard metrics (High Severity trends, Integrations).
  - Daily Digest Preview.

### 🔐 Authentication
- **Sign-in:** `/login`
- **Sign-up:** Public registration via the landing page.
- **Provider:** NextAuth Credentials (Email + Password).

### 👑 Promoting a User to Admin
By default, all new sign-ups are **MEMBERS**. To promote a user to **ADMIN**, you must update the database directly.

**Option A: Using Prisma Studio (Recommended)**
1. Connect to your database (Local or Production).
2. Run `npx prisma studio`.
3. Select the `User` model.
4. Find the user by email and change `role` to `ADMIN`.
5. Save changes.

**Option B: Using SQL (pgAdmin)**
Run the following query on your RDS instance:
```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'user@example.com';


## 2. Data Ingestion & AI Analysis - Automated Workflows (Cron Jobs)

FeedbackFlow relies on two background jobs orchestrated by AWS EventBridge and AWS Lambda.
- **2.1. Ingestion Flow (Cron Pattern A)**
    1. A scheduled job runs daily(e.g. at 06:00 UTC).
    2. Trigger: EventBridge Rule (feedbackflow-cron-ingest-daily) invokes the Ingest Lambda.
    3. Lambda Action: Sends a POST request to https://www.feedbackflow.site/api/cron/ingest .
    4. App Logic (Next.js):
      - Validates the x-cron-secret.
	    - Fetches recent issues from the external source (GitHub API).
	    - Deduplicates items using source + externalId.
	    - AI Analysis: Calls OpenAI (gpt-4o-mini) to determine Sentiment, Severity (1-5), and Topics.
      - Saves new items to the Postgres database.
- **2.2 User-Queued Actions (Cron Pattern B)**
    1. A scheduled job runs daily(e.g. at 07:00 UTC).
    2. Trigger: EventBridge Rule (feedbackflow-cron-digest-daily) invokes the Digest Lambda.
    3. App Logic (Next.js):
      - Queries the database for high-severity items (S4/S5) from the last 24 hours.
      - Formats a summary block.
      - Sends a notification to the Slack Channel defined in environment variables.
    

## 3. Environment & Configuration
  💻 Local Development
   1. Env Variables: Set in .env (do not commit to Git).
    - NEXTAUTH_URL=http://localhost:3000
    - DATABASE_URL (Local or Remote connection string)
    - AUTH_SECRET, OPENAI_API_KEY, CRON_SECRET
    - SLACK_WEBHOOK_URL (Optional)
   2. Database: Manage via pgAdmin or Prisma Studio.
   3. Triggering Cron Jobs:
    - You can manually trigger the ingestion logic using the local script: node lambda/cron-ingest/index.mjs.

  ☁️ Production (AWS)
  1. Hosting: AWS Amplify (Next.js SSR)
   - Domain: https://www.feedbackflow.site
  2. Database: AWS RDS PostgreSQL (Publicly accessible, secured via Security Group).
  3. Environment Variables:
   - Managed in Amplify Console → Hosting → Environment variables.
   - Note: These are securely injected into the runtime during the build process (amplify.yml).
  4. Lambda Functions:
   - feedbackflow-cron-ingest.
   - feedbackflow-cron-digest.
  




