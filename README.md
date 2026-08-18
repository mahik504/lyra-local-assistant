# LYRA — Local Personal Operating Layer

LYRA is a local-first personal assistant interface built around a preserved procedural Three.js orb. It is designed to help with thinking, planning, knowledge retrieval, and small repeatable workflows while keeping the boundary around personal files explicit. The visual core comes from the upstream [ULTRON Orb UI](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds); this repository preserves the orb, mouse/touch controls, keyboard controls, and MediaPipe hand tracking while adding a usable personal workspace.

> **Design principle:** LYRA should feel calm and capable, not theatrical. It keeps the original orb as an ambient system surface and adds a practical assistant rail for real work.

![LYRA orb interface](docs/screenshot.png)

## What is included

The current version is a private, local-first Next.js application with a right-side assistant workspace, local readiness indicators, quick workflows, conversation state, preview-first write confirmation, an OpenAI-compatible model gateway, and a path-safe Obsidian vault adapter. The existing orb remains fully interactive, including drag rotation, scroll zoom, reset, and optional webcam hand gestures.

| Area | Current behavior |
| --- | --- |
| Visual system | Procedural amber orb with grain, scanlines, vignette, and responsive HUD preserved from upstream |
| Assistant shell | LYRA identity, local/vault/model status, workflow shortcuts, chat surface, and composer |
| Local model routing | Fast, balanced, reasoning, and long-context routes selected from prompt shape and configured through environment variables |
| Obsidian search | Searches Markdown notes inside the configured vault boundary and returns ranked note paths and excerpts |
| Obsidian capture | Creates timestamped idea notes in the configured capture folder after an explicit confirmation, unless local auto-write is enabled |
| Daily planning | Reads the current daily note and can append a structured LYRA Plan section after confirmation |
| Task workflow | Creates a Markdown task note in the configured task folder after confirmation |
| Project briefs | Creates a structured Markdown brief with outcome, sources, and next actions |
| Voice input | Uses browser speech recognition when supported; otherwise the composer remains available for typed input |
| Session memory | Keeps a small, local browser session history in `localStorage`; no remote transcript store is required |
| Safety boundary | Read-only, local-write, external-side-effect, and destructive actions are classified separately |

## Getting started

The project is intentionally runnable as a normal local Next.js application.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app also builds for production with:

```bash
npm run build
npm run start
```

The default UI works without a configured model or vault. In that mode LYRA uses honest local fallback responses and does not claim to have read or changed personal files.

## Local configuration

Copy `.env.example` to `.env.local`. The real file is ignored by Git and should never be committed.

```dotenv
LYRA_LLM_BASE_URL=https://your-openai-compatible-provider.example/v1
LYRA_LLM_API_KEY=replace-me
LYRA_MODEL_FAST=your-fast-model-id
LYRA_MODEL_BALANCED=your-balanced-model-id
LYRA_MODEL_REASONING=your-reasoning-model-id
LYRA_MODEL_LONG_CONTEXT=your-long-context-model-id
LYRA_LLM_TIMEOUT_MS=30000

OBSIDIAN_VAULT_PATH=/replace/with/your/ObsidianVault
OBSIDIAN_CAPTURE_FOLDER=00 Inbox
OBSIDIAN_DAILY_FOLDER=Daily
OBSIDIAN_PROJECT_FOLDER=Projects
OBSIDIAN_TASK_FOLDER=Tasks
LYRA_AUTO_WRITE=false
```

Use `LYRA_AUTO_WRITE=true` only after confirming the folder mapping and note templates. The safer default is `false`, which keeps local writes preview-first. The model gateway accepts an OpenAI-compatible `/chat/completions` contract and does not hard-code provider-specific model IDs.

## Obsidian boundary

LYRA resolves every requested path relative to `OBSIDIAN_VAULT_PATH` and rejects paths that escape the configured root. Search skips hidden directories, `.obsidian`, `node_modules`, and non-Markdown files. Write workflows create Markdown notes only inside the configured capture, daily, project, and task folders.

The assistant endpoint exposes a local write confirmation flow. For a write request, LYRA first returns a proposal. The UI presents a `Confirm write` action, and only the confirmed request is passed to the writer. External actions such as sending, publishing, uploading, or pushing are classified as higher risk and are not silently performed by the current local adapter.

## Existing orb controls

### Mouse and touch

| Input | Action |
| --- | --- |
| Drag | Spin the orb |
| Scroll or pinch | Zoom in or out |

### Hand gestures

Select **GESTURES OFF** or press `G`, then allow camera access. A pinched thumb and index finger on one hand rotates the orb; pinching with both hands and changing the distance between them controls zoom. Camera access is optional and can be disabled at any time.

### Keyboard

| Key | Action |
| --- | --- |
| `G` | Toggle hand gestures |
| `R` | Reset the view |
| `+` / `−` | Zoom in or out |

## Architecture

The project keeps the rendering and interaction layer separate from the local assistant layer. The orb scene remains in `lib/orbScene.ts`, hand tracking remains in `lib/handTracker.ts`, and the LYRA client shell lives in `components/LyraOrb.tsx`. Server routes under `app/api` provide a narrow boundary for assistant requests and readiness information.

```text
Browser UI
  ├─ Procedural orb + mouse/touch controls
  ├─ Optional MediaPipe webcam gestures
  ├─ Voice input when browser-supported
  └─ LYRA assistant rail
       ├─ /api/status
       └─ /api/assistant
            ├─ policy classification
            ├─ Obsidian workflow adapter
            └─ configurable model gateway
```

| Path | Responsibility |
| --- | --- |
| `components/LyraOrb.tsx` | Client interaction shell, orb lifecycle, chat, voice input, confirmation UI, and local session memory |
| `components/JarvisOrb.tsx` | Preserved upstream interface component kept available for rollback and comparison |
| `lib/orbScene.ts` | Three.js scene construction, animation, camera controls, and post-processing |
| `lib/handTracker.ts` | MediaPipe HandLandmarker webcam tracking and gesture interpretation |
| `lib/lyra/model-gateway.ts` | Environment-driven route selection and OpenAI-compatible completions |
| `lib/lyra/policy.ts` | Risk classification for reads, local writes, external actions, and destructive actions |
| `lib/lyra/tool-registry.ts` | Explicit tool capability metadata for future MCP and skill adapters |
| `lib/obsidian/vault.ts` | Safe Markdown discovery and bounded note reads/writes |
| `lib/obsidian/workflows.ts` | Capture, search, daily planning, task, and project-brief workflows |
| `app/api/assistant/route.ts` | Local assistant request boundary |
| `app/api/status/route.ts` | Non-sensitive local readiness information |

## Testing and verification

The minimum verification loop is:

```bash
npm run build
```

The project has been verified against a temporary fixture vault for search, preview-only capture, confirmed capture, and bounded file creation. A production build succeeds with the LYRA interface and both local API routes. The Next.js build currently reports a tracing warning because the server-side vault adapter intentionally uses filesystem operations; this is documented as a packaging concern for a future standalone deployment rather than a runtime failure.

Before enabling personal-vault writes, test with a disposable vault containing representative Markdown notes. Confirm that search returns expected paths, preview mode creates no files, confirmed mode writes only inside the configured folder, and the `LYRA_AUTO_WRITE` setting is understood by the operator.

## Roadmap

The next local milestones are a richer structured response renderer, a persistent settings view, explicit MCP adapter contracts, skill manifests, calendar and task-provider adapters, event-safe automation, and a local packaging flow for Windows. Hosted deployment is intentionally deferred until the local version is stable. A future hosted mode should use a sanitized sample vault or a local companion bridge rather than copying a private vault into a public service.

## Attribution and license

The orb foundation is derived from the MIT-licensed upstream project [ULTRON Orb UI](https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds), whose original visual and interaction work is preserved in this repository. The upstream project also documents its relationship to the creator’s broader ULTRON interface work at [sagartamang.com/projects/ultron](https://sagartamang.com/projects/ultron). LYRA-specific additions are authored for this private personal repository.

## References

[1]: https://nextjs.org/docs Next.js documentation — application framework and routing.

[2]: https://threejs.org/docs/ Three.js documentation — 3D scene and rendering library.

[3]: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web MediaPipe Hand Landmarker for Web — hand tracking capability.

[4]: https://github.com/SAGAR-TAMANG/ultron-by-sagar-builds Upstream ULTRON Orb UI repository — preserved orb baseline and MIT license.
