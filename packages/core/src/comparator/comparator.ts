import type { AgentScanResult, ComparisonResult, ComparisonGap } from "../types.js";

export function compare(results: AgentScanResult[]): ComparisonResult {
  const detected = results.filter((r) => r.detected);
  const agentIds = detected.map((r) => r.agent.id);

  if (detected.length < 2) {
    return { agents: agentIds, gaps: [], conflicts: [] };
  }

  const gaps: ComparisonGap[] = [];

  // MCP gap — check which agents have MCP servers configured
  const withMcp = detected.filter((r) => r.mcpServers.length > 0).map((r) => r.agent.id);
  const withoutMcp = detected.filter((r) => r.mcpServers.length === 0).map((r) => r.agent.id);
  if (withMcp.length > 0 && withoutMcp.length > 0) {
    gaps.push({
      category: "mcp-servers",
      description: `MCP servers configured for ${withMcp.join(", ")} but not for ${withoutMcp.join(", ")}`,
      presentIn: withMcp,
      missingFrom: withoutMcp,
    });
  }

  // Instructions gap — check which agents have instructions files
  const withInstructions = detected
    .filter((r) => r.configs.some((c) => c.location.category === "instructions" && c.files.some((f) => f.size > 0)))
    .map((r) => r.agent.id);
  const withoutInstructions = detected
    .filter((r) => !r.configs.some((c) => c.location.category === "instructions" && c.files.some((f) => f.size > 0)))
    .map((r) => r.agent.id);
  if (withInstructions.length > 0 && withoutInstructions.length > 0) {
    gaps.push({
      category: "instructions",
      description: `Instructions found for ${withInstructions.join(", ")} but not for ${withoutInstructions.join(", ")}`,
      presentIn: withInstructions,
      missingFrom: withoutInstructions,
    });
  }

  // Empty vs populated instructions
  const withEmptyInstructions = detected
    .filter((r) =>
      r.configs.some(
        (c) => c.location.category === "instructions" && c.files.some((f) => f.status === "empty")
      )
    )
    .map((r) => r.agent.id);
  if (withEmptyInstructions.length > 0) {
    gaps.push({
      category: "instructions",
      description: `Empty instruction files found for: ${withEmptyInstructions.join(", ")}`,
      presentIn: withEmptyInstructions,
      missingFrom: [],
    });
  }

  return { agents: agentIds, gaps, conflicts: [] };
}
