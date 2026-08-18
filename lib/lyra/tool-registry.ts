import type { ActionRisk } from "./policy";

export type LyraTool = {
  id: string;
  label: string;
  description: string;
  risk: ActionRisk;
  enabledByDefault: boolean;
};

export const LYRA_TOOLS: LyraTool[] = [
  { id: "obsidian.search", label: "Knowledge search", description: "Search approved vault notes and return linked excerpts.", risk: "read-only", enabledByDefault: true },
  { id: "obsidian.capture", label: "Idea capture", description: "Create or append an idea note inside the configured capture folder.", risk: "reversible-write", enabledByDefault: true },
  { id: "obsidian.tasks", label: "Task extraction", description: "Turn note content into linked tasks with source context.", risk: "reversible-write", enabledByDefault: true },
  { id: "obsidian.daily-plan", label: "Daily planning", description: "Read priorities and propose a plan for the current daily note.", risk: "reversible-write", enabledByDefault: true },
  { id: "obsidian.project-brief", label: "Project brief", description: "Create a structured brief from selected notes and links.", risk: "reversible-write", enabledByDefault: true },
  { id: "browser.research", label: "Research context", description: "Collect user-approved source material for summarization.", risk: "read-only", enabledByDefault: false },
  { id: "git.propose", label: "Coding assistance", description: "Explain or propose code changes without silently committing them.", risk: "reversible-write", enabledByDefault: false },
];

export function getTool(toolId: string) {
  return LYRA_TOOLS.find((tool) => tool.id === toolId);
}
