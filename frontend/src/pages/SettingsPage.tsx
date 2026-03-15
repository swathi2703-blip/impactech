import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon, Github, Bell, Shield,
  CheckCircle2, XCircle, Loader2, LogOut, User, Link2,
} from "lucide-react";
import { useRepo } from "@/context/RepoContext";

export default function SettingsPage() {
  const {
    repo, repoStatus, repoData, checkRepo,
    authStatus, authErrorMessage, username,
    authenticateCollaboratorWithFirebase, firebaseAuthConfigured, logout, isCollaborator,
    collaboratorEmail, canApplyFixes,
  } = useRepo();

  const [repoInput, setRepoInput] = useState(repo);

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "Critical vulnerabilities": true,
    "PR review completed": true,
    "New code smells detected": true,
    "Weekly health report": true,
  });

  const [securityScanning, setSecurityScanning] = useState<Record<string, boolean>>({
    "Auto-scan on PR": true,
    "Dependency vulnerability check": true,
    "SAST analysis": true,
    "Secret detection": true,
  });

  const toggleNotification = (key: string) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSecurity = (key: string) =>
    setSecurityScanning((prev) => ({ ...prev, [key]: !prev[key] }));

  // Auto-check repo after user stops typing (debounce 600 ms)
  useEffect(() => {
    const id = setTimeout(() => {
      if (repoInput.trim() && repoInput.includes("/")) {
        void checkRepo(repoInput.trim());
      }
    }, 600);
    return () => clearTimeout(id);
  }, [repoInput, checkRepo]);


  const repoStatusIcon = () => {
    if (repoStatus === "checking") return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (repoStatus === "valid") return <CheckCircle2 className="w-4 h-4 text-success" />;
    if (repoStatus === "not_found") return <XCircle className="w-4 h-4 text-destructive" />;
    if (repoStatus === "error") return <XCircle className="w-4 h-4 text-warning" />;
    return null;
  };

  const repoStatusText = () => {
    if (repoStatus === "checking") return <span className="text-xs text-muted-foreground">Checking…</span>;
    if (repoStatus === "valid") return <span className="text-xs text-success">{repoData?.private ? "Private" : "Public"} · {repoData?.full_name}</span>;
    if (repoStatus === "not_found") return <span className="text-xs text-destructive">Repository not found</span>;
    if (repoStatus === "error") return <span className="text-xs text-warning">Could not reach GitHub API</span>;
    return null;
  };

  const authStatusLabel = () => {
    if (authStatus === "checking") return <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Verifying…</span>;
    if (authStatus === "collaborator") return <span className="text-xs text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Collaborator verified as <strong>{username}</strong></span>;
    if (authStatus === "unauthorized") return <span className="text-xs text-destructive flex items-center gap-1"><XCircle className="w-3 h-3" />{authErrorMessage || "Google sign-in failed for this account"}</span>;
    if (authStatus === "error") return <span className="text-xs text-warning flex items-center gap-1"><XCircle className="w-3 h-3" />Authentication failed — check Firebase settings and Google provider</span>;
    return null;
  };

  const repoTone = repoStatus === "valid"
    ? "text-success border-success/20 bg-success/10"
    : repoStatus === "checking"
      ? "text-primary border-primary/20 bg-primary/10"
      : repoStatus === "not_found"
        ? "text-destructive border-destructive/20 bg-destructive/10"
        : repoStatus === "error"
          ? "text-warning border-warning/20 bg-warning/10"
          : "text-muted-foreground border-border bg-secondary/40";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(90%_140%_at_0%_0%,hsl(201_90%_42%_/_0.13),transparent_58%),radial-gradient(85%_120%_at_100%_100%,hsl(18_88%_60%_/_0.10),transparent_58%),linear-gradient(180deg,hsl(0_0%_100%),hsl(36_38%_97%))] px-6 py-7 shadow-[0_18px_50px_hsl(201_90%_42%_/_0.08)] md:px-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full border border-primary/15 translate-x-10 -translate-y-10" />
        <div className="absolute left-0 bottom-0 h-48 w-48 rounded-full border border-warning/15 -translate-x-12 translate-y-12" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <SettingsIcon className="w-4 h-4" />
              Workspace Settings
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">Repository-driven control center</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Connect one GitHub repository, verify an approved collaborator, and keep notifications and security behavior tied to the same repo analysis flow.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[460px]">
            <div className="rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Active Repo</p>
              <p className="mt-2 text-sm font-semibold text-foreground break-all">{repo || "Not connected"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Auth State</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{isCollaborator ? "Verified" : "Pending"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fix Access</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{canApplyFixes ? "Unlocked" : "Locked"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <div className="space-y-6">
          <section className="gradient-card rounded-3xl border border-border p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <Github className="w-4 h-4" />
                  <h2 className="text-base font-semibold">Repository Connection</h2>
                </div>
                <p className="text-sm text-muted-foreground">Everything in the dashboard uses this single repository as the source of truth.</p>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-medium ${repoTone}`}>
                {repoStatus === "valid" ? "Connected" : repoStatus === "checking" ? "Checking" : repoStatus === "not_found" ? "Not Found" : repoStatus === "error" ? "Error" : "Idle"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[0.9fr_1.4fr]">
              <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Provider</p>
                <p className="mt-2 text-base font-semibold text-foreground">GitHub</p>
                <p className="mt-1 text-xs text-muted-foreground">Paste either `owner/repo` or the full GitHub repository URL.</p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/35 p-4 space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Repository</label>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <input
                    className="flex-1 bg-transparent text-sm text-foreground font-mono outline-none"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="owner/repo or https://github.com/owner/repo"
                    spellCheck={false}
                  />
                  {repoStatusIcon()}
                </div>
                <div className="min-h-[18px]">{repoStatusText()}</div>
                {repoData?.description && <p className="text-xs italic text-muted-foreground">{repoData.description}</p>}
              </div>
            </div>
          </section>

          <section className="gradient-card rounded-3xl border border-border p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4" />
                  <h2 className="text-base font-semibold">Collaborator Authentication</h2>
                </div>
                <p className="text-sm text-muted-foreground">Sign in with Google to instantly unlock all features for this repository.</p>
              </div>
              {isCollaborator && (
                <button
                  onClick={logout}
                  className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-3 h-3" /> Sign out
                </button>
              )}
            </div>

            {!isCollaborator ? (
              <div className="rounded-2xl border border-border bg-secondary/35 p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Sign in with your Google account to verify your identity and unlock full access.</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => void authenticateCollaboratorWithFirebase()}
                    disabled={authStatus === "checking" || !firebaseAuthConfigured}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {authStatus === "checking" ? "Verifying…" : "Sign in with Google"}
                  </button>
                  <div>{authStatusLabel()}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-success/30 bg-success/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Access Unlocked</span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Signed in as</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{username}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Verified email</p>
                    <p className="mt-1 break-all font-mono text-sm text-foreground">{collaboratorEmail || "—"}</p>
                  </div>
                </div>
                {canApplyFixes && (
                  <p className="text-xs text-success">Fix application is enabled for this session.</p>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="gradient-card rounded-3xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            </div>
            {[
              "Critical vulnerabilities",
              "PR review completed",
              "New code smells detected",
              "Weekly health report",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{item}</span>
                <button
                  role="switch"
                  aria-checked={notifications[item]}
                  onClick={() => toggleNotification(item)}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    notifications[item] ? "bg-primary/30" : "bg-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200 ${
                      notifications[item] ? "bg-primary right-0.5" : "bg-muted-foreground left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </section>

          <section className="gradient-card rounded-3xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-foreground" />
              <h2 className="text-base font-semibold text-foreground">Security Scanning</h2>
            </div>
            {[
              "Auto-scan on PR",
              "Dependency vulnerability check",
              "SAST analysis",
              "Secret detection",
            ].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-2xl border border-border bg-secondary/30 px-4 py-3">
                <span className="text-sm text-muted-foreground">{item}</span>
                <button
                  role="switch"
                  aria-checked={securityScanning[item]}
                  onClick={() => toggleSecurity(item)}
                  className={`w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    securityScanning[item] ? "bg-primary/30" : "bg-muted"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full absolute top-0.5 transition-all duration-200 ${
                      securityScanning[item] ? "bg-primary right-0.5" : "bg-muted-foreground left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </section>
        </div>
      </div>
    </motion.div>
  );
}
