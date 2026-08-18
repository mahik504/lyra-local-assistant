export type ActionRisk = "read-only" | "reversible-write" | "external-side-effect" | "destructive";

export type ActionPolicy = {
  risk: ActionRisk;
  label: string;
  requiresConfirmation: boolean;
};

const policies: Record<ActionRisk, ActionPolicy> = {
  "read-only": { risk: "read-only", label: "Read only", requiresConfirmation: false },
  "reversible-write": { risk: "reversible-write", label: "Local write", requiresConfirmation: false },
  "external-side-effect": { risk: "external-side-effect", label: "External action", requiresConfirmation: true },
  destructive: { risk: "destructive", label: "Destructive", requiresConfirmation: true },
};

export function classifyAction(prompt: string): ActionPolicy {
  const normalized = prompt.toLowerCase();
  if (/(delete|remove|overwrite|erase|destroy|empty|purge)/.test(normalized)) return policies.destructive;
  if (/(send|publish|post|email|message|share|upload|commit|push)/.test(normalized)) return policies["external-side-effect"];
  if (/(capture|create|write|append|update|plan|turn.*into|save|add)/.test(normalized)) return policies["reversible-write"];
  return policies["read-only"];
}

export function policyFor(risk: ActionRisk) {
  return policies[risk];
}
