import { scan, validate } from "@agentvision/core";
import { renderJson } from "../renderers/json.js";
import { c } from "../utils/colors.js";

export interface DoctorCommandOptions {
  path: string;
  json: boolean;
  scope: "all" | "project-only" | "global-only";
}

export async function runDoctor(opts: DoctorCommandOptions): Promise<void> {
  const result = await scan(opts.path, { scope: opts.scope });
  const doctorResult = await validate(result.agents);

  if (opts.json) {
    renderJson(doctorResult);
    return;
  }

  process.stdout.write(
    `\n${c.bold("Doctor")} — ${doctorResult.totalChecks} checks, ` +
      `${c.green(String(doctorResult.passed) + " passed")}, ` +
      `${doctorResult.failed > 0 ? c.red(String(doctorResult.failed) + " failed") : c.dim("0 failed")}\n\n`
  );

  if (doctorResult.checks.length === 0) {
    process.stdout.write(c.dim("No agents detected — nothing to check.\n\n"));
    return;
  }

  // Group by category
  const byCategory = new Map<string, typeof doctorResult.checks>();
  for (const check of doctorResult.checks) {
    const bucket = byCategory.get(check.category) ?? [];
    bucket.push(check);
    byCategory.set(check.category, bucket);
  }

  for (const [category, checks] of byCategory) {
    process.stdout.write(`  ${c.bold(category)}\n`);
    for (const check of checks) {
      const icon =
        check.status === "pass" ? c.green("✓") : check.status === "fail" ? c.red("✗") : c.dim("–");
      process.stdout.write(`    ${icon} ${check.message}\n`);
      if (check.fix && check.status === "fail") {
        process.stdout.write(`       ${c.dim("Fix: " + check.fix)}\n`);
      }
    }
    process.stdout.write("\n");
  }
}
