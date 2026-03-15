import { resolve } from "path";
import { runScan } from "./commands/scan.js";
import { runInspect } from "./commands/inspect.js";
import { runCompare } from "./commands/compare.js";
import { runDoctor } from "./commands/doctor.js";
import { runListAgents } from "./commands/list-agents.js";
import { runStudio } from "./commands/studio.js";

const VERSION = "0.0.1";

const HELP = `
AgentVision — inspect, compare, and validate AI coding agent configurations

Usage:
  agentvision [scan] [path]          Scan a project (default command)
  agentvision inspect <agent> [path] Deep-dive a single agent's config
  agentvision compare [path]         Compare configs across detected agents
  agentvision doctor [path]          Validate configs and show fix suggestions
  agentvision list-agents            List all supported agents
  agentvision studio                 Launch the web UI (coming soon)

Options:
  --json           Output as JSON
  --agent <id>     Filter to a single agent (e.g., claude-code)
  --local-only     Only scan project-level config files
  --global-only    Only scan global/user-level config files
  --no-color       Disable color output
  --verbose, -v    Verbose output
  --version        Print version
  --help, -h       Print this help

Supported agents: claude-code, cursor, codex, gemini-cli, github-copilot
`.trim();

interface ParsedArgs {
  command: string;
  positionals: string[];
  flags: {
    json: boolean;
    agent?: string;
    localOnly: boolean;
    globalOnly: boolean;
    noColor: boolean;
    verbose: boolean;
    help: boolean;
    version: boolean;
  };
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2); // strip node + script
  const positionals: string[] = [];
  const flags: ParsedArgs["flags"] = {
    json: false,
    localOnly: false,
    globalOnly: false,
    noColor: false,
    verbose: false,
    help: false,
    version: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i]!;
    if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--local-only") {
      flags.localOnly = true;
    } else if (arg === "--global-only") {
      flags.globalOnly = true;
    } else if (arg === "--no-color") {
      flags.noColor = true;
    } else if (arg === "--verbose" || arg === "-v") {
      flags.verbose = true;
    } else if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--version") {
      flags.version = true;
    } else if (arg === "--agent") {
      i++;
      if (i < args.length) flags.agent = args[i];
    } else if (arg.startsWith("--agent=")) {
      flags.agent = arg.slice("--agent=".length);
    } else if (!arg.startsWith("-")) {
      positionals.push(arg);
    }
    i++;
  }

  // Determine command
  const COMMANDS = ["scan", "inspect", "compare", "doctor", "list-agents", "studio"];
  let command = "scan";
  const firstPos = positionals[0];
  if (firstPos && COMMANDS.includes(firstPos)) {
    command = positionals.shift()!;
  }

  return { command, positionals, flags };
}

export async function run(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.flags.version) {
    process.stdout.write(`agentvision ${VERSION}\n`);
    return;
  }

  if (parsed.flags.help) {
    process.stdout.write(HELP + "\n");
    return;
  }

  const { command, positionals, flags } = parsed;

  switch (command) {
    case "scan": {
      const path = resolve(positionals[0] ?? process.cwd());
      const scope = flags.localOnly ? "project-only" : flags.globalOnly ? "global-only" : "all";
      await runScan({ path, json: flags.json, agent: flags.agent, scope });
      break;
    }

    case "inspect": {
      const agentId = positionals[0];
      if (!agentId) {
        process.stderr.write("Error: inspect requires an agent ID\n  Usage: agentvision inspect <agent> [path]\n");
        process.exit(1);
      }
      const path = resolve(positionals[1] ?? process.cwd());
      await runInspect({ agentId, path, json: flags.json, verbose: flags.verbose });
      break;
    }

    case "compare": {
      const path = resolve(positionals[0] ?? process.cwd());
      const scope = flags.localOnly ? "project-only" : flags.globalOnly ? "global-only" : "all";
      await runCompare({ path, json: flags.json, scope });
      break;
    }

    case "doctor": {
      const path = resolve(positionals[0] ?? process.cwd());
      const scope = flags.localOnly ? "project-only" : flags.globalOnly ? "global-only" : "all";
      await runDoctor({ path, json: flags.json, scope });
      break;
    }

    case "list-agents": {
      runListAgents({ json: flags.json });
      break;
    }

    case "studio": {
      runStudio();
      break;
    }

    default: {
      process.stderr.write(`Unknown command: ${command}\nRun "agentvision --help" for usage.\n`);
      process.exit(1);
    }
  }
}
