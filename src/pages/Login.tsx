import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (mode === 'login') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else if (mode === 'register') {
      if (!name.trim()) {
        setError('Digite seu nome');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres');
        setLoading(false);
        return;
      }
      const result = await signUp(email, password, name);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Conta criada! Verifique seu email para confirmar o cadastro.');
        setMode('login');
      }
    } else if (mode === 'forgot') {
      const result = await sendPasswordReset(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Link de recuperação enviado para seu email!');
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%)',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Background Glow */}
      <div style={{
        position: 'fixed',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed',
        bottom: '-20%',
        left: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            marginBottom: '16px',
            boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
          }}>
            <Zap style={{ width: '32px', height: '32px', color: '#fff' }} />
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em'
          }}>
            Social<span style={{ color: '#6366f1' }}>Flow</span>
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            marginTop: '4px'
          }}>
            {mode === 'login' && 'Entre na sua conta'}
            {mode === 'register' && 'Crie sua conta'}
            {mode === 'forgot' && 'Recupere sua senha'}
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: '32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
        }}>
          {/* Messages */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#f87171',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              color: '#4ade80',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Nome (só no register) */}
            {mode === 'register' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Nome
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#475569'
                  }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '18px',
                  height: '18px',
                  color: '#475569'
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="seu@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 44px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                />
              </div>
            </div>

            {/* Senha (não mostra no forgot) */}
            {mode !== 'forgot' && (
              <div style={{ marginBottom: '8px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Senha
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '18px',
                    height: '18px',
                    color: '#475569'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 48px 14px 44px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#475569'
                    }}
                  >
                    {showPassword ? <EyeOff style={{ width: '18px', height: '18px' }} /> : <Eye style={{ width: '18px', height: '18px' }} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot password (login mode) */}
            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {mode === 'forgot' && <div style={{ height: '24px' }} />}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(99, 102, 241, 0.25)'
              }}
            >
              {loading ? (
                <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'register' && 'Criar Conta'}
                  {mode === 'forgot' && 'Enviar Link de Recuperação'}
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Toggle mode */}
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                color: '#6366f1',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Criar nova conta
            </button>
          )}
          {(mode === 'register' || mode === 'forgot') && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                borderRadius: '12px',
                color: '#6366f1',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Já tenho uma conta
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          color: '#334155',
          fontSize: '0.75rem',
          marginTop: '24px'
        }}>
          © 2026 SocialFlow · Todos os direitos reservados
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
