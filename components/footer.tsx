export function Footer() {
  return (
    <footer className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
      <span>© {new Date().getFullYear()} FeedbackFlow. All rights reserved.</span>

      <div className="flex items-center gap-4">
        {/* Main README (project overview docs) */}
        <a
          href="https://github.com/DimitrisPyrkas/feedback-flow-app#readme"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground hover:underline"
        >
          Docs
        </a>

        {/* Operations / runbook guide */}
        <a
          href="https://github.com/DimitrisPyrkas/feedback-flow-app/blob/main/docs/operations.md"
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground hover:underline"
        >
          Operations Guide
        </a>

        <span className="text-muted-foreground">
          Developed &amp; designed by Dimitris Pyrkas
        </span>
      </div>
    </footer>
  );
}

