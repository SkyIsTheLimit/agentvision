import { agents } from "@agentvision/core";
import { renderJson } from "../renderers/json.js";
import { c } from "../utils/colors.js";

export interface ListAgentsCommandOptions {
  json: boolean;
}

export function runListAgents(opts: ListAgentsCommandOptions): void {
  if (opts.json) {
    renderJson(
      agents.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        docsUrl: a.docsUrl,
        configLocations: a.configs.map((cfg) => ({
          label: cfg.label,
          category: cfg.category,
          paths: cfg.paths,
          globalPaths: cfg.globalPaths,
          format: cfg.format,
          multi: cfg.multi,
        })),
        supportsMcp: !!a.extractMcpServers,
      }))
    );
    return;
  }

  process.stdout.write(`\n${c.bold("Supported Agents")} ${c.dim(`(${agents.length})`)}\n\n`);

  for (const agent of agents) {
    process.stdout.write(`  ${c.bold(agent.name)} ${c.dim(`(${agent.id})`)}\n`);
    process.stdout.write(`  ${c.dim(agent.description)}\n`);
    process.stdout.write(`  ${c.dim("Docs:")} ${agent.docsUrl}\n`);
    process.stdout.write(`  ${c.dim("MCP support:")} ${agent.extractMcpServers ? c.green("yes") : c.dim("no")}\n`);

    process.stdout.write(`  ${c.dim("Config locations:")}\n`);
    for (const cfg of agent.configs) {
      const paths = cfg.paths.join(", ");
      process.stdout.write(`    ${c.dim("·")} ${cfg.label} — ${c.dim(paths)} ${c.dim(`[${cfg.format}]`)}\n`);
    }
    process.stdout.write("\n");
  }
}
