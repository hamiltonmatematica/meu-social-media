"use client";

import { useState } from 'react';

const STEPS = [
  { icon: '👤', label: 'Marca / Perfil' },
  { icon: '🎯', label: 'Interesses' },
  { icon: '🚀', label: 'Motor Autônomo' },
  { icon: '📄', label: 'Resultado Final' },
];

export default function CreatePostWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  // Mínimo necessário
  const [inputData, setInputData] = useState({
    nome_perfil: '',
    nicho: '',
    publico_alvo_resumido: '',
    tom_de_voz: '',
    interesses_principais: '',
  });

  const handleChange = (e: any) => {
    setInputData({ ...inputData, [e.target.name]: e.target.value });
  };

  const goNext = () => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep(2); // stay on engine step
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedResult(data.data);
      } else {
        alert("Erro gerando post: " + data.error);
      }
    } catch (e) {
      console.error(e);
      alert("Erro de conexão.");
    } finally {
      setIsGenerating(false);
      setCurrentStep(3); // jump to results
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setGeneratedResult(null);
    setShowRawJson(false);
  };

  // ─── Step renderers ───
  const renderStepProfile = () => (
    <div className="glass-card p-6 md:p-10 animate-fade-in" key="profile">
      <h2 className="text-2xl font-extrabold mb-2 tracking-tight">👤 Perfil Essencial</h2>
      <p className="text-slate-400 mb-8">Forneça o mínimo para a inteligência compreender quem você é.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nome da Marca ou Pessoa</label>
          <input className="input-field" name="nome_perfil" value={inputData.nome_perfil} onChange={handleChange} placeholder="Sua Marca" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nicho de Atuação</label>
          <input className="input-field" name="nicho" value={inputData.nicho} onChange={handleChange} placeholder="ex: IA aplicada a marketing" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Público-alvo Resumido</label>
        <textarea className="input-field min-h-[80px]" name="publico_alvo_resumido" value={inputData.publico_alvo_resumido} onChange={handleChange} rows={2} placeholder="ex: Empreendedores iniciantes em tecnologia"></textarea>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tom de Voz</label>
        <input className="input-field" name="tom_de_voz" value={inputData.tom_de_voz} onChange={handleChange} placeholder="ex: Didático, objetivo e bem-humorado" />
      </div>

      <div className="flex gap-4 mt-8">
        <button className="btn-primary w-full" onClick={goNext}>Próximo →</button>
      </div>
    </div>
  );

  const renderStepInterests = () => (
    <div className="glass-card p-6 md:p-10 animate-fade-in" key="interests">
      <h2 className="text-2xl font-extrabold mb-2 tracking-tight">🎯 Interesses da Rodada</h2>
      <p className="text-slate-400 mb-8">Sobre o que deseja falar hoje? O motor fará as pesquisas autônomas.</p>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Interesses Principais (separados por vírgula)</label>
        <textarea className="input-field min-h-[100px]" name="interesses_principais" value={inputData.interesses_principais} onChange={handleChange} rows={3} placeholder="ex: IA generativa, produtividade matinal, metaverso..."></textarea>
      </div>
      
      <div className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-5 mt-4">
        <h4 className="text-blue-400 font-semibold text-sm mb-2">🤖 Autonomia da Pipeline Full-Stack:</h4>
        <ul className="text-sm text-slate-300 pl-5 list-disc space-y-1">
          <li>Post estruturado em sub-blocos rígidos.</li>
          <li>Geração de Imagens via IA Integrada (Slides automáticos).</li>
          <li>Montagem Mídia Visual em Canvas pipeline.</li>
          <li>Injeção direta na Fila de Publicação (Redis).</li>
        </ul>
      </div>

      <div className="flex gap-4 mt-8">
        <button className="btn-secondary flex-1" onClick={goBack}>← Voltar</button>
        <button className="btn-primary flex-1" onClick={handleGenerate}>⚡ Acionar Pipeline Backend</button>
      </div>
    </div>
  );

  const renderStepGenerating = () => (
    <div className="glass-card p-10 text-center flex flex-col items-center justify-center min-h-[400px] animate-fade-in" key="generating">
      <div className={`text-7xl mb-6 ${isGenerating ? 'animate-pulse' : ''}`}>{isGenerating ? '🖧' : '🚀'}</div>
      <h2 className="text-2xl font-extrabold mb-2">{isGenerating ? 'Pipeline Full-Stack Executando...' : 'Pronto para Decolar'}</h2>
      <p className="text-slate-400 max-w-md mx-auto h-[60px]">
        {isGenerating ? (
          '1. LLM Gerando Estrutura -> 2. Motor Gerando Imagens -> 3. Canvas Montando Arquivos -> 4. Fila Agendando'
        ) : (
          'Clique no botão abaixo para autorizar a operação da inteligência artificial.'
        )}
      </p>

      {isGenerating ? (
        <div className="flex gap-2 mt-8">
          <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-3 h-3 bg-purple-500 rounded-full animate-bounce"></span>
        </div>
      ) : (
        <button className="btn-primary w-full max-w-xs mt-4" onClick={handleGenerate}>
          ✨ Iniciar Motor
        </button>
      )}
    </div>
  );

  const renderStepResults = () => {
    if (!generatedResult) return null;
    const { content, export: exportFiles, post_id } = generatedResult;
    const post = content.post;

    return (
      <div className="glass-card p-6 md:p-10 animate-fade-in" key="results">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-2xl font-extrabold tracking-tight">✅ Flow Full-Stack Concluído!</h2>
                <p className="text-slate-400 text-sm">Task ID: <span className="font-mono text-xs">{post_id}</span></p>
            </div>
            <span className="bg-green-500/20 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">Agendado p/ Fila</span>
        </div>

        {/* Mídia Montada */}
        <div className="bg-black/30 border border-white/10 p-5 rounded-xl mb-6">
          <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">🖼️ Arquivos Rendirizados (Canvas Motor)</h3>
          <div className="flex flex-wrap gap-3">
            {exportFiles.map((file: string, idx: number) => (
                <div key={idx} className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm font-mono text-slate-300">
                    {file}
                </div>
            ))}
          </div>
        </div>

        {/* Estrutura Carrossel */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-4 text-purple-400">📝 Estrutura Carrossel "{post.titulo}"</h3>
          <div className="space-y-4">
              {post.slides.map((slide: any) => (
                  <div key={slide.ordem} className="bg-black/20 border border-white/5 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-start">
                      <div className="shrink-0 w-12 h-12 bg-purple-900/50 flex items-center justify-center rounded-lg font-bold text-xl text-purple-300 border border-purple-500/30">
                          {slide.ordem}
                      </div>
                      <div className="flex-grow">
                          <h4 className="font-bold text-sm text-white mb-1">{slide.titulo}</h4>
                          <p className="text-slate-400 text-sm mb-2">{slide.texto}</p>
                          <div className="text-xs font-mono bg-blue-900/20 text-blue-300 p-2 rounded border border-blue-500/20 truncate" title={slide.imagem_url}>
                             IA Imagem: {slide.prompt_utilizado}
                          </div>
                      </div>
                  </div>
              ))}
          </div>
        </div>

        {/* Legenda e Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-black/20 border border-white/5 p-5 rounded-xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Legenda Final</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{post.legenda}</p>
            </div>
            <div className="bg-black/20 border border-white/5 p-5 rounded-xl">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Hashtags</h4>
                <div className="flex flex-wrap gap-2">
                    {post.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-1 rounded text-xs">{tag}</span>
                    ))}
                </div>
            </div>
        </div>

        {/* JSON Toggle */}
        <div className="text-center mt-8 border-t border-white/10 pt-8">
          <button className="btn-secondary text-sm px-4 py-2" onClick={() => setShowRawJson(!showRawJson)}>
            {showRawJson ? '🔽 Esconder Payload DB' : '⚙️ Visualizar JSON que foi p/ Banco'}
          </button>
          {showRawJson && (
            <div className="mt-4 text-left">
              <pre className="bg-[#0d0e15] border border-white/5 p-4 rounded-lg overflow-x-auto text-xs font-mono text-indigo-300 max-h-[400px] overflow-y-auto w-full">
                  {JSON.stringify(post, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-8">
          <button className="btn-primary w-full" onClick={resetWizard}>Criar Novo Post 🔄</button>
        </div>
      </div>
    );
  };

  const stepRenderers = [
    renderStepProfile,
    renderStepInterests,
    renderStepGenerating,
    renderStepResults,
  ];

  return (
    <div className="max-w-3xl mx-auto w-full">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2">ContentPlatform<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Core</span></h1>
        <p className="text-slate-400 text-sm font-medium">Arquitetura Next.js • Motor IA • Fila Redis • Canvas Builder</p>
      </header>

      {/* Stepper */}
      <nav className="flex items-center justify-center mb-10 px-4">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`flex flex-col items-center relative z-10 cursor-pointer transition-all duration-300 ${i <= currentStep ? '' : 'opacity-40 grayscale'}`}
              onClick={() => { if (i < currentStep) setCurrentStep(i); }}
            >
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl bg-[var(--bg-primary)] transition-all duration-300 ${i === currentStep ? 'border-purple-500 shadow-[0_0_15px_rgba(138,43,226,0.3)] scale-110' : i < currentStep ? 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'border-white/20'}`}>
                {i < currentStep ? '✓' : step.icon}
              </div>
              <span className={`text-[0.65rem] md:text-xs font-bold uppercase tracking-wider mt-3 transition-all ${i === currentStep ? 'text-white' : 'text-slate-500'}`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 md:w-16 h-[2px] mb-6 transition-all duration-500 ${i < currentStep ? 'bg-gradient-to-r from-green-500 to-purple-500' : 'bg-white/10'}`} />
            )}
          </div>
        ))}
      </nav>

      {/* Current Step */}
      <div className="transition-all duration-300 ease-in-out">
          {stepRenderers[currentStep]()}
      </div>
    </div>
  );
}
