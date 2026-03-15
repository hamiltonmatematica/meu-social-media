import { OpenAI } from "openai";

// Configuração da OpenAI para Copywriting Estratégico
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true 
});

export async function researchTopic(topic: string, numSlides: number = 5, tone: string = 'informativo', density: string = 'objetivo') {
  try {
    // PASSO 1: Pesquisa Técnica na Web (Perplexity)
    const searchResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: "Você é um pesquisador técnico. SEMPRE responda em português brasileiro (pt-BR). Traga um relatório com fatos, notícias recentes e dados estatísticos sobre o tema solicitado. Seja direto e informativo.",
          },
          {
            role: "user",
            content: `Pesquise os dados mais recentes e relevantes sobre "${topic}". Traga fontes e insights de mercado.`,
          },
        ],
      }),
    });

    if (!searchResponse.ok) throw new Error("Erro na Perplexity API");
    const searchData = await searchResponse.json();
    const technicalReport = searchData.choices[0].message.content;
    const citations = searchData.citations || [];

    // PASSO 2: Copywriting e Estruturação (OpenAI GPT-4o) - Inteligência Criativa
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é um Copywriter Sênior especializado em Viralização e Retenção para Instagram e Facebook. REGRA OBRIGATÓRIA: TODOS os textos devem ser escritos em PORTUGUÊS BRASILEIRO (pt-BR). NUNCA escreva em inglês ou outro idioma.
Sua tarefa é receber um relatório técnico e transformá-lo em um post de altíssimo impacto (formato carrossel).

REGRAS CRÍTICAS DE ESCRITA:
1. O tom de voz deve ser: ${tone === 'pessoal' ? 'PESSOAL (Fale em 1ª pessoa, como um expert compartilhando sua vivência/opinião direta)' : tone === 'agressivo' ? 'AGRESSIVO / VIRTUAL SALES (Foco total em dor, urgência e autoridade inquestionável)' : 'INFORMATIVO / TÉCNICO (Foco em dados, análise e clareza profunda)'}.
2. A densidade do texto deve ser: ${density === 'denso' ? 'DENSA (Escreva textos mais explicativos, profundos e detalhados em cada slide, aproveitando bem o espaço para educar o público)' : 'OBJETIVA (Textos curtos, diretos ao ponto, com poucas palavras e máximo impacto visual)'}.
3. NUNCA use termos de "comunicação interna" como "Slide 1: Introdução".
4. NUNCA inclua referências numéricas ou citações no estilo [1], [2], [n] em nenhum campo do JSON. O texto deve ser limpo e pronto para postagem.
5. Cada campo deve conter a COPY EXATA que será escrita na imagem. 
6. Use gatilhos mentais (curiosidade, medo de perder, autoridade, benefício).

Responda ESTRITAMENTE em formato JSON.

Esquema JSON:
{
  "synthesis": "Densa análise do expert, convencendo o seguidor da importância do tema. Use dicas de engajamento.",
  "slides": [
    { 
      "ordem": 1, 
      "titulo": "Headline", 
      "texto": "Copy do slide",
      "image_prompt": "Descrição detalhada para DALL-E."
    }
  ],
  "legenda": "Legenda completa formatada."
}`,
        },
        {
          role: "user",
          content: `Relatório Técnico: "${technicalReport}"\n\nObjetivo: Criar um carrossel de ${numSlides} lâminas sobre "${topic}" com o tom de voz ${tone} e densidade ${density}.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const parsedData = JSON.parse(completion.choices[0].message.content || "{}");

    const originalSources = citations.map((url: string, index: number) => ({
      title: `Referência ${index + 1}`,
      url: url,
      content: url 
    }));

    return {
      success: true,
      originalSources: originalSources.length > 0 ? originalSources : [{title: "Perplexity AI", content: "Compilação inteligente dos dados de mercado.", url: "#"}],
      synthesis: parsedData.synthesis,
      generatedData: {
        tipo_post: "carrossel",
        slides: parsedData.slides,
        legenda_instagram_facebook: parsedData.legenda
      }
    };
  } catch (error) {
    console.error("Erro no motor de pesquisa:", error);
    return { success: false, error: "Falha ao pesquisar tema atual na web." };
  }
}

export async function getTrends(topic: string) {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `Você é um analista de tendências de redes sociais. SEMPRE responda em português brasileiro (pt-BR). 
Pesquise as 3 notícias ou tendências MAIS RECENTES e VIRAIS sobre o tópico "${topic}".
Responda EXCLUSIVAMENTE em formato JSON (um array de objetos).

Esquema JSON:
[
  {
    "id": 1,
    "titulo": "Título da notícia",
    "fonte": "Canal Original",
    "tempo": "Há X horas",
    "resumo": "Texto curto explicativo."
  }
]`,
          },
          {
            role: "user",
            content: `O que está acontecendo agora de mais relevante sobre "${topic}"?`,
          },
        ],
      }),
    });

    if (!response.ok) return [];
    
    const data = await response.json();
    const raw = data.choices[0].message.content;
    
    // Limpar citações [1], [2], etc antes de parsear
    const cleanedRaw = raw.replace(/\[\d+\]/g, "");
    
    const jsonMatch = cleanedRaw.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanedRaw);
  } catch (error) {
    console.error("Erro getTrends:", error);
    return [];
  }
}
