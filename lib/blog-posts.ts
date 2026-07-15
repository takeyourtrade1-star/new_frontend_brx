/**
 * Post del blog / annunci Ebartex.
 * Contenuto editoriale (non chrome UI): testi in italiano, come le altre
 * pagine editoriali. Le date ricalcano l'introduzione reale delle feature
 * nella storia del repository (aste/scambi dal primo commit 2026-03-25,
 * BRX Express 2026-04-28, scanner 2026-05-14, tornei 2026-06-09).
 */

export type BlogPost = {
  slug: string;
  /** ISO date, usata per ordinare e per <time dateTime>. */
  date: string;
  dateLabel: string;
  tag: string;
  /** Colore del tag (classi Tailwind complete, niente stringhe dinamiche). */
  tagClass: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
  /** Call-to-action opzionale in fondo al post (link interno o esterno). */
  cta?: { href: string; label: string };
  /** Feature ancora in lavorazione: mostra il badge "In lavorazione" accanto al tag. */
  wip?: boolean;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'scambi',
    date: '2026-07-15',
    dateLabel: '15 luglio 2026',
    tag: 'Scambi',
    tagClass: 'bg-emerald-100 text-emerald-700',
    title: 'Gli Scambi sono ufficialmente live: entra nella beta',
    excerpt:
      'Trasforma i doppioni nelle carte che cerchi: gli Scambi Ebartex sono aperti e pronti da provare.',
    paragraphs: [
      'Da oggi gli Scambi Ebartex sono ufficialmente live in beta. Cerca un collezionista, guarda le carte che ha messo a disposizione e componi una proposta usando quelle del tuo inventario.',
      'Puoi inviare e ricevere proposte, confrontare con chiarezza le carte sui due lati e seguire ogni scambio fino alla risposta. Tutto parte dalle collezioni reali degli utenti.',
      'Questa beta serve anche a costruire il servizio insieme alla community: provalo, completa il tuo primo scambio e raccontaci cosa possiamo rendere ancora più semplice e veloce.',
    ],
    cta: { href: '/scambi', label: 'Prova gli Scambi (beta) →' },
  },
  {
    slug: 'tornei-live',
    date: '2026-07-09',
    dateLabel: '9 luglio 2026',
    tag: 'Tornei',
    tagClass: 'bg-violet-100 text-violet-700',
    title: 'I Tornei sono arrivati: parte la Pre-beta, aperta a tutti',
    excerpt:
      'Sfide 1v1 in webcam, tavoli live e chat di partita: i Tornei Ebartex sono finalmente realtà. Entra nella Pre-beta e aiutaci a renderli perfetti.',
    paragraphs: [
      'Ci siamo davvero: i Tornei Ebartex sono finalmente arrivati, in versione Pre-beta. Sfide 1v1 in webcam contro avversari reali, tavoli live, chat di partita e ready check: tutto quello che abbiamo costruito in questi mesi è da oggi aperto a chiunque voglia provarlo.',
      'Perché “Pre-beta”? Perché il bello deve ancora venire, e vogliamo costruirlo insieme a voi. Entra, gioca le tue partite e se noti qualcosa che non funziona — o che vorresti diverso — faccelo sapere: ogni segnalazione, ogni screenshot, ogni idea ci aiuta a migliorare il prodotto per tutta la community.',
      'Non ti serve nient’altro che il tuo account Ebartex e una webcam. Scegli un tavolo, siediti, sfida il tuo avversario faccia a faccia e scrivi con noi il primo capitolo dei Tornei.',
    ],
    cta: { href: '/tornei', label: 'Entra nei Tornei (Pre-beta) →' },
  },
  {
    slug: 'cameramatch-beta',
    date: '2026-05-14',
    dateLabel: '14 maggio 2026',
    tag: 'Scanner',
    tagClass: 'bg-sky-100 text-sky-700',
    title: 'Asso Vision (beta): inquadra una carta, la troviamo noi',
    excerpt:
      'Il nuovo scanner riconosce le tue carte dalla fotocamera del telefono, direttamente nel browser.',
    paragraphs: [
      'Digitare nomi lunghissimi è ufficialmente storia: con Asso Vision inquadri una carta con la fotocamera e il riconoscimento avviene in tempo reale, direttamente nel browser, senza installare nulla.',
      'La beta parte da Magic: The Gathering. Usala per cercare una carta al volo, aggiungerla all’inventario o metterla in vendita in pochi secondi.',
    ],
  },
  {
    slug: 'brx-express',
    date: '2026-04-28',
    dateLabel: '28 aprile 2026',
    tag: 'BRX Express',
    tagClass: 'bg-orange-100 text-orange-700',
    wip: true,
    title: 'BRX Express: inviaci le tue carte, al resto pensiamo noi',
    excerpt:
      'Il modo più comodo di vendere: spedisci a noi le tue carte, le verifichiamo e vendiamo per te.',
    paragraphs: [
      'Vendere una collezione richiede tempo: foto, schede, spedizioni, messaggi. Con BRX Express ci pensiamo noi: ci invii le tue carte, le verifichiamo, le fotografiamo e le mettiamo in vendita al posto tuo.',
      'Tu segui tutto dal tuo account e incassi a ogni vendita. Semplice, tracciato e veloce — è il servizio perfetto per chi ha tante carte e poco tempo.',
    ],
  },
  {
    slug: 'aste-live',
    date: '2026-04-02',
    dateLabel: '2 aprile 2026',
    tag: 'Aste',
    tagClass: 'bg-amber-100 text-amber-700',
    wip: true,
    title: 'Aste live: aggiudicati le carte che insegui',
    excerpt:
      'Rilanci in diretta, anti-snipe e pagamenti protetti: le aste arrivano su Ebartex.',
    paragraphs: [
      'Battere un rilancio all’ultimo secondo ha un gusto tutto suo. Con le Aste live di Ebartex punti in diretta sulle carte che cerchi, spesso sotto il prezzo di mercato.',
      'Ogni asta ha timer anti-snipe, offerte protette e pagamenti al sicuro fino alla consegna. Metti all’asta le tue carte in pochi passaggi o inizia subito a rilanciare.',
    ],
  },
  {
    slug: 'benvenuti-su-ebartex',
    date: '2026-03-25',
    dateLabel: '25 marzo 2026',
    tag: 'Annunci',
    tagClass: 'bg-blue-100 text-blue-700',
    title: 'Benvenuti su Ebartex',
    excerpt:
      'Nasce il marketplace italiano delle carte collezionabili: compra, vendi e colleziona, partendo da Magic.',
    paragraphs: [
      'Oggi apriamo le porte di Ebartex, il marketplace pensato dai collezionisti per i collezionisti. Si parte con Magic: The Gathering: catalogo completo, ricerca fulminea e vendita tra privati semplice e sicura.',
      'È solo l’inizio: nelle prossime settimane arriveranno aste, scambi, tornei e tanti altri giochi. Grazie a chi c’è fin dal primo giorno.',
    ],
  },
];
