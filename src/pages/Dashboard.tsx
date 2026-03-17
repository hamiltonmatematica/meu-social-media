import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Download, ExternalLink, RefreshCw, Trash2, UserPlus, LogOut, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut, userCredits } = useAuth();
  const [recentPosts, setRecentPosts] = React.useState<any[]>([]);
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dbStatus, setDbStatus] = React.useState<'online' | 'offline'>('offline');
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchPosts();
    fetchProfiles();
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('posts').select('id').limit(1);
      if (!error) setDbStatus('online');
    } catch (e) {
      setDbStatus('offline');
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error) setProfiles(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error) setRecentPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este perfil? Todos os posts associados também serão removidos.')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setProfiles(profiles.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditPost = (post: any) => {
    navigate('/editor', { 
      state: { 
        generatedData: { 
          slides: post.content.slides,
          legenda_instagram_facebook: post.content.caption,
          topic: post.title,
          postId: post.id,
          globalStyle: post.content.globalStyle,
          twitterName: post.content.twitterName,
          twitterHandle: post.content.twitterHandle,
          twitterAvatar: post.content.twitterAvatar,
          sources: post.content.sources || []
        } 
      } 
    });
  };
  return (
    <div className="bg-slate-900 text-slate-100 flex h-screen overflow-hidden">
      {/* BEGIN: Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 flex-col">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">SocialFlow</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 bg-blue-600/10 text-blue-400 rounded-xl font-medium border border-blue-600/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
            </svg>
            <span>Painel</span>
          </Link>
          <Link to="/create" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Criar Post</span>
          </Link>

          <Link to="/radar" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <span>Rastrear Assuntos</span>
          </Link>
          <Link to="/billing" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
            </svg>
            <span>Faturamento</span>
          </Link>
          <Link to="/settings" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0"></path>
            </svg>
            <span>Configurações</span>
          </Link>
          <a href="https://wa.me/5500000000000" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 px-4 py-3 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all duration-200 font-bold border border-emerald-500/10 mt-4">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span>Suporte Wpp</span>
          </a>
        </nav>
        <div className="p-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center space-x-3 p-2 bg-slate-900 rounded-lg">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg uppercase">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.user_metadata?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate mb-1">{user?.email}</p>
              <div className="inline-flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-3 h-3" /> {userCredits} créditos
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </aside>
      {/* END: Sidebar */}

      {/* BEGIN: MainContent */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 pb-20 md:pb-0">
        {/* BEGIN: TopHeader */}
        <header className="h-auto min-h-[4rem] py-3 md:py-0 md:h-16 border-b border-slate-800 px-4 md:px-8 flex flex-wrap items-center justify-between sticky top-0 bg-slate-950/80 backdrop-blur-md z-10 gap-3">
          <div>
            <h1 className="text-xl font-bold">Visão Geral do Painel</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/create" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20 flex items-center space-x-2">
              <span>+ Novo Post</span>
            </Link>
          </div>
        </header>
        {/* END: TopHeader */}

        <div className="p-4 md:p-8 space-y-8">
          {/* BEGIN: Selected Profiles */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Seus Perfis (DNA)</h2>
                <p className="text-slate-400 text-sm mt-1">Selecione um perfil para a IA gerar ideias personalizadas para hoje.</p>
              </div>
              <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>
                Novo Perfil
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {profiles.map((profile) => (
                <div 
                  key={profile.id}
                  onClick={() => navigate(`/dna?profile=${profile.id}`)}
                  className="relative group bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl hover:border-indigo-400/60 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-xl uppercase">
                        {profile.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                        <p className="text-xs text-indigo-400 font-medium truncate max-w-[150px]">{profile.industry || 'Perfil S/F'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProfile(e, profile.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10"
                      title="Excluir Perfil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-slate-300 line-clamp-2">Público: {profile.target_audience || 'Não definido'}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ideias sugeridas agora (IA):</p>
                    <Link to={`/create?topic=Ideias+de+conteúdo+para+${encodeURIComponent(profile.name)}`} className="block w-full bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/20 text-indigo-300 text-xs py-2 px-3 rounded-lg transition-colors truncate">
                      ✨ Criar conteúdo personalizado
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Vazio / Criar */}
              <div onClick={() => navigate('/dna')} className="border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[250px] group">
                <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center mb-4 transition-colors">
                  <UserPlus className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </div>
                <h3 className="text-white font-bold mb-1">Cadastrar Cliente/Perfil</h3>
                <p className="text-sm text-slate-500">Configure o DNA de uma nova marca para gerar conteúdo nativo.</p>
              </div>

            </div>
          </section>
          {/* END: Selected Profiles */}

          <div className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Histórico Recente
              </h3>
              <button 
                onClick={fetchPosts}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Sincronizar
              </button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 bg-slate-800/50 rounded-2xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : recentPosts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recentPosts.map((post) => (
                  <div 
                    key={post.id} 
                    onClick={() => handleEditPost(post)}
                    className="bg-slate-900 border border-white/5 p-5 rounded-2xl hover:border-indigo-500/30 transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded mb-2 inline-block">
                          {post.content?.slides?.length || 0} Lâminas
                        </span>
                        <h4 className="text-lg font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
                          {post.title || "Sem Tópico"}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Gerado em {new Date(post.created_at).toLocaleDateString('pt-BR')} às {new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 bg-black/40 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 shadow-inner">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-black/40 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 shadow-inner">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                      {post.content?.slides?.slice(0, 5).map((slide: any, idx: number) => (
                        <div key={idx} className="w-8 h-8 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                          <img src={slide.imagem} className="w-full h-full object-cover" alt="" />
                        </div>
                      ))}
                      {(post.content?.slides?.length > 5) && (
                        <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          +{post.content.slides.length - 5}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-800/30 border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Nenhum post salvo ainda</h3>
                <p className="text-slate-400 max-w-sm mb-6">
                  Seus carrosséis gerados aparecerão aqui após você clicar em "Finalizar e Salvar" no editor.
                </p>
                <Link to="/create" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm">
                  Começar a criar agora →
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* END: MainContent */}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around items-center p-3 z-50">
        <Link to="/" className="flex flex-col items-center text-blue-400">
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] font-medium mt-1">Painel</span>
        </Link>
        <Link to="/radar" className="flex flex-col items-center text-slate-400 hover:text-slate-200">
          <span className="material-symbols-outlined text-xl">trending_up</span>
          <span className="text-[10px] font-medium mt-1">Radar</span>
        </Link>
        <Link to="/create" className="flex flex-col items-center bg-blue-600 text-white p-3 rounded-full -mt-8 border-4 border-slate-900 shadow-lg">
          <span className="material-symbols-outlined">add</span>
        </Link>
        <Link to="/dna" className="flex flex-col items-center text-slate-400 hover:text-slate-200">
          <span className="material-symbols-outlined text-xl">genetics</span>
          <span className="text-[10px] font-medium mt-1">DNA</span>
        </Link>
        <Link to="/billing" className="flex flex-col items-center text-slate-400 hover:text-slate-200">
          <span className="material-symbols-outlined text-xl">credit_card</span>
          <span className="text-[10px] font-medium mt-1">Vendas</span>
        </Link>
      </div>
    </div>
  );
}
