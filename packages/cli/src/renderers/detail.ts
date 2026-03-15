import type { AgentScanResult, DiscoveredFile } from "@agentvision/core";
import { c } from "../utils/colors.js";
import { formatBytes, shortenPath } from "../utils/format.js";

const PREVIEW_LINES = 10;

function renderFileDetail(file: DiscoveredFile, verbose: boolean): void {
  const path = file.scope === "global" ? shortenPath(file.absolutePath) : file.relativePath;
  const scope = file.scope === "global" ? c.dim(" [global]") : "";
  const size = c.dim(` ${formatBytes(file.size)}`);
  const gitignored = file.gitignored ? c.dim(" [gitignored]") : "";

  let statusIcon: string;
  if (file.status === "valid") statusIcon = c.green("✓");
  else if (file.status === "empty") statusIcon = c.yellow("⚠ empty");
  else if (file.status === "parse-error") statusIcon = c.red(`✗ ${file.error ?? "parse error"}`);
  else statusIcon = c.red("✗ invalid");

  process.stdout.write(`    ${statusIcon}  ${c.bold(path)}${size}${scope}${gitignored}\n`);

  if (file.error && file.status !== "parse-error") {
    process.stdout.write(`       ${c.red(file.error)}\n`);
  }

  if (verbose && file.content && typeof file.content === "string") {
    const lines = file.content.split("\n");
    const preview = lines.slice(0, PREVIEW_LINES);
    process.stdout.write(c.dim("       ┌─\n"));
    for (const line of preview) {
      process.stdout.write(c.dim(`       │ `) + line + "\n");
    }
    if (lines.length > PREVIEW_LINES) {
      process.stdout.write(c.dim(`       │ … (${lines.length - PREVIEW_LINES} more lines)\n`));
    }
    process.stdout.write(c.dim("       └─\n"));
  }
}

export function renderDetail(result: AgentScanResult, verbose = false): void {
  process.stdout.write(`\n${c.bold(result.agent.name)}`);
  if (result.detected) {
    process.stdout.write(` ${c.green("✓ detected")}\n`);
  } else {
    process.stdout.write(` ${c.red("✗ not detected")}\n`);
    process.stdout.write(c.dim(`  Docs: ${result.agent.docsUrl}\n`));
    return;
  }

  process.stdout.write(c.dim(`  ${result.agent.description}\n`));
  process.stdout.write(c.dim(`  Docs: ${result.agent.docsUrl}\n`));
  process.stdout.write("\n");

  for (const config of result.configs) {
    if (config.files.length === 0) continue;
    process.stdout.write(`  ${c.bold(config.location.label)}\n`);
    for (const file of config.files) {
      renderFileDetail(file, verbose);
    }
    process.stdout.write("\n");
  }

  if (result.mcpServers.length > 0) {
    process.stdout.write(`  ${c.bold("MCP Servers")} ${c.dim(`(${result.mcpServers.length})`)}\n`);
    for (const mcp of result.mcpServers) {
      if (mcp.transport === "stdio") {
        const args = mcp.args?.join(" ") ?? "";
        process.stdout.write(
          `    ${c.green("✓")} ${c.bold(mcp.name)} ${c.dim(`stdio: ${mcp.command}${args ? " " + args : ""}`)}\n`
        );
      } else {
        process.stdout.write(
          `    ${c.green("✓")} ${c.bold(mcp.name)} ${c.dim(`${mcp.transport}: ${mcp.url}`)}\n`
        );
      }
      if (mcp.env && Object.keys(mcp.env).length > 0) {
        const envKeys = Object.keys(mcp.env).join(", ");
        process.stdout.write(`       ${c.dim(`env: ${envKeys}`)}\n`);
      }
    }
    process.stdout.write("\n");
  }

  if (result.warnings.length > 0) {
    process.stdout.write(`  ${c.yellow("⚠ Warnings")}\n`);
    for (const w of result.warnings) {
      const icon = w.severity === "error" ? c.red("✗") : w.severity === "warning" ? c.yellow("⚠") : c.blue("ⓘ");
      process.stdout.write(`    ${icon} ${w.message}\n`);
      if (w.fix) process.stdout.write(`       ${c.dim("Fix: " + w.fix)}\n`);
    }
  }
}
