"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { createOrbScene, type OrbSceneApi } from "@/lib/orbScene";
import { HandTracker, type TrackerStatus } from "@/lib/handTracker";

type CameraState = "off" | "starting" | "on" | "error";
type ChatMessage = { role: "aegis" | "user"; text: string };
type AssistantResponse = { text?: string; requiresConfirmation?: boolean; changedPath?: string; sources?: Array<{ path: string; title: string; excerpt: string; score: number }> };
type StatusPayload = { vaultConfigured: boolean; modelConfigured: boolean; autoWrite: boolean };
type SpeechRecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

type QuickAction = {
  label: string;
  description: string;
  prompt: string;
};

const MODE_LABEL: Record<TrackerStatus["mode"], string> = {
  idle: "STANDBY",
  spin: "SPIN",
  zoom: "ZOOM",
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Capture an idea", description: "Save a thought to Obsidian", prompt: "Capture this idea in my Obsidian vault." },
  { label: "Plan today", description: "Build a focused daily plan", prompt: "Read my current priorities and propose a plan for today." },
  { label: "Find in my brain", description: "Search personal knowledge", prompt: "Search my Obsidian knowledge base for relevant context." },
  { label: "Shape a brief", description: "Turn notes into direction", prompt: "Create a concise project brief from my related notes." },
];

export default function AegisOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<OrbSceneApi | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const memoryHydratedRef = useRef(false);
  const [camera, setCamera] = useState<CameraState>("off");
  const [status, setStatus] = useState<TrackerStatus>({ hands: 0, mode: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [working, setWorking] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);
  const [vaultReady, setVaultReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "aegis",
      text: "Your local workspace is ready. I can help you capture, plan, search, and turn scattered context into a next action.",
    },
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = createOrbScene(container);
    sceneRef.current = scene;
    return () => {
      trackerRef.current?.stop();
      trackerRef.current = null;
      speechRef.current?.stop();
      speechRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (memoryHydratedRef.current) return;
    try {
      const saved = window.localStorage.getItem("aegis-session-messages");
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.every((message) => message && (message.role === "aegis" || message.role === "user") && typeof message.text === "string")) {
          setMessages(parsed.slice(-20));
        }
      }
    } catch {
      // Session memory is best-effort and never blocks the local workspace.
    }
    const speechWindow = window as SpeechWindow;
    setVoiceAvailable(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
    memoryHydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!memoryHydratedRef.current) return;
    try {
      window.localStorage.setItem("aegis-session-messages", JSON.stringify(messages.slice(-20)));
    } catch {
      // Storage can be unavailable in private browsing; the session still works.
    }
  }, [messages]);

  const toggleVoice = useCallback(() => {
    const speechWindow = window as SpeechWindow;
    if (listening) {
      speechRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setDraft((current) => `${current}${current ? " " : ""}${transcript}`);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    speechRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [listening]);

  const stopGestures = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    setCamera("off");
    setStatus({ hands: 0, mode: "idle" });
  }, []);

  const startGestures = useCallback(async () => {
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay || trackerRef.current) return;

    setCamera("starting");
    setError(null);

    const tracker = new HandTracker(video, overlay, {
      onRotate: (dt, dp) => sceneRef.current?.rotateBy(dt, dp),
      onZoom: (factor) => sceneRef.current?.zoomBy(factor),
      onStatus: setStatus,
    });
    trackerRef.current = tracker;

    try {
      await tracker.start();
      setCamera("on");
    } catch (err) {
      trackerRef.current = null;
      tracker.stop();
      setCamera("error");
      setError(err instanceof DOMException && err.name === "NotAllowedError" ? "CAMERA ACCESS DENIED" : "TRACKING INIT FAILED");
    }
  }, []);

  const toggleGestures = useCallback(() => {
    if (trackerRef.current) stopGestures();
    else void startGestures();
  }, [startGestures, stopGestures]);

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json() as Promise<StatusPayload>)
      .then((payload) => {
        setVaultReady(payload.vaultConfigured);
        setModelReady(payload.modelConfigured);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case "+":
        case "=":
          sceneRef.current?.zoomIn();
          break;
        case "-":
        case "_":
          sceneRef.current?.zoomOut();
          break;
        case "r":
        case "R":
          sceneRef.current?.resetView();
          break;
        case "g":
        case "G":
          toggleGestures();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleGestures]);

  const submitPrompt = useCallback(async (prompt: string, confirm = false) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || working) return;

    if (!confirm) setMessages((current) => [...current, { role: "user", text: cleanPrompt }]);
    setDraft("");
    if (confirm) setPendingConfirmation(null);
    setWorking(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: cleanPrompt, confirm }),
      });
      if (!response.ok) throw new Error("Assistant request failed");
      const payload = (await response.json()) as AssistantResponse;
      if (payload.requiresConfirmation) setPendingConfirmation(cleanPrompt);
      else setPendingConfirmation(null);
      const sourceSuffix = payload.sources?.length ? `\n\nSources:\n${payload.sources.map((source) => `• ${source.path}`).join("\n")}` : "";
      setMessages((current) => [...current, { role: "aegis", text: `${payload.text ?? "I could not form a response for that request."}${sourceSuffix}` }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "aegis",
          text: "I’m still local and ready, but the assistant route is not configured yet. Your request stayed in this session and no vault files were changed.",
        },
      ]);
    } finally {
      setWorking(false);
    }
  }, [working]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitPrompt(draft);
  };

  const cameraOn = camera === "on";

  return (
    <>
      <div ref={containerRef} className="orb-root" />
      <div className="overlay-vignette" />
      <div className="overlay-grain" />
      <div className="overlay-scanlines" />

      <div className="hud hud-title">
        A.E.G.I.S.
        <div className="hud-subtitle">Local personal operating layer</div>
      </div>

      <div className="hud hud-hint">
        <div><span className="key">DRAG</span> spin&nbsp;&nbsp; <span className="key">SCROLL</span> zoom</div>
        {cameraOn ? (
          <div><span className="key">PINCH + MOVE</span> spin&nbsp;&nbsp; <span className="key">PINCH BOTH HANDS ± SPREAD</span> zoom</div>
        ) : (
          <div><span className="key">G</span> hand gestures&nbsp;&nbsp; <span className="key">R</span> reset&nbsp;&nbsp; <span className="key">+/−</span> zoom</div>
        )}
      </div>

      <div className="hud hud-controls">
        <div className={`camera-panel${cameraOn ? " visible" : ""}`}>
          <video ref={videoRef} muted playsInline className="camera-video" />
          <canvas ref={overlayRef} width={208} height={156} className="camera-overlay" />
          <div className="camera-status">
            {status.hands > 0 ? `${status.hands} HAND${status.hands > 1 ? "S" : ""} · ${MODE_LABEL[status.mode]}` : "SHOW HANDS"}
          </div>
        </div>
        {error && <div className="hud-error">{error}</div>}
        <div className="hud-row">
          <button type="button" className="hud-btn" aria-pressed={cameraOn} onClick={toggleGestures} disabled={camera === "starting"}>
            {camera === "starting" ? "INITIALIZING…" : cameraOn ? "GESTURES ON" : "GESTURES OFF"}
          </button>
        </div>
        <div className="hud-row">
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomIn()} aria-label="Zoom in">+</button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.zoomOut()} aria-label="Zoom out">−</button>
          <button type="button" className="hud-btn" onClick={() => sceneRef.current?.resetView()}>RESET</button>
        </div>
      </div>

      <aside className="assistant-rail" aria-label="AEGIS local assistant">
        <header className="assistant-header">
          <div>
            <div className="eyebrow">Personal workspace / 01</div>
            <h1 className="assistant-name">AEGIS</h1>
            <p className="assistant-tagline">A private layer for thinking, planning, and making the next move.</p>
          </div>
          <div className="status-stack">
            <div className="status-pill"><span className="status-dot" />LOCAL · {vaultReady ? "VAULT READY" : "VAULT SETUP"}</div>
            <div className="model-pill">{modelReady ? "ROUTER · ADAPTIVE" : "ROUTER · OFFLINE"}</div>
          </div>
        </header>

        <div className="assistant-content">
          <div className="intro-card">
            <strong>Good to have you back.</strong>
            <p>Start with a workflow or tell me what is on your mind. I will keep the vault boundary visible before anything is written.</p>
          </div>

          <section aria-labelledby="quick-actions-label">
            <div id="quick-actions-label" className="section-label">Quick workflows</div>
            <div className="quick-grid">
              {QUICK_ACTIONS.map((action) => (
                <button key={action.label} type="button" className="quick-action" onClick={() => void submitPrompt(action.prompt)} disabled={working}>
                  <strong>{action.label}</strong>
                  <span>{action.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="chat-list" aria-live="polite" aria-label="Conversation">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-message${message.role === "user" ? " user" : ""}`}>
                <small>{message.role === "user" ? "You" : "Aegis"}</small>
                {message.text}
              </div>
            ))}
            {working && <div className="chat-message"><small>Aegis</small>Thinking locally…</div>}
            {pendingConfirmation && (
              <div className="confirmation-card">
                <div><strong>Local write ready</strong><span>AEGIS will write only inside your configured vault boundary.</span></div>
                <div className="confirmation-actions">
                  <button type="button" className="confirm-btn" onClick={() => void submitPrompt(pendingConfirmation, true)}>Confirm write</button>
                  <button type="button" className="cancel-btn" onClick={() => setPendingConfirmation(null)}>Not now</button>
                </div>
              </div>
            )}
          </section>
        </div>

        <form className="assistant-composer" onSubmit={onSubmit}>
          <input className="composer-input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Tell AEGIS what you need…" aria-label="Message AEGIS" />
          <button type="button" className={`voice-btn${listening ? " active" : ""}`} onClick={toggleVoice} disabled={!voiceAvailable} aria-label={voiceAvailable ? (listening ? "Stop listening" : "Start voice input") : "Voice input unavailable"} title={voiceAvailable ? "Voice input" : "Voice input unavailable in this browser"}>{listening ? "●" : "◉"}</button>
          <button className="composer-submit" type="submit" aria-label="Send message" disabled={working || !draft.trim()}>↗</button>
        </form>
      </aside>
    </>
  );
}
