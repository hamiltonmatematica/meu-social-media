// Fallback: Gera imagem via DALL-E 3 (OpenAI) quando Gemini estiver indisponível
async function generateWithDalle(prompt: string): Promise<string | null> {
  try {
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn("Chave OpenAI não configurada para fallback DALL-E.");
      return null;
    }

    console.log("⚡ Fallback: Gerando imagem via DALL-E 3...");

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Professional photography for business social media, clean and high resolution, stock photo style, high quality: ${prompt}`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro DALL-E:", errorData);
      return null;
    }

    const data = await response.json();
    if (data.data?.[0]?.url) {
      // Converte a URL do DALL-E em base64 para evitar CORS
      try {
        const imgResp = await fetch(data.data[0].url);
        const blob = await imgResp.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(data.data[0].url); // fallback pra URL direta
          reader.readAsDataURL(blob);
        });
      } catch {
        return data.data[0].url; // fallback pra URL direta se fetch falhar
      }
    }
    return null;
  } catch (error) {
    console.error("Erro fatal DALL-E:", error);
    return null;
  }
}

export async function generateSlideImage(prompt: string) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // Usando IMAGEN 4 FAST: $0.02 por imagem (Mais econômico e excelente qualidade)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`;

    console.log("Gerando imagem (Imagen 4 Fast - pago) para:", prompt);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: `Professional photography for business social media, clean and high resolution, stock photo style, high quality: ${prompt}`
          }
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "3:4"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMsg = errorData.error?.message || "";
      console.error("Erro API Gemini:", errorMsg);

      // Se for erro de cota/limite, tenta DALL-E automaticamente
      if (errorMsg.includes("quota") || errorMsg.includes("Quota") || errorMsg.includes("429") || errorMsg.includes("exceeded")) {
        console.log("🔄 Cota Gemini excedida. Ativando fallback DALL-E...");
        const dalleResult = await generateWithDalle(prompt);
        if (dalleResult) return dalleResult;
      }

      return { error: `Erro do Google: ${errorMsg}` };
    }

    const data = await response.json();
    
    if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const mimeType = data.predictions[0].mimeType || 'image/png';
      return `data:${mimeType};base64,${base64Image}`;
    }

    return null;
  } catch (error) {
    console.error("Erro fatal Gemini Imagen:", error);
    // Fallback final: tenta DALL-E em caso de erro de rede etc.
    const dalleResult = await generateWithDalle(prompt);
    if (dalleResult) return dalleResult;
    return null;
  }
}

// Função auxiliar para tradução via Gemini (aproveitando sua chave)
export async function translateForSearch(text: string) {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate this search term to a very precise English stock photo search query. Return ONLY the translated string, no quotes, no explanation: "${text}"`
          }]
        }]
      })
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (e) {
    return text; // Fallback para o texto original
  }
}
