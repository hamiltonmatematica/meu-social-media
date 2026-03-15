import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Search, Trash2, UserCheck, UserX, ArrowLeft, RefreshCw, BarChart3, Mail, Calendar, Activity } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  created_at: string;
  last_login_at: string;
  total_posts_generated: number;
  total_images_generated: number;
  total_research_requests: number;
  total_trend_requests: number;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, totalPosts: 0 });

  // Lista de emails admin (configure com o seu email)
  const ADMIN_EMAILS = [
    import.meta.env.VITE_ADMIN_EMAIL || 'admin@socialflow.ai'
  ];

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sm_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('sm_users')
        .select('*', { count: 'exact', head: true });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: activeToday } = await supabase
        .from('sm_users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login_at', today.toISOString());

      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalPosts: totalPosts || 0,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Seus dados serão perdidos.')) return;
    
    try {
      // Deletar posts do usuário
      await supabase.from('posts').delete().eq('user_id', userId);
      // Deletar profiles do usuário
      await supabase.from('profiles').delete().eq('user_id', userId);
      // Deletar o perfil do sm_users
      await supabase.from('sm_users').delete().eq('id', userId);
      
      setUsers(users.filter(u => u.id !== userId));
      setSelectedUser(null);
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir usuário');
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    try {
      await supabase.from('sm_users').update({ plan: newPlan }).eq('id', userId);
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, plan: newPlan });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Acesso negado para não-admins
  if (!isAdmin) {
    return (
      <div className="bg-[#0A0A0B] text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-slate-400">Você não tem permissão para acessar esta página.</p>
          <button onClick={() => navigate('/')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold">
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white text-lg font-bold tracking-tight">Painel Admin</h2>
              <p className="text-slate-400 text-xs">Gerenciamento de Usuários e Acessos</p>
            </div>
          </div>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Total Usuários</span>
            </div>
            <p className="text-4xl font-black text-white">{stats.totalUsers}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Ativos Hoje</span>
            </div>
            <p className="text-4xl font-black text-white">{stats.activeToday}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-bold text-slate-400 uppercase">Posts Criados</span>
            </div>
            <p className="text-4xl font-black text-white">{stats.totalPosts}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Usuários */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <span className="text-sm text-slate-500 font-bold">{filteredUsers.length} usuários</span>
            </div>

            <div className="space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-900/50 rounded-xl animate-pulse" />
                ))
              ) : (
                filteredUsers.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => setSelectedUser(u)}
                    className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-indigo-500/40 ${
                      selectedUser?.id === u.id ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase">
                          {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.name || 'Sem nome'}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                          u.plan === 'pro' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          u.plan === 'business' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-slate-800 text-slate-400 border-white/5'
                        }`}>
                          {u.plan || 'free'}
                        </span>
                        {u.last_login_at && (
                          <span className="text-[10px] text-slate-600">
                            {new Date(u.last_login_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detalhe do Usuário */}
          <div className="lg:col-span-1">
            {selectedUser ? (
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 space-y-6 sticky top-24">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-2xl uppercase mx-auto mb-3">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                  <h3 className="text-white font-bold text-lg">{selectedUser.name}</h3>
                  <p className="text-slate-400 text-sm flex items-center justify-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {selectedUser.email}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cadastro</span>
                    <span className="text-white font-medium">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('pt-BR') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Último acesso</span>
                    <span className="text-white font-medium">
                      {selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                    </span>
                  </div>
                </div>

                {/* Consumo */}
                <div className="border-t border-white/5 pt-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consumo de APIs</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUser.total_posts_generated || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Posts</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUser.total_images_generated || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Imagens IA</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUser.total_research_requests || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pesquisas</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUser.total_trend_requests || 0}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tendências</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plano</h4>
                  <div className="flex gap-2">
                    {['free', 'pro', 'business'].map(plan => (
                      <button
                        key={plan}
                        onClick={() => handleUpdatePlan(selectedUser.id, plan)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all uppercase ${
                          selectedUser.plan === plan
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'bg-black/30 border-white/10 text-slate-500 hover:text-white'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Excluir Usuário
                </button>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Selecione um usuário para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
