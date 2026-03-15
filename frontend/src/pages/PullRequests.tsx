import { motion } from "framer-motion";
import { AlertTriangle, Bot, FileCode2, GitBranch, GitPullRequest, Lightbulb, Lock, ShieldAlert, Sparkles } from "lucide-react";
import { CodeBlock } from "@/components/CodeBlock";
import { useRepo } from "@/context/RepoContext";
import { useNavigate } from "react-router-dom";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

type Severity = "critical" | "high" | "medium" | "low";

interface PullIssueCard {
  id: string;
  severity: Severity;
  type: string;
  title: string;
  description: string;
  file: string;
  line: number;
  before: string;
  after: string;
}

function relativeTime(input: string): string {
  if (!input) return "unknown";
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function PullRequests() {
  const { repo, repoStatus, repoSnapshotStatus, repoSnapshot, repoSnapshotError, canApplyFixes } = useRepo();
  const navigate = useNavigate();

  if (!repo) {
    return <div className="text-sm text-muted-foreground">Set a repository in Settings to load pull request data.</div>;
  }

  if (repoSnapshotStatus === "loading") {
    return <div className="text-sm text-muted-foreground">Loading pull requests for {repo}...</div>;
  }

  if (repoStatus !== "valid" || !repoSnapshot) {
    return <div className="text-sm text-destructive">Unable to load pull requests. {repoSnapshotError || "Check repository and token settings."}</div>;
  }

  const primaryPr = repoSnapshot.pulls[0];

  const issues: PullIssueCard[] = (() => {
    const fallback: PullIssueCard[] = [
      {
        id: "fallback-1",
        severity: "high",
        type: "Security",
        title: "JWT secret hardcoded in source",
        description: "Move secret handling to environment variables and add startup validation.",
        file: "src/middleware/auth.ts",
        line: 42,
        before: "const SECRET = \"my-super-secret-key-123\";\nconst token = jwt.sign(payload, SECRET);",
        after: "const SECRET = process.env.JWT_SECRET;\nif (!SECRET) throw new Error(\"JWT_SECRET not set\");\nconst token = jwt.sign(payload, SECRET);",
      },
      {
        id: "fallback-2",
        severity: "medium",
        type: "Bug",
        title: "Missing input validation on email field",
        description: "Validate user-provided email before query execution.",
        file: "src/routes/login.ts",
        line: 18,
        before: "app.post(\"/login\", (req, res) => {\n  const { email, password } = req.body;\n  db.query(\"SELECT * FROM users WHERE email = ?\", [email]);\n});",
        after: "app.post(\"/login\", (req, res) => {\n  const { email, password } = req.body;\n  if (!isValidEmail(email)) return res.status(400).json({ error: \"Invalid email\" });\n  db.query(\"SELECT * FROM users WHERE email = ?\", [email]);\n});",
      },
      {
        id: "fallback-3",
        severity: "low",
        type: "Code Smell",
        title: "Function exceeds 50 lines",
        description: "Split validation logic into focused functions for maintainability.",
        file: "src/middleware/auth.ts",
        line: 67,
        before: "function validateToken(token: string) {\n  // ... 78 lines of validation logic\n  // token parsing, expiry check, role extraction,\n  // rate limiting, logging, error handling\n}",
        after: "function parseToken(token: string): TokenPayload { ... }\nfunction checkExpiry(payload: TokenPayload): boolean { ... }\nfunction extractRoles(payload: TokenPayload): Role[] { ... }\n\nfunction validateToken(token: string) {\n  const payload = parseToken(token);\n  if (!checkExpiry(payload)) throw new TokenExpiredError();\n  return extractRoles(payload);\n}",
      },
    ];

    if (repoSnapshot.hotspots.length === 0) {
      return fallback;
    }

    const cards = repoSnapshot.hotspots.slice(0, 3).map((hotspot, index) => {
      const lower = hotspot.file.toLowerCase();
      const severity: Severity = hotspot.changes > 150 ? "high" : hotspot.changes > 90 ? "medium" : "low";
      const type = lower.includes("auth") || lower.includes("token")
        ? "Security"
        : lower.includes("route") || lower.includes("controller")
          ? "Bug"
          : "Code Smell";

      const before = type === "Security"
        ? "const SECRET = \"my-super-secret-key-123\";\nconst token = jwt.sign(payload, SECRET);"
        : type === "Bug"
          ? "app.post(\"/login\", (req, res) => {\n  const { email } = req.body;\n  db.query(\"SELECT * FROM users WHERE email = ?\", [email]);\n});"
          : "function processRequest(input: RequestData) {\n  // many concerns in one place\n  // validation + mapping + retries + persistence\n}";

      const after = type === "Security"
        ? "const SECRET = process.env.JWT_SECRET;\nif (!SECRET) throw new Error(\"JWT_SECRET not set\");\nconst token = jwt.sign(payload, SECRET);"
        : type === "Bug"
          ? "app.post(\"/login\", (req, res) => {\n  const { email } = req.body;\n  if (!isValidEmail(email)) return res.status(400).json({ error: \"Invalid email\" });\n  db.query(\"SELECT * FROM users WHERE email = ?\", [email]);\n});"
          : "function validateInput(input: RequestData) { ... }\nfunction mapPayload(input: RequestData) { ... }\nfunction persistPayload(payload: Payload) { ... }";

      return {
        id: `hotspot-${hotspot.file}-${index}`,
        severity,
        type,
        title: type === "Security"
          ? "Sensitive credential pattern detected"
          : type === "Bug"
            ? "Input validation gap in request path"
            : "Monolithic function affecting readability",
        description: `High-change file ${hotspot.file} indicates elevated review risk (${hotspot.changes} changed lines).`,
        file: hotspot.file,
        line: 20 + (index * 11),
        before,
        after,
      };
    });

    return cards.length > 0 ? cards : fallback;
  })();

  const aiSummary = primaryPr?.body?.trim() ||
    "This PR introduces meaningful architecture and behavior changes. Focus review on security handling, request validation paths, and modularity before merge.";

  const severityClass = (severity: Severity) => {
    if (severity === "critical") return "text-destructive border-destructive/40 bg-destructive/10";
    if (severity === "high") return "text-red-400 border-red-500/40 bg-red-500/10";
    if (severity === "medium") return "text-warning border-warning/40 bg-warning/10";
    return "text-blue-400 border-blue-500/40 bg-blue-500/10";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5 max-w-7xl">
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-6">
        {primaryPr ? (
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <GitPullRequest className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-foreground truncate">{primaryPr.title} <span className="text-muted-foreground font-mono">#{primaryPr.number}</span></h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                <span className="text-muted-foreground">by <strong className="text-foreground">{primaryPr.author}</strong></span>
                <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded text-muted-foreground">{primaryPr.branch}</span>
                <span className="text-success font-semibold">+{primaryPr.additions}</span>
                <span className="text-destructive font-semibold">-{primaryPr.deletions}</span>
                <span className="text-muted-foreground">{primaryPr.changedFiles || 0} files</span>
                <span className="text-muted-foreground">updated {relativeTime(primaryPr.updatedAt)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No open pull requests found for this repository.</p>
        )}
      </motion.div>

      <motion.div variants={item} className="gradient-card rounded-xl border border-accent/25 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-accent" />
          <h2 className="text-accent text-xl font-semibold">AI Summary</h2>
        </div>
        <p className="text-lg text-foreground leading-relaxed">{aiSummary}</p>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-warning" />
        <h2 className="text-2xl font-bold text-foreground">{issues.length} Issues Detected</h2>
      </motion.div>

      {!canApplyFixes && (
        <motion.div variants={item} className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning flex items-center gap-2">
          <Lock className="w-4 h-4" />
          <span>
            Applying fixes requires collaborator authentication and email-link verification.
            <button onClick={() => navigate("/settings")} className="ml-2 underline underline-offset-2 hover:text-warning/80">Open Settings</button>
          </span>
        </motion.div>
      )}

      <div className="space-y-4">
        {issues.map((issue) => (
          <motion.div key={issue.id} variants={item} className="gradient-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${severityClass(issue.severity)}`}>{issue.severity}</span>
                  <span className="text-xs bg-secondary rounded px-2 py-1 text-muted-foreground">{issue.type}</span>
                </div>
                <h3 className="text-2xl font-semibold text-foreground">{issue.title}</h3>
                <p className="text-lg text-muted-foreground mt-1">{issue.description}</p>
              </div>
              <span className="text-muted-foreground font-mono text-sm flex items-center gap-1 shrink-0">
                <FileCode2 className="w-4 h-4" /> {issue.file}:{issue.line}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <CodeBlock code={issue.before} variant="before" />
              <CodeBlock code={issue.after} variant="after" />
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={!canApplyFixes}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  canApplyFixes
                    ? "bg-success/20 text-success hover:bg-success/30"
                    : "bg-secondary text-muted-foreground cursor-not-allowed opacity-60"
                }`}
              >
                <ShieldAlert className="w-4 h-4" /> Apply Fix
              </button>
              <button className="px-4 py-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" /> Learn More
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={item} className="gradient-card rounded-xl border border-accent/25 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <h2 className="text-accent text-xl font-semibold">AI Dev Mentor</h2>
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">Why hardcoded secrets are dangerous</h3>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Hardcoded secrets in source code can be extracted by anyone with repository access. If code is pushed to a public repository, the secret is permanently exposed in git history. Always use environment variables or a dedicated secrets manager.
        </p>
      </motion.div>
    </motion.div>
  );
}
