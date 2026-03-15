import { scan } from "@agentvision/core";
import { renderTree } from "../renderers/tree.js";
import { renderJson } from "../renderers/json.js";

export interface ScanCommandOptions {
  path: string;
  json: boolean;
  agent?: string;
  scope: "all" | "project-only" | "global-only";
}

export async function runScan(opts: ScanCommandOptions): Promise<void> {
  const result = await scan(opts.path, {
    agents: opts.agent ? [opts.agent] : undefined,
    scope: opts.scope,
  });

  if (opts.json) {
    renderJson(result);
  } else {
    renderTree(result);
  }
}
