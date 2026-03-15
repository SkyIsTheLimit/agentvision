import { describe, it, expect } from "vitest";
import { compare } from "./comparator.js";
import type { AgentScanResult } from "../types.js";
import type { AgentDefinition } from "../agents/types.js";

function makeAgent(id: string, name: string): AgentDefinition {
  return { id, name, description: "", docsUrl: "https://example.com", configs: [] };
}

function makeResult(
  agent: AgentDefinition,
  opts: { detected?: boolean; hasMcp?: boolean; hasInstructions?: boolean; emptyInstructions?: boolean } = {},
): AgentScanResult {
  const { detected = true, hasMcp = false, hasInstructions = false, emptyInstructions = false } = opts;
  return {
    agent,
    detected,
    configs: hasInstructions || emptyInstructions
      ? [{
          location: { label: "instructions", category: "instructions", paths: [], multi: false, format: "markdown", description: "" },
          files: [{
            absolutePath: "/test/CLAUDE.md",
            relativePath: "./CLAUDE.md",
            scope: "project",
            size: emptyInstructions ? 0 : 100,
            gitignored: false,
            status: emptyInstructions ? "empty" : "valid",
          }],
        }]
      : [],
    mcpServers: hasMcp
      ? [{ name: "test", transport: "stdio", command: "node", source: "/test/.mcp.json" }]
      : [],
    warnings: [],
  };
}

describe("compare", () => {
  it("returns empty result with fewer than 2 detected agents", () => {
    const result = compare([makeResult(makeAgent("a", "A"), { detected: false })]);
    expect(result.gaps).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("detects MCP gap when one agent has MCP and another does not", () => {
    const a = makeResult(makeAgent("claude-code", "Claude Code"), { hasMcp: true });
    const b = makeResult(makeAgent("cursor", "Cursor"), { hasMcp: false });
    const result = compare([a, b]);
    const mcpGap = result.gaps.find((g) => g.category === "mcp-servers");
    expect(mcpGap).toBeDefined();
    expect(mcpGap!.presentIn).toContain("claude-code");
    expect(mcpGap!.missingFrom).toContain("cursor");
  });

  it("detects instructions gap", () => {
    const a = makeResult(makeAgent("claude-code", "Claude Code"), { hasInstructions: true });
    const b = makeResult(makeAgent("cursor", "Cursor"), { hasInstructions: false });
    const result = compare([a, b]);
    const instrGap = result.gaps.find((g) => g.category === "instructions" && g.missingFrom.length > 0);
    expect(instrGap).toBeDefined();
    expect(instrGap!.presentIn).toContain("claude-code");
  });

  it("detects empty instruction files", () => {
    const a = makeResult(makeAgent("claude-code", "Claude Code"), { emptyInstructions: true });
    const b = makeResult(makeAgent("cursor", "Cursor"), { hasInstructions: true });
    const result = compare([a, b]);
    const emptyGap = result.gaps.find((g) => g.description.includes("Empty"));
    expect(emptyGap).toBeDefined();
    expect(emptyGap!.presentIn).toContain("claude-code");
  });

  it("reports no gaps when agents are symmetric", () => {
    const a = makeResult(makeAgent("a", "A"), { hasMcp: true, hasInstructions: true });
    const b = makeResult(makeAgent("b", "B"), { hasMcp: true, hasInstructions: true });
    const result = compare([a, b]);
    expect(result.gaps).toHaveLength(0);
  });
});
