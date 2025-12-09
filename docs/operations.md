# FeedbackFlow – Operations & Handover Guide

This document explains how to operate FeedbackFlow in local developement and production:

- How user roles & admin management work
- How cron-based ingestion & digest are wired
- Which environment variables must be set and where

It assumes you already know what the app does at a high level (see `README.md`).

---

## 1. User Roles & Operational Access

### 👥 User Roles

- **ADMIN**
  - Can view all feedback items
  - Can change feedback status (`NEW` → `ACKNOWLEDGED` → `ACTIONED`)
  - Can see info about all feedback items via charts and cards
  - Has additional features in dashbord like Integrations , High Severity items (7 days) and Daily Digest (Preview) cards.
  - Can run **manual AI analysis** on a single feedback item or via a batch button(multiple items)
- **MEMBER**
  - Can view all feedback items 
  - Can change feedback status (`NEW` → `ACKNOWLEDGED` → `ACTIONED`)
  - Can see info about all feedback items via charts and cards
  - **Cannot** run manual AI analysis 

Standard sign-ups receive **MEMBER** access. Admins are managed separately by updating the `User.role` in the database.

### Sign-up & Login

- **Sign-in**: `/login`  
- **Sign-up**: “Create an account” on the landing page  
- Authentication uses **NextAuth Credentials** with email + password and JWT sessions.

### Creating / Promoting an Admin User

1. Ask the person to sign up normally via the UI (they become `MEMBER`).
2. In the database, update their role manually:

   ```sql
   UPDATE User
   SET role = 'ADMIN'
   WHERE email = 'their-email@example.com';



## 2. Data Ingestion & AI Analysis 

FeedbackFlow ingests external feedback (e.g. GitHub issues API) and analyzes it with AI.
- **2.1. Ingestion Flow (Cron Pattern A)**
    1. A scheduled job runs daily(e.g. every night at 02:00 UTC) via AWS Lambda + EventBridge :
    2. Calls LLM :
      - Validates the x-cron-secret.
	    - Normalizes & inserts items into FeedbackItem (idempotent via unique source+externalId).
	    - Runs auto AI analysis (analyzeFeedback) on new/updated items.
	    - Analysis + Triage (Sentiment Analysis, Severity Score, Topic Classification, Summarization).
- **2.2 User-Queued Actions (Cron Pattern B)**
    - Users can triage feedback items (NEW / ACK / ACTIONED).
    - Status is stored and used in filters + dashboards.
    - A second daily cron job via AWS Lambda + EventBridge , could dispatch a Slack digest message.


## 3. Operation & Environment variables
 - **Local Development**:
  1. All env variables set in .env & .env.local files
    - NEXTAUTH_URL, DATABASE_URL, AUTH_SECRET, OPENAI_API_KEY, CRON_SECRET, SLACK_WEBHOOK_URL
  2. DB : Postgres pgAdmin
  3. Start local server : npm run dev
  4. Visit http://localhost:3000 .
  5. Ingestion: manual triggers via node lambda/cron-ingest/index.mjs
  6. Slack webhook: dev/test channel for items.

- **Production**
  1. Hosted on AWS Amplify with:
   - Custom domain: https://www.feedbackflow.site
   - Valid HTTPS certificate
  2. Environment variables set via the Amplify console & Lambda configuration.
  3. DB: AWS-hosted (RDS Postgres)
  4. Two scheduled Lambdas
   - feedbackflow-cron-ingest
   - feedbackflow-cron-digest
  




