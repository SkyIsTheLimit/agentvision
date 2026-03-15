export type { AgentDefinition, ConfigLocation, McpServerEntry } from "./types.js";

import { claudeCode } from "./claude-code.js";
import { cursor } from "./cursor.js";
import { codex } from "./codex.js";
import { geminiCli } from "./gemini-cli.js";
import { githubCopilot } from "./github-copilot.js";
import type { AgentDefinition } from "./types.js";

export const agents: AgentDefinition[] = [claudeCode, cursor, codex, geminiCli, githubCopilot];

export function getAgent(id: string): AgentDefinition | undefined {
  return agents.find((a) => a.id === id);
}

export function getAgentIds(): string[] {
  return agents.map((a) => a.id);
}

export { claudeCode, cursor, codex, geminiCli, githubCopilot };
