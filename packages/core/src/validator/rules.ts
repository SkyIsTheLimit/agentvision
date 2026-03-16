import type { DiscoveredFile, DoctorCheck } from "../types.js";
import type { McpServerEntry } from "../agents/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * A validation rule that inspects a discovered file and returns zero or more checks.
 */
export interface ValidationRule {
  /** Unique rule ID (e.g., "EMPTY_FILE") */
  id: string;

  /** What this rule checks */
  description: string;

  /** Category tag for grouping */
  category: string;

  /** Run the check against a single file. Return checks (empty = nothing to report). */
  check: (file: DiscoveredFile, agentName: string) => DoctorCheck[];
}

/**
 * A validation rule that inspects MCP server entries.
 */
export interface McpValidationRule {
  id: string;
  description: string;
  category: string;
  check: (mcp: McpServerEntry, agentName: string) => Promise<DoctorCheck[]>;
}

// --- File-level rules ---

const emptyFile: ValidationRule = {
  id: "EMPTY_FILE",
  description: "Detects empty config files",
  category: "content",
  check(file, agentName) {
    if (file.status !== "empty") return [];
    return [
      {
        name: `${agentName}: ${file.relativePath}`,
        category: "content",
        status: "fail",
        message: `File is empty: ${file.relativePath}`,
        fix: `Add content to ${file.relativePath} or remove it`,
      },
    ];
  },
};

const parseError: ValidationRule = {
  id: "PARSE_ERROR",
  description: "Detects files that failed to parse",
  category: "syntax",
  check(file, agentName) {
    if (file.status !== "parse-error") return [];
    return [
      {
        name: `${agentName}: ${file.relativePath}`,
        category: "syntax",
        status: "fail",
        message: `Parse error in ${file.relativePath}: ${file.error ?? "unknown error"}`,
        fix: `Fix the syntax error in ${file.relativePath}`,
      },
    ];
  },
};

const invalidFile: ValidationRule = {
  id: "INVALID",
  description: "Detects files with invalid status",
  category: "syntax",
  check(file, agentName) {
    if (file.status !== "invalid") return [];
    return [
      {
        name: `${agentName}: ${file.relativePath}`,
        category: "syntax",
        status: "fail",
        message: `Invalid file ${file.relativePath}: ${file.error ?? "unknown error"}`,
      },
    ];
  },
};

const KNOWN_TYPOS: Record<string, string> = {
  mcpServer: "mcpServers",
  mcp_servers: "mcpServers",
  rule: "rules",
  command: "commands",
  instruction: "instructions",
  setting: "settings",
};

const commonTypo: ValidationRule = {
  id: "COMMON_TYPO",
  description: "Detects common key typos in JSON config files",
  category: "typo",
  check(file, agentName) {
    if (!file.content || typeof file.content !== "object" || Array.isArray(file.content)) return [];
    const obj = file.content as Record<string, unknown>;
    const checks: DoctorCheck[] = [];
    for (const [typo, correct] of Object.entries(KNOWN_TYPOS)) {
      if (typo in obj) {
        checks.push({
          name: `${agentName}: ${file.relativePath} — typo "${typo}"`,
          category: "typo",
          status: "fail",
          message: `Possible typo in ${file.relativePath}: found key "${typo}", did you mean "${correct}"?`,
          fix: `Rename "${typo}" to "${correct}" in ${file.relativePath}`,
        });
      }
    }
    return checks;
  },
};

const wrongLocation: ValidationRule = {
  id: "WRONG_LOCATION",
  description: "Detects config files in incorrect directories",
  category: "location",
  check(file, agentName) {
    if (!file.absolutePath.includes(".cursor/.cursorrules")) return [];
    return [
      {
        name: `${agentName}: ${file.relativePath} — wrong location`,
        category: "location",
        status: "fail",
        message: `.cursorrules should be in the project root, not inside .cursor/`,
        fix: `Move .cursorrules to the project root directory`,
      },
    ];
  },
};

const validFile: ValidationRule = {
  id: "VALID",
  description: "Reports valid files as passing",
  category: "syntax",
  check(file, agentName) {
    if (file.status !== "valid") return [];
    return [
      {
        name: `${agentName}: ${file.relativePath}`,
        category: "syntax",
        status: "pass",
        message: `${file.relativePath} is valid`,
      },
    ];
  },
};

// --- MCP rules ---

async function commandExists(cmd: string): Promise<boolean> {
  const which = process.platform === "win32" ? "where" : "which";
  try {
    await execAsync(`${which} ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

const mcpCommandNotFound: McpValidationRule = {
  id: "MCP_COMMAND_NOT_FOUND",
  description: "Checks that stdio MCP server commands are available on PATH",
  category: "mcp",
  async check(mcp, agentName) {
    if (mcp.transport !== "stdio" || !mcp.command) return [];
    const cmd = mcp.command.split("/").pop() ?? mcp.command;
    const exists = await commandExists(cmd);
    if (!exists) {
      return [
        {
          name: `${agentName}: MCP "${mcp.name}" command not found`,
          category: "mcp",
          status: "fail",
          message: `MCP server "${mcp.name}" uses command "${mcp.command}" which was not found on PATH`,
          fix: `Install "${mcp.command}" or update the MCP server configuration`,
        },
      ];
    }
    return [
      {
        name: `${agentName}: MCP "${mcp.name}" command found`,
        category: "mcp",
        status: "pass",
        message: `MCP server "${mcp.name}" command "${mcp.command}" is available`,
      },
    ];
  },
};

/**
 * All file-level validation rules, applied in order.
 * Rules that match early statuses (empty, parse-error, invalid) should come first,
 * and the validFile rule should come last.
 */
export const fileRules: ValidationRule[] = [
  emptyFile,
  parseError,
  invalidFile,
  commonTypo,
  wrongLocation,
  validFile,
];

/**
 * All MCP validation rules.
 */
export const mcpRules: McpValidationRule[] = [mcpCommandNotFound];
