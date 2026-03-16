import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillingModal({ isOpen, onClose }: BillingModalProps) {
  if (!isOpen) return null;

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
    // Aqui vai a integração do Stripe Checkout que o usuário vai providenciar.
    // Você pode redirecionar para links diretos de checkout do Stripe com base no pacote.
    alert(`Redirecionando para o Stripe para o pacote de ${posts} posts... (Em implementação)`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="p-8 md:p-12 text-center border-b border-white/10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Oops! Você está sem créditos 🚀
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Seus créditos gratuitos acabaram. Para continuar gerando posts incríveis com Inteligência Artificial, escolha um pacote abaixo. Os créditos não expiram.
            </p>
          </div>

          <div className="p-8 bg-black/20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {packages.map((pkg, idx) => (
                <div 
                  key={idx} 
                  className={`relative bg-slate-800 rounded-2xl border ${pkg.popular ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' : 'border-white/10'} p-6 flex flex-col items-center flex-1`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                      Mais Popular
                    </div>
                  )}
                  <div className="text-slate-400 text-sm mb-2 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    Posts de IA
                  </div>
                  <h3 className="text-3xl font-black text-white mb-6">{pkg.posts}</h3>

                  <div className="text-3xl font-extrabold text-white mb-1">
                    <span className="text-lg text-slate-500 font-medium">R$</span> {pkg.price}
                  </div>
                  <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                    R$ {pkg.pricePerPost} por post
                  </div>

                  <button 
                    onClick={() => handleBuy(pkg.posts)}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-auto ${pkg.popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  >
                    <CreditCard className="w-4 h-4" /> Comprar
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mt-8 font-medium">
              Pagamento rápido e 100% seguro via Stripe. Os créditos são adicionados automaticamente à sua conta.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
