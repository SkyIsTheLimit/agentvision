import { scan, compare } from "@agentvision/core";
import { renderTable } from "../renderers/table.js";
import { renderJson } from "../renderers/json.js";

export interface CompareCommandOptions {
  path: string;
  json: boolean;
  scope: "all" | "project-only" | "global-only";
}

export async function runCompare(opts: CompareCommandOptions): Promise<void> {
  const result = await scan(opts.path, { scope: opts.scope });
  const comparison = compare(result.agents);

  if (opts.json) {
    renderJson({ scan: result, comparison });
  } else {
    renderTable(result, comparison);
  }
}
