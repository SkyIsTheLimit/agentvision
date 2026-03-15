import { readFile, stat } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { resolve, relative } from "path";
import fg from "fast-glob";
import { parse as parseJsonc } from "jsonc-parser";
import { parse as parseYaml } from "yaml";
import type { ConfigLocation } from "../agents/types.js";

const execAsync = promisify(exec);

export interface ReadResult {
  absolutePath: string;
  exists: boolean;
  size: number;
  gitignored: boolean;
  status: "valid" | "invalid" | "parse-error" | "empty";
  error?: string;
  content?: unknown;
}

export async function readConfigFile(
  absolutePath: string,
  format: ConfigLocation["format"]
): Promise<ReadResult> {
  // Check if file/dir exists
  let fileStat: Awaited<ReturnType<typeof stat>> | null = null;
  try {
    fileStat = await stat(absolutePath);
  } catch {
    return {
      absolutePath,
      exists: false,
      size: 0,
      gitignored: false,
      status: "invalid",
      error: "File not found",
    };
  }

  const size = fileStat.size;

  // Handle directory format
  if (format === "directory") {
    if (!fileStat.isDirectory()) {
      return { absolutePath, exists: true, size, gitignored: false, status: "invalid", error: "Not a directory" };
    }
    try {
      const { readdirSync } = await import("fs");
      const children = readdirSync(absolutePath);
      return { absolutePath, exists: true, size, gitignored: false, status: "valid", content: children };
    } catch (e) {
      return { absolutePath, exists: true, size, gitignored: false, status: "invalid", error: String(e) };
    }
  }

  if (!fileStat.isFile()) {
    return { absolutePath, exists: true, size, gitignored: false, status: "invalid", error: "Not a regular file" };
  }

  if (size === 0) {
    return { absolutePath, exists: true, size: 0, gitignored: false, status: "empty" };
  }

  // Read file content
  let raw: string;
  try {
    raw = await readFile(absolutePath, "utf-8");
  } catch (e) {
    return { absolutePath, exists: true, size, gitignored: false, status: "invalid", error: `Cannot read: ${String(e)}` };
  }

  // Parse by format
  if (format === "markdown" || format === "text") {
    return { absolutePath, exists: true, size, gitignored: false, status: "valid", content: raw };
  }

  if (format === "json") {
    try {
      const content = JSON.parse(raw);
      return { absolutePath, exists: true, size, gitignored: false, status: "valid", content };
    } catch (e) {
      const msg = e instanceof SyntaxError ? e.message : String(e);
      return { absolutePath, exists: true, size, gitignored: false, status: "parse-error", error: `JSON parse error: ${msg}` };
    }
  }

  if (format === "jsonc") {
    const errors: import("jsonc-parser").ParseError[] = [];
    const content = parseJsonc(raw, errors, { allowTrailingComma: true });
    if (errors.length > 0) {
      return { absolutePath, exists: true, size, gitignored: false, status: "parse-error", error: `JSONC parse error: ${String(errors[0]?.error ?? "unknown")}` };
    }
    return { absolutePath, exists: true, size, gitignored: false, status: "valid", content };
  }

  if (format === "yaml") {
    try {
      const content = parseYaml(raw);
      return { absolutePath, exists: true, size, gitignored: false, status: "valid", content };
    } catch (e) {
      return { absolutePath, exists: true, size, gitignored: false, status: "parse-error", error: `YAML parse error: ${String(e)}` };
    }
  }

  if (format === "toml") {
    try {
      const { parse: parseToml } = await import("smol-toml");
      const content = parseToml(raw);
      return { absolutePath, exists: true, size, gitignored: false, status: "valid", content };
    } catch (e) {
      return { absolutePath, exists: true, size, gitignored: false, status: "parse-error", error: `TOML parse error: ${String(e)}` };
    }
  }

  return { absolutePath, exists: true, size, gitignored: false, status: "valid", content: raw };
}

export async function expandPaths(patterns: string[], baseDir: string): Promise<string[]> {
  const hasGlob = patterns.some((p) => fg.isDynamicPattern(p));
  if (!hasGlob) {
    // No globs — resolve each path directly
    return patterns.map((p) => resolve(baseDir, p));
  }
  try {
    const matches = await fg(patterns, {
      cwd: baseDir,
      absolute: true,
      dot: true,
      onlyFiles: true,
    });
    // Also include literal paths that might not match the glob but should be checked
    const literalPaths = patterns
      .filter((p) => !fg.isDynamicPattern(p))
      .map((p) => resolve(baseDir, p));
    const all = [...new Set([...matches, ...literalPaths])];
    return all;
  } catch {
    return patterns.map((p) => resolve(baseDir, p));
  }
}

export async function isGitIgnored(filePath: string, projectRoot: string): Promise<boolean> {
  try {
    await execAsync(`git -C ${JSON.stringify(projectRoot)} check-ignore -q ${JSON.stringify(filePath)}`);
    return true;
  } catch {
    return false;
  }
}

export function makeRelativePath(absolutePath: string, base: string): string {
  const rel = relative(base, absolutePath);
  return rel.startsWith("..") ? absolutePath : `./${rel}`;
}
