import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Loader2, ArrowRight, LayoutTemplate, Image as ImageIcon, MessageSquare, ExternalLink, Globe, CheckCircle2, ArrowLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { researchTopic } from '../lib/ai/research';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BillingModal from '../components/BillingModal';

export default function CreatePost() {
  const { user, userCredits, fetchCredits } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [topic, setTopic] = useState(searchParams.get('topic') || '');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [numSlides, setNumSlides] = useState(5);
  const [selectedTone, setSelectedTone] = useState('informativo');
  const [selectedDensity, setSelectedDensity] = useState('objetivo');
  const [isSearching, setIsSearching] = useState(false);
  const [researchData, setResearchData] = useState<any>(null);
  const [step, setStep] = useState(1); 

  useEffect(() => {
    if (searchParams.get('topic')) {
      setTopic(searchParams.get('topic') || '');
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (userCredits <= 0) {
      setShowBillingModal(true);
      return;
    }

    setStep(2);
    setIsSearching(true);
    
    // Chamada real para a API do Perplexity + OpenAI passando o tom e densidade
    const result = await researchTopic(topic, numSlides, selectedTone, selectedDensity);
    
    if (result.success) {
      // Deduz 1 crédito usando a função segura do Banco
      await supabase.rpc('deduct_user_credit');
      await fetchCredits(); // Atualiza contador na tela

      // Criar rascunho automático no Supabase
      const { data: savedPost, error: saveError } = await supabase
        .from('posts')
        .insert([
          { 
            title: topic,
            content: { 
              slides: result.generatedData.slides, 
              caption: result.generatedData.legenda_instagram_facebook 
            },
            user_id: user?.id,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (saveError) console.error("Erro ao salvar rascunho:", saveError);

      setResearchData({
        success: true,
        sources: result.originalSources,
        synthesis: result.synthesis,
        generatedData: result.generatedData,
        postId: savedPost?.id
      });
      setStep(3);
    } else {
      alert("Falha ao comunicar com a inteligência artificial. Verifique se sua chave da API da Perplexity é válida.");
      setStep(1);
    }
    
    setIsSearching(false);
  };

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans selection:bg-blue-500/30">
      
      <BillingModal isOpen={showBillingModal} onClose={() => setShowBillingModal(false)} />

      {/* Header Premium */}
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold tracking-tight">Criação com IA Engine</h2>
              <p className="text-slate-400 text-xs font-medium">Motor de Pesquisa em Tempo Real</p>
            </div>
          </div>
        </div>
        
        {/* Créditos Display */}
        <div 
          onClick={() => setShowBillingModal(true)}
          className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-white/10 px-4 py-2 rounded-xl cursor-pointer transition-colors"
          title="Clique para adicionar mais créditos"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          <span className="text-sm font-bold text-white">{userCredits}</span>
          <span className="text-xs font-medium text-slate-400">créditos</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        
        <AnimatePresence mode="wait">
          
          {/* PASSO 1: Busca Estilo Google/Perplexity */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="mb-8">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 inline-flex flex-wrap justify-center gap-3">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                    O que vamos
                  </span>
                  <span className="text-white">criar hoje?</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto italic font-light">
                  Buscando tendências em tempo real e estruturando o post perfeito.
                </p>
              </div>

              <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-[#121214] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transition-all group-hover:border-white/20">
                  
                  {/* Linha 1: Input de Texto */}
                  <div className="flex items-start p-2 pt-4 px-6">
                    <Search className="w-6 h-6 text-slate-500 hidden md:block mt-4" />
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (topic.trim()) handleSearch(e as any);
                        }
                      }}
                      onInput={(e) => {
                        const el = e.target as HTMLTextAreaElement;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
                      }}
                      placeholder="Sobre o que vamos criar hoje?"
                      className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none focus:ring-0 text-xl md:text-2xl placeholder:text-slate-700 font-medium resize-none overflow-hidden"
                      rows={1}
                      autoFocus
                    />
                  </div>
                  
                  {/* Linha 2: Controles de Configuração */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 md:p-6 bg-black/30 border-t border-white/5">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tom de Voz</label>
                        <select
                          value={selectedTone}
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer outline-none hover:bg-slate-800 transition-colors"
                        >
                          <option value="informativo">📊 Informativo</option>
                          <option value="pessoal">✍️ Primeira Pessoa</option>
                          <option value="agressivo">🔥 Agressivo</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estilo do Texto</label>
                        <select
                          value={selectedDensity}
                          onChange={(e) => setSelectedDensity(e.target.value)}
                          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer outline-none hover:bg-slate-800 transition-colors"
                        >
                          <option value="objetivo">🎯 Objetivo</option>
                          <option value="denso">📚 Denso</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Extensão</label>
                        <select
                          value={numSlides}
                          onChange={(e) => setNumSlides(Number(e.target.value))}
                          className="bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm cursor-pointer outline-none hover:bg-slate-800 transition-colors"
                        >
                          {[3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} Lâminas</option>)}
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={!topic.trim()}
                      className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95 text-lg"
                    >
                      Gerar Insight <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {/* PASSO 2: Loading Animado */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-[40px] opacity-30 rounded-full"></div>
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin relative" />
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-center space-y-2"
              >
                <h3 className="text-2xl font-bold text-white">Analisando a Web...</h3>
                <p className="text-slate-400">Lendo os artigos mais recentes sobre "{topic}"</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Processando com as melhores IAs do mercado...</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* PASSO 3: Resultados */}
          {step === 3 && researchData && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Estrutura Pronta</h2>
                  <p className="text-slate-400">Baseado nas tendências de hoje sobre "{topic}"</p>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Nova Pesquisa
                </button>
              </div>

              {/* Estratégia / Research */}
              <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3">
                    <Sparkles className="w-7 h-7 text-indigo-400" /> Estratégia do Copywriter
                  </h3>
                  <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    IA Ativa
                  </div>
                </div>

                <div className="text-slate-200 text-lg leading-relaxed whitespace-pre-wrap bg-black/40 border border-white/5 p-8 rounded-3xl mb-10 relative z-10 shadow-inner font-light italic border-l-4 border-l-indigo-500">
                  {researchData.synthesis}
                </div>

                <div className="pt-8 border-t border-white/10 relative z-10 mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Fontes Investigadas em Tempo Real
                  </h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {researchData.sources.map((src: any, i: number) => (
                      <a 
                        key={i} 
                        href={src.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-none block bg-black/40 border border-white/5 rounded-2xl p-5 w-72 hover:border-indigo-500/50 hover:bg-black/60 transition-all group shadow-sm"
                      >
                        <p className="text-sm text-white font-bold line-clamp-2 group-hover:text-indigo-400 transition-colors mb-2">{src.title}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">{new URL(src.url).hostname}</span>
                          <span className="text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-indigo-400/10 px-2 py-1 rounded">
                            LER MAIS <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Pergunta de Confirmação */}
                <div className="mt-8 relative z-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl">
                      <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold">Estratégia validada?</p>
                      <p className="text-slate-400 text-xs text-balance">Gerei o conteúdo do carrossel abaixo com base nesses insights.</p>
                    </div>
                  </div>
                  <div className="h-px md:h-8 md:w-px bg-white/10 shrink-0"></div>
                  <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider">Abaixo está o seu rascunho</p>
                </div>
              </div>

              {/* Post Gerado */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Visualização do Carrossel */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <LayoutTemplate className="w-5 h-5 text-blue-400" /> Estrutura do Post ({researchData.generatedData.slides.length} Lâminas)
                  </h3>
                  <div className="space-y-4 flex-1">
                    {researchData.generatedData.slides.map((slide: any, idx: number) => (
                      <div key={idx} className="bg-black/40 border border-white/5 p-4 rounded-xl flex gap-4 items-start relative overflow-hidden group">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/50 group-hover:bg-blue-500 transition-colors"></div>
                        <div className="bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {slide.ordem}
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-sm mb-1">{slide.titulo}</h4>
                          <p className="text-slate-400 text-xs italic">{slide.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legenda e Ação */}
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-400" /> Legenda Automática
                    </h3>
                    <div className="bg-black/50 border border-white/5 p-4 rounded-xl">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">
                        {researchData.generatedData.legenda_instagram_facebook}
                      </p>
                    </div>
                  </div>

                  {/* Call to Action Final */}
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-black text-white mb-3 flex items-center gap-3">
                        Tudo Pronto!🚀
                      </h3>
                      <p className="text-indigo-100 text-sm mb-8 opacity-90 leading-relaxed">
                        Clique abaixo para ir ao Gerador de Mídias. Vamos transformar esse rascunho em artes visuais prontas para as suas redes.
                      </p>
                      
                      <button 
                        onClick={() => navigate('/editor', { 
                          state: { 
                            generatedData: { 
                              ...researchData.generatedData, 
                              topic, 
                              tone: selectedTone,
                              postId: researchData.postId,
                              sources: researchData.sources
                            } 
                          } 
                        })}
                        className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black py-4 rounded-2xl shadow-xl transition-all flex justify-center items-center gap-3 transform active:scale-95"
                      >
                        <ImageIcon className="w-5 h-5" />
                        Prosseguir para Geração Mídia
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>
    </div>
  );
}
