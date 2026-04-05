export async function generateImages(contentPayload: any) {
  // Simula latência de API Replicate ou OpenAI Images
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const slides = contentPayload.post.slides;
  
  // Mapeia cada slide para adicionar uma URL mock de imagem gerada
  const slidesComImagem = slides.map((slide: any) => ({
    ...slide,
    imagem_url: `https://via.placeholder.com/1080x1080.png?text=Slide+${slide.ordem}+-+${encodeURIComponent(slide.titulo)}`,
    prompt_utilizado: `Create an aesthetic modern background for a business context about ${slide.titulo}`
  }));

  return {
    ...contentPayload,
    post: {
      ...contentPayload.post,
      slides: slidesComImagem
    }
  };
}
