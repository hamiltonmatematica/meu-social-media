// Mock da chamada ao LLM (OpenAI/Claude)
// Este arquivo simula a recepção dos dados do usuário e do motor de pesquisa,
// retornando exatamente o JSON Schema exigido pela arquitetura.

export async function generatePostContent(input: any) {
  // Simula latência de API LLM
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return {
    post: {
      titulo: "3 Erros Ocultos no " + (input.nicho || "Seu Mercado"),
      tipo: input.tipo_post || "carrossel",
      slides: [
        {
          ordem: 1,
          titulo: "Hook",
          texto: `A maioria fracassa em ${input.nicho || 'marketing'} porque ignora este detalhe.`
        },
        {
          ordem: 2,
          titulo: "Explicação 1",
          texto: "Erro 1: Não definir métricas claras de sucesso antes de começar a operação."
        },
        {
          ordem: 3,
          titulo: "Explicação 2",
          texto: "Erro 2: Depender exclusivamente de tráfego pago sem estrutura de conversão orgânica."
        },
        {
          ordem: 4,
          titulo: "Exemplo",
          texto: "Veja o caso da Startup X: ao ajustarem a retenção, cresceram 3x reduzindo CAC."
        },
        {
          ordem: 5,
          titulo: "CTA",
          texto: "Precisa de ajuda estruturando isso? Comente 'ESTRUTURA' que te envio o mapa no direct."
        }
      ],
      legenda: `Você piscou e mais uma ferramenta nova apareceu. Mas o fundamento de ${input.nicho || 'negócios'} continua o mesmo.\n\nPreste atenção nesses 3 erros. O último destruiu a margem térmica de milhares de CNPJs ano passado.\n\nSalva esse post para revisar antes do seu próximo quarter.`,
      hashtags: ["#estrategia", "#" + (input.nicho ? input.nicho.replace(/\s+/g,'') : "negocios"), "#crescimento"]
    }
  };
}
