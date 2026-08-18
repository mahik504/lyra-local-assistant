# Hosting Decision for AEGIS

The local-first version is the correct first milestone because the primary data source is a private Obsidian vault and the user’s microphone and local filesystem are part of the intended experience. Hosting should be considered only after the local workflows are trusted and the vault boundary has been exercised with real notes.

## Options

| Approach | Tradeoffs | Cost | Setup complexity |
| --- | --- | --- | --- |
| Keep AEGIS on the user’s Windows computer | Best privacy and direct vault access; the computer must be running for access, sharing is not automatic, and external integrations remain local | No additional hosting service; model-provider usage may still apply if configured | Low after the local setup |
| Hosted UI with a local companion bridge | A hosted interface can be reachable from anywhere while a small local bridge keeps the real vault and microphone on the user’s computer; requires authentication, bridge updates, secure pairing, and careful network policy | Hosted service and any model-provider usage; bridge can remain free to run locally | Medium to high |
| Hosted read-only demo with sanitized sample vault | Easiest way to show the visual product publicly; cannot safely expose the real vault and does not represent the full personal workflow | Depends on the selected hosting provider and model usage | Low to medium |

The selected decision is **local-first now, hosted later if the local version works well**. No real vault is uploaded, no external action connector is enabled, and no public deployment has been performed in this milestone.

## Hosting gates

A hosted bridge should not be started until local verification covers bounded file access, explicit write confirmation, model failure fallback, browser permission failure, and recovery from a missing or renamed vault folder. If hosting becomes useful, the first hosted artifact should be a read-only sanitized demo or a private authenticated UI that never receives raw vault content unless a specific note is intentionally selected.

## Reference links

[1]: https://nextjs.org/docs Next.js documentation.

[2]: https://manus.im/desktop Local desktop connection information.
