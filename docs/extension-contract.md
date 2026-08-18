# LYRA Extension Contract

LYRA is designed to grow through explicit capability boundaries rather than a single unrestricted agent loop. A skill describes a user-facing workflow, a tool describes one bounded operation, and an MCP server describes an optional external capability source. These layers are intentionally separate so an operator can see what a request is allowed to do.

## Skills

Skills live in `lib/lyra/skill-registry.ts`. Each entry has a stable identifier, a human label, a trigger, a concise description, and the tool IDs it may use. A new skill should be narrow enough to test with a fixture, and it should describe whether it reads, writes, or requires confirmation.

| Skill | Primary tools | Default behavior |
| --- | --- | --- |
| Idea capture | `obsidian.capture` | Preview, then confirm a Markdown write |
| Daily review | `obsidian.daily-plan` | Read daily context and preview an append |
| Knowledge search | `obsidian.search` | Read-only ranked search |
| Project brief | `obsidian.project-brief`, `obsidian.search` | Preview, then confirm a structured note |
| Task extraction | `obsidian.tasks` | Preview, then confirm a task note |

## MCP servers

The current project includes a configuration-only contract in `lib/lyra/mcp-contract.ts`. External servers are disabled unless an operator explicitly sets `LYRA_MCP_CONFIG_JSON` with an allow-listed server and tool set. The current build does not auto-discover, install, or execute arbitrary MCP commands. This is deliberate: a future adapter must add connection lifecycle management, timeout handling, audit events, and an approval surface before it can be enabled for personal use.

A minimal configuration shape is:

```json
[
  {
    "id": "approved-local-service",
    "label": "Approved local service",
    "transport": "stdio",
    "command": "your-approved-command",
    "enabled": false,
    "allowedTools": ["approved.read"]
  }
]
```

## Automation

Do not use a background loop for every assistant action. A deterministic local write should remain a normal request/confirmation operation. A low-frequency daily review can later be scheduled outside the UI, while high-frequency or event-triggered automation should use a persistent process only after its trigger, failure behavior, and audit trail are defined. No recurring job is enabled by the current project.

Every future automation should record the following information before execution:

| Field | Required meaning |
| --- | --- |
| Trigger | What event or time starts the workflow |
| Scope | Which vault folders, accounts, or tools may be touched |
| Risk | Read-only, reversible write, external side effect, or destructive |
| Approval | Whether user confirmation is required and where it appears |
| Failure mode | What happens on timeout, partial write, or provider failure |
| Audit | What local record is retained for inspection |

This contract keeps the local-first version useful without turning it into an opaque always-on agent.
