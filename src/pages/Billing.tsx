import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, CheckCircle2, Home } from 'lucide-react';

export default function Billing() {
  const navigate = useNavigate();

  const packages = [
    {
      posts: 10,
      price: '49,90',
      pricePerPost: '4,99',
      popular: false,
    },
    {
      posts: 15,
      price: '69,90',
      pricePerPost: '4,66',
      popular: false,
    },
    {
      posts: 20,
      price: '89,90',
      pricePerPost: '4,49',
      popular: true,
    },
    {
      posts: 30,
      price: '119,70',
      pricePerPost: '3,99',
      popular: false,
    }
  ];

  const handleBuy = (posts: number) => {
    alert(`Redirecionando para o Stripe Checkout (Pacote de ${posts} posts) ... (Em implementação)`);
  };

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
            <CreditCard className="w-5 h-5 text-indigo-400" /> Faturamento e Créditos
          </h2>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-16 px-6">
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6">
            Adquira mais créditos
          </h1>
          <p className="text-slate-400 text-lg">
            Sua conta utiliza um sistema pré-pago sem mensalidades surpresas. Os créditos não expiram e cada crédito permite faturar 1 post de altíssimo nível.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg, idx) => (
            <div 
              key={idx} 
              className={`relative bg-slate-900 rounded-3xl border ${pkg.popular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-105 z-10' : 'border-white/10'} p-8 flex flex-col items-center flex-1 transition-all`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg">
                  Mais Popular
                </div>
              )}
              <div className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                Posts de IA
              </div>
              <h3 className="text-4xl font-black text-white mb-8">{pkg.posts}</h3>

              <div className="text-3xl font-extrabold text-white mb-1 flex items-baseline gap-1">
                <span className="text-lg text-slate-500 font-medium tracking-normal">R$</span> {pkg.price}
              </div>
              <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-10 text-center">
                R$ {pkg.pricePerPost} <span className="opacity-70">/ post</span>
              </div>

              <div className="w-full space-y-3 mb-10 text-sm text-slate-400">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Pesquisa Turbo IA</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Copy Especializada</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Imagens Inteligentes</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ficam Salvos no Banco</div>
              </div>

              <button 
                onClick={() => handleBuy(pkg.posts)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-auto text-sm ${pkg.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
              >
                <CreditCard className="w-4 h-4" /> Comprar via Stripe
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
