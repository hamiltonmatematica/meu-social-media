export async function buildCarousel(imagesPayload: any) {
  // Simula latência de montagem Canvas / Sharp
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const slides = imagesPayload.post.slides;
  
  // Retorna os nomes virtuais dos arquivos exportados
  const exportFiles = slides.map((slide: any) => `slide${slide.ordem}.png`);

  return {
    post: imagesPayload.post,
    export: exportFiles,
    mensagem: "Carrossel renderizado com sucesso (Canvas pipeline mock)."
  };
}
