# AEGIS Design Direction

## Product character

AEGIS is a local-first personal operating layer: calm, capable, private, and always ready. The interface keeps the existing procedural orb as the system’s visual anchor, but shifts the surrounding experience from a sci-fi demo toward an actual daily workspace.

## Preservation rules

The orb scene, mouse/touch navigation, keyboard controls, webcam gesture interaction, and restrained cinematic overlays remain intact. New UI should frame the orb rather than cover it. Motion is purposeful: state transitions, focus, and feedback may animate, while the scene remains the primary ambient motion.

## Visual tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#050708` | Application background |
| `--surface` | `rgba(9, 17, 20, 0.82)` | Glass panels |
| `--line` | `rgba(92, 225, 203, 0.22)` | Borders and dividers |
| `--accent` | `#62e1cb` | Primary AEGIS interaction color |
| `--accent-soft` | `#b7fff1` | Active labels and emphasis |
| `--legacy-amber` | `#ffaa30` | Preserved orb/HUD warmth |
| `--text` | `#e8f5f3` | Primary text |
| `--muted` | `#8da7a4` | Secondary text |
| `--danger` | `#ff806e` | Errors and risky states |

The teal/graphite system is deliberately restrained. The orb remains warm amber so the original visual signature is preserved, while the assistant workspace uses teal to communicate local clarity, readiness, and trust.

## Interaction language

Every important state is explicit: `LOCAL`, `READY`, `LISTENING`, `THINKING`, `WRITING`, or `CONFIRM`. Local writes and external actions display their scope before execution. Quick actions are phrased as useful workflows rather than theatrical commands.

## Responsive behavior

Desktop keeps the orb dominant with a right-side assistant rail. Smaller screens collapse the rail into a bottom workspace, preserve the gesture controls, and remove only nonessential hints. Keyboard focus, reduced motion, and readable contrast are required.
