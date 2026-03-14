interface CodeBlockProps {
  code: string;
  language?: string;
  variant?: "before" | "after" | "default";
}

const variants = {
  before: "border-destructive/30 bg-destructive/5",
  after: "border-success/30 bg-success/5",
  default: "border-border",
};

export function CodeBlock({ code, variant = "default" }: CodeBlockProps) {
  return (
    <div className={`rounded-lg border ${variants[variant]} overflow-hidden`}>
      <div className="px-4 py-1.5 border-b border-border/50 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
        </div>
        <span className="text-[10px] text-muted-foreground uppercase ml-2">
          {variant === "before" ? "Before" : variant === "after" ? "After" : "Code"}
        </span>
      </div>
      <pre className="p-4 text-sm font-mono text-foreground overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
