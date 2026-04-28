"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Bell,
  Camera,
  CheckCircle2,
  ClipboardList,
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
import { useLanguage } from "@/components/feature/tornei-live/i18n/LanguageProvider";
import type { Language } from "@/components/feature/tornei-live/i18n/translations";

const cannedMessagesByLanguage: Record<Language, readonly string[]> = {
  de: [
    "Alex_M: klare Linie, nächster Zug ist lethal.",
    "Sarah_J: Sideboard-Tausch bereit, warte auf Judge.",
    "Judge_Miler: Zeit-Check bestätigt, Spiel fortsetzen.",
    "Spectator89: diese Combo ist wild, ich kaufe die fehlenden Karten jetzt.",
  ],
  en: [
    "Alex_M: clean line, pushing lethal next turn.",
    "Sarah_J: sideboard swap ready, waiting judge.",
    "Judge_Miler: timing check approved, continue play.",
    "Spectator89: this combo is wild, buying the missing cards now.",
  ],
  it: [
    "Alex_M: linea pulita, prossimo turno lethal.",
    "Sarah_J: sideboard pronta, attendo il judge.",
    "Judge_Miler: controllo tempi approvato, continuate.",
    "Spectator89: combo assurda, compro ora le carte mancanti.",
  ],
} as const;

const opponentTableImage = "/main-table.png";
const myTableImage = "/table-player.png";
const playerWebcamVideo = "/player.mp4";
const judgeCameraVideo = "/giudice.mp4";
const starterCardNames = [
  "Sheoldred, the Apocalypse",
  "Leyline Binding",
  "Counterspell",
  "Fable of the Mirror-Breaker",
  "Raffine, Scheming Seer",
  "Fatal Push",
  "Memory Deluge",
  "Spell Pierce",
] as const;

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

type DeckGroup = {
  id: string;
  name: string;
  count: number;
};

type DeckItem = {
  id: string;
  name: string;
  groupId: string;
  main: number;
  side: number;
  cardNames: string[];
};

type ScryfallCard = {
  name: string;
  image: string;
  type: string;
};

type TournamentRules = {
  bestOf: "BO1" | "BO3";
  swissRounds: number;
  topCut: number;
  judgeRequired: boolean;
  decklistLocked: boolean;
  webcamMandatory: boolean;
  maxRoundMinutes: number;
};

type TournamentItem = {
  id: string;
  name: string;
  format: string;
  slots: number;
  start: string;
  status: "draft" | "scheduled" | "live";
  prizePool: string;
  entrants: number;
  checkIns: number;
  currentRound: string;
  topPlayers: { name: string; record: string; points: number }[];
  recentMatches: { table: string; players: string; result: string; state: string }[];
};

type LiveTournamentItem = {
  id: string;
  title: string;
  format: string;
  status: "live" | "upcoming" | "started";
  viewers: number;
  startsIn?: string;
  image?: string;
  table?: { p1: string; p2: string; score: string };
  round?: string;
  top8?: { name: string; points: number }[];
};

type MarketplaceCard = {
  id: string;
  name: string;
  image: string;
  setName: string;
  rarity: string;
  eurPrice: string;
  usdPrice: string;
  finish: string;
  oneDayReady: boolean;
  language: string;
};

type CartItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  condition: string;
  language: string;
};

const curatedMarketplaceCards = [
  "Black Lotus",
  "Force of Will",
  "Mana Crypt",
  "Mox Opal",
  "Jeweled Lotus",
  "Underground Sea",
  "Volcanic Island",
  "Tropical Island",
  "Tundra",
  "Polluted Delta",
  "Misty Rainforest",
  "Scalding Tarn",
  "Ragavan, Nimble Pilferer",
  "Sheoldred, the Apocalypse",
  "The One Ring",
  "Orcish Bowmasters",
  "Solitude",
  "Fable of the Mirror-Breaker",
  "Jace, the Mind Sculptor",
  "Liliana of the Veil",
  "Wrenn and Six",
  "Teferi, Time Raveler",
] as const;

const liveTournaments: LiveTournamentItem[] = [
  {
    id: "live-neo-finals",
    title: "Neo Tactical Finals",
    format: "Standard",
    status: "live",
    viewers: 4600,
    image: "/magic-the-gathering-arena-v1-570303.jpg",
    table: { p1: "Alex_M", p2: "Sarah_J", score: "1 - 1" },
    round: "Top 8 • Round 3",
    top8: [
      { name: "Alex_M", points: 9 },
      { name: "Sarah_J", points: 9 },
      { name: "Luca_K", points: 7 },
    ],
  },
  {
    id: "upcoming-weekly",
    title: "Cardmarket Weekly Cup",
    format: "Pioneer",
    status: "upcoming",
    viewers: 0,
    startsIn: "starts in 35m",
  },
  {
    id: "upcoming-ready",
    title: "Ready One Day Clash",
    format: "Modern",
    status: "upcoming",
    viewers: 0,
    startsIn: "starts in 1h 20m",
  },
  {
    id: "started-prime",
    title: "TCG Arena Prime",
    format: "Standard",
    status: "started",
    viewers: 1800,
    startsIn: "Round 5 ongoing",
    round: "Swiss • Round 5",
  },
  {
    id: "live-mythic",
    title: "Mythic Pro League",
    format: "Modern",
    status: "live",
    viewers: 2300,
    table: { p1: "Miller_Q", p2: "Nova_R", score: "0 - 1" },
    round: "Top 16 • Round 2",
    top8: [
      { name: "Nova_R", points: 8 },
      { name: "Miller_Q", points: 6 },
      { name: "Yuna_P", points: 6 },
    ],
  },
  {
    id: "started-sunday",
    title: "Sunday Vault Open",
    format: "Commander",
    status: "started",
    viewers: 900,
    startsIn: "Pairings published",
    round: "Swiss • Pairings out",
  },
];

const appSections: { key: AppSection; labelKey: AppSection; icon: ComponentType<{ className?: string }> }[] = [
  { key: "matchCenter", labelKey: "matchCenter", icon: Crown },
  { key: "decklist", labelKey: "decklist", icon: Layers },
  { key: "createTournament", labelKey: "createTournament", icon: ListPlus },
  { key: "liveTournaments", labelKey: "liveTournaments", icon: Trophy },
  { key: "marketplace", labelKey: "marketplace", icon: ShoppingBag },
  { key: "cart", labelKey: "cart", icon: ShoppingCart },
  { key: "readyOneDay", labelKey: "readyOneDay", icon: PackageOpen },
];

const desktopTranslations: Record<
  Language,
  {
    workspace: string;
    sectionLabels: Record<AppSection, string>;
    liveHubTitle: string;
    liveHubSubtitle: string;
    searchPlaceholder: string;
    eventsLabel: string;
    watchLive: string;
    joinTournament: string;
    registered: string;
    joinQueue: string;
    liveScoreFeed: string;
    createTournamentTitle: string;
    createTournamentSubtitle: string;
    newTournament: string;
    myTournaments: string;
    selectTournamentHint: string;
    qualityPromiseTitle: string;
    oneDayReady: string;
    marketplaceTitle: string;
    marketplaceSubtitle: string;
    availableSellers: string;
    cartTitle: string;
  }
> = {
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
    liveHubTitle: "Live-Turnier Hub",
    liveHubSubtitle:
      "Entdecke Live-Tische, verfolge Scoreboards und tritt kommenden Events direkt bei.",
    searchPlaceholder: "Event, Format oder Spieler suchen...",
    eventsLabel: "Events",
    watchLive: "Live ansehen",
    joinTournament: "Turnier beitreten",
    registered: "Registriert",
    joinQueue: "Beitritts-Queue",
    liveScoreFeed: "Live-Score Feed",
    createTournamentTitle: "Turnier erstellen",
    createTournamentSubtitle: "Verwalte deine Turniere und erstelle neue Events on demand.",
    newTournament: "Neues Turnier",
    myTournaments: "Meine Turniere",
    selectTournamentHint: "Wähle ein Turnier aus der Liste oder erstelle ein neues.",
    qualityPromiseTitle: "Qualität & Logistik-Versprechen",
    oneDayReady: "One Day Ready",
    marketplaceTitle: "Vault Marktplatz",
    marketplaceSubtitle:
      "One Day Ready Karten: gradet, geprüft und am selben Tag versandt.",
    availableSellers: "Verfügbare Verkäufer",
    cartTitle: "Warenkorb",
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
    liveHubTitle: "Live Tournaments Hub",
    liveHubSubtitle:
      "Discover live tables, track scoreboards, and join upcoming events in one flow.",
    searchPlaceholder: "Search event, format, player...",
    eventsLabel: "events",
    watchLive: "Watch Live",
    joinTournament: "Join Tournament",
    registered: "Registered",
    joinQueue: "Join Queue",
    liveScoreFeed: "Live Score Feed",
    createTournamentTitle: "Create Tournament",
    createTournamentSubtitle: "Manage your tournaments and create new events on demand.",
    newTournament: "New Tournament",
    myTournaments: "My Tournaments",
    selectTournamentHint: "Select a tournament from the list or create a new one.",
    qualityPromiseTitle: "Quality & Logistics Promise",
    oneDayReady: "One Day Ready",
    marketplaceTitle: "Vault Marketplace",
    marketplaceSubtitle:
      "One Day Ready cards: graded, quality-checked and shipped same day.",
    availableSellers: "Available Sellers",
    cartTitle: "Cart",
  },
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
    liveHubTitle: "Hub Tornei Live",
    liveHubSubtitle:
      "Scopri tavoli live, monitora scoreboards e iscriviti ai prossimi eventi in un unico flusso.",
    searchPlaceholder: "Cerca evento, formato, giocatore...",
    eventsLabel: "eventi",
    watchLive: "Guarda Live",
    joinTournament: "Iscriviti al torneo",
    registered: "Iscritto",
    joinQueue: "Coda iscrizioni",
    liveScoreFeed: "Feed punteggi live",
    createTournamentTitle: "Crea Torneo",
    createTournamentSubtitle: "Gestisci i tuoi tornei e crea nuovi eventi on demand.",
    newTournament: "Nuovo Torneo",
    myTournaments: "I miei tornei",
    selectTournamentHint: "Seleziona un torneo dalla lista oppure creane uno nuovo.",
    qualityPromiseTitle: "Promessa Qualità & Logistica",
    oneDayReady: "One Day Ready",
    marketplaceTitle: "Vault Marketplace",
    marketplaceSubtitle:
      "Carte One Day Ready: gradate, controllate e spedite il giorno stesso.",
    availableSellers: "Venditori disponibili",
    cartTitle: "Carrello",
  },
};

const desktopUiCopy: Record<
  Language,
  {
    topTitle: string;
    roundLabel: string;
    mainStreamTitle: string;
    mic: string;
    camera: string;
    quickToggle: string;
    openWindow: string;
    cameraOff: string;
    judgeFeed: string;
    judgeOnline: string;
    liveScoreboard: string;
    spectatorChat: string;
    typing: string;
    cardmarketValue: string;
    valueBullets: [string, string, string];
    tabs: { forYou: string; live: string; upcoming: string; started: string };
    viewers: string;
    watching: string;
    warmup: string;
    judgeVerified: string;
    bracketSoon: string;
    openRegistration: string;
    manageSpot: string;
    startRegistration: string;
    openStream: string;
    close: string;
    back: string;
    continue: string;
    confirmRegistration: string;
    buyNow: string;
    addToCart: string;
    backToCatalog: string;
    cartEmpty: string;
    cartCheckout: string;
    cartSubtotal: string;
  }
> = {
  de: {
    topTitle: "Neo-Tactile Arena • Live-Match",
    roundLabel: "Runde 4",
    mainStreamTitle: "Main Match Stream • Zwei-Tisch Ansicht",
    mic: "Mikrofon",
    camera: "Kamera",
    quickToggle: "Schnellumschalter",
    openWindow: "Fenster öffnen",
    cameraOff: "Kamera aus",
    judgeFeed: "Judge Feed",
    judgeOnline: "Judge_Miler ist online. Match-Integrität verifiziert.",
    liveScoreboard: "Live-Scoreboard",
    spectatorChat: "Zuschauer-Chat",
    typing: "schreibt...",
    cardmarketValue: "Cardmarket Mehrwert",
    valueBullets: [
      "Reduzierte UPU-sensitive Versandexposition",
      "Ready One Day: 24h Versand aus lokalen Hubs",
      "Kein CAPEX: Margen-Plus durch gemanagtes Fulfillment",
    ],
    tabs: { forYou: "Für dich", live: "Live", upcoming: "Bevorstehend", started: "Gestartet" },
    viewers: "Zuschauer",
    watching: "sehen zu",
    warmup: "Warmup",
    judgeVerified: "Judge verifiziert",
    bracketSoon: "Bracket-Details folgen bald",
    openRegistration: "Registrierung offen",
    manageSpot: "Platz verwalten",
    startRegistration: "Registrierung starten",
    openStream: "Stream öffnen",
    close: "Schließen",
    back: "Zurück",
    continue: "Weiter",
    confirmRegistration: "Registrierung bestätigen",
    buyNow: "Jetzt kaufen",
    addToCart: "In den Warenkorb",
    backToCatalog: "Zurück zum Katalog",
    cartEmpty: "Dein Warenkorb ist noch leer.",
    cartCheckout: "Schnell-Checkout",
    cartSubtotal: "Zwischensumme",
  },
  en: {
    topTitle: "Neo-Tactile Arena • Live Match",
    roundLabel: "Round 4",
    mainStreamTitle: "Main Match Stream • Two-table View",
    mic: "Mic",
    camera: "Camera",
    quickToggle: "Quick Toggle",
    openWindow: "Open Window",
    cameraOff: "Camera off",
    judgeFeed: "Judge Feed",
    judgeOnline: "Judge_Miler is online. Match integrity verified.",
    liveScoreboard: "Live Scoreboard",
    spectatorChat: "Spectator Chat",
    typing: "typing...",
    cardmarketValue: "Cardmarket Value",
    valueBullets: [
      "Reduced UPU-sensitive shipping exposure",
      "Ready One Day: 24h dispatch from local hubs",
      "No CAPEX: margin upside via managed fulfillment",
    ],
    tabs: { forYou: "For You", live: "Live", upcoming: "Upcoming", started: "Started" },
    viewers: "viewers",
    watching: "watching",
    warmup: "Warmup",
    judgeVerified: "Judge verified",
    bracketSoon: "Bracket details available soon",
    openRegistration: "Open registration",
    manageSpot: "Manage spot",
    startRegistration: "Start registration",
    openStream: "Open Stream",
    close: "Close",
    back: "Back",
    continue: "Continue",
    confirmRegistration: "Confirm registration",
    buyNow: "Buy now",
    addToCart: "Add to cart",
    backToCatalog: "Back to catalog",
    cartEmpty: "Your cart is empty.",
    cartCheckout: "Quick checkout",
    cartSubtotal: "Subtotal",
  },
  it: {
    topTitle: "Neo-Tactile Arena • Match Live",
    roundLabel: "Round 4",
    mainStreamTitle: "Stream principale • Vista doppio tavolo",
    mic: "Microfono",
    camera: "Camera",
    quickToggle: "Toggle rapido",
    openWindow: "Apri finestra",
    cameraOff: "Camera spenta",
    judgeFeed: "Feed Judge",
    judgeOnline: "Judge_Miler online. Integrita del match verificata.",
    liveScoreboard: "Scoreboard live",
    spectatorChat: "Chat spettatori",
    typing: "sta scrivendo...",
    cardmarketValue: "Valore Cardmarket",
    valueBullets: [
      "Riduzione esposizione spedizioni sensibili UPU",
      "Ready One Day: dispatch 24h da hub locali",
      "Zero CAPEX: margine extra con fulfillment gestito",
    ],
    tabs: { forYou: "Per te", live: "Live", upcoming: "In arrivo", started: "Avviati" },
    viewers: "spettatori",
    watching: "in visione",
    warmup: "Warmup",
    judgeVerified: "Judge verificato",
    bracketSoon: "Dettagli bracket disponibili a breve",
    openRegistration: "Registrazione aperta",
    manageSpot: "Gestisci posto",
    startRegistration: "Avvia registrazione",
    openStream: "Apri stream",
    close: "Chiudi",
    back: "Indietro",
    continue: "Continua",
    confirmRegistration: "Conferma registrazione",
    buyNow: "Compra ora",
    addToCart: "Aggiungi al carrello",
    backToCatalog: "Torna al catalogo",
    cartEmpty: "Il tuo carrello e vuoto.",
    cartCheckout: "Checkout rapido",
    cartSubtotal: "Subtotale",
  },
};

const readyOneDayCopy: Record<
  Language,
  {
    title: string;
    subtitle: string;
    badge: string;
    objectiveTitle: string;
    objectiveBody: string;
    objectivePoints: [string, string, string];
    processTitle: string;
    processSteps: [string, string, string, string];
    stepLabel: string;
    simulatorTitle: string;
    zoneLabel: string;
    cardsReceived: string;
    gradedQueue: string;
    sameDayReady: string;
    latency: string;
    apiPanelTitle: string;
    apiStatus: string;
    placementLabel: string;
    placementOptions: [string, string, string];
    outcomesTitle: string;
    outcomes: [string, string, string];
    pricingTitle: string;
    pricingBody: string;
    flowLabel: string;
    flowNodes: [string, string, string, string];
    chartATitle: string;
    chartABeforeLabel: string;
    chartAAfterLabel: string;
    chartBTitle: string;
    chartBBaselineLabel: string;
    chartBLocalizedLabel: string;
  }
> = {
  de: {
    title: "Ready One Day Control Tower",
    subtitle:
      "Verkäufer senden Karten an unsere Zentren: wir graden, verteilen national/international und synchronisieren den Bestand automatisch.",
    badge: "Live Hub Simulation",
    objectiveTitle: "Das Ziel",
    objectiveBody:
      "Ein europaweites Hub-Netzwerk, in das ihr und eure Händler Karten direkt einsenden. Wir prüfen, graden, listen und synchronisieren Bestände in Echtzeit.",
    objectivePoints: [
      "Lokale Einspeisung in nationale und internationale Hubs.",
      "Qualitätskontrolle + Grading vor dem Marketplace-Listing.",
      "API-first Verbindung zu eurem Stock und Routing-Logik.",
    ],
    processTitle: "Operativer Ablauf",
    processSteps: [
      "Inbound von Verkäufernetzwerken",
      "Expert Grading & Qualitätskontrolle",
      "Zuweisung zu regionalen Hubs",
      "Auto-Sync auf gesponserte Placements",
    ],
    stepLabel: "Schritt",
    simulatorTitle: "Hub-Simulator nach Zone",
    zoneLabel: "Aktive Zone",
    cardsReceived: "Heute eingegangene Karten",
    gradedQueue: "Im Grading-Queue",
    sameDayReady: "Heute versandbereit",
    latency: "API Sync Latenz",
    apiPanelTitle: "API Zugriff & Distribution",
    apiStatus: "Sync Status",
    placementLabel: "Routing-Modus",
    placementOptions: ["National First", "Hybrid Balance", "International Boost"],
    outcomesTitle: "Stock Movement",
    outcomes: [
      "National verfügbar in Echtzeit bei steigender Nachfrage.",
      "Dynamische Umlagerung zwischen Hub-Netzen in Sekunden.",
      "Schneller Dispatch steigert Conversion und Verfügbarkeit.",
    ],
    pricingTitle: "Exklusives Angebotsmodell",
    pricingBody:
      "Unsere Provision beträgt 10% auf den Verkaufspreis jeder Karte, mit einem maximalen Deckel von 100 EUR pro Karte. Ihr steuert den finalen Endkundenpreis frei und behaltet den kompletten zusätzlichen Margenhebel.",
    flowLabel: "Flow",
    flowNodes: ["Vendors", "Grading", "Hub Pool", "Dispatch"],
    chartATitle: "Dispatch-Speed (vor/nach Hub-Routing)",
    chartABeforeLabel: "Vor Hub-Routing",
    chartAAfterLabel: "Nach Ready One Day",
    chartBTitle: "Sell-through-Uplift nach Lokalisierung",
    chartBBaselineLabel: "Baseline Sell-through",
    chartBLocalizedLabel: "Lokalisierter Sell-through",
  },
  en: {
    title: "Ready One Day Control Tower",
    subtitle:
      "Sellers send inventory to our centers: we grade, route across national/international hubs, and auto-sync availability.",
    badge: "Live Hub Simulation",
    objectiveTitle: "The Goal",
    objectiveBody:
      "Build a multi-hub European network where you and your sellers ship cards directly to us. We grade, verify quality, list on marketplace, and keep stock synchronized via APIs.",
    objectivePoints: [
      "Local intake through national and cross-border hubs.",
      "Quality control and grading before marketplace activation.",
      "API-first integration for inventory, routing, and dispatch.",
    ],
    processTitle: "Operational Flow",
    processSteps: [
      "Inbound from seller networks",
      "Expert grading & quality verification",
      "Regional hub assignment",
      "Auto-sync to sponsored placements",
    ],
    stepLabel: "Step",
    simulatorTitle: "Zone-to-Hub Simulator",
    zoneLabel: "Active zone",
    cardsReceived: "Cards received today",
    gradedQueue: "Grading queue",
    sameDayReady: "Ready same-day",
    latency: "API sync latency",
    apiPanelTitle: "API Access & Distribution",
    apiStatus: "Sync status",
    placementLabel: "Routing mode",
    placementOptions: ["National First", "Hybrid Balance", "International Boost"],
    outcomesTitle: "Stock Movement",
    outcomes: [
      "National availability activates instantly based on demand.",
      "Dynamic transfer between hub networks in seconds.",
      "Fast dispatch improves conversion and sell-through.",
    ],
    pricingTitle: "Exclusive Commercial Model",
    pricingBody:
      "Our commission is 10% of each card's sale price, capped at a maximum of EUR 100 per card. You keep full control of resale pricing and capture the entire additional margin upside.",
    flowLabel: "Flow",
    flowNodes: ["Vendors", "Grading", "Hub Pool", "Dispatch"],
    chartATitle: "Dispatch Speed (before/after hub routing)",
    chartABeforeLabel: "Before hub routing",
    chartAAfterLabel: "After Ready One Day",
    chartBTitle: "Sell-through uplift after stock localization",
    chartBBaselineLabel: "Baseline sell-through",
    chartBLocalizedLabel: "Localized stock sell-through",
  },
  it: {
    title: "Ready One Day Network",
    subtitle:
      "Creiamo una rete di hub europei dove voi e i vostri venditori spedite direttamente le carte: noi le gradiamo, le verifichiamo, le pubblichiamo sul marketplace e sincronizziamo tutto via API.",
    badge: "Simulazione live hub",
    objectiveTitle: "Obiettivo strategico",
    objectiveBody:
      "Avere piu hub in Europa per ridurre i tempi di consegna, aumentare il sell-through e integrare la logistica 24h direttamente nella vostra piattaforma.",
    objectivePoints: [
      "Invio diretto delle carte dai venditori verso hub locali.",
      "Grading e controllo qualità prima della messa online.",
      "Sync automatico con stock, routing e marketplace via API complete.",
    ],
    processTitle: "Come funziona",
    processSteps: [
      "Inbound stock da voi e dalla rete venditori",
      "Grading professionale e quality check",
      "Smistamento verso hub regionali UE",
      "Sync automatico su stock e marketplace",
    ],
    stepLabel: "Step",
    simulatorTitle: "Simulatore zona->hub",
    zoneLabel: "Zona attiva",
    cardsReceived: "Carte ricevute oggi",
    gradedQueue: "In coda grading",
    sameDayReady: "Pronte in giornata",
    latency: "Latenza sync API",
    apiPanelTitle: "Accesso API & Distribution",
    apiStatus: "Stato sync",
    placementLabel: "Modalità routing",
    placementOptions: ["National First", "Hybrid Balance", "International Boost"],
    outcomesTitle: "Movimento stock",
    outcomes: [
      "Disponibilità nazionale attivata in tempo reale in base alla domanda.",
      "Riallocazione dinamica tra hub nazionali e internazionali.",
      "Dispatch veloce aumenta conversione e sell-through.",
    ],
    pricingTitle: "Modello commerciale esclusivo",
    pricingBody:
      "La nostra commissione e del 10% sul prezzo di vendita di ogni carta, con un tetto massimo di 100 EUR per carta. Voi mantenete pieno controllo sul prezzo di rivendita e trattenete tutto l'upside di margine aggiuntivo.",
    flowLabel: "Flusso",
    flowNodes: ["Venditori", "Grading", "Hub Pool", "Spedizione"],
    chartATitle: "Velocità dispatch (prima/dopo hub routing)",
    chartABeforeLabel: "Prima del routing hub",
    chartAAfterLabel: "Dopo Ready One Day",
    chartBTitle: "Uplift sell-through dopo localizzazione stock",
    chartBBaselineLabel: "Sell-through baseline",
    chartBLocalizedLabel: "Sell-through con stock localizzato",
  },
};

function useLiveChat(language: Language) {
  const cannedMessages = cannedMessagesByLanguage[language];
  const [messages, setMessages] = useState<string[]>([cannedMessages[0], cannedMessages[1]]);
  const [typing, setTyping] = useState(false);
  const [index, setIndex] = useState(2);

  useEffect(() => {
    const cycle = setInterval(() => {
      setTyping(true);
      setTimeout(() => {
        const target = cannedMessages[index % cannedMessages.length];
        setMessages((prev) => [...prev.slice(-3), target]);
        setTyping(false);
        setIndex((prev) => prev + 1);
      }, 1800);
    }, 18000);

    return () => clearInterval(cycle);
  }, [cannedMessages, index]);

  return { messages, typing };
}

function DesktopWindow() {
  const { language } = useLanguage();
  const tx = desktopTranslations[language];
  const ui = desktopUiCopy[language];
  const ready = readyOneDayCopy[language];
  const { messages, typing } = useLiveChat(language);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState("");
  const [activeSection, setActiveSection] = useState<AppSection>("matchCenter");
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [scryfallCards, setScryfallCards] = useState<Record<string, ScryfallCard>>({});
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newCardName, setNewCardName] = useState("");
  const [tournamentName, setTournamentName] = useState("Neo Pro Cup");
  const [tournamentFormat, setTournamentFormat] = useState("Standard");
  const [tournamentSlots, setTournamentSlots] = useState(128);
  const [tournamentStart, setTournamentStart] = useState("21:00 CET");
  const [entryFee, setEntryFee] = useState("€9.90");
  const [prizePool, setPrizePool] = useState("€2,000 + Store Credit");
  const [rules, setRules] = useState<TournamentRules>({
    bestOf: "BO3",
    swissRounds: 7,
    topCut: 8,
    judgeRequired: true,
    decklistLocked: true,
    webcamMandatory: true,
    maxRoundMinutes: 50,
  });
  const [tournamentErrors, setTournamentErrors] = useState<string[]>([]);
  const [publishStatus, setPublishStatus] = useState<"idle" | "publishing" | "published">("idle");
  const [showTournamentForm, setShowTournamentForm] = useState(false);
  const [myTournaments, setMyTournaments] = useState<TournamentItem[]>([
    {
      id: "tour-neo-weekly",
      name: "Neo Weekly Cup",
      format: "Standard",
      slots: 128,
      start: "Tue 21:00 CET",
      status: "scheduled",
      prizePool: "€2,100 + Store Credit",
      entrants: 74,
      checkIns: 52,
      currentRound: "Lobby / Check-in",
      topPlayers: [
        { name: "Kai_M", record: "4-0", points: 12 },
        { name: "Luna_T", record: "3-1", points: 9 },
        { name: "Milo_Z", record: "3-1", points: 9 },
      ],
      recentMatches: [
        { table: "T2", players: "Kai_M vs Nix_A", result: "2-0", state: "finished" },
        { table: "T7", players: "Luna_T vs Rey_S", result: "2-1", state: "finished" },
      ],
    },
    {
      id: "tour-vault-open",
      name: "Vault Open Qualifier",
      format: "Pioneer",
      slots: 64,
      start: "Thu 20:30 CET",
      status: "draft",
      prizePool: "€900",
      entrants: 21,
      checkIns: 0,
      currentRound: "Not started",
      topPlayers: [
        { name: "Pending", record: "-", points: 0 },
        { name: "Pending", record: "-", points: 0 },
        { name: "Pending", record: "-", points: 0 },
      ],
      recentMatches: [{ table: "-", players: "No matches yet", result: "-", state: "pending" }],
    },
  ]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("tour-neo-weekly");
  const [liveTab, setLiveTab] = useState<"forYou" | "live" | "upcoming" | "started">("live");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinStep, setJoinStep] = useState(1);
  const [selectedJoinId, setSelectedJoinId] = useState<string | null>(null);
  const [joinNickname, setJoinNickname] = useState("VaultPlayer_97");
  const [joinDeckName, setJoinDeckName] = useState("Esper Midrange Vault");
  const [joinRulesAccepted, setJoinRulesAccepted] = useState(false);
  const [joinedTournamentIds, setJoinedTournamentIds] = useState<string[]>([]);
  const [watchEventId, setWatchEventId] = useState<string | null>(null);
  const [marketQuery, setMarketQuery] = useState("");
  const [marketCards, setMarketCards] = useState<MarketplaceCard[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState("");
  const [selectedMarketCardId, setSelectedMarketCardId] = useState<string | null>(null);
  const [marketView, setMarketView] = useState<"catalog" | "detail">("catalog");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedHubZone, setSelectedHubZone] = useState<"it" | "de" | "fr" | "es" | "benelux">(
    "it",
  );
  const [apiSyncEnabled, setApiSyncEnabled] = useState(true);
  const [sponsoredPlacement, setSponsoredPlacement] = useState("Hero Placement");
  const [stockSyncedAt, setStockSyncedAt] = useState<string>(
    language === "de" ? "Noch nicht synchronisiert" : language === "it" ? "Non ancora sincronizzato" : "Not synced yet",
  );
  const [stockStats, setStockStats] = useState({
    imported: 1284,
    playable: 964,
    missing: 12,
  });
  const [deckGroups, setDeckGroups] = useState<DeckGroup[]>([
    { id: "group-control", name: "Control Shells", count: 32 },
    { id: "group-midrange", name: "Midrange Pressure", count: 24 },
    { id: "group-aggro", name: "Aggro Staples", count: 18 },
  ]);
  const [selectedGroupId, setSelectedGroupId] = useState("group-control");
  const [decks, setDecks] = useState<DeckItem[]>([
    {
      id: "deck-esper",
      name: "Esper Midrange Vault",
      groupId: "group-control",
      main: 60,
      side: 15,
      cardNames: starterCardNames.slice(0, 4),
    },
    {
      id: "deck-grixis",
      name: "Grixis Pressure",
      groupId: "group-midrange",
      main: 60,
      side: 15,
      cardNames: starterCardNames.slice(4, 8),
    },
  ]);
  const [selectedDeckId, setSelectedDeckId] = useState("deck-esper");
  const [, setZCounter] = useState(30);
  const [windows, setWindows] = useState<Record<WindowKey, WindowState>>({
    player: {
      isOpen: false,
      isMaximized: false,
      x: 28,
      y: 18,
      width: 560,
      height: 320,
      zIndex: 21,
    },
    opponent: {
      isOpen: false,
      isMaximized: false,
      x: 92,
      y: 72,
      width: 560,
      height: 320,
      zIndex: 20,
    },
    watchLive: {
      isOpen: false,
      isMaximized: false,
      x: 120,
      y: 96,
      width: 760,
      height: 470,
      zIndex: 22,
    },
  });
  const selfVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ key: WindowKey; offsetX: number; offsetY: number } | null>(null);

  const score = useMemo(
    () => [
      { player: "Alex_M", hp: 20, energy: 6 },
      { player: "Sarah_J", hp: 18, energy: 5 },
    ],
    [],
  );
  const selectedDeck = useMemo(
    () => decks.find((deck) => deck.id === selectedDeckId) ?? decks[0],
    [decks, selectedDeckId],
  );
  const selectedJoinTournament = useMemo(
    () => liveTournaments.find((item) => item.id === selectedJoinId) ?? null,
    [selectedJoinId],
  );
  const selectedMyTournament = useMemo(
    () => myTournaments.find((item) => item.id === selectedTournamentId) ?? myTournaments[0] ?? null,
    [myTournaments, selectedTournamentId],
  );
  const watchEvent = useMemo(
    () => liveTournaments.find((item) => item.id === watchEventId) ?? null,
    [watchEventId],
  );
  const selectedMarketCard = useMemo(
    () => marketCards.find((card) => card.id === selectedMarketCardId) ?? marketCards[0] ?? null,
    [marketCards, selectedMarketCardId],
  );
  const marketplaceSellers = useMemo(() => {
    if (!selectedMarketCard) return [];
    const base = Number(selectedMarketCard.eurPrice.replace(",", "."));
    const safeBase = Number.isFinite(base) && base > 0 ? base : 12;
    return [
      { name: "Vault Prime Milano", rating: "4.9", eta: "Ships today", stock: 3, price: (safeBase + 0.4).toFixed(2) },
      { name: "Neo Hub Berlin", rating: "4.8", eta: "Ships today", stock: 2, price: (safeBase + 0.9).toFixed(2) },
      { name: "ReadyOneDay Paris", rating: "5.0", eta: "Courier same-day", stock: 1, price: (safeBase + 1.3).toFixed(2) },
    ];
  }, [selectedMarketCard]);
  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems],
  );
  const readyZoneMetrics = useMemo(
    () =>
      ({
        it: { hub: "Milano Hub", received: 1840, queue: 126, ready: 1494, latency: "120ms", sla: "24h national" },
        de: { hub: "Berlin Hub", received: 1630, queue: 118, ready: 1360, latency: "98ms", sla: "24h national" },
        fr: { hub: "Paris Hub", received: 1425, queue: 97, ready: 1198, latency: "132ms", sla: "24h national" },
        es: { hub: "Madrid Hub", received: 1188, queue: 84, ready: 1016, latency: "146ms", sla: "24-36h" },
        benelux: { hub: "Amsterdam Hub", received: 975, queue: 70, ready: 832, latency: "110ms", sla: "24h national" },
      })[selectedHubZone],
    [selectedHubZone],
  );
  const liveCardList = useMemo(() => {
    if (liveTab === "forYou") {
      return liveTournaments.filter((item) => item.status === "live" || item.status === "upcoming");
    }
    return liveTournaments.filter((item) => item.status === liveTab);
  }, [liveTab]);

  const openJoinFlow = (id: string) => {
    setSelectedJoinId(id);
    setJoinStep(1);
    setJoinRulesAccepted(false);
    setShowJoinModal(true);
  };

  const openWatchLive = (id: string) => {
    setWatchEventId(id);
    openWindow("watchLive");
  };

  const addSelectedCardToCart = (openCart: boolean) => {
    if (!selectedMarketCard) return;
    const base = Number(selectedMarketCard.eurPrice.replace(",", "."));
    const safePrice = Number.isFinite(base) && base > 0 ? base : 12;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === selectedMarketCard.id);
      if (existing) {
        return prev.map((item) =>
          item.id === selectedMarketCard.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [
        ...prev,
        {
          id: selectedMarketCard.id,
          name: selectedMarketCard.name,
          image: selectedMarketCard.image,
          price: safePrice,
          qty: 1,
          condition: "NM",
          language: selectedMarketCard.language,
        },
      ];
    });
    if (openCart) setActiveSection("cart");
  };

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      const container = desktopRef.current;
      if (!drag || !container) return;

      const containerRect = container.getBoundingClientRect();
      const nextX = event.clientX - containerRect.left - drag.offsetX;
      const nextY = event.clientY - containerRect.top - drag.offsetY;

      setWindows((prev) => ({
        ...prev,
        [drag.key]: { ...prev[drag.key], x: nextX, y: nextY },
      }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [windows]);

  useEffect(() => {
    const stopStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (selfVideoRef.current) {
        selfVideoRef.current.srcObject = null;
      }
    };

    const enableCamera = async () => {
      try {
        setCamError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        streamRef.current = stream;
        if (selfVideoRef.current) {
          selfVideoRef.current.srcObject = stream;
        }
      } catch {
        setCamOn(false);
        setCamError("Camera permission denied or unavailable.");
      }
    };

    if (camOn) {
      void enableCamera();
    } else {
      stopStream();
    }

    return () => stopStream();
  }, [camOn]);

  useEffect(() => {
    const missingNames = Array.from(
      new Set(
        decks
          .flatMap((deck) => deck.cardNames)
          .filter((name) => !scryfallCards[name]),
      ),
    );
    if (!missingNames.length) return;

    let cancelled = false;
    const fetchCards = async () => {
      const results: Record<string, ScryfallCard> = {};

      await Promise.all(
        missingNames.map(async (name) => {
          try {
            const response = await fetch(
              `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
            );
            if (!response.ok) return;
            const data = (await response.json()) as {
              name?: string;
              type_line?: string;
              image_uris?: { normal?: string };
              card_faces?: Array<{ image_uris?: { normal?: string } }>;
            };

            const faceImage = data.card_faces?.[0]?.image_uris?.normal;
            const image = data.image_uris?.normal ?? faceImage;
            if (!data.name || !image) return;

            results[name] = {
              name: data.name,
              image,
              type: data.type_line ?? "Card",
            };
          } catch {
            // keep UI usable even if one card fails
          }
        }),
      );

      if (!cancelled && Object.keys(results).length) {
        setScryfallCards((prev) => ({ ...prev, ...results }));
      }
    };

    void fetchCards();
    return () => {
      cancelled = true;
    };
  }, [decks, scryfallCards]);

  useEffect(() => {
    const query = marketQuery.trim();

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setMarketLoading(true);
        setMarketError("");
        let nextCards: MarketplaceCard[] = [];
        if (query.length >= 2) {
          const response = await fetch(
            `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=usd&dir=desc`,
            { signal: controller.signal },
          );
          if (!response.ok) throw new Error("search_failed");
          const data = (await response.json()) as {
            data?: Array<{
              id: string;
              name: string;
              set_name?: string;
              rarity?: string;
              finishes?: string[];
              prices?: { eur?: string | null; usd?: string | null };
              lang?: string;
              image_uris?: { normal?: string; large?: string };
              card_faces?: Array<{ image_uris?: { normal?: string; large?: string } }>;
            }>;
          };
          nextCards = (data.data ?? []).slice(0, 28).map((card) => {
            const image =
              card.image_uris?.normal ??
              card.image_uris?.large ??
              card.card_faces?.[0]?.image_uris?.normal ??
              card.card_faces?.[0]?.image_uris?.large ??
              "";
            return {
              id: card.id,
              name: card.name,
              image,
              setName: card.set_name ?? "Unknown set",
              rarity: card.rarity ?? "rare",
              eurPrice: card.prices?.eur ?? "-",
              usdPrice: card.prices?.usd ?? "-",
              finish: card.finishes?.[0] ?? "nonfoil",
              oneDayReady: true,
              language: (card.lang ?? "en").toUpperCase(),
            };
          });
        } else {
          const byName = await Promise.all(
            curatedMarketplaceCards.map(async (name) => {
              const response = await fetch(
                `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
                { signal: controller.signal },
              );
              if (!response.ok) return null;
              const card = (await response.json()) as {
                id: string;
                name: string;
                set_name?: string;
                rarity?: string;
                finishes?: string[];
                prices?: { eur?: string | null; usd?: string | null };
                lang?: string;
                image_uris?: { normal?: string; large?: string };
                card_faces?: Array<{ image_uris?: { normal?: string; large?: string } }>;
              };
              const image =
                card.image_uris?.normal ??
                card.image_uris?.large ??
                card.card_faces?.[0]?.image_uris?.normal ??
                card.card_faces?.[0]?.image_uris?.large ??
                "";
              return {
                id: card.id,
                name: card.name,
                image,
                setName: card.set_name ?? "Unknown set",
                rarity: card.rarity ?? "rare",
                eurPrice: card.prices?.eur ?? "-",
                usdPrice: card.prices?.usd ?? "-",
                finish: card.finishes?.[0] ?? "nonfoil",
                oneDayReady: true,
                language: (card.lang ?? "en").toUpperCase(),
              } as MarketplaceCard;
            }),
          );
          nextCards = byName.filter((card): card is MarketplaceCard => Boolean(card));
        }

        setMarketCards(nextCards);
        setSelectedMarketCardId((prev) =>
          prev && nextCards.some((card) => card.id === prev) ? prev : nextCards[0]?.id ?? null,
        );
      } catch {
        if (!controller.signal.aborted) {
          setMarketError("Unable to load Scryfall cards right now.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setMarketLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [marketQuery]);

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

  const startDrag = (event: ReactMouseEvent<HTMLDivElement>, key: WindowKey) => {
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

  const handleSyncStock = () => {
    const imported = 1284 + Math.floor(Math.random() * 40);
    const playable = 964 + Math.floor(Math.random() * 25);
    const missing = Math.max(0, 12 - Math.floor(Math.random() * 3));
    setStockStats({ imported, playable, missing });
    const locale = language === "de" ? "de-DE" : language === "it" ? "it-IT" : "en-GB";
    setStockSyncedAt(new Date().toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }));
    setShowSyncModal(true);
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = `group-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const nextGroup: DeckGroup = { id, name, count: 0 };
    setDeckGroups((prev) => [nextGroup, ...prev]);
    setSelectedGroupId(id);
    setNewGroupName("");
    setShowNewGroupForm(false);
  };

  const handleCreateDeck = () => {
    const name = newDeckName.trim();
    if (!name) return;
    const id = `deck-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const nextDeck: DeckItem = {
      id,
      name,
      groupId: selectedGroupId,
      main: 0,
      side: 0,
      cardNames: [],
    };
    setDecks((prev) => [nextDeck, ...prev]);
    setDeckGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroupId ? { ...group, count: group.count } : group,
      ),
    );
    setSelectedDeckId(id);
    setNewDeckName("");
    setShowNewDeckForm(false);
  };

  const handleAddCardToDeck = () => {
    const cardName = newCardName.trim();
    if (!cardName || !selectedDeckId) return;

    setDecks((prev) =>
      prev.map((deck) =>
        deck.id === selectedDeckId
          ? {
              ...deck,
              cardNames: [...deck.cardNames, cardName],
              main: deck.main + 1,
            }
          : deck,
      ),
    );
    setDeckGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroupId ? { ...group, count: group.count + 1 } : group,
      ),
    );
    setNewCardName("");
  };

  const validateTournament = () => {
    const errors: string[] = [];
    if (!tournamentName.trim()) errors.push("Tournament name is required.");
    if (tournamentSlots < 8) errors.push("Minimum slots is 8.");
    if (tournamentSlots > 2048) errors.push("Maximum slots is 2048.");
    if (!tournamentStart.trim()) errors.push("Start time is required.");
    if (rules.swissRounds < 1) errors.push("Swiss rounds must be at least 1.");
    if (rules.topCut < 0) errors.push("Top cut cannot be negative.");
    if (rules.maxRoundMinutes < 20) errors.push("Round timer should be at least 20 minutes.");
    if (rules.topCut >= tournamentSlots) errors.push("Top cut must be lower than slots.");
    return errors;
  };

  const handlePublishTournament = () => {
    const errors = validateTournament();
    setTournamentErrors(errors);
    if (errors.length) {
      setPublishStatus("idle");
      return;
    }
    setPublishStatus("publishing");
    window.setTimeout(() => {
      setPublishStatus("published");
      const nextTournament: TournamentItem = {
        id: `tour-${Date.now()}`,
        name: tournamentName,
        format: tournamentFormat,
        slots: tournamentSlots,
        start: tournamentStart,
        status: "scheduled",
        prizePool,
        entrants: 0,
        checkIns: 0,
        currentRound: "Not started",
        topPlayers: [
          { name: "Pending", record: "-", points: 0 },
          { name: "Pending", record: "-", points: 0 },
          { name: "Pending", record: "-", points: 0 },
        ],
        recentMatches: [{ table: "-", players: "No matches yet", result: "-", state: "pending" }],
      };
      setMyTournaments((prev) => [nextTournament, ...prev]);
      setSelectedTournamentId(nextTournament.id);
      setShowTournamentForm(false);
      setTournamentErrors([]);
    }, 850);
  };

  const selectedDeckCards = (selectedDeck?.cardNames ?? []).map((cardName) => {
    const card = scryfallCards[cardName];
    return {
      name: card?.name ?? cardName,
      type: card?.type ?? "Loading from Scryfall...",
      image: card?.image ?? "",
    };
  });

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
        {ui.openWindow}
      </button>
    </div>
  );

  const renderMainContent = () => {
    switch (activeSection) {
      case "decklist":
        return (
          <div className="h-[560px] rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Decklist Builder</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Build decks from synchronized stock and grouped card pools
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncStock}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Sync Stock
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewDeckForm((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Deck
                </button>
              </div>
            </div>
            {showNewDeckForm ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                <input
                  value={newDeckName}
                  onChange={(event) => setNewDeckName(event.target.value)}
                  placeholder="Deck name (e.g. Azorius Control)"
                  className="h-8 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateDeck}
                  className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs text-white"
                >
                  Create
                </button>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-[0.34fr_0.66fr] gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-700">Deck Groups</p>
                  <button
                    type="button"
                    onClick={() => setShowNewGroupForm((prev) => !prev)}
                    className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-700"
                  >
                    <Plus className="mr-1 inline h-3 w-3" />
                    New Group
                  </button>
                </div>
                {showNewGroupForm ? (
                  <div className="mb-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-white p-2">
                    <input
                      value={newGroupName}
                      onChange={(event) => setNewGroupName(event.target.value)}
                      placeholder="Group name"
                      className="h-7 flex-1 rounded border border-zinc-300 px-2 text-[11px] text-zinc-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateGroup}
                      className="rounded bg-zinc-900 px-2 py-1 text-[11px] text-white"
                    >
                      Add
                    </button>
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  {deckGroups.map((group) => (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => {
                        setSelectedGroupId(group.id);
                        const firstDeckInGroup = decks.find((deck) => deck.groupId === group.id);
                        if (firstDeckInGroup) setSelectedDeckId(firstDeckInGroup.id);
                      }}
                      className={`w-full rounded-lg border px-2 py-2 text-left ${
                        selectedGroupId === group.id
                          ? "border-blue-300 bg-blue-50 text-blue-800"
                          : "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      <p className="text-xs font-medium">{group.name}</p>
                      <p className="mt-0.5 text-[10px] opacity-75">{group.count} synced cards</p>
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[11px] text-emerald-700">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  One-click export to tournament registration.
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-zinc-700">
                      Deck: {selectedDeck?.name ?? "No deck selected"}
                    </p>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
                      {selectedDeck ? `${selectedDeck.main} Main + ${selectedDeck.side} Side` : "0 Main + 0 Side"}
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                    <input
                      value={newCardName}
                      onChange={(event) => setNewCardName(event.target.value)}
                      placeholder="Add card by exact Scryfall name"
                      className="h-7 flex-1 rounded border border-zinc-300 bg-white px-2 text-[11px] text-zinc-700 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCardToDeck}
                      className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white"
                    >
                      Add Card
                    </button>
                  </div>
                  <div className="mb-2 flex items-center gap-1.5">
                    {decks
                      .filter((deck) => deck.groupId === selectedGroupId)
                      .map((deck) => (
                        <button
                          type="button"
                          key={deck.id}
                          onClick={() => setSelectedDeckId(deck.id)}
                          className={`rounded-md px-2 py-1 text-[10px] ${
                            selectedDeckId === deck.id
                              ? "bg-zinc-900 text-white"
                              : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {deck.name}
                        </button>
                      ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedDeckCards.length === 0 ? (
                      <div className="col-span-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
                        Empty deck. Add cards using Scryfall names above.
                      </div>
                    ) : null}
                    {selectedDeckCards.map((card, idx) => (
                      <div key={`${card.name}-${idx}`} className="rounded-lg border border-zinc-200 bg-white p-1.5">
                        {card.image ? (
                          <div
                            aria-label={card.name}
                            className="h-20 w-full rounded bg-cover bg-center"
                            style={{ backgroundImage: `url(${card.image})` }}
                          />
                        ) : (
                          <div className="flex h-20 w-full items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-500">
                            Loading card...
                          </div>
                        )}
                        <p className="mt-1 truncate text-[10px] font-medium text-zinc-700">
                          {card.name}
                        </p>
                        <p className="text-[10px] text-zinc-500">{card.type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-700">Stock Sync Status</p>
                  <p className="mt-1 text-[10px] text-zinc-500">Last sync: {stockSyncedAt}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="rounded-md border border-zinc-200 bg-white px-2 py-2">
                      <p className="text-zinc-500">Imported</p>
                      <p className="font-semibold text-zinc-800">{stockStats.imported.toLocaleString()} cards</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white px-2 py-2">
                      <p className="text-zinc-500">Playable</p>
                      <p className="font-semibold text-zinc-800">{stockStats.playable.toLocaleString()} cards</p>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white px-2 py-2">
                      <p className="text-zinc-500">Missing</p>
                      <p className="font-semibold text-zinc-800">{stockStats.missing} staples</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "createTournament":
        return (
          <div className="h-[560px] rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{tx.createTournamentTitle}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {tx.createTournamentSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTournamentForm((prev) => !prev);
                  setPublishStatus("idle");
                }}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                {tx.newTournament}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-[0.44fr_0.56fr] gap-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="mb-2 text-xs font-medium text-zinc-700">{tx.myTournaments}</p>
                <div className="space-y-2">
                  {myTournaments.map((tournament) => (
                    <button
                      type="button"
                      key={tournament.id}
                      onClick={() => setSelectedTournamentId(tournament.id)}
                      className={`w-full rounded-lg border bg-white p-2 text-left ${
                        selectedTournamentId === tournament.id
                          ? "border-zinc-900 ring-1 ring-zinc-900/15"
                          : "border-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-medium text-zinc-700">{tournament.name}</p>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                            tournament.status === "live"
                              ? "bg-rose-100 text-rose-700"
                              : tournament.status === "scheduled"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {tournament.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-500">
                        {tournament.format} • {tournament.slots} slots • {tournament.start}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {showTournamentForm ? (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-[11px] text-zinc-600">
                      Tournament Name
                      <input
                        value={tournamentName}
                        onChange={(event) => setTournamentName(event.target.value)}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      />
                    </label>
                    <label className="text-[11px] text-zinc-600">
                      Format
                      <select
                        value={tournamentFormat}
                        onChange={(event) => setTournamentFormat(event.target.value)}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      >
                        {["Standard", "Pioneer", "Modern", "Commander"].map((format) => (
                          <option key={format}>{format}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-[11px] text-zinc-600">
                      Slots
                      <input
                        type="number"
                        value={tournamentSlots}
                        onChange={(event) => setTournamentSlots(Number(event.target.value))}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      />
                    </label>
                    <label className="text-[11px] text-zinc-600">
                      Start
                      <input
                        value={tournamentStart}
                        onChange={(event) => setTournamentStart(event.target.value)}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      />
                    </label>
                    <label className="text-[11px] text-zinc-600">
                      Entry Fee
                      <input
                        value={entryFee}
                        onChange={(event) => setEntryFee(event.target.value)}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      />
                    </label>
                    <label className="text-[11px] text-zinc-600">
                      Prize Pool
                      <input
                        value={prizePool}
                        onChange={(event) => setPrizePool(event.target.value)}
                        className="mt-1 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-700 outline-none"
                      />
                    </label>
                  </div>

                  <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                    <p className="text-xs font-medium text-zinc-700">Rules & Integrity</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-600">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rules.judgeRequired}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, judgeRequired: event.target.checked }))
                          }
                        />
                        Judge required
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rules.decklistLocked}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, decklistLocked: event.target.checked }))
                          }
                        />
                        Decklist lock
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rules.webcamMandatory}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, webcamMandatory: event.target.checked }))
                          }
                        />
                        Webcam mandatory
                      </label>
                      <label className="flex items-center gap-2">
                        BO Mode
                        <select
                          value={rules.bestOf}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, bestOf: event.target.value as "BO1" | "BO3" }))
                          }
                          className="h-7 rounded border border-zinc-300 bg-white px-1.5 text-[11px]"
                        >
                          <option value="BO1">BO1</option>
                          <option value="BO3">BO3</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-2">
                        Swiss
                        <input
                          type="number"
                          value={rules.swissRounds}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, swissRounds: Number(event.target.value) }))
                          }
                          className="h-7 w-16 rounded border border-zinc-300 px-1.5 text-[11px]"
                        />
                      </label>
                      <label className="flex items-center gap-2">
                        Top Cut
                        <input
                          type="number"
                          value={rules.topCut}
                          onChange={(event) =>
                            setRules((prev) => ({ ...prev, topCut: Number(event.target.value) }))
                          }
                          className="h-7 w-16 rounded border border-zinc-300 px-1.5 text-[11px]"
                        />
                      </label>
                    </div>
                  </div>

                  {tournamentErrors.length ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
                      {tournamentErrors.map((error) => (
                        <p key={error}>• {error}</p>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePublishTournament}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white"
                    >
                      <ClipboardList className="h-3.5 w-3.5" />
                      {publishStatus === "publishing" ? "Publishing..." : "Publish Tournament"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTournamentForm(false)}
                      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  {selectedMyTournament ? (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-800">{selectedMyTournament.name}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {selectedMyTournament.format} • {selectedMyTournament.start}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-[10px] text-zinc-600">
                          {selectedMyTournament.currentRound}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-zinc-200 bg-white p-2">
                          <p className="text-[10px] text-zinc-500">{tx.registered}</p>
                          <p className="text-xs font-semibold text-zinc-800">
                            {selectedMyTournament.entrants}/{selectedMyTournament.slots}
                          </p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-2">
                          <p className="text-[10px] text-zinc-500">Checked-in</p>
                          <p className="text-xs font-semibold text-zinc-800">{selectedMyTournament.checkIns}</p>
                        </div>
                        <div className="rounded-lg border border-zinc-200 bg-white p-2">
                          <p className="text-[10px] text-zinc-500">Prize Pool</p>
                          <p className="text-xs font-semibold text-zinc-800">{selectedMyTournament.prizePool}</p>
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2.5">
                        <p className="text-[11px] font-medium text-zinc-700">Top standings</p>
                        <div className="mt-2 space-y-1.5">
                          {selectedMyTournament.topPlayers.map((player) => (
                            <div
                              key={`${selectedMyTournament.id}-${player.name}`}
                              className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 text-[10px] text-zinc-700"
                            >
                              <span>{player.name}</span>
                              <span>
                                {player.record} • {player.points}pt
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2.5">
                        <p className="text-[11px] font-medium text-zinc-700">Live match progress</p>
                        <div className="mt-2 space-y-1.5">
                          {selectedMyTournament.recentMatches.map((match) => (
                            <div
                              key={`${selectedMyTournament.id}-${match.table}-${match.players}`}
                              className="rounded bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-700"
                            >
                              <p>
                                {match.table} • {match.players}
                              </p>
                              <p className="text-zinc-500">
                                {match.result} • {match.state}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-center">
                      <p className="text-sm font-medium text-zinc-700">
                        {tx.selectTournamentHint}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Click + {tx.newTournament} to open the full creation form.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      case "liveTournaments":
        return (
          <div className="relative min-h-[620px] rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{tx.liveHubTitle}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {tx.liveHubSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-[11px]">
                {[
                  { id: "forYou", label: ui.tabs.forYou },
                  { id: "live", label: ui.tabs.live },
                  { id: "upcoming", label: ui.tabs.upcoming },
                  { id: "started", label: ui.tabs.started },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() =>
                      setLiveTab(tab.id as "forYou" | "live" | "upcoming" | "started")
                    }
                    className={`rounded-md px-2 py-1 transition ${
                      liveTab === tab.id ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 text-[11px] text-zinc-500">
                <Search className="h-3.5 w-3.5" />
                {tx.searchPlaceholder}
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-600">
                {liveCardList.length} {tx.eventsLabel}
              </div>
            </div>

            <div className="mt-3 grid h-[520px] grid-cols-[1.6fr_1fr] gap-3">
              <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
                {liveCardList.map((event) => (
                  <div key={event.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                    {event.image ? (
                      <div
                        className="relative h-28 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.image})` }}
                      >
                        <div className="absolute top-2 left-2 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                          {event.status.toUpperCase()}
                        </div>
                        <div className="absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-[10px] text-zinc-100">
                          {event.viewers > 0 ? `${(event.viewers / 1000).toFixed(1)}k ${ui.viewers}` : ui.warmup}
                        </div>
                      </div>
                    ) : null}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-zinc-800">{event.title}</p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">{event.format} • {ui.judgeVerified}</p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                          {event.status}
                        </span>
                      </div>

                      {event.table ? (
                        <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-2">
                          <div className="flex items-center justify-between text-[11px] text-zinc-700">
                            <span className="inline-flex items-center gap-1">
                              <UserRound className="h-3 w-3 text-zinc-500" />
                              {event.table.p1}
                            </span>
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px]">{event.table.score}</span>
                            <span className="inline-flex items-center gap-1">
                              {event.table.p2}
                              <UserRound className="h-3 w-3 text-zinc-500" />
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-zinc-500">{event.startsIn ?? ui.bracketSoon}</p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {event.status === "live" ? (
                          <button
                            type="button"
                            onClick={() => openWatchLive(event.id)}
                            className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white"
                          >
                            {tx.watchLive}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openJoinFlow(event.id)}
                            className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] text-white"
                          >
                            {joinedTournamentIds.includes(event.id) ? tx.registered : tx.joinTournament}
                          </button>
                        )}
                        <p className="text-[10px] text-zinc-500">
                          {event.viewers > 0 ? `${event.viewers.toLocaleString()} ${ui.watching}` : ui.openRegistration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-700">{tx.joinQueue}</p>
                  <div className="mt-2 space-y-2">
                    {liveTournaments
                      .filter((event) => event.status === "upcoming")
                      .map((event) => (
                        <div key={event.id} className="rounded-md border border-zinc-200 bg-white p-2">
                          <p className="text-[11px] font-medium text-zinc-700">{event.title}</p>
                          <p className="mt-0.5 text-[10px] text-zinc-500">{event.startsIn}</p>
                          <button
                            type="button"
                            onClick={() => openJoinFlow(event.id)}
                            className="mt-1 rounded bg-emerald-600 px-2 py-1 text-[10px] text-white"
                          >
                            {joinedTournamentIds.includes(event.id) ? ui.manageSpot : ui.startRegistration}
                          </button>
                          {(event.status === "started" || event.status === "live") ? (
                            <button
                              type="button"
                              onClick={() => openWatchLive(event.id)}
                              className="ml-1 rounded border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] text-zinc-700"
                            >
                              {ui.openStream}
                            </button>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-700">{tx.liveScoreFeed}</p>
                  <div className="mt-2 space-y-1.5 text-[11px] text-zinc-700">
                    {liveTournaments
                      .filter((event) => event.status === "live" && event.table)
                      .map((event) => (
                        <button
                          type="button"
                          key={event.id}
                          onClick={() => openWatchLive(event.id)}
                          className="w-full rounded-md bg-white px-2 py-1.5 text-left hover:bg-zinc-100"
                        >
                          {event.title}: {event.table?.p1} vs {event.table?.p2} ({event.table?.score})
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {showJoinModal && selectedJoinTournament ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-zinc-950/35 p-4 backdrop-blur-[1px]">
                <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">
                        Join {selectedJoinTournament.title}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">Step {joinStep} / 3 registration flow</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowJoinModal(false)}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] text-zinc-500"
                    >
                      {ui.close}
                    </button>
                  </div>

                  <div className="mt-3 h-1.5 rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(joinStep / 3) * 100}%` }}
                    />
                  </div>

                  {joinStep === 1 ? (
                    <div className="mt-3 space-y-2">
                      <label className="text-[11px] text-zinc-600">In-game nickname</label>
                      <input
                        value={joinNickname}
                        onChange={(e) => setJoinNickname(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-400"
                      />
                    </div>
                  ) : null}

                  {joinStep === 2 ? (
                    <div className="mt-3 space-y-2">
                      <label className="text-[11px] text-zinc-600">Select decklist</label>
                      <input
                        value={joinDeckName}
                        onChange={(e) => setJoinDeckName(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-400"
                      />
                      <p className="text-[10px] text-zinc-500">
                        Deck legality and banned cards will be validated automatically.
                      </p>
                    </div>
                  ) : null}

                  {joinStep === 3 ? (
                    <div className="mt-3 space-y-2">
                      <label className="flex items-start gap-2 text-[11px] text-zinc-600">
                        <input
                          type="checkbox"
                          checked={joinRulesAccepted}
                          onChange={(e) => setJoinRulesAccepted(e.target.checked)}
                          className="mt-0.5"
                        />
                        I confirm anti-cheat policy, webcam identity check, and timing rules.
                      </label>
                      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-[10px] text-zinc-600">
                        Registration summary: {joinNickname} • {joinDeckName} • {selectedJoinTournament.format}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={joinStep === 1}
                      onClick={() => setJoinStep((prev) => Math.max(1, prev - 1))}
                      className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-[11px] text-zinc-600 disabled:opacity-40"
                    >
                      {ui.back}
                    </button>
                    {joinStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setJoinStep((prev) => Math.min(3, prev + 1))}
                        className="rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white"
                      >
                        {ui.continue}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!joinRulesAccepted || !joinNickname.trim() || !joinDeckName.trim()}
                        onClick={() => {
                          if (!selectedJoinId) return;
                          setJoinedTournamentIds((prev) =>
                            prev.includes(selectedJoinId) ? prev : [...prev, selectedJoinId],
                          );
                          setShowJoinModal(false);
                        }}
                        className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[11px] text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ui.confirmRegistration}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

          </div>
        );
      case "marketplace":
        return (
          <div className="flex h-[620px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{tx.marketplaceTitle}</p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {tx.marketplaceSubtitle}
                </p>
              </div>
              <div className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                Expert Verified Inventory
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <input
                value={marketQuery}
                onChange={(event) => setMarketQuery(event.target.value)}
                placeholder="Search on Scryfall (optional): card name, archetype, set..."
                className="h-7 w-full bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
              />
            </div>

            <div className="mt-3 min-h-0 flex-1">
              {marketView === "catalog" ? (
                <div className="flex h-full min-h-0 flex-col rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
                <div className="mb-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{marketLoading ? "Searching Scryfall..." : `${marketCards.length} cards loaded`}</span>
                  <span>Starting at live market prices</span>
                </div>
                <div className="grid min-h-0 flex-1 auto-rows-max content-start grid-cols-4 gap-2 overflow-y-auto pr-1">
                  {marketCards.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      onClick={() => {
                        setSelectedMarketCardId(card.id);
                        setMarketView("detail");
                      }}
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-left transition hover:border-zinc-300 hover:shadow-sm"
                    >
                      <div className="mx-auto w-[92%]">
                        <div
                          className="aspect-[63/88] w-full rounded-lg border border-zinc-200 bg-zinc-100 bg-cover bg-center shadow-sm"
                          style={{ backgroundImage: card.image ? `url(${card.image})` : undefined }}
                        />
                      </div>
                      <p className="mt-1.5 truncate text-[11px] font-semibold text-zinc-800">{card.name}</p>
                      <p className="truncate text-[10px] text-zinc-500">
                        {card.setName} • {card.rarity}
                      </p>
                      <div className="mt-1 text-[10px]">
                        <span className="font-medium text-zinc-700">Starting at EUR {card.eurPrice}</span>
                      </div>
                    </button>
                  ))}
                </div>
                {!marketLoading && marketCards.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-dashed border-zinc-300 bg-white p-3 text-center text-[11px] text-zinc-500">
                    {marketError || "Searching top market cards from Scryfall."}
                  </div>
                ) : null}
                </div>
              ) : (
                <div className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-4">
                  {selectedMarketCard ? (
                    <div className="flex h-full min-h-0 flex-col">
                    <div className="mb-3 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setMarketView("catalog")}
                        className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] text-zinc-700"
                      >
                        {ui.backToCatalog}
                      </button>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
                        {tx.oneDayReady}
                      </span>
                    </div>
                    <div className="grid min-h-0 flex-1 grid-cols-[0.38fr_0.62fr] gap-3 overflow-hidden">
                      <div
                        className="h-full rounded-xl border border-zinc-200 bg-zinc-100 bg-contain bg-center bg-no-repeat"
                        style={{
                          backgroundImage: selectedMarketCard.image
                            ? `url(${selectedMarketCard.image})`
                            : undefined,
                        }}
                      />
                      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
                        <div className="rounded-lg border border-zinc-200 bg-white p-3">
                          <p className="text-sm font-semibold text-zinc-800">{selectedMarketCard.name}</p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {selectedMarketCard.setName} • {selectedMarketCard.rarity}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-zinc-800">
                            Starting at EUR {selectedMarketCard.eurPrice}
                          </p>
                          <p className="text-[10px] text-zinc-500">USD {selectedMarketCard.usdPrice}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-zinc-200 bg-white p-2">
                            <p className="text-[10px] text-zinc-500">Language</p>
                            <p className="text-[11px] font-medium text-zinc-700">
                              {selectedMarketCard.language}, EN, IT, DE
                            </p>
                          </div>
                          <div className="rounded-lg border border-zinc-200 bg-white p-2">
                            <p className="text-[10px] text-zinc-500">Condition</p>
                            <p className="text-[11px] font-medium text-zinc-700">NM, EX, LP</p>
                          </div>
                          <div className="rounded-lg border border-zinc-200 bg-white p-2">
                            <p className="text-[10px] text-zinc-500">Finish</p>
                            <p className="text-[11px] font-medium text-zinc-700">{selectedMarketCard.finish}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                          <p className="text-[11px] font-medium text-zinc-700">{tx.qualityPromiseTitle}</p>
                          <div className="mt-2 space-y-1.5 text-[10px] text-zinc-600">
                            <p>• Graded and inspected by in-house TCG experts</p>
                            <p>• Anti-counterfeit and condition double-check complete</p>
                            <p>• Ordered before cutoff {"->"} shipped same day</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-zinc-700">{tx.availableSellers}</p>
                          <div className="mt-1.5 space-y-1.5">
                            {marketplaceSellers.map((seller) => (
                              <div
                                key={`${selectedMarketCard.id}-${seller.name}`}
                                className="rounded-lg border border-zinc-200 bg-white p-2"
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-medium text-zinc-700">{seller.name}</span>
                                  <span className="text-zinc-500">EUR {seller.price}</span>
                                </div>
                                <p className="mt-0.5 text-[10px] text-zinc-500">
                                  ⭐ {seller.rating} • {seller.eta} • {seller.stock} in stock
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addSelectedCardToCart(true)}
                            className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] text-white"
                          >
                            {ui.buyNow}
                          </button>
                          <button
                            type="button"
                            onClick={() => addSelectedCardToCart(false)}
                            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[11px] text-zinc-700"
                          >
                            {ui.addToCart}
                          </button>
                        </div>
                      </div>
                    </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );
      case "readyOneDay":
        return (
          <div className="flex h-[620px] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{ready.title}</p>
                <p className="mt-1 max-w-4xl text-[11px] text-zinc-500">{ready.subtitle}</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-700">
                {ready.badge}
              </span>
            </div>

            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
              <p className="text-xs font-semibold text-indigo-900">{ready.objectiveTitle}</p>
              <p className="mt-1 text-[11px] leading-5 text-indigo-900/90">{ready.objectiveBody}</p>
              <div className="mt-2 space-y-1 text-[10px] text-indigo-900/85">
                {ready.objectivePoints.map((point) => (
                  <p key={point}>• {point}</p>
                ))}
              </div>
            </div>

            <div className="mt-3 grid min-h-0 flex-1 grid-cols-[0.33fr_0.34fr_0.33fr] gap-3">
              <div className="min-h-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-700">{ready.processTitle}</p>
                <div className="mt-2 space-y-2">
                  {ready.processSteps.map((step, idx) => (
                    <div key={step} className="rounded-lg border border-zinc-200 bg-white px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-zinc-400">
                        {ready.stepLabel} {idx + 1}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-h-0 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-xs font-medium text-zinc-700">{ready.simulatorTitle}</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
                  {[
                    { id: "it", label: "Italy" },
                    { id: "de", label: "Germany" },
                    { id: "fr", label: "France" },
                    { id: "es", label: "Spain" },
                    { id: "benelux", label: "Benelux" },
                  ].map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedHubZone(zone.id as "it" | "de" | "fr" | "es" | "benelux")}
                      className={`rounded-md border px-2 py-1.5 ${
                        selectedHubZone === zone.id
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-600"
                      }`}
                    >
                      {zone.label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-[10px] text-zinc-500">
                    {ready.zoneLabel}: <span className="font-medium text-zinc-700">{readyZoneMetrics.hub}</span>
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded bg-zinc-50 px-2 py-1.5">
                      <p className="text-zinc-500">{ready.cardsReceived}</p>
                      <p className="font-semibold text-zinc-800">{readyZoneMetrics.received.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-zinc-50 px-2 py-1.5">
                      <p className="text-zinc-500">{ready.gradedQueue}</p>
                      <p className="font-semibold text-zinc-800">{readyZoneMetrics.queue}</p>
                    </div>
                    <div className="rounded bg-zinc-50 px-2 py-1.5">
                      <p className="text-zinc-500">{ready.sameDayReady}</p>
                      <p className="font-semibold text-zinc-800">{readyZoneMetrics.ready.toLocaleString()}</p>
                    </div>
                    <div className="rounded bg-zinc-50 px-2 py-1.5">
                      <p className="text-zinc-500">{ready.latency}</p>
                      <p className="font-semibold text-zinc-800">{readyZoneMetrics.latency}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-[11px] text-zinc-700">
                  SLA: {readyZoneMetrics.sla}
                </div>

                <div className="mt-2 rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-[10px] text-zinc-500">{ready.flowLabel}</p>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-600">
                    <span className="rounded bg-zinc-100 px-1.5 py-1">{ready.flowNodes[0]}</span>
                    <span>{"->"}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-1">{ready.flowNodes[1]}</span>
                    <span>{"->"}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-1">{ready.flowNodes[2]}</span>
                    <span>{"->"}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-1">{ready.flowNodes[3]}</span>
                  </div>
                </div>
              </div>

              <div className="min-h-0 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-xs font-medium text-zinc-700">{ready.apiPanelTitle}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{ready.apiStatus}</span>
                    <button
                      type="button"
                      onClick={() => setApiSyncEnabled((prev) => !prev)}
                      className={`rounded-full px-2 py-1 text-[10px] ${
                        apiSyncEnabled ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {apiSyncEnabled ? "SYNC ONLINE" : "SYNC PAUSED"}
                    </button>
                  </div>

                  <p className="mt-2 text-[10px] text-zinc-500">{ready.placementLabel}</p>
                  <div className="mt-1.5 grid grid-cols-1 gap-1.5">
                    {ready.placementOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setSponsoredPlacement(option)}
                        className={`rounded-md border px-2 py-1.5 text-left text-[10px] ${
                          sponsoredPlacement === option
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-xs font-medium text-zinc-700">{ready.chartATitle}</p>
                  <div className="mt-2 space-y-2 text-[10px]">
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>{ready.chartABeforeLabel}</span>
                        <span>9-14 days</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[28%] rounded bg-zinc-400" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>{ready.chartAAfterLabel}</span>
                        <span>24h</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[86%] rounded bg-emerald-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-xs font-medium text-zinc-700">{ready.chartBTitle}</p>
                  <div className="mt-2 space-y-2 text-[10px]">
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>{ready.chartBBaselineLabel}</span>
                        <span>34%</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[34%] rounded bg-zinc-400" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>{ready.chartBLocalizedLabel}</span>
                        <span>57%</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[57%] rounded bg-indigo-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                  <p className="text-xs font-medium text-emerald-800">{ready.pricingTitle}</p>
                  <p className="mt-1 text-[11px] leading-5 text-emerald-900">{ready.pricingBody}</p>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-2.5">
                  <p className="text-xs font-medium text-zinc-700">{ready.outcomesTitle}</p>
                  <div className="mt-2 space-y-2 text-[10px]">
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>Vendors inbound</span>
                        <span>{readyZoneMetrics.received}</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[86%] rounded bg-blue-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>Grading completion</span>
                        <span>{Math.max(0, readyZoneMetrics.received - readyZoneMetrics.queue)}</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[72%] rounded bg-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>National stock shift</span>
                        <span>64%</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[64%] rounded bg-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-zinc-500">
                        <span>International stock shift</span>
                        <span>36%</span>
                      </div>
                      <div className="h-2 rounded bg-zinc-100">
                        <div className="h-2 w-[36%] rounded bg-violet-500" />
                      </div>
                    </div>
                    <div className="pt-1 text-[11px] text-zinc-600">
                      {ready.outcomes.map((item) => (
                        <p key={item}>• {item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "cart":
        return (
          <div className="h-[620px] rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-800">{tx.cartTitle}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{cartItems.length} items</p>
              </div>
              <button
                type="button"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-[11px] text-white"
              >
                {ui.cartCheckout}
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center text-sm text-zinc-500">
                {ui.cartEmpty}
              </div>
            ) : (
              <div className="mt-4 grid h-[520px] grid-cols-[1.45fr_0.55fr] gap-3">
                <div className="space-y-2 overflow-y-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5">
                      <div className="flex items-start gap-2">
                        <div
                          className="h-20 w-16 shrink-0 rounded-md border border-zinc-200 bg-white bg-cover bg-center"
                          style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-zinc-800">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-zinc-500">
                            {item.language} • {item.condition}
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-zinc-700">
                            EUR {item.price.toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setCartItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, qty: Math.max(1, entry.qty - 1) } : entry,
                                ),
                              )
                            }
                            className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs text-zinc-700">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setCartItems((prev) =>
                                prev.map((entry) =>
                                  entry.id === item.id ? { ...entry, qty: entry.qty + 1 } : entry,
                                ),
                              )
                            }
                            className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-medium text-zinc-700">{ui.cartSubtotal}</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">EUR {cartSubtotal.toFixed(2)}</p>
                  <button
                    type="button"
                    className="mt-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-xs text-white"
                  >
                    {ui.cartCheckout}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case "matchCenter":
      default:
        return (
          <div className="relative h-fit min-h-[560px] self-start space-y-3 rounded-xl border border-zinc-200 bg-zinc-950 p-3 pb-4">
            <div className="mb-1 flex items-center justify-between rounded-xl border border-white/15 bg-white/8 px-3 py-2 backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-zinc-200">
                <Camera className="h-3.5 w-3.5 text-emerald-300" />
                {ui.mainStreamTitle}
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
                  {ui.mic}
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
                  {ui.camera}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/15 bg-black/25 px-2.5 py-1.5 text-xs text-zinc-200"
                  onClick={() => {
                    setMicOn((prev) => !prev);
                    setCamOn((prev) => !prev);
                  }}
                >
                  {ui.quickToggle}
                </button>
              </div>
            </div>

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
                  {ui.cameraOff}
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
        );
    }
  };

  return (
    <div
      ref={desktopRef}
      className="relative overflow-visible rounded-[28px] border border-zinc-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.18)]"
    >
      {showSyncModal ? (
        <div className="absolute inset-0 z-[120] flex items-center justify-center rounded-[28px] bg-zinc-950/35 p-6 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">
                  Sync Stock Integration Preview
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Automazione inventory per ecosistema Cardmarket
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="rounded-md border border-zinc-300 bg-white p-1.5 text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-zinc-700">
              <p>
                Qui prevediamo l&apos;integrazione della sincronizzazione automatica
                dello stock venditore tramite API bidirezionale.
              </p>
              <p>
                Abbiamo già predisposto un microservizio con sync istantanea:
                variazioni quantità, lock anti-doppia vendita, update prezzi e stato
                disponibilità in tempo reale.
              </p>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                Obiettivo partnership: inventory sempre allineato tra Vault, account
                ufficiale Cardmarket e marketplace, senza attrito operativo.
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
              >
                Ho capito
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs text-zinc-500">{ui.topTitle}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <Bell className="h-3.5 w-3.5 text-zinc-500" />
          {ui.roundLabel}
        </div>
      </div>

      <div className="grid grid-cols-[0.17fr_0.83fr] gap-3 p-3">
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

        <div
          className={`relative items-start gap-3 ${
            activeSection === "matchCenter" ? "grid grid-cols-[0.69fr_0.31fr]" : "block"
          }`}
        >
          {renderMainContent()}

          {activeSection === "matchCenter" ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-700">{ui.judgeFeed}</p>
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
                    {ui.judgeOnline}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-zinc-700">{ui.liveScoreboard}</p>
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
                  <p className="text-xs font-medium text-zinc-700">{ui.spectatorChat}</p>
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <div className="space-y-1.5 text-[11px] text-zinc-700">
                  {messages.map((message) => (
                    <p key={message} className="rounded-md bg-white px-2 py-1.5 leading-5">
                      {message}
                    </p>
                  ))}
                  {typing ? (
                    <p className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1.5 text-blue-700">
                      {ui.typing}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-semibold text-emerald-800">{ui.cardmarketValue}</p>
                <div className="mt-2 space-y-1.5 text-[11px] text-emerald-700">
                  {ui.valueBullets.map((item) => (
                    <div key={item} className="flex items-start gap-1.5">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </div>

      {(["player", "opponent", "watchLive"] as const).map((key) => {
        const win = windows[key];
        if (!win.isOpen) return null;

        const title =
          key === "player"
            ? "You • Local Player Window"
            : key === "opponent"
              ? "Alex_M • Opponent Window"
              : `${watchEvent?.title ?? tx.watchLive} • Match Center`;
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
                {ui.cameraOff}
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
              {key === "watchLive" ? (
                <div className="h-full space-y-2 overflow-y-auto bg-zinc-950 p-2.5">
                  <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/8 px-2.5 py-1.5 text-[11px] text-zinc-200">
                    <span className="inline-flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-emerald-300" />
                      {watchEvent?.format ?? "Standard"} • {watchEvent?.round ?? "Live round"}
                    </span>
                    <span>{watchEvent?.viewers?.toLocaleString() ?? "2,300"} watching</span>
                  </div>
                  {renderMatchCard({
                    userLabel: "You",
                    opponentLabel: watchEvent?.table?.p1 ?? "Alex_M",
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
                      <div className="flex h-20 w-full items-center justify-center bg-zinc-900 text-[10px] text-zinc-400">
                        Camera off
                      </div>
                    ),
                  })}
                  {renderMatchCard({
                    userLabel: `${watchEvent?.table?.p1 ?? "Alex_M"} • Opponent`,
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
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileAppShowcase() {
  const screens = useMemo(
    () =>
      [
        { id: "home", label: "Home", icon: Layers },
        { id: "match-center", label: "Match Center", icon: Trophy },
        { id: "decklist", label: "Decklist", icon: ClipboardList },
        { id: "create-tournament", label: "Crea Torneo", icon: ListPlus },
        { id: "live-events", label: "Tornei Live", icon: Bell },
        { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
        { id: "cart", label: "Carrello", icon: ShoppingCart },
        { id: "ready-one-day", label: "Ready One Day", icon: PackageOpen },
      ] as const,
    [],
  );
  const [activeScreen, setActiveScreen] = useState<(typeof screens)[number]["id"]>("home");
  const [matchStatus, setMatchStatus] = useState<"open" | "pairing" | "judge">("open");
  const [mobileMicOn, setMobileMicOn] = useState(false);
  const [mobileCamOn, setMobileCamOn] = useState(true);
  const [mobileTables] = useState([
    { id: "t1", table: "T1", players: "You vs Alex_M", score: "1-1", status: "live" },
    { id: "t2", table: "T2", players: "Luna_T vs Nix_A", score: "2-0", status: "finished" },
    { id: "t7", table: "T7", players: "Kai_M vs Rey_S", score: "0-1", status: "review" },
  ]);
  const [selectedMobileTableId, setSelectedMobileTableId] = useState("t1");
  const [judgeCallTableIds, setJudgeCallTableIds] = useState<string[]>([]);
  const [deckNameInput, setDeckNameInput] = useState("");
  const [deckFormatInput, setDeckFormatInput] = useState("Standard");
  const [deckCardInput, setDeckCardInput] = useState("");
  const [mobileDecks, setMobileDecks] = useState([
    {
      id: "m-deck-1",
      name: "Mono Green Midrange",
      format: "Pioneer",
      main: 60,
      side: 15,
      cards: ["Llanowar Elves", "Old-Growth Troll", "The Great Henge", "Tyvar's Stand"],
      status: "ready",
    },
    {
      id: "m-deck-2",
      name: "UR Phoenix",
      format: "Modern",
      main: 57,
      side: 12,
      cards: ["Arclight Phoenix", "Consider", "Lightning Axe", "Ledger Shredder"],
      status: "draft",
    },
  ]);
  const [selectedMobileDeckId, setSelectedMobileDeckId] = useState("m-deck-1");
  const [quickTournamentName, setQuickTournamentName] = useState("Vault Weekly Mobile");
  const [quickTournamentSlots, setQuickTournamentSlots] = useState("64");
  const [quickTournamentFormat, setQuickTournamentFormat] = useState("Standard");
  const [quickTournamentStart, setQuickTournamentStart] = useState("Thu 21:00 CET");
  const [quickTournamentEntry, setQuickTournamentEntry] = useState("EUR 9.90");
  const [quickTournamentJudge, setQuickTournamentJudge] = useState(true);
  const [quickTournamentDecklock, setQuickTournamentDecklock] = useState(true);
  const [quickTournamentWebcam, setQuickTournamentWebcam] = useState(true);
  const [quickTournamentStatus, setQuickTournamentStatus] = useState<"idle" | "published">("idle");
  const [liveEvents, setLiveEvents] = useState([
    {
      id: "ev-1",
      name: "Round 4 Open Qualifier",
      joined: false,
      viewers: "2.340",
      status: "live",
      format: "Standard",
      slots: "96/128",
      startsIn: "Live now",
    },
    {
      id: "ev-2",
      name: "Sunday Championship",
      joined: false,
      viewers: "1.120",
      status: "upcoming",
      format: "Modern",
      slots: "54/128",
      startsIn: "Starts in 25m",
    },
    {
      id: "ev-3",
      name: "Vault Weekly Rush",
      joined: true,
      viewers: "890",
      status: "live",
      format: "Pioneer",
      slots: "64/64",
      startsIn: "Round 2",
    },
  ]);
  const [liveEventFilter, setLiveEventFilter] = useState<"all" | "live" | "joined">("all");
  const [watchingLiveEventId, setWatchingLiveEventId] = useState<string | null>("ev-1");
  const [marketItems] = useState([
    {
      id: "mk-1",
      name: "PSA 10 Charizard",
      grade: "PSA 10",
      category: "Pokemon",
      trend: "+8%",
      image: "/magic-the-gathering-arena-v1-570303.jpg",
      offers: [
        { hub: "Milan", price: 690, eta: "24h", qty: 2 },
        { hub: "Berlin", price: 705, eta: "24-48h", qty: 1 },
        { hub: "Paris", price: 715, eta: "48h", qty: 3 },
      ],
    },
    {
      id: "mk-2",
      name: "Umbreon VMAX Alt Art",
      grade: "Raw NM",
      category: "Pokemon",
      trend: "+4%",
      image: "/table-player.png",
      offers: [
        { hub: "Milan", price: 220, eta: "24h", qty: 4 },
        { hub: "Berlin", price: 228, eta: "24-48h", qty: 2 },
        { hub: "Paris", price: 235, eta: "48h", qty: 1 },
      ],
    },
    {
      id: "mk-3",
      name: "Blue-Eyes 1st Edition",
      grade: "PSA 9",
      category: "Yu-Gi-Oh!",
      trend: "+11%",
      image: "/main-table.png",
      offers: [
        { hub: "Milan", price: 175, eta: "24h", qty: 5 },
        { hub: "Berlin", price: 182, eta: "24-48h", qty: 2 },
        { hub: "Paris", price: 189, eta: "48h", qty: 2 },
      ],
    },
    {
      id: "mk-4",
      name: "Sheoldred, the Apocalypse",
      grade: "Near Mint",
      category: "MTG",
      trend: "+2%",
      image: "/magic-the-gathering-arena-v1-570303.jpg",
      offers: [
        { hub: "Milan", price: 62, eta: "24h", qty: 12 },
        { hub: "Berlin", price: 64, eta: "24-48h", qty: 7 },
        { hub: "Paris", price: 66, eta: "48h", qty: 5 },
      ],
    },
  ]);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketViewMode, setMarketViewMode] = useState<"cards" | "list">("cards");
  const [selectedMobileMarketId, setSelectedMobileMarketId] = useState("mk-1");
  const [mobileMarketPage, setMobileMarketPage] = useState<"catalog" | "detail">("catalog");
  const [cartIconBounceTick, setCartIconBounceTick] = useState(0);
  const [cart, setCart] = useState<{ id: string; name: string; price: number }[]>([]);
  const [selectedHub, setSelectedHub] = useState<"Milan" | "Berlin" | "Paris">("Milan");
  const [phoneInteractionActive, setPhoneInteractionActive] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);
  const joinedEvents = liveEvents.filter((event) => event.joined).length;
  const visibleLiveEvents = liveEvents.filter((event) => {
    if (liveEventFilter === "live") return event.status === "live";
    if (liveEventFilter === "joined") return event.joined;
    return true;
  });
  const watchingLiveEvent =
    liveEvents.find((event) => event.id === watchingLiveEventId) ?? visibleLiveEvents[0] ?? liveEvents[0];
  const filteredMarketItems = marketItems.filter((item) => {
    const query = marketSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.grade.toLowerCase().includes(query)
    );
  });
  const featuredMarketItems = filteredMarketItems.slice(0, 3);
  const selectedMobileMarketCard =
    marketItems.find((item) => item.id === selectedMobileMarketId) ?? filteredMarketItems[0] ?? marketItems[0];
  const selectedMobileTable =
    mobileTables.find((table) => table.id === selectedMobileTableId) ?? mobileTables[0];
  const selectedMobileDeck =
    mobileDecks.find((deck) => deck.id === selectedMobileDeckId) ?? mobileDecks[0];

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    if (window.innerWidth >= 768) return;

    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;

    if (phoneInteractionActive) {
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    } else {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [phoneInteractionActive]);

  const addDeck = () => {
    if (!deckNameInput.trim()) return;
    const nextDeckId = `m-deck-${Date.now()}`;
    setMobileDecks((prev) => [
      {
        id: nextDeckId,
        name: deckNameInput.trim(),
        format: deckFormatInput,
        main: 0,
        side: 0,
        cards: [],
        status: "draft",
      },
      ...prev,
    ]);
    setSelectedMobileDeckId(nextDeckId);
    setDeckNameInput("");
  };

  const addCardToMobileDeck = () => {
    if (!deckCardInput.trim()) return;
    setMobileDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== selectedMobileDeckId) return deck;
        const nextCards = [...deck.cards, deckCardInput.trim()];
        const nextMain = Math.min(60, deck.main + 1);
        const nextStatus = nextMain >= 60 && deck.side >= 15 ? "ready" : "draft";
        return {
          ...deck,
          cards: nextCards.slice(-12),
          main: nextMain,
          status: nextStatus,
        };
      }),
    );
    setDeckCardInput("");
  };

  const removeCardFromMobileDeck = (index: number) => {
    setMobileDecks((prev) =>
      prev.map((deck) => {
        if (deck.id !== selectedMobileDeckId) return deck;
        const nextCards = deck.cards.filter((_, cardIdx) => cardIdx !== index);
        const nextMain = Math.max(0, deck.main - 1);
        return {
          ...deck,
          cards: nextCards,
          main: nextMain,
          status: "draft",
        };
      }),
    );
  };

  const publishTournament = () => {
    if (!quickTournamentName.trim() || !quickTournamentSlots.trim() || !quickTournamentStart.trim()) return;
    setQuickTournamentStatus("published");
  };

  const toggleJoinEvent = (id: string) => {
    setLiveEvents((prev) => prev.map((event) => (event.id === id ? { ...event, joined: !event.joined } : event)));
  };

  const watchLiveEvent = (id: string) => {
    setWatchingLiveEventId(id);
    setActiveScreen("match-center");
  };

  const openMobileMarketDetail = (id: string) => {
    setSelectedMobileMarketId(id);
    setMobileMarketPage("detail");
  };

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      if (prev.some((entry) => entry.id === item.id)) return prev;
      setCartIconBounceTick((tick) => tick + 1);
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleJudgeCall = (tableId: string) => {
    setJudgeCallTableIds((prev) =>
      prev.includes(tableId) ? prev.filter((id) => id !== tableId) : [...prev, tableId],
    );
    setMatchStatus("judge");
  };

  return (
    <div className="md:hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-[410px]"
      >
        <span className="absolute top-28 -left-1 h-11 w-1 rounded-r-full bg-zinc-300/80 shadow-sm" />
        <span className="absolute top-44 -left-1 h-18 w-1 rounded-r-full bg-zinc-300/80 shadow-sm" />
        <span className="absolute top-36 -right-1 h-22 w-1 rounded-l-full bg-zinc-300/80 shadow-sm" />
        <div
          className="rounded-[2.9rem] border border-zinc-200/90 bg-gradient-to-b from-zinc-100 to-zinc-50 p-2.5 shadow-[0_35px_85px_rgba(15,23,42,0.2)]"
          onTouchStart={() => setPhoneInteractionActive(true)}
          onTouchEnd={() => setPhoneInteractionActive(false)}
          onTouchCancel={() => setPhoneInteractionActive(false)}
        >
          <div className="overflow-hidden rounded-[2.35rem] border border-zinc-300/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
            <div className="relative border-b border-zinc-200 bg-white px-3 pt-2.5 pb-2">
              <div className="absolute top-1.5 left-1/2 h-7 w-30 -translate-x-1/2 rounded-full bg-zinc-950 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                <motion.span
                  animate={{ opacity: [0.45, 0.95, 0.45] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 right-3 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-emerald-400/90"
                />
              </div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="font-medium text-zinc-700">9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                  <span className="rounded border border-zinc-400 px-1 text-[9px] text-zinc-600">100%</span>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-800">I Sell For You App</span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600">
                  iOS preview
                </span>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto bg-gradient-to-b from-white to-zinc-50 p-3 [overscroll-behavior:contain]">
              {activeScreen === "home" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="mt-1 text-sm font-semibold text-zinc-900">Control Center mobile</p>
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Gestisci deck, iscrizioni, stock marketplace e Ready One Day in un unico flusso operativo.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Deck</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{mobileDecks.length}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Eventi</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{joinedEvents} joined</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Carrello</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">EUR {cartTotal}</p>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-800">Attività rapide</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveScreen("decklist")}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-left"
                      >
                        <p className="text-[11px] font-medium text-zinc-800">Crea deck</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Setup lista torneo</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScreen("live-events")}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-left"
                      >
                        <p className="text-[11px] font-medium text-zinc-800">Partecipa live</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Join tornei attivi</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScreen("marketplace")}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-left"
                      >
                        <p className="text-[11px] font-medium text-zinc-800">Marketplace</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Compra carte validate</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveScreen("ready-one-day")}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-left"
                      >
                        <p className="text-[11px] font-medium text-zinc-800">Ready One Day</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Routing hub UE</p>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-800">Pipeline operativa</p>
                    <div className="mt-2 space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        <span className="text-zinc-600">Deck pronti per torneo</span>
                        <span className="font-semibold text-zinc-800">{mobileDecks.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        <span className="text-zinc-600">Eventi a cui partecipi</span>
                        <span className="font-semibold text-zinc-800">{joinedEvents}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        <span className="text-zinc-600">Carte in carrello</span>
                        <span className="font-semibold text-zinc-800">{cart.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                        <span className="text-zinc-600">Hub attivo Ready One Day</span>
                        <span className="font-semibold text-zinc-800">{selectedHub}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                    App mobile interattiva: crea deck, entra nei tornei e gestisci ordini
                  </div>
                </div>
              ) : null}

              {activeScreen === "match-center" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Operativita live</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Gestione round, tavoli live, judge feed e controlli webcam come da desktop.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    {[
                      { id: "open", label: "Open" },
                      { id: "pairing", label: "Pairing" },
                      { id: "judge", label: "Judge" },
                    ].map((option) => {
                      const isActive = matchStatus === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setMatchStatus(option.id as "open" | "pairing" | "judge")}
                          className={`rounded-full border px-2 py-1 text-center transition ${
                            isActive
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-white text-zinc-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Round</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">R4</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Live tables</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">
                        {mobileTables.filter((item) => item.status === "live").length}
                      </p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Judge calls</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{judgeCallTableIds.length}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setMobileMicOn((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${
                        mobileMicOn ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      {mobileMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                      Mic
                    </button>
                    <button
                      type="button"
                      onClick={() => setMobileCamOn((prev) => !prev)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 ${
                        mobileCamOn ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-200 text-zinc-600"
                      }`}
                    >
                      {mobileCamOn ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
                      Cam
                    </button>
                    <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-600">
                      {selectedMobileTable.table} • {selectedMobileTable.score}
                    </span>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Live tables</p>
                    <div className="mt-1.5 space-y-1.5">
                      {mobileTables.map((item) => {
                        const selected = selectedMobileTableId === item.id;
                        const judgeActive = judgeCallTableIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`rounded-lg border px-2 py-2 ${
                              selected ? "border-blue-300 bg-blue-50/60" : "border-zinc-200 bg-zinc-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedMobileTableId(item.id)}
                                className="text-left"
                              >
                                <p className="text-[10px] font-semibold text-zinc-800">
                                  {item.table} • {item.players}
                                </p>
                                <p className="text-[10px] text-zinc-500">
                                  Score {item.score} • {item.status}
                                </p>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleJudgeCall(item.id)}
                                className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                                  judgeActive ? "bg-zinc-900 text-white" : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {judgeActive ? "Judge chiamato" : "Chiama judge"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      src={playerWebcamVideo}
                      className="h-42 w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-zinc-700">Judge Feed</p>
                      <Shield className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <div className="mt-1.5 overflow-hidden rounded-lg border border-zinc-200">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        src={judgeCameraVideo}
                        className="h-24 w-full object-cover"
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] leading-4 text-zinc-600">
                      Judge_Miler online: integrità match verificata su {selectedMobileTable.table}. Escalation pronta.
                    </p>
                  </div>
                  <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-600">
                    Stato operativo: <span className="font-semibold text-zinc-800">{matchStatus}</span> • Tavolo attivo{" "}
                    <span className="font-semibold text-zinc-800">{selectedMobileTable.table}</span>
                  </div>
                </div>
              ) : null}

              {activeScreen === "decklist" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Gestione deck</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Flusso completo: crea lista, aggiungi carte e verifica stato torneo.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Deck totali</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{mobileDecks.length}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Main deck</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{selectedMobileDeck.main}/60</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Stato</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{selectedMobileDeck.status}</p>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Nuovo deck</p>
                    <input
                      value={deckNameInput}
                      onChange={(event) => setDeckNameInput(event.target.value)}
                      placeholder="Nome deck (es. Azorius Control)"
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] outline-none focus:border-emerald-400"
                    />
                    <div className="mt-2 flex gap-1.5">
                      {["Standard", "Modern", "Pioneer"].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setDeckFormatInput(format)}
                          className={`rounded-md border px-2 py-1 text-[10px] ${
                            deckFormatInput === format
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addDeck}
                      className="mt-2 w-full rounded-lg bg-zinc-900 px-2 py-1.5 text-[11px] font-medium text-white"
                    >
                      Crea e apri deck
                    </button>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Deck disponibili</p>
                    <div className="mt-1.5 flex gap-1.5 overflow-x-auto pb-0.5">
                      {mobileDecks.map((deck) => (
                        <button
                          key={deck.id}
                          type="button"
                          onClick={() => setSelectedMobileDeckId(deck.id)}
                          className={`shrink-0 rounded-md border px-2 py-1 text-[10px] ${
                            selectedMobileDeckId === deck.id
                              ? "border-zinc-900 bg-zinc-900 text-white"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          {deck.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-zinc-800">{selectedMobileDeck.name}</p>
                        <p className="text-[10px] text-zinc-500">
                          {selectedMobileDeck.format} • {selectedMobileDeck.main} Main + {selectedMobileDeck.side} Side
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          selectedMobileDeck.status === "ready"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {selectedMobileDeck.status === "ready" ? "Pronto" : "In bozza"}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <input
                        value={deckCardInput}
                        onChange={(event) => setDeckCardInput(event.target.value)}
                        placeholder="Aggiungi carta"
                        className="h-8 flex-1 rounded-md border border-zinc-200 px-2 text-[11px] outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={addCardToMobileDeck}
                        className="rounded-md bg-zinc-900 px-2.5 py-1 text-[10px] text-white"
                      >
                        Aggiungi
                      </button>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {selectedMobileDeck.cards.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-2 py-3 text-center text-[10px] text-zinc-500">
                          Nessuna carta inserita. Inizia con le staple principali.
                        </div>
                      ) : null}
                      {selectedMobileDeck.cards.map((card, idx) => (
                        <div
                          key={`${selectedMobileDeck.id}-${card}-${idx}`}
                          className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5"
                        >
                          <span className="text-[10px] text-zinc-700">{card}</span>
                          <button
                            type="button"
                            onClick={() => removeCardFromMobileDeck(idx)}
                            className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-600"
                          >
                            Rimuovi
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                    Export torneo pronto quando raggiungi 60 main + 15 side.
                  </div>
                </div>
              ) : null}

              {activeScreen === "create-tournament" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Configurazione torneo</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Setup completo mobile: formato, capienza, regole integrità e pubblicazione.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Formato</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{quickTournamentFormat}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Slot</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{quickTournamentSlots}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Stato</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">
                        {quickTournamentStatus === "published" ? "Pubblicato" : "Bozza"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Dati principali</p>
                    <input
                      value={quickTournamentName}
                      onChange={(event) => setQuickTournamentName(event.target.value)}
                      placeholder="Nome torneo"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
                    />
                    <div className="flex gap-1.5">
                      {["Standard", "Pioneer", "Modern", "Commander"].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => setQuickTournamentFormat(format)}
                          className={`rounded-md border px-2 py-1 text-[10px] ${
                            quickTournamentFormat === format
                              ? "border-blue-300 bg-blue-50 text-blue-700"
                              : "border-zinc-200 bg-zinc-50 text-zinc-600"
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={quickTournamentSlots}
                        onChange={(event) => setQuickTournamentSlots(event.target.value)}
                        placeholder="Slot"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
                      />
                      <input
                        value={quickTournamentEntry}
                        onChange={(event) => setQuickTournamentEntry(event.target.value)}
                        placeholder="Entry fee"
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
                      />
                    </div>
                    <input
                      value={quickTournamentStart}
                      onChange={(event) => setQuickTournamentStart(event.target.value)}
                      placeholder="Start time"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Regole integrità</p>
                    <div className="mt-1.5 space-y-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setQuickTournamentJudge((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 ${
                          quickTournamentJudge
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        <span>Judge richiesto</span>
                        <span>{quickTournamentJudge ? "ON" : "OFF"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickTournamentDecklock((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 ${
                          quickTournamentDecklock
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        <span>Decklist lock</span>
                        <span>{quickTournamentDecklock ? "ON" : "OFF"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickTournamentWebcam((prev) => !prev)}
                        className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 ${
                          quickTournamentWebcam
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        <span>Webcam obbligatoria</span>
                        <span>{quickTournamentWebcam ? "ON" : "OFF"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5 text-[10px] text-zinc-600">
                    <p className="font-medium text-zinc-700">Riepilogo pubblicazione</p>
                    <p className="mt-1">
                      {quickTournamentName} • {quickTournamentFormat} • {quickTournamentSlots} slot • {quickTournamentStart}
                    </p>
                    <p className="mt-0.5">Entry fee: {quickTournamentEntry}</p>
                    <p className="mt-0.5">
                      Integrità: Judge {quickTournamentJudge ? "ON" : "OFF"} | Decklock {quickTournamentDecklock ? "ON" : "OFF"} |
                      Webcam {quickTournamentWebcam ? "ON" : "OFF"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={publishTournament}
                    disabled={!quickTournamentName.trim() || !quickTournamentSlots.trim() || !quickTournamentStart.trim()}
                    className="mt-2 w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    Pubblica torneo
                  </button>
                  {quickTournamentStatus === "published" ? (
                    <div className="mt-2 flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Torneo pubblicato e aperto alle iscrizioni
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeScreen === "live-events" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Eventi in corso</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Scopri tornei live e upcoming, partecipa in un tap o apri subito la vista match.
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Eventi</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{liveEvents.length}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Joined</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">{joinedEvents}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200 bg-white px-2 py-1.5">
                      <p className="text-zinc-500">Live</p>
                      <p className="mt-0.5 font-semibold text-zinc-800">
                        {liveEvents.filter((event) => event.status === "live").length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {[
                      { id: "all", label: "Tutti" },
                      { id: "live", label: "Live" },
                      { id: "joined", label: "Joined" },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setLiveEventFilter(filter.id as "all" | "live" | "joined")}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          liveEventFilter === filter.id
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-white text-zinc-600"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium text-zinc-700">Evento in evidenza</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          watchingLiveEvent.status === "live"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {watchingLiveEvent.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium text-zinc-900">{watchingLiveEvent.name}</p>
                    <p className="text-[10px] text-zinc-500">
                      {watchingLiveEvent.format} • {watchingLiveEvent.slots} • {watchingLiveEvent.startsIn}
                    </p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        src={playerWebcamVideo}
                        className="h-34 w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggleJoinEvent(watchingLiveEvent.id)}
                        className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                          watchingLiveEvent.joined ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {watchingLiveEvent.joined ? "Iscritto" : "Partecipa"}
                      </button>
                      <button
                        type="button"
                        onClick={() => watchLiveEvent(watchingLiveEvent.id)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-[10px] font-medium text-white"
                      >
                        Guarda match
                      </button>
                      <span className="ml-auto text-[10px] text-zinc-500">{watchingLiveEvent.viewers} viewers</span>
                    </div>
                  </div>
                  <div className="mt-2 space-y-2 text-[11px]">
                    {visibleLiveEvents.map((event) => (
                      <div key={event.id} className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setWatchingLiveEventId(event.id)}
                            className="text-left"
                          >
                            <p className="text-[11px] font-medium text-zinc-800">{event.name}</p>
                            <p className="mt-0.5 text-[10px] text-zinc-500">
                              {event.format} • {event.slots} • {event.startsIn}
                            </p>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => toggleJoinEvent(event.id)}
                              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                                event.joined ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {event.joined ? "Partecipi" : "Partecipa"}
                            </button>
                            <button
                              type="button"
                              onClick={() => watchLiveEvent(event.id)}
                              className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-700"
                            >
                              Vedi
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-zinc-200">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      src={playerWebcamVideo}
                      className="h-38 w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}

              {activeScreen === "marketplace" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Catalogo carte</p>
                    <p className="mt-1 text-xs text-zinc-600">
                      Ricerca avanzata, vista card/list e dettaglio offerte per hub.
                    </p>
                  </div>
                  {mobileMarketPage === "catalog" ? (
                    <>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <div className="flex items-center gap-1.5">
                      <Search className="h-3.5 w-3.5 text-zinc-500" />
                      <input
                        value={marketSearch}
                        onChange={(event) => setMarketSearch(event.target.value)}
                        placeholder="Cerca carta, gioco o grade"
                        className="h-8 flex-1 rounded-md border border-zinc-200 px-2 text-[11px] outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMarketViewMode("cards")}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          marketViewMode === "cards"
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        Vista card
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarketViewMode("list")}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          marketViewMode === "list"
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        Vista lista
                      </button>
                      <span className="ml-auto text-[10px] text-zinc-500">{filteredMarketItems.length} risultati</span>
                    </div>
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                    <p className="text-[11px] font-medium text-zinc-700">Top richieste</p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {featuredMarketItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openMobileMarketDetail(item.id)}
                          className="shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-left"
                        >
                          <p className="text-[10px] font-medium text-zinc-800">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-zinc-500">{item.grade}</p>
                          <p className="mt-0.5 text-[10px] text-emerald-700">Da EUR {item.offers[0]?.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  {marketViewMode === "cards" ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {filteredMarketItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openMobileMarketDetail(item.id)}
                          className="rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-left"
                        >
                          <p className="text-[10px] font-semibold text-zinc-800">{item.name}</p>
                          <p className="mt-0.5 text-[10px] text-zinc-500">
                            {item.category} • {item.grade}
                          </p>
                          <p className="mt-1 text-[10px] text-zinc-600">{item.offers.length} hub disponibili</p>
                          <div className="mt-1 flex items-center justify-between text-[10px]">
                            <span className="font-semibold text-zinc-900">EUR {item.offers[0]?.price}</span>
                            <span className="text-emerald-700">{item.trend}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {filteredMarketItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openMobileMarketDetail(item.id)}
                          className="w-full rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-[11px] font-medium text-zinc-800">{item.name}</p>
                              <p className="text-[10px] text-zinc-500">
                                {item.category} • {item.grade} • {item.offers.length} hub
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-zinc-900">EUR {item.offers[0]?.price}</p>
                              <p className="text-[10px] text-emerald-700">{item.trend}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                    </>
                  ) : (
                    <div className="mt-2 rounded-2xl border border-zinc-200 bg-white p-2.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setMobileMarketPage("catalog")}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600"
                        >
                          Indietro
                        </button>
                        <p className="text-[11px] font-medium text-zinc-800">Dettaglio carta</p>
                        <button
                          type="button"
                          onClick={() => setMobileMarketPage("catalog")}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-600"
                        >
                          Chiudi
                        </button>
                      </div>
                      <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200">
                        <Image
                          src={selectedMobileMarketCard.image}
                          alt={selectedMobileMarketCard.name}
                          width={720}
                          height={420}
                          className="h-42 w-full object-cover"
                        />
                      </div>
                      <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-2">
                        <p className="text-[11px] font-semibold text-zinc-900">{selectedMobileMarketCard.name}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          {selectedMobileMarketCard.category} • {selectedMobileMarketCard.grade}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className="text-zinc-600">Trend</span>
                          <span className="font-medium text-emerald-700">{selectedMobileMarketCard.trend}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          <span className="text-zinc-600">Miglior prezzo</span>
                          <span className="font-semibold text-zinc-900">EUR {selectedMobileMarketCard.offers[0]?.price}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] font-medium text-zinc-700">Opzioni acquisto per hub</p>
                      <div className="mt-2 space-y-1.5">
                        {selectedMobileMarketCard.offers.map((offer) => {
                          const cartId = `${selectedMobileMarketCard.id}-${offer.hub}`;
                          const cartLabel = `${selectedMobileMarketCard.name} • ${offer.hub}`;
                          const alreadyInCart = cart.some((entry) => entry.id === cartId);
                          return (
                            <div
                              key={`${selectedMobileMarketCard.id}-${offer.hub}`}
                              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-medium text-zinc-800">{offer.hub} Hub</p>
                                  <p className="text-[10px] text-zinc-500">
                                    ETA {offer.eta} • Qty {offer.qty}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-semibold text-zinc-900">EUR {offer.price}</p>
                                  <button
                                    type="button"
                                    onClick={() => addToCart({ id: cartId, name: cartLabel, price: offer.price })}
                                    className={`mt-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                                      alreadyInCart ? "bg-zinc-200 text-zinc-500" : "bg-zinc-900 text-white"
                                    }`}
                                  >
                                    {alreadyInCart ? "Nel carrello" : "Acquista"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {activeScreen === "cart" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Ordini</p>
                    <p className="mt-1 text-xs text-zinc-600">Ordine consolidato multi-seller in unica spedizione.</p>
                  </div>
                  {cart.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-5 text-center text-xs text-zinc-500">
                      Carrello vuoto. Aggiungi carte dal marketplace.
                    </div>
                  ) : (
                    <>
                      <div className="mt-3 space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700">
                            <div className="flex items-center justify-between gap-2">
                              <span>{item.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] text-zinc-600"
                              >
                                Rimuovi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                        One shipment: checkout pronto | Totale EUR {cartTotal}
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {activeScreen === "ready-one-day" ? (
                <div className="h-full">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                    <p className="text-sm font-semibold text-zinc-900">Routing hub 24h</p>
                    <p className="mt-1 text-xs text-zinc-600">Spedizione immediata dal nodo logistico piu vicino.</p>
                  </div>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200">
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      src={judgeCameraVideo}
                      className="h-60 w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {(["Milan", "Berlin", "Paris"] as const).map((hub) => (
                      <button
                        key={hub}
                        type="button"
                        onClick={() => setSelectedHub(hub)}
                        className={`rounded-md border px-2 py-1 text-[10px] ${
                          selectedHub === hub
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-white text-zinc-600"
                        }`}
                      >
                        {hub}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    Hub attivo: {selectedHub} | Ready-to-ship in &lt;24h
                  </div>
                </div>
              ) : null}

            </div>

            <div className="border-t border-zinc-200 bg-white/90 px-2.5 py-2 backdrop-blur-xl">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {screens.map((screen) => {
                const Icon = screen.icon;
                const isActive = screen.id === activeScreen;
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActiveScreen(screen.id)}
                    className={`shrink-0 rounded-2xl border px-2.5 py-2 text-[10px] leading-tight shadow-sm transition-all duration-300 ${
                      isActive
                        ? "border-white/80 bg-white/80 text-zinc-900 shadow-[0_8px_24px_rgba(15,23,42,0.16)] backdrop-blur-xl"
                        : "border-white/60 bg-white/45 text-zinc-600 backdrop-blur-lg"
                    }`}
                    aria-label={screen.label}
                    title={screen.label}
                  >
                    <span className="flex items-center gap-1.5">
                      {screen.id === "cart" ? (
                        <motion.span
                          key={`cart-bounce-${cartIconBounceTick}`}
                          initial={{ y: 0, scale: 1 }}
                          animate={
                            cartIconBounceTick > 0
                              ? { y: [0, -8, 0, -4, 0], scale: [1, 1.12, 1, 1.06, 1] }
                              : { y: 0, scale: 1 }
                          }
                          transition={{ duration: 0.45, ease: "easeOut" }}
                          className="inline-flex"
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-zinc-900" : "text-zinc-500"}`} />
                        </motion.span>
                      ) : (
                        <Icon className={`h-4 w-4 ${isActive ? "text-zinc-900" : "text-zinc-500"}`} />
                      )}
                      <span
                        className={`overflow-hidden whitespace-nowrap text-[10px] font-medium transition-all duration-300 ${
                          isActive ? "max-w-[110px] opacity-100" : "max-w-0 opacity-0"
                        }`}
                      >
                        {screen.label}
                      </span>
                    </span>
                  </button>
                );
              })}
              </div>
            </div>
            <div className="flex justify-center border-t border-zinc-200/80 bg-white py-2">
              <span className="h-1.5 w-28 rounded-full bg-zinc-300" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
export function HeroLiveSection() {
  const { t } = useLanguage();

  return (
    <section className="px-6 py-8 sm:px-10 lg:px-16 md:snap-start md:min-h-[calc(100vh-72px)]">
      <div className="mx-auto flex min-h-full max-w-6xl flex-col pb-6">
        <div className="mb-5 max-w-4xl">
          <p className="text-sm font-medium tracking-wide text-blue-700">
            Neo-Tactile TCG Arena
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
            {t.slides.s1.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
            {t.slides.s1.description}
          </p>
        </div>
        <MobileAppShowcase />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative hidden flex-1 md:-mx-4 md:block lg:-mx-8"
        >
          <div className="absolute -top-8 left-16 h-28 w-28 rounded-full bg-blue-300/35 blur-3xl" />
          <div className="absolute right-10 -bottom-6 h-32 w-32 rounded-full bg-emerald-300/35 blur-3xl" />
          <div className="relative mx-auto w-full max-w-[1280px]">
            <span className="absolute top-28 -left-1.5 h-12 w-1.5 rounded-r-full bg-zinc-300/85 shadow-sm md:h-16 lg:h-12" />
            <span className="absolute top-44 -left-1.5 h-16 w-1.5 rounded-r-full bg-zinc-300/85 shadow-sm md:h-24 lg:h-20" />
            <span className="absolute top-36 -right-1.5 h-20 w-1.5 rounded-l-full bg-zinc-300/85 shadow-sm md:h-26 lg:h-22" />
            <div className="relative rounded-[2.2rem] border border-zinc-200/90 bg-gradient-to-b from-zinc-100 to-zinc-50 p-2 md:p-2.5 shadow-[0_40px_120px_rgba(15,23,42,0.22)]">
              <div className="absolute top-1.5 left-1/2 z-20 -translate-x-1/2">
                <div className="h-4 w-22 rounded-full bg-zinc-950 shadow-[0_8px_20px_rgba(0,0,0,0.35)] md:h-4 md:w-24 lg:h-3.5 lg:w-20" />
                <motion.span
                  animate={{ opacity: [0.45, 0.95, 0.45] }}
                  transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 right-3 h-1 w-1 -translate-y-1/2 rounded-full bg-emerald-400"
                />
              </div>
              <div className="absolute top-2 right-4 z-20 hidden h-5 w-5 rounded-md border border-zinc-300 bg-white/85 shadow-sm md:block">
                <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700" />
              </div>
              <div className="overflow-hidden rounded-[1.6rem] border border-zinc-300/70 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <DesktopWindow />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
