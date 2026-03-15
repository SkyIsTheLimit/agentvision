import type { AgentDefinition, McpServerEntry } from "./types.js";

function extractMcpServers(configPath: string, parsedContent: unknown): McpServerEntry[] {
  if (!parsedContent || typeof parsedContent !== "object") return [];
  const obj = parsedContent as Record<string, unknown>;
  const mcpServers = obj["mcpServers"];
  if (!mcpServers || typeof mcpServers !== "object") return [];

  const entries: McpServerEntry[] = [];
  for (const [name, server] of Object.entries(mcpServers as Record<string, unknown>)) {
    if (!server || typeof server !== "object") continue;
    const s = server as Record<string, unknown>;
    if (typeof s["url"] === "string") {
      entries.push({
        name,
        transport: "streamable-http",
        url: s["url"],
        source: configPath,
      });
    } else if (typeof s["command"] === "string") {
      entries.push({
        name,
        transport: "stdio",
        command: s["command"],
        args: Array.isArray(s["args"]) ? (s["args"] as string[]) : undefined,
        env: s["env"] && typeof s["env"] === "object" ? (s["env"] as Record<string, string>) : undefined,
        source: configPath,
      });
    }
  }
  return entries;
}

export const claudeCode: AgentDefinition = {
  id: "claude-code",
  name: "Claude Code",
  description: "Anthropic's official CLI for Claude — agentic coding assistant",
  docsUrl: "https://docs.anthropic.com/en/docs/claude-code/overview",
  configs: [
    {
      label: "Project instructions",
      category: "instructions",
      paths: ["CLAUDE.md", ".claude/CLAUDE.md"],
      globalPaths: ["CLAUDE.md"],
      multi: true,
      format: "markdown",
      description: "Markdown instructions included in every Claude Code prompt for this project",
    },
    {
      label: "Project settings",
      category: "settings",
      paths: [".claude/settings.json"],
      globalPaths: ["settings.json"],
      multi: false,
      format: "jsonc",
      description: "Project-level Claude Code settings (permissions, tools, etc.)",
    },
    {
      label: "Local settings",
      category: "settings",
      paths: [".claude/settings.local.json"],
      multi: false,
      format: "jsonc",
      description: "Local overrides for Claude Code settings (not committed to git)",
    },
    {
      label: "MCP servers",
      category: "mcp-servers",
      paths: [".mcp.json"],
      globalPaths: [".mcp.json"],
      multi: false,
      format: "json",
      description: "MCP (Model Context Protocol) server definitions for this project",
    },
    {
      label: "Commands",
      category: "skills",
      paths: [".claude/commands/*.md"],
      globalPaths: ["commands/*.md"],
      multi: true,
      format: "markdown",
      description: "Custom slash commands available in Claude Code",
    },
    {
      label: "Sub-agents",
      category: "context",
      paths: [".claude/agents/*.md", ".claude/agents/*.yaml"],
      globalPaths: ["agents/*.md", "agents/*.yaml"],
      multi: true,
      format: "markdown",
      description: "Sub-agent definitions for orchestrated tasks",
    },
    {
      label: "Skills",
      category: "context",
      paths: [".claude/skills/*.md"],
      globalPaths: ["skills/*.md"],
      multi: true,
      format: "markdown",
      description: "Reusable skill definitions for Claude Code",
    },
    {
      label: "Rules",
      category: "rules",
      paths: [".claude/rules/*.md"],
      globalPaths: ["rules/*.md"],
      multi: true,
      format: "markdown",
      description: "Coding rules and conventions enforced by Claude Code",
    },
  ],
  extractMcpServers,
};
