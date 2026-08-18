export type LyraSkill = {
  id: string;
  label: string;
  description: string;
  trigger: RegExp;
  tools: string[];
};

export const LYRA_SKILLS: LyraSkill[] = [
  { id: "idea-capture", label: "Idea capture", description: "Turn a thought into a bounded Markdown note.", trigger: /capture|idea|thought|jot/i, tools: ["obsidian.capture"] },
  { id: "daily-review", label: "Daily review", description: "Read priorities and prepare a focused plan.", trigger: /daily|today|priorit|review/i, tools: ["obsidian.daily-plan"] },
  { id: "knowledge-search", label: "Knowledge search", description: "Find linked excerpts in personal notes.", trigger: /search|find|knowledge|brain|vault/i, tools: ["obsidian.search"] },
  { id: "project-brief", label: "Project brief", description: "Shape scattered context into an outcome-oriented brief.", trigger: /brief|project/i, tools: ["obsidian.project-brief", "obsidian.search"] },
  { id: "task-extraction", label: "Task extraction", description: "Create explicit next actions from context.", trigger: /task|todo|actionable|next action/i, tools: ["obsidian.tasks"] },
];

export function matchSkills(prompt: string) {
  return LYRA_SKILLS.filter((skill) => skill.trigger.test(prompt));
}
