import path from "node:path";
import { existsSync } from "node:fs";
import dotenv from "dotenv";

let loaded = false;

function uniquePaths(paths: string[]): string[] {
  return Array.from(new Set(paths.map((p) => path.resolve(p))));
}

function resolveEnvFile(filename: string, searchRoots: string[]): string | null {
  for (const root of searchRoots) {
    const candidate = path.join(root, filename);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function loadEnv(): void {
  if (loaded) {
    return;
  }

  const searchRoots = uniquePaths([
    path.resolve(__dirname, "..", "..", ".."),
    path.resolve(__dirname, "..", ".."),
    process.cwd(),
  ]);

  const envLocal = resolveEnvFile(".env.local", searchRoots);
  const envDefault = resolveEnvFile(".env", searchRoots);

  if (envLocal) {
    dotenv.config({ path: envLocal });
  } else if (envDefault) {
    dotenv.config({ path: envDefault });
  } else {
    dotenv.config();
  }

  loaded = true;
}
