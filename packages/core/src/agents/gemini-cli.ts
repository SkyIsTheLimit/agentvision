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
    const url = s["url"] ?? s["httpUrl"];
    if (typeof url === "string") {
      entries.push({
        name,
        transport: "streamable-http",
        url,
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

export const geminiCli: AgentDefinition = {
  id: "gemini-cli",
  name: "Gemini CLI",
  description: "Google's open-source AI agent for the terminal",
  docsUrl: "https://github.com/google-gemini/gemini-cli",
  configs: [
    {
      label: "Project instructions",
      category: "instructions",
      paths: ["GEMINI.md", "AGENT.md"],
      globalPaths: ["GEMINI.md"],
      multi: true,
      format: "markdown",
      description: "Markdown instructions loaded by Gemini CLI for every session",
    },
    {
      label: "Settings",
      category: "settings",
      paths: [".gemini/settings.json"],
      globalPaths: [".gemini/settings.json"],
      multi: false,
      format: "json",
      description: "Gemini CLI settings including MCP server definitions",
    },
  ],
  extractMcpServers,
};
