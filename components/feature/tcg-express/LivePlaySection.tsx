import { Camera, ShoppingCart, Vault } from "lucide-react";

export function LivePlaySection() {
  return (
    <section className="px-6 pt-4 pb-24 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="glass-panel rounded-3xl border border-zinc-200 bg-white/80 p-6 sm:p-10">
          <p className="text-sm text-zinc-500">Live-Play Integration (Phygital)</p>
          <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Community-Driven Commerce: dal torneo webcam all&apos;acquisto dal
            Vault Cardmarket in un click.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <Camera className="h-5 w-5 text-blue-500" />
              <p className="mt-3 text-sm text-zinc-700">
                Match live e showcase in tempo reale durante i tornei webcam.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <Vault className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-sm text-zinc-700">
                La carta mostrata e gia disponibile nel Vault sincronizzato.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-sm text-zinc-700">
                Lo spettatore converte in buyer con acquisto immediato su
                Cardmarket.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
