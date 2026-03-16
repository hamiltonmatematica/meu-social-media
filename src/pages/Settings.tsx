import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Lock, Save, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Buscar nome da tabela sm_users
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('sm_users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (data && data.name) {
          setName(data.name);
        } else {
          setName(user.user_metadata?.name || '');
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    
    setLoading(true);
    try {
      // 1. Atualizar Nome na tabela
      if (name.trim()) {
        const { error: dbError } = await supabase
          .from('sm_users')
          .update({ name })
          .eq('id', user?.id);
        
        if (dbError) throw new Error('Erro ao atualizar nome no banco de dados.');
      }

      // 2. Atualizar Auth (Senha e Email)
      const updates: any = {};
      if (email && email !== user?.email) updates.email = email;
      if (password) updates.password = password;

      if (Object.keys(updates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(updates);
        if (authError) throw new Error(authError.message);
      }

      setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso! (Se alterou o email, precisará confirmar o novo email)' });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao atualizar dados.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans">
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
          <h2 className="text-white text-lg font-bold tracking-tight">Configurações de Conta</h2>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-6">
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8">
          
          {message.text && (
            <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" /> Perfil Pessoal
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Email de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 space-y-4">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-4 h-4" /> Segurança
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Mudar Senha (deixe em branco para não alterar)</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Repetir Nova Senha</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

        </div>
      </main>
    </div>
  );
}
