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
        transport: "sse",
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

export const cursor: AgentDefinition = {
  id: "cursor",
  name: "Cursor",
  description: "AI-first code editor with deep model integration",
  docsUrl: "https://docs.cursor.com/context/rules-for-ai",
  configs: [
    {
      label: "Rules (legacy)",
      category: "rules",
      paths: [".cursorrules"],
      multi: false,
      format: "text",
      description: "Legacy Cursor rules file (deprecated in favor of .cursor/rules/)",
    },
    {
      label: "Rules",
      category: "rules",
      paths: [".cursor/rules/*.mdc"],
      multi: true,
      format: "markdown",
      description: "Modern Cursor rule files with frontmatter metadata",
    },
    {
      label: "MCP servers",
      category: "mcp-servers",
      paths: [".cursor/mcp.json"],
      globalPaths: [".cursor/mcp.json"],
      multi: false,
      format: "json",
      description: "MCP server definitions for Cursor",
    },
  ],
  extractMcpServers,
};
