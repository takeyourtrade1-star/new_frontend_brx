"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Camera,
  CheckCircle2,
  Crown,
  Layers,
  ListPlus,
  Mic,
  MicOff,
  MessageSquare,
  Plus,
  PackageOpen,
  RefreshCw,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trophy,
  Users,
  UserRound,
  Video,
  VideoOff,
  Expand,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";

// Video assets
const opponentTableImage = "/main-table.png";
const myTableImage = "/table-player.png";
const playerWebcamVideo = "/player.mp4";
const judgeCameraVideo = "/giudice.mp4";

type AppSection =
  | "matchCenter"
  | "decklist"
  | "createTournament"
  | "liveTournaments"
  | "marketplace"
  | "cart"
  | "readyOneDay";

type WindowKey = "player" | "opponent" | "watchLive";

type WindowState = {
  isOpen: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  prev?: { x: number; y: number; width: number; height: number };
};

const appSections: { key: AppSection; labelKey: AppSection; icon: any }[] = [
  { key: "matchCenter", labelKey: "matchCenter", icon: Crown },
  { key: "decklist", labelKey: "decklist", icon: Layers },
  { key: "createTournament", labelKey: "createTournament", icon: ListPlus },
  { key: "liveTournaments", labelKey: "liveTournaments", icon: Trophy },
  { key: "marketplace", labelKey: "marketplace", icon: ShoppingBag },
  { key: "cart", labelKey: "cart", icon: ShoppingCart },
  { key: "readyOneDay", labelKey: "readyOneDay", icon: PackageOpen },
];

// Simplified translations for the adapted component
const translations: Record<string, any> = {
  it: {
    workspace: "Workspace",
    sectionLabels: {
      matchCenter: "Match Center",
      decklist: "Decklist",
      createTournament: "Crea Torneo",
      liveTournaments: "Tornei Live",
      marketplace: "Marketplace",
      cart: "Carrello",
      readyOneDay: "Ready One Day",
    },
    topTitle: "Neo-Tactile Arena • Live Match",
    roundLabel: "Round 4",
    mainStreamTitle: "Stream principale",
    mic: "Microfono",
    camera: "Camera",
    quickToggle: "Toggle rapido",
    openWindow: "Apri finestra",
    cameraOff: "Camera off",
    judgeFeed: "Feed Judge",
    judgeOnline: "Judge_Miler online. Integrità del match verificata.",
    liveScoreboard: "Scoreboard live",
    spectatorChat: "Chat spettatori",
    typing: "Alex_M sta scrivendo...",
    cardmarketValue: "Valore Cardmarket",
    valueBullets: [
      "Riduzione esposizione spedizioni UPU",
      "Ready One Day: dispatch 24h da hub locali",
      "Zero CAPEX: margine extra con fulfillment gestito",
    ],
  },
  en: {
    workspace: "Workspace",
    sectionLabels: {
      matchCenter: "Match Center",
      decklist: "Decklist",
      createTournament: "Create Tournament",
      liveTournaments: "Live Tournaments",
      marketplace: "Marketplace",
      cart: "Cart",
      readyOneDay: "Ready One Day",
    },
    topTitle: "Neo-Tactile Arena • Live Match",
    roundLabel: "Round 4",
    mainStreamTitle: "Main Stream",
    mic: "Microphone",
    camera: "Camera",
    quickToggle: "Quick Toggle",
    openWindow: "Open Window",
    cameraOff: "Camera off",
    judgeFeed: "Judge Feed",
    judgeOnline: "Judge_Miler online. Match integrity verified.",
    liveScoreboard: "Live Scoreboard",
    spectatorChat: "Spectator Chat",
    typing: "Alex_M is typing...",
    cardmarketValue: "Cardmarket Value",
    valueBullets: [
      "Reduced UPU shipping exposure",
      "Ready One Day: 24h dispatch from local hubs",
      "Zero CAPEX: extra margin with managed fulfillment",
    ],
  },
  de: {
    workspace: "Workspace",
    sectionLabels: {
      matchCenter: "Match Center",
      decklist: "Decklist",
      createTournament: "Turnier erstellen",
      liveTournaments: "Live-Turniere",
      marketplace: "Marktplatz",
      cart: "Warenkorb",
      readyOneDay: "Ready One Day",
    },
    topTitle: "Neo-Tactile Arena • Live Match",
    roundLabel: "Runde 4",
    mainStreamTitle: "Hauptstream",
    mic: "Mikrofon",
    camera: "Kamera",
    quickToggle: "Schnellumschaltung",
    openWindow: "Fenster öffnen",
    cameraOff: "Kamera aus",
    judgeFeed: "Judge Feed",
    judgeOnline: "Judge_Miler online. Match-Integrität verifiziert.",
    liveScoreboard: "Live-Scoreboard",
    spectatorChat: "Zuschauer-Chat",
    typing: "Alex_M tippt...",
    cardmarketValue: "Cardmarket-Wert",
    valueBullets: [
      "Reduzierte UPU-Versandbelastung",
      "Ready One Day: 24h-Dispatch von lokalen Hubs",
      "Null CAPEX: Extra-Marge mit verwaltetem Fulfillment",
    ],
  },
};

const cannedMessages: Record<string, string[]> = {
  it: [
    "Alex_M: linea pulita, prossimo turno lethal.",
    "Sarah_J: sideboard pronta, attendo il judge.",
    "Judge_Miler: controllo tempi approvato, continuate.",
    "Spectator89: combo assurda, compro ora le carte mancanti.",
  ],
  en: [
    "Alex_M: clean line, pushing lethal next turn.",
    "Sarah_J: sideboard swap ready, waiting judge.",
    "Judge_Miler: timing check approved, continue play.",
    "Spectator89: this combo is wild, buying the missing cards now.",
  ],
  de: [
    "Alex_M: klare Linie, nächster Zug ist lethal.",
    "Sarah_J: Sideboard-Tausch bereit, warte auf Judge.",
    "Judge_Miler: Zeit-Check bestätigt, Spiel fortsetzen.",
    "Spectator89: diese Combo ist wild, ich kaufe die fehlenden Karten jetzt.",
  ],
};

const score = [
  { player: "Alex_M", hp: 20, energy: 6 },
  { player: "Sarah_J", hp: 18, energy: 5 },
];

export function HeroLiveSectionAdapted() {
  const { selectedLang } = useLanguage();
  const desktopRef = useRef<HTMLDivElement>(null);
  const selfVideoRef = useRef<HTMLVideoElement>(null);
  const dragRef = useRef<{
    key: WindowKey;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [activeSection, setActiveSection] = useState<AppSection>("matchCenter");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [camError, setCamError] = useState<string>("");
  const [zCounter, setZCounter] = useState(10);
  const [messages, setMessages] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [watchEventId, setWatchEventId] = useState<string | null>(null);

  const [windows, setWindows] = useState<Record<WindowKey, WindowState>>({
    player: { isOpen: false, isMaximized: false, x: 300, y: 100, width: 500, height: 400, zIndex: 10 },
    opponent: { isOpen: false, isMaximized: false, x: 820, y: 100, width: 500, height: 400, zIndex: 10 },
    watchLive: { isOpen: false, isMaximized: false, x: 560, y: 200, width: 500, height: 400, zIndex: 10 },
  });

  const tx = translations[selectedLang] || translations.en;
  const langMessages = cannedMessages[selectedLang] || cannedMessages.en;

  // Webcam setup
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startStream = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream;
        }
        setCamError("");
      } catch (err) {
        setCamError("Camera access denied or unavailable");
      }
    };

    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
    };

    if (camOn) {
      startStream();
    }

    return () => stopStream();
  }, [camOn]);

  // Chat animation
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          const newMsg = langMessages[Math.floor(Math.random() * langMessages.length)];
          setMessages((prev) => [...prev.slice(-3), newMsg]);
        }, 2000);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [langMessages]);

  const bringToFront = (key: WindowKey) => {
    setZCounter((prev) => {
      const next = prev + 1;
      setWindows((state) => ({
        ...state,
        [key]: { ...state[key], zIndex: next },
      }));
      return next;
    });
  };

  const openWindow = (key: WindowKey) => {
    bringToFront(key);
    setWindows((prev) => ({
      ...prev,
      [key]: { ...prev[key], isOpen: true },
    }));
  };

  const closeWindow = (key: WindowKey) => {
    if (key === "watchLive") {
      setWatchEventId(null);
    }
    setWindows((prev) => ({
      ...prev,
      [key]: { ...prev[key], isOpen: false },
    }));
  };

  const toggleMaximize = (key: WindowKey) => {
    const container = desktopRef.current;
    if (!container) return;

    setWindows((prev) => {
      const win = prev[key];
      if (win.isMaximized && win.prev) {
        return {
          ...prev,
          [key]: {
            ...win,
            isMaximized: false,
            x: win.prev.x,
            y: win.prev.y,
            width: win.prev.width,
            height: win.prev.height,
            prev: undefined,
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...win,
          isMaximized: true,
          prev: { x: win.x, y: win.y, width: win.width, height: win.height },
          x: 8,
          y: 8,
          width: container.clientWidth - 16,
          height: container.clientHeight - 16,
        },
      };
    });
    bringToFront(key);
  };

  const startDrag = (event: React.MouseEvent<HTMLDivElement>, key: WindowKey) => {
    const target = windows[key];
    if (target.isMaximized) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      key,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    bringToFront(key);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const { key, offsetX, offsetY } = dragRef.current;
      setWindows((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          x: e.clientX - offsetX,
          y: e.clientY - offsetY,
        },
      }));
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const renderMatchCard = ({
    userLabel,
    opponentLabel,
    tableImage,
    webcamSlot,
    onExpand,
  }: {
    userLabel: string;
    opponentLabel: string;
    tableImage: string;
    webcamSlot: React.ReactNode;
    onExpand: () => void;
  }) => (
    <div className="relative overflow-hidden rounded-xl border border-white/15 bg-zinc-900">
      <div
        className="h-[245px] w-full bg-no-repeat"
        style={{
          backgroundImage: `url(${tableImage})`,
          backgroundColor: "#1f2937",
          backgroundPosition: "center",
          backgroundSize: "contain",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/0" />
      <div className="absolute left-3 top-3 rounded-md border border-white/15 bg-black/45 px-2 py-1 text-[11px] text-zinc-100 backdrop-blur-md">
        {userLabel}
      </div>
      <div className="absolute left-3 top-9 rounded-md border border-white/10 bg-black/35 px-2 py-1 text-[10px] text-zinc-300 backdrop-blur-md">
        vs {opponentLabel}
      </div>
      <div className="absolute right-3 top-3 w-40 overflow-hidden rounded-lg border border-white/20 bg-black/55 backdrop-blur-md">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] text-zinc-300">
          <span>Webcam</span>
          <span className="text-emerald-300">LIVE</span>
        </div>
        {webcamSlot}
      </div>
      <button
        type="button"
        onClick={onExpand}
        className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md border border-white/20 bg-black/45 px-2 py-1 text-[10px] text-zinc-100 backdrop-blur-md"
      >
        <Expand className="h-3 w-3" />
        {tx.openWindow}
      </button>
    </div>
  );

  return (
    <div
      ref={desktopRef}
      className="relative overflow-visible rounded-[28px] border border-zinc-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.18)]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-zinc-500">{tx.topTitle}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Bell className="h-3.5 w-3.5 text-zinc-500" />
          {tx.roundLabel}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[0.17fr_0.83fr] gap-3 p-3">
        {/* Left sidebar */}
        <aside className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">{tx.workspace}</p>
          <div className="mt-3 space-y-1.5">
            {appSections.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:bg-white/70"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? "text-blue-600" : "text-zinc-400"}`} />
                  {tx.sectionLabels[item.labelKey]}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center and right content */}
        <div
          className={`relative items-start gap-3 ${
            activeSection === "matchCenter" ? "grid grid-cols-[0.69fr_0.31fr]" : "block"
          }`}
        >
          {/* Match Center content */}
          {activeSection === "matchCenter" && (
            <>
              <div className="relative h-fit min-h-[560px] self-start space-y-3 rounded-xl border border-zinc-200 bg-zinc-950 p-3 pb-4">
                {/* Stream controls */}
                <div className="mb-1 flex items-center justify-between rounded-xl border border-white/15 bg-white/8 px-3 py-2 backdrop-blur-xl">
                  <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-zinc-200">
                    <Camera className="h-3.5 w-3.5 text-emerald-300" />
                    {tx.mainStreamTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMicOn((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${
                        micOn
                          ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                          : "border-white/15 bg-black/25 text-zinc-200"
                      }`}
                    >
                      {micOn ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                      {tx.mic}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCamOn((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition ${
                        camOn
                          ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100"
                          : "border-white/15 bg-black/25 text-zinc-200"
                      }`}
                    >
                      {camOn ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                      {tx.camera}
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-white/15 bg-black/25 px-2.5 py-1.5 text-xs text-zinc-200"
                      onClick={() => {
                        setMicOn((prev) => !prev);
                        setCamOn((prev) => !prev);
                      }}
                    >
                      {tx.quickToggle}
                    </button>
                  </div>
                </div>

                {/* Match cards */}
                {renderMatchCard({
                  userLabel: "You • Local Player (Default View)",
                  opponentLabel: "Alex_M",
                  tableImage: myTableImage,
                  onExpand: () => openWindow("player"),
                  webcamSlot: camOn ? (
                    <video
                      ref={selfVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="h-20 w-full bg-zinc-900 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-full items-center justify-center bg-zinc-900 text-[11px] text-zinc-400">
                      {tx.cameraOff}
                    </div>
                  ),
                })}

                {renderMatchCard({
                  userLabel: "Alex_M • Opponent",
                  opponentLabel: "You",
                  tableImage: opponentTableImage,
                  onExpand: () => openWindow("opponent"),
                  webcamSlot: (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="h-20 w-full bg-zinc-900 object-cover"
                      src={playerWebcamVideo}
                    />
                  ),
                })}
                {camError ? (
                  <div className="absolute right-5 top-13 rounded-md bg-rose-500/90 px-2 py-1 text-[10px] text-white">
                    {camError}
                  </div>
                ) : null}
              </div>

              {/* Right sidebar */}
              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-700">{tx.judgeFeed}</p>
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <div className="mt-2 overflow-hidden rounded-md border border-zinc-200">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                      className="h-22 w-full bg-zinc-900 object-cover"
                      src={judgeCameraVideo}
                    />
                    <p className="bg-white px-2 py-1.5 text-[11px] leading-5 text-zinc-600">
                      {tx.judgeOnline}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-700">{tx.liveScoreboard}</p>
                    <Users className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <div className="mt-2 space-y-1.5 text-[11px]">
                    {score.map((row) => (
                      <div key={row.player} className="rounded-md bg-white px-2 py-1.5 text-zinc-700">
                        <div className="flex justify-between">
                          <span>{row.player}</span>
                          <span>HP {row.hp}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-zinc-500">Energy {row.energy}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-700">{tx.spectatorChat}</p>
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                  </div>
                  <div className="space-y-1.5 text-[11px] text-zinc-700">
                    {messages.map((message, idx) => (
                      <p key={idx} className="rounded-md bg-white px-2 py-1.5 leading-5">
                        {message}
                      </p>
                    ))}
                    {typing ? (
                      <p className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1.5 text-blue-700">
                        {tx.typing}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-800">{tx.cardmarketValue}</p>
                  <div className="mt-2 space-y-1.5 text-[11px] text-emerald-700">
                    {tx.valueBullets.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Decklist content */}
          {activeSection === "decklist" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Decklist Manager</h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#FF7300] px-3 py-1.5 text-xs font-medium text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Deck
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Esper Midrange", format: "Standard", cards: 60 },
                  { name: "Rakdos Sacrifice", format: "Standard", cards: 60 },
                  { name: "Mono Red Aggro", format: "Standard", cards: 60 },
                ].map((deck, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{deck.name}</p>
                        <p className="text-[10px] text-zinc-500">{deck.format} • {deck.cards} cards</p>
                      </div>
                      <Layers className="h-4 w-4 text-zinc-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Tournament content */}
          {activeSection === "createTournament" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Create Tournament</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 mb-1">Tournament Name</label>
                  <input
                    type="text"
                    placeholder="Enter tournament name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 mb-1">Format</label>
                    <select className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900">
                      <option>Standard</option>
                      <option>Pioneer</option>
                      <option>Modern</option>
                      <option>Commander</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 mb-1">Max Players</label>
                    <input
                      type="number"
                      placeholder="64"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs text-zinc-900"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full rounded-md bg-[#FF7300] px-4 py-2 text-xs font-medium text-white"
                >
                  Create Tournament
                </button>
              </div>
            </div>
          )}

          {/* Live Tournaments content */}
          {activeSection === "liveTournaments" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <h3 className="text-sm font-semibold text-zinc-900 mb-4">Live Tournaments</h3>
              <div className="space-y-3">
                {[
                  { name: "Neo Tactical Finals", format: "Standard", status: "LIVE", viewers: "4.6K" },
                  { name: "Mythic Pro League", format: "Modern", status: "LIVE", viewers: "2.3K" },
                  { name: "Cardmarket Weekly", format: "Pioneer", status: "In 35m", viewers: "-" },
                ].map((tournament, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{tournament.name}</p>
                        <p className="text-[10px] text-zinc-500">{tournament.format}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-semibold ${tournament.status === "LIVE" ? "text-emerald-600" : "text-zinc-500"}`}>
                          {tournament.status}
                        </p>
                        <p className="text-[10px] text-zinc-400">{tournament.viewers} viewers</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Marketplace content */}
          {activeSection === "marketplace" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Vault Marketplace</h3>
                <div className="flex items-center gap-2">
                  <Search className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search cards..."
                    className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: "Black Lotus", price: "€12,500" },
                  { name: "Force of Will", price: "€95" },
                  { name: "Sheoldred", price: "€12" },
                ].map((card, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3 text-center">
                    <div className="h-16 bg-zinc-100 rounded mb-2" />
                    <p className="text-[10px] font-medium text-zinc-900 truncate">{card.name}</p>
                    <p className="text-[10px] text-[#FF7300] font-semibold">{card.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart content */}
          {activeSection === "cart" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Shopping Cart</h3>
                <ShoppingCart className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Sheoldred, the Apocalypse", qty: 2, price: "€24" },
                  { name: "Fable of the Mirror-Breaker", qty: 1, price: "€18" },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{item.name}</p>
                        <p className="text-[10px] text-zinc-500">Qty: {item.qty}</p>
                      </div>
                      <p className="text-xs font-semibold text-zinc-900">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-zinc-700">Total</p>
                  <p className="text-sm font-bold text-zinc-900">€42</p>
                </div>
                <button
                  type="button"
                  className="w-full rounded-md bg-[#FF7300] px-4 py-2 text-xs font-medium text-white"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}

          {/* Ready One Day content */}
          {activeSection === "readyOneDay" && (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-900">Ready One Day</h3>
                <PackageOpen className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4">
                <p className="text-[11px] text-emerald-800 font-medium mb-2">24h Dispatch Guarantee</p>
                <p className="text-[10px] text-emerald-700">
                  Cards graded, verified and shipped from local hubs within 24 hours.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { zone: "Italy Hub", status: "Active", cards: 234 },
                  { zone: "Germany Hub", status: "Active", cards: 189 },
                  { zone: "France Hub", status: "Active", cards: 156 },
                ].map((hub, idx) => (
                  <div key={idx} className="rounded-lg border border-zinc-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-zinc-900">{hub.zone}</p>
                        <p className="text-[10px] text-zinc-500">{hub.cards} cards ready</p>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">{hub.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draggable windows */}
      {(["player", "opponent", "watchLive"] as const).map((key) => {
        const win = windows[key];
        if (!win.isOpen) return null;

        const title =
          key === "player"
            ? "You • Local Player Window"
            : key === "opponent"
              ? "Alex_M • Opponent Window"
              : "Live Tournament • Match Center";
        const tableImage = key === "player" ? myTableImage : opponentTableImage;
        const webcamContent =
          key === "player" ? (
            camOn ? (
              <video
                ref={selfVideoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-xs text-zinc-400">
                {tx.cameraOff}
              </div>
            )
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              src={playerWebcamVideo}
            />
          );

        return (
          <div
            key={key}
            style={{
              left: win.x,
              top: win.y,
              width: win.width,
              height: win.height,
              zIndex: win.zIndex,
            }}
            className="absolute overflow-hidden rounded-xl border border-zinc-300/80 bg-zinc-950/96 shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
            onMouseDown={() => bringToFront(key)}
          >
            <div
              className="flex cursor-move items-center justify-between border-b border-white/10 bg-zinc-900/55 px-2.5 py-1.5 backdrop-blur-lg"
              onMouseDown={(event) => startDrag(event, key)}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Close window"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => closeWindow(key)}
                  className="h-2.5 w-2.5 rounded-full bg-rose-400"
                />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <button
                  type="button"
                  aria-label="Maximize window"
                  onMouseDown={(event) => event.stopPropagation()}
                  onClick={() => toggleMaximize(key)}
                  className="h-2.5 w-2.5 rounded-full bg-emerald-400"
                />
                <p className="ml-1 text-[11px] text-zinc-200">{title}</p>
              </div>
              <div />
            </div>
            <div className="relative h-[calc(100%-38px)] bg-zinc-900">
              <div
                className="h-full w-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${tableImage})`,
                  backgroundPosition: "center",
                  backgroundSize: "contain",
                }}
              />
              <div className="absolute top-3 right-3 h-24 w-44 overflow-hidden rounded-lg border border-white/20 bg-black/60">
                {webcamContent}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
