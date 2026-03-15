import type { AgentDefinition } from "./types.js";

export const githubCopilot: AgentDefinition = {
  id: "github-copilot",
  name: "GitHub Copilot",
  description: "GitHub's AI coding assistant integrated into VS Code and other editors",
  docsUrl: "https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot",
  configs: [
    {
      label: "Repository instructions",
      category: "instructions",
      paths: [".github/copilot-instructions.md"],
      multi: false,
      format: "markdown",
      description: "Repository-wide instructions for GitHub Copilot",
    },
    {
      label: "Path-scoped instructions",
      category: "instructions",
      paths: [".github/instructions/*.instructions.md"],
      multi: true,
      format: "markdown",
      description: "Instructions scoped to specific file paths or patterns",
    },
    {
      label: "Agent instructions",
      category: "instructions",
      paths: ["AGENTS.md"],
      multi: false,
      format: "markdown",
      description: "Agent mode instructions for GitHub Copilot",
    },
  ],
};
