import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight text-center">
          ContentPlatform<span className="text-purple-500">Core</span>
        </h1>
        <p className="text-xl text-slate-400 text-center max-w-2xl">
          Arquitetura Full-Stack Next.js (DALL-E, Canvas Builder, Redis Queue).
        </p>
        <Link 
          href="/create-post" 
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(138,43,226,0.5)]"
        >
          Acessar Motor IA Gráfico →
        </Link>
      </div>
    </main>
  );
}
