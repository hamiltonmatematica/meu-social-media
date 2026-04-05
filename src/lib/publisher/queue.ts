export async function schedulePost({ post_id, plataformas, agendamento }: any) {
  // Simula o registro em uma fila de tarefas Upstash Redis
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`[Queue] Post ${post_id} agendado para ${agendamento} nas plataformas: ${plataformas.join(', ')}`);
  
  return {
    job_id: "job-" + Date.now(),
    status: "scheduled"
  };
}
