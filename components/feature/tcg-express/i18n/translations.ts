export const languages = ["de", "en", "it"] as const;

export type Language = (typeof languages)[number];

export type TranslationSchema = {
  nav: { features: string; benefits: string; roi: string; contact: string };
  hero: { title: string; subtitle: string; cta: string; eyebrow: string };
  scroll: {
    sectionLabel: string;
    sectionTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
  };
  bento: {
    title: string;
    subtitle: string;
    feat1: string;
    feat2: string;
    feat3: string;
    feat4: string;
  };
  roi: {
    title: string;
    subtitle: string;
    volume: string;
    benchmark: string;
    resaleFee: string;
    netCommission: string;
  };
  slides: {
    s1: { kicker: string; title: string; description: string; bullets: [string, string] };
    s2: { kicker: string; title: string; description: string; bullets: [string, string, string] };
    s3: { kicker: string; title: string; description: string; bullets: [string, string, string, string] };
    s4: { kicker: string; title: string; description: string; bullets: [string, string, string] };
    s5: { kicker: string; title: string; description: string; bullets: [string, string, string] };
  };
};

export const translations: Record<Language, TranslationSchema> = {
  de: {
    nav: {
      features: "Funktionen",
      benefits: "Vorteile",
      roi: "ROI-Rechner",
      contact: "Kontakt",
    },
    hero: {
      title: "Logistik-Reibung beseitigen. Europa synchronisieren.",
      subtitle:
        "Die dezentralisierte Fulfillment-Lösung exklusiv für Cardmarket. 24h-Versand, API-Echtzeitsynchronisation und null Doppelverkäufe.",
      cta: "Partnerschaft entdecken",
      eyebrow: "Exklusive B2B API-Partnerschaft für Cardmarket",
    },
    scroll: {
      sectionLabel: "Scroll-Story",
      sectionTitle: "Von regulatorischer Krise zu synchronisierter Execution.",
      step1Title: "Die UPU 2026 Krise",
      step1Desc:
        "Internationale Briefe für Waren sind verboten. Die Paketkosten steigen auf bis zu 40€ und zerstören grenzüberschreitende Verkäufe.",
      step2Title: "Dezentrales Hub-Netzwerk",
      step2Desc:
        "Lokale Hubs in ganz Europa sammeln das Inventar. Kunden zahlen nur noch einmal Versand für den gesamten Einkauf.",
      step3Title: "I Sell For You Vault",
      step3Desc:
        "Karten werden für 0,30€ geprüft und über die API sofort im offiziellen Cardmarket-Account gelistet.",
    },
    bento: {
      title: "Unit Economics auf Enterprise-Niveau",
      subtitle: "Skalierbare Vorteile für Cardmarket als Plattformpartner.",
      feat1: "10% Provision (Max 100€)",
      feat2: "0,30€ Grading-Gebühr",
      feat3: "Europaweiter Versand in 24h",
      feat4: "Anti-Doppelverkaufs-System",
    },
    roi: {
      title: "Reservierte Kommissionen für Cardmarket",
      subtitle:
        "Der Wettbewerb verlangt typischerweise 17-18%. Wir berechnen 10% und ihr entscheidet den finalen Nutzertarif.",
      volume: "Monatliches Kartenvolumen",
      benchmark: "Markt-Benchmark: Konkurrenz bei 17-18% für diesen Service.",
      resaleFee: "Eure Endkunden-Kommission (%)",
      netCommission: "Netto-Kommission für Cardmarket",
    },
    slides: {
      s1: {
        kicker: "Slide 1",
        title: "Mehr als ein Marktplatz – Die Heimat der Community",
        description:
          "Der Kern unserer Plattform ist nicht nur der Verkauf, sondern ein echtes Phygital-Ökosystem mit offiziellen Webcam-Turnieren.",
        bullets: [
          "Live-Interaktion mit Chat, Zuschauer-Modus und Community-Judges.",
          "Vom Entertainment zum Kauf: Zuschauer analysieren Decks in Echtzeit und kaufen direkt.",
        ],
      },
      s2: {
        kicker: "Slide 2",
        title: "Turniere als Motor zur Kundengewinnung",
        description:
          "Das Live-Play-System fungiert als massiver Akquisitions-Funnel vom Spiel bis zum Vault.",
        bullets: [
          "Akquisition: Tausende Nutzer loggen sich ein, um zu spielen oder zuzuschauen.",
          "API-Synchronisation: Verkäufer synchronisieren ihr gesamtes Inventar über direkte API.",
          "Ready Showcase: Vault-Karten erscheinen sofort in einer versandbereiten Vitrine.",
        ],
      },
      s3: {
        kicker: "Slide 3",
        title: "Europaweite Konsolidierung durch lokale Hubs",
        description:
          "Um UPU-2026-Kosten (bis zu 40€) zu umgehen, bieten wir Cardmarket exklusiv den Service I Sell For You.",
        bullets: [
          "Dezentrale Logistik-Hubs in Europa minimieren Versandkosten.",
          "Grading, Foto und Upload für nur 0,30€ pro Karte.",
          "Listung auf Cardmarket via gesponsertem offiziellen Account.",
          "Konsolidierte 24h-Lieferung für hunderte Karten in einer Sendung.",
        ],
      },
      s4: {
        kicker: "Slide 4",
        title: "Ein System, das den Status Quo strukturell überholt",
        description:
          "Wir ersetzen die klassische lineare Logistik durch einen orchestrierten Ablauf aus lokalen Hubs, zentralem Vault-Management und Echtzeit-API-Synchronisierung. Ergebnis: schnellere Zustellung, stabilere Margen und deutlich weniger operative Fehler.",
        bullets: [
          "Wie es funktioniert: Verkäufer senden lokal an den nächsten Hub, wir konsolidieren und versenden als eine koordinierte Bestellung statt vieler einzelner Pakete.",
          "Operativer Vorteil: 24h-Dispatch für konsolidierte Bestellungen, weniger Versandfriktion und klar bessere Kundenerfahrung als zentrale 9-14-Tage-Modelle.",
          "Kontrollvorteil: der Vault bleibt Single Source of Truth mit API-Live-Status - dadurch sinken Doppelverkäufe, Ticket-Aufwand und Sperr-Risiken deutlich.",
        ],
      },
      s5: {
        kicker: "Slide 5",
        title: "Risikofreier Profit für Cardmarket (Zero CAPEX)",
        description:
          "Cardmarket behält die volle Kontrolle über Preisstrategie und Marge ohne Lager- oder Personalkosten.",
        bullets: [
          "Wholesale: 10% Servicegebühr mit Schutz-Cap von 100€ pro Karte.",
          "Retail-Markup flexibel: z.B. 15% oder 16% je nach Markt-Test.",
          "Differenz bleibt als reiner Netto-Profit bei Cardmarket.",
        ],
      },
    },
  },
  en: {
    nav: {
      features: "Features",
      benefits: "Benefits",
      roi: "ROI Calculator",
      contact: "Contact Us",
    },
    hero: {
      title: "Eradicate Logistics Friction. Synchronize Europe.",
      subtitle:
        "The decentralized fulfillment solution exclusively for Cardmarket. 24h shipping, real-time API sync, and zero double sales.",
      cta: "Explore Partnership",
      eyebrow: "Exclusive B2B API Partnership for Cardmarket",
    },
    scroll: {
      sectionLabel: "Scrollytelling",
      sectionTitle: "From regulatory crisis to synchronized execution.",
      step1Title: "The 2026 UPU Crisis",
      step1Desc:
        "International letters for goods are banned. Parcel costs are skyrocketing up to 40€, destroying cross-border sales.",
      step2Title: "Decentralized Hub Network",
      step2Desc:
        "Local hubs across Europe collect inventory. Customers pay for shipping only once for their entire order.",
      step3Title: "I Sell For You Vault",
      step3Desc:
        "Cards are graded for 0.30€ and instantly listed on the official Cardmarket account via API.",
    },
    bento: {
      title: "Enterprise-Grade Unit Economics",
      subtitle: "Scalable upside for Cardmarket as strategic platform partner.",
      feat1: "10% Commission (Max 100€)",
      feat2: "0.30€ Grading Fee",
      feat3: "24h European Shipping",
      feat4: "Anti-Double Sales System",
    },
    roi: {
      title: "Reserved Commissions for Cardmarket",
      subtitle:
        "Competitors usually charge around 17-18%. We charge 10%, and you set the final customer fee.",
      volume: "Monthly Card Volume",
      benchmark: "Market benchmark: competitors sit around 17-18% for this service.",
      resaleFee: "Your End-Customer Fee (%)",
      netCommission: "Net Commission for Cardmarket",
    },
    slides: {
      s1: {
        kicker: "Slide 1",
        title: "More Than a Marketplace – The Home of the Community",
        description:
          "Our platform is not just commerce. It is a phygital ecosystem powered by official webcam tournaments.",
        bullets: [
          "Live interaction with chat, spectator mode, and community judges.",
          "From entertainment to purchase: viewers analyze decks and buy instantly.",
        ],
      },
      s2: {
        kicker: "Slide 2",
        title: "Tournaments as a Customer Acquisition Engine",
        description:
          "The live-play system is a high-volume acquisition funnel from the table directly into the vault.",
        bullets: [
          "Acquisition: thousands of qualified users join live events.",
          "API sync: sellers connect and synchronize full inventory instantly.",
          "Ready showcase: vault cards instantly appear in a ready-to-ship storefront.",
        ],
      },
      s3: {
        kicker: "Slide 3",
        title: "European Consolidation via Local Hubs",
        description:
          "To bypass UPU 2026 postal pressure (up to EUR40 parcels), we offer Cardmarket the exclusive I Sell For You model.",
        bullets: [
          "Users ship to decentralized hubs strategically distributed across Europe.",
          "We handle grading, photography, and upload for just EUR0.30 per card.",
          "Listings appear under a sponsored official Cardmarket account.",
          "Customers receive one consolidated 24h shipment across multi-seller orders.",
        ],
      },
      s4: {
        kicker: "Slide 4",
        title: "A System Engineered to Outperform the Status Quo",
        description:
          "We replace legacy linear logistics with an orchestrated model: local hubs, centralized vault governance, and real-time API synchronization. This creates faster delivery, healthier margins, and fewer operational failures.",
        bullets: [
          "How it works: sellers ship locally to the nearest hub, inventory is consolidated, then dispatched as one coordinated order instead of many fragmented parcels.",
          "Operational advantage: 24h dispatch on consolidated flows, lower shipping friction, and a clearly better buyer experience than centralized 9-14 day models.",
          "Control advantage: the vault remains the single source of truth with live API status, reducing double sales, support tickets, and suspension risk.",
        ],
      },
      s5: {
        kicker: "Slide 5",
        title: "Risk-Free Profit Generation for Cardmarket (Zero CAPEX)",
        description:
          "Cardmarket keeps full pricing control and captures margin upside without physical warehouse investment.",
        bullets: [
          "Wholesale fee: 10% with a protective EUR100 cap per card.",
          "Flexible retail markup: test 15%, 16%, or any market-fit fee.",
          "The spread remains pure net profit for Cardmarket.",
        ],
      },
    },
  },
  it: {
    nav: {
      features: "Funzionalità",
      benefits: "Vantaggi",
      roi: "Calcolatore ROI",
      contact: "Contattaci",
    },
    hero: {
      title: "Eradica l'Attrito Logistico. Sincronizza l'Europa.",
      subtitle:
        "La soluzione di fulfillment decentralizzata in esclusiva per Cardmarket. Spedizioni in 24h, sync API in tempo reale e zero doppie vendite.",
      cta: "Scopri la Partnership",
      eyebrow: "Partnership API B2B esclusiva per Cardmarket",
    },
    scroll: {
      sectionLabel: "Scrollytelling",
      sectionTitle: "Dalla crisi normativa all'esecuzione sincronizzata.",
      step1Title: "La Crisi UPU 2026",
      step1Desc:
        "Le lettere internazionali per le merci sono vietate. I costi dei pacchi arrivano fino a 40€, distruggendo le vendite transfrontaliere.",
      step2Title: "Rete di Hub Decentralizzata",
      step2Desc:
        "Hub locali in tutta Europa raccolgono l'inventario. I clienti pagano una sola spedizione per l'intero ordine.",
      step3Title: "Vault I Sell For You",
      step3Desc:
        "Le carte vengono gradate per 0,30€ e listate istantaneamente sull'account ufficiale Cardmarket tramite API.",
    },
    bento: {
      title: "Unit Economics a livello enterprise",
      subtitle: "Vantaggi scalabili per Cardmarket come partner strategico.",
      feat1: "Commissione 10% (Max 100€)",
      feat2: "Costo Grading 0,30€",
      feat3: "Spedizioni Europee in 24h",
      feat4: "Sistema Anti Doppie Vendite",
    },
    roi: {
      title: "Commissioni Riservate a Voi",
      subtitle:
        "La nostra commissione e del 10% sul prezzo di vendita di ogni carta, con tetto massimo di 100 EUR per carta. Voi scegliete liberamente la fee finale verso i vostri utenti e trattenete la differenza come margine netto.",
      volume: "Volume Mensile Carte",
      benchmark: "Benchmark mercato: concorrenti tra 17% e 18% su questo servizio.",
      resaleFee: "Fee finale verso i vostri utenti (%)",
      netCommission: "Commissione netta per Cardmarket",
    },
    slides: {
      s1: {
        kicker: "Slide 1",
        title: "Più di un Marketplace – La Casa della Community",
        description:
          "Il cuore della piattaforma non è solo la vendita, ma un ecosistema phygital con tornei ufficiali via webcam.",
        bullets: [
          "Interazione live con chat, spettatori e judges della community.",
          "Dall'intrattenimento all'acquisto: analisi deck in tempo reale e buy istantaneo.",
        ],
      },
      s2: {
        kicker: "Slide 2",
        title: "I Tornei come Motore di Acquisizione Clienti",
        description:
          "Il live-play funziona come funnel massivo: dal tavolo di gioco al vault in modo naturale.",
        bullets: [
          "Acquisizione: migliaia di utenti profilati entrano per giocare o guardare.",
          "Sync API: i venditori sincronizzano tutto lo stock tramite integrazione diretta.",
          "Vetrina Ready: le carte inviate al vault appaiono subito pronte alla spedizione.",
        ],
      },
      s3: {
        kicker: "Slide 3",
        title: "Consolidamento Europeo tramite Hub Locali",
        description:
          "Per superare le normative UPU 2026 (pacchi tra 15€ e 40€), offriamo a Cardmarket il servizio esclusivo I Sell For You.",
        bullets: [
          "Hub decentralizzati in Europa per ridurre i costi di spedizione locali.",
          "Grading, foto e upload a costo fisso di 0,30€ per carta.",
          "Carte pubblicate su account Cardmarket ufficiale sponsorizzato.",
          "Spedizione consolidata unica in 24h anche su ordini multi-venditore.",
        ],
      },
      s4: {
        kicker: "Slide 4",
        title: "Un Sistema Progettato per Superare lo Status Quo",
        description:
          "Sostituiamo la logistica lineare tradizionale con un modello orchestrato: hub locali, controllo centrale del vault e sincronizzazione API in tempo reale. Il risultato e concreto: consegne piu rapide, margini piu sani e meno errori operativi.",
        bullets: [
          "Come funziona: il venditore spedisce al proprio hub locale, lo stock viene consolidato e poi inviato come ordine coordinato unico, invece di tanti pacchi frammentati.",
          "Vantaggio operativo: dispatch in 24h sui flussi consolidati, meno attrito logistico e un'esperienza cliente nettamente migliore rispetto ai modelli centralizzati da 9-14 giorni.",
          "Vantaggio di controllo: il vault resta la single source of truth con stato API live, riducendo doppie vendite, ticket di supporto e rischio di sospensioni.",
        ],
      },
      s5: {
        kicker: "Slide 5",
        title: "Commissioni Riservate a Voi (Zero CAPEX)",
        description:
          "La concorrenza per questo servizio si posiziona intorno al 17-18%. Noi chiediamo il 10% e vi lasciamo totale controllo sulla fee finale.",
        bullets: [
          "Benchmark di mercato: competitor tipicamente al 17-18%.",
          "Nostra commissione wholesale: 10% con cap protettivo a 100€ per carta.",
          "Potete impostare la fee finale (es. 16%): la differenza diventa vostra commissione netta (6%).",
        ],
      },
    },
  },
};
