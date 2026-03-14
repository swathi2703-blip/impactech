import { motion } from "framer-motion";
import { Users, GitCompare, Network, BarChart3, Zap, AlertTriangle } from "lucide-react";
import { RadarChart } from "@/components/RadarChart";

const developers = [
  {
    name: "Rahul Sharma",
    avatar: "RS",
    role: "Senior Engineer",
    commits: 234,
    prs: 45,
    skills: [
      { label: "API Design", value: 92 },
      { label: "Testing", value: 45 },
      { label: "Security", value: 78 },
      { label: "Docs", value: 60 },
      { label: "Architecture", value: 85 },
    ],
    strengths: ["API Design", "Architecture"],
    weaknesses: ["Testing"],
  },
  {
    name: "Emily Chen",
    avatar: "EC",
    role: "Full Stack Dev",
    commits: 189,
    prs: 38,
    skills: [
      { label: "API Design", value: 70 },
      { label: "Testing", value: 90 },
      { label: "Security", value: 65 },
      { label: "Docs", value: 88 },
      { label: "Architecture", value: 72 },
    ],
    strengths: ["Testing", "Docs"],
    weaknesses: ["Security"],
  },
];

const duplicates = [
  {
    pr1: { number: 101, title: "UserValidator", author: "Rahul" },
    pr2: { number: 102, title: "UserValidationService", author: "Emily" },
    similarity: 87,
    recommendation: "Merge logic into a shared validation module to prevent architectural fragmentation.",
  },
  {
    pr1: { number: 115, title: "APIRateLimiter", author: "Rahul" },
    pr2: { number: 118, title: "RequestThrottler", author: "Alex" },
    similarity: 72,
    recommendation: "Both PRs implement request throttling. Consolidate into a single middleware.",
  },
];

const archNodes = [
  { id: "api", label: "API Gateway", x: 300, y: 50, risk: "low" },
  { id: "auth", label: "Auth Service", x: 150, y: 150, risk: "high" },
  { id: "users", label: "User Module", x: 450, y: 150, risk: "low" },
  { id: "db", label: "Database", x: 300, y: 250, risk: "medium" },
  { id: "cache", label: "Cache Layer", x: 500, y: 250, risk: "low" },
  { id: "email", label: "Email Service", x: 100, y: 300, risk: "low" },
];

const archEdges = [
  ["api", "auth"], ["api", "users"], ["auth", "db"], ["users", "db"],
  ["users", "cache"], ["auth", "email"],
];

const riskColors: Record<string, string> = {
  low: "hsl(137,63%,37%)",
  medium: "hsl(40,76%,49%)",
  high: "hsl(0,82%,63%)",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Insights() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      {/* Developer Collaboration */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Developer Collaboration Insight</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {developers.map((dev) => (
            <div key={dev.name} className="gradient-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {dev.avatar}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{dev.name}</h3>
                  <p className="text-xs text-muted-foreground">{dev.role} · {dev.commits} commits · {dev.prs} PRs</p>
                </div>
              </div>
              <div className="flex items-center justify-center mb-4">
                <RadarChart data={dev.skills} size={180} />
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <span className="text-success font-medium">Strengths: </span>
                  <span className="text-muted-foreground">{dev.strengths.join(", ")}</span>
                </div>
                <div>
                  <span className="text-destructive font-medium">Improve: </span>
                  <span className="text-muted-foreground">{dev.weaknesses.join(", ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Duplicate Logic Detector */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-4 h-4 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Cross-PR Conflict Prediction</h2>
        </div>
        <div className="space-y-3">
          {duplicates.map((d, i) => (
            <div key={i} className="gradient-card rounded-xl border border-warning/20 p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-foreground">PR #{d.pr1.number}</span>
                  <span className="text-xs text-muted-foreground">{d.pr1.title}</span>
                </div>
                <Zap className="w-4 h-4 text-warning" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-secondary px-2 py-0.5 rounded text-foreground">PR #{d.pr2.number}</span>
                  <span className="text-xs text-muted-foreground">{d.pr2.title}</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <div className="h-2 w-16 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full" style={{ width: `${d.similarity}%` }} />
                  </div>
                  <span className="text-xs font-mono text-warning">{d.similarity}%</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{d.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Architecture Map */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Repository Architecture Map</h2>
        </div>
        <svg width="100%" viewBox="0 0 600 360" className="overflow-visible">
          {archEdges.map(([from, to], i) => {
            const f = archNodes.find((n) => n.id === from)!;
            const t = archNodes.find((n) => n.id === to)!;
            return (
              <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="hsl(215,20%,22%)" strokeWidth="2" />
            );
          })}
          {archNodes.map((node) => (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={28} fill="hsl(215,25%,12%)" stroke={riskColors[node.risk]} strokeWidth="2.5" />
              {node.risk === "high" && (
                <circle cx={node.x} cy={node.y} r={28} fill="none" stroke={riskColors[node.risk]} strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" from="28" to="40" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <text x={node.x} y={node.y + 4} textAnchor="middle" fill="hsl(210,40%,92%)" style={{ fontSize: "9px", fontFamily: "Inter", fontWeight: 600 }}>
                {node.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex gap-4 mt-3 justify-center">
          {Object.entries(riskColors).map(([level, color]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="text-xs text-muted-foreground capitalize">{level} risk</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Benchmark */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Repository Benchmark</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-success/5 border border-success/20">
            <h3 className="text-xs font-semibold text-success uppercase tracking-wider mb-3">Strengths</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Comprehensive documentation</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> CI/CD pipeline configured</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-success" /> AI-based monitoring</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <h3 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">Missing Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-destructive" /> No automated tests</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Missing CONTRIBUTING.md</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
            <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">Unique Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> AI repository analysis</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Auto-fix suggestions</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
