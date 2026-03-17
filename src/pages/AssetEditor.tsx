import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowLeft, Download, Copy, Check, ChevronLeft, ChevronRight, Image as ImageIcon, Type, AlignLeft, AlignCenter, AlignRight, RefreshCw, MessageSquare, Wand2, Search, Camera, Home, Palette, PackageOpen, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper, { Point, Area } from 'react-easy-crop';
import heic2any from 'heic2any';
import { generateSlideImage, translateForSearch } from '../lib/ai/images';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const incomingData = location.state?.generatedData;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const [currentFont, setCurrentFont] = useState('font-sans');
  const [titleColor, setTitleColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#cbd5e1');

  // Se houver dados vindos da IA ou do Banco, usamos eles. Caso contrário, usamos o MOCK.
  const initialSlides = incomingData?.slides?.map((s: any, idx: number) => ({
    ordem: s.ordem || idx + 1,
    titulo: s.titulo,
    texto: s.texto,
    image_prompt: s.image_prompt,
    // SE já existir uma imagem vinda do banco (s.imagem), usa ela. Senão, fallback inicial.
    imagem: s.imagem || `https://images.unsplash.com/photo-${1600000000000 + (idx * 1234567)}?q=80&w=1080&auto=format&fit=crop`, 
    alinhamento: s.alinhamento || "text-center",
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
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadModalData, setDownloadModalData] = useState<{ url: string, name: string, blob: Blob }[] | null>(null);
  
  // Novos Estilos de Layout
  const [globalStyle, setGlobalStyle] = useState<'classic' | 'centered' | 'twitter'>(incomingData?.globalStyle || 'classic');
  const [twitterName, setTwitterName] = useState(incomingData?.twitterName || '');
  const [twitterHandle, setTwitterHandle] = useState(incomingData?.twitterHandle || '');
  const [twitterAvatar, setTwitterAvatar] = useState(incomingData?.twitterAvatar || '');
  
  // Crop & Past Avatars State
  const [pastAvatars, setPastAvatars] = useState<string[]>([]);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropType, setCropType] = useState<'avatar' | 'main' | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  React.useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const { data } = await supabase
          .from('posts')
          .select('content')
          .eq('user_id', user?.id)
          .not('content', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30);
        if (data) {
          const loadedAvatars = data
            .map(p => p.content?.twitterAvatar)
            .filter(Boolean);
          const uniqueAvatars = Array.from(new Set(loadedAvatars));
          setPastAvatars(uniqueAvatars.slice(0, 5) as string[]);
        }
      } catch (e) {}
    };
    if (user?.id) fetchAvatars();
  }, [user]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Renderiza um slide num Canvas com imagem + texto overlay (4:5 Instagram)
  // Replica fielmente o visual do editor CSS
  // Word wrap com suporte a enter puro (\n) para Canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    // Quebra forçada por \n caso o usuário tenha digitado enter na copy
    const paragraphs = text.split('\n');
    const lines: string[] = [];
    
    paragraphs.forEach(p => {
      const words = p.split(' ');
      let currentLine = '';
      words.forEach(word => {
        const test = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = test;
        }
      });
      if (currentLine) lines.push(currentLine);
      else lines.push(''); // placeholder para a quebra de linha visual vazia
    });
    return lines;
  };

  // Carrega a imagem com Promise para controlar o async drawing
  // Converte URLs externas em blob para evitar CORS/tainted canvas na exportação
  const loadCanvasImage = async (url: string): Promise<HTMLImageElement | null> => {
    if (!url) return null;
    
    try {
      let imgSrc = url;
      
      // Se for URL externa (não blob nem data:), converte pra blob pra evitar CORS
      if (!url.startsWith('blob:') && !url.startsWith('data:')) {
        try {
          const resp = await fetch(url, { mode: 'cors' });
          const blob = await resp.blob();
          imgSrc = URL.createObjectURL(blob);
        } catch {
          imgSrc = url;
        }
      }
      
      return new Promise((resolve) => {
        const img = new Image();
        if (imgSrc === url && !url.startsWith('blob:') && !url.startsWith('data:')) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = imgSrc;
      });
    } catch {
      return null;
    }
  };

  // Renderiza um slide num Canvas nativo para download (1080x1350) 
  const renderSlideToCanvas = async (slide: any): Promise<Blob> => {
    const CANVAS_W = 1080;
    const CANVAS_H = 1350; // 4:5
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d')!;

    // Fator de escala base (1080px base de tela div de 400px)
    const S = CANVAS_W / 400;

    const [mainImg, avatarImg] = await Promise.all([
      loadCanvasImage(slide.imagem),
      globalStyle === 'twitter' ? loadCanvasImage(twitterAvatar) : Promise.resolve(null)
    ]);

    // Background Principal
    if (globalStyle === 'twitter') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    } else {
      if (mainImg) {
        const scale = Math.max(CANVAS_W / mainImg.width, CANVAS_H / mainImg.height);
        const w = mainImg.width * scale;
        const h = mainImg.height * scale;
        const x = (CANVAS_W - w) / 2;
        const y = (CANVAS_H - h) / 2;
        ctx.drawImage(mainImg, x, y, w, h);
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      }
      
      // Degradê
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      if (globalStyle === 'centered') {
        grad.addColorStop(0, 'rgba(0,0,0,0.8)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.6)');
        grad.addColorStop(1, 'rgba(0,0,0,0.8)');
      } else { // classic
        grad.addColorStop(0, 'rgba(0,0,0,0.08)');
        grad.addColorStop(0.35, 'rgba(0,0,0,0.12)');
        grad.addColorStop(0.55, 'rgba(0,0,0,0.40)');
        grad.addColorStop(1, 'rgba(0,0,0,0.92)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }

    // Config alinhamento de texto (para left, right, center)
    const align = slide.alinhamento === 'text-center' ? 'center' : slide.alinhamento === 'text-right' ? 'right' : 'left';
    ctx.textAlign = align as CanvasTextAlign;
    
    // Configurações e Tamanhos Base
    const paddingX = Math.round( (globalStyle === 'twitter' ? 24 : 32) * S); // padding laterais do layout
    const textX = align === 'center' ? CANVAS_W / 2 : align === 'right' ? CANVAS_W - paddingX : paddingX;
    const maxWidth = CANVAS_W - (paddingX * 2);

    if (globalStyle === 'classic' || globalStyle === 'centered') {
      const titleFontSize = Math.round( (globalStyle === 'centered' ? 36 : 36) * S);
      const titleLineHeight = Math.round(titleFontSize * 1.25);
      ctx.font = `800 ${titleFontSize}px Inter, -apple-system, Helvetica, sans-serif`;
      const titleLines = wrapText(ctx, (slide.titulo || ''), maxWidth);

      const bodyFontSize = Math.round( (globalStyle === 'centered' ? 18 : 16) * S);
      const bodyLineHeight = Math.round(bodyFontSize * 1.625);
      ctx.font = `400 ${bodyFontSize}px Inter, -apple-system, Helvetica, sans-serif`;
      const bodyLines = wrapText(ctx, (slide.texto || ''), maxWidth);

      let textStartY = 0;
      let titleStartY = 0;

      if (globalStyle === 'classic') {
        const bottomMargin = Math.round(48 * S);
        const gapTitleBody = Math.round(36 * S); 
        
        const lastBodyY = CANVAS_H - bottomMargin;
        textStartY = lastBodyY - ((bodyLines.length - 1) * bodyLineHeight);
        
        const lastTitleY = textStartY - gapTitleBody;
        titleStartY = lastTitleY - ((titleLines.length - 1) * titleLineHeight);
      } else {
        // Centered
        const totalTitleHeight = titleLines.length * titleLineHeight;
        const totalBodyHeight = bodyLines.length * bodyLineHeight;
        const gapTitleBody = Math.round(40 * S);
        
        const totalBlockHeight = totalTitleHeight + gapTitleBody + totalBodyHeight;
        let currentY = (CANVAS_H - totalBlockHeight) / 2;
        
        titleStartY = currentY;
        textStartY = currentY + totalTitleHeight + gapTitleBody;
      }

      // Drop shadows
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;

      // Desenhar Title
      ctx.fillStyle = titleColor;
      ctx.font = `800 ${titleFontSize}px Inter, -apple-system, Helvetica, sans-serif`;
      titleLines.forEach((line, i) => ctx.fillText(line, textX, titleStartY + (i * titleLineHeight)));

      // Desenhar Body
      ctx.fillStyle = textColor;
      ctx.font = `400 ${bodyFontSize}px Inter, -apple-system, Helvetica, sans-serif`;
      ctx.shadowBlur = 8;
      bodyLines.forEach((line, i) => {
        // Ignora linhas vazias de block \n
        if (line) ctx.fillText(line, textX, textStartY + (i * bodyLineHeight));
      });
      
      // Cleanup shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

    } else if (globalStyle === 'twitter') {
      let currentY = Math.round(24 * S); // start margin top
      const startX = paddingX;

      // 1. HEADER TWITTER
      if (avatarImg) { // Draw circulo
        const avatarSize = Math.round(48 * S);
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX + avatarSize/2, currentY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avatarImg, startX, currentY, avatarSize, avatarSize);
        ctx.restore();
      }
      
      const avatarSize = Math.round(48 * S);
      const nameX = startX + avatarSize + Math.round(12 * S);
      
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827'; // gray-900
      ctx.font = `bold ${Math.round(16 * S)}px Inter, -apple-system, Helvetica, sans-serif`;
      ctx.fillText(twitterName, nameX, currentY + Math.round(22 * S));
      
      ctx.fillStyle = '#6b7280'; // gray-500
      ctx.font = `400 ${Math.round(14 * S)}px Inter, -apple-system, Helvetica, sans-serif`;
      ctx.fillText(twitterHandle, nameX, currentY + Math.round(40 * S));

      // 2. TEXTO BODY
      currentY += avatarSize + Math.round(20 * S);
      ctx.textAlign = align as CanvasTextAlign;
      
      if (slide.titulo && slide.titulo.trim() !== '') {
        const twTitleFont = Math.round(15 * S);
        const twTitleLh = Math.round(twTitleFont * 1.5);
        ctx.fillStyle = '#111827';
        
        let canvasFontFamily = 'Inter, sans-serif';
        if (currentFont === 'font-serif') canvasFontFamily = 'Playfair, serif';
        else if (currentFont === 'font-mono') canvasFontFamily = 'JetBrains Mono, monospace';

        ctx.font = `400 ${twTitleFont}px ${canvasFontFamily}`;
        const tLines = wrapText(ctx, (slide.titulo || ''), maxWidth);
        tLines.forEach(line => {
          ctx.fillText(line, textX, currentY + twTitleFont); // offset basílico
          currentY += twTitleLh;
        });
        currentY += Math.round(4 * S); // gap sutil para o texto
      }

      // text main
      const twBodyFont = Math.round(15 * S);
      const twBodyLh = Math.round(twBodyFont * 1.5);
      ctx.fillStyle = '#1f2937';
      // Mapear currentFont para font-family real do canvas
      let canvasFontFamily = 'Inter, sans-serif';
      if (currentFont === 'font-serif') canvasFontFamily = 'Playfair, serif';
      else if (currentFont === 'font-mono') canvasFontFamily = 'JetBrains Mono, monospace';

      ctx.font = `400 ${twBodyFont}px ${canvasFontFamily}`;
      const bLines = wrapText(ctx, (slide.texto || ''), maxWidth);
      bLines.forEach(line => {
         if (line) ctx.fillText(line, textX, currentY + twBodyFont);
         currentY += twBodyLh;
      });

      currentY += Math.round(16 * S); // gap pra imagem

      // 3. IMAGEM 
      if (mainImg) {
        const availableHeight = CANVAS_H - currentY - Math.round(8 * S); // padding bottom
        
        ctx.save();
        // border radius image
        const radius = Math.round(16 * S);
        ctx.beginPath();
        ctx.moveTo(startX + radius, currentY);
        ctx.lineTo(startX + maxWidth - radius, currentY);
        ctx.quadraticCurveTo(startX + maxWidth, currentY, startX + maxWidth, currentY + radius);
        ctx.lineTo(startX + maxWidth, currentY + availableHeight - radius);
        ctx.quadraticCurveTo(startX + maxWidth, currentY + availableHeight, startX + maxWidth - radius, currentY + availableHeight);
        ctx.lineTo(startX + radius, currentY + availableHeight);
        ctx.quadraticCurveTo(startX, currentY + availableHeight, startX, currentY + availableHeight - radius);
        ctx.lineTo(startX, currentY + radius);
        ctx.quadraticCurveTo(startX, currentY, startX + radius, currentY);
        ctx.closePath();
        ctx.clip();
        
        // draw object-fit cover na regiao clippada
        const scale = Math.max(maxWidth / mainImg.width, availableHeight / mainImg.height);
        const w = mainImg.width * scale;
        const h = mainImg.height * scale;
        const dx = startX + (maxWidth - w) / 2;
        const dy = currentY + (availableHeight - h) / 2;
        ctx.drawImage(mainImg, dx, dy, w, h);
        ctx.restore();
      }
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Falha gerar blob da imagem'));
      }, 'image/png', 1.0);
    });
  };

  // Abre o Modal com 1 slide para Download/Compartilhamento
  const downloadSlide = async (slide: any, index: number) => {
    setIsDownloadingAll(true);
    try {
      const blob = await renderSlideToCanvas(slide);
      const fileName = `slide-${index + 1}.png`;
      const url = URL.createObjectURL(blob);
      setDownloadModalData([{ url, name: fileName, blob }]);
    } catch (err) {
      console.error('Erro ao preparar slide:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Abre o Modal com todos os slides para Download/Compartilhamento
  const downloadAllSlides = async () => {
    setIsDownloadingAll(true);
    try {
      const data = [];
      for (let i = 0; i < mockSlides.length; i++) {
        const blob = await renderSlideToCanvas(mockSlides[i]);
        const url = URL.createObjectURL(blob);
        data.push({ url, name: `slide-${i + 1}.png`, blob });
      }
      setDownloadModalData(data);
    } catch (err) {
      console.error('Erro ao preparar slides:', err);
    } finally {
      setIsDownloadingAll(false);
    }
  };

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

  const handleAddSlide = () => {
    const newSlide = {
      ordem: mockSlides.length + 1,
      titulo: "",
      texto: "",
      imagem: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
      alinhamento: "text-center",
      ai_generated: false
    };
    setMockSlides([...mockSlides, newSlide]);
    setCurrentSlide(mockSlides.length); // Vai par o slide recém criado
  };

  const handleRemoveSlide = (e: React.MouseEvent, indexToRemove: number) => {
    e.stopPropagation();
    if (mockSlides.length <= 1) return; // Proteção se tentar deletar o último
    const newSlides = mockSlides.filter((_, idx) => idx !== indexToRemove);
    setMockSlides(newSlides);
    if (currentSlide >= indexToRemove && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const processImageFile = async (file: File): Promise<string | null> => {
    try {
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
        return URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
      }
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("Erro ao converter HEIC:", error);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await processImageFile(file);
      if (url) {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setImageToCrop(url);
        setCropType('main');
        setCropModalOpen(true);
      }
      if (e.target) e.target.value = '';
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await processImageFile(file);
      if (url) {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        setImageToCrop(url);
        setCropType('avatar');
        setCropModalOpen(true);
      }
      if (e.target) e.target.value = '';
    }
  };

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string | null> => {
    const image = await loadCanvasImage(imageSrc);
    if (!image) return null;
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) resolve(null);
        else resolve(URL.createObjectURL(blob));
      }, 'image/jpeg');
    });
  };

  const handleSaveCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (croppedUrl) {
        if (cropType === 'avatar') {
          setTwitterAvatar(croppedUrl);
        } else if (cropType === 'main') {
          const newSlides = [...mockSlides];
          newSlides[currentSlide] = { ...newSlides[currentSlide], imagem: croppedUrl };
          setMockSlides(newSlides);
        }
        setCropModalOpen(false);
      }
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
            // Verifica se o resultado é uma string válida (não um objeto de erro)
            if (typeof imageUrl === 'string') {
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
      // 1. Tradução via Gemini
      const translatedQuery = await translateForSearch(searchQuery);
      console.log("Busca real:", searchQuery, "->", translatedQuery);

      // 2. Buscar no Pexels (API gratuita com fotos relevantes)
      const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
      
      if (pexelsKey) {
        const response = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(translatedQuery)}&per_page=8&orientation=portrait&size=medium`,
          { headers: { 'Authorization': pexelsKey } }
        );
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          setSearchResults(data.photos.map((p: any) => p.src.large));
        } else {
          // Fallback: buscar o termo original em pt-br
          const fallbackRes = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=8&orientation=portrait&size=medium`,
            { headers: { 'Authorization': pexelsKey } }
          );
          const fallbackData = await fallbackRes.json();
          setSearchResults((fallbackData.photos || []).map((p: any) => p.src.large));
        }
      } else {
        // Sem chave Pexels: usar Unsplash Source (menos preciso mas funcional)
        const finalPhotos: string[] = [];
        const cleanQuery = translatedQuery.replace(/[^a-zA-Z0-9 ]/g, '').trim();
        for (let i = 0; i < 8; i++) {
          finalPhotos.push(`https://source.unsplash.com/800x1000/?${encodeURIComponent(cleanQuery)}&sig=${Date.now() + i}`);
        }
        setSearchResults(finalPhotos);
      }
    } catch (error) {
      console.error("Erro na busca de fotos:", error);
      // Fallback mínimo
      const fallback: string[] = [];
      for (let i = 0; i < 6; i++) {
        fallback.push(`https://source.unsplash.com/800x1000/?${encodeURIComponent(searchQuery)}&sig=${Date.now() + i}`);
      }
      setSearchResults(fallback);
    } finally {
      setIsSearchingPhotos(false);
    }
  };

  const selectPhoto = (url: string) => {
    setImageToCrop(url);
    setCropType('main');
    setCropModalOpen(true);
  };

  // Comprimir imagem para base64 menor (fallback quando Storage falha)
  const compressImageToBase64 = (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 600; // resolução menor para não estourar o banco
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // JPEG comprimido
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  };

  // Upload de imagem para Supabase Storage (persistência)
  const uploadImageToStorage = async (imageUrl: string, postId: string, slideIndex: number | string): Promise<string> => {
    try {
      let blob: Blob;

      if (imageUrl.startsWith('data:')) {
        console.log(`[Upload] Slide ${slideIndex}: Convertendo base64 → blob`);
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith('blob:')) {
        console.log(`[Upload] Slide ${slideIndex}: Convertendo blob URL → blob`);
        const res = await fetch(imageUrl);
        blob = await res.blob();
      } else if (imageUrl.startsWith('http')) {
        console.log(`[Upload] Slide ${slideIndex}: URL externa, mantendo`);
        return imageUrl;
      } else {
        return imageUrl;
      }

      console.log(`[Upload] Slide ${slideIndex}: Blob criado, ${(blob.size / 1024).toFixed(0)}KB`);

      const fileName = `${user?.id}/${postId}/slide-${slideIndex}-${Date.now()}.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, blob, {
          contentType: blob.type || 'image/png',
          upsert: true,
        });

      if (uploadError) {
        console.warn(`[Upload] Slide ${slideIndex}: Storage falhou (${uploadError.message}), usando compressão local`);
        // FALLBACK: comprimir e salvar como base64 no JSON
        return await compressImageToBase64(imageUrl);
      }

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      console.log(`[Upload] Slide ${slideIndex}: ✅ Upload OK`);
      return urlData.publicUrl;
    } catch (err: any) {
      console.warn(`[Upload] Slide ${slideIndex}: Exceção (${err.message}), usando compressão`);
      // FALLBACK: comprimir e retornar como base64
      return await compressImageToBase64(imageUrl);
    }
  };

  const handleSavePost = async () => {
    // Validação obrigatória para formato Twitter
    if (globalStyle === 'twitter') {
      if (!twitterName.trim() || !twitterHandle.trim() || !twitterAvatar) {
        alert("Para o layout Twitter, preencha seu Nome, @arroba e envie uma Foto de Perfil antes de finalizar!");
        return;
      }
    }

    setIsSaving(true);
    try {
      let postId = incomingData?.postId;
      
      // Se não tem postId, criar o post primeiro para ter o ID
      if (!postId) {
        const { data: newPost, error: createError } = await supabase
          .from('posts')
          .insert([{ 
            title: incomingData?.topic || "Sem título",
            content: { slides: [], caption },
            user_id: user?.id,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        postId = newPost.id;
      }

      // Fazer upload de TODAS as imagens para Supabase Storage
      const slidesWithPersistentImages = await Promise.all(
        mockSlides.map(async (slide: any, idx: number) => {
          const persistentUrl = await uploadImageToStorage(slide.imagem, postId, idx);
          return { ...slide, imagem: persistentUrl };
        })
      );

      // Persistir Avatar do Twitter se existir (blob: ou data:)
      let persistentAvatar = twitterAvatar;
      if (globalStyle === 'twitter' && twitterAvatar && (twitterAvatar.startsWith('blob:') || twitterAvatar.startsWith('data:'))) {
        persistentAvatar = await uploadImageToStorage(twitterAvatar, postId, 'avatar');
      }

      // Atualizar o post com as URLs permanentes
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          content: { 
            slides: slidesWithPersistentImages, 
            caption,
            globalStyle,
            twitterName,
            twitterHandle,
            twitterAvatar: persistentAvatar,
            sources: incomingData?.sources || []
          },
          title: incomingData?.topic || "Sem título",
        })
        .eq('id', postId);
      
      if (updateError) throw updateError;

      // Atualizar slides locais com URLs permanentes
      setMockSlides(slidesWithPersistentImages);
      setIsFinished(true);
    } catch (err) {
      console.error("Save Error:", err);
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
          className="w-full max-w-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 md:p-12 text-center shadow-2xl"
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
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em]">SEUS ATIVOS GERADOS (4:5 Instagram):</h4>
              <button
                onClick={downloadAllSlides}
                disabled={isDownloadingAll}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {isDownloadingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PackageOpen className="w-4 h-4" />}
                {isDownloadingAll ? 'Baixando...' : `Baixar Todas (${mockSlides.length})`}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {mockSlides.map((slide, idx) => (
                <div key={idx} className="group relative aspect-[4/5] rounded-xl overflow-hidden border border-white/10">
                  <img src={slide.imagem} className="w-full h-full object-cover" alt={`Slide ${idx+1}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                    <p className="text-white text-[8px] font-bold line-clamp-2">{slide.titulo}</p>
                  </div>
                  <button 
                    onClick={() => downloadSlide(slide, idx)}
                    className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => setIsFinished(false)}
              className="py-5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 hover:border-white/20 text-sm"
            >
              Continuar Editando
            </button>
            <button 
              onClick={downloadAllSlides}
              disabled={isDownloadingAll}
              className="py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              {isDownloadingAll ? 'Baixando...' : 'Baixar Todas'}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 text-sm"
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
      <header className="flex flex-wrap items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md px-6 py-4 shrink-0 gap-4">
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
          <div className="relative w-full max-w-[400px] aspect-[4/5] bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-white/10 group">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 bg-cover bg-center ${globalStyle === 'twitter' ? 'bg-white' : ''}`}
                style={{ backgroundImage: globalStyle === 'twitter' ? 'none' : `url('${mockSlides[currentSlide].imagem}')` }}
              >
                {/* Overlay Escuro para os modos Classic e Centered */}
                {(globalStyle === 'classic' || globalStyle === 'centered') && (
                  <div className={`absolute inset-0 bg-gradient-to-t ${
                    globalStyle === 'centered' 
                      ? 'from-black/90 via-black/60 to-black/90' 
                      : 'from-black/90 via-black/40 to-black/10'
                  }`}></div>
                )}
                
                {/* Textos: MODO CLASSIC */}
                {globalStyle === 'classic' && (
                  <div className={`absolute inset-x-8 bottom-12 flex flex-col justify-end ${mockSlides[currentSlide].alinhamento || 'text-left'}`}>
                    <h3 
                      className={`text-3xl md:text-3xl font-extrabold leading-tight mb-3 ${currentFont}`}
                      style={{ color: titleColor }}
                    >
                      {mockSlides[currentSlide].titulo}
                    </h3>
                    <p 
                      className="text-sm md:text-sm leading-relaxed"
                      style={{ color: textColor }}
                    >
                      {mockSlides[currentSlide].texto}
                    </p>
                  </div>
                )}

                {/* Textos: MODO CENTERED */}
                {globalStyle === 'centered' && (
                  <div className={`absolute inset-x-8 inset-y-0 flex flex-col justify-center overflow-y-auto custom-scrollbar pb-8 pt-8 ${mockSlides[currentSlide].alinhamento || 'text-center'}`}>
                    <div className="my-auto flex flex-col">
                      <h3 
                        className={`text-2xl md:text-3xl font-extrabold leading-tight mb-4 drop-shadow-lg shrink-0 ${currentFont}`}
                        style={{ color: titleColor }}
                      >
                        {mockSlides[currentSlide].titulo}
                      </h3>
                      <p 
                        className="text-sm md:text-sm leading-relaxed bg-black/30 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shrink-0"
                        style={{ color: textColor }}
                      >
                        {mockSlides[currentSlide].texto}
                      </p>
                    </div>
                  </div>
                )}

                {/* Textos: MODO TWITTER */}
                {globalStyle === 'twitter' && (
                  <div className="absolute inset-0 flex flex-col p-6 bg-white overflow-hidden text-left">
                    {/* Header: Avatar, Name e Handle */}
                    <div className="flex items-center gap-3 mb-4 mt-6 z-10 w-full shrink-0">
                      {twitterAvatar ? (
                        <img src={twitterAvatar} alt="Avatar" className="w-12 h-12 rounded-full border border-gray-200 object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-gray-200 bg-gray-100 shrink-0 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-gray-300" />
                        </div>
                      )}
                      <div className="flex flex-col flex-1 truncate">
                        <span className="text-gray-900 font-bold text-base leading-tight truncate">{twitterName || 'Seu Nome'}</span>
                        <span className="text-gray-500 text-sm leading-tight truncate">{twitterHandle}</span>
                      </div>
                    </div>

                    {/* Texto Body */}
                    <div className={`z-10 flex flex-col mb-4 shrink-0 ${mockSlides[currentSlide].alinhamento || 'text-left'}`}>
                      {mockSlides[currentSlide].titulo && (
                        <h3 className={`text-[15px] text-gray-900 mb-1 leading-snug whitespace-pre-wrap ${currentFont}`}>
                          {mockSlides[currentSlide].titulo}
                        </h3>
                      )}
                      <p className={`text-[15px] text-gray-900 leading-snug whitespace-pre-wrap ${currentFont}`}>
                        {mockSlides[currentSlide].texto}
                      </p>
                    </div>

                    {/* Imagem */}
                    {mockSlides[currentSlide].imagem && (
                      <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 relative mb-2">
                        <img src={mockSlides[currentSlide].imagem} alt="Post asset" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
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
          <div className="flex gap-3 justify-center items-center mt-8 px-4 w-full overflow-x-auto custom-scrollbar pb-2 pt-2">
            {mockSlides.map((slide, idx) => (
              <div key={idx} className="relative group flex-none">
                <button 
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-16 h-16 rounded-lg bg-cover bg-center border-2 transition-all overflow-hidden relative ${
                    idx === currentSlide ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-white/10 opacity-50 hover:opacity-100'
                  }`}
                  style={{ backgroundImage: `url('${slide.imagem}')` }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{idx + 1}</span>
                  </div>
                </button>
                {mockSlides.length > 1 && (
                  <button
                    onClick={(e) => handleRemoveSlide(e, idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Remover slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            
            {/* Botão de Adicionar Lâmina Manualmente */}
            <button 
              onClick={handleAddSlide}
              className="flex-none w-16 h-16 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-slate-400 hover:text-white"
              title="Adicionar nova lâmina vazia"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Links de Referência */}
          {incomingData?.sources?.length > 0 && (
            <div className="mt-6 px-6 pb-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3 text-center">🔗 Links de Referência</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {incomingData.sources.map((src: any, i: number) => (
                  <a 
                    key={i} 
                    href={src.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/20 truncate max-w-[280px]"
                    title={src.url}
                  >
                    {src.title || `Referência ${i + 1}`}
                  </a>
                ))}
              </div>
            </div>
          )}
          
        </section>

        {/* Right: Painel Auxiliar (Textos e Assets Extras) */}
        <aside className="w-full lg:w-[400px] bg-slate-900 flex flex-col shrink-0 overflow-y-auto z-10 custom-scrollbar">

          {/* Editar Slide Atual (Canva / Pomelli Style) */}
          <div className="p-6 border-b border-white/10 bg-slate-900 sticky top-0 z-20">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Type className="w-4 h-4 text-blue-400" /> Editar Slide {currentSlide + 1}
            </h3>

            {/* Layouts Globais */}
            <div className="mb-6 p-4 bg-black/50 rounded-xl border border-white/5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 mb-2 block uppercase tracking-wider">Layout do Post</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setGlobalStyle('classic')} 
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${globalStyle === 'classic' ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    Clássico
                  </button>
                  <button 
                    onClick={() => setGlobalStyle('centered')} 
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${globalStyle === 'centered' ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    No Centro
                  </button>
                  <button 
                    onClick={() => setGlobalStyle('twitter')} 
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-all ${globalStyle === 'twitter' ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    Twitter
                  </button>
                </div>
              </div>

              {globalStyle === 'twitter' && (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-indigo-400 mb-1 block">Nome do Perfil</label>
                      <input 
                        type="text" 
                        value={twitterName} 
                        onChange={(e) => setTwitterName(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-indigo-400 mb-1 block">@arroba</label>
                      <input 
                        type="text" 
                        value={twitterHandle} 
                        onChange={(e) => setTwitterHandle(e.target.value)} 
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-indigo-400 mb-1 block">Foto do Perfil</label>
                    <label className="cursor-pointer flex items-center justify-center gap-2 bg-black/40 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs transition-all w-full">
                      <Camera className="w-3 h-3" />
                      <span className="truncate">{twitterAvatar ? 'Foto adicionada (clique p/ mudar)' : 'Fazer Upload...'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarSelect}
                      />
                    </label>

                    {/* Exibe fotos passadas se houver */}
                    {pastAvatars.length > 0 && (
                      <div className="mt-3">
                        <label className="text-[9px] text-slate-500 font-bold uppercase mb-1.5 block">Recentes</label>
                        <div className="flex gap-2">
                          {pastAvatars.map((url, i) => (
                            <button 
                              key={i} 
                              onClick={() => setTwitterAvatar(url)}
                              className="w-8 h-8 rounded-full border border-white/10 overflow-hidden hover:border-indigo-500 transition-all opacity-80 hover:opacity-100"
                            >
                              <img src={url} alt="Recent avatar" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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

                    <div className="grid grid-cols-4 gap-2">
                       <label className="cursor-pointer bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition-all border border-white/5 active:scale-95 text-center px-1">
                         <ImageIcon className="w-3.5 h-3.5" />
                         <span>Upload</span>
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           onChange={handleImageUpload}
                         />
                       </label>
                       
                       <button 
                         onClick={() => {
                           const newSlides = [...mockSlides];
                           newSlides[currentSlide] = { ...newSlides[currentSlide], imagem: '' };
                           setMockSlides(newSlides);
                         }}
                         className="bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition-all border border-white/5 active:scale-95 text-center px-1"
                       >
                         <Trash2 className="w-3.5 h-3.5 text-red-400" />
                         <span>Sem Foto</span>
                       </button>

                       <button 
                         onClick={() => {
                           const img = mockSlides[currentSlide].imagem;
                           if (!img || img.match(/photo-\d+\?/)) {
                             alert("Gere com IA, Envie uma Foto ou Busque na Web antes de ajustar.");
                           } else {
                             setImageToCrop(img);
                             setCropType('main');
                             setCropModalOpen(true);
                           }
                         }}
                         className="bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition-all border border-white/5 active:scale-95 text-center px-1"
                       >
                         <Camera className="w-3.5 h-3.5" />
                         <span>Enquadrar</span>
                       </button>
                       <button 
                        onClick={handleGenerateAllAIImages}
                        disabled={isGeneratingImage}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-xl font-bold text-[10px] flex flex-col items-center justify-center gap-1 transition-all border border-white/5 active:scale-95 text-center px-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Gerar Todas</span>
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

          <div className="px-6 pb-6 text-center">
             <p className="text-[10px] text-slate-500 font-medium mb-3">Acesse os links de referência para colocar mais informações na sua copy final.</p>
             {incomingData?.sources?.length > 0 && (
               <div className="flex flex-col gap-2 items-center text-left">
                 {incomingData.sources.map((src: any, i: number) => (
                   <a 
                     key={i} 
                     href={src.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-xs text-blue-400 hover:text-blue-300 transition-colors w-full bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2 rounded-lg border border-blue-500/20 truncate"
                     title={src.title || src.url}
                   >
                     {src.title || `Referência ${i + 1}`}
                   </a>
                 ))}
               </div>
             )}
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

      {/* MODAL DE CROPPER */}
      <AnimatePresence>
        {cropModalOpen && imageToCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-white font-bold text-sm">
                  {cropType === 'avatar' ? 'Ajustar Foto do Perfil' : 'Ajustar Imagem do Post'}
                </h3>
                <button onClick={() => setCropModalOpen(false)} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">&times;</button>
              </div>
              <div className="relative w-full h-80 bg-black flex flex-col md:flex-row overflow-hidden">
                <div className="flex-1 relative h-64 md:h-80">
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropType === 'avatar' ? 1 : 4/5}
                    cropShape={cropType === 'avatar' ? 'round' : 'rect'}
                    showGrid={cropType === 'main'}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
                  />
                </div>
                {/* Lateral com Controle de Zoom */}
                <div className="w-full md:w-20 bg-slate-900 border-t md:border-t-0 md:border-l border-white/10 flex flex-row md:flex-col items-center justify-center p-4 gap-4">
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest hidden md:block" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Zoom</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full md:h-32 accent-indigo-500 cursor-pointer"
                    style={{ WebkitAppearance: 'slider-vertical' } as React.CSSProperties}
                  />
                </div>
              </div>
              <div className="p-4 flex gap-3 border-t border-white/10 relative z-50">
                <button 
                  onClick={() => setCropModalOpen(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveCrop}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE DOWNLOAD MOBILE-FRIENDLY */}
      <AnimatePresence>
        {downloadModalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm flex flex-col shadow-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 text-center border-b border-white/10 shrink-0">
                <h3 className="text-xl font-bold text-white mb-2">Pronto para Salvar!</h3>
                <p className="text-sm text-slate-400">
                  {navigator.share 
                    ? "Clique abaixo para Compartilhar/Salvar ou pressione e segure nas imagens para ir para a Galeria."
                    : "Pressione e segure nas imagens abaixo para salvar na sua Galeria, ou clique em Baixar."}
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {downloadModalData.map((item, i) => (
                  <img key={i} src={item.url} alt={`Slide ${i+1}`} className="w-full rounded-lg border border-white/10 shadow-lg" />
                ))}
              </div>

              <div className="p-6 border-t border-white/10 space-y-3 shrink-0 bg-slate-950/50">
                <button 
                  onClick={async () => {
                    // Compartilhamento nativo iOS/Android sincronamente com o click!
                    if (navigator.share && navigator.canShare) {
                      try {
                        const files = downloadModalData.map(d => new File([d.blob], d.name, { type: 'image/png' }));
                        await navigator.share({ files, title: 'Meus Posts' });
                      } catch(e) { console.log('Share error or abort'); }
                    } else {
                      // Fallback clássico: envia as fotos 1 por 1
                      downloadModalData.forEach((d, i) => {
                        setTimeout(() => {
                          const a = document.createElement('a');
                          a.href = d.url;
                          a.download = d.name;
                          a.click();
                        }, i * 300);
                      });
                    }
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
                >
                  {navigator.share ? 'Salvar Tudo na Galeria' : 'Baixar Imagens'}
                </button>
                <button 
                  onClick={() => {
                    downloadModalData.forEach(d => URL.revokeObjectURL(d.url));
                    setDownloadModalData(null);
                  }}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
