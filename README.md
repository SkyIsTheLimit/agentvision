# AgentVision

See exactly what your AI coding agents can see.

AgentVision scans your project and shows you every configuration file, MCP server, instruction, rule, and setting that your AI coding agents read — across **Claude Code**, **Cursor**, **OpenAI Codex**, **Gemini CLI**, and **GitHub Copilot**.

## Why

Agent configuration is scattered, implicit, and invisible. A typical project might have `CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `.mcp.json`, `.gemini/settings.json`, and `.github/copilot-instructions.md` — all doing roughly the same thing for different agents, with no easy way to see the full picture.

AgentVision gives you that picture.

## How to Run

```bash
npx @agentvision/cli
```

Requires Node.js 20+.

## Quick Start

```bash
# Scan the current project (includes both project and global configs)
agentvision

# Scan a specific directory
agentvision scan ~/projects/my-app

# Only project-level configs (no global)
agentvision scan --local-only

# Only global/user-level configs
agentvision scan --global-only
```

Example output:

```
📁 ~/projects/my-app

  Claude Code ✓
    Project instructions:  ./CLAUDE.md (2.1kb)
    MCP servers:           ./.mcp.json (480b)
    MCP Servers:
      · filesystem (stdio: npx) ✓

  Cursor ✓
    Rules (legacy):  ./.cursorrules (1.8kb)
    Rules:           ./.cursor/rules/ (2 files)

  GitHub Copilot ✓
    Repository instructions:  ./.github/copilot-instructions.md (340b)

  Not detected: OpenAI Codex, Gemini CLI

  ⚠ Warnings (1)
    ⓘ MCP servers configured for claude-code but not for cursor
```

## Commands

| Command                              | Description                                      |
| ------------------------------------ | ------------------------------------------------ |
| `agentvision [scan] [path]`          | Scan a project for all agent configs (default)   |
| `agentvision inspect <agent> [path]` | Deep-dive into a single agent's config           |
| `agentvision compare [path]`         | Side-by-side comparison across agents            |
| `agentvision doctor [path]`          | Validate configs with fix suggestions            |
| `agentvision list-agents`            | List all supported agents and their config paths |

## Flags

| Flag              | Description                              |
| ----------------- | ---------------------------------------- |
| `--json`          | Output as JSON (for scripting)           |
| `--agent <id>`    | Filter scan to a single agent            |
| `--local-only`    | Only scan project-level config files     |
| `--global-only`   | Only scan global/user-level config files |
| `--no-color`      | Disable colored output                   |
| `--verbose`, `-v` | Show file content previews               |

## Supported Agents

| Agent          | ID               | Instructions                      | Settings                | MCP Servers        | Rules                                 |
| -------------- | ---------------- | --------------------------------- | ----------------------- | ------------------ | ------------------------------------- |
| Claude Code    | `claude-code`    | `CLAUDE.md`                       | `.claude/settings.json` | `.mcp.json`        | `.claude/rules/*.md`                  |
| Cursor         | `cursor`         | —                                 | —                       | `.cursor/mcp.json` | `.cursorrules`, `.cursor/rules/*.mdc` |
| OpenAI Codex   | `codex`          | `AGENTS.md`                       | `.codex/config.toml`    | —                  | —                                     |
| Gemini CLI     | `gemini-cli`     | `GEMINI.md`                       | `.gemini/settings.json` | via settings       | —                                     |
| GitHub Copilot | `github-copilot` | `.github/copilot-instructions.md` | —                       | —                  | —                                     |

Run `agentvision list-agents` for the full reference.

## Project Structure

```
packages/
  core/    @agentvision/core — scanning, parsing, validation, comparison logic
  cli/     @agentvision/cli  — CLI commands, renderers, arg parsing
  studio/  @agentvision/studio — web UI (coming soon)
```

## Development

```bash
# Install dependencies
pnpm install

# Build everything
pnpm build

# Run from source
node packages/cli/dist/bin.js scan .

# Type check
pnpm typecheck
```
