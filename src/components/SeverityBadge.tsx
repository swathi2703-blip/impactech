interface SeverityBadgeProps {
  level: "low" | "medium" | "high" | "critical";
}

const styles = {
  low: "bg-primary/10 text-primary border-primary/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  critical: "bg-destructive/20 text-destructive border-destructive/40",
};

export function SeverityBadge({ level }: SeverityBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${styles[level]}`}>
      {level}
    </span>
  );
}
