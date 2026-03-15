import pc from "picocolors";

const noColor = process.argv.includes("--no-color") || process.env.NO_COLOR != null;

export const c = noColor
  ? {
      green: (s: string) => s,
      red: (s: string) => s,
      yellow: (s: string) => s,
      blue: (s: string) => s,
      cyan: (s: string) => s,
      gray: (s: string) => s,
      bold: (s: string) => s,
      dim: (s: string) => s,
    }
  : {
      green: pc.green,
      red: pc.red,
      yellow: pc.yellow,
      blue: pc.blue,
      cyan: pc.cyan,
      gray: pc.gray,
      bold: pc.bold,
      dim: pc.dim,
    };
