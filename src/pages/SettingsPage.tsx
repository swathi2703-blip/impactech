import { motion } from "framer-motion";
import { Settings as SettingsIcon, Github, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl space-y-6">
      <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
        <SettingsIcon className="w-5 h-5" /> Settings
      </h1>

      {/* Repository Connection */}
      <div className="gradient-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Github className="w-4 h-4 text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Repository Connection</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-secondary">
            <label className="text-xs text-muted-foreground">Provider</label>
            <div className="text-sm text-foreground font-medium mt-1">GitHub</div>
          </div>
          <div className="p-3 rounded-lg bg-secondary">
            <label className="text-xs text-muted-foreground">Repository</label>
            <div className="text-sm text-foreground font-mono mt-1">acme/web-platform</div>
          </div>
        </div>
        <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Connect Repository
        </button>
      </div>

      {/* Notifications */}
      <div className="gradient-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        </div>
        {["Critical vulnerabilities", "PR review completed", "New code smells detected", "Weekly health report"].map((item) => (
          <div key={item} className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{item}</span>
            <div className="w-10 h-5 rounded-full bg-primary/20 relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary absolute top-0.5 right-0.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Security */}
      <div className="gradient-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Security Scanning</h2>
        </div>
        {["Auto-scan on PR", "Dependency vulnerability check", "SAST analysis", "Secret detection"].map((item) => (
          <div key={item} className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{item}</span>
            <div className="w-10 h-5 rounded-full bg-primary/20 relative cursor-pointer">
              <div className="w-4 h-4 rounded-full bg-primary absolute top-0.5 right-0.5" />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
