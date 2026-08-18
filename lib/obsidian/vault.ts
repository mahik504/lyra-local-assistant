import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type VaultNote = {
  path: string;
  title: string;
  excerpt: string;
  modifiedAt?: string;
};

function env(name: string, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

export function getVaultConfig() {
  return {
    root: env("OBSIDIAN_VAULT_PATH"),
    captureFolder: env("OBSIDIAN_CAPTURE_FOLDER", "00 Inbox"),
    dailyFolder: env("OBSIDIAN_DAILY_FOLDER", "Daily"),
    projectFolder: env("OBSIDIAN_PROJECT_FOLDER", "Projects"),
    taskFolder: env("OBSIDIAN_TASK_FOLDER", "Tasks"),
    autoWrite: env("AEGIS_AUTO_WRITE", "false").toLowerCase() === "true",
  };
}

function requireRoot() {
  const root = getVaultConfig().root;
  if (!root) throw new Error("OBSIDIAN_VAULT_PATH is not configured");
  return path.resolve(root);
}

function safeRelativePath(relativePath: string) {
  const root = requireRoot();
  const candidate = path.resolve(root, relativePath);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) throw new Error("Vault path escapes the configured root");
  return { root, candidate };
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "idea";
}

async function collectMarkdown(directory: string, root: string, result: VaultNote[], depth = 0) {
  if (depth > 8 || result.length >= 200) return;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectMarkdown(absolute, root, result, depth + 1);
      continue;
    }
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
    const content = await readFile(absolute, "utf8");
    result.push({
      path: path.relative(root, absolute).split(path.sep).join("/"),
      title: entry.name.replace(/\.md$/i, ""),
      excerpt: content.slice(0, 12000),
    });
  }
}

export async function searchVault(query: string, limit = 8) {
  const root = requireRoot();
  const all: VaultNote[] = [];
  await collectMarkdown(root, root, all);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return all
    .map((note) => {
      const haystack = `${note.title}\n${note.excerpt}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { ...note, score };
    })
    .filter((note) => note.score > 0)
    .sort((left, right) => right.score - left.score || left.path.localeCompare(right.path))
    .slice(0, limit)
    .map(({ score, ...note }) => ({ ...note, score }));
}

export async function captureIdea(content: string, tags: string[] = []) {
  const config = getVaultConfig();
  const root = requireRoot();
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `${timestamp}-${slugify(content.slice(0, 60))}.md`;
  const relativePath = path.join(config.captureFolder, filename);
  const { candidate } = safeRelativePath(relativePath);
  await mkdir(path.dirname(candidate), { recursive: true });
  const tagLine = tags.length ? `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]\n` : "tags: []\n";
  const note = `---\ntype: idea\ncreated: ${now.toISOString()}\n${tagLine}source: aegis\n---\n\n# ${content.slice(0, 80).trim()}\n\n${content.trim()}\n`;
  await writeFile(candidate, note, { encoding: "utf8", flag: "wx" });
  return { path: path.relative(root, candidate).split(path.sep).join("/"), content: note };
}

export async function readDailyNote(date = new Date()) {
  const config = getVaultConfig();
  const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.md`;
  const relativePath = path.join(config.dailyFolder, filename);
  const { candidate } = safeRelativePath(relativePath);
  try {
    return { path: relativePath.split(path.sep).join("/"), content: await readFile(candidate, "utf8") };
  } catch {
    return { path: relativePath.split(path.sep).join("/"), content: "" };
  }
}

export async function appendDailyPlan(plan: string, date = new Date()) {
  const config = getVaultConfig();
  const root = requireRoot();
  const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.md`;
  const relativePath = path.join(config.dailyFolder, filename);
  const { candidate } = safeRelativePath(relativePath);
  await mkdir(path.dirname(candidate), { recursive: true });
  const section = `\n\n## AEGIS Plan\n\n${plan.trim()}\n`;
  await writeFile(candidate, section, { encoding: "utf8", flag: "a" });
  return { path: path.relative(root, candidate).split(path.sep).join("/"), content: section };
}

export async function createTaskNote(task: string) {
  const config = getVaultConfig();
  const root = requireRoot();
  const now = new Date();
  const filename = `${now.toISOString().replace(/[:.]/g, "-")}-${slugify(task.slice(0, 60))}.md`;
  const relativePath = path.join(config.taskFolder, filename);
  const { candidate } = safeRelativePath(relativePath);
  await mkdir(path.dirname(candidate), { recursive: true });
  const note = `---\ntype: task\ncreated: ${now.toISOString()}\nstatus: open\nsource: aegis\n---\n\n- [ ] ${task.trim()}\n`;
  await writeFile(candidate, note, { encoding: "utf8", flag: "wx" });
  return { path: path.relative(root, candidate).split(path.sep).join("/"), content: note };
}

export async function createProjectBrief(title: string, goals: string, sourcePaths: string[] = []) {
  const config = getVaultConfig();
  const root = requireRoot();
  const filename = `${slugify(title)}.md`;
  const relativePath = path.join(config.projectFolder, filename);
  const { candidate } = safeRelativePath(relativePath);
  await mkdir(path.dirname(candidate), { recursive: true });
  const now = new Date().toISOString();
  const links = sourcePaths.map((source) => `- [[${source.replace(/\.md$/i, "")}]]`).join("\n");
  const note = `---\ntype: project-brief\ncreated: ${now}\nsource: aegis\n---\n\n# ${title.trim()}\n\n## Outcome\n\n${goals.trim()}\n\n## Sources\n\n${links || "- Add linked source notes"}\n\n## Next actions\n\n- [ ] Define the next concrete step\n`;
  await writeFile(candidate, note, { encoding: "utf8", flag: "wx" });
  return { path: path.relative(root, candidate).split(path.sep).join("/"), content: note };
}
