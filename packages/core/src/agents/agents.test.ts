import { describe, it, expect } from "vitest";
import { agents, getAgent, getAgentIds } from "./index.js";

describe("agent registry", () => {
  it("exports all 5 agents", () => {
    expect(agents).toHaveLength(5);
  });

  it("each agent has required fields", () => {
    for (const agent of agents) {
      expect(agent.id).toBeTruthy();
      expect(agent.name).toBeTruthy();
      expect(agent.description).toBeTruthy();
      expect(agent.docsUrl).toMatch(/^https?:\/\//);
      expect(agent.configs.length).toBeGreaterThan(0);
    }
  });

  it("agent IDs are unique", () => {
    const ids = agents.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAgent returns correct agent by ID", () => {
    const claude = getAgent("claude-code");
    expect(claude).toBeDefined();
    expect(claude!.name).toBe("Claude Code");
  });

  it("getAgent returns undefined for unknown ID", () => {
    expect(getAgent("nonexistent")).toBeUndefined();
  });

  it("getAgentIds returns all IDs", () => {
    const ids = getAgentIds();
    expect(ids).toContain("claude-code");
    expect(ids).toContain("cursor");
    expect(ids).toContain("codex");
    expect(ids).toContain("gemini-cli");
    expect(ids).toContain("github-copilot");
  });

  it("each config location has valid category", () => {
    const validCategories = ["instructions", "mcp-servers", "settings", "skills", "rules", "context"];
    for (const agent of agents) {
      for (const config of agent.configs) {
        expect(validCategories).toContain(config.category);
      }
    }
  });

  it("each config location has valid format", () => {
    const validFormats = ["json", "jsonc", "yaml", "markdown", "toml", "text", "directory"];
    for (const agent of agents) {
      for (const config of agent.configs) {
        expect(validFormats).toContain(config.format);
      }
    }
  });

  it("agents with MCP extraction have extractMcpServers function", () => {
    const withMcp = ["claude-code", "cursor", "gemini-cli"];
    for (const id of withMcp) {
      const agent = getAgent(id);
      expect(agent?.extractMcpServers).toBeTypeOf("function");
    }
  });
});
