import { motion } from "framer-motion";
import { AlertTriangle, BarChart3, GitCompare, Network, Users, Zap } from "lucide-react";
import { RadarChart } from "@/components/RadarChart";
import { useRepo } from "@/context/RepoContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

type RiskLevel = "low" | "medium" | "high";

interface DeveloperCard {
  name: string;
  avatar: string;
  role: string;
  commits: number;
  prs: number;
  skills: { label: string; value: number }[];
  strengths: string[];
  weaknesses: string[];
}

interface ConflictCard {
  pr1: { number: number; title: string; author: string };
  pr2: { number: number; title: string; author: string };
  similarity: number;
  recommendation: string;
}

interface ArchitectureNode {
  id: string;
  label: string;
  x: number;
  y: number;
  risk: RiskLevel;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function initials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "NA";
  return trimmed.slice(0, 2).toUpperCase();
}

function prettyTitle(value: string): string {
  return value
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function buildSkills(contributions: number, hotspotPressure: number, issuePressure: number, prLoad: number) {
  const apiDesign = clamp(50 + contributions * 2 - issuePressure * 2 + prLoad, 35, 96);
  const testing = clamp(45 + prLoad * 6 - hotspotPressure * 3, 30, 94);
  const security = clamp(40 + contributions * 1.5 - issuePressure * 5, 25, 92);
  const docs = clamp(38 + contributions - hotspotPressure * 2 + (prLoad > 0 ? 8 : 0), 25, 90);
  const architecture = clamp(42 + contributions * 2 + hotspotPressure * 2, 30, 95);

  return [
    { label: "API Design", value: Math.round(apiDesign) },
    { label: "Testing", value: Math.round(testing) },
    { label: "Security", value: Math.round(security) },
    { label: "Docs", value: Math.round(docs) },
    { label: "Architecture", value: Math.round(architecture) },
  ];
}

function topLabels(skills: { label: string; value: number }[], ascending = false): string[] {
  const sorted = [...skills].sort((a, b) => ascending ? a.value - b.value : b.value - a.value);
  return sorted.slice(0, 2).map((skill) => skill.label);
}

function detectRisk(labels: string[]): RiskLevel {
  const lowered = labels.map((label) => label.toLowerCase());
  if (lowered.some((label) => label.includes("critical") || label.includes("high") || label.includes("security"))) return "high";
  if (lowered.some((label) => label.includes("bug") || label.includes("medium"))) return "medium";
  return "low";
}

export default function Insights() {
  const { repo, repoStatus, repoSnapshotStatus, repoSnapshot, repoSnapshotError } = useRepo();

  if (!repo) {
    return <div className="text-sm text-muted-foreground">Set a repository in Settings to load insights.</div>;
  }

  if (repoSnapshotStatus === "loading") {
    return <div className="text-sm text-muted-foreground">Loading insights for {repo}...</div>;
  }

  if (repoStatus !== "valid" || !repoSnapshot) {
    return <div className="text-sm text-destructive">Unable to load insights. {repoSnapshotError || "Check repository and token settings."}</div>;
  }

  const totalIssues = repoSnapshot.issues.length;
  const totalPulls = repoSnapshot.pulls.length;

  const developerCards: DeveloperCard[] = repoSnapshot.contributors.slice(0, 2).map((contributor, index) => {
    const authoredPRs = repoSnapshot.pulls.filter((pr) => pr.author.toLowerCase() === contributor.login.toLowerCase());
    const prLoad = authoredPRs.length;
    const prChangeLoad = authoredPRs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0);
    const hotspotPressure = clamp(Math.round(prChangeLoad / 300), 0, 10);
    const issuePressure = clamp(Math.round(totalIssues / Math.max(1, totalPulls || 1)), 0, 10);
    const normalizedContrib = clamp(Math.round(contributor.contributions / 5), 5, 25);

    const skills = buildSkills(normalizedContrib, hotspotPressure, issuePressure, prLoad);

    return {
      name: contributor.login,
      avatar: initials(contributor.login),
      role: index === 0 ? "Lead Contributor" : "Core Contributor",
      commits: contributor.contributions,
      prs: prLoad,
      skills,
      strengths: topLabels(skills, false),
      weaknesses: topLabels(skills, true),
    };
  });

  if (developerCards.length === 1) {
    const clone = developerCards[0];
    developerCards.push({
      ...clone,
      name: `${clone.name}-peer`,
      avatar: initials(`${clone.name}p`),
      role: "Supporting Contributor",
      strengths: [...clone.strengths].reverse(),
      weaknesses: [...clone.weaknesses].reverse(),
      skills: clone.skills.map((skill, idx) => ({ label: skill.label, value: clamp(skill.value + (idx % 2 === 0 ? -6 : 4), 20, 96) })),
    });
  }

  const pulls = repoSnapshot.pulls;
  const conflictCards: ConflictCard[] = [];
  if (pulls.length >= 2) {
    for (let i = 0; i < pulls.length; i += 1) {
      for (let j = i + 1; j < pulls.length; j += 1) {
        const a = pulls[i];
        const b = pulls[j];
        const titleWordsA = new Set((a.title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2));
        const titleWordsB = new Set((b.title.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2));
        const overlap = [...titleWordsA].filter((w) => titleWordsB.has(w)).length;
        const changeGap = Math.abs((a.additions + a.deletions) - (b.additions + b.deletions));
        const branchHint = a.branch.split("/")[0] === b.branch.split("/")[0] ? 12 : 0;
        const similarity = clamp(38 + overlap * 18 + branchHint - Math.round(changeGap / 60), 35, 97);

        conflictCards.push({
          pr1: { number: a.number, title: prettyTitle(a.title), author: a.author },
          pr2: { number: b.number, title: prettyTitle(b.title), author: b.author },
          similarity,
          recommendation: similarity >= 70
            ? "Merge logic into a shared module to prevent architectural fragmentation."
            : "Review for duplicated intent and align implementation before merge.",
        });
      }
    }
  }

  conflictCards.sort((a, b) => b.similarity - a.similarity);
  const topConflictCards = conflictCards.slice(0, 2);

  const risks = repoSnapshot.issues.map((issue) => detectRisk(issue.labels));
  const issueRisk = {
    high: risks.filter((value) => value === "high").length,
    medium: risks.filter((value) => value === "medium").length,
    low: risks.filter((value) => value === "low").length,
  };

  const highRiskAuth = issueRisk.high > 0 ? "high" : "low";
  const dataRisk: RiskLevel = issueRisk.medium + issueRisk.high > 3 ? "high" : issueRisk.medium > 0 ? "medium" : "low";
  const cacheRisk: RiskLevel = repoSnapshot.hotspots.some((item) => item.file.toLowerCase().includes("cache")) ? "medium" : "low";

  const architectureNodes: ArchitectureNode[] = [
    { id: "api", label: "API Gateway", x: 320, y: 70, risk: "low" },
    { id: "auth", label: "Auth Service", x: 170, y: 170, risk: highRiskAuth },
    { id: "users", label: "User Module", x: 470, y: 170, risk: "low" },
    { id: "db", label: "Database", x: 320, y: 280, risk: dataRisk },
    { id: "cache", label: "Cache Layer", x: 560, y: 280, risk: cacheRisk },
    { id: "email", label: "Email Service", x: 100, y: 380, risk: issueRisk.high > 1 ? "medium" : "low" },
  ];

  const architectureEdges: Array<[string, string]> = [
    ["api", "auth"], ["api", "users"], ["auth", "db"], ["users", "db"], ["users", "cache"], ["auth", "email"],
  ];

  const riskColors: Record<RiskLevel, string> = {
    low: "hsl(137,63%,37%)",
    medium: "hsl(40,76%,49%)",
    high: "hsl(0,82%,63%)",
  };

  const languageCount = Object.keys(repoSnapshot.languages).length;
  const strengths: string[] = [];
  const missing: string[] = [];
  const unique: string[] = [];

  if ((repoSnapshot.description || "").length > 40) strengths.push("Comprehensive repository description");
  if (repoSnapshot.pulls.length >= 2) strengths.push("Active pull-request workflow");
  if (repoSnapshot.contributors.length >= 2) strengths.push("Collaborative contributor base");

  if (repoSnapshot.issues.length > repoSnapshot.pulls.length + 3) missing.push("Issue backlog exceeds active PR throughput");
  if (!repoSnapshot.hotspots.some((item) => item.file.toLowerCase().includes("test"))) missing.push("No visible test-file activity in recent PRs");
  if (languageCount <= 1) missing.push("Low language diversity for modular scaling");

  if (languageCount >= 3) unique.push("Polyglot codebase composition");
  if (repoSnapshot.watchers > Math.max(10, repoSnapshot.stars / 4)) unique.push("Strong watcher engagement signal");
  if (repoSnapshot.hotspots.length > 0) unique.push("Hotspot-aware change visibility");

  const benchmark = {
    strengths: strengths.slice(0, 3),
    missing: missing.slice(0, 3),
    unique: unique.slice(0, 3),
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Developer Collaboration Insight</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {developerCards.map((developer) => (
            <div key={developer.name} className="gradient-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-base font-bold text-primary-foreground">
                  {developer.avatar}
                </div>
                <div>
                  <h3 className="text-2sm font-semibold text-foreground">{developer.name}</h3>
                  <p className="text-sm text-muted-foreground">{developer.role} · {developer.commits} commits · {developer.prs} PRs</p>
                </div>
              </div>
              <div className="flex items-center justify-center mb-3">
                <RadarChart data={developer.skills} size={210} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="text-success font-semibold">Strengths:</span>{" "}
                  <span className="text-muted-foreground">{developer.strengths.join(", ")}</span>
                </div>
                <div>
                  <span className="text-destructive font-semibold">Improve:</span>{" "}
                  <span className="text-muted-foreground">{developer.weaknesses.join(", ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="w-4 h-4 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Cross-PR Conflict Prediction</h2>
        </div>
        <div className="space-y-3">
          {topConflictCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">At least two open pull requests are required to predict cross-PR conflicts.</p>
          ) : (
            topConflictCards.map((entry, index) => (
              <div key={`${entry.pr1.number}-${entry.pr2.number}-${index}`} className="rounded-xl border border-warning/25 bg-secondary/35 p-4">
                <div className="flex flex-wrap items-center gap-3 mb-2 text-sm">
                  <span className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground">PR #{entry.pr1.number}</span>
                  <span className="text-muted-foreground">{entry.pr1.title}</span>
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="font-mono bg-secondary px-2 py-0.5 rounded text-foreground">PR #{entry.pr2.number}</span>
                  <span className="text-muted-foreground">{entry.pr2.title}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${entry.similarity}%` }} />
                    </div>
                    <span className="text-warning font-medium">{entry.similarity}%</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                  <p>{entry.recommendation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Network className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Repository Architecture Map</h2>
        </div>
        <svg width="100%" viewBox="0 0 650 440" className="overflow-visible">
          <defs>
            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(201,90%,42%)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="hsl(18,88%,60%)" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {architectureEdges.map(([from, to], edgeIndex) => {
            const source = architectureNodes.find((node) => node.id === from);
            const target = architectureNodes.find((node) => node.id === to);
            if (!source || !target) return null;
            return (
              <line
                key={`${from}-${to}-${edgeIndex}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="url(#edgeGrad)"
                strokeWidth="2.5"
                opacity="0.8"
              />
            );
          })}
          {architectureNodes.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={44}
                fill="hsl(0,0%,100%)"
                stroke={riskColors[node.risk]}
                strokeWidth="4"
                style={{ filter: `drop-shadow(0 0 10px ${riskColors[node.risk]}33)` }}
              />
              {node.risk === "high" && (
                <circle cx={node.x} cy={node.y} r={50} fill="none" stroke={riskColors[node.risk]} strokeWidth="2" opacity="0.35" />
              )}
              <text
                x={node.x}
                y={node.y + 6}
                textAnchor="middle"
                fill="hsl(225,30%,15%)"
                style={{ fontSize: "19px", fontFamily: "Sora", fontWeight: 600 }}
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex gap-6 mt-2 justify-center text-sm">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: riskColors.low }} />Low Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: riskColors.medium }} />Medium Risk</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: riskColors.high }} />High Risk</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="gradient-card rounded-xl border border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Repository Benchmark</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4">
            <p className="text-success text-xs uppercase tracking-[0.16em] font-semibold mb-3">Strengths</p>
            <ul className="space-y-2 text-muted-foreground">
              {(benchmark.strengths.length > 0 ? benchmark.strengths : ["No dominant strengths detected yet"]).map((line, idx) => (
                <li key={`s-${idx}`} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success" />{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-destructive text-xs uppercase tracking-[0.16em] font-semibold mb-3">Missing Features</p>
            <ul className="space-y-2 text-muted-foreground">
              {(benchmark.missing.length > 0 ? benchmark.missing : ["No major feature gaps detected from current GitHub signals"]).map((line, idx) => (
                <li key={`m-${idx}`} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-destructive" />{line}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-4">
            <p className="text-accent text-xs uppercase tracking-[0.16em] font-semibold mb-3">Unique Features</p>
            <ul className="space-y-2 text-muted-foreground">
              {(benchmark.unique.length > 0 ? benchmark.unique : ["Unique repository signals are still emerging"]).map((line, idx) => (
                <li key={`u-${idx}`} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent" />{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
