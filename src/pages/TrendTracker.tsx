import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, TrendingUp, Search, PlusCircle, PenTool, CheckCircle2, Clock, Globe, RefreshCw, Home } from 'lucide-react';
import { getTrends } from '../lib/ai/research';
import { motion, AnimatePresence } from 'framer-motion';

// Simulação de resposta de API (Poderia vir direto da Tavily / Perplexity)
const MOCK_NEWS = {
  "Marketing Digital": [
    {
      id: 1,
      titulo: "Instagram muda algoritmo do Reels para priorizar contas pequenas",
      fonte: "Social Media Today",
      tempo: "Há 2 horas",
      resumo: "A nova atualização foca em 'tempo de tela original' em vez de contas massivas que repostam conteúdo.",
      url: "#"
    },
    {
      id: 2,
      titulo: "O colapso do tráfego orgânico no Facebook: O que fazer?",
      fonte: "Marketing News",
      tempo: "Há 5 horas",
      resumo: "Especialistas indicam que o alcance orgânico das fanpages caiu para menos de 1.5% este mês.",
      url: "#"
    }
  ],
  "Inteligência Artificial": [
    {
      id: 3,
      titulo: "OpenAI lança nova versão do ChatGPT mais rápida para copywriting",
      fonte: "TechCrunch",
      tempo: "Há 1 hora",
      resumo: "O novo modelo foca especificamente em entender linguagem persuasiva e criar ganchos de vendas.",
      url: "#"
    }
  ],
  "Empreendedorismo": [
    {
      id: 4,
      titulo: "Como micro-SaaS estão dominando o mercado em 2026",
      fonte: "Forbes",
      tempo: "Há 8 horas",
      resumo: "Empresas enxutas estão faturando alto focando em dores extremamente específicas em vez de competir com gigantes.",
      url: "#"
    }
  ]
};

export default function TrendTracker() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>(JSON.parse(localStorage.getItem('trendTags') || '["Marketing Digital", "Inteligência Artificial", "Empreendedorismo"]'));
  const [newTag, setNewTag] = useState('');
  const [activeTag, setActiveTag] = useState(tags[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [newsData, setNewsData] = useState<any>(JSON.parse(localStorage.getItem('trendData') || '{}'));
  const [lastUpdate, setLastUpdate] = useState<any>(JSON.parse(localStorage.getItem('trendUpdates') || '{}'));

  const canUpdate = (tag: string) => {
    const last = lastUpdate[tag];
    if (!last) return true;
    const diff = Date.now() - new Date(last).getTime();
    return diff > 24 * 60 * 60 * 1000; // 24h
  };

  const getNextUpdateText = (tag: string) => {
    const last = lastUpdate[tag];
    if (!last) return null;
    const nextDate = new Date(new Date(last).getTime() + 24 * 60 * 60 * 1000);
    return nextDate.toLocaleString('pt-BR');
  };

  // Efeito para carregar tendências reais ao iniciar ou trocar de tag
  React.useEffect(() => {
    // Só faz o scan automático se não houver NENHUM dado para essa tag
    // Isso cumpre o pedido de "só mude se a pessoa realmente clicar no radar" (clicar em atualizar)
    if (!newsData[activeTag] || newsData[activeTag].length === 0) {
      forceScan(true); 
    }
  }, [activeTag]);

  // Efeito para persistir tags
  React.useEffect(() => {
    localStorage.setItem('trendTags', JSON.stringify(tags));
  }, [tags]);

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tags.length >= 3) {
      alert("Você atingiu o limite de 3 tópicos monitorados. Remova um para adicionar outro.");
      return;
    }
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setActiveTag(newTag.trim());
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (tags.length <= 1) return;
    const newTags = tags.filter(t => t !== tagToRemove);
    setTags(newTags);
    if (activeTag === tagToRemove) {
      setActiveTag(newTags[0]);
    }

    // Limpar dados associados à tag removida
    const newData = { ...newsData };
    delete newData[tagToRemove];
    setNewsData(newData);
    localStorage.setItem('trendData', JSON.stringify(newData));
  };

  const handleCreatePost = (topic: string) => {
    navigate(`/create?topic=${encodeURIComponent(topic)}`);
  };

  const forceScan = async (isInitial = false) => {
    if (!isInitial && !canUpdate(activeTag)) {
      alert(`Este tópico só pode ser atualizado a cada 24h. Próxima atualização: ${getNextUpdateText(activeTag)}`);
      return;
    }

    setIsScanning(true);
    try {
      const trends = await getTrends(activeTag);
      setNewsData((prev: any) => {
        const next = { ...prev, [activeTag]: trends };
        localStorage.setItem('trendData', JSON.stringify(next));
        return next;
      });
      
      const newUpdates = { ...lastUpdate, [activeTag]: new Date().toISOString() };
      setLastUpdate(newUpdates);
      localStorage.setItem('trendUpdates', JSON.stringify(newUpdates));
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans flex flex-col selection:bg-blue-500/30">
      
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
          <div>
            <h2 className="text-white text-lg font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Radar de Tendências
            </h2>
            <p className="text-slate-400 text-xs font-medium">Acompanhe seus nichos e transforme notícias em posts na hora.</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => forceScan()}
            disabled={isScanning || !canUpdate(activeTag)}
            className={`flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50 border border-white/10`}
          >
            {isScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />} 
            {isScanning ? 'Rastreando Web...' : 'Atualizar Radar Agora'}
          </button>
          {!canUpdate(activeTag) && (
            <span className="text-[10px] font-bold text-amber-500 animate-pulse">
              Disponível em: {getNextUpdateText(activeTag)}
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Painel Esquerdo: Menu de Tags */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 shadow-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Meus Tópicos Monitorados</h3>
            
            <div className="space-y-2 mb-6">
              {tags.map(tag => (
                <div
                  key={tag}
                  className={`group relative flex items-center transition-all ${
                    activeTag === tag ? 'opacity-100' : 'opacity-80'
                  }`}
                >
                  <button
                    onClick={() => setActiveTag(tag)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      activeTag === tag
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-black/30 text-slate-400 border border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span># {tag}</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </button>
                  {tags.length > 1 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                      className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="relative">
              <input
                type="text"
                placeholder="Ex: Startups..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-indigo-500/20 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-bold text-indigo-300 mb-2">Motor Perplexity Alert</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 relative z-10">
              Estamos lendo a internet em tempo real. As fontes que quebrarem regras ou perderem tração orgânica serão filtradas antes de chegarem ao seu radar.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg w-fit">
              <CheckCircle2 className="w-4 h-4" /> Online e Rastreando
            </div>
          </div>
        </aside>

        {/* Painel Direito: Feed de Notícias e Geração de Post */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Resultados para "{activeTag}"</h1>
              <p className="text-slate-400 text-sm mt-1">Últimas 24 horas. Escolha a notícia e a IA cria tudo pra você.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTag}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {isScanning ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-indigo-400 font-bold animate-pulse">Lendo fontes no Perplexity...</p>
                </div>
              ) : (
                /* Notícias Reais vindas da API */
                (newsData[activeTag] || []).length > 0 ? (
                  (newsData[activeTag] || []).map((news: any) => (
                    <div key={news.id} className="bg-slate-900 border border-white/10 hover:border-indigo-500/50 rounded-2xl p-6 transition-all group shadow-lg">
                      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mb-2">
                            <span className="text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">{news.fonte}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {news.tempo}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-indigo-300 transition-colors">
                            {news.titulo}
                          </h3>
                          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                            {news.resumo}
                          </p>
                        </div>
                        <div className="shrink-0 pt-4 md:pt-0">
                          <button 
                            onClick={() => handleCreatePost(news.titulo)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" /> Transformar em Post
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <Globe className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Nenhuma tendência forte hoje.</h3>
                    <p className="text-slate-400 text-sm">A inteligência não encontrou nada viral sobre "{activeTag}" nas últimas horas.</p>
                  </div>
                )
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
