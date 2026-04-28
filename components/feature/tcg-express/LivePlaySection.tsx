import { Camera, Trophy, Users, Shield, ListPlus, Bell, Play } from "lucide-react";

export function LivePlaySection() {
  return (
    <section className="px-6 pt-4 pb-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-3xl border border-zinc-200 bg-white/80 p-6 sm:p-10">
          <p className="text-sm text-zinc-500">Tornei Live Webcam</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Partecipa ai Tornei Ufficiali dalla tua Webcam
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-zinc-600">
            Gioca tornei settimanali MTG, Pokemon e altri giochi di carte con premi in denaro. 
            Iscriviti in 3 semplici passi, verifica la tua identita via webcam e competi con giocatori da tutta Europa.
          </p>

          {/* Come funzionano i tornei - spiegazioni dal mockup */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <ListPlus className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">1. Iscrizione Rapida</h3>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Scegli il torneo (Standard, Pioneer, Modern, Commander), inserisci il tuo nickname 
                di gioco, seleziona il decklist dalla tua collezione e conferma laccettazione delle regole anti-cheat.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">2. Verifica Webcam</h3>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Attiva la tua webcam per il controllo identita da parte dei giudici verificati. 
                Decklist bloccata prima dellinizio, webcam obbligatoria durante tutto il match.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50">
                <Play className="h-5 w-5 text-rose-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">3. Gioca Live</h3>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Accedi al Match Center, segui le pairing pubblicate in tempo reale. 
                Round Swiss con top cut, tabellone visibile a tutti gli spettatori con streaming integrato.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <Trophy className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-zinc-900">Premi e Classifiche</h3>
              <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
                Montepremi in denaro fino a 2.000 EUR + Store Credit. Scoreboard live con aggiornamenti 
                automatici, classifica Top 8 e tracking punteggi in tempo reale per tutti i partecipanti.
              </p>
            </div>
          </div>

          {/* Info aggiuntive dal mockup */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <Camera className="h-5 w-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-800">Formati Supportati</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Standard, Pioneer, Modern, Commander — tornei BO1 e BO3 con decklist lock.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <Users className="h-5 w-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-800">Spettatori Live</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Migliaia di spettatori seguono i tornei in diretta con chat integrata e possibilita di diventare giudici.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <Bell className="h-5 w-5 text-zinc-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-zinc-800">Notifiche Iscrizione</p>
                <p className="text-xs text-zinc-600 mt-1">
                  Avvisi quando i tornei stanno per iniziare, reminder check-in e aggiornamenti bracket automatici.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
