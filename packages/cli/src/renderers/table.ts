import type { ScanResult, ComparisonResult } from "@agentvision/core";
import { c } from "../utils/colors.js";

function padEnd(s: string, len: number): string {
  // pad without ANSI codes affecting length
  const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, len - visible.length);
  return s + " ".repeat(pad);
}

export function renderTable(scanResult: ScanResult, comparison: ComparisonResult): void {
  const detected = scanResult.agents.filter((a) => a.detected);
  if (detected.length === 0) {
    process.stdout.write(c.dim("No agents detected — nothing to compare.\n"));
    return;
  }

  const categories = ["instructions", "mcp-servers", "settings", "skills", "rules", "context"] as const;
  const agentNames = detected.map((a) => a.agent.name);

  // Column widths
  const catWidth = Math.max(12, ...categories.map((c) => c.length));
  const colWidth = Math.max(8, ...agentNames.map((n) => n.length));

  // Header row
  const header =
    padEnd(c.bold("Category"), catWidth + 2) +
    agentNames.map((n) => padEnd(c.bold(n), colWidth + 2)).join("");
  process.stdout.write(`\n${header}\n`);
  process.stdout.write(c.dim("─".repeat(catWidth + 2 + (colWidth + 2) * agentNames.length)) + "\n");

  for (const cat of categories) {
    const row: string[] = [padEnd(cat, catWidth + 2)];
    for (const agentResult of detected) {
      const configs = agentResult.configs.filter((cfg) => cfg.location.category === cat);
      const fileCount = configs.reduce((sum, cfg) => sum + cfg.files.length, 0);
      let cell: string;
      if (fileCount === 0) {
        cell = c.red("✗");
      } else if (fileCount === 1) {
        cell = c.green("✓");
      } else {
        cell = c.green(`✓ (${fileCount})`);
      }
      row.push(padEnd(cell, colWidth + 2));
    }
    process.stdout.write(row.join("") + "\n");
  }

  // MCP servers row
  const mcpRow: string[] = [padEnd(c.dim("mcp count"), catWidth + 2)];
  for (const agentResult of detected) {
    const count = agentResult.mcpServers.length;
    mcpRow.push(padEnd(count > 0 ? c.green(String(count)) : c.dim("0"), colWidth + 2));
  }
  process.stdout.write(c.dim("─".repeat(catWidth + 2 + (colWidth + 2) * agentNames.length)) + "\n");
  process.stdout.write(mcpRow.join("") + "\n");

  // Gaps section
  if (comparison.gaps.length > 0) {
    process.stdout.write(`\n${c.yellow("⚠ Gaps detected:")}\n`);
    for (const gap of comparison.gaps) {
      process.stdout.write(`  ${c.dim("·")} ${gap.description}\n`);
    }
  }

  process.stdout.write("\n");
}
