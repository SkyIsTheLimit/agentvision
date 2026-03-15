import type { ScanResult, AgentScanResult, DiscoveredFile } from "@agentvision/core";
import { c } from "../utils/colors.js";
import { formatBytes, shortenPath } from "../utils/format.js";

function agentIcon(result: AgentScanResult): string {
  if (!result.detected) return c.red("✗");
  const hasWarnings = result.warnings.length > 0;
  return hasWarnings ? c.yellow("⚠") : c.green("✓");
}

function fileLabel(file: DiscoveredFile): string {
  const path = file.scope === "global" ? shortenPath(file.absolutePath) : file.relativePath;
  const size = file.size > 0 ? c.dim(` (${formatBytes(file.size)})`) : "";
  const scope = file.scope === "global" ? c.dim(" [global]") : "";
  let status = "";
  if (file.status === "empty") status = c.yellow(" ⚠ empty");
  else if (file.status === "parse-error") status = c.red(` ✗ ${file.error ?? "parse error"}`);
  else if (file.status === "invalid") status = c.red(" ✗ invalid");
  if (file.gitignored) status += c.dim(" [gitignored]");
  return `${path}${size}${scope}${status}`;
}

function renderAgentResult(result: AgentScanResult): void {
  const icon = agentIcon(result);
  process.stdout.write(`  ${c.bold(result.agent.name)} ${icon}\n`);

  if (!result.detected) {
    process.stdout.write(`    ${c.dim("(no configuration found)")}\n`);
    return;
  }

  for (const config of result.configs) {
    if (config.files.length === 0) continue;
    const label = config.location.label;

    if (config.files.length === 1) {
      const file = config.files[0]!;
      process.stdout.write(`    ${c.dim(label + ":")}  ${fileLabel(file)}\n`);
    } else {
      process.stdout.write(`    ${c.dim(label + ":")}  (${config.files.length} files)\n`);
      for (const file of config.files) {
        process.stdout.write(`      ${c.dim("·")} ${fileLabel(file)}\n`);
      }
    }
  }

  if (result.mcpServers.length > 0) {
    process.stdout.write(`    ${c.dim("MCP Servers:")}\n`);
    for (const mcp of result.mcpServers) {
      const transport =
        mcp.transport === "stdio"
          ? c.dim(`stdio: ${mcp.command}`)
          : c.dim(`${mcp.transport}: ${mcp.url}`);
      process.stdout.write(`      ${c.dim("·")} ${mcp.name} ${c.dim(`(${transport})`)} ${c.green("✓")}\n`);
    }
  }

  if (result.warnings.length > 0) {
    for (const w of result.warnings) {
      const icon = w.severity === "error" ? c.red("✗") : w.severity === "warning" ? c.yellow("⚠") : c.blue("ⓘ");
      process.stdout.write(`    ${icon} ${w.message}\n`);
    }
  }
}

export function renderTree(result: ScanResult): void {
  process.stdout.write(`\n${c.bold("📁 " + shortenPath(result.projectPath))}\n\n`);

  const detected = result.agents.filter((a) => a.detected);
  const notDetected = result.agents.filter((a) => !a.detected);

  for (const agent of detected) {
    renderAgentResult(agent);
    process.stdout.write("\n");
  }

  if (notDetected.length > 0) {
    const names = notDetected.map((a) => a.agent.name).join(", ");
    process.stdout.write(`  ${c.dim(`Not detected: ${names}`)}\n`);
  }

  if (result.crossAgentWarnings.length > 0) {
    process.stdout.write(`\n  ${c.yellow("⚠ Warnings")} ${c.dim(`(${result.crossAgentWarnings.length})`)}\n`);
    for (const w of result.crossAgentWarnings) {
      const icon = w.severity === "error" ? c.red("✗") : w.severity === "warning" ? c.yellow("⚠") : c.blue("ⓘ");
      process.stdout.write(`    ${icon} ${w.message}\n`);
    }
  }

  process.stdout.write("\n");
}
