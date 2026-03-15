import { exec } from "child_process";
import { promisify } from "util";
import type { AgentScanResult, DoctorResult, DoctorCheck } from "../types.js";

const execAsync = promisify(exec);

async function commandExists(cmd: string): Promise<boolean> {
  const which = process.platform === "win32" ? "where" : "which";
  try {
    await execAsync(`${which} ${cmd}`);
    return true;
  } catch {
    return false;
  }
}

export async function validate(results: AgentScanResult[]): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];

  for (const agentResult of results) {
    if (!agentResult.detected) continue;

    for (const config of agentResult.configs) {
      for (const file of config.files) {
        const agentName = agentResult.agent.name;
        const filePath = file.relativePath;

        // EMPTY_FILE
        if (file.status === "empty") {
          checks.push({
            name: `${agentName}: ${filePath}`,
            category: "content",
            status: "fail",
            message: `File is empty: ${filePath}`,
            fix: `Add content to ${filePath} or remove it`,
          });
          continue;
        }

        // PARSE_ERROR
        if (file.status === "parse-error") {
          checks.push({
            name: `${agentName}: ${filePath}`,
            category: "syntax",
            status: "fail",
            message: `Parse error in ${filePath}: ${file.error ?? "unknown error"}`,
            fix: `Fix the syntax error in ${filePath}`,
          });
          continue;
        }

        if (file.status === "invalid") {
          checks.push({
            name: `${agentName}: ${filePath}`,
            category: "syntax",
            status: "fail",
            message: `Invalid file ${filePath}: ${file.error ?? "unknown error"}`,
          });
          continue;
        }

        // COMMON_TYPO — scan JSON keys
        if (file.content && typeof file.content === "object" && !Array.isArray(file.content)) {
          const obj = file.content as Record<string, unknown>;
          const knownTypos: Record<string, string> = {
            mcpServer: "mcpServers",
            mcp_servers: "mcpServers",
            rule: "rules",
            command: "commands",
            instruction: "instructions",
            setting: "settings",
          };
          for (const [typo, correct] of Object.entries(knownTypos)) {
            if (typo in obj) {
              checks.push({
                name: `${agentName}: ${filePath} — typo "${typo}"`,
                category: "typo",
                status: "fail",
                message: `Possible typo in ${filePath}: found key "${typo}", did you mean "${correct}"?`,
                fix: `Rename "${typo}" to "${correct}" in ${filePath}`,
              });
            }
          }
        }

        // WRONG_LOCATION — .cursorrules inside .cursor/
        if (file.absolutePath.includes(".cursor/.cursorrules")) {
          checks.push({
            name: `${agentName}: ${filePath} — wrong location`,
            category: "location",
            status: "fail",
            message: `.cursorrules should be in the project root, not inside .cursor/`,
            fix: `Move .cursorrules to the project root directory`,
          });
        }

        checks.push({
          name: `${agentName}: ${filePath}`,
          category: "syntax",
          status: "pass",
          message: `${filePath} is valid`,
        });
      }
    }

    // MCP_COMMAND_NOT_FOUND
    for (const mcp of agentResult.mcpServers) {
      if (mcp.transport === "stdio" && mcp.command) {
        const cmd = mcp.command.split("/").pop() ?? mcp.command;
        const exists = await commandExists(cmd);
        if (!exists) {
          checks.push({
            name: `${agentResult.agent.name}: MCP "${mcp.name}" command not found`,
            category: "mcp",
            status: "fail",
            message: `MCP server "${mcp.name}" uses command "${mcp.command}" which was not found on PATH`,
            fix: `Install "${mcp.command}" or update the MCP server configuration`,
          });
        } else {
          checks.push({
            name: `${agentResult.agent.name}: MCP "${mcp.name}" command found`,
            category: "mcp",
            status: "pass",
            message: `MCP server "${mcp.name}" command "${mcp.command}" is available`,
          });
        }
      }
    }
  }

  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;

  return {
    totalChecks: checks.length,
    passed,
    failed,
    checks,
  };
}
