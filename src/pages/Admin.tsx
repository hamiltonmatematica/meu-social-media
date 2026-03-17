import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Users, Search, Trash2, UserCheck, UserX, ArrowLeft, RefreshCw, BarChart3, Mail, Calendar, Activity, DollarSign, TrendingUp, CreditCard, Wallet, LayoutDashboard } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: string;
  role: string;
  credits: number;
  created_at: string;
  last_login_at: string;
  total_posts_generated: number;
  total_images_generated: number;
  total_research_requests: number;
  total_trend_requests: number;
}

export default function Admin() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, totalPosts: 0, totalCredits: 0 });
  const [financeStats, setFinanceStats] = useState({ revenue: 0, sales: 0, transactions: [] as any[] });
  const [editingCredits, setEditingCredits] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'users' | 'finance'>('users');
  const [selectedUserStats, setSelectedUserStats] = useState({ posts: 0, images: 0, searches: 0, trends: 0 });


  // Lista de emails admin fallback
  const ADMIN_EMAILS = [
    import.meta.env.VITE_ADMIN_EMAIL || 'admin@socialflow.ai',
    'hamilton.vinicius@gmail.com'
  ];

  const isAdmin = user && (ADMIN_EMAILS.includes(user.email || '') || userRole === 'admin');

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

      // Calculate total credits in circulation
      const { data: usersData } = await supabase
        .from('sm_users')
        .select('credits');
      let totalCredits = 0;
      if (usersData) {
        totalCredits = usersData.reduce((acc, user) => acc + (user.credits || 0), 0);
      }

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalPosts: totalPosts || 0,
        totalCredits: totalCredits,
      });

      fetchFinanceStats();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFinanceStats = async () => {
    try {
      const { data, error } = await supabase
        .from('sm_transactions')
        .select(`
          id,
          amount,
          created_at,
          status,
          plan_name,
          user:sm_users(email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        if (error.code === '42P01') {
          console.error("Tabela sm_transactions não existe ainda. Execute o SQL.");
        } else {
          throw error;
        }
        return;
      }

      const allTx = await supabase.from('sm_transactions').select('amount').eq('status', 'completed');
      
      let totalRevenue = 0;
      let totalSales = 0;
      
      if (allTx.data) {
        totalRevenue = allTx.data.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
        totalSales = allTx.data.length;
      }

      setFinanceStats({
        revenue: totalRevenue,
        sales: totalSales,
        transactions: data || []
      });
      
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err);
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

  const loadUserConsumption = async (userId: string) => {
    setSelectedUserStats({ posts: 0, images: 0, searches: 0, trends: 0 });
    try {
      // Busca a quantidade real de posts criados por esse usuário
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Busca a quantidade de DNAs (perfis) criados
      const { count: profilesCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Usamos estimativas lógicas para o restante baseado no uso real
      const pCount = postsCount || 0;
      const profCount = profilesCount || 0;

      setSelectedUserStats({
        posts: pCount,
        images: pCount * 5, // Em média 5 imagens por carrossel
        searches: pCount + profCount, // Cada post/perfil faz 1 pesquisa web
        trends: profCount * 2 // Estimativa de uso do radar por cada nicho criado
      });
    } catch (err) {
      console.error("Erro ao carregar consumo:", err);
    }
  };

  const handleUpdateRoleAndCredits = async (userId: string, newRole: string, newCredits: number, newPlan: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: userId,
        new_role: newRole,
        new_credits: newCredits,
        new_plan: newPlan
      });
      
      if (error) throw error;

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole, credits: newCredits, plan: newPlan } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole, credits: newCredits, plan: newPlan });
      }
      alert('Usuário atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar usuário: ' + err.message);
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
      <header className="flex flex-wrap items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-4 md:px-6 py-4 sticky top-0 z-50 gap-4">
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
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Users className="w-4 h-4" /> Usuários
            </button>
            <button 
              onClick={() => setActiveTab('finance')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'finance' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <DollarSign className="w-4 h-4" /> Financeiro
            </button>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors h-10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {activeTab === 'users' ? (
          <>
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
                    onClick={() => {
                      setSelectedUser(u);
                      setEditingCredits(u.credits || 0);
                      loadUserConsumption(u.id);
                    }}
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
                          u.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-slate-800 text-slate-400 border-white/5'
                        }`}>
                          {u.role || 'user'}
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
                      <p className="text-xl font-black text-white">{selectedUserStats.posts}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Posts</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUserStats.images}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Imagens IA</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUserStats.searches}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Pesquisas</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-black text-white">{selectedUserStats.trends}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tendências</p>
                    </div>
                  </div>
                </div>

                {/* Ações Avançadas */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acesso e Cargos</h4>
                    <div className="flex gap-2">
                      {['user', 'admin'].map(role => (
                        <button
                          key={role}
                          onClick={() => handleUpdateRoleAndCredits(selectedUser.id, role, editingCredits, selectedUser.plan)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all uppercase ${
                            selectedUser.role === role
                              ? (role === 'admin' ? 'bg-red-500 border-red-500 text-white' : 'bg-indigo-500 border-indigo-500 text-white')
                              : 'bg-black/30 border-white/10 text-slate-500 hover:text-white'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Créditos de Post</h4>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={editingCredits}
                        onChange={(e) => setEditingCredits(Number(e.target.value))}
                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white w-full text-center font-bold"
                      />
                      <button 
                        onClick={() => handleUpdateRoleAndCredits(selectedUser.id, selectedUser.role || 'user', editingCredits, selectedUser.plan)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => handleDeleteUser(selectedUser.id)}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Excluir Usuário
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">Selecione um usuário para ver detalhes</p>
              </div>
            )}
          </div>
        </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Receita Total</span>
                </div>
                <p className="text-4xl font-black text-white">{financeStats.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <TrendingUp className="w-4 h-4" /> Desde o início
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Vendas Realizadas</span>
                </div>
                <p className="text-4xl font-black text-white">{financeStats.sales}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                  Total acumulado
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-900/40 to-slate-900 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-2">
                  <LayoutDashboard className="w-5 h-5 text-orange-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Tíquete Médio</span>
                </div>
                <p className="text-4xl font-black text-white">
                  {financeStats.sales > 0 
                    ? (financeStats.revenue / financeStats.sales).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : 'R$ 0,00'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold text-slate-400 uppercase">Créditos Ativos</span>
                </div>
                <p className="text-4xl font-black text-white">{stats.totalCredits}</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400">
                  Em circulação
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-400" /> Transações Recentes
                  </h3>
                  <p className="text-sm text-slate-500">Últimas 10 compras globais</p>
                </div>
                <button className="text-indigo-400 text-sm font-bold hover:text-indigo-300 transition-colors">Ver todas</button>
              </div>
              
              <div className="space-y-3">
                {financeStats.transactions.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-4">Nenhuma transação encontrada ou tabela inexistente.</p>
                ) : (
                  financeStats.transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{(tx.user as any)?.email || 'Desconhecido'}</p>
                          <p className="text-slate-500 text-xs">{tx.plan_name} • {new Date(tx.created_at).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <div>
                          <p className="text-white font-black">R$ {Number(tx.amount).toFixed(2).replace('.', ',')}</p>
                          <p className={`text-[10px] font-bold uppercase ${tx.status === 'completed' ? 'text-emerald-500' : 'text-orange-500'}`}>{tx.status}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Bloco de Gestão Financeira Auxiliar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-white mb-4">Adicionar Crédito Manual</h4>
                <p className="text-xs text-slate-500 mb-6">Esta função já pode ser usada pelo painel lateral de cada usuário, navegando na aba 'Usuários'.</p>
                <button onClick={() => setActiveTab('users')} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all text-sm">
                  Ir para Gestão de Usuários
                </button>
              </div>
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-white mb-4">Exportar Relatórios</h4>
                <p className="text-xs text-slate-500 mb-6">Baixe planilhas CSV com os dados de fechamento financeiro do mês (Em breve).</p>
                <button className="w-full py-3 bg-white/5 border border-white/10 text-slate-400 hover:text-white rounded-xl font-bold transition-all text-sm" disabled>
                  Exportar CSV Mensal
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
