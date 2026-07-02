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
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'tornei-live',
    date: '2026-06-09',
    dateLabel: '9 giugno 2026',
    tag: 'Tornei',
    tagClass: 'bg-violet-100 text-violet-700',
    title: 'Arrivano i Tornei live: gioca, vinci, fatti un nome',
    excerpt:
      'Da oggi puoi sfidare la community nei tornei live con premi in crediti e classifiche.',
    paragraphs: [
      'Il tavolo da gioco si accende: da oggi su Ebartex trovi i Tornei live. Ogni settimana nuovi eventi con premi in crediti, classifiche e la possibilità di farti un nome nella community.',
      'Iscriverti è semplicissimo: apri il portale Tornei, scegli l’evento e prenota il tuo posto. Round in diretta, avversari reali e una classifica da scalare.',
    ],
  },
  {
    slug: 'cameramatch-beta',
    date: '2026-05-14',
    dateLabel: '14 maggio 2026',
    tag: 'Scanner',
    tagClass: 'bg-sky-100 text-sky-700',
    title: 'CameraMatch (beta): inquadra una carta, la troviamo noi',
    excerpt:
      'Il nuovo scanner riconosce le tue carte dalla fotocamera del telefono, direttamente nel browser.',
    paragraphs: [
      'Digitare nomi lunghissimi è ufficialmente storia: con CameraMatch inquadri una carta con la fotocamera e il riconoscimento avviene in tempo reale, direttamente nel browser, senza installare nulla.',
      'La beta parte da Magic: The Gathering. Usala per cercare una carta al volo, aggiungerla all’inventario o metterla in vendita in pochi secondi.',
    ],
  },
  {
    slug: 'brx-express',
    date: '2026-04-28',
    dateLabel: '28 aprile 2026',
    tag: 'BRX Express',
    tagClass: 'bg-orange-100 text-orange-700',
    title: 'BRX Express: inviaci le tue carte, al resto pensiamo noi',
    excerpt:
      'Il modo più comodo di vendere: spedisci a noi le tue carte, le verifichiamo e vendiamo per te.',
    paragraphs: [
      'Vendere una collezione richiede tempo: foto, schede, spedizioni, messaggi. Con BRX Express ci pensiamo noi: ci invii le tue carte, le verifichiamo, le fotografiamo e le mettiamo in vendita al posto tuo.',
      'Tu segui tutto dal tuo account e incassi a ogni vendita. Semplice, tracciato e veloce — è il servizio perfetto per chi ha tante carte e poco tempo.',
    ],
  },
  {
    slug: 'scambi',
    date: '2026-04-15',
    dateLabel: '15 aprile 2026',
    tag: 'Scambi',
    tagClass: 'bg-emerald-100 text-emerald-700',
    title: 'Scambi: le carte che vuoi, senza spendere',
    excerpt:
      'Da oggi puoi scambiare i tuoi doppioni con gli altri collezionisti, direttamente sul tavolo di scambio.',
    paragraphs: [
      'I doppioni smettono di prendere polvere: con gli Scambi metti le tue carte sul tavolo, scegli quelle che ti mancano dall’inventario di un altro collezionista e proponi lo scambio.',
      'Puoi compensare le differenze di valore con i crediti e scegliere tra spedizione diretta o Ebartex come intermediario. Completare i set non è mai stato così divertente.',
    ],
  },
  {
    slug: 'aste-live',
    date: '2026-04-02',
    dateLabel: '2 aprile 2026',
    tag: 'Aste',
    tagClass: 'bg-amber-100 text-amber-700',
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
