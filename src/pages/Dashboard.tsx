import { Shield, Code2, FileText, Package, GitPullRequest, AlertTriangle, CheckCircle2, Bug } from "lucide-react";
import { HealthGauge } from "@/components/HealthGauge";
import { MetricCard } from "@/components/MetricCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { HeatmapBar } from "@/components/HeatmapBar";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";

const trendData = [
  { week: "W1", issues: 24 }, { week: "W2", issues: 19 }, { week: "W3", issues: 22 },
  { week: "W4", issues: 15 }, { week: "W5", issues: 12 }, { week: "W6", issues: 8 },
];

const vulnData = [
  { type: "XSS", count: 3 }, { type: "SQL Inj", count: 1 }, { type: "CSRF", count: 2 },
  { type: "Deps", count: 5 }, { type: "Auth", count: 2 },
];

const heatmapFiles = [
  { file: "src/api/auth.ts", issues: 12 },
  { file: "src/utils/parser.ts", issues: 9 },
  { file: "src/db/queries.ts", issues: 7 },
  { file: "src/routes/users.ts", issues: 5 },
  { file: "src/middleware/cors.ts", issues: 3 },
  { file: "src/services/email.ts", issues: 2 },
  { file: "src/config/index.ts", issues: 1 },
];

const activities = [
  { icon: GitPullRequest, text: "PR #142 analyzed — 3 issues found", time: "2m ago", color: "text-primary" },
  { icon: AlertTriangle, text: "Critical vulnerability in lodash@4.17.20", time: "15m ago", color: "text-destructive" },
  { icon: CheckCircle2, text: "PR #139 auto-fix applied successfully", time: "1h ago", color: "text-success" },
  { icon: Bug, text: "Memory leak detected in worker.ts", time: "3h ago", color: "text-warning" },
  { icon: CheckCircle2, text: "Security scan completed — 2 new findings", time: "5h ago", color: "text-primary" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <motion.div variants={item} className="lg:col-span-1 lg:row-span-2 gradient-card rounded-xl border border-border p-6 flex flex-col items-center justify-center glow-primary">
          <HealthGauge score={85} />
          <p className="text-sm text-muted-foreground mt-3">Repository Health</p>
        </motion.div>

        {/* Metric cards */}
        <motion.div variants={item}><MetricCard title="Security Score" value="90/100" icon={Shield} trend="+5" variant="success" /></motion.div>
        <motion.div variants={item}><MetricCard title="Code Quality" value="80/100" icon={Code2} trend="+3" variant="warning" /></motion.div>
        <motion.div variants={item}><MetricCard title="Documentation" value="70/100" icon={FileText} trend="-2" variant="accent" /></motion.div>
        <motion.div variants={item}><MetricCard title="Dependencies" value="92/100" icon={Package} trend="+1" variant="success" /></motion.div>
        <motion.div variants={item}><MetricCard title="PRs Reviewed" value="47" icon={GitPullRequest} trend="+12" /></motion.div>
        <motion.div variants={item}><MetricCard title="Bugs Detected" value="23" icon={Bug} trend="-8" variant="danger" /></motion.div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Issues Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="issueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(212,100%,67%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(212,100%,67%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: "hsl(215,16%,56%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,16%,56%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(215,25%,9%)", border: "1px solid hsl(215,20%,18%)", borderRadius: 8, color: "hsl(210,40%,92%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="issues" stroke="hsl(212,100%,67%)" fill="url(#issueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Vulnerability Types</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vulnData}>
              <XAxis dataKey="type" tick={{ fill: "hsl(215,16%,56%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215,16%,56%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(215,25%,9%)", border: "1px solid hsl(215,20%,18%)", borderRadius: 8, color: "hsl(210,40%,92%)", fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(0,82%,63%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Heatmap + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Code Risk Heatmap</h3>
          <div className="space-y-3">
            {heatmapFiles.map((f) => (
              <HeatmapBar key={f.file} file={f.file} issues={f.issues} maxIssues={12} />
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Activity Feed</h3>
          <div className="space-y-4">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className={`p-1.5 rounded-md bg-secondary ${a.color} mt-0.5`}>
                  <a.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground group-hover:text-primary transition-colors">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
                <SeverityBadge level={i === 1 ? "critical" : i === 3 ? "medium" : "low"} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
