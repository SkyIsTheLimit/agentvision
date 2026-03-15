import { describe, it, expect } from "vitest";
import { resolve } from "path";
import { scan } from "./scanner.js";

const fixturesDir = resolve(import.meta.dirname, "../__fixtures__");

describe("scan", () => {
  it("detects Claude Code config in test-project-1", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-1"), {
      agents: ["claude-code"],
      scope: "project-only",
    });
    const claude = result.agents.find((a) => a.agent.id === "claude-code");
    expect(claude).toBeDefined();
    expect(claude!.detected).toBe(true);
  });

  it("extracts MCP servers from test-project-1", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-1"), {
      agents: ["claude-code"],
      scope: "project-only",
    });
    const claude = result.agents.find((a) => a.agent.id === "claude-code")!;
    expect(claude.mcpServers.length).toBeGreaterThanOrEqual(1);
    const fs = claude.mcpServers.find((m) => m.name === "filesystem");
    expect(fs).toBeDefined();
    expect(fs!.transport).toBe("stdio");
    expect(fs!.command).toBe("npx");
  });

  it("detects Cursor config in test-project-2", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-2"), {
      agents: ["cursor"],
      scope: "project-only",
    });
    const cursor = result.agents.find((a) => a.agent.id === "cursor");
    expect(cursor).toBeDefined();
    expect(cursor!.detected).toBe(true);
  });

  it("detects multiple agents in test-project-3-multi", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-3-multi"), {
      agents: ["claude-code", "cursor"],
      scope: "project-only",
    });
    const detected = result.agents.filter((a) => a.detected);
    expect(detected.length).toBe(2);
  });

  it("handles broken JSON in test-project-4-broken", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-4-broken"), {
      agents: ["claude-code"],
      scope: "project-only",
    });
    const claude = result.agents.find((a) => a.agent.id === "claude-code")!;
    const mcpConfig = claude.configs.find((c) => c.location.category === "mcp-servers");
    const brokenFile = mcpConfig?.files.find((f) => f.status === "parse-error");
    expect(brokenFile).toBeDefined();
  });

  it("detects empty files in test-project-4-broken", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-4-broken"), {
      agents: ["claude-code"],
      scope: "project-only",
    });
    const claude = result.agents.find((a) => a.agent.id === "claude-code")!;
    const instructionsConfig = claude.configs.find((c) => c.location.category === "instructions");
    const emptyFile = instructionsConfig?.files.find((f) => f.status === "empty");
    expect(emptyFile).toBeDefined();
  });

  it("returns project name and path", async () => {
    const projectPath = resolve(fixturesDir, "test-project-1");
    const result = await scan(projectPath, { scope: "project-only" });
    expect(result.projectPath).toBe(projectPath);
    expect(result.projectName).toBeTruthy();
    expect(result.scannedAt).toBeTruthy();
  });

  it("returns no detection for empty project", async () => {
    const result = await scan(resolve(fixturesDir, "test-project-1"), {
      agents: ["codex"],
      scope: "project-only",
    });
    const codex = result.agents.find((a) => a.agent.id === "codex");
    expect(codex).toBeDefined();
    expect(codex!.detected).toBe(false);
  });
});
