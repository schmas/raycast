import { minimatch } from "minimatch";
import * as os from "os";
import { PathItem } from "./use-paths";
import { AppConfig } from "./use-apps";

const GLOB_CHARS = /[*?[\]{}]/;

export type ResolvedSource = "explicit" | "rule" | "none";

export interface ResolvedDefault {
  appId: string | null;
  source: ResolvedSource;
  matchedRule: PathItem | null;
}

function expandTilde(p: string): string {
  return p.replace(/^~/, os.homedir());
}

interface RuleMatch {
  rule: PathItem;
  matchedLength: number;
  ruleIndex: number;
}

export function resolveDefaultApp(
  folderPath: string,
  paths: PathItem[],
  apps: AppConfig[],
  explicitDefaultId: string | null,
): ResolvedDefault {
  // 1. Explicit folder default always short-circuits rule evaluation. If the
  //    referenced app is missing (deleted), fall through to "none" — matching
  //    today's behavior where a stale explicit default produces no default tag
  //    and the first configured app serves as the Enter action. We intentionally
  //    do NOT let a rule apply on top of a stale explicit default.
  if (explicitDefaultId) {
    if (apps.some((a) => a.id === explicitDefaultId)) {
      return { appId: explicitDefaultId, source: "explicit", matchedRule: null };
    }
    return { appId: null, source: "none", matchedRule: null };
  }

  // 2. Evaluate path rules.
  const folderAbs = expandTilde(folderPath);
  const matches: RuleMatch[] = [];

  paths.forEach((rule, idx) => {
    if (!rule.defaultAppId) return;
    if (!apps.some((a) => a.id === rule.defaultAppId)) return; // referenced app deleted
    const ruleAbs = expandTilde(rule.path);
    const hasGlob = GLOB_CHARS.test(ruleAbs);

    if (!hasGlob) {
      if (folderAbs === ruleAbs || folderAbs.startsWith(ruleAbs + "/")) {
        matches.push({ rule, matchedLength: ruleAbs.length, ruleIndex: idx });
      }
      return;
    }

    // Glob: walk up from the folder, checking each ancestor against the pattern.
    // The deepest matching ancestor determines matchedLength.
    let p = folderAbs;
    while (p && p !== "/") {
      if (minimatch(p, ruleAbs)) {
        matches.push({ rule, matchedLength: p.length, ruleIndex: idx });
        break;
      }
      const slash = p.lastIndexOf("/");
      if (slash <= 0) break;
      p = p.slice(0, slash);
    }
  });

  if (matches.length === 0) {
    return { appId: null, source: "none", matchedRule: null };
  }

  // Largest matched length wins. Ties: earliest rule index.
  matches.sort((a, b) => b.matchedLength - a.matchedLength || a.ruleIndex - b.ruleIndex);
  const winner = matches[0];
  return { appId: winner.rule.defaultAppId ?? null, source: "rule", matchedRule: winner.rule };
}
