import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Target, Fingerprint, Users, MessageCircle, Clock, PlusCircle, Edit3, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function BusinessDNA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profileId = searchParams.get('profile');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditingDNA, setIsEditingDNA] = useState(!profileId);

  const [formData, setFormData] = useState({
    nome: profileId === 'hamilton' ? 'Hamilton Vinicius' : profileId === 'tech' ? 'Consultoria Tech' : '',
    nicho: profileId === 'hamilton' ? 'Professor de Matemática' : profileId === 'tech' ? 'B2B / Agência' : '',
    publico: '',
    tomDeVoz: 'Profissional'
  });

  React.useEffect(() => {
    if (profileId) {
      fetchProfilePosts();
    }
  }, [profileId]);

  const fetchProfilePosts = async () => {
    setLoading(true);
    // Simulação de busca por perfil - No futuro filtraria por profile_id
    const { data } = await supabase.from('posts').select('*').eq('user_id', user?.id).limit(10);
    setPosts(data || []);
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingDNA(false);
    navigate(`/dna?profile=${formData.nome.toLowerCase().split(' ')[0]}`);
  };

  const handleEditPost = (post: any) => {
    navigate('/editor', { 
      state: { 
        generatedData: { 
          slides: post.content.slides,
          legenda_instagram_facebook: post.content.caption,
          topic: post.title,
          postId: post.id
        } 
      } 
    });
  };

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans selection:bg-blue-500/30 pb-20 md:pb-0">
      
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
            <h2 className="text-white text-lg font-bold tracking-tight">DNA do Perfil</h2>
            <p className="text-slate-400 text-xs font-medium">Cadastre um nicho para IA gerar conteúdos diários</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 md:py-12 px-4 md:px-6">
        
        <AnimatePresence mode="wait">
          {isEditingDNA ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3 mb-12">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3 mb-6">
                  <Fingerprint className="w-8 h-8 text-white -rotate-3" />
                </div>
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Qual o DNA da Marca?</h1>
                <p className="text-slate-400 max-w-lg mx-auto">
                  A IA pensará como você, sugerindo 
                  pautas diárias exatas para atrair as pessoas certas.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Bloco 1: Nome da Marca */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    <Target className="w-4 h-4 text-blue-400" /> Identificação
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Nome do Especialista ou Empresa</p>
                      <input 
                        type="text" 
                        required
                        value={formData.nome}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                        placeholder="Ex: Hamilton Vinicius"
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Nicho de Mercado</p>
                      <input 
                        type="text" 
                        required
                        value={formData.nicho}
                        onChange={e => setFormData({...formData, nicho: e.target.value})}
                        placeholder="Ex: Professor de Matemática"
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Público */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-indigo-400" /> O Público Alvo
                  </label>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Com quem você quer falar? (Quais as dores deles?)</p>
                    <textarea 
                      required
                      rows={3}
                      value={formData.publico}
                      onChange={e => setFormData({...formData, publico: e.target.value})}
                      placeholder="Ex: Vestibulandos e concurseiros que têm muito medo de exatas e sentem que travam na hora da prova."
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Bloco 3: Tom de Voz */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">
                    <MessageCircle className="w-4 h-4 text-purple-400" /> Tom de Comunicação
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {['Divertido', 'Profissional', 'Motivacional', 'Didático', 'Agressivo'].map(tom => (
                      <button
                        type="button"
                        key={tom}
                        onClick={() => setFormData({...formData, tomDeVoz: tom})}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          formData.tomDeVoz === tom 
                            ? 'bg-purple-500/20 border-purple-500/50 text-purple-200' 
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {tom}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Salvar e Ver Perfil
                  </button>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50 border border-white/5 p-5 md:p-8 rounded-3xl">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 border-4 border-slate-800 shadow-xl flex items-center justify-center text-3xl font-black text-white">
                    {formData.nome.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white">{formData.nome}</h1>
                    <p className="text-indigo-400 font-bold">{formData.nicho}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEditingDNA(true)}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/10"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => navigate('/create')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <PlusCircle className="w-5 h-5" /> Novo Post para {formData.nome.split(' ')[0]}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" /> Posts e Rascunhos deste Perfil
                </h3>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse" />)}
                  </div>
                ) : posts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map(post => (
                      <div 
                        key={post.id} 
                        onClick={() => handleEditPost(post)}
                        className="bg-slate-900 border border-white/5 p-5 rounded-2xl hover:border-indigo-500/40 transition-all group cursor-pointer"
                      >
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded mb-2 inline-block">
                          {post.content?.slides?.length || 0} Lâminas
                        </span>
                        <h4 className="text-white font-bold line-clamp-1 group-hover:text-indigo-300 transition-colors">{post.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-2">Editado por último em {new Date(post.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-900/30 border border-dashed border-white/10 rounded-3xl">
                    <p className="text-slate-500">Nenhum post iniciado para este perfil ainda.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
