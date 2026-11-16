import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Test yazıları için geçerli bir bilgi bloğu; alanlar tek tek ezilebilir.
export const DESC = "A description that is long enough for search results and link previews, written for boutique hotel owners in the UK. Here.";

export function post(fm: Record<string, unknown> = {}, body = "A short body paragraph with a few words in it."): string {
  const data: Record<string, unknown> = { title: "A test post", description: DESC, date: "2026-11-10", tags: ["ai-receptionist", "hotels-and-bbs"], draft: false, ...fm };
  const lines = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join("\n")}\n---\n\n${body}\n`;
}

export function contentDir(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "blog-content-"));
  mkdirSync(dir, { recursive: true });
  for (const [name, src] of Object.entries(files)) writeFileSync(join(dir, name), src);
  return dir;
}

export const outDir = (): string => mkdtempSync(join(tmpdir(), "blog-dist-"));
