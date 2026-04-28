"use client";
import { motion } from "framer-motion";
import { Monitor, Radio, Video, Mic, Bolt, Bell, Users, Dices, ExternalLink, Crown, Layers, ListPlus, Trophy, ShoppingBag, ShoppingCart, PackageOpen, CheckCircle2 } from "lucide-react";

const fu={hidden:{opacity:0,y:20},visible:(d=0)=>({opacity:1,y:0,transition:{duration:0.6,delay:d}})};
function Dot({c}:{c:string}){return <span className={`h-2.5 w-2.5 rounded-full ${c}`}/>}
function M({i,l,a=false}:{i:React.ReactNode;l:string;a?:boolean}){return <div className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[11px] font-medium ${a?"bg-[#1D3160]/10 text-[#1D3160]":"text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"}`}>{i}<span>{l}</span></div>}
function CardP({g}:{g:string}){return <div className={`relative aspect-[63/88] w-full rounded-md border border-white/10 shadow-sm ${g}`}><div className="absolute inset-1 rounded-sm bg-white/5"/></div>}

export function NeoTactileMockup(){
  return (
    <motion.section className="py-8 md:py-14" initial="hidden" whileInView="visible" viewport={{once:true,amount:0.2}}>
      <motion.div variants={fu} custom={0} className="mb-6 text-center">
        <span className="mb-3 inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-700">Piattaforma Tornei</span>
        <h2 className="mt-2 text-2xl font-extrabold text-zinc-900 sm:text-3xl">Neo-Tactile Arena</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500">L&apos;interfaccia di gioco integrata per tornei live con webcam, scoreboard in tempo reale e verifica judge.</p>
      </motion.div>

      <motion.div variants={fu} custom={0.15} className="mx-auto w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60">
          {/* Top bar */}
          <div className="relative flex h-10 items-center justify-between border-b border-zinc-100 bg-white px-4">
            <div className="flex items-center gap-1.5"><Dot c="bg-red-400"/><Dot c="bg-amber-400"/><Dot c="bg-emerald-400"/></div>
            <div className="absolute left-1/2 top-0 z-10 h-5 w-32 -translate-x-1/2 rounded-b-xl bg-zinc-900"/>
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500"><Bell className="h-3.5 w-3.5"/><span>Round 4</span></div>
          </div>
          {/* App header */}
          <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              <Monitor className="h-4 w-4 text-[#FF7300]"/><span>Neo-Tactile Arena</span><span className="text-zinc-300">•</span><span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600">Match Live</span>
            </div>
          </div>
          {/* Workspace */}
          <div className="flex min-h-[420px] flex-col md:flex-row">
            {/* Left sidebar */}
            <div className="w-full border-r border-zinc-100 bg-zinc-50/60 p-3 md:w-52">
              <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-400">Workspace</p>
              <div className="space-y-0.5">
                <M i={<Crown className="h-3.5 w-3.5"/>} l="Match Center" a/>
                <M i={<Layers className="h-3.5 w-3.5"/>} l="Decklist"/>
                <M i={<ListPlus className="h-3.5 w-3.5"/>} l="Crea Torneo"/>
                <M i={<Trophy className="h-3.5 w-3.5"/>} l="Tornei Live"/>
                <M i={<ShoppingBag className="h-3.5 w-3.5"/>} l="Marketplace"/>
                <M i={<ShoppingCart className="h-3.5 w-3.5"/>} l="Carrello"/>
                <M i={<PackageOpen className="h-3.5 w-3.5"/>} l="Ready One Day"/>
              </div>
            </div>
            {/* Center stage */}
            <div className="flex-1 bg-[#0f1115] p-3 text-white">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-[#181b21] px-3 py-2">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-300">
                  <Radio className="h-3.5 w-3.5 text-emerald-400"/><span>Stream principale</span><span className="text-zinc-600">•</span><span className="text-zinc-400">Vista doppio tavolo</span>
                </div>
                <div className="flex items-center gap-2">
                  {["Microfono","Camera","Toggle rapido"].map((lbl,idx)=>(
                    <button key={lbl} className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-zinc-700">
                      {idx===0?<Mic className="h-3 w-3"/>:idx===1?<Video className="h-3 w-3"/>:<Bolt className="h-3 w-3"/>}
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              {/* Player rows */}
              {[
                {name:"You",tag:"Local Player (Default View)",vs:"Alex_M",badge:"bg-[#FF7300]/20 text-[#FF7300]",cs:["from-blue-900 to-slate-800","from-emerald-900 to-slate-800","from-amber-900 to-slate-800","from-blue-900 to-slate-800","from-emerald-900 to-slate-800","from-amber-900 to-slate-800","from-blue-900 to-slate-800"]},
                {name:"Alex_M",tag:"Opponent",vs:"You",badge:"bg-violet-500/20 text-violet-300",cs:["from-rose-900 to-slate-800","from-cyan-900 to-slate-800","from-violet-900 to-slate-800","from-rose-900 to-slate-800","from-cyan-900 to-slate-800","from-violet-900 to-slate-800","from-rose-900 to-slate-800"]}
              ].map((p)=>(
                <div key={p.name} className="relative mb-3 rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1d24] to-[#12141a] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className={`rounded ${p.badge} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>{p.name}</span><span className="text-[10px] text-zinc-400">{p.tag}</span></div>
                    <span className="text-[10px] font-semibold text-zinc-500">vs {p.vs}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {p.cs.map((g,i)=><CardP key={i} g={`bg-gradient-to-br ${g}`}/>)}
                  </div>
                  <div className="absolute right-3 top-3 rounded-lg border border-white/10 bg-zinc-900/90 p-1.5 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 px-1"><Video className="h-3 w-3 text-zinc-400"/><span className="text-[9px] font-medium text-zinc-400">Webcam</span><span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">Live</span></div>
                    <div className="mt-1 flex h-16 w-24 items-center justify-center rounded bg-zinc-800"><Users className="h-5 w-5 text-zinc-600"/></div>
                  </div>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800"><Dices className="h-4 w-4 text-zinc-300"/></div><span className="text-sm font-bold text-white">18</span></div>
                <button className="flex items-center gap-1.5 rounded-lg bg-[#1D3160] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#243663]"><ExternalLink className="h-3 w-3"/>Apri finestra</button>
              </div>
            </div>
            {/* Right sidebar */}
            <div className="w-full border-l border-zinc-100 bg-white p-3 md:w-56">
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Feed Judge</span><Bell className="h-3.5 w-3.5 text-zinc-400"/></div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                  <div className="mb-2 flex h-12 w-full items-center justify-center rounded-lg bg-zinc-200"><Users className="h-5 w-5 text-zinc-400"/></div>
                  <p className="text-[10px] leading-relaxed text-zinc-600">Judge_Miler online. Integrità del match verificata.</p>
                </div>
              </div>
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Scoreboard live</span><Users className="h-3.5 w-3.5 text-zinc-400"/></div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"><span className="text-[10px] font-semibold text-zinc-700">Alex_M</span><div className="text-right"><div className="text-[10px] font-bold text-zinc-900">HP 20</div><div className="text-[9px] text-zinc-500">Energy 6</div></div></div>
                  <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2"><span className="text-[10px] font-semibold text-zinc-700">Sarah_J</span><div className="text-right"><div className="text-[10px] font-bold text-zinc-900">HP 18</div><div className="text-[9px] text-zinc-500">Energy 5</div></div></div>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Chat spettatori</span><ExternalLink className="h-3.5 w-3.5 text-zinc-400"/></div>
                <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-2"><p className="text-[10px] text-zinc-600"><span className="font-semibold text-zinc-800">Alex_M:</span> Klare Linie, nächster Zug ist lethal.</p></div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
                <p className="text-[10px] font-semibold text-emerald-800">Valore Cardmarket</p>
                <div className="mt-1.5 space-y-1 text-[10px] text-emerald-700">
                  <div className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5"/><span>Riduzione esposizione spedizioni UPU</span></div>
                  <div className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5"/><span>Ready One Day: dispatch 24h da hub locali</span></div>
                  <div className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5"/><span>Zero CAPEX: margine extra con fulfillment gestito</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
}
