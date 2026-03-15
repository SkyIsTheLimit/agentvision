# AgentVision

A CLI tool that scans projects and reports what AI coding agents can see — their config files, MCP servers, instructions, rules, and settings.

## Architecture

pnpm monorepo with three packages:

- **`packages/core`** (`@agentvision/core`) — Pure logic. Agent definitions, scanner, file reader, validator, comparator. Built with `tsc`. No CLI or rendering code here.
- **`packages/cli`** (`@agentvision/cli`) — The published npm package. Hand-rolled arg parser, commands, TUI renderers. Built with `tsup`, bundles core via `noExternal`.
- **`packages/studio`** — Web UI placeholder. Not implemented.

## Key Concepts

**AgentDefinition** (`packages/core/src/agents/types.ts`) — Describes one AI agent's config surface: its name, ID, config file locations (paths + globs), and an optional `extractMcpServers` function.

**ConfigLocation** — A single config an agent reads. Has `paths` (project-scoped), optional `globalPaths` (resolved from `~`), a `format` (json/jsonc/yaml/toml/markdown/text), and a `category` (instructions/mcp-servers/settings/skills/rules/context).

**Scanner** (`packages/core/src/scanner/scanner.ts`) — The `scan()` function iterates all agents, expands their config paths via `fast-glob`, reads each file through the file reader, extracts MCP servers, and returns a `ScanResult`.

**ScanOptions.scope** — `"all"` (default, both project + global), `"project-only"`, or `"global-only"`.

## Agent Definitions

One file per agent in `packages/core/src/agents/`:

| File | Agent | Has MCP extraction |
|------|-------|--------------------|
| `claude-code.ts` | Claude Code | Yes — `.mcp.json` and `.claude/settings.json` |
| `cursor.ts` | Cursor | Yes — `.cursor/mcp.json` |
| `codex.ts` | OpenAI Codex | No |
| `gemini-cli.ts` | Gemini CLI | Yes — `.gemini/settings.json` |
| `github-copilot.ts` | GitHub Copilot | No |

All registered in `packages/core/src/agents/index.ts`. To add a new agent: create a new file exporting an `AgentDefinition`, import it in `index.ts`, add to the `agents` array.

## CLI Commands

Defined in `packages/cli/src/commands/`. Each command calls core functions and passes results to a renderer.

| Command | Core function | Renderer |
|---------|--------------|----------|
| `scan` (default) | `scan()` | `tree.ts` |
| `inspect <agent>` | `scan()` with agent filter | `detail.ts` |
| `compare` | `scan()` + `compare()` | `table.ts` |
| `doctor` | `scan()` + `validate()` | inline in command |
| `list-agents` | reads `agents` array directly | inline in command |

All commands support `--json` which uses `renderers/json.ts` instead.

## File Reader

`packages/core/src/scanner/file-reader.ts` handles:
- Format-specific parsing: JSON, JSONC (`jsonc-parser`), YAML (`yaml`), TOML (`smol-toml`), markdown/text (raw string)
- Glob expansion via `fast-glob`
- Git-ignore checking via `git check-ignore`

## Types

All in `packages/core/src/types.ts`. Do not modify the type interfaces without updating all consumers. Key types: `ScanResult`, `AgentScanResult`, `ConfigFileResult`, `DiscoveredFile`, `Warning`, `ComparisonResult`, `DoctorResult`.

## Build

```bash
pnpm build          # builds core (tsc) then cli (tsup)
pnpm typecheck      # type-check all packages
```

The CLI's `tsup.config.ts` bundles `@agentvision/core` into the output and injects a `createRequire` shim so CJS deps like `fast-glob` work in the ESM bundle.

## Dependencies

Core: `fast-glob`, `jsonc-parser`, `yaml`, `smol-toml`
CLI: `picocolors` (colors), `tsup` (build)

No heavy frameworks. Arg parsing is hand-rolled in `packages/cli/src/cli.ts`.

## Conventions

- ESM throughout (`"type": "module"`, `.js` extensions in imports)
- Strict TypeScript
- Node 20+ target
- Read-only tool — never writes to the user's filesystem
- Colors respect `--no-color` flag and `NO_COLOR` env var via `packages/cli/src/utils/colors.ts`
