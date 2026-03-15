/**
 * Defines where an agent looks for a specific type of config.
 */
export interface ConfigLocation {
  /** Human-readable label for this config (e.g., "Project instructions", "MCP servers") */
  label: string;

  /** Category of this config */
  category: "instructions" | "mcp-servers" | "settings" | "skills" | "rules" | "context";

  /**
   * Paths to check, relative to project root.
   * Supports globs (e.g., ".cursor/rules/*.mdc").
   * Ordered by priority — first match wins for single-file configs,
   * all matches are collected for multi-file configs.
   */
  paths: string[];

  /**
   * Paths to check at global/user level (resolved from home directory).
   * Same format as `paths` but resolved against `~` instead of project root.
   */
  globalPaths?: string[];

  /** Whether this config can have multiple files (e.g., skill directories) */
  multi: boolean;

  /** Expected file format for validation */
  format: "json" | "jsonc" | "yaml" | "markdown" | "toml" | "text" | "directory";

  /** Optional JSON schema or validation function for deeper validation */
  schema?: object;

  /** Description shown in help/docs */
  description: string;
}

/**
 * Complete definition of an AI coding agent's configuration surface.
 * Adding support for a new agent = creating one of these.
 */
export interface AgentDefinition {
  /** Machine-readable ID (e.g., "claude-code") */
  id: string;

  /** Display name (e.g., "Claude Code") */
  name: string;

  /** Short description of the agent */
  description: string;

  /** URL to official docs about the agent's config */
  docsUrl: string;

  /** All config locations this agent reads from */
  configs: ConfigLocation[];

  /**
   * Optional function to extract MCP server entries from a parsed config file.
   * Different agents store MCP server lists in different formats.
   * Returns a normalized list of MCP server descriptors.
   */
  extractMcpServers?: (configPath: string, parsedContent: unknown) => McpServerEntry[];
}

/**
 * Normalized representation of an MCP server configuration,
 * regardless of which agent defined it.
 */
export interface McpServerEntry {
  /** Server name/identifier */
  name: string;

  /** Transport type */
  transport: "stdio" | "sse" | "streamable-http";

  /** For stdio: the command to run */
  command?: string;

  /** For stdio: command arguments */
  args?: string[];

  /** For sse/http: the URL */
  url?: string;

  /** Environment variables passed to the server */
  env?: Record<string, string>;

  /** Which agent config file this came from */
  source: string;
}
