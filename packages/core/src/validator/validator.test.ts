import { describe, it, expect } from "vitest";
import { validate } from "./validator.js";
import { fileRules, mcpRules } from "./rules.js";
import type { AgentScanResult, DiscoveredFile } from "../types.js";
import type { AgentDefinition } from "../agents/types.js";

const stubAgent: AgentDefinition = {
  id: "test-agent",
  name: "Test Agent",
  description: "A test agent",
  docsUrl: "https://example.com",
  configs: [],
};

function makeFile(overrides: Partial<DiscoveredFile>): DiscoveredFile {
  return {
    absolutePath: "/project/test-file.json",
    relativePath: "./test-file.json",
    scope: "project",
    size: 100,
    gitignored: false,
    status: "valid",
    ...overrides,
  };
}

function makeAgentResult(files: DiscoveredFile[], mcpServers: AgentScanResult["mcpServers"] = []): AgentScanResult {
  return {
    agent: stubAgent,
    detected: true,
    configs: [{ location: { label: "test", category: "settings", paths: [], multi: false, format: "json", description: "test" }, files }],
    mcpServers,
    warnings: [],
  };
}

describe("fileRules", () => {
  it("exports all expected rules", () => {
    const ids = fileRules.map((r) => r.id);
    expect(ids).toContain("EMPTY_FILE");
    expect(ids).toContain("PARSE_ERROR");
    expect(ids).toContain("INVALID");
    expect(ids).toContain("COMMON_TYPO");
    expect(ids).toContain("WRONG_LOCATION");
    expect(ids).toContain("VALID");
  });
});

describe("mcpRules", () => {
  it("exports MCP_COMMAND_NOT_FOUND rule", () => {
    const ids = mcpRules.map((r) => r.id);
    expect(ids).toContain("MCP_COMMAND_NOT_FOUND");
  });
});

describe("validate", () => {
  it("returns empty result for no agents", async () => {
    const result = await validate([]);
    expect(result.totalChecks).toBe(0);
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.checks).toEqual([]);
  });

  it("skips undetected agents", async () => {
    const result = await validate([{ ...makeAgentResult([]), detected: false }]);
    expect(result.totalChecks).toBe(0);
  });

  it("reports empty files", async () => {
    const file = makeFile({ status: "empty", size: 0 });
    const result = await validate([makeAgentResult([file])]);
    expect(result.failed).toBe(1);
    expect(result.checks[0].category).toBe("content");
    expect(result.checks[0].message).toContain("empty");
  });

  it("reports parse errors", async () => {
    const file = makeFile({ status: "parse-error", error: "Unexpected token" });
    const result = await validate([makeAgentResult([file])]);
    expect(result.failed).toBe(1);
    expect(result.checks[0].category).toBe("syntax");
    expect(result.checks[0].message).toContain("Parse error");
  });

  it("reports invalid files", async () => {
    const file = makeFile({ status: "invalid", error: "Not a regular file" });
    const result = await validate([makeAgentResult([file])]);
    expect(result.failed).toBe(1);
    expect(result.checks[0].message).toContain("Invalid");
  });

  it("detects common typos in JSON keys", async () => {
    const file = makeFile({ content: { mcpServer: {}, instruction: "test" } });
    const result = await validate([makeAgentResult([file])]);
    const typoChecks = result.checks.filter((c) => c.category === "typo");
    expect(typoChecks).toHaveLength(2);
    expect(typoChecks[0].message).toContain("mcpServer");
    expect(typoChecks[1].message).toContain("instruction");
  });

  it("detects wrong location for .cursorrules", async () => {
    const file = makeFile({
      absolutePath: "/project/.cursor/.cursorrules",
      relativePath: "./.cursor/.cursorrules",
    });
    const result = await validate([makeAgentResult([file])]);
    const locationChecks = result.checks.filter((c) => c.category === "location");
    expect(locationChecks).toHaveLength(1);
    expect(locationChecks[0].message).toContain("project root");
  });

  it("marks valid files as passing", async () => {
    const file = makeFile({ status: "valid" });
    const result = await validate([makeAgentResult([file])]);
    expect(result.passed).toBeGreaterThanOrEqual(1);
    const passCheck = result.checks.find((c) => c.status === "pass");
    expect(passCheck?.message).toContain("is valid");
  });

  it("checks MCP stdio commands", async () => {
    const mcpServers = [
      { name: "test-mcp", transport: "stdio" as const, command: "node", source: "/project/.mcp.json" },
    ];
    const result = await validate([makeAgentResult([], mcpServers)]);
    // node should be on PATH in test environment
    const mcpCheck = result.checks.find((c) => c.category === "mcp");
    expect(mcpCheck).toBeDefined();
    expect(mcpCheck!.status).toBe("pass");
  });

  it("reports missing MCP commands", async () => {
    const mcpServers = [
      { name: "missing-mcp", transport: "stdio" as const, command: "nonexistent-command-xyz-123", source: "/project/.mcp.json" },
    ];
    const result = await validate([makeAgentResult([], mcpServers)]);
    const mcpCheck = result.checks.find((c) => c.category === "mcp");
    expect(mcpCheck).toBeDefined();
    expect(mcpCheck!.status).toBe("fail");
    expect(mcpCheck!.message).toContain("not found on PATH");
  });
});
