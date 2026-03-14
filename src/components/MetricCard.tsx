import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
}

const variantStyles = {
  default: "border-border",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-destructive/30",
  accent: "border-accent/30",
};

const iconVariants = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  accent: "text-accent",
};

export function MetricCard({ title, value, icon: Icon, trend, variant = "default" }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`gradient-card rounded-xl border ${variantStyles[variant]} p-5 transition-colors hover:border-primary/20`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg bg-secondary ${iconVariants[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.startsWith("+") ? "text-success" : "text-destructive"}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </motion.div>
  );
}
