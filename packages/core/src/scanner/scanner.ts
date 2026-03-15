import { resolve, basename } from "path";
import { homedir } from "os";
import { readFile } from "fs/promises";
import type { ScanResult, AgentScanResult, ConfigFileResult, DiscoveredFile } from "../types.js";
import { agents as allAgents } from "../agents/index.js";
import { compare } from "../comparator/comparator.js";
import { expandPaths, readConfigFile, isGitIgnored, makeRelativePath } from "./file-reader.js";

export interface ScanOptions {
  agents?: string[];
  /** "all" (default) | "project-only" | "global-only" */
  scope?: "all" | "project-only" | "global-only";
  validate?: boolean;
}

async function detectProjectName(projectPath: string): Promise<string> {
  try {
    const pkgJson = await readFile(resolve(projectPath, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgJson) as { name?: string };
    if (pkg.name) return pkg.name;
  } catch {
    // not a Node project or unreadable
  }
  return basename(projectPath);
}

export async function scan(projectPath: string, options?: ScanOptions): Promise<ScanResult> {
  const absPath = resolve(projectPath);
  const projectName = await detectProjectName(absPath);
  const homeDir = homedir();

  const agentsToScan = options?.agents
    ? allAgents.filter((a) => options.agents!.includes(a.id))
    : allAgents;

  const agentResults: AgentScanResult[] = await Promise.all(
    agentsToScan.map(async (agent) => {
      const configs: ConfigFileResult[] = [];
      const mcpServers: ReturnType<NonNullable<typeof agent.extractMcpServers>> = [];

      for (const location of agent.configs) {
        const discoveredFiles: DiscoveredFile[] = [];

        const scope = options?.scope ?? "all";

        // Project-scoped paths
        if (scope !== "global-only") {
          const projectPaths = await expandPaths(location.paths, absPath);
          const pathsToCheck = location.multi ? projectPaths : projectPaths.slice(0, 1);

          for (const filePath of pathsToCheck) {
            const result = await readConfigFile(filePath, location.format);
            if (!result.exists) continue;

            const gitignored = await isGitIgnored(filePath, absPath);
            const relativePath = makeRelativePath(filePath, absPath);

            const file: DiscoveredFile = {
              absolutePath: filePath,
              relativePath,
              scope: "project",
              size: result.size,
              gitignored,
              status: result.status,
              error: result.error,
              content: result.content,
            };
            discoveredFiles.push(file);

            if (agent.extractMcpServers && result.status === "valid" && result.content != null) {
              const extracted = agent.extractMcpServers(filePath, result.content);
              mcpServers.push(...extracted);
            }
          }
        }

        // Global paths
        if (scope !== "project-only" && location.globalPaths) {
          const globalExpanded = await expandPaths(location.globalPaths, homeDir);
          const globalToCheck = location.multi ? globalExpanded : globalExpanded.slice(0, 1);

          for (const filePath of globalToCheck) {
            const result = await readConfigFile(filePath, location.format);
            if (!result.exists) continue;

            const relativePath = makeRelativePath(filePath, homeDir);

            const file: DiscoveredFile = {
              absolutePath: filePath,
              relativePath,
              scope: "global",
              size: result.size,
              gitignored: false,
              status: result.status,
              error: result.error,
              content: result.content,
            };
            discoveredFiles.push(file);

            if (agent.extractMcpServers && result.status === "valid" && result.content != null) {
              const extracted = agent.extractMcpServers(filePath, result.content);
              mcpServers.push(...extracted);
            }
          }
        }

        configs.push({ location, files: discoveredFiles });
      }

      const detected = configs.some((c) => c.files.length > 0);

      return {
        agent,
        detected,
        configs,
        mcpServers,
        warnings: [],
      };
    })
  );

  const detectedAgents = agentResults.filter((r) => r.detected);
  const crossAgentWarnings =
    detectedAgents.length >= 2
      ? compare(agentResults).gaps.map((gap) => ({
          severity: "info" as const,
          code: "CROSS_AGENT_GAP",
          message: gap.description,
        }))
      : [];

  return {
    projectPath: absPath,
    projectName,
    scannedAt: new Date().toISOString(),
    agents: agentResults,
    crossAgentWarnings,
  };
}
