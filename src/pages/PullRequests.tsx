import { motion } from "framer-motion";
import { GitPullRequest, FileCode, AlertTriangle, Lightbulb, Bot, CheckCircle2 } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CodeBlock } from "@/components/CodeBlock";

const prData = {
  title: "feat: Add user authentication middleware",
  number: 142,
  author: "sarah-dev",
  branch: "feature/auth-middleware",
  files: 8,
  additions: 245,
  deletions: 32,
  summary: "This PR adds JWT-based authentication middleware with rate limiting. It introduces a new auth module, updates route handlers to use protected routes, and adds input validation for login endpoints.",
};

const issues = [
  {
    id: 1,
    file: "src/middleware/auth.ts",
    line: 42,
    severity: "high" as const,
    type: "Security",
    title: "JWT secret hardcoded in source",
    description: "The JWT signing secret is hardcoded. Move it to environment variables.",
    before: `const SECRET = "my-super-secret-key-123";\nconst token = jwt.sign(payload, SECRET);`,
    after: `const SECRET = process.env.JWT_SECRET;\nif (!SECRET) throw new Error("JWT_SECRET not set");\nconst token = jwt.sign(payload, SECRET);`,
  },
  {
    id: 2,
    file: "src/routes/login.ts",
    line: 18,
    severity: "medium" as const,
    type: "Bug",
    title: "Missing input validation on email field",
    description: "The email field is not validated before being used in the database query, which could lead to injection attacks.",
    before: `app.post("/login", (req, res) => {\n  const { email, password } = req.body;\n  db.query("SELECT * FROM users WHERE email = ?", [email]);\n});`,
    after: `app.post("/login", (req, res) => {\n  const { email, password } = req.body;\n  if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });\n  db.query("SELECT * FROM users WHERE email = ?", [email]);\n});`,
  },
  {
    id: 3,
    file: "src/middleware/auth.ts",
    line: 67,
    severity: "low" as const,
    type: "Code Smell",
    title: "Function exceeds 50 lines",
    description: "The validateToken function is 78 lines long. Break it into smaller, testable functions following the Single Responsibility Principle.",
    before: `function validateToken(token: string) {\n  // ... 78 lines of validation logic\n  // token parsing, expiry check, role extraction,\n  // rate limiting, logging, error handling\n}`,
    after: `function parseToken(token: string): TokenPayload { ... }\nfunction checkExpiry(payload: TokenPayload): boolean { ... }\nfunction extractRoles(payload: TokenPayload): Role[] { ... }\n\nfunction validateToken(token: string) {\n  const payload = parseToken(token);\n  if (!checkExpiry(payload)) throw new TokenExpiredError();\n  return extractRoles(payload);\n}`,
  },
];

const mentorTip = {
  title: "Why hardcoded secrets are dangerous",
  content: "Hardcoded secrets in source code can be extracted by anyone with repository access. If the code is pushed to a public repository, the secret is permanently exposed in git history. Always use environment variables or a secrets manager like HashiCorp Vault.",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function PullRequests() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl">
      {/* PR Header */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <GitPullRequest className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-foreground">{prData.title}</h1>
              <span className="text-muted-foreground font-mono">#{prData.number}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>by <span className="text-foreground font-medium">{prData.author}</span></span>
              <span className="font-mono text-xs bg-secondary px-2 py-0.5 rounded">{prData.branch}</span>
              <span className="text-success">+{prData.additions}</span>
              <span className="text-destructive">-{prData.deletions}</span>
              <span>{prData.files} files</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-accent/20 p-5 glow-accent">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-accent">AI Summary</h2>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{prData.summary}</p>
      </motion.div>

      {/* Issues */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h2 className="text-sm font-semibold text-foreground">{issues.length} Issues Detected</h2>
        </div>

        {issues.map((issue) => (
          <motion.div key={issue.id} variants={item} className="gradient-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SeverityBadge level={issue.severity} />
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{issue.type}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mt-2">{issue.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                <FileCode className="w-3 h-3 inline mr-1" />
                {issue.file}:{issue.line}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CodeBlock code={issue.before} variant="before" />
              <CodeBlock code={issue.after} variant="after" />
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors">
                <CheckCircle2 className="w-3 h-3" /> Apply Fix
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:text-foreground transition-colors">
                <Lightbulb className="w-3 h-3" /> Learn More
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Mentor */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-accent/20 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-accent">AI Dev Mentor</h2>
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-2">{mentorTip.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{mentorTip.content}</p>
      </motion.div>
    </motion.div>
  );
}
