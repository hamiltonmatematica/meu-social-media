import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, CheckCircle2, AlertCircle, Download, ExternalLink, RefreshCw, Trash2, UserPlus, LogOut, Sparkles, Search, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
const POSTS_PER_PAGE = 12;

export default function Dashboard() {
  const { user, signOut, userCredits } = useAuth();
  const [allPosts, setAllPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dbStatus, setDbStatus] = React.useState<'online' | 'offline'>('offline');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const navigate = useNavigate();

  const [runTour, setRunTour] = React.useState(false);

  React.useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenDashboardTour');
    if (!hasSeenTour) {
      // Delay so elements can render before tour starts
      setTimeout(() => setRunTour(true), 500);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('hasSeenDashboardTour', 'true');
      setRunTour(false);
    }
  };

  const steps: Step[] = [
    {
      target: '.tour-step-1',
      content: 'Bem-vindo! Este é o seu painel central onde tudo acontece.',
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '.tour-step-2',
      content: 'Inicie a criação rápida do seu post mágico recheado de IA por aqui.',
      placement: 'bottom',
    },
    {
      target: '.tour-step-3',
      content: 'Seus inúmeros tópicos podem ser facilmente pesquisados por esta aba.',
      placement: 'bottom-start',
    },
    {
      target: '.tour-step-4',
      content: 'Seu histórico e biblioteca de posts salvos aparecerão em grades prontas para editar e usar.',
      placement: 'top',
    }
  ];

  React.useEffect(() => {
    fetchPosts();
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

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (!error) setAllPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    setDeletingId(postId);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (!error) {
        setAllPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
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

  // Filter + Paginate
  const filteredPosts = React.useMemo(() => {
    if (!searchTerm.trim()) return allPosts;
    const lower = searchTerm.toLowerCase();
    return allPosts.filter(p => (p.title || '').toLowerCase().includes(lower));
  }, [allPosts, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="bg-slate-900 text-slate-100 flex h-screen overflow-hidden">
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        locale={{
          back: 'Anterior',
          close: 'Fechar',
          last: 'Entendido!',
          next: 'Avançar',
          skip: 'Pular'
        }}
        styles={{
          options: {
            primaryColor: '#4f46e5',
            backgroundColor: '#1e293b',
            textColor: '#f8fafc',
            arrowColor: '#1e293b',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000,
          },
          buttonNext: {
            backgroundColor: '#4f46e5',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#94a3b8',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#94a3b8',
          }
        }}
      />
      {/* BEGIN: Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 relative ${isSidebarOpen ? 'w-64' : 'w-20 items-center'}`}>
        <div className={`p-6 flex items-center w-full ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 shrink-0 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {isSidebarOpen && <span className="text-xl font-bold tracking-tight whitespace-nowrap overflow-hidden">SocialFlow</span>}
          </div>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-7 w-6 h-6 bg-slate-700 hover:bg-indigo-600 border border-slate-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg z-50"
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <nav className="flex-1 px-3 space-y-2 mt-2 w-full flex flex-col items-center">
          <Link to="/" title="Painel" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 bg-blue-600/10 text-blue-400 rounded-xl font-medium border border-blue-600/20 transition-all overflow-hidden`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Painel</span>}
          </Link>
          <Link to="/create" title="Criar Post" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200 overflow-hidden`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Criar Post</span>}
          </Link>

          <Link to="/radar" title="Rastrear Assuntos" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200 overflow-hidden`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Rastrear Assuntos</span>}
          </Link>
          <Link to="/billing" title="Faturamento" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200 overflow-hidden`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Faturamento</span>}
          </Link>
          <Link to="/settings" title="Configurações" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition-all duration-200 overflow-hidden`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0"></path></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Configurações</span>}
          </Link>
          <a href="https://wa.me/5500000000000" title="Suporte Wpp" target="_blank" rel="noopener noreferrer" className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center px-0'} py-3 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all duration-200 font-bold border border-emerald-500/10 mt-4 overflow-hidden`}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {isSidebarOpen && <span className="whitespace-nowrap">Suporte Wpp</span>}
          </a>
        </nav>
        <div className={`p-4 border-t border-slate-700 w-full flex flex-col ${isSidebarOpen ? 'space-y-3' : 'space-y-4 items-center'}`}>
          <div className={`flex items-center ${isSidebarOpen ? 'space-x-3 p-2' : 'flex-col space-y-2 p-0'} bg-slate-900 rounded-lg w-full justify-center`}>
            <div className="w-10 h-10 shrink-0 rounded-full border-2 border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg uppercase shadow-inner">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-sm font-semibold truncate leading-tight">{user?.user_metadata?.name || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 truncate mb-1">{user?.email}</p>
                <div className="inline-flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px] font-bold text-indigo-400 border border-indigo-500/20 w-fit">
                  <Sparkles className="w-3 h-3 shrink-0" /> {userCredits} cr.
                </div>
              </div>
            )}
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-center gap-2 px-4' : 'justify-center px-0'} py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>
      {/* END: Sidebar */}

      {/* BEGIN: MainContent */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-950 pb-20 lg:pb-0 relative">
        {/* BEGIN: TopHeader */}
        <header className="min-h-[4.5rem] py-3 border-b border-slate-800 px-4 md:px-8 flex flex-row items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-xl z-10 gap-2 md:gap-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full border-2 border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-base md:text-lg uppercase shadow-inner lg:hidden">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <h1 className="tour-step-1 text-lg sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Visão Geral</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex lg:hidden items-center gap-1 bg-indigo-500/10 px-2 py-1.5 rounded-md text-[10px] sm:text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 shrink-0" /> {userCredits} cr.
            </div>
            <Link to="/create" className="tour-step-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-full sm:rounded-xl text-xs sm:text-sm font-black transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap active:scale-95">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Novo Post Inteiro</span><span className="sm:hidden">Criar</span>
            </Link>
            <button
              onClick={signOut}
              title="Sair"
              className="lg:hidden p-2 sm:px-3 sm:py-2 flex items-center justify-center gap-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl sm:rounded-lg transition-colors border border-transparent hover:border-red-500/20"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>
        {/* END: TopHeader */}

        <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">

          <div className="mt-4">
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" /> Histórico Completo
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full">
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="tour-step-3 relative flex-1 sm:flex-initial sm:min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                  />
                </div>
                <button 
                  onClick={fetchPosts}
                  title="Recarregar"
                  className="bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/30 rounded-xl p-2.5 sm:px-4 sm:py-2.5 text-slate-400 hover:text-white transition-colors flex items-center justify-center shadow-sm shrink-0 active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 sm:mr-2 ${loading ? 'animate-spin text-indigo-400' : ''}`} /> 
                  <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Sincronizar</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 tour-step-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-40 bg-slate-800/50 rounded-2xl animate-pulse border border-white/5"></div>
                ))}
              </div>
            ) : paginatedPosts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 tour-step-4">
                  {paginatedPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => handleEditPost(post)}
                      className="bg-slate-900 border border-white/5 p-5 rounded-2xl hover:border-indigo-500/30 transition-all group cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-2">
                          <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full mb-2 inline-block shadow-sm">
                            {post.content?.slides?.length || 0} Lâminas
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white line-clamp-2 group-hover:text-indigo-300 transition-colors leading-tight">
                            {post.title || "Sem Tópico"}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(post.created_at).toLocaleDateString('pt-BR')} às {new Date(post.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button 
                            onClick={(e) => handleDeletePost(e, post.id)}
                            className="p-2 bg-black/40 text-slate-500 hover:text-red-400 rounded-lg transition-colors border border-white/5 shadow-inner"
                            title="Excluir post"
                          >
                            {deletingId === post.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/30'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:border-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="tour-step-4 bg-slate-800/30 border border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 text-slate-600">
                  <AlertCircle className="w-8 h-8" />
                </div>
                {searchTerm ? (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-slate-400 max-w-sm mb-6">
                      Nenhum post corresponde à busca "{searchTerm}".
                    </p>
                    <button onClick={() => setSearchTerm('')} className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm">
                      Limpar busca →
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum post salvo ainda</h3>
                    <p className="text-slate-400 max-w-sm mb-6">
                      Seus carrosséis gerados aparecerão aqui após você clicar em "Finalizar e Salvar" no editor.
                    </p>
                    <Link to="/create" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm">
                      Começar a criar agora →
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      {/* END: MainContent */}

      {/* Mobile Bottom Navigation (Highly Optimized) */}
      <div 
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-safe"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
      >
        <Link to="/" className="flex flex-col items-center flex-1 py-3 text-blue-400 transition-colors relative group">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          <span className="material-symbols-outlined text-2xl mb-1 group-active:scale-95 transition-transform">dashboard</span>
          <span className="text-[10px] font-bold tracking-wide">Painel</span>
        </Link>
        <Link to="/radar" className="flex flex-col items-center flex-1 py-3 text-slate-400 hover:text-white transition-colors group">
          <span className="material-symbols-outlined text-2xl mb-1 group-active:scale-95 transition-transform">trending_up</span>
          <span className="text-[10px] font-bold tracking-wide">Radar</span>
        </Link>
        <div className="flex-1 flex justify-center -mt-6">
          <Link to="/create" className="flex flex-col items-center bg-gradient-to-tr from-indigo-700 to-blue-500 text-white p-3.5 rounded-full border-[5px] border-slate-950 shadow-[0_8px_30px_rgba(99,102,241,0.6)] active:scale-95 transition-transform">
            <Sparkles className="w-6 h-6" />
          </Link>
        </div>
        <Link to="/billing" className="flex flex-col items-center flex-1 py-3 text-slate-400 hover:text-white transition-colors group">
          <span className="material-symbols-outlined text-2xl mb-1 group-active:scale-95 transition-transform">credit_card</span>
          <span className="text-[10px] font-bold tracking-wide">Vendas</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center flex-1 py-3 text-slate-400 hover:text-white transition-colors group">
          <span className="material-symbols-outlined text-2xl mb-1 group-active:scale-95 transition-transform">settings</span>
          <span className="text-[10px] font-bold tracking-wide">Ajustes</span>
        </Link>
      </div>
    </div>
  );
}
