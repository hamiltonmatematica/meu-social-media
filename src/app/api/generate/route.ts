import { NextResponse } from "next/server";
import { generatePostContent } from "@/lib/ai/generator";
import { generateImages } from "@/lib/images/generator";
import { buildCarousel } from "@/lib/carousel/builder";
import { supabaseAdmin } from "@/lib/supabase";
import { schedulePost } from "@/lib/publisher/queue";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("1. Recebido input do usuário:", data);

    // 1 - Gera o conteúdo (LLM Mock para schema exato)
    const contentPayload = await generatePostContent(data);
    console.log("2. Conteúdo gerado:", contentPayload.post.titulo);

    // 2 - Gera as imagens (Replicate/DALL-E Mock)
    const imagesPayload = await generateImages(contentPayload);
    console.log("3. Imagens AI geradas.");

    // 3 - Monta o carrossel (Canvas/Sharp Mock)
    const carouselPayload = await buildCarousel(imagesPayload);
    console.log("4. Carrossel montado na Storage final.");

    // 4 - Salvamento real no Supabase (PROTEÇÃO MÁXIMA)
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert([
        {
          titulo: contentPayload.post.titulo,
          tipo: contentPayload.post.tipo,
          payload_ai: contentPayload.post,
          status: 'scheduled'
        }
      ])
      .select()
      .single();

    if (postError) throw new Error(`Falha ao salvar post no Supabase: ${postError.message}`);
    const post_id = post.id;

    // 5 - Agenda na Fila (Redis/Upstash e Agendamento no Supabase para proteção/histórico)
    const scheduledAt = new Date(Date.now() + 86400000).toISOString();
    
    const { error: scheduleError } = await supabaseAdmin
      .from('scheduled_posts')
      .insert([
        {
          post_id,
          plataformas: data.plataformas || ["instagram", "linkedin"],
          scheduled_at: scheduledAt,
          status: 'pending'
        }
      ]);

    if (scheduleError) throw new Error(`Falha ao agendar post no Supabase: ${scheduleError.message}`);

    await schedulePost({
      post_id,
      plataformas: data.plataformas || ["instagram", "linkedin"],
      agendamento: scheduledAt
    });
    console.log("5. Post agendado e salvo no banco.");

    return NextResponse.json({
      success: true,
      message: "Pipeline executado com sucesso e dados protegidos",
      data: {
        post_id,
        content: contentPayload,
        export: carouselPayload.export
      }
    });
  } catch (error: any) {
    console.error("Erro na pipeline:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
