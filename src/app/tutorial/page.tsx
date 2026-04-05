"use client";
import Link from 'next/link';

export default function OnboardingPage() {
  const steps = [
    {
      title: "🚀 Conexão Segura",
      description: "Sua conta está sob Proteção Máxima com Row Level Security (RLS). Seus dados são apenas seus.",
      icon: "🛡️"
    },
    {
      title: "🤖 Geração de Conteúdo",
      description: "Use nosso motor de IA para criar posts, carrosséis e imagens em segundos.",
      icon: "✨"
    },
    {
      title: "📅 Agendamento Inteligente",
      description: "Defina a data, escolha as redes e deixe que a automação cuida do resto.",
      icon: "🕒"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 md:p-24 font-sansSelection">
      <div className="max-w-4xl w-full">
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">
            Bem-vindo ao <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">ContentPlatformCore</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl">Sua jornada para o domínio das redes sociais começa aqui.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, i) => (
            <div key={i} className="glass-card p-8 group hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">{step.icon}</div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6 animate-bounce-subtle">
          <Link 
            href="/create-post" 
            className="bg-white text-black font-black py-4 px-12 rounded-full text-lg hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-purple-500/50"
          >
            Começar Agora →
          </Link>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
            Proteção Máxima Ativa • Supabase RLS Checked
          </p>
        </div>
      </div>

      <style jsx global>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          backdrop-filter: blur(12px);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 3s infinite ease-in-out;
        }
        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
