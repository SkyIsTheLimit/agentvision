import type { AgentDefinition, ConfigLocation, McpServerEntry } from "./agents/types.js";

export type { AgentDefinition, ConfigLocation, McpServerEntry };

/**
 * Result of checking a single config location for an agent.
 */
export interface ConfigFileResult {
  /** The config location definition that was checked */
  location: ConfigLocation;

  /** Files that were found (could be 0 for missing configs) */
  files: DiscoveredFile[];
}

/**
 * A single discovered config file.
 */
export interface DiscoveredFile {
  /** Absolute path to the file */
  absolutePath: string;

  /** Path relative to project root */
  relativePath: string;

  /** Whether this is a global (user-level) or project-level config */
  scope: "project" | "global";

  /** File size in bytes */
  size: number;

  /** Whether the file is gitignored */
  gitignored: boolean;

  /** Parse/validation status */
  status: "valid" | "invalid" | "parse-error" | "empty";

  /** If status is not "valid", the error message */
  error?: string;

  /** Parsed content (if applicable and parseable) */
  content?: unknown;
}

/**
 * Full scan result for a single agent in a project.
 */
export interface AgentScanResult {
  /** The agent definition */
  agent: AgentDefinition;

  /** Whether any config was found for this agent */
  detected: boolean;

  /** Results for each config location */
  configs: ConfigFileResult[];

  /** Extracted MCP servers (normalized across config files) */
  mcpServers: McpServerEntry[];

  /** Warnings specific to this agent */
  warnings: Warning[];
}

/**
 * Complete scan result for a project directory.
 */
export interface ScanResult {
  /** Absolute path to the scanned directory */
  projectPath: string;

  /** Project name (from package.json, directory name, etc.) */
  projectName: string;

  /** Timestamp of the scan */
  scannedAt: string;

  /** Per-agent results */
  agents: AgentScanResult[];

  /** Cross-agent warnings (from comparator) */
  crossAgentWarnings: Warning[];
}

/**
 * A warning or issue detected during scanning.
 */
export interface Warning {
  /** Severity level */
  severity: "error" | "warning" | "info";

  /** Warning code for programmatic handling (e.g., "INVALID_JSON", "MCP_UNREACHABLE") */
  code: string;

  /** Human-readable message */
  message: string;

  /** Related file path (if applicable) */
  file?: string;

  /** Related agent ID (if applicable) */
  agentId?: string;

  /** Suggested fix (if applicable) */
  fix?: string;
}

/**
 * Comparison result between agents.
 */
export interface ComparisonResult {
  /** Agents that were compared */
  agents: string[];

  /** Features/configs present in some agents but not others */
  gaps: ComparisonGap[];

  /** Configs that conflict across agents */
  conflicts: ComparisonConflict[];
}

export interface ComparisonGap {
  /** What's missing */
  category: string;

  /** Description of the gap */
  description: string;

  /** Agents that HAVE this config */
  presentIn: string[];

  /** Agents that are MISSING this config */
  missingFrom: string[];
}

export interface ComparisonConflict {
  /** What conflicts */
  category: string;

  /** Description of the conflict */
  description: string;

  /** Per-agent values that conflict */
  values: Record<string, string>;
}

/**
 * Doctor check result.
 */
export interface DoctorResult {
  /** Total checks run */
  totalChecks: number;

  /** Checks that passed */
  passed: number;

  /** Checks that failed */
  failed: number;

  /** Individual check results */
  checks: DoctorCheck[];
}

export interface DoctorCheck {
  /** Check name */
  name: string;

  /** Check category */
  category: string;

  /** Pass/fail */
  status: "pass" | "fail" | "skip";

  /** Detail message */
  message: string;

  /** Fix suggestion if failed */
  fix?: string;
}
