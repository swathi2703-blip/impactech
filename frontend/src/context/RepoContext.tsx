import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { GoogleAuthProvider, getRedirectResult, signInWithPopup, signInWithRedirect, signOut, User } from "firebase/auth";
import { firebaseAuth, firebaseProjectConfigured } from "@/lib/firebase";

export type RepoStatus = "idle" | "checking" | "valid" | "not_found" | "error";
export type AuthStatus = "idle" | "checking" | "collaborator" | "unauthorized" | "error";
export type RepoSnapshotStatus = "idle" | "loading" | "ready" | "error";

export interface RepoPullItem {
  number: number;
  title: string;
  body: string;
  author: string;
  branch: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepoIssueItem {
  number: number;
  title: string;
  createdAt: string;
  labels: string[];
}

export interface RepoContributorItem {
  login: string;
  avatarUrl: string;
  contributions: number;
}

export interface RepoHotspotItem {
  file: string;
  changes: number;
}

export interface RepoSnapshot {
  fullName: string;
  description: string;
  private: boolean;
  stars: number;
  forks: number;
  watchers: number;
  openIssuesCount: number;
  defaultBranch: string;
  language: string;
  pushedAt: string;
  pulls: RepoPullItem[];
  issues: RepoIssueItem[];
  contributors: RepoContributorItem[];
  languages: Record<string, number>;
  hotspots: RepoHotspotItem[];
}

interface RepoContextValue {
  repo: string;
  setRepo: (r: string) => void;
  repoStatus: RepoStatus;
  repoData: { full_name: string; description: string; private: boolean } | null;
  checkRepo: (repoInput: string) => Promise<void>;
  repoSnapshotStatus: RepoSnapshotStatus;
  repoSnapshotError: string;
  repoSnapshot: RepoSnapshot | null;
  refreshRepoSnapshot: () => Promise<void>;

  token: string;
  setToken: (t: string) => void;
  authStatus: AuthStatus;
  authErrorMessage: string;
  username: string;
  authenticateCollaborator: (tokenOverride?: string) => Promise<void>;
  authenticateCollaboratorWithFirebase: () => Promise<void>;
  firebaseAuthConfigured: boolean;
  collaboratorEmail: string;

  logout: () => void;

  isCollaborator: boolean;
  canApplyFixes: boolean;
}

const RepoContext = createContext<RepoContextValue | null>(null);

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const REPO_STORAGE_KEY = "devai-selected-repo";

function normalizeRepoInput(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  // Accept formats like owner/repo or owner/repo.git
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    const cleaned = raw.replace(/\.git$/, "");
    const parts = cleaned.split("/").filter(Boolean);
    if (parts.length === 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return null;
  }

  // Accept full repository URL like https://github.com/owner/repo(.git)
  try {
    const url = new URL(raw);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null;
    }
    const parts = url.pathname.replace(/\.git$/, "").split("/").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  } catch {
    return null;
  }

  return null;
}

function firebaseAuthErrorMessage(code?: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "Popup was blocked. Continuing with redirect sign-in...";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completion.";
    case "auth/cancelled-popup-request":
      return "Sign-in popup request was cancelled. Try again.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Auth. Add your app domain under Firebase Authentication > Settings > Authorized domains.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this Firebase project. Enable Google provider in Firebase Authentication > Sign-in method.";
    default:
      return "Google sign-in failed for this account.";
  }
}

export function RepoProvider({ children }: { children: ReactNode }) {
  const [repo, setRepo] = useState(() => window.localStorage.getItem(REPO_STORAGE_KEY) || "");
  const [repoStatus, setRepoStatus] = useState<RepoStatus>("idle");
  const [repoData, setRepoData] = useState<RepoContextValue["repoData"]>(null);
  const [repoSnapshotStatus, setRepoSnapshotStatus] = useState<RepoSnapshotStatus>("idle");
  const [repoSnapshotError, setRepoSnapshotError] = useState("");
  const [repoSnapshot, setRepoSnapshot] = useState<RepoSnapshot | null>(null);

  const [token, setToken] = useState(GITHUB_TOKEN ?? "");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("idle");
  const [authErrorMessage, setAuthErrorMessage] = useState("");
  const [username, setUsername] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");

  const isCollaborator = authStatus === "collaborator";
  const canApplyFixes = authStatus === "collaborator";
  const firebaseAuthConfigured = Boolean(firebaseProjectConfigured && firebaseAuth);

  const getGithubHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = { Accept: "application/vnd.github+json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, [token]);

  const refreshRepoSnapshot = useCallback(async () => {
    if (!repo) {
      setRepoSnapshot(null);
      setRepoSnapshotStatus("idle");
      setRepoSnapshotError("");
      return;
    }

    setRepoSnapshotStatus("loading");
    setRepoSnapshotError("");

    try {
      const headers = getGithubHeaders();
      const [repoRes, pullsRes, issuesRes, contributorsRes, languagesRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${repo}`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/pulls?state=open&per_page=20`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=60`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/contributors?per_page=12`, { headers }),
        fetch(`https://api.github.com/repos/${repo}/languages`, { headers }),
      ]);

      if (!repoRes.ok) {
        throw new Error("Unable to load repository details from GitHub.");
      }

      const repoJson = await repoRes.json();
      const pullsJson = pullsRes.ok ? await pullsRes.json() : [];
      const issuesJson = issuesRes.ok ? await issuesRes.json() : [];
      const contributorsJson = contributorsRes.ok ? await contributorsRes.json() : [];
      const languagesJson = languagesRes.ok ? await languagesRes.json() : {};

      const pullItems: RepoPullItem[] = (Array.isArray(pullsJson) ? pullsJson : []).map((pr: any) => ({
        number: pr.number,
        title: pr.title ?? "Untitled pull request",
        body: pr.body ?? "",
        author: pr.user?.login ?? "unknown",
        branch: pr.head?.ref ?? "unknown",
        additions: pr.additions ?? 0,
        deletions: pr.deletions ?? 0,
        changedFiles: pr.changed_files ?? 0,
        createdAt: pr.created_at ?? "",
        updatedAt: pr.updated_at ?? "",
      }));

      const issueItems: RepoIssueItem[] = (Array.isArray(issuesJson) ? issuesJson : [])
        .filter((issue: any) => !issue.pull_request)
        .map((issue: any) => ({
          number: issue.number,
          title: issue.title ?? "Untitled issue",
          createdAt: issue.created_at ?? "",
          labels: Array.isArray(issue.labels)
            ? issue.labels
              .map((label: any) => (typeof label?.name === "string" ? label.name : ""))
              .filter(Boolean)
            : [],
        }));

      const contributorItems: RepoContributorItem[] = (Array.isArray(contributorsJson) ? contributorsJson : [])
        .map((contributor: any) => ({
          login: contributor.login ?? "unknown",
          avatarUrl: contributor.avatar_url ?? "",
          contributions: contributor.contributions ?? 0,
        }));

      const pullFilesResponses = await Promise.all(
        pullItems.slice(0, 5).map((pr) =>
          fetch(`https://api.github.com/repos/${repo}/pulls/${pr.number}/files?per_page=100`, { headers }),
        ),
      );

      const fileChangeMap = new Map<string, number>();
      for (const response of pullFilesResponses) {
        if (!response.ok) continue;
        const files = await response.json();
        if (!Array.isArray(files)) continue;
        for (const file of files) {
          const filename = typeof file?.filename === "string" ? file.filename : "unknown-file";
          const changes = typeof file?.changes === "number" ? file.changes : 0;
          fileChangeMap.set(filename, (fileChangeMap.get(filename) ?? 0) + changes);
        }
      }

      const hotspots: RepoHotspotItem[] = [...fileChangeMap.entries()]
        .map(([file, changes]) => ({ file, changes }))
        .sort((a, b) => b.changes - a.changes)
        .slice(0, 8);

      setRepoSnapshot({
        fullName: repoJson.full_name ?? repo,
        description: repoJson.description ?? "",
        private: Boolean(repoJson.private),
        stars: repoJson.stargazers_count ?? 0,
        forks: repoJson.forks_count ?? 0,
        watchers: repoJson.subscribers_count ?? repoJson.watchers_count ?? 0,
        openIssuesCount: repoJson.open_issues_count ?? issueItems.length,
        defaultBranch: repoJson.default_branch ?? "main",
        language: repoJson.language ?? "Unknown",
        pushedAt: repoJson.pushed_at ?? "",
        pulls: pullItems,
        issues: issueItems,
        contributors: contributorItems,
        languages: (languagesJson && typeof languagesJson === "object") ? languagesJson : {},
        hotspots,
      });
      setRepoSnapshotStatus("ready");
    } catch (error) {
      setRepoSnapshotStatus("error");
      setRepoSnapshotError(error instanceof Error ? error.message : "Failed to load repository data.");
      setRepoSnapshot(null);
    }
  }, [repo, getGithubHeaders]);

  const applyFirebaseUser = useCallback((user: User | null) => {
    const resolvedEmail = user?.email?.toLowerCase() ?? "";
    const resolvedName = user?.displayName?.trim() || resolvedEmail.split("@")[0] || "firebase-user";

    if (!resolvedEmail) {
      setAuthStatus("error");
      setAuthErrorMessage("Google account email is not available for verification.");
      return;
    }

    setUsername(resolvedName);
    setCollaboratorEmail(resolvedEmail);
    setAuthErrorMessage("");
    setAuthStatus("collaborator");
  }, []);

  useEffect(() => {
    if (!firebaseAuth) return;
    void getRedirectResult(firebaseAuth)
      .then((result) => {
        if (result?.user) {
          applyFirebaseUser(result.user);
        }
      })
      .catch((error: { code?: string }) => {
        setAuthStatus("unauthorized");
        setAuthErrorMessage(firebaseAuthErrorMessage(error?.code));
      });
  }, [applyFirebaseUser]);

  const checkRepo = useCallback(async (repoInput: string) => {
    const normalized = normalizeRepoInput(repoInput);
    if (!normalized) {
      setRepoStatus("error");
      setRepoData(null);
      setRepoSnapshotStatus("error");
      setRepoSnapshotError("Invalid repository format. Use owner/repo or a GitHub URL.");
      setRepoSnapshot(null);
      setAuthStatus("idle");
      setAuthErrorMessage("");
      setUsername("");
      setCollaboratorEmail("");
      resetOtp();
      return;
    }

    setRepo(normalized);
    window.localStorage.setItem(REPO_STORAGE_KEY, normalized);
    setAuthStatus("idle");
    setAuthErrorMessage("");
    setUsername("");
    setCollaboratorEmail("");
    setRepoStatus("checking");
    setRepoData(null);
    try {
      const headers: HeadersInit = { Accept: "application/vnd.github+json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`https://api.github.com/repos/${normalized}`, { headers });
      if (res.status === 404) {
        setRepoStatus("not_found");
        setRepoSnapshotStatus("error");
        setRepoSnapshotError("Repository not found.");
        setRepoSnapshot(null);
      } else if (res.ok) {
        const data = await res.json();
        setRepoData({ full_name: data.full_name, description: data.description, private: data.private });
        setRepoStatus("valid");
        setRepoSnapshotError("");
      } else {
        setRepoStatus("error");
        setRepoSnapshotStatus("error");
        setRepoSnapshotError("Could not reach GitHub API for repository data.");
        setRepoSnapshot(null);
      }
    } catch {
      setRepoStatus("error");
      setRepoSnapshotStatus("error");
      setRepoSnapshotError("Could not reach GitHub API for repository data.");
      setRepoSnapshot(null);
    }
  }, [token]);

  useEffect(() => {
    if (!repo) return;
    if (repoStatus !== "idle") return;
    void checkRepo(repo);
  }, [repo, repoStatus, checkRepo]);

  useEffect(() => {
    if (!repo) return;
    if (repoStatus !== "valid") return;
    void refreshRepoSnapshot();
  }, [repo, repoStatus, refreshRepoSnapshot]);

  const authenticateCollaborator = useCallback(async (tokenOverride?: string) => {
    const effectiveToken = tokenOverride?.trim() || token;
    if (!effectiveToken) {
      setAuthStatus("error");
      return;
    }
    setAuthStatus("checking");
    setAuthErrorMessage("");
    try {
      // Step 1: resolve the authenticated user
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${effectiveToken}`, Accept: "application/vnd.github+json" },
      });
      if (!userRes.ok) {
        setAuthStatus("unauthorized");
        return;
      }
      const userData = await userRes.json();
      const login: string = userData.login;
      setUsername(login);

      // Step 2: check if that user is a collaborator on the current repo
      const collabRes = await fetch(
        `https://api.github.com/repos/${repo}/collaborators/${login}`,
        {
          headers: { Authorization: `Bearer ${effectiveToken}`, Accept: "application/vnd.github+json" },
        }
      );
      let collaboratorGranted = false;

      // 204 = yes, 404 = no, 403 = no permission to check (treat as yes if owner)
      if (collabRes.status === 204) {
        collaboratorGranted = true;
        setAuthStatus("collaborator");
      } else if (collabRes.status === 403) {
        // Token owner may be the repo owner — check via repo endpoint
        const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { Authorization: `Bearer ${effectiveToken}`, Accept: "application/vnd.github+json" },
        });
        if (repoRes.ok) {
          const repoInfo = await repoRes.json();
          if (repoInfo.owner?.login === login) {
            collaboratorGranted = true;
            setAuthStatus("collaborator");
          } else {
            setAuthStatus("unauthorized");
          }
        } else {
          setAuthStatus("unauthorized");
        }
      } else {
        setAuthStatus("unauthorized");
      }

    } catch {
      setAuthStatus("error");
    }
  }, [token, repo]);

  const authenticateCollaboratorWithFirebase = useCallback(async () => {
    if (!firebaseAuth) {
      setAuthStatus("error");
      return;
    }

    setAuthStatus("checking");
    setAuthErrorMessage("");
    setCollaboratorEmail("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(firebaseAuth, provider);
      applyFirebaseUser(userCredential.user);
    } catch (error) {
      const authError = error as { code?: string };
      if (authError.code === "auth/popup-blocked") {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithRedirect(firebaseAuth, provider);
        return;
      }
      setAuthStatus("unauthorized");
      setAuthErrorMessage(firebaseAuthErrorMessage(authError.code));
    }
  }, [applyFirebaseUser]);

  const logout = useCallback(() => {
    if (firebaseAuth?.currentUser) {
      void signOut(firebaseAuth);
    }
    setAuthStatus("idle");
    setAuthErrorMessage("");
    setUsername("");
    setCollaboratorEmail("");
    setToken(GITHUB_TOKEN ?? "");
  }, []);

  return (
    <RepoContext.Provider
      value={{
        repo, setRepo,
        repoStatus, repoData, checkRepo,
        repoSnapshotStatus,
        repoSnapshotError,
        repoSnapshot,
        refreshRepoSnapshot,
        token, setToken,
        authStatus, authErrorMessage, username,
        authenticateCollaborator,
        authenticateCollaboratorWithFirebase,
        firebaseAuthConfigured,
        collaboratorEmail,
        logout,
        isCollaborator,
        canApplyFixes,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used inside RepoProvider");
  return ctx;
}
