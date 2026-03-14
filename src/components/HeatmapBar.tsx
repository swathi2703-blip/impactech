import { motion } from "framer-motion";

interface HeatmapBarProps {
  file: string;
  issues: number;
  maxIssues: number;
}

export function HeatmapBar({ file, issues, maxIssues }: HeatmapBarProps) {
  const pct = (issues / maxIssues) * 100;
  const color = pct > 70 ? "bg-destructive" : pct > 40 ? "bg-warning" : "bg-success";

  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs font-mono text-muted-foreground w-48 truncate group-hover:text-foreground transition-colors">
        {file}
      </span>
      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{issues}</span>
    </div>
  );
}
