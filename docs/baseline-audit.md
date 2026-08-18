# Baseline Audit

## Source

- Upstream repository: `https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds`
- Verified commit: `a65306f5a9568655551ec27445f773f20273223a`
- Personal repository: `https://github.com/mahik504/lyra-local-assistant` (private)
- Rollback tag: `baseline-upstream-a65306f`

## Verified stack

The project is a compact Next.js application using React, Three.js, and MediaPipe Tasks Vision. The production build completed successfully on the unchanged source. The current package install reports four high-severity audit findings that will be investigated and resolved or documented during the quality phase.

## Existing capabilities

The current application is a visual orb interface with mouse/touch rotation and zoom, keyboard controls, and optional webcam hand tracking. A single pinched hand rotates the orb and two pinched hands control zoom. The codebase does not currently contain chat, voice, model routing, Obsidian integration, MCP orchestration, or workflow automation; those are new capabilities to be added around the visual baseline rather than preserved existing features.

## Existing UI observations

The baseline presents a full-screen black canvas with a procedural 3D orb, amber/orange HUD labels, grain/vignette/scanline overlays, a top-left `U.L.T.R.O.N.` title, bottom-left interaction hints, and bottom-right gesture/zoom/reset controls. The experience is visually strong but currently functions as an interface/demo rather than a personal assistant product. The UI has no conversation surface, workflow launcher, vault status, model status, settings panel, or explicit safety/confirmation state.

The preservation rule is therefore: keep the orb, procedural scene, gesture interaction, cinematic restraint, and responsive layout as the visual core, while adding a clearly accessible assistant workspace around it without hiding the primary orb experience.

## Baseline artifacts

- Screenshot captured during local inspection: `/home/ubuntu/screenshots/3000-2ih2orcbp2qw906v_2026-08-18_09-44-12_9232.webp`
- Baseline server log: `/tmp/lyra-baseline.log`
- Unchanged build result: successful `next build`

## Design direction decision

The personal identity will use the name **LYRA** for the assistant-facing product language. The name supports the planned safety-first, local-first identity without copying a film character. The existing amber/orange theme will not be discarded immediately; it will be tested against a more restrained graphite/teal/amber semantic system, with the current look retained where it remains clearer or more distinctive.

## LYRA identity verification

The refreshed local UI now shows the L.Y.R.A. title and local-first subtitle, preserves the orb canvas and original gesture/zoom/reset controls, and adds a right-side glass assistant rail with local readiness, adaptive router status, four workflow shortcuts, conversation context, and a message composer. The new panel remains visually subordinate to the orb and is responsive at the tested desktop viewport. The production build remains successful after the identity update.

## Final browser verification

The final local UI renders successfully after dependency remediation. At an unconfigured local launch it truthfully reports `LOCAL · VAULT SETUP` and `ROUTER · OFFLINE`, while retaining the LYRA workflow cards, text composer, disabled voice-input affordance, gesture toggle, zoom controls, reset action, and preserved orb canvas. The browser surface shows no page-level runtime error during inspection.
