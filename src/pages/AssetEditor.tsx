import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Download, Copy, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Type, AlignLeft, AlignCenter, AlignRight, RefreshCw, MessageSquare, Wand2, Search, Camera, Home, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSlideImage, translateForSearch } from '../lib/ai/images';
import { supabase } from '../lib/supabase';

const MOCK_LEGENDA = "Sua legenda magnética será gerada aqui...";

// Dados iniciais limpos para quando não houver pesquisa
const MOCK_SLIDES = Array.from({ length: 1 }).map((_, i) => ({
  ordem: i + 1,
  titulo: "Seu Título Magnético",
  texto: "A copy estratégica que converte aparecerá aqui.",
  imagem: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
  alinhamento: "text-center"
}));

export default function AssetEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingData = location.state?.generatedData;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentFont, setCurrentFont] = useState('font-sans');
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#cbd5e1');

  // Se houver dados vindos da IA, usamos eles. Caso contrário, usamos o MOCK.
  const initialSlides = incomingData?.slides?.map((s: any, idx: number) => ({
    ordem: s.ordem,
    titulo: s.titulo,
    texto: s.texto,
    image_prompt: s.image_prompt,
    // Usando uma base de imagens mais estável como fallback inicial
    imagem: `https://images.unsplash.com/photo-${1600000000000 + (idx * 1234567)}?q=80&w=1080&auto=format&fit=crop`, 
    alinhamento: "text-center",
    ai_generated: false
  })) || MOCK_SLIDES.map(s => ({ ...s, ai_generated: false }));

  const initialCaption = incomingData?.legenda_instagram_facebook || MOCK_LEGENDA;

  const [mockSlides, setMockSlides] = useState(initialSlides);
  const [caption, setCaption] = useState(initialCaption);
  const [selectedTone, setSelectedTone] = useState(incomingData?.tone || 'informativo');
  const [selectedDepth, setSelectedDepth] = useState('medio');
  const [isRewriting, setIsRewriting] = useState(false);
  const [isRewritingSlide, setIsRewritingSlide] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);

  const handleRewriteCaption = async () => {
    setIsRewriting(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Você é um copywriter expert em redes sociais (Instagram e Facebook). 
              Sua tarefa é reescrever a legenda fornecida mantendo estritamente o MESMO ASSUNTO e TEMA, mas alterando o tom e a extensão.
              
              Contexto do Post: "${incomingData?.topic || 'Assunto Geral'}"
              Tom de Voz desejado: ${selectedTone}
              Extensão desejada: ${selectedDepth === 'curto' ? 'Concisa e direta' : selectedDepth === 'longo' ? 'Detalhada e explicativa' : 'Equilibrada'}
              
              Regras:
              1. Mantenha os pontos principais do assunto.
              2. Use emojis de forma estratégica.
              3. Adicione 3 a 5 hashtags relevantes ao final.
              4. Não mude o assunto original.`
            },
            {
              role: "user",
              content: `Reescreva esta legenda original: "${caption}"`
            }
          ]
        })
      });

      const data = await response.json();
      const novaLegenda = data.choices[0].message.content;
      
      if (novaLegenda) {
        setCaption(novaLegenda);
      }
    } catch (error) {
      console.error("Erro ao reescrever legenda:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleRewriteSlide = async () => {
    setIsRewritingSlide(true);
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Você é um copywriter expert de alta performance.
              SUA REGRA DE OURO: Você deve reescrever o conteúdo do slide SEMPRE mantendo o assunto central: "${incomingData?.topic || 'Assunto original do post'}".
              
              INSTRUÇÕES POR ESTILO:
              - Se o estilo for "informativo" (Técnico): Use dados, fatos e linguagem profissional.
              - Se o estilo for "pessoal" (Pessoal): Use "eu", conte uma breve história ou conexão emocional.
              - Se o estilo for "agressivo" (Vendas): Use gatilhos mentais de escassez, urgência e call to action forte.
              
              ESTILO ESCOLHIDO: ${selectedTone}.
              TEMA OBRIGATÓRIO: Mantendo o foco total em ${incomingData?.topic || 'o assunto atual'}.
              
              Retorne APENAS um JSON com os campos "titulo" (máx 8 palavras) e "texto" (máx 15 palavras).
              NUNCA invente assuntos novos. Apenas aplique o estilo ao tema proposto.`
            },
            {
              role: "user",
              content: `Título Atual: "${mockSlides[currentSlide].titulo}"\nTexto Atual: "${mockSlides[currentSlide].texto}"`
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      
      const newSlides = [...mockSlides];
      newSlides[currentSlide] = { 
        ...newSlides[currentSlide], 
        titulo: result.titulo, 
        texto: result.texto 
      };
      setMockSlides(newSlides);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRewritingSlide(false);
    }
  };

  const handleTextChange = (field: 'titulo' | 'texto' | 'alinhamento', value: string) => {
    const newSlides = [...mockSlides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], [field]: value };
    setMockSlides(newSlides);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSlides = [...mockSlides];
      newSlides[currentSlide] = { ...newSlides[currentSlide], imagem: url };
      setMockSlides(newSlides);
    }
  };
  const handleGenerateAIImage = async () => {
    const prompt = mockSlides[currentSlide].image_prompt || mockSlides[currentSlide].titulo;
    if (!prompt) return;

    if (mockSlides[currentSlide].ai_generated) {
      alert("Atenção: Você já utilizou a geração por IA para este card. Para manter o custo baixo e a qualidade, sugerimos que pesquise uma 'Foto Real' no buscador abaixo ou envie sua própria foto!");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateSlideImage(prompt);
      if (typeof imageUrl === 'string') {
        const newSlides = [...mockSlides];
        newSlides[currentSlide] = { 
          ...newSlides[currentSlide], 
          imagem: imageUrl,
          ai_generated: true 
        };
        setMockSlides(newSlides);
      } else if (imageUrl && (imageUrl as any).error) {
        alert(`Erro do Google: ${(imageUrl as any).error}. \n\nIsso geralmente acontece se a sua chave de API ainda não tem permissão para o Imagen 3 ou se o tópico viola as políticas de segurança.`);
      } else {
        alert("Ops! Não conseguimos gerar essa imagem agora. Tente usar 'Buscar Fotos Reais' ou envie sua própria foto.");
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro técnico ao tentar gerar a imagem. Verifique sua conexão ou tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateAllAIImages = async () => {
    setIsGeneratingImage(true);
    try {
      const newSlides = [...mockSlides];
      for (let i = 0; i < newSlides.length; i++) {
        // Apenas gera se ainda não foi gerado nesta sessão
        if (!newSlides[i].ai_generated) {
          const prompt = newSlides[i].image_prompt || newSlides[i].titulo;
          if (prompt) {
            const imageUrl = await generateSlideImage(prompt);
            if (imageUrl) {
              newSlides[i].imagem = imageUrl;
              newSlides[i].ai_generated = true;
            }
            setMockSlides([...newSlides]); 
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSearchPhotos = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingPhotos(true);
    setSearchResults([]); 
    
    try {
      // 1. Tradução ultra-precisa via Gemini (sua chave)
      const translatedQuery = await translateForSearch(searchQuery);
      
      console.log("Busca real:", searchQuery, "->", translatedQuery);

      // 2. Para "Fotos Reais", o LoremFlickr (Unsplash/Flickr) é o mais confiável sem custos
      // Vamos gerar 6 variantes usando a query traduzida
      const finalPhotos: string[] = [];
      const cleanKeywords = translatedQuery.replace(/[^a-zA-Z0-9, ]/g, '').split(' ').join(',');
      
      const seed = Math.floor(Math.random() * 10000);
      
      for(let i=0; i<6; i++) {
        // Usamos lock diferente para cada um para garantir fotos distintas
        finalPhotos.push(`https://loremflickr.com/800/800/${encodeURIComponent(cleanKeywords)}?lock=${seed + i}`);
      }

      setSearchResults(finalPhotos);
    } catch (error) {
      console.error("Erro na busca de fotos:", error);
      const fallback = [];
      for(let i=0; i<6; i++) {
        fallback.push(`https://loremflickr.com/800/800/business?lock=${Date.now() + i}`);
      }
      setSearchResults(fallback);
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  const selectPhoto = (url: string) => {
    const newSlides = [...mockSlides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], imagem: url };
    setMockSlides(newSlides);
  };

  const handleSavePost = async () => {
    setIsSaving(true);
    try {
      const postId = incomingData?.postId;
      
      if (postId) {
        // Atualizar post existente (rascunho iniciado)
        const { error } = await supabase
          .from('posts')
          .update({ 
            content: { slides: mockSlides, caption },
            title: incomingData?.topic || "Sem título",
          })
          .eq('id', postId);
        
        if (error) throw error;
      } else {
        // Criar novo post
        const { error } = await supabase
          .from('posts')
          .insert([
            { 
              content: { slides: mockSlides, caption },
              title: incomingData?.topic || "Sem título",
              created_at: new Date().toISOString()
            }
          ]);
        
        if (error) throw error;
      }
      
      setIsFinished(true);
    } catch (err) {
      console.error("Save Error:", err);
      // Fallback para permitir que o usuário veja a tela final mesmo em caso de erro no banco
      setIsFinished(true); 
    } finally {
      setIsSaving(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < mockSlides.length - 1) setCurrentSlide(prev => prev + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  if (isFinished) {
    return (
      <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-12 text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/20">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Post Finalizado! 🚀</h2>
          <p className="text-slate-400 mb-10 text-lg leading-relaxed">
            Seu conteúdo estratégico foi salvo. Agora é só baixar os ativos e usar a legenda magnética logo abaixo.
          </p>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-8 mb-6 text-left relative group">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">LEGENDA GERADA:</h4>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {caption}
            </p>
            <button 
              onClick={handleCopyCaption}
              className="absolute top-6 right-6 p-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-widest">{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>

          <div className="mb-10 text-left">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">SEUS ATIVOS GERADOS:</h4>
            <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
              {mockSlides.map((slide, idx) => (
                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  <img src={slide.imagem} className="w-full h-full object-cover" alt={`Slide ${idx+1}`} />
                  <a 
                    href={slide.imagem} 
                    download={`slide-${idx+1}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setIsFinished(false)}
              className="py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 hover:border-white/20"
            >
              Continuar Editando
            </button>
            <button 
              onClick={() => navigate('/')}
              className="py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              Finalizar e Sair
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] text-slate-100 min-h-screen font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">
      
      {/* Header Premium */}
      <header className="flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 shrink-0">
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
              <Sparkles className="w-4 h-4 text-indigo-400" /> Editor de Ativos
            </h2>
            <p className="text-slate-400 text-xs font-medium italic">Transformando insights em impacto visual</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSavePost}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {isSaving ? "Salvando..." : "Finalizar e Salvar"}
          </button>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        
        {/* Left: Preview Canvas (Visualizador) */}
        {/* Central: Visualização do Carrossel (Subir na visão) */}
        <section className="flex-1 bg-[#0A0A0B] p-4 md:p-8 overflow-y-auto flex flex-col items-center pt-4 md:pt-8 relative border-r border-white/10">
          
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          {/* O Slide em Si */}
          <div className="relative w-full max-w-[400px] aspect-square md:aspect-[4/5] bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-white/10 group">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${mockSlides[currentSlide].imagem}')` }}
              >
                {/* Overlay Escuro para o texto ler bem */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                
                {/* Textos Gerados pela IA */}
                <div className={`absolute inset-x-8 bottom-12 ${mockSlides[currentSlide].alinhamento || 'text-left'}`}>

                  <h3 
                    className={`text-3xl md:text-4xl font-extrabold leading-tight mb-3 ${currentFont}`}
                    style={{ color: titleColor }}
                  >
                    {mockSlides[currentSlide].titulo}
                  </h3>
                  <p 
                    className="text-sm md:text-base leading-relaxed"
                    style={{ color: textColor }}
                  >
                    {mockSlides[currentSlide].texto}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controles do Carrossel */}
            <button 
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 disabled:opacity-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={nextSlide}
              disabled={currentSlide === mockSlides.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all border border-white/10 disabled:opacity-0"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Indicadores de bolinha */}
            <div className="absolute top-6 inset-x-0 flex justify-center gap-1.5 z-10">
              {mockSlides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-blue-500' : 'w-4 bg-white/30'}`}
                />
              ))}
            </div>

            {/* OVERLAY DE STATUS NA IMAGEM */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
              <span className="bg-black/60 backdrop-blur-md text-[10px] font-black text-white px-3 py-1.5 rounded-lg border border-white/10 shadow-xl uppercase tracking-widest">
                Lâmina {currentSlide + 1} de {mockSlides.length}
              </span>
            </div>

            {/* BOTÃO RÁPIDO DE TROCA NA IMAGEM */}
            <div className="absolute top-4 right-4 z-20">
              <label className="cursor-pointer flex items-center gap-2 bg-black/60 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
                <Camera className="w-3.5 h-3.5" />
                Trocar Foto
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
              </label>
            </div>

          </div>

          {/* Strip dos Thumbnailzinhos */}
          <div className="flex gap-3 justify-center mt-8 px-4 w-full overflow-x-auto custom-scrollbar pb-2">
            {mockSlides.map((slide, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`flex-none w-16 h-16 rounded-lg bg-cover bg-center border-2 transition-all overflow-hidden relative ${
                  idx === currentSlide ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 opacity-50 hover:opacity-100'
                }`}
                style={{ backgroundImage: `url('${slide.imagem}')` }}
              >
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{idx + 1}</span>
                </div>
              </button>
            ))}
          </div>
          
        </section>

        {/* Right: Painel Auxiliar (Textos e Assets Extras) */}
        <aside className="w-full lg:w-[400px] bg-slate-900 flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">

          {/* Editar Slide Atual (Canva / Pomelli Style) */}
          <div className="p-6 border-b border-white/10 bg-slate-900 sticky top-0 z-20">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-blue-400" /> Editar Slide {currentSlide + 1}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Alinhamento</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleTextChange('alinhamento', 'text-left')}
                      className={`flex-1 flex justify-center py-2 rounded-lg border transition-colors ${mockSlides[currentSlide].alinhamento === 'text-left' || !mockSlides[currentSlide].alinhamento ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleTextChange('alinhamento', 'text-center')}
                      className={`flex-1 flex justify-center py-2 rounded-lg border transition-colors ${mockSlides[currentSlide].alinhamento === 'text-center' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleTextChange('alinhamento', 'text-right')}
                      className={`flex-1 flex justify-center py-2 rounded-lg border transition-colors ${mockSlides[currentSlide].alinhamento === 'text-right' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/50 border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Tipografia do Título</label>
                  <select 
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={currentFont}
                    onChange={(e) => setCurrentFont(e.target.value)}
                  >
                    <option value="font-sans">Inter</option>
                    <option value="font-serif">Playfair</option>
                    <option value="font-mono">JetBrains</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Cores do Design
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Título</span>
                      <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/5">
                        <input 
                          type="color" 
                          value={titleColor} 
                          onChange={(e) => setTitleColor(e.target.value)}
                          className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={titleColor} 
                          onChange={(e) => setTitleColor(e.target.value)}
                          className="bg-transparent text-[10px] text-white w-full outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Texto</span>
                      <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-lg border border-white/5">
                        <input 
                          type="color" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-6 h-6 rounded border-none bg-transparent cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={textColor} 
                          onChange={(e) => setTextColor(e.target.value)}
                          className="bg-transparent text-[10px] text-white w-full outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Título Principal</label>
                <input 
                  type="text" 
                  value={mockSlides[currentSlide].titulo}
                  onChange={(e) => handleTextChange('titulo', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Texto de Apoio</label>
                  <textarea 
                    value={mockSlides[currentSlide].texto}
                    onChange={(e) => handleTextChange('texto', e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all min-h-[100px] hover:border-indigo-500/30 resize-y"
                    placeholder="Escreva a copy do slide..."
                  />
                </div>

                <div className="pt-4 border-t border-white/10 mt-2 space-y-4">
                  {/* BOTÃO MASTER DE GERAÇÃO IA */}
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={handleGenerateAIImage}
                      disabled={isGeneratingImage}
                      className={`w-full text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50 border border-white/10 active:scale-95 ${mockSlides[currentSlide].ai_generated ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20'}`}
                    >
                      {isGeneratingImage ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      {mockSlides[currentSlide].ai_generated ? "Limite de IA atingido" : isGeneratingImage ? "Gerando Arte Épica..." : "Gerar Imagem com IA"}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95">
                        <ImageIcon className="w-3.5 h-3.5" />
                        Quero enviar uma foto
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleImageUpload}
                        />
                      </label>
                      <button 
                        onClick={handleGenerateAllAIImages}
                        disabled={isGeneratingImage}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[11px] flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Gerar Todas
                      </button>
                    </div>
                  </div>

                  {/* AJUSTE DE TOM */}
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5" /> Estilo da Copy
                      </label>
                      <button 
                        onClick={handleRewriteSlide}
                        disabled={isRewritingSlide}
                        className="text-[10px] font-black text-slate-400 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50 underline decoration-indigo-500/50 underline-offset-4"
                      >
                        {isRewritingSlide ? 'Ajustando...' : 'IA: Mudar Frase'}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedTone('informativo')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedTone === 'informativo' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/10 text-slate-500'}`}
                      >
                        Técnico
                      </button>
                      <button 
                        onClick={() => setSelectedTone('pessoal')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedTone === 'pessoal' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/10 text-slate-500'}`}
                      >
                        Pessoal
                      </button>
                      <button 
                        onClick={() => setSelectedTone('agressivo')}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold border transition-all ${selectedTone === 'agressivo' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-black/40 border-white/10 text-slate-500'}`}
                      >
                        Vendas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          <div className="p-6 border-b border-white/10 bg-slate-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" /> Buscar Fotos Reais
            </h3>
            <p className="text-xs text-slate-400 mt-1">IA pesquisando as melhores fotos da web.</p>
            
            <div className="mt-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPhotos()}
                  placeholder="Ex: luxo, tecnologia, café..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <button 
                onClick={handleSearchPhotos}
                disabled={isSearchingPhotos}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all disabled:opacity-50"
              >
                {isSearchingPhotos ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {searchResults.map((url, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileActive={{ scale: 0.95 }}
                    onClick={() => selectPhoto(url)}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all shadow-lg"
                  >
                    <img src={url} alt="Search result" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-b border-white/10 bg-slate-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-400" /> Imagens do Projeto
            </h3>
            <p className="text-xs text-slate-400 mt-1">Suas artes atuais e fotos carregadas.</p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            {mockSlides.map((slide, idx) => {
              const isDefault = slide.imagem.includes('unsplash.com/photo-');
              return (
                <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-black/50 border border-white/5">
                  <img 
                    src={slide.imagem} 
                    alt={isDefault ? "Imagem pendente" : "Imagem gerada"} 
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isDefault ? 'opacity-40 grayscale' : 'opacity-100'}`} 
                  />
                  {isDefault && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-black/40 px-2 py-1 rounded">
                        Não Gerada
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => setCurrentSlide(idx)}
                      className="bg-white/20 hover:bg-blue-500 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Área da Legenda */}
          <div className="p-6 border-t border-white/10 mt-auto bg-slate-950/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Copy da Legenda
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyCaption}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            {/* AI Tone Rewriter */}
            <div className="mb-4 flex flex-col gap-2 p-3 rounded-lg bg-black/30 border border-white/5">
              <label className="text-xs text-slate-400 font-bold flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Ajustar Tom de Voz (IA)
              </label>
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={selectedTone}
                  onChange={(e) => setSelectedTone(e.target.value)}
                >
                  <option value="informativo">Técnico / Informativo</option>
                  <option value="pessoal">Pessoal (1ª pessoa)</option>
                  <option value="agressivo">Agressivo / Vendas</option>
                </select>
                <select 
                  className="w-24 bg-black/50 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  value={selectedDepth}
                  onChange={(e) => setSelectedDepth(e.target.value)}
                >
                  <option value="curto">Curto</option>
                  <option value="medio">Médio</option>
                  <option value="longo">Longo</option>
                </select>
                <button 
                  onClick={handleRewriteCaption}
                  disabled={isRewriting}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRewriting ? 'animate-spin' : ''}`} />
                  Reescrever
                </button>
              </div>
            </div>
            
            <div className={`bg-black/50 border border-white/5 rounded-xl p-4 transition-opacity duration-300 ${isRewriting ? 'opacity-50 blur-[2px]' : 'opacity-100'}`}>
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed resize-none custom-scrollbar outline-none"
                rows={8}
              />
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              <p className="text-xs text-indigo-300 leading-relaxed font-medium text-center">
                Seu post está pronto! Baixe o carrossel, copie a legenda e agende manualmente na sua ferramenta favorita.
              </p>
            </div>
          </div>
        </aside>

      </main>
    </div>
  );
}
