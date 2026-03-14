import { motion } from "framer-motion";
import { Shield, AlertTriangle, Package, ExternalLink, CheckCircle2 } from "lucide-react";
import { SeverityBadge } from "@/components/SeverityBadge";
import { HeatmapBar } from "@/components/HeatmapBar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const vulns = [
  { id: 1, pkg: "lodash", version: "4.17.20", severity: "critical" as const, cve: "CVE-2021-23337", title: "Command Injection", fix: "4.17.21" },
  { id: 2, pkg: "express", version: "4.17.1", severity: "high" as const, cve: "CVE-2022-24999", title: "Open Redirect", fix: "4.18.2" },
  { id: 3, pkg: "jsonwebtoken", version: "8.5.1", severity: "high" as const, cve: "CVE-2022-23529", title: "Insecure Key Handling", fix: "9.0.0" },
  { id: 4, pkg: "axios", version: "0.21.1", severity: "medium" as const, cve: "CVE-2021-3749", title: "ReDoS", fix: "0.21.2" },
  { id: 5, pkg: "helmet", version: "4.6.0", severity: "low" as const, cve: "CVE-2023-0001", title: "CSP Bypass", fix: "5.0.0" },
];

const pieData = [
  { name: "Critical", value: 1, color: "hsl(0,82%,63%)" },
  { name: "High", value: 2, color: "hsl(0,62%,50%)" },
  { name: "Medium", value: 1, color: "hsl(40,76%,49%)" },
  { name: "Low", value: 1, color: "hsl(212,100%,67%)" },
];

const riskFiles = [
  { file: "src/api/auth.ts", issues: 14 },
  { file: "src/db/connection.ts", issues: 11 },
  { file: "src/utils/crypto.ts", issues: 8 },
  { file: "src/routes/admin.ts", issues: 6 },
  { file: "src/middleware/session.ts", issues: 4 },
  { file: "src/config/db.ts", issues: 2 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Security() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div variants={item} className="gradient-card rounded-xl border border-destructive/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-destructive/10">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">5</div>
            <div className="text-xs text-muted-foreground">Vulnerabilities Found</div>
          </div>
        </motion.div>
        <motion.div variants={item} className="gradient-card rounded-xl border border-success/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-success/10">
            <CheckCircle2 className="w-6 h-6 text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">142</div>
            <div className="text-xs text-muted-foreground">Dependencies Scanned</div>
          </div>
        </motion.div>
        <motion.div variants={item} className="gradient-card rounded-xl border border-primary/20 p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">90/100</div>
            <div className="text-xs text-muted-foreground">Security Score</div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Vulnerability list */}
        <motion.div variants={item} className="lg:col-span-2 gradient-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Dependency Vulnerabilities</h2>
          </div>
          <div className="space-y-3">
            {vulns.map((v) => (
              <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors group">
                <SeverityBadge level={v.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{v.pkg}</span>
                    <span className="text-xs font-mono text-muted-foreground">v{v.version}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.title} · {v.cve}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-success font-mono">Fix: v{v.fix}</div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">By Severity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(215,25%,9%)", border: "1px solid hsl(215,20%,18%)", borderRadius: 8, color: "hsl(210,40%,92%)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Risk Heatmap */}
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Security Risk Heatmap</h2>
        <div className="space-y-3">
          {riskFiles.map((f) => (
            <HeatmapBar key={f.file} file={f.file} issues={f.issues} maxIssues={14} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
