import { homedir } from "os";

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}b`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}kb`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}mb`;
}

export function shortenPath(p: string): string {
  const home = homedir();
  return p.startsWith(home) ? p.replace(home, "~") : p;
}
