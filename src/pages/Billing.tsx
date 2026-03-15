import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle2, Zap, Rocket, Star, Home } from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans selection:bg-blue-500/30">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <Link 
            to="/" 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
            title="Página Inicial"
          >
            <Home className="w-5 h-5 text-slate-300" />
          </Link>
          <h2 className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" /> Planos e Faturamento
          </h2>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-16 px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Escolha o seu plano ideal</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Potencialize sua criação de conteúdo com inteligência artificial de elite.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plano Starter */}
          <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 97</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> 10 Carrosséis por mês
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Pesquisa Perplexity Basic
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm text-slate-600 line-through">
                Busca de fotos Premium
              </li>
            </ul>
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10">
              Assinar Agora
            </button>
          </div>

          {/* Plano Pro (Destaque) */}
          <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 border-2 border-indigo-500 p-8 rounded-3xl relative overflow-hidden group shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-4 py-1 rounded-bl-xl uppercase tracking-widest">
              Mais Popular
            </div>
            <div className="mb-8">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-2">
                <Zap className="w-4 h-4 fill-indigo-400" /> Plano Profissional
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 197</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Posts Ilimitados
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Motor Perplexity Turbo
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Busca de fotos IA Premium
              </li>
              <li className="flex items-center gap-3 text-slate-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Suporte VIP Prioritário
              </li>
            </ul>
            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20">
              Quero ser Pro
            </button>
          </div>

          {/* Plano Agency */}
          <div className="bg-slate-900 border border-white/5 p-8 rounded-3xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-2">Agency</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">R$ 497</span>
                <span className="text-slate-500 font-medium">/mês</span>
              </div>
            </div>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Até 10 Perfis (DNA)
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Aprovação via Link Externo
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Exportação em Alta Definição
              </li>
            </ul>
            <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10">
              Assinar Agency
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
