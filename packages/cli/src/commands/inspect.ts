import { scan, getAgent } from "@agentvision/core";
import { renderDetail } from "../renderers/detail.js";
import { renderJson } from "../renderers/json.js";
import { c } from "../utils/colors.js";

export interface InspectCommandOptions {
  agentId: string;
  path: string;
  json: boolean;
  verbose: boolean;
}

export async function runInspect(opts: InspectCommandOptions): Promise<void> {
  const agent = getAgent(opts.agentId);
  if (!agent) {
    process.stderr.write(
      `${c.red("Error:")} Unknown agent "${opts.agentId}"\n` +
        `Run "agentvision list-agents" to see supported agents.\n`
    );
    process.exit(1);
  }

  const result = await scan(opts.path, { agents: [opts.agentId] });
  const agentResult = result.agents[0];

  if (!agentResult) {
    process.stderr.write(`${c.red("Error:")} No result for agent "${opts.agentId}"\n`);
    process.exit(1);
  }

  if (opts.json) {
    renderJson(agentResult);
  } else {
    renderDetail(agentResult, opts.verbose);
  }
}
