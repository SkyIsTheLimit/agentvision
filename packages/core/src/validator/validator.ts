import type { AgentScanResult, DoctorResult, DoctorCheck } from "../types.js";
import { fileRules, mcpRules } from "./rules.js";

export async function validate(results: AgentScanResult[]): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];

  for (const agentResult of results) {
    if (!agentResult.detected) continue;

    const agentName = agentResult.agent.name;

    for (const config of agentResult.configs) {
      for (const file of config.files) {
        // Run each file rule; stop on the first rule that produces checks
        // for terminal statuses (empty, parse-error, invalid)
        let handled = false;
        for (const rule of fileRules) {
          const ruleChecks = rule.check(file, agentName);
          if (ruleChecks.length > 0) {
            checks.push(...ruleChecks);
            // Terminal status rules should skip further checks for this file
            if (rule.id === "EMPTY_FILE" || rule.id === "PARSE_ERROR" || rule.id === "INVALID") {
              handled = true;
              break;
            }
          }
        }
        if (handled) continue;
      }
    }

    // MCP rules
    for (const mcp of agentResult.mcpServers) {
      for (const rule of mcpRules) {
        const ruleChecks = await rule.check(mcp, agentName);
        checks.push(...ruleChecks);
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
