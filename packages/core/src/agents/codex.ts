import type { AgentDefinition } from "./types.js";

export const codex: AgentDefinition = {
  id: "codex",
  name: "OpenAI Codex",
  description: "OpenAI's agentic coding CLI powered by codex models",
  docsUrl: "https://github.com/openai/codex",
  configs: [
    {
      label: "Project instructions",
      category: "instructions",
      paths: ["AGENTS.md", "AGENTS.override.md"],
      globalPaths: ["AGENTS.md", "AGENTS.override.md"],
      multi: true,
      format: "markdown",
      description: "Markdown instructions loaded by Codex for every session",
    },
    {
      label: "Config",
      category: "settings",
      paths: [".codex/config.toml"],
      globalPaths: [".codex/config.toml"],
      multi: false,
      format: "toml",
      description: "Codex configuration file (model, approval mode, etc.)",
    },
  ],
};
