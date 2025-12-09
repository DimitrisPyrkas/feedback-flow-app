// 1) Load environment from .env.local
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

// 2) Read env vars
const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error("CRON_SECRET is not set. Please set it in .env.local.");
  process.exit(1);
}

const repo = process.env.GITHUB_REPO || "vercel/next.js";

const githubToken = process.env.GITHUB_TOKEN || "";

async function fetchGithubIssuesSince(sinceIso) {
  const url = new URL("https://api.github.com/search/issues");

  url.searchParams.set("q", `repo:${repo} created:>=${sinceIso}`);
  url.searchParams.set("sort", "created");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "20");

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  console.log(`Fetching GitHub issues from ${url.toString()}`);

  const res = await fetch(url.toString(), { headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `GitHub API failed: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];
  console.log(`Fetched ${items.length} issues from GitHub.`);
  return items;
}

function mapIssuesToIngestItems(issues) {
  return issues.map((issue) => {
    const title = typeof issue.title === "string" ? issue.title : "";
    const body = typeof issue.body === "string" ? issue.body : "";

    return {
      source: "github",
      externalId: String(issue.id), // stable unique id for idempotency
      rawContent: `${title}\n\n${body}`.trim(),
      originalTimestamp: issue.created_at || new Date().toISOString(),
    };
  });
}

async function sendToIngest(items) {
  if (!items.length) {
    console.log("No items to ingest.");
    return { ok: true, processed: 0 };
  }

  const url = `${baseUrl}/api/cron/ingest`;
  console.log(`Sending ${items.length} items to ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify({ items }),
  });

  const text = await res.text().catch(() => "");
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error("Ingest failed:", res.status, json);
    throw new Error(`Ingest failed with status ${res.status}`);
  }

  console.log("Ingest response:", json);
  return json;
}

async function main() {
  //last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  console.log(`Starting GitHub ingest for repo: ${repo}, since: ${sinceIso}`);
  try {
    const issues = await fetchGithubIssuesSince(sinceIso);
    const items = mapIssuesToIngestItems(issues).filter(
      (i) => i.rawContent.length > 0
    );

    const result = await sendToIngest(items);
    console.log("Done. Processed:", result.processed ?? items.length);
  } catch (err) {
    console.error("Cron ingest run failed:", err);
    process.exit(1);
  }
}

main();
