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
          aspectRatio: "1:1"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro API Gemini:", errorData);
      return { error: errorData.error?.message || "Erro na geração do Google" };
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
