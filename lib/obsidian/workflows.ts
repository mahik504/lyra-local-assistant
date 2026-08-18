import { appendDailyPlan, captureIdea, createProjectBrief, createTaskNote, getVaultConfig, readDailyNote, searchVault } from "./vault";

export type WorkflowId = "capture" | "daily-plan" | "search" | "brief" | "research" | "meeting" | "tasks" | "general";

export type WorkflowResult = {
  workflow: WorkflowId;
  text: string;
  requiresConfirmation: boolean;
  changedPath?: string;
  sources?: Array<{ path: string; title: string; excerpt: string; score: number }>;
};

export function detectWorkflow(prompt: string): WorkflowId {
  const normalized = prompt.toLowerCase();
  if (/(capture|idea|thought|jot)/.test(normalized)) return "capture";
  if (/(daily|today|priorit|schedule|plan)/.test(normalized)) return "daily-plan";
  if (/(search|find|knowledge|brain|vault)/.test(normalized)) return "search";
  if (/(brief|project)/.test(normalized)) return "brief";
  if (/(research|summarize|source|article)/.test(normalized)) return "research";
  if (/(meeting|follow.?up|decision|minutes)/.test(normalized)) return "meeting";
  if (/(task|todo|actionable)/.test(normalized)) return "tasks";
  return "general";
}

export async function runObsidianWorkflow(prompt: string, confirm = false): Promise<WorkflowResult | null> {
  const config = getVaultConfig();
  if (!config.root) return null;
  const workflow = detectWorkflow(prompt);

  if (workflow === "search") {
    const sources = await searchVault(prompt, 8);
    return {
      workflow,
      sources,
      requiresConfirmation: false,
      text: sources.length ? `I found ${sources.length} relevant note${sources.length === 1 ? "" : "s"} in your vault.` : "I could not find a matching note in the configured vault.",
    };
  }

  if (workflow === "capture") {
    const requiresConfirmation = !config.autoWrite && !confirm;
    if (requiresConfirmation) {
      return { workflow, requiresConfirmation, text: "I can create a new idea note in your configured capture folder. Confirm the local write to continue." };
    }
    const ideaContent = prompt.replace(/^(capture|save|jot)\s+(this\s+)?(idea|thought)?\s*[:\-–—]?\s*/i, "").trim() || prompt;
    const result = await captureIdea(ideaContent);
    return { workflow, requiresConfirmation: false, changedPath: result.path, text: `Captured the idea in ${result.path}.` };
  }

  if (workflow === "daily-plan") {
    const note = await readDailyNote();
    const plan = "1. Choose one meaningful outcome.\n2. Complete the smallest next action before opening new threads.\n3. Close the day with a short review and tomorrow handoff.";
    const requiresConfirmation = !config.autoWrite && !confirm;
    if (requiresConfirmation) {
      return { workflow, requiresConfirmation, text: note.content ? `I read ${note.path}. I can append a focused plan under an AEGIS Plan section after you confirm.` : `Your daily note ${note.path} does not exist yet. I can create it with a focused plan after you confirm.` };
    }
    const result = await appendDailyPlan(plan);
    return { workflow, requiresConfirmation: false, changedPath: result.path, text: `Added the focused daily plan to ${result.path}.` };
  }

  if (workflow === "tasks") {
    const task = prompt.replace(/^(extract|create|add)?\s*(tasks?|todos?|action items?)?\s*[:\-–—]?\s*/i, "").trim() || "Review the next concrete action";
    const requiresConfirmation = !config.autoWrite && !confirm;
    if (requiresConfirmation) return { workflow, requiresConfirmation, text: "I can create a linked task note in the configured Tasks folder. Confirm the local write to continue." };
    const result = await createTaskNote(task);
    return { workflow, requiresConfirmation: false, changedPath: result.path, text: `Created the task note at ${result.path}.` };
  }

  if (workflow === "brief") {
    const requiresConfirmation = !config.autoWrite && !confirm;
    if (requiresConfirmation) return { workflow, requiresConfirmation, text: "I can create a structured project brief in the configured Projects folder. Confirm the local write to continue." };
    const result = await createProjectBrief("New project brief", prompt, []);
    return { workflow, requiresConfirmation: false, changedPath: result.path, text: `Created a project brief at ${result.path}.` };
  }

  return {
    workflow,
    requiresConfirmation: false,
    text: "This workflow is mapped and ready for its structured Obsidian template. No vault files were changed.",
  };
}
